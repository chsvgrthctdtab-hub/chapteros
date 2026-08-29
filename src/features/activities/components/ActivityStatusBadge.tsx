import { ACTIVITY_STATUSES, type StatusConfig } from '../types/activity.types';
import type { ActivityStatus } from '@/types';

export function ActivityStatusBadge({
  status,
  showDot = true,
  className = '',
}: {
  status: ActivityStatus;
  showDot?: boolean;
  className?: string;
}) {
  const config: StatusConfig<ActivityStatus> = ACTIVITY_STATUSES[status] || {
    key: status,
    label: status,
    badgeVariant: 'secondary',
    colorClasses: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
    description: '',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.colorClasses.bg} ${config.colorClasses.text} ${config.colorClasses.border} ${className}`}
      title={config.description || config.label}
    >
      {showDot && config.colorClasses.dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.colorClasses.dot}`} />
      )}
      <span>{config.label}</span>
    </span>
  );
}
