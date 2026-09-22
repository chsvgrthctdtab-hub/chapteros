import { Flag } from 'lucide-react';
import { TASK_PRIORITIES, type TaskPriority } from '../types/task.types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function TaskPriorityBadge({
  priority,
  showIcon = true,
  className = '',
  size = 'sm',
}: TaskPriorityBadgeProps) {
  const { t } = useLanguage();
  const config = TASK_PRIORITIES[priority] || TASK_PRIORITIES.medium;

  const sizeClasses =
    size === 'sm' ? 'px-2.5 py-0.5 text-[11px] gap-1' : 'px-3 py-0.5 text-xs gap-1.5 font-medium';

  // Subtle semantic styling: Low (cloud), Medium (soft blue), High (amber), Urgent (rose)
  let priorityStyles = 'bg-cloud text-slate-gray border-hairline';
  let iconColor = 'text-mist-gray';

  switch (priority) {
    case 'low':
      priorityStyles = 'bg-cloud text-slate-gray border-hairline';
      iconColor = 'text-mist-gray';
      break;
    case 'medium':
      priorityStyles = 'bg-[#e6f0ff]/70 text-signal-blue border-[#d4e4fa]';
      iconColor = 'text-signal-blue';
      break;
    case 'high':
      priorityStyles = 'bg-amber-50 text-amber-800 border-amber-200/80';
      iconColor = 'text-amber-600';
      break;
    case 'urgent':
      priorityStyles = 'bg-rose-50 text-rose-700 border-rose-200/80';
      iconColor = 'text-rose-600';
      break;
  }

  const localizedLabel = t(`task.priority.${priority}`, config.label);

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border shrink-0 select-none transition-colors tabular-nums',
        priorityStyles,
        sizeClasses,
        className
      )}
    >
      {showIcon && <Flag className={cn('w-3 h-3 shrink-0', iconColor)} />}
      <span className="whitespace-nowrap">{localizedLabel}</span>
    </span>
  );
}
