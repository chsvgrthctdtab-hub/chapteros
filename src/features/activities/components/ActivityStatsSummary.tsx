import React from 'react';
import { CalendarDays, Flame, CheckCircle2, Clock, Users } from 'lucide-react';
import type { ActivityListItem } from '../types/activity.types';
import type { ActivityStatus } from '@/types';
import { cn } from '@/lib/utils';

interface ActivityStatsSummaryProps {
  activities: ActivityListItem[];
  totalCount: number;
  currentStatusFilter?: ActivityStatus | 'all';
  onSelectStatus?: (status: ActivityStatus | 'all') => void;
}

export function ActivityStatsSummary({
  activities,
  totalCount,
  currentStatusFilter = 'all',
  onSelectStatus,
}: ActivityStatsSummaryProps) {
  const ongoingCount = activities.filter((a) => a.status === 'in_progress').length;
  const planningCount = activities.filter((a) => a.status === 'planning' || a.status === 'published').length;
  const completedCount = activities.filter((a) => a.status === 'completed').length;

  const stats = [
    {
      id: 'stat-total',
      statusTarget: 'all' as const,
      label: 'Tổng hoạt động',
      value: totalCount,
      icon: CalendarDays,
      accent: 'text-slate-900',
      badgeBg: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'stat-ongoing',
      statusTarget: 'in_progress' as const,
      label: 'Đang diễn ra',
      value: ongoingCount,
      icon: Flame,
      accent: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    },
    {
      id: 'stat-planning',
      statusTarget: 'planning' as const,
      label: 'Kế hoạch / Mở ĐK',
      value: planningCount,
      icon: Clock,
      accent: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
    },
    {
      id: 'stat-completed',
      statusTarget: 'completed' as const,
      label: 'Đã hoàn thành',
      value: completedCount,
      icon: CheckCircle2,
      accent: 'text-blue-700',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200/80',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((item) => {
        const Icon = item.icon;
        const isClickable = Boolean(onSelectStatus && item.statusTarget !== null);
        const isSelected = item.statusTarget !== null && currentStatusFilter === item.statusTarget;

        return (
          <div
            key={item.id}
            id={item.id}
            onClick={() => {
              if (isClickable && item.statusTarget && onSelectStatus) {
                onSelectStatus(item.statusTarget);
              }
            }}
            className={cn(
              'bg-white p-3.5 rounded-xl border transition-all flex flex-col justify-between shadow-2xs',
              isClickable ? 'cursor-pointer hover:border-slate-300 hover:shadow-xs' : '',
              isSelected
                ? 'border-emerald-600 ring-1 ring-emerald-600/30'
                : 'border-slate-200/90'
            )}
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 truncate">{item.label}</span>
              <div className={cn('p-1 rounded-md border shrink-0', item.badgeBg)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className={cn('text-xl font-bold tracking-tight', item.accent)}>
              {item.value.toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}
