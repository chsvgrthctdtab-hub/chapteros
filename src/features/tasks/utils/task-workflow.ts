import type { TaskStatus } from '../types/task.types';
import { isOrgBoard } from '@/types/roles';

export interface ValidateTaskTransitionOptions {
  currentStatus: TaskStatus;
  targetStatus: TaskStatus;
  userRole?: string | null;
  isAssignee?: boolean;
  isCreator?: boolean;
}

export interface TransitionValidationResult {
  allowed: boolean;
  errorMessage?: string;
  recommendedProgress?: number;
  toastSuccessMessage?: string;
}

/**
 * Task Workflow State Machine Validator
 * Enforces role-based status lifecycle transitions with flexibility for board & assignees
 */
export function validateTaskStatusTransition({
  currentStatus,
  targetStatus,
  userRole,
  isAssignee,
  isCreator,
}: ValidateTaskTransitionOptions): TransitionValidationResult {
  // 1. Same status is a no-op
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  // 2. Determine authority level
  const normalizedRole = (userRole || '').toLowerCase();
  const isBoard = isOrgBoard(normalizedRole as any) || ['admin', 'leader', 'deputy', 'treasurer', 'secretary'].includes(normalizedRole);
  const isAuthorized = isBoard || isAssignee || isCreator;

  // 3. Board / Admin Authority: Can transition between any states (including reopening completed/cancelled)
  if (isBoard) {
    let progress = undefined;
    if (targetStatus === 'todo') progress = 0;
    else if (targetStatus === 'in_progress') progress = currentStatus === 'todo' ? 25 : undefined;
    else if (targetStatus === 'in_review') progress = 90;
    else if (targetStatus === 'completed') progress = 100;

    return {
      allowed: true,
      recommendedProgress: progress,
      toastSuccessMessage: `Đã chuyển công việc sang "${getTaskStatusLabel(targetStatus)}".`,
    };
  }

  // 4. Assignee / Creator Transitions
  if (isAssignee || isCreator) {
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      return {
        allowed: false,
        errorMessage: 'Công việc đã đóng. Vui lòng liên hệ Ban Chấp Hành nếu cần mở lại.',
      };
    }

    if (targetStatus === 'cancelled') {
      return {
        allowed: false,
        errorMessage: 'Bạn không có quyền hủy công việc. Vui lòng liên hệ Ban Chấp Hành để được xử lý.',
      };
    }

    let progress = undefined;
    if (targetStatus === 'todo') progress = 0;
    else if (targetStatus === 'in_progress') progress = 25;
    else if (targetStatus === 'in_review') progress = 100;
    else if (targetStatus === 'completed') progress = 100;

    return {
      allowed: true,
      recommendedProgress: progress,
      toastSuccessMessage: `Đã chuyển công việc sang "${getTaskStatusLabel(targetStatus)}".`,
    };
  }

  // 5. Default Member Transitions (todo <-> in_progress <-> in_review)
  if (currentStatus === 'todo' && targetStatus === 'in_progress') {
    return {
      allowed: true,
      recommendedProgress: 25,
      toastSuccessMessage: 'Đã bắt đầu thực hiện công việc.',
    };
  }

  if (currentStatus === 'in_progress' && targetStatus === 'todo') {
    return {
      allowed: true,
      recommendedProgress: 0,
      toastSuccessMessage: 'Đã chuyển công việc về danh sách cần làm.',
    };
  }

  if (currentStatus === 'in_progress' && targetStatus === 'in_review') {
    return {
      allowed: true,
      recommendedProgress: 100,
      toastSuccessMessage: 'Đã gửi yêu cầu nghiệm thu công việc.',
    };
  }

  if (currentStatus === 'in_review' && targetStatus === 'in_progress') {
    return {
      allowed: true,
      toastSuccessMessage: 'Đã rút lại yêu cầu nghiệm thu để tiếp tục chỉnh sửa.',
    };
  }

  return {
    allowed: false,
    errorMessage: `Không thể chuyển trực tiếp từ "${getTaskStatusLabel(currentStatus)}" sang "${getTaskStatusLabel(targetStatus)}".`,
  };
}

export function getTaskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'todo':
      return 'Cần làm';
    case 'in_progress':
      return 'Đang thực hiện';
    case 'in_review':
      return 'Chờ duyệt';
    case 'completed':
      return 'Đã hoàn thành';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
}

/**
 * Returns allowed next statuses based on current status and user role
 */
export function getAllowedTransitions(
  currentStatus: TaskStatus,
  userRole?: string | null,
  isAssignee?: boolean
): TaskStatus[] {
  const normalizedRole = (userRole || '').toLowerCase();
  const isBoard = isOrgBoard(normalizedRole as any) || ['admin', 'leader', 'deputy', 'treasurer', 'secretary'].includes(normalizedRole);

  if (isBoard) {
    // Board can switch to any other status
    const allStatuses: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'completed', 'cancelled'];
    return allStatuses.filter((s) => s !== currentStatus);
  }

  if (currentStatus === 'completed' || currentStatus === 'cancelled') {
    return [];
  }

  if (isAssignee) {
    switch (currentStatus) {
      case 'todo':
        return ['in_progress', 'in_review'];
      case 'in_progress':
        return ['todo', 'in_review', 'completed'];
      case 'in_review':
        return ['in_progress', 'completed'];
      default:
        return [];
    }
  }

  // General member
  switch (currentStatus) {
    case 'todo':
      return ['in_progress'];
    case 'in_progress':
      return ['todo', 'in_review'];
    case 'in_review':
      return ['in_progress'];
    default:
      return [];
  }
}
