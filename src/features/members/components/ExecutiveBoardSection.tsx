import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Mail,
  GraduationCap,
  Phone,
  Search,
  Shield,
  Award,
  UserCheck,
  Copy,
  Check,
  UserCog,
} from '@/lib/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ROLES, getRoleLabel, getOrgBoardTitle, type OrganizationRole } from '@/types/roles';
import { useLanguage } from '@/contexts/LanguageContext';
import type { OrganizationMembership, Member } from '@/types';

export interface UnifiedBoardOfficer {
  id: string;
  fullName: string;
  email?: string | null;
  studentId?: string | null;
  phone?: string | null;
  className?: string | null;
  major?: string | null;
  avatarUrl?: string | null;
  role: OrganizationRole;
  positionLabel: string;
  hasSystemAccount: boolean;
  memberId?: string;
  userId?: string | null;
  member?: Member;
  membership?: OrganizationMembership;
  orderWeight: number;
}

interface ExecutiveBoardSectionProps {
  memberships?: OrganizationMembership[];
  members?: Member[];
  organizationName?: string;
  organizationCode?: string;
  organizationType?: string | null;
  isLoading?: boolean;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  canManage?: boolean;
  onManageMemberships?: () => void;
  onViewDetail?: (member: Member) => void;
  onEdit?: (member: Member) => void;
  children?: React.ReactNode;
}

export function ExecutiveBoardSection({
  memberships = [],
  members = [],
  organizationName,
  organizationCode,
  organizationType,
  isLoading = false,
  searchTerm = '',
  onSearchChange,
  canManage = false,
  onManageMemberships,
  onViewDetail,
  onEdit,
  children,
}: ExecutiveBoardSectionProps) {
  const { t, language } = useLanguage();
  const [localSearch, setLocalSearch] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const effectiveSearch = onSearchChange !== undefined ? searchTerm : localSearch;

  const helperInferredRole = (position?: string | null): OrganizationRole => {
    const p = (position || '').toLowerCase();
    if (p.includes('trưởng') || p.includes('chủ nhiệm') || p.includes('đội trưởng') || p.includes('leader')) return 'leader';
    if (p.includes('phó') || p.includes('deputy')) return 'deputy';
    if (p.includes('thủ quỹ') || p.includes('thu quy') || p.includes('treasurer')) return 'treasurer';
    if (p.includes('thư ký') || p.includes('thu ky') || p.includes('secretary')) return 'secretary';
    if (p.includes('admin') || p.includes('quản trị') || p.includes('quan tri')) return 'admin';
    return 'secretary';
  };

  const getRoleWeight = (role: OrganizationRole): number => {
    switch (role) {
      case 'admin': return 1;
      case 'leader': return 2;
      case 'deputy': return 3;
      case 'treasurer': return 4;
      case 'secretary': return 5;
      default: return 6;
    }
  };

  // Merge members roster and memberships into a unified list
  const unifiedOfficers = useMemo(() => {
    const boardRoles: OrganizationRole[] = ['admin', 'leader', 'deputy', 'treasurer', 'secretary'];
    const validMemberships = (memberships || []).filter((m) => boardRoles.includes(m.role));

    const matchedMembershipIds = new Set<string>();
    const officers: UnifiedBoardOfficer[] = [];

    // 1. Process members roster
    for (const m of members) {
      const matchedMem = validMemberships.find((mem) => {
        if (m.userId && mem.userId === m.userId) return true;
        if (m.email && mem.profile?.email && m.email.trim().toLowerCase() === mem.profile.email.trim().toLowerCase()) return true;
        if (m.studentId && mem.profile?.studentId && m.studentId.trim() === mem.profile.studentId.trim()) return true;
        return false;
      });

      if (matchedMem) {
        matchedMembershipIds.add(matchedMem.id);
      }

      const role = matchedMem?.role || helperInferredRole(m.position);
      const positionLabel = m.position || getRoleLabel(role, language, organizationType);

      officers.push({
        id: m.id,
        fullName: m.fullName || matchedMem?.profile?.fullName || 'Cán bộ BCH',
        email: m.email || matchedMem?.profile?.email || null,
        studentId: m.studentId || matchedMem?.profile?.studentId || null,
        phone: m.phone || matchedMem?.profile?.phone || null,
        className: m.className || null,
        major: m.major || null,
        avatarUrl: matchedMem?.profile?.avatarUrl || null,
        role,
        positionLabel,
        hasSystemAccount: !!matchedMem || !!m.userId,
        memberId: m.id,
        userId: matchedMem?.userId || m.userId || null,
        member: m,
        membership: matchedMem,
        orderWeight: getRoleWeight(role),
      });
    }

    // 2. Add remaining memberships not linked to a roster member
    for (const mem of validMemberships) {
      if (matchedMembershipIds.has(mem.id)) continue;

      const role = mem.role;
      const positionLabel = getRoleLabel(role, language, organizationType);
      const fullName = mem.profile?.fullName || mem.profile?.email?.split('@')[0] || 'Cán bộ BCH';

      officers.push({
        id: mem.id,
        fullName,
        email: mem.profile?.email || null,
        studentId: mem.profile?.studentId || null,
        phone: mem.profile?.phone || null,
        className: null,
        major: null,
        avatarUrl: mem.profile?.avatarUrl || null,
        role,
        positionLabel,
        hasSystemAccount: true,
        userId: mem.userId,
        membership: mem,
        orderWeight: getRoleWeight(role),
      });
    }

    // Sort hierarchically
    officers.sort((a, b) => {
      if (a.orderWeight !== b.orderWeight) return a.orderWeight - b.orderWeight;
      return a.fullName.localeCompare(b.fullName, 'vi');
    });

    return officers;
  }, [members, memberships, language, organizationType]);

  const filteredOfficers = useMemo(() => {
    if (!effectiveSearch) return unifiedOfficers;
    const term = effectiveSearch.toLowerCase().trim();
    return unifiedOfficers.filter((m) => {
      const name = m.fullName.toLowerCase();
      const email = (m.email || '').toLowerCase();
      const studentId = (m.studentId || '').toLowerCase();
      const pos = m.positionLabel.toLowerCase();
      const cls = (m.className || '').toLowerCase();
      return name.includes(term) || email.includes(term) || studentId.includes(term) || pos.includes(term) || cls.includes(term);
    });
  }, [unifiedOfficers, effectiveSearch]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const getRoleIcon = (role: OrganizationRole) => {
    switch (role) {
      case 'admin':
        return Shield;
      case 'leader':
        return ShieldCheck;
      case 'deputy':
        return Award;
      case 'treasurer':
        return Award;
      case 'secretary':
        return UserCheck;
      default:
        return Shield;
    }
  };

  const boardTitle = getOrgBoardTitle(organizationType, language);
  const displayCount = unifiedOfficers.length;

  return (
    <section className="w-full space-y-4" id="bch-roster-section">
      {/* Section Header */}
      <div className="bg-ink-navy rounded-2xl p-5 sm:p-6 text-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-medium tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-signal-blue" />
              <span>{t('members.bch.badge', 'Ban Quản Trị & Điều Hành')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {boardTitle}
              <span className="text-xs font-semibold tabular-nums px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                {displayCount}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-mist-gray max-w-2xl">
              {t(
                'members.bch.subtitle',
                'Tài khoản và nhân sự được phân quyền quản lý, điều hành Chi hội'
              )}
              {organizationName && ` • ${organizationName} (${organizationCode})`}
            </p>
          </div>

          {canManage && onManageMemberships && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onManageMemberships}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 text-xs h-9 rounded-lg self-start md:self-auto cursor-pointer"
            >
              <UserCog className="w-4 h-4 mr-1.5" />
              <span>{language === 'vi' ? 'Quản lý phân quyền' : 'Manage Permissions'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content: Either Table (via children) or Cards Grid */}
      {children ? (
        children
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-hairline rounded-2xl p-5 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-pebble rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-pebble rounded w-3/4" />
                  <div className="h-3 bg-cloud rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredOfficers.length === 0 ? (
        <div className="bg-white border border-hairline rounded-2xl p-8 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-cloud flex items-center justify-center mx-auto text-mist-gray border border-hairline">
            <ShieldCheck strokeWidth={1.5} className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-semibold text-ink-navy">
              {effectiveSearch
                ? language === 'vi'
                  ? 'Không tìm thấy cán bộ Ban Chấp Hành phù hợp'
                  : 'No matching board members found'
                : language === 'vi'
                ? 'Chưa có cán bộ Ban Chấp Hành nào'
                : 'No Executive Board members found'}
            </h3>
            <p className="text-xs text-slate-gray">
              {effectiveSearch
                ? language === 'vi'
                  ? 'Hãy thử thay đổi từ khóa tìm kiếm.'
                  : 'Try adjusting your search criteria.'
                : language === 'vi'
                ? 'Các cán bộ có chức vụ Chi hội trưởng, Chi hội phó, Thủ quỹ, Thư ký, Ủy viên BCH sẽ tự động xuất hiện tại đây.'
                : 'Officers with Chapter Leader, Deputy, Treasurer, Secretary, or Committee roles will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOfficers.map((officer) => {
            const roleConfig = ROLES[officer.role] || ROLES.secretary;
            const RoleIcon = getRoleIcon(officer.role);
            const fullName = officer.fullName;
            const email = officer.email || '';
            const studentId = officer.studentId;
            const phone = officer.phone;
            const className = officer.className;
            const initial = fullName.charAt(0).toUpperCase();

            return (
              <div
                key={officer.id}
                className="bg-white border border-hairline hover:border-signal-blue/50 rounded-2xl p-5 shadow-xs transition-all duration-200 hover:shadow-xs flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-start gap-3.5">
                  <Avatar className="h-12 w-12 rounded-full border-2 border-white shadow-xs shrink-0">
                    {officer.avatarUrl && (
                      <AvatarImage src={officer.avatarUrl} alt={fullName} />
                    )}
                    <AvatarFallback className="bg-[#e6f0ff] text-signal-blue font-bold text-sm">
                      {initial}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <h4
                        className={`text-sm font-bold text-ink-navy truncate ${
                          officer.member && onViewDetail ? 'cursor-pointer hover:text-signal-blue transition-colors' : ''
                        }`}
                        onClick={() => officer.member && onViewDetail && onViewDetail(officer.member)}
                        title={fullName}
                      >
                        {fullName}
                      </h4>
                      {officer.hasSystemAccount ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0 border border-emerald-200/60"
                          title={language === 'vi' ? 'Đã kích hoạt tài khoản điều hành' : 'System account active'}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                          {language === 'vi' ? 'Hoạt động' : 'Active'}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full shrink-0 border border-slate-200/60"
                          title={language === 'vi' ? 'Hồ sơ cán bộ trong danh sách Chi hội' : 'Official roster officer'}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                          {language === 'vi' ? 'Chính thức' : 'Official'}
                        </span>
                      )}
                    </div>

                    {/* Role Badge */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs tracking-wide ${roleConfig.colorClasses.bg} ${roleConfig.colorClasses.text} ${roleConfig.colorClasses.border}`}
                      >
                        <RoleIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{officer.positionLabel}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact & Student Info */}
                <div className="space-y-1.5 pt-2 border-t border-hairline text-xs text-slate-gray">
                  {email && (
                    <div className="flex items-center justify-between group/email gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 text-slate-gray">
                        <Mail className="w-3.5 h-3.5 text-mist-gray shrink-0" />
                        <span className="truncate">{email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(email)}
                        className="p-1 text-mist-gray hover:text-ink-navy rounded-lg transition-colors shrink-0 cursor-pointer"
                        title={language === 'vi' ? 'Sao chép email' : 'Copy email'}
                      >
                        {copiedEmail === email ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                        )}
                      </button>
                    </div>
                  )}

                  {studentId && (
                    <div className="flex items-center gap-1.5 text-slate-gray">
                      <GraduationCap className="w-3.5 h-3.5 text-mist-gray shrink-0" />
                      <span className="tabular-nums">MSSV: {studentId}</span>
                    </div>
                  )}

                  {className && (
                    <div className="flex items-center gap-1.5 text-slate-gray">
                      <span className="text-[11px] font-medium text-mist-gray shrink-0">Lớp:</span>
                      <span className="truncate">{className}</span>
                    </div>
                  )}

                  {phone && (
                    <div className="flex items-center gap-1.5 text-slate-gray">
                      <Phone className="w-3.5 h-3.5 text-mist-gray shrink-0" />
                      <span className="tabular-nums">{phone}</span>
                    </div>
                  )}
                </div>

                {/* Organization & Scope footer */}
                <div className="pt-2 border-t border-hairline flex items-center justify-between text-[11px] text-mist-gray">
                  <span>
                    {organizationCode ? `${organizationCode}` : 'Chi hội'}
                  </span>
                  <div className="flex items-center gap-2">
                    {officer.member && onViewDetail && (
                      <button
                        type="button"
                        onClick={() => onViewDetail(officer.member!)}
                        className="text-xs text-[#2e89f7] hover:text-[#1a73e8] font-semibold hover:underline cursor-pointer"
                      >
                        {language === 'vi' ? 'Chi tiết' : 'Details'}
                      </button>
                    )}
                    {canManage && officer.member && onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(officer.member!)}
                        className="text-xs text-slate-500 hover:text-ink-navy font-medium hover:underline cursor-pointer"
                      >
                        {language === 'vi' ? 'Sửa' : 'Edit'}
                      </button>
                    )}
                    {!officer.member && officer.userId && (
                      <span className="tabular-nums text-[10px]">
                        ID: {officer.userId.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
