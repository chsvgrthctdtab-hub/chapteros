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
    color: 'text-slate-gray',
    activeColor: 'bg-signal-blue text-white border-signal-blue shadow-sm',
  },
  {
    id: 'draft',
    label: 'Kế hoạch',
    vnLabel: 'Kế hoạch',
    icon: Clock,
    color: 'text-amber-700',
    activeColor: 'bg-amber-700 text-white border-amber-700 shadow-sm',
  },
  {
    id: 'published',
    label: 'Đã công bố',
    vnLabel: 'Đã công bố',
    icon: Send,
    color: 'text-signal-blue',
    activeColor: 'bg-signal-blue text-white border-signal-blue shadow-sm',
  },
  {
    id: 'in_progress',
    label: 'Đang diễn ra',
    vnLabel: 'Đang diễn ra',
    icon: Flame,
    color: 'text-emerald-700',
    activeColor: 'bg-emerald-700 text-white border-emerald-700 shadow-sm',
  },
  {
    id: 'completed',
    label: 'Hoàn thành',
    vnLabel: 'Hoàn thành',
    icon: CheckCircle2,
    color: 'text-signal-blue',
    activeColor: 'bg-signal-blue text-white border-signal-blue shadow-sm',
  },
  {
    id: 'cancelled',
    label: 'Đã hủy',
    vnLabel: 'Đã hủy',
    icon: XCircle,
    color: 'text-rose-700',
    activeColor: 'bg-rose-700 text-white border-rose-700 shadow-sm',
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
                : 'bg-white text-slate-gray border-hairline hover:bg-pebble hover:text-ink-navy hover:border-mist-gray'
            )}
          >
            <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-white' : item.color)} />
            <span>{item.label}</span>
            {count !== undefined && (
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-pebble text-slate-gray group-hover:bg-cloud'
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
