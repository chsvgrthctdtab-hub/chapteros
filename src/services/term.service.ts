import { termRepository } from '@/repositories/term.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import {
  evaluateTermClosingChecklist,
  buildTermClosingSnapshot,
  validateTermMemberMutation,
  isTermLocked,
} from '@/features/terms/utils/term-workflow';
import type { Term, TermMember, Member } from '@/types';
import type { Database } from '@/types/database.types';
import type {
  TermClosingChecklistResult,
  TermClosingSnapshot,
  CloseTermParams,
  HandoverParams,
} from '@/features/terms/types/term.types';

type DbTermInsert = Database['public']['Tables']['terms']['Insert'];
type DbTermUpdate = Database['public']['Tables']['terms']['Update'];
type DbTermMemberInsert = Database['public']['Tables']['term_members']['Insert'];
type DbTermMemberUpdate = Database['public']['Tables']['term_members']['Update'];

export const termService = {
  async getTermsByOrganization(organizationId: string): Promise<Term[]> {
    return termRepository.getByOrganization(organizationId);
  },

  async getCurrentTerm(organizationId: string): Promise<Term | null> {
    return termRepository.getCurrent(organizationId);
  },

  async getTermById(id: string): Promise<Term | null> {
    return termRepository.getById(id);
  },

  async createTerm(payload: DbTermInsert, actorUserId?: string): Promise<Term> {
    const term = await termRepository.create(payload);

    if (actorUserId) {
      try {
        await auditLogRepository.log({
          organization_id: term.organizationId,
          user_id: actorUserId,
          action: 'term.create',
          entity_type: 'term',
          entity_id: term.id,
          metadata: { name: term.name, startDate: term.startDate, endDate: term.endDate },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during term create:', logErr);
      }
    }

    return term;
  },

  async updateTerm(id: string, payload: DbTermUpdate, actorUserId?: string): Promise<Term> {
    const existing = await termRepository.getById(id);
    if (existing && isTermLocked(existing)) {
      throw new Error('Nhiệm kỳ đã kết thúc hoặc lưu trữ. Không thể chỉnh sửa thông tin.');
    }

    const term = await termRepository.update(id, payload);

    if (actorUserId) {
      try {
        await auditLogRepository.log({
          organization_id: term.organizationId,
          user_id: actorUserId,
          action: 'term.update',
          entity_type: 'term',
          entity_id: term.id,
          metadata: { updatedFields: Object.keys(payload) },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during term update:', logErr);
      }
    }

    return term;
  },

  async activateTerm(termId: string, organizationId: string, actorUserId?: string): Promise<Term> {
    const term = await termRepository.activate(termId, organizationId);

    if (actorUserId) {
      try {
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'term.activate',
          entity_type: 'term',
          entity_id: term.id,
          metadata: { name: term.name },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during term activate:', logErr);
      }
    }

    return term;
  },

  /**
   * Evaluates the term closing checklist by aggregating activities, tasks, finance, and attendance
   */
  async getTermClosingChecklist(
    termId: string,
    organizationId: string
  ): Promise<TermClosingChecklistResult> {
    const data = await termRepository.getTermChecklistData(termId, organizationId);
    return evaluateTermClosingChecklist(data);
  },

  /**
   * Close a term with automated checklist check, immutable snapshot creation, and audit logging
   */
  async closeTerm(params: CloseTermParams, actorUserName?: string): Promise<{ term: Term; snapshot: TermClosingSnapshot }> {
    const { termId, organizationId, actorUserId, isOverridden, overrideReason, handoverNotes } = params;

    // 1. Fetch raw data & evaluate checklist
    const data = await termRepository.getTermChecklistData(termId, organizationId);
    const checklist = evaluateTermClosingChecklist(data);

    // 2. Validate blocking issues & override
    if (!checklist.ready && !isOverridden) {
      const issueTitles = checklist.blockingIssues.map((i) => i.title).join('; ');
      throw new Error(`Không thể đóng nhiệm kỳ vì còn tồn đọng: ${issueTitles}`);
    }

    if (isOverridden && (!overrideReason || overrideReason.trim().length < 5)) {
      throw new Error('Vui lòng nhập lý do hợp lệ khi xác nhận bỏ qua cảnh báo để đóng nhiệm kỳ.');
    }

    // 3. Build snapshot
    const snapshot = buildTermClosingSnapshot({
      term: data.term,
      stats: checklist.stats,
      members: data.members,
      activities: data.activities,
      actorUserId,
      actorUserName,
      isOverridden: Boolean(isOverridden),
      overrideReason,
      handoverNotes,
    });

    // 4. Save to database
    const closedTerm = await termRepository.complete(
      termId,
      organizationId,
      snapshot as unknown as Record<string, unknown>,
      {
        actorUserId,
        handoverNotes,
      }
    );

    // 5. Audit Logging
    if (actorUserId) {
      try {
        // Log snapshot creation
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'term.snapshot_created',
          entity_type: 'term',
          entity_id: termId,
          metadata: {
            termName: data.term.name,
            totalMembers: checklist.stats.members.total,
            totalActivities: checklist.stats.activities.total,
            balance: checklist.stats.finance.balance,
          },
        });

        // Log term closing
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: isOverridden ? 'term.handover_override' : 'term.close',
          entity_type: 'term',
          entity_id: termId,
          metadata: {
            name: data.term.name,
            isOverridden: Boolean(isOverridden),
            overrideReason,
            handoverNotes,
            blockingIssuesCount: checklist.blockingIssues.length,
          },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during term close:', logErr);
      }
    }

    return { term: closedTerm, snapshot };
  },

  /**
   * Backward-compatible simple complete method
   */
  async completeTerm(termId: string, organizationId: string, actorUserId?: string): Promise<Term> {
    const result = await this.closeTerm({ termId, organizationId, actorUserId });
    return result.term;
  },

  /**
   * Archive a term
   */
  async archiveTerm(termId: string, organizationId: string, actorUserId?: string): Promise<Term> {
    const term = await termRepository.archive(termId, organizationId);

    if (actorUserId) {
      try {
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'term.archive',
          entity_type: 'term',
          entity_id: term.id,
          metadata: { name: term.name },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during term archive:', logErr);
      }
    }

    return term;
  },

  async getTermMembers(termId: string): Promise<TermMember[]> {
    return termRepository.getTermMembers(termId);
  },

  async getAvailableMembersForTerm(termId: string, organizationId: string): Promise<Member[]> {
    return termRepository.getAvailableMembersForTerm(termId, organizationId);
  },

  async addMemberToTerm(payload: DbTermMemberInsert, actorUserId?: string, orgId?: string): Promise<TermMember> {
    // Check term lock
    if (payload.term_id) {
      const term = await termRepository.getById(payload.term_id);
      validateTermMemberMutation(term?.status, 'thêm hội viên');
    }

    const termMember = await termRepository.addMemberToTerm(payload);

    if (actorUserId && orgId) {
      try {
        await auditLogRepository.log({
          organization_id: orgId,
          user_id: actorUserId,
          action: 'term_member.create',
          entity_type: 'term_member',
          entity_id: termMember.id,
          metadata: { termId: payload.term_id, memberId: payload.member_id, position: payload.position },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during term member add:', logErr);
      }
    }

    return termMember;
  },

  async updateTermMember(id: string, payload: DbTermMemberUpdate, actorUserId?: string, orgId?: string): Promise<TermMember> {
    const termMember = await termRepository.updateTermMember(id, payload);

    if (actorUserId && orgId) {
      try {
        await auditLogRepository.log({
          organization_id: orgId,
          user_id: actorUserId,
          action: 'term_member.update',
          entity_type: 'term_member',
          entity_id: termMember.id,
          metadata: { updatedFields: Object.keys(payload) },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during term member update:', logErr);
      }
    }

    return termMember;
  },

  async removeMemberFromTerm(id: string, actorUserId?: string, orgId?: string, termId?: string): Promise<void> {
    if (termId) {
      const term = await termRepository.getById(termId);
      validateTermMemberMutation(term?.status, 'gỡ hội viên');
    }

    await termRepository.removeMemberFromTerm(id);

    if (actorUserId && orgId) {
      try {
        await auditLogRepository.log({
          organization_id: orgId,
          user_id: actorUserId,
          action: 'term_member.delete',
          entity_type: 'term_member',
          entity_id: id,
          metadata: { termId },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during term member remove:', logErr);
      }
    }
  },

  async transferMembers(
    payload: { sourceTermId: string; targetTermId: string; memberIds: string[] },
    actorUserId?: string,
    organizationId?: string,
    handoverNotes?: string
  ): Promise<{ transferredCount: number; skippedCount: number; totalSelected: number }> {
    const result = await termRepository.transferMembers(
      payload.sourceTermId,
      payload.targetTermId,
      payload.memberIds,
      organizationId
    );

    if (actorUserId && organizationId) {
      try {
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'term.handover',
          entity_type: 'term',
          entity_id: payload.targetTermId,
          metadata: {
            sourceTermId: payload.sourceTermId,
            targetTermId: payload.targetTermId,
            transferredCount: result.transferredCount,
            skippedCount: result.skippedCount,
            totalSelected: result.totalSelected,
            handoverNotes,
          },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during term member transfer:', logErr);
      }
    }

    return result;
  },
};
