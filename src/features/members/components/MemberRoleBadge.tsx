import React from 'react';
import { Shield, ShieldAlert, Award, UserCheck, User } from 'lucide-react';

interface MemberRoleBadgeProps {
  position?: string | null;
  department?: string | null;
  className?: string;
}

export function isExecutiveBoard(position?: string | null, department?: string | null): boolean {
  if (!position && !department) return false;
  const p = (position || '').toLowerCase();
  const d = (department || '').toLowerCase();

  const boardKeywords = [
    'trưởng',
    'phó',
    'bch',
    'chấp hành',
    'thủ quỹ',
    'thư ký',
    'leader',
    'deputy',
    'treasurer',
    'secretary',
    'admin',
    'ủy viên',
  ];

  return boardKeywords.some((kw) => p.includes(kw) || d.includes(kw));
}

export function MemberRoleBadge({ position, department, className = '' }: MemberRoleBadgeProps) {
  const roleTitle = position?.trim() || 'Hội viên';
  const isBoard = isExecutiveBoard(position, department);

  if (isBoard) {
    const isLeader = roleTitle.toLowerCase().includes('trưởng') || roleTitle.toLowerCase().includes('leader');
    const isDeputy = roleTitle.toLowerCase().includes('phó') || roleTitle.toLowerCase().includes('deputy');
    const isFinance = roleTitle.toLowerCase().includes('thủ quỹ') || roleTitle.toLowerCase().includes('treasurer');
    const isSecretary = roleTitle.toLowerCase().includes('thư ký') || roleTitle.toLowerCase().includes('secretary');

    let badgeClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
    let Icon = Award;

    if (isLeader) {
      badgeClasses = 'bg-blue-50 text-blue-700 border-blue-200/90 font-semibold';
      Icon = ShieldAlert;
    } else if (isDeputy) {
      badgeClasses = 'bg-sky-50 text-sky-700 border-sky-200/90 font-semibold';
      Icon = Shield;
    } else if (isFinance) {
      badgeClasses = 'bg-amber-50 text-amber-800 border-amber-200/90 font-semibold';
      Icon = Award;
    } else if (isSecretary) {
      badgeClasses = 'bg-teal-50 text-teal-800 border-teal-200/90 font-semibold';
      Icon = UserCheck;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border shadow-2xs ${badgeClasses} ${className}`}
        title={`Ban Chấp Hành: ${roleTitle}${department ? ` (${department})` : ''}`}
      >
        <Icon className="h-3 w-3 shrink-0" />
        <span className="truncate max-w-[130px]">{roleTitle}</span>
      </span>
    );
  }

  // CTV (Collaborator)
  if (roleTitle.toLowerCase().includes('ctv') || roleTitle.toLowerCase().includes('cộng tác viên')) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80 ${className}`}
      >
        <User className="h-3 w-3 shrink-0 text-amber-500" />
        <span>{roleTitle}</span>
      </span>
    );
  }

  // Regular Member
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80 ${className}`}
    >
      <User className="h-3 w-3 shrink-0 text-slate-400" />
      <span>{roleTitle}</span>
    </span>
  );
}
