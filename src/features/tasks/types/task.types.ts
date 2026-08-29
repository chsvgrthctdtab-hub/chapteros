import type {
  Task,
  TaskStatus,
  TaskPriority,
  Activity,
  Term,
  Profile,
  Member,
} from '@/types';

export type { Task, TaskStatus, TaskPriority };

export interface StatusConfig<T extends string> {
  key: T;
  label: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  colorClasses: {
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
  description: string;
}

export interface PriorityConfig {
  key: TaskPriority;
  label: string;
  colorClasses: {
    bg: string;
    text: string;
    border: string;
    iconColor: string;
  };
  weight: number;
}

export const TASK_STATUSES: Record<TaskStatus, StatusConfig<TaskStatus>> = {
  todo: {
    key: 'todo',
    label: 'Cần làm',
    badgeVariant: 'outline',
    colorClasses: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-300',
      dot: 'bg-slate-400',
    },
    description: 'Công việc mới được giao hoặc chưa bắt đầu triển khai.',
  },
  in_progress: {
    key: 'in_progress',
    label: 'Đang thực hiện',
    badgeVariant: 'info',
    colorClasses: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      dot: 'bg-sky-500 animate-pulse',
    },
    description: 'Người phụ trách đang tích cực triển khai công việc.',
  },
  in_review: {
    key: 'in_review',
    label: 'Chờ duyệt / Nghiệm thu',
    badgeVariant: 'warning',
    colorClasses: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    description: 'Đã hoàn thành sản phẩm/kết quả, đang chờ Ban Chấp Hành nghiệm thu.',
  },
  completed: {
    key: 'completed',
    label: 'Đã hoàn thành',
    badgeVariant: 'success',
    colorClasses: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    description: 'Công việc đã được hoàn thành và nghiệm thu đạt yêu cầu.',
  },
  cancelled: {
    key: 'cancelled',
    label: 'Đã hủy',
    badgeVariant: 'destructive',
    colorClasses: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
    },
    description: 'Công việc không còn cần thiết hoặc bị hủy bỏ.',
  },
};

export const TASK_PRIORITIES: Record<TaskPriority, PriorityConfig> = {
  low: {
    key: 'low',
    label: 'Thấp',
    colorClasses: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      iconColor: 'text-slate-400',
    },
    weight: 1,
  },
  medium: {
    key: 'medium',
    label: 'Trung bình',
    colorClasses: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      iconColor: 'text-blue-500',
    },
    weight: 2,
  },
  high: {
    key: 'high',
    label: 'Cao',
    colorClasses: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      iconColor: 'text-orange-500',
    },
    weight: 3,
  },
  urgent: {
    key: 'urgent',
    label: 'Khẩn cấp',
    colorClasses: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      iconColor: 'text-rose-600',
    },
    weight: 4,
  },
};

export const ALLOWED_TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ['in_progress', 'cancelled'],
  in_progress: ['in_review', 'completed', 'todo', 'cancelled'],
  in_review: ['completed', 'in_progress', 'cancelled'],
  completed: ['in_progress'],
  cancelled: ['todo'],
};

export interface TaskAssigneeOption {
  userId: string;
  profileId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  studentId?: string | null;
  phone?: string | null;
  position?: string | null;
  role?: string | null;
}

export interface TaskListItem {
  id: string;
  organizationId: string;
  termId: string;
  activityId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  dueDate?: string | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  term?: {
    id: string;
    name: string;
    isCurrent: boolean;
  };
  activity?: {
    id: string;
    code?: string | null;
    title: string;
    category: string;
    status: string;
    planId?: string | null;
    plan?: {
      id: string;
      code: string;
      name: string;
    } | null;
  } | null;
  assignee?: Profile | null;
  creator?: Profile | null;
}

export interface TaskDetail extends TaskListItem {
  memberDetails?: Member | null;
}

export interface TaskFilterParams {
  search?: string;
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  termId?: string | 'all';
  activityId?: string | 'all';
  assignedTo?: string | 'all';
  onlyOverdue?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'due_date' | 'created_at' | 'priority' | 'progress' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  completed: number;
  cancelled: number;
  overdue: number;
  highOrUrgent: number;
  completionRate: number;
}

/**
 * Check if a task is overdue given due_date and status
 */
export function isTaskOverdue(dueDate?: string | null, status?: TaskStatus): boolean {
  if (!dueDate) return false;
  if (status === 'completed' || status === 'cancelled') return false;
  const due = new Date(dueDate).getTime();
  const now = new Date().getTime();
  return due < now;
}

/**
 * Format due date with smart relative indicator in Vietnamese
 */
export function formatDueDateInfo(dueDate?: string | null, status?: TaskStatus): {
  text: string;
  isOverdue: boolean;
  daysDiff: number;
  formattedDate: string;
} {
  if (!dueDate) {
    return {
      text: 'Không có hạn',
      isOverdue: false,
      daysDiff: 0,
      formattedDate: '—',
    };
  }

  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOver = isTaskOverdue(dueDate, status);

  const formattedDate = due.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (status === 'completed') {
    return {
      text: `Hạn: ${formattedDate}`,
      isOverdue: false,
      daysDiff,
      formattedDate,
    };
  }

  if (status === 'cancelled') {
    return {
      text: `Đã hủy (${formattedDate})`,
      isOverdue: false,
      daysDiff,
      formattedDate,
    };
  }

  if (daysDiff < 0) {
    const absDays = Math.abs(daysDiff);
    return {
      text: `Quá hạn ${absDays} ngày`,
      isOverdue: true,
      daysDiff,
      formattedDate,
    };
  }

  if (daysDiff === 0) {
    return {
      text: 'Hôm nay',
      isOverdue: false,
      daysDiff: 0,
      formattedDate,
    };
  }

  if (daysDiff === 1) {
    return {
      text: 'Ngày mai',
      isOverdue: false,
      daysDiff: 1,
      formattedDate,
    };
  }

  if (daysDiff <= 7) {
    return {
      text: `Còn ${daysDiff} ngày`,
      isOverdue: false,
      daysDiff,
      formattedDate,
    };
  }

  return {
    text: formattedDate,
    isOverdue: false,
    daysDiff,
    formattedDate,
  };
}
