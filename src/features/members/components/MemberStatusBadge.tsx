import React from 'react';
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
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
    description: '',
  };

  // Status dot indicators for extra visual clarity
  const dotColor =
    status === 'active'
      ? 'bg-emerald-500'
      : status === 'alumni'
      ? 'bg-indigo-500'
      : 'bg-slate-400';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border shadow-2xs ${config.colorClasses.bg} ${config.colorClasses.text} ${config.colorClasses.border} ${className}`}
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
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
    description: '',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${config.colorClasses.bg} ${config.colorClasses.text} ${config.colorClasses.border} ${className}`}
      title={config.description || config.label}
    >
      {config.label}
    </span>
  );
}
