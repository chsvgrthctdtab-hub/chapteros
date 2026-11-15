import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  CheckSquare,
  Users,
  Wallet,
  BarChart3,
  CalendarRange,
  ShieldCheck,
  History,
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
  { name: 'Báo cáo',    href: '/reports',     icon: BarChart3 },
];

const systemNavItems: NavItem[] = [
  { name: 'Nhiệm kỳ',           href: '/terms',         icon: CalendarRange },
  { name: 'Kiểm tra dữ liệu',   href: '/data-quality',  icon: ShieldCheck },
  { name: 'Nhật ký kiểm toán',  href: '/audit-logs',    icon: History },
  { name: 'Cài đặt',            href: '/settings',      icon: Settings },
];

interface NavLinkItemProps {
  item: NavItem;
  collapsed: boolean;
  onCloseMobile?: () => void;
}

function NavLinkItem({ item, collapsed, onCloseMobile }: NavLinkItemProps) {
  const IconComponent = item.icon;

  return (
    <NavLink
      to={item.href}
      end={item.href === '/'}
      id={`nav-link-${item.href.replace('/', '') || 'dashboard'}`}
      onClick={onCloseMobile}
      className={({ isActive }) =>
        cn(
          'group flex items-center transition-all duration-150 relative select-none',
          collapsed
            ? 'w-10 h-10 justify-center px-0 mx-auto rounded-xl'
            : 'w-full h-10 gap-3 px-3 rounded-xl',
          isActive
            ? 'bg-blue-50 text-[#1a73e8] font-semibold ring-1 ring-blue-500/20 shadow-2xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        )
      }
    >
      {({ isActive }) => (
        <>
          <IconComponent
            size={collapsed ? 20 : 18}
            className={cn(
              'shrink-0 transition-all duration-150',
              isActive
                ? 'text-[#1a73e8]'
                : 'text-slate-500 group-hover:text-slate-900 group-hover:scale-105'
            )}
          />

          {/* Label */}
          <span
            className={cn(
              'flex-1 truncate text-xs transition-all duration-200 ease-in-out origin-left whitespace-nowrap overflow-hidden',
              isActive ? 'text-[#1a73e8] font-bold' : 'text-slate-700 group-hover:text-slate-900 font-medium',
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
              className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-[70] -translate-x-1 group-hover:translate-x-0"
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

  const visibleSystemNavItems = systemNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="app-sidebar"
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-200 ease-in-out lg:static shrink-0 select-none overflow-x-hidden',
          mobileOpen
            ? 'w-64 translate-x-0 shadow-2xl rounded-r-2xl'
            : '-translate-x-full lg:translate-x-0',
          collapsed ? 'lg:w-16' : 'lg:w-64'
        )}
      >
        {/* Brand header */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-slate-200/80 transition-all duration-200 ease-in-out',
            isEffectiveCollapsed ? 'justify-center px-0' : 'justify-between px-4'
          )}
        >
          <div className={cn('flex items-center min-w-0', isEffectiveCollapsed ? 'justify-center' : 'gap-3 overflow-hidden')}>
            <button
              type="button"
              onClick={isEffectiveCollapsed ? onToggleCollapse : undefined}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#1a73e8] to-[#2563eb] text-white shadow-xs font-bold transition-all duration-200',
                isEffectiveCollapsed ? 'hover:bg-[#1557b0] hover:shadow-sm cursor-pointer active:scale-95' : 'cursor-default'
              )}
              title={isEffectiveCollapsed ? 'Mở rộng thanh điều hướng' : 'ChapterOS'}
              aria-label={isEffectiveCollapsed ? 'Mở rộng thanh điều hướng' : 'ChapterOS'}
            >
              <GraduationCap size={20} />
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
              <span className="text-[11px] text-[#1a73e8] font-semibold tracking-wider uppercase truncate">
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
              'hidden lg:flex text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 shrink-0',
              isEffectiveCollapsed ? 'w-0 opacity-0 p-0 overflow-hidden pointer-events-none' : 'w-8 h-8 opacity-100'
            )}
            aria-label="Thu gọn thanh điều hướng"
            title="Thu gọn thanh điều hướng"
          >
            <ChevronLeft size={16} />
          </Button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-4 space-y-5">

          {/* Operations Section */}
          <div>
            <div
              className={cn(
                'overflow-hidden transition-all duration-200 ease-in-out origin-top',
                isEffectiveCollapsed ? 'max-h-0 opacity-0 mb-0 pointer-events-none' : 'max-h-6 opacity-100 mb-2'
              )}
            >
              <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase truncate">
                Quản trị vận hành
              </p>
            </div>
            <nav className="space-y-1">
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
              <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase truncate">
                Hệ thống & Tiện ích
              </p>
            </div>
            <nav className="space-y-1">
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
        <div className="p-2 border-t border-slate-200/80 bg-white shrink-0">
          <div
            className={cn(
              'overflow-hidden transition-all duration-200 ease-in-out',
              isEffectiveCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-20 opacity-100'
            )}
          >
            <div className="flex items-center gap-2.5 rounded-xl p-2.5 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 shadow-2xs">
              <Shield size={15} className="text-[#1a73e8] shrink-0" />
              <div className="truncate">
                <p className="font-bold text-[#0b3558] text-xs leading-tight truncate">ChapterOS</p>
                <p className="text-[11px] text-slate-500 truncate">Tác giả: <span className="font-semibold text-[#1a73e8]">tienthuan_0909</span></p>
              </div>
            </div>
          </div>

          {/* Expand button when collapsed */}
          {isEffectiveCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex justify-center items-center w-10 h-10 mx-auto text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Mở rộng thanh điều hướng"
              aria-label="Mở rộng thanh điều hướng"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
