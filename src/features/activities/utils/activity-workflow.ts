import type { ActivityStatus, OrganizationRole } from '@/types';

/**
 * Valid activity status transitions according to Chapter Activity Management State Machine:
 * - draft -> ['planning']
 * - planning -> ['published', 'draft']
 * - published -> ['in_progress', 'cancelled']
 * - in_progress -> ['completed', 'cancelled']
 * - completed -> [] (TERMINAL STATE - Locked)
 * - cancelled -> [] (TERMINAL STATE - Locked)
 */
export const ALLOWED_ACTIVITY_STATUS_TRANSITIONS: Record<ActivityStatus, ActivityStatus[]> = {
  draft: ['planning'],
  planning: ['published', 'draft'],
  published: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * Terminal statuses where activities become read-only / locked
 */
export const TERMINAL_ACTIVITY_STATUSES: readonly ActivityStatus[] = ['completed', 'cancelled'] as const;

/**
 * Vietnamese friendly status labels
 */
export const ACTIVITY_STATUS_VIETNAMESE_LABELS: Record<ActivityStatus, string> = {
  draft: 'Bản nháp',
  planning: 'Đang lập kế hoạch',
  published: 'Đã công bố',
  in_progress: 'Đang diễn ra',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
};

/**
 * Action button labels when initiating a transition
 */
export const ACTIVITY_TRANSITION_ACTION_LABELS: Record<ActivityStatus, string> = {
  draft: 'Chuyển về Bản nháp',
  planning: 'Bắt đầu lập kế hoạch',
  published: 'Công bố hoạt động',
  in_progress: 'Bắt đầu diễn ra',
  completed: 'Hoàn thành hoạt động',
  cancelled: 'Hủy hoạt động',
};

/**
 * Roles with permission to modify activity status and fields
 */
const MANAGEMENT_ROLES: string[] = ['admin', 'leader', 'deputy'];

/**
 * Check if a role is authorized to perform management lifecycle actions
 */
export function canManageActivityLifecycle(role?: string | null): boolean {
  if (!role) return false;
  return MANAGEMENT_ROLES.includes(role.toLowerCase());
}

/**
 * Check if an activity status is a terminal state (completed or cancelled)
 */
export function isActivityTerminal(status: ActivityStatus): boolean {
  return TERMINAL_ACTIVITY_STATUSES.includes(status);
}

/**
 * Check if an activity is locked for core editing
 */
export function isActivityLocked(status: ActivityStatus): boolean {
  return isActivityTerminal(status);
}

/**
 * Get allowed next statuses based on current status and user role
 */
export function getAllowedActivityTransitions(
  currentStatus: ActivityStatus,
  role?: string | null
): ActivityStatus[] {
  if (role && !canManageActivityLifecycle(role)) {
    return [];
  }
  return ALLOWED_ACTIVITY_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Validate a proposed status transition. Throws a detailed Vietnamese Error if invalid.
 */
export function validateActivityStatusTransition(
  currentStatus: ActivityStatus,
  targetStatus: ActivityStatus,
  role?: string | null
): void {
  // 1. Role permission check
  if (role && !canManageActivityLifecycle(role)) {
    throw new Error('Bạn không có quyền thay đổi trạng thái hoạt động (yêu cầu quyền Ban Chấp Hành hoặc Quản trị viên).');
  }

  // 2. Already at target status
  if (currentStatus === targetStatus) {
    return;
  }

  // 3. Terminal state check
  if (isActivityTerminal(currentStatus)) {
    const statusLabel = ACTIVITY_STATUS_VIETNAMESE_LABELS[currentStatus] || currentStatus;
    throw new Error(
      `Hoạt động đã ở trạng thái "${statusLabel}" (trạng thái kết thúc/đã khóa). Không thể chuyển đổi sang bất kỳ trạng thái nào khác.`
    );
  }

  // 4. Allowed transitions check
  const allowed = ALLOWED_ACTIVITY_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    const currentLabel = ACTIVITY_STATUS_VIETNAMESE_LABELS[currentStatus] || currentStatus;
    const targetLabel = ACTIVITY_STATUS_VIETNAMESE_LABELS[targetStatus] || targetStatus;
    throw new Error(
      `Không thể chuyển đổi trạng thái từ "${currentLabel}" sang "${targetLabel}". Quy trình hợp lệ: ${
        allowed.map((s) => `"${ACTIVITY_STATUS_VIETNAMESE_LABELS[s]}"`).join(', ') || 'Không có'
      }.`
    );
  }
}

/**
 * Core business fields that cannot be modified when an activity is in a terminal state
 */
const PROTECTED_CORE_FIELDS = [
  'title',
  'description',
  'category',
  'location',
  'startDate',
  'start_date',
  'endDate',
  'end_date',
  'termId',
  'term_id',
  'targetMembers',
  'target_members',
  'code',
  'leadMemberId',
  'lead_member_id',
];

/**
 * Validate field updates against activity status.
 * Prevents editing core business information once activity is completed or cancelled.
 */
export function validateActivityFieldUpdate(
  currentActivity: { status: ActivityStatus },
  updatedFields: Record<string, unknown>,
  role?: string | null
): void {
  if (role && !canManageActivityLifecycle(role)) {
    throw new Error('Bạn không có quyền chỉnh sửa hoạt động (yêu cầu quyền Ban Chấp Hành hoặc Quản trị viên).');
  }

  if (isActivityTerminal(currentActivity.status)) {
    const attemptedProtectedKeys = Object.keys(updatedFields).filter(
      (key) => PROTECTED_CORE_FIELDS.includes(key) && updatedFields[key] !== undefined
    );

    if (attemptedProtectedKeys.length > 0) {
      const statusLabel = ACTIVITY_STATUS_VIETNAMESE_LABELS[currentActivity.status] || currentActivity.status;
      throw new Error(
        `Hoạt động đã ở trạng thái "${statusLabel}" (dữ liệu nghiệp vụ đã được khóa). Không thể chỉnh sửa thông tin chi tiết của hoạt động.`
      );
    }
  }
}

/**
 * Validate that attendance mutations (check-in, absent, excused, bulk update) can be performed.
 * Throws standard error if activity is completed or cancelled.
 */
export function validateAttendanceMutation(activityStatus: ActivityStatus): void {
  if (isActivityTerminal(activityStatus) || activityStatus === 'completed' || activityStatus === 'cancelled') {
    throw new Error('Hoạt động đã kết thúc, không thể thay đổi điểm danh.');
  }
}

/**
 * Validate that participant roster modifications (add, remove) can be performed.
 */
export function validateParticipantRosterMutation(activityStatus: ActivityStatus): void {
  if (isActivityTerminal(activityStatus) || activityStatus === 'completed' || activityStatus === 'cancelled') {
    throw new Error('Hoạt động đã kết thúc, không thể thay đổi danh sách người tham gia.');
  }
}

