import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, 
  GraduationCap, 
  LogOut, 
  PlusCircle, 
  Shield, 
  CheckCircle2, 
  Search,
  Users,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ROLES, type OrganizationRole } from '@/types/roles';
import { getOrgTypeShort } from '@/lib/organization.utils';

export function WorkspacesPage() {
  const { user, profile, memberships, activeOrganization, setActiveOrganizationId, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectWorkspace = (orgId: string) => {
    setActiveOrganizationId(orgId);
    const returnTo = (location.state as { returnTo?: string } | null)?.returnTo || '/';
    navigate(returnTo, { replace: true });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const filteredMemberships = (memberships || []).filter((m) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const nameMatch = m.organization?.name?.toLowerCase().includes(term);
    const codeMatch = m.organization?.code?.toLowerCase().includes(term);
    return nameMatch || codeMatch;
  });

  const getRoleBadge = (role: OrganizationRole) => {
    const roleDef = ROLES[role];
    if (!roleDef) {
      return (
        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200 rounded-md">
          {role}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className={`text-[10px] font-medium border rounded-md ${roleDef.colorClasses.bg} ${roleDef.colorClasses.text} ${roleDef.colorClasses.border}`}
      >
        <Shield className="h-3 w-3 mr-1 shrink-0" />
        {roleDef.label}
      </Badge>
    );
  };

  return (
    <div id="workspaces-page" className="min-h-screen bg-slate-50/80 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 border-b border-slate-200/80 mb-6 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0 ring-4 ring-indigo-50">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 leading-tight truncate">ChapterOS</h1>
            <span className="text-[11px] text-slate-500 block truncate">Không gian Quản trị</span>
          </div>
        </div>

        <Button
          id="workspaces-logout-btn"
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl gap-1.5 shrink-0 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Đăng xuất
        </Button>
      </header>

      {/* Main Workspace Selection Area */}
      <main className="max-w-3xl mx-auto w-full my-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Title & Greeting */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100/80">
            <Building2 className="h-3.5 w-3.5" />
            <span>Chọn không gian làm việc</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Chào mừng trở lại, {profile?.fullName || user?.email?.split('@')[0] || 'Hội viên'}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Chọn một Đơn vị bên dưới để tiếp tục phiên làm việc:
          </p>
        </div>

        {/* Search Bar (if more than 3 memberships) */}
        {memberships && memberships.length > 3 && (
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="workspace-search-input"
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mã Đơn vị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white text-xs h-11 rounded-2xl border-slate-200 shadow-2xs focus:bg-white"
            />
          </div>
        )}

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemberships.map((m) => {
            const org = m.organization;
            const isCurrentlyActive = activeOrganization?.id === org?.id;
            const orgTypeShort = getOrgTypeShort(org?.type);

            return (
              <button
                key={m.id}
                id={`workspace-card-${org?.id}`}
                type="button"
                onClick={() => handleSelectWorkspace(m.organizationId)}
                className={`group relative text-left bg-white rounded-3xl border p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md hover:border-indigo-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 flex flex-col justify-between gap-4 cursor-pointer ${
                  isCurrentlyActive ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-indigo-50/20' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {org?.logoUrl ? (
                      <div className="h-12 w-12 rounded-2xl border border-slate-200/80 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center shadow-2xs">
                        <img
                          src={org.logoUrl}
                          alt={org.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0 ring-4 ring-indigo-50">
                        {orgTypeShort || (org?.code ? org.code.slice(0, 2).toUpperCase() : 'CH')}
                      </div>
                    )}

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {orgTypeShort && (
                          <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.2 rounded-md shrink-0">
                            {orgTypeShort}
                          </span>
                        )}
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors break-words whitespace-normal leading-snug">
                          {org?.name || 'Đơn vị không tên'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded-md">
                          {org?.code || 'NO-CODE'}
                        </span>
                        {getRoleBadge(m.role)}
                      </div>
                    </div>
                  </div>

                  {isCurrentlyActive && (
                    <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0 font-medium rounded-md">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Đang chọn
                    </Badge>
                  )}
                </div>

                {org?.description && (
                  <p className="text-xs text-slate-500 whitespace-normal break-words leading-relaxed line-clamp-2">
                    {org.description}
                  </p>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold group-hover:text-indigo-700">
                  <span>Vào không gian làm việc</span>
                  <div className="h-7 w-7 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Empty Search Results */}
        {filteredMemberships.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-3 shadow-xs">
            <Users className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-sm font-medium text-slate-800">Không tìm thấy Đơn vị nào phù hợp</p>
            <p className="text-xs text-slate-500">Hãy thử tìm kiếm với từ khóa khác.</p>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="text-xs mt-2 rounded-xl"
              >
                Xóa tìm kiếm
              </Button>
            )}
          </div>
        )}

        {/* Bottom Action: Create new organization */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-500 font-medium">
          <span>Bạn cần thành lập hoặc kết nối Đơn vị khác?</span>
          <Button
            id="workspaces-create-new-btn"
            variant="outline"
            size="sm"
            onClick={() => navigate('/onboarding')}
            className="text-xs gap-1.5 rounded-xl border-slate-300 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 bg-white cursor-pointer shadow-2xs"
          >
            <PlusCircle className="h-3.5 w-3.5 text-indigo-600" />
            Tạo Đơn vị mới
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-4 border-t border-slate-200/80 text-[11px] text-slate-400 font-medium">
        ChapterOS &copy; {new Date().getFullYear()} — Nền tảng số Quản trị & Điều hành Đơn vị Sinh viên.
      </footer>
    </div>
  );
}

