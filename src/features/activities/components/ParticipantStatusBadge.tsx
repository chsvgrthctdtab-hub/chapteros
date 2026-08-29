import { REGISTRATION_STATUSES, ATTENDANCE_STATUSES } from '../types/activity.types';
import type { RegistrationStatus, AttendanceStatus } from '@/types';

export function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  const config = REGISTRATION_STATUSES[status] || {
    key: status,
    label: status,
    badgeVariant: 'secondary',
    colorClasses: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
    description: '',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${config.colorClasses.bg} ${config.colorClasses.text} ${config.colorClasses.border}`}
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
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
    description: '',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${config.colorClasses.bg} ${config.colorClasses.text} ${config.colorClasses.border}`}
      title={config.description || config.label}
    >
      {config.label}
    </span>
  );
}
