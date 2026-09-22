import { MEMBER_STATUSES, TERM_MEMBER_STATUSES } from '../types/member.types';
import type { MemberStatus, TermMemberStatus } from '@/types/database.types';

export function MemberStatusBadge({
  status,
  className = '',
}: {
  status: MemberStatus;
  className?: string;
}) {
  const config = MEMBER_STATUSES[status] || {
    label: status,
    badgeVariant: 'secondary',
    colorClasses: {
      bg: 'bg-cloud',
      text: 'text-slate-gray',
      border: 'border-hairline',
    },
    description: '',
  };

  // Status dot indicators for extra visual clarity
  const dotColor =
    status === 'active'
      ? 'bg-emerald-500'
      : status === 'alumni'
      ? 'bg-signal-blue'
      : 'bg-mist-gray';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-xs tabular-nums ${config.colorClasses.bg} ${config.colorClasses.text} ${config.colorClasses.border} ${className}`}
      title={config.description || config.label}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span className="truncate">{config.label}</span>
    </span>
  );
}

export function TermMemberStatusBadge({
  status,
  className = '',
}: {
  status: TermMemberStatus;
  className?: string;
}) {
  const config = TERM_MEMBER_STATUSES[status] || {
    label: status,
    badgeVariant: 'secondary',
    colorClasses: {
      bg: 'bg-cloud',
      text: 'text-slate-gray',
      border: 'border-hairline',
    },
    description: '',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border tabular-nums ${config.colorClasses.bg} ${config.colorClasses.text} ${config.colorClasses.border} ${className}`}
      title={config.description || config.label}
    >
      {config.label}
    </span>
  );
}
