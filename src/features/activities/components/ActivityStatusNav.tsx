import React from 'react';
import {
  ListFilter,
  Clock,
  Send,
  Flame,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityStatus } from '@/types';
import { cn } from '@/lib/utils';

export interface ActivityStatusCount {
  all: number;
  planning: number;
  published: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

interface ActivityStatusNavProps {
  currentStatus: ActivityStatus | 'all';
  onSelectStatus: (status: ActivityStatus | 'all') => void;
  counts?: Partial<ActivityStatusCount>;
}

interface NavItem {
  id: ActivityStatus | 'all';
  label: string;
  vnLabel: string;
  icon: LucideIcon;
  color: string;
  activeColor: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'all',
    label: 'Tất cả',
    vnLabel: 'Tất cả',
    icon: ListFilter,
    color: 'text-slate-600',
    activeColor: 'bg-slate-900 text-white border-slate-900 shadow-2xs',
  },
  {
    id: 'draft',
    label: 'Kế hoạch',
    vnLabel: 'Kế hoạch',
    icon: Clock,
    color: 'text-amber-700',
    activeColor: 'bg-amber-700 text-white border-amber-700 shadow-2xs',
  },
  {
    id: 'published',
    label: 'Đã công bố',
    vnLabel: 'Đã công bố',
    icon: Send,
    color: 'text-sky-700',
    activeColor: 'bg-sky-700 text-white border-sky-700 shadow-2xs',
  },
  {
    id: 'in_progress',
    label: 'Đang diễn ra',
    vnLabel: 'Đang diễn ra',
    icon: Flame,
    color: 'text-emerald-700',
    activeColor: 'bg-emerald-700 text-white border-emerald-700 shadow-2xs',
  },
  {
    id: 'completed',
    label: 'Hoàn thành',
    vnLabel: 'Hoàn thành',
    icon: CheckCircle2,
    color: 'text-blue-700',
    activeColor: 'bg-blue-700 text-white border-blue-700 shadow-2xs',
  },
  {
    id: 'cancelled',
    label: 'Đã hủy',
    vnLabel: 'Đã hủy',
    icon: XCircle,
    color: 'text-rose-700',
    activeColor: 'bg-rose-700 text-white border-rose-700 shadow-2xs',
  },
];

export function ActivityStatusNav({
  currentStatus,
  onSelectStatus,
  counts,
}: ActivityStatusNavProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentStatus === item.id;
        const count = counts ? counts[item.id as keyof ActivityStatusCount] : undefined;

        return (
          <button
            key={item.id}
            id={`activity-status-nav-${item.id}`}
            type="button"
            onClick={() => onSelectStatus(item.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap cursor-pointer shrink-0',
              isActive
                ? item.activeColor
                : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
            )}
          >
            <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-white' : item.color)} />
            <span>{item.label}</span>
            {count !== undefined && (
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
