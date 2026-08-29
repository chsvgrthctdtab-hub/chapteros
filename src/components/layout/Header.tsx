import { useNavigate, Link } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  Building2, 
  Check, 
  LogOut, 
  PlusCircle,
  User as UserIcon,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { NotificationCenterPopover } from '@/features/notifications/components/NotificationCenterPopover';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES, getRoleLabel } from '@/types/roles';
import { getOrgTypeShort } from '@/lib/organization.utils';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { 
    user, 
    profile, 
    memberships, 
    activeOrganization, 
    activeRole, 
    setActiveOrganizationId, 
    signOut, 
    isSupabaseConfigured 
  } = useAuth();

  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Ban Chấp Hành';
  const roleInfo = activeRole ? ROLES[activeRole] : null;
  const initialLetter = displayName.charAt(0).toUpperCase();
  const activeOrgTypeShort = getOrgTypeShort(activeOrganization?.type);

  return (
    <header
      id="app-header"
      className="relative z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-[#F8FAF9]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 shrink-0"
    >
      {/* Left side: Mobile menu toggle + Active Chapter Switcher */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          id="btn-mobile-menu"
          variant="ghost"
          size="icon-sm"
          className="lg:hidden text-slate-700 hover:text-slate-900 shrink-0"
          onClick={onOpenMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Current Active Chapter & Selector */}
        {activeOrganization ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 py-1.5 px-3 -ml-1 text-left bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs rounded-full flex items-center gap-2.5 group transition-all cursor-pointer max-w-[240px] sm:max-w-md"
              >
                <div className="h-7 w-7 rounded-full bg-emerald-100 border border-emerald-300/80 flex items-center justify-center text-emerald-900 font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
                  {activeOrganization.logoUrl ? (
                    <img
                      src={activeOrganization.logoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    activeOrgTypeShort || activeOrganization.code.slice(0, 2)
                  )}
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors truncate max-w-[140px] sm:max-w-[260px]">
                      {activeOrganization.name}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 transition-colors shrink-0" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium font-mono truncate">
                    {activeOrganization.code}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Đơn vị của bạn ({memberships.length})
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {memberships.map((m) => {
                  const isSelected = m.organizationId === activeOrganization.id;
                  const itemTypeShort = getOrgTypeShort(m.organization.type);
                  return (
                    <DropdownMenuItem
                      key={m.id}
                      onClick={() => setActiveOrganizationId(m.organizationId)}
                      className={`flex items-center justify-between py-2.5 text-xs cursor-pointer ${
                        isSelected ? 'bg-emerald-50 text-emerald-900 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {m.organization.logoUrl ? (
                          <div className="h-7 w-7 rounded-md border border-slate-200 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
                            <img
                              src={m.organization.logoUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {itemTypeShort || 'CH'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-900">{m.organization.name}</p>
                          <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                            {m.organization.code} • {getRoleLabel(m.role, 'vi', m.organization.type)}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-emerald-700 shrink-0 ml-2" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => navigate('/onboarding')}
                className="text-xs text-emerald-700 cursor-pointer flex items-center gap-2 py-2 font-medium"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Tạo hoặc tham gia đơn vị khác</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="warning" className="text-xs py-1 px-2.5">
              Chưa chọn đơn vị
            </Badge>
          </div>
        )}
      </div>

      {/* Right side: Supabase connection, Notifications & User Account Menu */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Database connection indicator */}
        <div
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200/80 bg-slate-50 text-xs text-slate-600 shadow-2xs"
          title={isSupabaseConfigured ? "Connected to PostgreSQL database" : "Running with local demo configuration"}
        >
          {isSupabaseConfigured ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
              <span className="text-slate-700 font-medium text-xs">Đã kết nối</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-100" />
              <span className="text-slate-700 font-medium text-xs">Bản thử nghiệm</span>
            </>
          )}
        </div>

        {/* Active Role Badge */}
        {roleInfo && (
          <div className={`hidden sm:inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold border shadow-2xs tracking-wide ${roleInfo.colorClasses.bg} ${roleInfo.colorClasses.text} ${roleInfo.colorClasses.border}`}>
            {getRoleLabel(activeRole, 'vi', activeOrganization?.type)}
          </div>
        )}

        {/* Notification Center Popover */}
        <NotificationCenterPopover />

        {/* User Account Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="user-account-menu"
              className="flex items-center gap-2.5 pl-3 border-l border-slate-200/90 focus:outline-hidden hover:opacity-90 transition-opacity cursor-pointer text-left"
            >
              <Avatar className="h-9 w-9 ring-1 ring-slate-200 shadow-2xs">
                {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={displayName} />}
                <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-sm">
                  {initialLetter}
                </AvatarFallback>
              </Avatar>

              <div className="hidden xl:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
                  {displayName}
                </span>
                <span className="text-xs text-slate-400 truncate max-w-[140px]">
                  {roleInfo?.label || user?.email || 'Hội viên'}
                </span>
              </div>

              <ChevronDown className="hidden xl:block h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60">
            <div className="px-3 py-2.5">
              <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'bch@chapter.edu.vn'}</p>
              {activeRole && (
                <div className="mt-2 inline-block">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleInfo?.colorClasses.bg} ${roleInfo?.colorClasses.text}`}>
                    {roleInfo?.label}
                  </span>
                </div>
              )}
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => navigate('/settings')} className="text-xs cursor-pointer py-2">
              <UserIcon className="h-4 w-4 mr-2.5 text-slate-500" />
              <span>Hồ sơ & Cài đặt</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/chapters')} className="text-xs cursor-pointer py-2">
              <Building2 className="h-4 w-4 mr-2.5 text-slate-500" />
              <span>Quản trị Đơn vị</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-xs text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer font-medium py-2"
            >
              <LogOut className="h-4 w-4 mr-2.5 text-rose-600" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
