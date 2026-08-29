import React from 'react';
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
  const { t, language } = useLanguage();
  const config = TASK_PRIORITIES[priority] || TASK_PRIORITIES.medium;

  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-0.5 text-xs gap-1.5 font-medium';

  // Subtle semantic styling: Low (slate), Medium (blue/slate), High (amber), Urgent (rose)
  let priorityStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  let iconColor = 'text-slate-400';

  switch (priority) {
    case 'low':
      priorityStyles = 'bg-slate-50 text-slate-600 border-slate-200';
      iconColor = 'text-slate-400';
      break;
    case 'medium':
      priorityStyles = 'bg-blue-50/70 text-blue-700 border-blue-200/70';
      iconColor = 'text-blue-500';
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
        'inline-flex items-center font-medium rounded-md border shrink-0 select-none transition-colors',
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

