import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

/**
 * Format currency to Vietnamese Dong standard format (e.g., 1.500.000 ₫)
 */
export function formatVND(amount: number | null | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 ₫';
  }
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('vi-VN')} ₫`;
}

/**
 * Format date time with Day.js
 */
export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'Chưa xác định';
  return dayjs(dateStr).format('HH:mm - DD/MM/YYYY');
}

/**
 * Format short date (DD/MM/YYYY)
 */
export function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return 'Chưa xác định';
  return dayjs(dateStr).format('DD/MM/YYYY');
}

/**
 * Relative time from now in Vietnamese
 */
export function formatFromNow(dateStr?: string | null): string {
  if (!dateStr) return '';
  return dayjs(dateStr).fromNow();
}

/**
 * Calculate overdue days
 */
export function calculateDaysOverdue(dueDateStr: string): number {
  const due = dayjs(dueDateStr);
  const now = dayjs();
  const diffDays = now.diff(due, 'day');
  return Math.max(1, diffDays);
}

/**
 * Task priority styling & label
 */
export const TASK_PRIORITY_META: Record<
  string,
  { label: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'; colorClass: string; bgClass: string }
> = {
  urgent: {
    label: 'Khẩn cấp',
    badgeVariant: 'destructive',
    colorClass: 'text-rose-700 font-semibold',
    bgClass: 'bg-rose-50 border-rose-200 text-rose-700',
  },
  high: {
    label: 'Cao',
    badgeVariant: 'destructive',
    colorClass: 'text-amber-700 font-medium',
    bgClass: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  medium: {
    label: 'Trung bình',
    badgeVariant: 'secondary',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  low: {
    label: 'Thấp',
    badgeVariant: 'outline',
    colorClass: 'text-slate-600',
    bgClass: 'bg-slate-50 border-slate-200 text-slate-600',
  },
};

/**
 * Task status label & colors
 */
export const TASK_STATUS_META: Record<
  string,
  { label: string; colorClass: string; bgClass: string }
> = {
  todo: {
    label: 'Cần làm',
    colorClass: 'text-slate-700',
    bgClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  in_progress: {
    label: 'Đang làm',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  in_review: {
    label: 'Đang duyệt',
    colorClass: 'text-purple-700',
    bgClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  completed: {
    label: 'Hoàn thành',
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  cancelled: {
    label: 'Đã hủy',
    colorClass: 'text-slate-400',
    bgClass: 'bg-slate-50 text-slate-400 border-slate-200',
  },
};

/**
 * Activity status label & colors
 */
export const ACTIVITY_STATUS_META: Record<
  string,
  { label: string; colorClass: string; bgClass: string }
> = {
  draft: {
    label: 'Nháp',
    colorClass: 'text-slate-600',
    bgClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  planning: {
    label: 'Lập kế hoạch',
    colorClass: 'text-indigo-700',
    bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  published: {
    label: 'Sắp diễn ra',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  in_progress: {
    label: 'Đang diễn ra',
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  completed: {
    label: 'Đã hoàn thành',
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  cancelled: {
    label: 'Đã hủy',
    colorClass: 'text-rose-600',
    bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

/**
 * Activity category Vietnamese labels
 */
export const ACTIVITY_CATEGORY_META: Record<string, string> = {
  general: 'Chung / Phong trào',
  volunteer: 'Tình nguyện / Xã hội',
  academic: 'Học thuật / Hội thảo',
  sports: 'Thể dục Thể thao',
  culture: 'Văn hóa Văn nghệ',
  meeting: 'Hội nghị / Đại hội',
  training: 'Tập huấn Kỹ năng',
};
