import { REGISTRATION_STATUSES, ATTENDANCE_STATUSES } from '../types/activity.types';
import type { RegistrationStatus, AttendanceStatus } from '@/types';

export function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  const config = REGISTRATION_STATUSES[status] || {
    key: status,
    label: status,
    badgeVariant: 'secondary',
    colorClasses: {
      bg: 'bg-cloud',
      text: 'text-ink-navy',
      border: 'border-hairline',
    },
    description: '',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tabular-nums ${config.colorClasses.bg} ${config.colorClasses.text} ${config.colorClasses.border}`}
      title={config.description || config.label}
    >
      {config.label}
    </span>
  );
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const config = ATTENDANCE_STATUSES[status] || {
    key: status,
    label: status,
    badgeVariant: 'secondary',
    colorClasses: {
      bg: 'bg-cloud',
      text: 'text-ink-navy',
      border: 'border-hairline',
    },
    description: '',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tabular-nums ${config.colorClasses.bg} ${config.colorClasses.text} ${config.colorClasses.border}`}
      title={config.description || config.label}
    >
      {config.label}
    </span>
  );
}
