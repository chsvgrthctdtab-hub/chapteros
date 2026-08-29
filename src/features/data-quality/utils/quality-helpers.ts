import type { DataQualityCategory, DataQualitySeverity, DataQualityEntityType } from '../types';
import {
  Users,
  CalendarRange,
  CalendarCheck,
  CheckSquare,
  Wallet,
  FolderArchive,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeClass: string;
  route: string;
}

export const CATEGORY_META: Record<DataQualityCategory, CategoryMeta> = {
  members: {
    label: 'Hội viên',
    icon: Users,
    color: '#2563eb', // blue-600
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    route: '/members',
  },
  terms: {
    label: 'Nhiệm kỳ',
    icon: CalendarRange,
    color: '#059669', // emerald-600
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    route: '/terms',
  },
  activities: {
    label: 'Hoạt động',
    icon: CalendarCheck,
    color: '#7c3aed', // violet-600
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    route: '/activities',
  },
  tasks: {
    label: 'Công việc',
    icon: CheckSquare,
    color: '#d97706', // amber-600
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    route: '/tasks',
  },
  finance: {
    label: 'Tài chính',
    icon: Wallet,
    color: '#0d9488', // teal-600
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    route: '/finance',
  },
  documents: {
    label: 'Tài liệu',
    icon: FolderArchive,
    color: '#ea580c', // orange-600
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    route: '/documents',
  },
  system: {
    label: 'Hệ thống',
    icon: ShieldCheck,
    color: '#475569', // slate-600
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    route: '/settings',
  },
};

export interface SeverityMeta {
  label: string;
  icon: LucideIcon;
  color: string;
  badgeClass: string;
  pillBg: string;
  pillText: string;
  borderClass: string;
}

export const SEVERITY_META: Record<DataQualitySeverity, SeverityMeta> = {
  critical: {
    label: 'Nghiêm trọng',
    icon: AlertTriangle,
    color: '#e11d48', // rose-600
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    pillBg: 'bg-rose-500',
    pillText: 'text-rose-700',
    borderClass: 'border-rose-300 hover:border-rose-400',
  },
  warning: {
    label: 'Cần chú ý',
    icon: AlertCircle,
    color: '#d97706', // amber-600
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    pillBg: 'bg-amber-500',
    pillText: 'text-amber-700',
    borderClass: 'border-amber-300 hover:border-amber-400',
  },
  info: {
    label: 'Thông tin',
    icon: Info,
    color: '#0284c7', // sky-600
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    pillBg: 'bg-sky-500',
    pillText: 'text-sky-700',
    borderClass: 'border-sky-300 hover:border-sky-400',
  },
};

export function formatVietnameseDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'Chưa ghi nhận';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'Vừa xong';
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  } catch {
    return '';
  }
}

export function getEntityDisplayName(type: DataQualityEntityType): string {
  const map: Record<DataQualityEntityType, string> = {
    member: 'Hội viên',
    term: 'Nhiệm kỳ',
    activity: 'Hoạt động',
    task: 'Công việc',
    finance: 'Tài chính',
    document: 'Tài liệu',
    system: 'Hệ thống',
  };
  return map[type] || type;
}
