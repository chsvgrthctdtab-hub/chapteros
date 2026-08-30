export type {
  ActivityCategory,
  ActivityStatus,
  RegistrationStatus,
  AttendanceStatus,
  Activity,
  ActivityParticipant,
  Member,
  Term,
  Profile,
} from '@/types';
import type {
  ActivityCategory,
  ActivityStatus,
  RegistrationStatus,
  AttendanceStatus,
  Activity,
  ActivityParticipant,
  Member,
  Term,
  Profile,
} from '@/types';

export interface StatusConfig<T extends string> {
  key: T;
  label: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  colorClasses: {
    bg: string;
    text: string;
    border: string;
    dot?: string;
  };
  description: string;
}

export interface CategoryConfig {
  key: ActivityCategory;
  label: string;
  colorClasses: {
    bg: string;
    text: string;
    border: string;
  };
  iconName: string;
  description: string;
}

export const ACTIVITY_CATEGORIES: Record<ActivityCategory, CategoryConfig> = {
  general: {
    key: 'general',
    label: 'Chung / Phong trào',
    colorClasses: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
    iconName: 'Sparkles',
    description: 'Các hoạt động chung của Đơn vị, sinh hoạt định kỳ, giao lưu.',
  },
  volunteer: {
    key: 'volunteer',
    label: 'Tình nguyện - Xã hội',
    colorClasses: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    iconName: 'HeartHandshake',
    description: 'Chiến dịch tình nguyện, hiến máu nhân đạo, công tác xã hội, đền ơn đáp nghĩa.',
  },
  academic: {
    key: 'academic',
    label: 'Học thuật - Nghiên cứu',
    colorClasses: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    iconName: 'GraduationCap',
    description: 'Hội thảo khoa học, tọa đàm, cuộc thi học thuật, chia sẻ phương pháp học tập.',
  },
  sports: {
    key: 'sports',
    label: 'Thể dục - Thể thao',
    colorClasses: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
    },
    iconName: 'Trophy',
    description: 'Giải bóng đá, bóng chuyền, chạy việt dã, hội thao các cấp.',
  },
  culture: {
    key: 'culture',
    label: 'Văn hóa - Văn nghệ',
    colorClasses: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
    iconName: 'Music',
    description: 'Hội diễn văn nghệ, đêm nhạc gây quỹ, giao lưu truyền thống văn hóa quê hương.',
  },
  meeting: {
    key: 'meeting',
    label: 'Họp - Đại hội',
    colorClasses: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
    },
    iconName: 'Users',
    description: 'Đại hội Chi hội, họp Ban Chấp Hành, họp toàn thể hội viên định kỳ.',
  },
  training: {
    key: 'training',
    label: 'Tập huấn - Kỹ năng',
    colorClasses: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-200',
    },
    iconName: 'BookOpen',
    description: 'Tập huấn cán bộ Hội, rèn luyện kỹ năng mềm, kỹ năng làm việc nhóm.',
  },
};

export const ACTIVITY_STATUSES: Record<ActivityStatus, StatusConfig<ActivityStatus>> = {
  draft: {
    key: 'draft',
    label: 'Bản nháp',
    badgeVariant: 'outline',
    colorClasses: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-300',
      dot: 'bg-slate-400',
    },
    description: 'Hoạt động đang trong giai đoạn soạn thảo, chưa công bố kế hoạch.',
  },
  planning: {
    key: 'planning',
    label: 'Đang lập kế hoạch',
    badgeVariant: 'warning',
    colorClasses: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    description: 'Đã lên kế hoạch khung, đang chuẩn bị tài chính, nhân sự và phân công công việc.',
  },
  published: {
    key: 'published',
    label: 'Đã công bố',
    badgeVariant: 'info',
    colorClasses: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      dot: 'bg-sky-500',
    },
    description: 'Đã phát động đến toàn thể hội viên, đang tiếp nhận đăng ký tham gia.',
  },
  in_progress: {
    key: 'in_progress',
    label: 'Đang diễn ra',
    badgeVariant: 'success',
    colorClasses: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500 animate-pulse',
    },
    description: 'Hoạt động đang trong thời gian diễn ra thực tế, phục vụ điểm danh.',
  },
  completed: {
    key: 'completed',
    label: 'Đã hoàn thành',
    badgeVariant: 'default',
    colorClasses: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
    },
    description: 'Hoạt động đã kết thúc và hoàn tất tổng kết.',
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
    description: 'Hoạt động đã bị hủy bỏ hoặc hoãn vô thời hạn.',
  },
};

export const REGISTRATION_STATUSES: Record<RegistrationStatus, StatusConfig<RegistrationStatus>> = {
  registered: {
    key: 'registered',
    label: 'Đã đăng ký',
    badgeVariant: 'info',
    colorClasses: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
    },
    description: 'Hội viên đã đăng ký tham gia hoạt động.',
  },
  confirmed: {
    key: 'confirmed',
    label: 'Đã xác nhận',
    badgeVariant: 'success',
    colorClasses: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    description: 'BCH đã duyệt và xác nhận danh sách tham gia chính thức.',
  },
  waitlist: {
    key: 'waitlist',
    label: 'Danh sách chờ',
    badgeVariant: 'warning',
    colorClasses: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    description: 'Đăng ký vượt số lượng mục tiêu, đang trong hàng đợi chờ duyệt bổ sung.',
  },
  cancelled: {
    key: 'cancelled',
    label: 'Đã hủy đăng ký',
    badgeVariant: 'destructive',
    colorClasses: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
    },
    description: 'Hội viên hoặc BCH đã hủy đơn đăng ký.',
  },
};

export const ATTENDANCE_STATUSES: Record<AttendanceStatus, StatusConfig<AttendanceStatus>> = {
  unmarked: {
    key: 'unmarked',
    label: 'Chưa điểm danh',
    badgeVariant: 'outline',
    colorClasses: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
    },
    description: 'Chưa có thông tin điểm danh.',
  },
  present: {
    key: 'present',
    label: 'Có mặt',
    badgeVariant: 'success',
    colorClasses: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    description: 'Hội viên đã có mặt tham dự chương trình.',
  },
  absent: {
    key: 'absent',
    label: 'Vắng không phép',
    badgeVariant: 'destructive',
    colorClasses: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
    },
    description: 'Vắng mặt không có lý do hoặc không báo trước.',
  },
  excused: {
    key: 'excused',
    label: 'Vắng có phép',
    badgeVariant: 'warning',
    colorClasses: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    description: 'Đã xin phép vắng mặt có lý do chính đáng.',
  },
};

import {
  ALLOWED_ACTIVITY_STATUS_TRANSITIONS,
  TERMINAL_ACTIVITY_STATUSES,
  ACTIVITY_STATUS_VIETNAMESE_LABELS,
  ACTIVITY_TRANSITION_ACTION_LABELS,
  isActivityTerminal,
  isActivityLocked,
  getAllowedActivityTransitions,
  validateActivityStatusTransition,
  validateActivityFieldUpdate,
  validateAttendanceMutation,
  validateParticipantRosterMutation,
} from '../utils/activity-workflow';

export {
  ALLOWED_ACTIVITY_STATUS_TRANSITIONS,
  TERMINAL_ACTIVITY_STATUSES,
  ACTIVITY_STATUS_VIETNAMESE_LABELS,
  ACTIVITY_TRANSITION_ACTION_LABELS,
  isActivityTerminal,
  isActivityLocked,
  getAllowedActivityTransitions,
  validateActivityStatusTransition,
  validateActivityFieldUpdate,
  validateAttendanceMutation,
  validateParticipantRosterMutation,
};

/**
 * Valid Status Transitions for Activity lifecycle (alias for backwards-compat)
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<ActivityStatus, ActivityStatus[]> =
  ALLOWED_ACTIVITY_STATUS_TRANSITIONS;

export interface ActivityListItem extends Omit<Activity, 'leadMember'> {
  term?: {
    id: string;
    name: string;
    isCurrent: boolean;
  } | null;
  leadMember?: {
    id: string;
    fullName: string;
    studentId?: string | null;
    position?: string | null;
    email?: string | null;
    phone?: string | null;
  } | Member | null;
  creator?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  participantStats: {
    total: number;
    registered: number;
    confirmed: number;
    present: number;
    absent: number;
  };
}

export interface ActivityDetail extends ActivityListItem {
  planId?: string | null;
  plan?: {
    id: string;
    name: string;
    code?: string | null;
    description?: string | null;
  } | null;
  description: string | null;
  bannerUrl: string | null;
}

export interface ActivityParticipantItem extends ActivityParticipant {
  member: Member & {
    user?: Profile | null;
  };
}

export interface ActivityFilterParams {
  search?: string;
  status?: ActivityStatus | 'all';
  category?: ActivityCategory | 'all';
  termId?: string | 'all';
  startDateFrom?: string;
  startDateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'start_date' | 'created_at' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ParticipantFilterParams {
  search?: string;
  registrationStatus?: RegistrationStatus | 'all';
  attendanceStatus?: AttendanceStatus | 'all';
  page?: number;
  pageSize?: number;
}
