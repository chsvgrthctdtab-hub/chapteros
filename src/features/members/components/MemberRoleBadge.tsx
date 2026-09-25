import { Award, ShieldAlert, Shield, UserCheck, User } from 'lucide-react';

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

    let badgeClasses = 'bg-[#e6f0ff] text-signal-blue border-[#d4e4fa]';
    let Icon = Award;

    if (isLeader) {
      badgeClasses = 'bg-[#e6f0ff] text-signal-blue border-[#d4e4fa] font-bold';
      Icon = ShieldAlert;
    } else if (isDeputy) {
      badgeClasses = 'bg-[#e6f0ff] text-signal-blue border-[#d4e4fa] font-semibold';
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
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-xs whitespace-nowrap shrink-0 ${badgeClasses} ${className}`}
        title={`Ban Chấp Hành: ${roleTitle}${department ? ` (${department})` : ''}`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate max-w-[130px] whitespace-nowrap">{roleTitle}</span>
      </span>
    );
  }

  // CTV (Collaborator)
  if (roleTitle.toLowerCase().includes('ctv') || roleTitle.toLowerCase().includes('cộng tác viên')) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap shrink-0 ${className}`}
      >
        <User className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        <span className="whitespace-nowrap">{roleTitle}</span>
      </span>
    );
  }

  // Regular Member
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-slate-gray border border-hairline shadow-xs whitespace-nowrap shrink-0 ${className}`}
    >
      <User className="h-3.5 w-3.5 shrink-0 text-mist-gray" />
      <span className="whitespace-nowrap">{roleTitle}</span>
    </span>
  );
}
