import { memberRepository, type MembersListResult, type DbMemberInsert, type DbMemberUpdate, type DbTermMemberInsert, type DbTermMemberUpdate } from '@/repositories/member.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import type { Member, TermMember, Term, MemberStatus } from '@/types';
import type { MemberFilterParams, MemberTermHistoryItem } from '@/features/members/types/member.types';

export interface CreateMemberOptions {
  assignToTermId?: string | null;
  termPosition?: string | null;
  termDepartment?: string | null;
  actorUserId?: string;
}

export const memberService = {
  /**
   * List members in organization with filtering & search
   */
  async listMembers(organizationId: string, params: MemberFilterParams = {}): Promise<MembersListResult> {
    if (!organizationId) {
      return { data: [], totalCount: 0, page: 1, pageSize: 15, totalPages: 0 };
    }
    return memberRepository.list(organizationId, params);
  },

  /**
   * Get member by ID
   */
  async getMemberById(id: string, organizationId?: string): Promise<Member | null> {
    if (!id) return null;
    return memberRepository.getById(id, organizationId);
  },

  /**
   * Fetch member term assignment history
   */
  async getMemberTermHistory(memberId: string): Promise<MemberTermHistoryItem[]> {
    if (!memberId) return [];
    return memberRepository.getTermHistory(memberId);
  },

  /**
   * Create a new member with validation, duplicate MSSV check, initial term assignment, and audit log
   */
  async createMember(
    organizationId: string,
    payload: Omit<DbMemberInsert, 'organization_id'>,
    options?: CreateMemberOptions
  ): Promise<Member> {
    if (!organizationId) {
      throw new Error('Chưa chọn Chi hội làm việc');
    }

    const cleanStudentId = payload.student_id ? payload.student_id.trim().toUpperCase() : null;
    const cleanFullName = payload.full_name?.trim();
    if (!cleanFullName) {
      throw new Error('Họ và tên không được để trống');
    }

    // 1. Check duplicate MSSV within the organization if student_id is provided
    if (cleanStudentId) {
      const existing = await memberRepository.findByStudentId(organizationId, cleanStudentId);
      if (existing) {
        throw new Error(`Mã số sinh viên "${cleanStudentId}" đã tồn tại trong Chi hội (${existing.fullName}).`);
      }
    }

    // 2. Insert member
    const insertPayload: DbMemberInsert = {
      ...payload,
      organization_id: organizationId,
      student_id: cleanStudentId,
      full_name: cleanFullName,
      email: payload.email?.trim() || null,
      phone: payload.phone?.trim() || null,
      class_name: payload.class_name?.trim() || null,
      major: payload.major?.trim() || null,
      cohort: payload.cohort?.trim() || null,
      position: payload.position?.trim() || 'Hội viên',
      status: payload.status || 'active',
      joined_date: payload.joined_date || new Date().toISOString().split('T')[0],
      notes: payload.notes?.trim() || null,
    };

    const createdMember = await memberRepository.create(insertPayload);

    // 3. Optional initial term assignment
    if (options?.assignToTermId) {
      try {
        await memberRepository.assignToTerm({
          term_id: options.assignToTermId,
          member_id: createdMember.id,
          position: options.termPosition?.trim() || createdMember.position || 'Hội viên',
          department: options.termDepartment?.trim() || null,
          status: 'active',
          joined_date: createdMember.joinedDate || new Date().toISOString().split('T')[0],
        });
      } catch (termErr) {
        console.warn('Initial term assignment warning:', termErr);
      }
    }

    // 4. Audit Log
    if (options?.actorUserId) {
      await auditLogRepository.log({
        organization_id: organizationId,
        user_id: options.actorUserId,
        action: 'member.create',
        entity_type: 'member',
        entity_id: createdMember.id,
        metadata: {
          fullName: createdMember.fullName,
          studentId: createdMember.studentId,
          position: createdMember.position,
        },
      });
    }

    return createdMember;
  },

  /**
   * Update member details with validation and audit log
   */
  async updateMember(
    id: string,
    organizationId: string,
    payload: DbMemberUpdate,
    actorUserId?: string
  ): Promise<Member> {
    if (!id) throw new Error('Thiếu ID hội viên cần cập nhật');

    // If updating student_id, check uniqueness within organization
    if (payload.student_id) {
      const cleanStudentId = payload.student_id.trim().toUpperCase();
      const existing = await memberRepository.findByStudentId(organizationId, cleanStudentId);
      if (existing && existing.id !== id) {
        throw new Error(`Mã số sinh viên "${cleanStudentId}" đã được sử dụng bởi hội viên khác (${existing.fullName}).`);
      }
      payload.student_id = cleanStudentId;
    }

    if (payload.full_name !== undefined) {
      payload.full_name = payload.full_name.trim();
    }

    const updated = await memberRepository.update(id, payload);

    if (actorUserId) {
      await auditLogRepository.log({
        organization_id: organizationId,
        user_id: actorUserId,
        action: 'member.update',
        entity_type: 'member',
        entity_id: id,
        metadata: {
          updatedFields: Object.keys(payload),
          fullName: updated.fullName,
          studentId: updated.studentId,
        },
      });
    }

    return updated;
  },

  /**
   * Update member status (e.g. deactivate / reactivate / alumni)
   */
  async setMemberStatus(
    id: string,
    organizationId: string,
    status: MemberStatus,
    actorUserId?: string
  ): Promise<Member> {
    const updated = await memberRepository.updateStatus(id, status);

    if (actorUserId) {
      await auditLogRepository.log({
        organization_id: organizationId,
        user_id: actorUserId,
        action: 'member.status_change',
        entity_type: 'member',
        entity_id: id,
        metadata: { newStatus: status, fullName: updated.fullName },
      });
    }

    return updated;
  },

  /**
   * Delete member with audit logging
   */
  async deleteMember(
    id: string,
    organizationId: string,
    actorUserId?: string
  ): Promise<void> {
    const member = await memberRepository.getById(id, organizationId);
    await memberRepository.delete(id);

    if (actorUserId) {
      await auditLogRepository.log({
        organization_id: organizationId,
        user_id: actorUserId,
        action: 'member.delete',
        entity_type: 'member',
        entity_id: id,
        metadata: {
          fullName: member?.fullName || '',
          studentId: member?.studentId || '',
        },
      });
    }
  },

  /**
   * Assign member to a term
   */
  async assignMemberToTerm(
    organizationId: string,
    payload: DbTermMemberInsert,
    actorUserId?: string
  ) {
    const result = await memberRepository.assignToTerm(payload);

    if (actorUserId) {
      await auditLogRepository.log({
        organization_id: organizationId,
        user_id: actorUserId,
        action: 'member.term_assign',
        entity_type: 'term_member',
        entity_id: result.id,
        metadata: {
          memberId: payload.member_id,
          termId: payload.term_id,
          position: payload.position,
        },
      });
    }

    return result;
  },

  /**
   * Update term member assignment
   */
  async updateTermMember(
    organizationId: string,
    id: string,
    payload: DbTermMemberUpdate,
    actorUserId?: string
  ) {
    const result = await memberRepository.updateTermMember(id, payload);

    if (actorUserId) {
      await auditLogRepository.log({
        organization_id: organizationId,
        user_id: actorUserId,
        action: 'member.term_update',
        entity_type: 'term_member',
        entity_id: id,
        metadata: {
          updatedFields: Object.keys(payload),
        },
      });
    }

    return result;
  },

  /**
   * Remove member from a term
   */
  async removeTermMember(
    organizationId: string,
    id: string,
    memberId: string,
    actorUserId?: string
  ): Promise<void> {
    await memberRepository.removeTermMember(id);

    if (actorUserId) {
      await auditLogRepository.log({
        organization_id: organizationId,
        user_id: actorUserId,
        action: 'member.term_remove',
        entity_type: 'term_member',
        entity_id: id,
        metadata: { memberId },
      });
    }
  },

  /**
   * Get terms for organization
   */
  async getOrgTerms(organizationId: string): Promise<Term[]> {
    if (!organizationId) return [];
    return memberRepository.getTerms(organizationId);
  },
};
