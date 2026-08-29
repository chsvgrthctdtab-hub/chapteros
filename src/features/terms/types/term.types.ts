import type { Term, TermMember, TermStatus, TermMemberStatus, Member } from '@/types';

export interface TermFilterParams {
  search?: string;
  status?: TermStatus | 'all';
  isCurrent?: boolean;
}

export const TERM_STATUS_OPTIONS: {
  value: TermStatus;
  label: string;
  variant: 'default' | 'secondary' | 'success' | 'warning' | 'outline';
}[] = [
  { value: 'active', label: 'Đang hoạt động', variant: 'success' },
  { value: 'draft', label: 'Bản nháp', variant: 'secondary' },
  { value: 'completed', label: 'Đã kết thúc (Khóa)', variant: 'outline' },
  { value: 'archived', label: 'Lưu trữ (Đã khóa)', variant: 'outline' },
];

export const TERM_MEMBER_STATUS_OPTIONS: {
  value: TermMemberStatus;
  label: string;
  variant: 'default' | 'secondary' | 'success' | 'warning' | 'outline';
}[] = [
  { value: 'active', label: 'Đang sinh hoạt', variant: 'success' },
  { value: 'leave', label: 'Tạm nghỉ', variant: 'warning' },
  { value: 'completed', label: 'Hoàn thành nhiệm kỳ', variant: 'outline' },
  { value: 'resigned', label: 'Thôi sinh hoạt', variant: 'secondary' },
];

export const COMMON_TERM_POSITIONS = [
  'Hội viên',
  'Chi hội trưởng',
  'Chi hội phó',
  'Ủy viên Ban Chấp hành',
  'Trưởng ban Học tập & Nghiên cứu',
  'Trưởng ban Phong trào & Tình nguyện',
  'Trưởng ban Truyền thông & Sự kiện',
  'Trưởng ban Đối ngoại',
  'Trưởng ban Thủ quỹ & Hậu cần',
  'Cộng tác viên',
];

export const COMMON_TERM_DEPARTMENTS = [
  'Ban Chấp hành',
  'Ban Phong trào',
  'Ban Học tập',
  'Ban Truyền thông',
  'Ban Đối ngoại',
  'Ban Hậu cần & Tài chính',
  'Ban Tổ chức',
];

// ============================================================================
// Phase 3.3.4: Term Closing Checklist & Snapshot Types
// ============================================================================

export interface TermClosingIssue {
  id: string;
  type: 'activity' | 'task' | 'finance' | 'attendance' | 'member' | 'general';
  severity: 'blocking' | 'warning';
  title: string;
  description: string;
  count?: number;
  items?: Array<{ id: string; title: string; status?: string }>;
}

export interface TermClosingStats {
  members: {
    total: number;
    active: number;
    leave: number;
    completed: number;
    resigned: number;
  };
  activities: {
    total: number;
    completed: number;
    cancelled: number;
    inProgressOrDraft: number;
  };
  tasks: {
    total: number;
    completed: number;
    cancelled: number;
    open: number;
  };
  finance: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
  };
  attendance: {
    totalRegistrations: number;
    totalPresent: number;
    totalAbsent: number;
    totalExcused: number;
    participationRate: number;
  };
}

export interface TermClosingChecklistResult {
  ready: boolean;
  blockingIssues: TermClosingIssue[];
  warnings: TermClosingIssue[];
  stats: TermClosingStats;
  canOverride: boolean;
}

export interface TermClosingSnapshot {
  termId: string;
  termName: string;
  organizationId: string;
  startDate: string;
  endDate: string;
  closedAt: string;
  closedBy?: string | null;
  closedByName?: string | null;
  isOverridden?: boolean;
  overrideReason?: string | null;
  handoverNotes?: string | null;
  stats: TermClosingStats;
  membersRoster: Array<{
    memberId: string;
    fullName: string;
    studentId?: string | null;
    position: string;
    department?: string | null;
    status: string;
    className?: string | null;
  }>;
  activitiesList: Array<{
    id: string;
    code?: string | null;
    title: string;
    category: string;
    status: string;
    startDate: string;
    endDate: string;
    participantCount?: number;
  }>;
  financeSummary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
  };
  generatedAt: string;
}

export interface CloseTermParams {
  termId: string;
  organizationId: string;
  actorUserId?: string;
  isOverridden?: boolean;
  overrideReason?: string;
  handoverNotes?: string;
}

export interface HandoverParams {
  sourceTermId: string;
  targetTermId: string;
  memberIds: string[];
  organizationId: string;
  actorUserId?: string;
  notes?: string;
}
