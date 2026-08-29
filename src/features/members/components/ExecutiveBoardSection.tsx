import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  GraduationCap,
  Phone,
  Search,
  CheckCircle2,
  ExternalLink,
  Shield,
  Award,
  UserCheck,
  Copy,
  Check,
  UserCog,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROLES, getRoleLabel, getOrgBoardTitle, type OrganizationRole } from '@/types/roles';
import { useLanguage } from '@/contexts/LanguageContext';
import type { OrganizationMembership } from '@/types';

interface ExecutiveBoardSectionProps {
  memberships: OrganizationMembership[];
  organizationName?: string;
  organizationCode?: string;
  organizationType?: string | null;
  isLoading?: boolean;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  canManage?: boolean;
  onManageMemberships?: () => void;
}

export function ExecutiveBoardSection({
  memberships,
  organizationName,
  organizationCode,
  organizationType,
  isLoading = false,
  searchTerm = '',
  onSearchChange,
  canManage = false,
  onManageMemberships,
}: ExecutiveBoardSectionProps) {
  const { t, language } = useLanguage();
  const [localSearch, setLocalSearch] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const effectiveSearch = onSearchChange !== undefined ? searchTerm : localSearch;

  // Filter board memberships (only roles < admin: leader, deputy, treasurer, secretary)
  const boardRoles: OrganizationRole[] = ['leader', 'deputy', 'treasurer', 'secretary'];
  const validBoardMembers = memberships.filter((m) => m.role !== 'admin' && boardRoles.includes(m.role));

  const filteredMembers = validBoardMembers.filter((m) => {
    if (!effectiveSearch) return true;
    const term = effectiveSearch.toLowerCase().trim();
    const name = m.profile?.fullName?.toLowerCase() || '';
    const email = m.profile?.email?.toLowerCase() || '';
    const studentId = m.profile?.studentId?.toLowerCase() || '';
    const roleLabel = getRoleLabel(m.role, language, organizationType).toLowerCase();
    return name.includes(term) || email.includes(term) || studentId.includes(term) || roleLabel.includes(term);
  });

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

  return (
    <section className="w-full space-y-4" id="bch-roster-section">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-5 sm:p-6 text-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-emerald-100 text-[11px] font-medium tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>{t('members.bch.badge', 'Ban Quản Trị & Điều Hành')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {boardTitle}
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                {validBoardMembers.length}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl">
              {t(
                'members.bch.subtitle',
                'Tài khoản được phân quyền quản lý và điều hành hệ thống'
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
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 text-xs h-9 self-start md:self-auto cursor-pointer"
            >
              <UserCog className="w-4 h-4 mr-1.5" />
              <span>{language === 'vi' ? 'Quản lý phân quyền' : 'Manage Permissions'}</span>
            </Button>
          )}
        </div>

        {/* Search inside BCH if there are many members */}
        {validBoardMembers.length > 4 && (
          <div className="mt-4 pt-4 border-t border-white/10 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 text-emerald-200/70 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={effectiveSearch}
                onChange={(e) => {
                  if (onSearchChange) onSearchChange(e.target.value);
                  else setLocalSearch(e.target.value);
                }}
                placeholder={
                  language === 'vi'
                    ? 'Tìm cán bộ BCH theo tên, email, chức vụ...'
                    : 'Search board members by name, email, role...'
                }
                className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-emerald-200/60 focus:outline-hidden focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
        )}
      </div>

      {/* Board Members Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/80 rounded-xl p-5 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-xl p-8 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-semibold text-slate-900">
              {effectiveSearch
                ? language === 'vi'
                  ? 'Không tìm thấy cán bộ Ban Chấp Hành phù hợp'
                  : 'No matching board members found'
                : language === 'vi'
                ? 'Chưa có tài khoản Ban Chấp Hành nào'
                : 'No Executive Board members found'}
            </h3>
            <p className="text-xs text-slate-500">
              {effectiveSearch
                ? language === 'vi'
                  ? 'Hãy thử thay đổi từ khóa tìm kiếm.'
                  : 'Try adjusting your search criteria.'
                : language === 'vi'
                ? 'Các tài khoản có vai trò Quản trị viên, Chi hội trưởng, Chi hội phó, Thủ quỹ, Thư ký sẽ tự động xuất hiện tại đây.'
                : 'Accounts with Admin, Leader, Deputy, Treasurer, or Secretary roles will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((membership) => {
            const roleConfig = ROLES[membership.role] || ROLES.secretary;
            const RoleIcon = getRoleIcon(membership.role);
            const fullName = membership.profile?.fullName || membership.profile?.email?.split('@')[0] || 'Cán bộ BCH';
            const email = membership.profile?.email || '';
            const studentId = membership.profile?.studentId;
            const phone = membership.profile?.phone;
            const initial = fullName.charAt(0).toUpperCase();

            return (
              <div
                key={membership.id}
                className="bg-white border border-slate-200/80 hover:border-emerald-500/50 rounded-2xl p-5 shadow-2xs transition-all duration-200 hover:shadow-xs flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-start gap-3.5">
                  <Avatar className="h-12 w-12 rounded-full border-2 border-slate-100 shadow-2xs shrink-0">
                    {membership.profile?.avatarUrl && (
                      <AvatarImage src={membership.profile.avatarUrl} alt={fullName} />
                    )}
                    <AvatarFallback className="bg-emerald-50 text-emerald-800 font-bold text-sm">
                      {initial}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                        {fullName}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        {language === 'vi' ? 'Hoạt động' : 'Active'}
                      </span>
                    </div>

                    {/* Role Badge */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border shadow-2xs tracking-wide ${roleConfig.colorClasses.bg} ${roleConfig.colorClasses.text} ${roleConfig.colorClasses.border}`}
                      >
                        <RoleIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{getRoleLabel(membership.role, language, organizationType)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact & Student Info */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  {email && (
                    <div className="flex items-center justify-between group/email gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(email)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors shrink-0 cursor-pointer"
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
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>MSSV: {studentId}</span>
                    </div>
                  )}

                  {phone && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{phone}</span>
                    </div>
                  )}
                </div>

                {/* Organization & Scope footer */}
                <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {organizationCode ? `${organizationCode}` : 'Chi hội'}
                  </span>
                  <span className="font-mono text-[10px]">
                    ID: {membership.userId.slice(0, 8)}...
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
