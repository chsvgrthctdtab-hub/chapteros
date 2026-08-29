import type { MemberStatus, TermMemberStatus } from '@/types/database.types';

export interface StatusConfig<T extends string> {
  key: T;
  label: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  colorClasses: {
    bg: string;
    text: string;
    border: string;
  };
  description: string;
}

export const MEMBER_STATUSES: Record<MemberStatus, StatusConfig<MemberStatus>> = {
  active: {
    key: 'active',
    label: 'Đang hoạt động',
    badgeVariant: 'success',
    colorClasses: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    description: 'Hội viên đang sinh hoạt và tham gia các hoạt động thường xuyên.',
  },
  alumni: {
    key: 'alumni',
    label: 'Cựu hội viên (Tốt nghiệp)',
    badgeVariant: 'secondary',
    colorClasses: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
    },
    description: 'Hội viên đã tốt nghiệp ra trường hoặc chuyển sang mạng lưới cựu sinh viên.',
  },
};

export const TERM_MEMBER_STATUSES: Record<TermMemberStatus, StatusConfig<TermMemberStatus>> = {
  active: {
    key: 'active',
    label: 'Đang đảm nhiệm',
    badgeVariant: 'success',
    colorClasses: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    description: 'Đang giữ nhiệm vụ trong nhiệm kỳ.',
  },
  completed: {
    key: 'completed',
    label: 'Hoàn thành nhiệm kỳ',
    badgeVariant: 'default',
    colorClasses: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    description: 'Đã hoàn thành trọn vẹn nhiệm vụ của nhiệm kỳ.',
  },
  leave: {
    key: 'leave',
    label: 'Tạm nghỉ phép',
    badgeVariant: 'warning',
    colorClasses: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    description: 'Tạm vắng mặt trong một khoảng thời gian của nhiệm kỳ.',
  },
  resigned: {
    key: 'resigned',
    label: 'Miễn nhiệm / Thôi giữ chức',
    badgeVariant: 'destructive',
    colorClasses: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
    },
    description: 'Đã thôi giữ chức vụ hoặc xin rút khỏi BCH giữa nhiệm kỳ.',
  },
};

export const COMMON_POSITIONS = [
  'Hội viên',
  'Chi hội trưởng',
  'Chi hội phó',
  'Ủy viên BCH',
  'Thủ quỹ',
  'Thư ký',
  'Cộng tác viên (CTV)',
  'Trưởng ban Phong trào',
  'Trưởng ban Học tập',
  'Trưởng ban Truyền thông',
  'Trưởng ban Hậu cần',
] as const;

export const COMMON_DEPARTMENTS = [
  'Ban Chấp Hành',
  'Ban Phong trào - Hoạt động',
  'Ban Học tập - Nghiên cứu',
  'Ban Truyền thông & Sự kiện',
  'Ban Tài chính - Hậu cần',
  'Tổ Cộng tác viên',
] as const;

export interface MemberListItem {
  id: string;
  organizationId: string;
  userId?: string | null;
  studentId: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  className?: string | null;
  major?: string | null;
  cohort?: string | null;
  position?: string | null;
  status: MemberStatus;
  joinedDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  // Current or latest term assignment if available
  currentTermAssignment?: {
    termId: string;
    termName: string;
    position: string;
    department: string | null;
    status: TermMemberStatus;
    isCurrentTerm: boolean;
  } | null;
}

export interface MemberTermHistoryItem {
  id: string;
  termId: string;
  memberId: string;
  position: string;
  department: string | null;
  status: TermMemberStatus;
  joinedDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  term: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    isCurrent: boolean;
  };
}

export interface MemberFilterParams {
  search?: string;
  status?: MemberStatus | 'all';
  position?: string | 'all';
  termId?: string | 'all';
  page?: number;
  pageSize?: number;
  sortBy?: 'full_name' | 'student_id' | 'created_at' | 'joined_date';
  sortOrder?: 'asc' | 'desc';
}
