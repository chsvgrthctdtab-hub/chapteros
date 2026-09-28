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
} from '@/lib/icons';
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
      className="relative z-20 flex h-16 w-full items-center justify-between border-b border-[#e2e8f0] bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 shrink-0"
    >
      {/* Left side: Mobile menu toggle + Active Chapter Switcher */}
      <div className="flex items-center gap-2 min-w-0">
        <Button
          id="btn-mobile-menu"
          variant="ghost"
          size="icon-sm"
          className="lg:hidden text-[#475569] hover:text-[#1e293b] hover:bg-[#f0f4f9] rounded-full shrink-0"
          onClick={onOpenMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </Button>

        {/* Current Active Chapter & Selector */}
        {activeOrganization ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 py-1 pl-2 pr-2.5 -ml-1 text-left bg-[#f0f4f9] hover:bg-[#e8f0fe] border border-[#e2e8f0] rounded-full flex items-center gap-2 group transition-all cursor-pointer"
                title={activeOrganization.name}
              >
                <div className="h-5 w-5 rounded-full bg-[#2e89f7] flex items-center justify-center text-white font-bold text-[9px] shrink-0 overflow-hidden">
                  {activeOrganization.logoUrl ? (
                    <img
                      src={activeOrganization.logoUrl}
                      alt=""
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    activeOrganization.code ? activeOrganization.code.slice(0, 2).toUpperCase() : (activeOrgTypeShort || 'CH')
                  )}
                </div>
                <span className="text-xs font-semibold text-[#0b3558] tracking-tight group-hover:text-[#2e89f7] transition-colors">
                  {activeOrganization.code || activeOrganization.name}
                </span>
                <ChevronDown size={14} className="text-[#64748b] group-hover:text-[#2e89f7] transition-colors shrink-0" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-80 bg-white border border-[#e2e8f0] shadow-md rounded-2xl p-1.5">
              <DropdownMenuLabel className="text-xs font-semibold text-slate-gray uppercase tracking-wider px-3 py-1.5">
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
                      className={`flex items-center justify-between py-2 px-3 text-xs cursor-pointer rounded-lg ${
                        isSelected ? 'bg-pebble text-ink-navy font-semibold' : 'text-slate-gray hover:text-ink-navy hover:bg-pebble/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {m.organization.logoUrl ? (
                          <div className="h-7 w-7 rounded-md border border-hairline overflow-hidden shrink-0 bg-pebble flex items-center justify-center">
                            <img
                              src={m.organization.logoUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-md bg-pebble border border-hairline text-ink-navy font-bold text-[10px] flex items-center justify-center shrink-0">
                            {itemTypeShort || 'CH'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-ink-navy">{m.organization.name}</p>
                          <p className="text-[11px] text-slate-gray font-normal truncate mt-0.5">
                            {m.organization.code} • {getRoleLabel(m.role, 'vi', m.organization.type)}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-signal-blue shrink-0 ml-2" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-hairline" />

              <DropdownMenuItem
                onClick={() => navigate('/onboarding')}
                className="text-xs text-signal-blue cursor-pointer flex items-center gap-2 py-2 px-3 font-medium rounded-lg hover:bg-pebble"
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

      {/* Right side: DB status, Notifications & User Account */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Database connection indicator */}
        <div
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#e2e8f0] bg-[#f8fafd] text-xs text-[#64748b]"
          title={isSupabaseConfigured ? "Connected to PostgreSQL database" : "Running with local demo configuration"}
        >
          {isSupabaseConfigured ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
              <span className="text-[#1e293b] font-medium text-xs">Đã kết nối</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-100" />
              <span className="text-[#1e293b] font-medium text-xs">Bản thử nghiệm</span>
            </>
          )}
        </div>

        {/* Active Role Badge */}
        {roleInfo && (
          <div className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${roleInfo.colorClasses.bg} ${roleInfo.colorClasses.text} ${roleInfo.colorClasses.border}`}>
            {getRoleLabel(activeRole, 'vi', activeOrganization?.type)}
          </div>
        )}

        {/* Notification Center */}
        <NotificationCenterPopover />

        {/* User Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="user-account-menu"
              className="flex items-center gap-2 pl-3 border-l border-[#e2e8f0] focus:outline-hidden hover:opacity-90 transition-opacity cursor-pointer text-left"
            >
              <Avatar className="h-8 w-8 ring-1 ring-[#e2e8f0]">
                {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={displayName} />}
                <AvatarFallback className="bg-[#e8f0fe] text-[#2e89f7] font-bold text-sm">
                  {initialLetter}
                </AvatarFallback>
              </Avatar>

              <div className="hidden xl:flex flex-col text-left">
                <span className="text-sm font-semibold text-[#0b3558] leading-tight truncate max-w-[140px]">
                  {displayName}
                </span>
                <span className="text-xs text-[#64748b] truncate max-w-[140px]">
                  {roleInfo?.label || user?.email || 'Hội viên'}
                </span>
              </div>

              <ChevronDown size={14} className="hidden xl:block text-[#64748b]" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60 bg-white border border-[#e2e8f0] shadow-md rounded-2xl p-1.5">
            <div className="px-3 py-2.5">
              <p className="text-sm font-semibold text-[#0b3558] truncate">{displayName}</p>
              <p className="text-xs text-[#64748b] truncate">{user?.email || 'bch@chapter.edu.vn'}</p>
              {activeRole && (
                <div className="mt-2 inline-block">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo?.colorClasses.bg} ${roleInfo?.colorClasses.text}`}>
                    {roleInfo?.label}
                  </span>
                </div>
              )}
            </div>

            <DropdownMenuSeparator className="bg-[#e2e8f0]" />

            <DropdownMenuItem onClick={() => navigate('/settings')} className="text-xs text-[#1e293b] cursor-pointer py-2 px-3 rounded-xl hover:bg-[#f0f4f9]">
              <UserIcon size={15} className="mr-2.5 text-[#64748b]" />
              <span>Hồ sơ & Cài đặt</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/chapters')} className="text-xs text-[#1e293b] cursor-pointer py-2 px-3 rounded-xl hover:bg-[#f0f4f9]">
              <Building2 size={15} className="mr-2.5 text-[#64748b]" />
              <span>Quản trị Đơn vị</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-[#e2e8f0]" />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-xs text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer font-medium py-2 px-3 rounded-xl"
            >
              <LogOut size={15} className="mr-2.5 text-rose-500" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
