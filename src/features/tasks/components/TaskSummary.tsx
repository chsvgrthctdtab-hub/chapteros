import {
  ListTodo,
  Clock,
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { TaskStats } from '../types/task.types';
import { cn } from '@/lib/utils';

interface TaskSummaryProps {
  stats: TaskStats;
  currentStatusFilter?: string;
  isOverdueFilterActive?: boolean;
  onSelectStatusFilter: (status: string) => void;
  onToggleOverdueFilter: () => void;
}

export function TaskSummary({
  stats,
  currentStatusFilter = 'all',
  isOverdueFilterActive = false,
  onSelectStatusFilter,
  onToggleOverdueFilter,
}: TaskSummaryProps) {
  const items = [
    {
      id: 'all',
      label: 'Tổng công việc',
      vnLabel: 'Tổng công việc',
      value: stats.total,
      subtext: `${stats.todo} chưa bắt đầu`,
      icon: ListTodo,
      isActive: currentStatusFilter === 'all' && !isOverdueFilterActive,
      onClick: () => onSelectStatusFilter('all'),
      accentColor: 'text-ink-navy',
      badgeColor: 'bg-cloud text-ink-navy border-hairline',
    },
    {
      id: 'in_progress',
      label: 'Đang thực hiện',
      vnLabel: 'Đang thực hiện',
      value: stats.inProgress,
      subtext: 'Đang triển khai',
      icon: Clock,
      isActive: currentStatusFilter === 'in_progress' && !isOverdueFilterActive,
      onClick: () => onSelectStatusFilter('in_progress'),
      accentColor: 'text-signal-blue',
      badgeColor: 'bg-[#e6f0ff] text-signal-blue border-[#d4e4fa]',
    },
    {
      id: 'in_review',
      label: 'Chờ duyệt',
      vnLabel: 'Chờ duyệt',
      value: stats.inReview,
      subtext: 'Cần nghiệm thu',
      icon: CheckSquare,
      isActive: currentStatusFilter === 'in_review' && !isOverdueFilterActive,
      onClick: () => onSelectStatusFilter('in_review'),
      accentColor: 'text-amber-700',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/80',
    },
    {
      id: 'completed',
      label: 'Đã hoàn thành',
      vnLabel: 'Đã hoàn thành',
      value: stats.completed,
      subtext: `${stats.completionRate}% tỉ lệ`,
      icon: CheckCircle2,
      isActive: currentStatusFilter === 'completed' && !isOverdueFilterActive,
      onClick: () => onSelectStatusFilter('completed'),
      accentColor: 'text-emerald-700',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    },
    {
      id: 'overdue',
      label: 'Quá hạn',
      vnLabel: 'Quá hạn',
      value: stats.overdue,
      subtext: stats.overdue > 0 ? 'Cần xử lý gấp' : 'Không có trễ hạn',
      icon: AlertTriangle,
      isActive: isOverdueFilterActive,
      onClick: onToggleOverdueFilter,
      accentColor: stats.overdue > 0 ? 'text-rose-600' : 'text-slate-gray',
      badgeColor: stats.overdue > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-cloud text-slate-gray border-hairline',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isSelected = item.isActive;

        return (
          <button
            key={item.id}
            type="button"
            id={`task-summary-${item.id}`}
            onClick={item.onClick}
            className={cn(
              'group relative flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs active:scale-[0.98]',
              isSelected
                ? 'bg-[#e6f0ff]/50 border-signal-blue ring-1 ring-signal-blue/20 shadow-xs'
                : 'bg-white border-hairline hover:border-slate-gray/40 hover:bg-cloud hover:shadow-xs'
            )}
          >
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider truncate group-hover:text-ink-navy">
                  {item.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={cn('text-base sm:text-xl font-bold tracking-tight leading-none tabular-nums', item.accentColor)}>
                  {item.value}
                </span>
                <span className="text-[11px] text-slate-gray font-normal truncate hidden sm:inline tabular-nums">
                  {item.subtext}
                </span>
              </div>
            </div>

            <div
              className={cn(
                'w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors shadow-xs',
                item.badgeColor
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
