import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  activityRepository,
  type ActivitiesListResponse,
  type ActivityParticipantsResponse,
  type DbActivityInsert,
  type DbActivityUpdate,
  type DbParticipantInsert,
  type DbParticipantUpdate,
} from '@/repositories/activity.repository';
import { termRepository } from '@/repositories/term.repository';
import { memberRepository } from '@/repositories/member.repository';
import { organizationRepository } from '@/repositories/organization.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { canManageAttendance, canManageActivities } from '@/types/roles';
import type {
  Activity,
  ActivityParticipant,
  ActivityStatus,
  RegistrationStatus,
  AttendanceStatus,
  Member,
  Term,
} from '@/types';
import type {
  ActivityFilterParams,
  ParticipantFilterParams,
  ActivityDetail,
} from '@/features/activities/types/activity.types';
import {
  validateActivityStatusTransition,
  validateActivityFieldUpdate,
  validateAttendanceMutation,
  validateParticipantRosterMutation,
  isActivityLocked,
  ACTIVITY_STATUS_VIETNAMESE_LABELS,
} from '@/features/activities/utils/activity-workflow';
import { validateTermMutation } from '@/features/terms/utils/term-workflow';
import type {
  ActivityFormData,
  AddParticipantFormData,
  UpdateParticipantFormData,
} from '@/features/activities/schemas/activity.schema';

const VALID_CATEGORIES = [
  'general',
  'volunteer',
  'academic',
  'sports',
  'culture',
  'meeting',
  'training',
];

const VALID_STATUSES = [
  'draft',
  'planning',
  'published',
  'in_progress',
  'completed',
  'cancelled',
];

export const activityService = {
  /**
   * List activities in organization with server-side filter, search, sort, and pagination
   */
  async listActivities(
    organizationId: string,
    params: ActivityFilterParams = {}
  ): Promise<ActivitiesListResponse> {
    if (!organizationId) {
      return { data: [], totalCount: 0, page: 1, pageSize: 12, totalPages: 0 };
    }
    return activityRepository.listActivities(organizationId, params);
  },

  /**
   * Get single activity detail
   */
  async getActivityDetail(id: string, organizationId?: string): Promise<ActivityDetail | null> {
    if (!id) return null;
    return activityRepository.getById(id, organizationId);
  },

  /**
   * Create an activity with business rules, multi-tenant term validation, code uniqueness, and audit log
   */
  async createActivity(
    organizationId: string,
    formData: ActivityFormData,
    actorUserId?: string
  ): Promise<Activity> {
    if (!organizationId) {
      throw new Error('Chưa chọn Đơn vị làm việc');
    }

    const cleanTitle = formData.title?.trim();
    if (!cleanTitle || cleanTitle.length < 3) {
      throw new Error('Tên hoạt động phải có độ dài tối thiểu 3 ký tự');
    }

    if (!VALID_CATEGORIES.includes(formData.category)) {
      throw new Error(`Danh mục hoạt động không hợp lệ: ${formData.category}`);
    }

    if (!VALID_STATUSES.includes(formData.status)) {
      throw new Error(`Trạng thái hoạt động không hợp lệ: ${formData.status}`);
    }

    if (!formData.startDate || !formData.endDate) {
      throw new Error('Thời gian bắt đầu và kết thúc không được để trống');
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (endDate < startDate) {
      throw new Error('Thời gian kết thúc không thể trước thời gian bắt đầu');
    }

    if (formData.targetMembers !== undefined && formData.targetMembers < 0) {
      throw new Error('Số lượng hội viên mục tiêu phải lớn hơn hoặc bằng 0');
    }

    // 1. Multi-Tenant Verification & Term Lock: Term belongs to this organization and is not closed
    if (!formData.termId) {
      throw new Error('Vui lòng chọn nhiệm kỳ cho hoạt động');
    }
    const term = await termRepository.getById(formData.termId);
    if (!term || term.organizationId !== organizationId) {
      throw new Error('Nhiệm kỳ đã chọn không tồn tại hoặc không thuộc Đơn vị hiện tại');
    }
    validateTermMutation(term.status, 'tạo hoạt động trong nhiệm kỳ đã khóa');

    // 2. Multi-Tenant Verification: Lead Member belongs to this organization if provided
    let cleanLeadMemberId: string | null = null;
    if (formData.leadMemberId && formData.leadMemberId.trim() && formData.leadMemberId !== 'none') {
      cleanLeadMemberId = await activityService.resolveLeadMemberId(organizationId, formData.leadMemberId.trim());
    }

    // 3. Unique Code Verification within organization
    const cleanCode = formData.code?.trim() || null;
    if (cleanCode) {
      const existingWithCode = await activityRepository.findByCode(organizationId, cleanCode);
      if (existingWithCode) {
        throw new Error(`Mã hoạt động "${cleanCode}" đã được sử dụng trong Đơn vị. Vui lòng chọn mã khác.`);
      }
    }

    const payload: DbActivityInsert = {
      organization_id: organizationId,
      term_id: formData.termId,
      code: cleanCode,
      title: cleanTitle,
      description: formData.description?.trim() || null,
      category: formData.category,
      status: formData.status,
      location: formData.location?.trim() || null,
      start_date: formData.startDate,
      end_date: formData.endDate,
      target_members: formData.targetMembers || 0,
      banner_url: formData.bannerUrl?.trim() || null,
      lead_member_id: cleanLeadMemberId,
      created_by: actorUserId || null,
    };

    const activity = await activityRepository.create(payload);

    // Audit Logging
    if (actorUserId) {
      try {
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'activity.create',
          entity_type: 'activity',
          entity_id: activity.id,
          metadata: {
            title: activity.title,
            code: activity.code,
            category: activity.category,
            status: activity.status,
            startDate: activity.startDate,
            endDate: activity.endDate,
            leadMemberId: cleanLeadMemberId,
          },
        });
      } catch (logErr) {
        console.warn('Could not record activity.create audit log:', logErr);
      }
    }

    return activity;
  },

  /**
   * Update an existing activity with multi-tenant verification, state machine validation, and audit logging
   */
  async updateActivity(
    id: string,
    organizationId: string,
    formData: Partial<ActivityFormData>,
    actorUserId?: string
  ): Promise<Activity> {
    if (!id) {
      throw new Error('Thiếu ID hoạt động cần cập nhật');
    }
    if (!organizationId) {
      throw new Error('Chưa chọn Đơn vị làm việc');
    }

    // 1. Verify existence & tenant ownership
    const existing = await activityRepository.getById(id, organizationId);
    if (!existing) {
      throw new Error('Hoạt động không tồn tại hoặc bạn không có quyền chỉnh sửa');
    }

    // Validate term lock on existing activity
    if (existing.termId) {
      const currentTerm = await termRepository.getById(existing.termId);
      validateTermMutation(currentTerm?.status, 'chỉnh sửa hoạt động thuộc nhiệm kỳ đã khóa');
    }

    // 2. Validate field update lock for terminal/completed/cancelled states
    validateActivityFieldUpdate(existing, formData);

    // 3. Validate status transition if status is being updated
    if (formData.status !== undefined && formData.status !== existing.status) {
      validateActivityStatusTransition(existing.status, formData.status);
    }

    const payload: DbActivityUpdate = {};

    if (formData.title !== undefined) {
      const cleanTitle = formData.title.trim();
      if (cleanTitle.length < 3) {
        throw new Error('Tên hoạt động phải có độ dài tối thiểu 3 ký tự');
      }
      payload.title = cleanTitle;
    }

    if (formData.termId !== undefined) {
      const term = await termRepository.getById(formData.termId);
      if (!term || term.organizationId !== organizationId) {
        throw new Error('Nhiệm kỳ đã chọn không tồn tại hoặc không thuộc Đơn vị hiện tại');
      }
      validateTermMutation(term.status, 'chuyển hoạt động sang nhiệm kỳ đã khóa');
      payload.term_id = formData.termId;
    }

    if (formData.code !== undefined) {
      const cleanCode = formData.code ? formData.code.trim() : null;
      if (cleanCode && cleanCode !== existing.code) {
        const existingWithCode = await activityRepository.findByCode(organizationId, cleanCode);
        if (existingWithCode && existingWithCode.id !== id) {
          throw new Error(`Mã hoạt động "${cleanCode}" đã được sử dụng trong Đơn vị.`);
        }
      }
      payload.code = cleanCode;
    }

    if (formData.leadMemberId !== undefined) {
      const rawLeadId = formData.leadMemberId ? formData.leadMemberId.trim() : null;
      if (rawLeadId && rawLeadId !== 'none') {
        const cleanLeadId = await activityService.resolveLeadMemberId(organizationId, rawLeadId);
        payload.lead_member_id = cleanLeadId;
      } else {
        payload.lead_member_id = null;
      }
    }

    if (formData.category !== undefined) {
      if (!VALID_CATEGORIES.includes(formData.category)) {
        throw new Error(`Danh mục hoạt động không hợp lệ: ${formData.category}`);
      }
      payload.category = formData.category;
    }

    if (formData.status !== undefined) {
      if (!VALID_STATUSES.includes(formData.status)) {
        throw new Error(`Trạng thái hoạt động không hợp lệ: ${formData.status}`);
      }
      payload.status = formData.status;
    }

    if (formData.location !== undefined) {
      payload.location = formData.location ? formData.location.trim() : null;
    }

    if (formData.startDate !== undefined) {
      payload.start_date = formData.startDate;
    }

    if (formData.endDate !== undefined) {
      payload.end_date = formData.endDate;
    }

    // Date sanity check
    const effectiveStart = new Date(formData.startDate || existing.startDate);
    const effectiveEnd = new Date(formData.endDate || existing.endDate);
    if (effectiveEnd < effectiveStart) {
      throw new Error('Thời gian kết thúc không thể trước thời gian bắt đầu');
    }

    if (formData.targetMembers !== undefined) {
      if (formData.targetMembers < 0) {
        throw new Error('Số lượng hội viên mục tiêu phải lớn hơn hoặc bằng 0');
      }
      payload.target_members = formData.targetMembers;
    }

    if (formData.bannerUrl !== undefined) {
      payload.banner_url = formData.bannerUrl ? formData.bannerUrl.trim() : null;
    }

    if (formData.description !== undefined) {
      payload.description = formData.description ? formData.description.trim() : null;
    }

    const updated = await activityRepository.update(id, payload);

    // Audit Logging
    if (actorUserId) {
      try {
        const isStatusChange = formData.status !== undefined && formData.status !== existing.status;
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: isStatusChange ? 'activity.status_change' : 'activity.update',
          entity_type: 'activity',
          entity_id: id,
          metadata: {
            updatedFields: Object.keys(payload),
            previousStatus: isStatusChange ? existing.status : undefined,
            newStatus: isStatusChange ? formData.status : undefined,
            previousLeadMemberId: existing.leadMemberId,
            newLeadMemberId: payload.lead_member_id,
          },
        });
      } catch (logErr) {
        console.warn('Could not record activity update audit log:', logErr);
      }
    }

    return updated;
  },

  /**
   * Update status of an activity directly with state machine validation and audit log
   */
  async updateActivityStatus(
    id: string,
    organizationId: string,
    newStatus: ActivityStatus,
    actorUserId?: string
  ): Promise<Activity> {
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new Error(`Trạng thái không hợp lệ: ${newStatus}`);
    }

    const existing = await activityRepository.getById(id, organizationId);
    if (!existing) {
      throw new Error('Hoạt động không tồn tại hoặc bạn không có quyền cập nhật');
    }

    // State machine check
    validateActivityStatusTransition(existing.status, newStatus);

    const updated = await activityRepository.update(id, { status: newStatus });

    if (actorUserId) {
      try {
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'activity.status_change',
          entity_type: 'activity',
          entity_id: id,
          metadata: {
            previousStatus: existing.status,
            newStatus,
            previousStatusLabel: ACTIVITY_STATUS_VIETNAMESE_LABELS[existing.status] || existing.status,
            newStatusLabel: ACTIVITY_STATUS_VIETNAMESE_LABELS[newStatus] || newStatus,
          },
        });
      } catch (logErr) {
        console.warn('Could not record activity status_change audit log:', logErr);
      }
    }

    return updated;
  },

  /**
   * Delete or Cancel activity with state machine checks and audit logging
   */
  async deleteOrArchiveActivity(
    id: string,
    organizationId: string,
    action: 'delete' | 'cancel',
    actorUserId?: string
  ): Promise<{ action: 'deleted' | 'cancelled' }> {
    const existing = await activityRepository.getById(id, organizationId);
    if (!existing) {
      throw new Error('Hoạt động không tồn tại hoặc bạn không có quyền');
    }

    if (existing.termId) {
      const term = await termRepository.getById(existing.termId);
      validateTermMutation(term?.status, 'xóa hoặc hủy hoạt động thuộc nhiệm kỳ đã khóa');
    }

    if (action === 'cancel') {
      validateActivityStatusTransition(existing.status, 'cancelled');
      await activityRepository.update(id, { status: 'cancelled' });

      if (actorUserId) {
        try {
          await auditLogRepository.log({
            organization_id: organizationId,
            user_id: actorUserId,
            action: 'activity.status_change',
            entity_type: 'activity',
            entity_id: id,
            metadata: {
              previousStatus: existing.status,
              newStatus: 'cancelled',
              reason: 'Hủy hoạt động',
            },
          });
        } catch (logErr) {
          console.warn('Could not record activity cancellation audit log:', logErr);
        }
      }

      return { action: 'cancelled' };
    }

    // Hard Delete: If completed or cancelled, disallow hard delete to protect history
    if (existing.status === 'completed') {
      throw new Error('Hoạt động đã hoàn thành không thể xóa. Dữ liệu đã được lưu trữ vào lịch sử Đơn vị.');
    }

    await activityRepository.delete(id);

    if (actorUserId) {
      try {
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'activity.delete',
          entity_type: 'activity',
          entity_id: id,
          metadata: {
            title: existing.title,
            code: existing.code,
            status: existing.status,
          },
        });
      } catch (logErr) {
        console.warn('Could not record activity.delete audit log:', logErr);
      }
    }

    return { action: 'deleted' };
  },

  /**
   * Get participants for an activity
   */
  async getParticipants(
    activityId: string,
    params: ParticipantFilterParams = {}
  ): Promise<ActivityParticipantsResponse> {
    if (!activityId) {
      return {
        data: [],
        totalCount: 0,
        stats: {
          total: 0,
          registered: 0,
          confirmed: 0,
          waitlist: 0,
          cancelled: 0,
          present: 0,
          absent: 0,
          excused: 0,
          unmarked: 0,
          participationRate: 0,
        },
      };
    }
    return activityRepository.getParticipants(activityId, params);
  },

  /**
   * Add participant to activity with cross-tenant member check, RBAC, and audit log
   */
  async addParticipant(
    activityId: string,
    organizationId: string,
    data: AddParticipantFormData,
    actorUserId?: string
  ): Promise<ActivityParticipant> {
    if (!activityId) throw new Error('Thiếu ID hoạt động');
    if (!data.memberId) throw new Error('Vui lòng chọn hội viên tham gia');

    // 1. RBAC check if actorUserId is provided
    if (actorUserId) {
      const membership = await organizationRepository.getMyMembership(organizationId, actorUserId);
      if (!membership || membership.status !== 'active' || !canManageAttendance(membership.role)) {
        throw new Error('Bạn không có quyền thêm người tham gia hoạt động (yêu cầu quyền Ban Chấp Hành: Admin, Trưởng, Phó, Thư ký).');
      }
    }

    // 2. Verify Activity belongs to current organization and check lifecycle lock
    const activity = await activityRepository.getById(activityId, organizationId);
    if (!activity) {
      throw new Error('Hoạt động không tồn tại hoặc không thuộc Đơn vị hiện tại');
    }

    if (activity.termId) {
      const term = await termRepository.getById(activity.termId);
      validateTermMutation(term?.status, 'thêm người tham gia vào hoạt động thuộc nhiệm kỳ đã khóa');
    }

    validateParticipantRosterMutation(activity.status);

    // 3. Verify Member belongs to current organization
    const member = await memberRepository.getById(data.memberId, organizationId);
    if (!member) {
      throw new Error('Hội viên được chọn không thuộc Đơn vị hiện tại');
    }

    // 4. Check duplicate participant
    const existingParticipant = await activityRepository.getParticipantByActivityAndMember(
      activityId,
      data.memberId
    );
    if (existingParticipant) {
      throw new Error(
        `Hội viên "${member.fullName}" ${member.studentId ? `(${member.studentId}) ` : ''}đã có trong danh sách tham gia của hoạt động này.`
      );
    }

    const attendedAt =
      data.attendanceStatus === 'present' ? new Date().toISOString() : null;

    const payload: DbParticipantInsert = {
      activity_id: activityId,
      member_id: data.memberId,
      registration_status: data.registrationStatus || 'registered',
      attendance_status: data.attendanceStatus || 'unmarked',
      attended_at: attendedAt,
      notes: data.notes?.trim() || null,
    };

    const participant = await activityRepository.addParticipant(payload);

    if (actorUserId) {
      try {
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'activity.participant_add',
          entity_type: 'activity_participant',
          entity_id: participant.id,
          metadata: {
            activity_id: activityId,
            activity_title: activity.title,
            participant_id: participant.id,
            member_id: data.memberId,
            member_name: member.fullName,
            registration_status: data.registrationStatus,
            attendance_status: data.attendanceStatus,
            changed_by: actorUserId,
          },
        });
      } catch (logErr) {
        console.warn('Could not record participant_add audit log:', logErr);
      }
    }

    return participant;
  },

  /**
   * Update participant registration or attendance with RBAC, lifecycle lock, and audit logging
   */
  async updateParticipant(
    participantId: string,
    activityId: string,
    organizationId: string,
    data: Partial<UpdateParticipantFormData>,
    actorUserId?: string
  ): Promise<ActivityParticipant> {
    if (!participantId) throw new Error('Thiếu ID người tham gia');

    // 1. RBAC check if actorUserId is provided
    if (actorUserId) {
      const membership = await organizationRepository.getMyMembership(organizationId, actorUserId);
      if (!membership || membership.status !== 'active' || !canManageAttendance(membership.role)) {
        throw new Error('Bạn không có quyền cập nhật điểm danh hoặc người tham gia (yêu cầu quyền Ban Chấp Hành).');
      }
    }

    // 2. Verify activity ownership and status lock
    const activity = await activityRepository.getById(activityId, organizationId);
    if (!activity) {
      throw new Error('Hoạt động không tồn tại hoặc không thuộc Đơn vị hiện tại');
    }

    if (activity.termId) {
      const term = await termRepository.getById(activity.termId);
      validateTermMutation(term?.status, 'cập nhật người tham gia hoặc điểm danh hoạt động thuộc nhiệm kỳ đã khóa');
    }

    // Check attendance mutation rule: if activity is completed or cancelled, disallow attendance change
    if (data.attendanceStatus !== undefined) {
      validateAttendanceMutation(activity.status);
    } else {
      validateParticipantRosterMutation(activity.status);
    }

    // 3. Fetch existing participant to capture previous attendance status
    const existingParticipant = await activityRepository.getParticipantById(participantId);
    const previousAttendanceStatus = existingParticipant?.attendanceStatus || 'unmarked';

    const payload: DbParticipantUpdate = {};
    if (data.registrationStatus !== undefined) {
      payload.registration_status = data.registrationStatus;
    }
    if (data.attendanceStatus !== undefined) {
      payload.attendance_status = data.attendanceStatus;
      if (data.attendanceStatus === 'present' && !data.attendedAt) {
        payload.attended_at = new Date().toISOString();
      } else if (data.attendanceStatus !== 'present') {
        payload.attended_at = null;
      }
    }
    if (data.attendedAt !== undefined) {
      payload.attended_at = data.attendedAt || null;
    }
    if (data.notes !== undefined) {
      payload.notes = data.notes ? data.notes.trim() : null;
    }

    const updated = await activityRepository.updateParticipant(participantId, payload);

    if (actorUserId) {
      try {
        const isAttendance = data.attendanceStatus !== undefined;
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: isAttendance ? 'activity.attendance_update' : 'activity.participant_update',
          entity_type: 'activity_participant',
          entity_id: participantId,
          metadata: {
            activity_id: activityId,
            activity_title: activity.title,
            participant_id: participantId,
            previous_status: previousAttendanceStatus,
            new_status: data.attendanceStatus || existingParticipant?.attendanceStatus,
            attendance_status: data.attendanceStatus,
            registration_status: data.registrationStatus,
            changed_by: actorUserId,
          },
        });
      } catch (logErr) {
        console.warn('Could not record participant update audit log:', logErr);
      }
    }

    return updated;
  },

  /**
   * Remove participant from activity with RBAC and audit logging
   */
  async removeParticipant(
    participantId: string,
    activityId: string,
    organizationId: string,
    actorUserId?: string
  ): Promise<void> {
    if (!participantId) throw new Error('Thiếu ID người tham gia');

    // 1. RBAC check if actorUserId is provided
    if (actorUserId) {
      const membership = await organizationRepository.getMyMembership(organizationId, actorUserId);
      if (!membership || membership.status !== 'active' || !canManageAttendance(membership.role)) {
        throw new Error('Bạn không có quyền xóa người tham gia khỏi hoạt động.');
      }
    }

    const activity = await activityRepository.getById(activityId, organizationId);
    if (!activity) {
      throw new Error('Hoạt động không tồn tại hoặc không thuộc Đơn vị hiện tại');
    }

    if (activity.termId) {
      const term = await termRepository.getById(activity.termId);
      validateTermMutation(term?.status, 'xóa người tham gia khỏi hoạt động thuộc nhiệm kỳ đã khóa');
    }

    validateParticipantRosterMutation(activity.status);

    await activityRepository.removeParticipant(participantId);

    if (actorUserId) {
      try {
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'activity.participant_remove',
          entity_type: 'activity_participant',
          entity_id: participantId,
          metadata: {
            activity_id: activityId,
            activity_title: activity.title,
            participant_id: participantId,
            changed_by: actorUserId,
          },
        });
      } catch (logErr) {
        console.warn('Could not record participant_remove audit log:', logErr);
      }
    }
  },

  /**
   * Bulk add multiple members to an activity with RBAC and lock enforcement
   */
  async bulkAddParticipants(
    activityId: string,
    organizationId: string,
    memberIds: string[],
    registrationStatus: RegistrationStatus = 'registered',
    attendanceStatus: AttendanceStatus = 'unmarked',
    actorUserId?: string
  ): Promise<ActivityParticipant[]> {
    if (!activityId || memberIds.length === 0) return [];

    // 1. RBAC check if actorUserId is provided
    if (actorUserId) {
      const membership = await organizationRepository.getMyMembership(organizationId, actorUserId);
      if (!membership || membership.status !== 'active' || !canManageAttendance(membership.role)) {
        throw new Error('Bạn không có quyền thêm người tham gia hàng loạt.');
      }
    }

    const activity = await activityRepository.getById(activityId, organizationId);
    if (!activity) {
      throw new Error('Hoạt động không tồn tại hoặc không thuộc Đơn vị hiện tại');
    }

    if (activity.termId) {
      const term = await termRepository.getById(activity.termId);
      validateTermMutation(term?.status, 'thêm người tham gia vào hoạt động thuộc nhiệm kỳ đã khóa');
    }

    validateParticipantRosterMutation(activity.status);

    const payloads: DbParticipantInsert[] = memberIds.map((mId) => ({
      activity_id: activityId,
      member_id: mId,
      registration_status: registrationStatus,
      attendance_status: attendanceStatus,
      attended_at: attendanceStatus === 'present' ? new Date().toISOString() : null,
      source: 'manual',
    }));

    const results = await activityRepository.bulkAddParticipants(payloads);

    if (actorUserId) {
      try {
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'activity.participant_add',
          entity_type: 'activity_participant',
          entity_id: activityId,
          metadata: {
            activity_id: activityId,
            activity_title: activity.title,
            participant_count: results.length,
            member_ids: memberIds,
            registration_status: registrationStatus,
            attendance_status: attendanceStatus,
            changed_by: actorUserId,
          },
        });
      } catch (logErr) {
        console.warn('Could not record bulk participant add audit log:', logErr);
      }
    }

    return results;
  },

  /**
   * Bulk update attendance for multiple participant IDs with RBAC and lock enforcement
   */
  async bulkUpdateAttendance(
    activityId: string,
    organizationId: string,
    participantIds: string[],
    status: AttendanceStatus,
    actorUserId?: string
  ): Promise<void> {
    if (!activityId || participantIds.length === 0) return;

    // 1. RBAC check if actorUserId is provided
    if (actorUserId) {
      const membership = await organizationRepository.getMyMembership(organizationId, actorUserId);
      if (!membership || membership.status !== 'active' || !canManageAttendance(membership.role)) {
        throw new Error('Bạn không có quyền cập nhật điểm danh hàng loạt (yêu cầu quyền Ban Chấp Hành: Admin, Trưởng, Phó, Thư ký).');
      }
    }

    const activity = await activityRepository.getById(activityId, organizationId);
    if (!activity) {
      throw new Error('Hoạt động không tồn tại hoặc không thuộc Đơn vị hiện tại');
    }

    if (activity.termId) {
      const term = await termRepository.getById(activity.termId);
      validateTermMutation(term?.status, 'điểm danh hoạt động thuộc nhiệm kỳ đã khóa');
    }

    // Enforce attendance mutation rule
    validateAttendanceMutation(activity.status);

    const attendedAt = status === 'present' ? new Date().toISOString() : null;
    await activityRepository.bulkUpdateAttendance(participantIds, status, attendedAt);

    if (actorUserId) {
      try {
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'activity.attendance_bulk_update',
          entity_type: 'activity_participant',
          entity_id: activityId,
          metadata: {
            activity_id: activityId,
            activity_title: activity.title,
            participant_count: participantIds.length,
            target_status: status,
            participant_ids: participantIds,
            changed_by: actorUserId,
          },
        });
      } catch (logErr) {
        console.warn('Could not record bulk attendance audit log:', logErr);
      }
    }
  },

  /**
   * Resolve and ensure a valid members.id for leadMemberId (checking members table or auto-linking BCH user)
   */
  async resolveLeadMemberId(organizationId: string, leadMemberId: string): Promise<string> {
    if (!organizationId || !leadMemberId) {
      throw new Error('Thiếu thông tin người phụ trách chính');
    }

    // 1. Direct check in members table by id
    const leadMember = await memberRepository.getById(leadMemberId, organizationId);
    if (leadMember && leadMember.organizationId === organizationId) {
      return leadMember.id;
    }

    // 2. Check if leadMemberId is a user_id in members table
    const { data: memberByUserId } = await supabase
      .from('members')
      .select('id, organization_id')
      .eq('organization_id', organizationId)
      .eq('user_id', leadMemberId)
      .maybeSingle();

    if (memberByUserId) {
      return (memberByUserId as any).id;
    }

    // 3. Check if leadMemberId is in organization_memberships (Ban Chấp Hành)
    const { data: orgMem } = await supabase
      .from('organization_memberships')
      .select('id, user_id, role, status')
      .eq('organization_id', organizationId)
      .or(`user_id.eq.${leadMemberId},id.eq.${leadMemberId}`)
      .eq('status', 'active')
      .maybeSingle();

    if (orgMem) {
      const uId = (orgMem as any).user_id;

      // Check if already in members
      const { data: existingMem } = await supabase
        .from('members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', uId)
        .maybeSingle();

      if (existingMem) {
        return (existingMem as any).id;
      }
    }

    throw new Error('Người phụ trách chính không tồn tại hoặc không thuộc đơn vị hiện tại');
  },

  /**
   * Get available chapter members who are not yet participants in activity
   */
  async getAvailableMembers(
    organizationId: string,
    activityId: string,
    search?: string
  ): Promise<Member[]> {
    if (!organizationId || !activityId) return [];
    return activityRepository.getAvailableMembers(organizationId, activityId, search);
  },

  /**
   * Get organization terms
   */
  async getOrgTerms(organizationId: string): Promise<Term[]> {
    if (!organizationId) return [];
    return activityRepository.getTerms(organizationId);
  },

  /**
   * Get candidate members for the activity lead person (BCH + Members roster)
   */
  async getLeadCandidates(organizationId: string): Promise<Member[]> {
    if (!organizationId) return [];
    return activityRepository.getLeadCandidates(organizationId);
  },

  /**
   * Validate that leadMemberId belongs to the organization (either in members table or organization_memberships)
   */
  async validateLeadCandidate(organizationId: string, leadMemberId: string): Promise<boolean> {
    if (!organizationId || !leadMemberId) return false;

    // 1. Check in members table (by id or user_id)
    const leadMember = await memberRepository.getById(leadMemberId, organizationId);
    if (leadMember && leadMember.organizationId === organizationId) {
      return true;
    }

    // 2. Check in organization_memberships (Ban Chấp Hành: Chi hội trưởng, phó, admin, ủy viên...)
    const { data: orgMem } = await supabase
      .from('organization_memberships')
      .select('id, user_id, status')
      .eq('organization_id', organizationId)
      .or(`user_id.eq.${leadMemberId},id.eq.${leadMemberId}`)
      .eq('status', 'active')
      .maybeSingle();

    if (orgMem) {
      return true;
    }

    return false;
  },
};
