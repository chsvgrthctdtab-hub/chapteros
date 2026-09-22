import { TASK_STATUSES, type TaskStatus } from '../types/task.types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export function TaskStatusBadge({ status, className = '', size = 'sm' }: TaskStatusBadgeProps) {
  const { t } = useLanguage();
  const config = TASK_STATUSES[status] || TASK_STATUSES.todo;

  const sizeClasses =
    size === 'sm' ? 'px-2.5 py-0.5 text-[11px] gap-1.5' : 'px-3 py-1 text-xs gap-1.5 font-medium';

  // Specific semantic color pairings (subtle, non-neon, Calendly marble style)
  let statusStyles = 'bg-cloud text-ink-navy border-hairline';
  let dotStyles = 'bg-mist-gray';

  switch (status) {
    case 'todo':
      statusStyles = 'bg-cloud text-slate-gray border-hairline';
      dotStyles = 'bg-mist-gray';
      break;
    case 'in_progress':
      statusStyles = 'bg-[#e6f0ff] text-signal-blue border-[#d4e4fa]';
      dotStyles = 'bg-signal-blue';
      break;
    case 'in_review':
      statusStyles = 'bg-amber-50 text-amber-800 border-amber-200/80';
      dotStyles = 'bg-amber-500';
      break;
    case 'completed':
      statusStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      dotStyles = 'bg-emerald-600';
      break;
    case 'cancelled':
      statusStyles = 'bg-rose-50 text-rose-700 border-rose-200/80';
      dotStyles = 'bg-rose-400';
      break;
  }

  const localizedLabel = t(`task.status.${status}`, config.label);

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border shrink-0 select-none transition-colors tabular-nums',
        statusStyles,
        sizeClasses,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotStyles)} />
      <span className="whitespace-nowrap">{localizedLabel}</span>
    </span>
  );
}
