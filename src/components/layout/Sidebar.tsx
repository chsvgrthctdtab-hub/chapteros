import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  CheckSquare,
  Users,
  Wallet,
  FileText,
  BarChart3,
  CalendarRange,
  ShieldCheck,
  History,
  Puzzle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  GraduationCap,
  type LucideIcon,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// ============================================================
// Pastel icon color map — chuẩn Google NotebookLM
// ============================================================
const NAV_ICON_COLORS: Record<string, { icon: string; bg: string }> = {
  '/':            { icon: '#2f63df', bg: '#eef4fe' },
  '/plans':       { icon: '#cf3d92', bg: '#fdf2f8' },
  '/activities':  { icon: '#16a6d5', bg: '#f0fdfa' },
  '/tasks':       { icon: '#2e64de', bg: '#eff6ff' },
  '/members':     { icon: '#d97706', bg: '#fff7ed' },
  '/finance':     { icon: '#ce7918', bg: '#fffbeb' },
  '/documents':   { icon: '#c43d92', bg: '#fff1f2' },
  '/reports':     { icon: '#6858d2', bg: '#f5f3ff' },
  '/terms':       { icon: '#475569', bg: '#f1f5f9' },
  '/data-quality':{ icon: '#475569', bg: '#f1f5f9' },
  '/audit-logs':  { icon: '#475569', bg: '#f1f5f9' },
  '/integrations':{ icon: '#475569', bg: '#f1f5f9' },
  '/settings':    { icon: '#475569', bg: '#f1f5f9' },
};

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'warning';
}

const operationsNavItems: NavItem[] = [
  { name: 'Tổng quan',  href: '/',           icon: LayoutDashboard },
  { name: 'Collab',     href: '/plans',       icon: FolderKanban },
  { name: 'Hoạt động',  href: '/activities',  icon: CalendarDays },
  { name: 'Nhiệm vụ',   href: '/tasks',       icon: CheckSquare },
  { name: 'Hội viên',   href: '/members',     icon: Users },
  { name: 'Tài chính',  href: '/finance',     icon: Wallet },
  { name: 'Văn bản',    href: '/documents',   icon: FileText },
  { name: 'Báo cáo',    href: '/reports',     icon: BarChart3 },
];

const systemNavItems: NavItem[] = [
  { name: 'Nhiệm kỳ',           href: '/terms',         icon: CalendarRange },
  { name: 'Kiểm tra dữ liệu',   href: '/data-quality',  icon: ShieldCheck },
  { name: 'Nhật ký kiểm toán',  href: '/audit-logs',    icon: History },
  { name: 'Tích hợp Google',    href: '/integrations',  icon: Puzzle },
  { name: 'Cài đặt',            href: '/settings',      icon: Settings },
];

interface NavLinkItemProps {
  item: NavItem;
  collapsed: boolean;
  onCloseMobile?: () => void;
}

function NavLinkItem({ item, collapsed, onCloseMobile }: NavLinkItemProps) {
  const IconComponent = item.icon;
  const colors = NAV_ICON_COLORS[item.href] ?? { icon: '#475569', bg: '#f1f5f9' };

  return (
    <NavLink
      to={item.href}
      end={item.href === '/'}
      id={`nav-link-${item.href.replace('/', '') || 'dashboard'}`}
      onClick={onCloseMobile}
      className={({ isActive }) =>
        cn(
          'group flex items-center transition-all duration-200 ease-in-out relative select-none',
          collapsed
            ? 'w-10 h-10 justify-center px-0 mx-auto rounded-xl'
            : 'w-full h-10 gap-3 px-2.5 rounded-xl',
          isActive
            ? 'bg-[#e8f0fe]'
            : 'hover:bg-[#f0f4f9]'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Icon container — tonal pill chuẩn Google */}
          <span
            className={cn(
              'flex items-center justify-center shrink-0 rounded-lg transition-all duration-200',
              collapsed ? 'w-7 h-7' : 'w-7 h-7'
            )}
            style={{
              backgroundColor: isActive ? colors.bg : 'transparent',
              color: isActive ? colors.icon : undefined,
            }}
          >
            <IconComponent
              size={18}
              className={cn(
                'shrink-0 transition-all duration-200',
                isActive
                  ? ''
                  : 'text-slate-gray group-hover:text-ink-navy'
              )}
              style={isActive ? { color: colors.icon } : undefined}
            />
          </span>

          {/* Label */}
          <span
            className={cn(
              'flex-1 truncate text-xs font-medium transition-all duration-200 ease-in-out origin-left whitespace-nowrap overflow-hidden',
              isActive ? 'text-[#1a73e8] font-semibold' : 'text-slate-gray group-hover:text-ink-navy',
              collapsed
                ? 'w-0 opacity-0 -translate-x-2.5 max-w-0 pointer-events-none'
                : 'w-auto opacity-100 translate-x-0 max-w-[180px]'
            )}
          >
            {item.name}
          </span>

          {/* Badge */}
          {item.badge && (
            <Badge
              variant={item.badgeVariant || 'secondary'}
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-semibold transition-all duration-200',
                collapsed ? 'w-0 opacity-0 scale-75 overflow-hidden p-0' : 'opacity-100 scale-100'
              )}
            >
              {item.badge}
            </Badge>
          )}

          {/* Floating Tooltip when Collapsed */}
          {collapsed && (
            <div
              className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1e293b] text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-[60] -translate-x-1 group-hover:translate-x-0"
            >
              {item.name}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { activeRole } = useAuth();
  const isAdmin = activeRole === 'admin' || activeRole === 'leader';
  const isEffectiveCollapsed = collapsed && !mobileOpen;

  const visibleSystemNavItems = systemNavItems.filter((item) => {
    if (item.href === '/integrations') return isAdmin;
    return true;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 z-40 bg-ink-navy/40 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="app-sidebar"
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-[#e2e8f0] bg-white transition-all duration-200 ease-in-out lg:static shrink-0 select-none overflow-x-hidden',
          mobileOpen
            ? 'w-64 translate-x-0 shadow-2xl rounded-r-2xl'
            : '-translate-x-full lg:translate-x-0',
          collapsed ? 'lg:w-[56px]' : 'lg:w-64'
        )}
      >
        {/* Brand header */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-[#e2e8f0]/60 transition-all duration-200 ease-in-out',
            isEffectiveCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <button
              type="button"
              onClick={isEffectiveCollapsed ? onToggleCollapse : undefined}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2e89f7] text-white shadow-sm font-bold transition-all duration-200',
                isEffectiveCollapsed ? 'hover:bg-[#1a73e8] cursor-pointer active:scale-95' : 'cursor-default'
              )}
              title={isEffectiveCollapsed ? 'Mở rộng thanh điều hướng' : 'ChapterOS'}
              aria-label={isEffectiveCollapsed ? 'Mở rộng thanh điều hướng' : 'ChapterOS'}
            >
              <GraduationCap size={18} />
            </button>
            <div
              className={cn(
                'flex flex-col truncate transition-all duration-200 ease-in-out origin-left whitespace-nowrap overflow-hidden',
                isEffectiveCollapsed ? 'w-0 opacity-0 -translate-x-2.5 max-w-0 pointer-events-none' : 'w-auto opacity-100 translate-x-0 max-w-[160px]'
              )}
            >
              <span className="font-bold tracking-tight text-[#0b3558] text-base leading-tight truncate">
                ChapterOS
              </span>
              <span className="text-[11px] text-[#2e89f7] font-semibold tracking-wider uppercase truncate">
                Operations Suite
              </span>
            </div>
          </div>

          {/* Collapse toggle button */}
          <Button
            id="btn-toggle-sidebar"
            variant="ghost"
            size="icon-xs"
            onClick={onToggleCollapse}
            className={cn(
              'hidden lg:flex text-slate-gray hover:text-ink-navy hover:bg-[#f0f4f9] rounded-full transition-all duration-200 shrink-0',
              isEffectiveCollapsed ? 'w-0 opacity-0 p-0 overflow-hidden pointer-events-none' : 'w-8 h-8 opacity-100'
            )}
            aria-label="Thu gọn thanh điều hướng"
            title="Thu gọn thanh điều hướng"
          >
            <ChevronLeft size={16} />
          </Button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-5">

          {/* Operations Section */}
          <div>
            <div
              className={cn(
                'overflow-hidden transition-all duration-200 ease-in-out origin-top',
                isEffectiveCollapsed ? 'max-h-0 opacity-0 mb-0 pointer-events-none' : 'max-h-6 opacity-100 mb-2'
              )}
            >
              <p className="px-2.5 text-[10px] font-bold tracking-wider text-slate-gray/70 uppercase truncate">
                Quản trị vận hành
              </p>
            </div>
            <nav className="space-y-0.5">
              {operationsNavItems.map((item) => (
                <NavLinkItem
                  key={item.href}
                  item={item}
                  collapsed={isEffectiveCollapsed}
                  onCloseMobile={onCloseMobile}
                />
              ))}
            </nav>
          </div>

          {/* System & Tools Section */}
          <div>
            <div
              className={cn(
                'overflow-hidden transition-all duration-200 ease-in-out origin-top',
                isEffectiveCollapsed ? 'max-h-0 opacity-0 mb-0 pointer-events-none' : 'max-h-6 opacity-100 mb-2'
              )}
            >
              <p className="px-2.5 text-[10px] font-bold tracking-wider text-slate-gray/70 uppercase truncate">
                Hệ thống & Tiện ích
              </p>
            </div>
            <nav className="space-y-0.5">
              {visibleSystemNavItems.map((item) => (
                <NavLinkItem
                  key={item.href}
                  item={item}
                  collapsed={isEffectiveCollapsed}
                  onCloseMobile={onCloseMobile}
                />
              ))}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e2e8f0]/60 p-2 bg-[#f8fafd] shrink-0">
          <div
            className={cn(
              'overflow-hidden transition-all duration-200 ease-in-out',
              isEffectiveCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-20 opacity-100'
            )}
          >
            <div className="flex items-center gap-2.5 rounded-xl p-2.5 text-xs text-slate-gray bg-white border border-[#e2e8f0] shadow-xs">
              <Shield size={15} className="text-[#2e89f7] shrink-0" />
              <div className="truncate">
                <p className="font-bold text-[#0b3558] text-xs leading-tight truncate">ChapterOS</p>
                <p className="text-[11px] text-slate-gray truncate">Tác giả: <span className="font-semibold text-[#2e89f7]">tienthuan_0909</span></p>
              </div>
            </div>
          </div>

          {/* Expand button when collapsed */}
          {isEffectiveCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex justify-center items-center w-9 h-8 mx-auto text-slate-gray hover:text-ink-navy hover:bg-[#f0f4f9] rounded-full transition-colors cursor-pointer"
              title="Mở rộng thanh điều hướng"
              aria-label="Mở rộng thanh điều hướng"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
