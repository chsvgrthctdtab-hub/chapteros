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
} from 'lucide-react';
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
  { name: 'Tổng quan', href: '/', icon: LayoutDashboard },
  { name: 'Collab', href: '/plans', icon: FolderKanban },
  { name: 'Hoạt động', href: '/activities', icon: CalendarDays },
  { name: 'Nhiệm vụ', href: '/tasks', icon: CheckSquare },
  { name: 'Hội viên', href: '/members', icon: Users },
  { name: 'Tài chính', href: '/finance', icon: Wallet },
  { name: 'Văn bản', href: '/documents', icon: FileText },
  { name: 'Báo cáo', href: '/reports', icon: BarChart3 },
];

const systemNavItems: NavItem[] = [
  { name: 'Nhiệm kỳ', href: '/terms', icon: CalendarRange },
  { name: 'Kiểm tra dữ liệu', href: '/data-quality', icon: ShieldCheck },
  { name: 'Nhật ký kiểm toán', href: '/audit-logs', icon: History },
  { name: 'Tích hợp Google', href: '/integrations', icon: Puzzle },
  { name: 'Cài đặt', href: '/settings', icon: Settings },
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
          "group flex items-center h-10 text-xs font-medium transition-all duration-200 ease-in-out relative border select-none",
          isActive
            ? "bg-pebble text-ink-navy font-semibold border-hairline shadow-calendly-sm"
            : "border-transparent text-slate-gray hover:bg-pebble/70 hover:text-ink-navy",
          collapsed
            ? "w-10 justify-center px-0 mx-auto rounded-lg"
            : "w-full gap-3 px-3 rounded-lg"
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active Accent Indicator */}
          <span
            className={cn(
              "absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-signal-blue transition-all duration-200",
              isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
            )}
          />

          <IconComponent
            size={18}
            strokeWidth={isActive ? 2 : 1.75}
            className={cn(
              "shrink-0 transition-all duration-200",
              isActive ? "text-signal-blue scale-[1.04]" : "text-slate-gray group-hover:text-ink-navy"
            )}
          />

          {/* Label with smooth fade & slide */}
          <span
            className={cn(
              "flex-1 truncate transition-all duration-200 ease-in-out origin-left whitespace-nowrap overflow-hidden",
              collapsed
                ? "w-0 opacity-0 -translate-x-2.5 max-w-0 pointer-events-none"
                : "w-auto opacity-100 translate-x-0 max-w-[180px]"
            )}
          >
            {item.name}
          </span>

          {/* Optional Badge */}
          {item.badge && (
            <Badge
              variant={item.badgeVariant || 'secondary'}
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md font-semibold transition-all duration-200",
                collapsed ? "w-0 opacity-0 scale-75 overflow-hidden p-0" : "opacity-100 scale-100"
              )}
            >
              {item.badge}
            </Badge>
          )}

          {/* Floating Tooltip when Collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-ink-navy text-white text-xs font-medium rounded-lg shadow-calendly-card whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 group-hover:translate-x-0 -translate-x-1">
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

  // Filter out system items that require admin privileges (e.g. Google Integrations)
  const visibleSystemNavItems = systemNavItems.filter((item) => {
    if (item.href === '/integrations') {
      return isAdmin;
    }
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
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-hairline bg-white transition-all duration-200 ease-in-out lg:static shrink-0 select-none overflow-x-hidden",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0 shadow-2xl rounded-r-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand header */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-hairline/60 transition-all duration-200 ease-in-out",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <button
              type="button"
              onClick={collapsed ? onToggleCollapse : undefined}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal-blue text-white shadow-calendly-btn font-bold ring-1 ring-signal-blue/20 transition-all duration-200",
                collapsed ? "hover:bg-[#005be0] cursor-pointer active:scale-95" : "cursor-default"
              )}
              title={collapsed ? "Mở rộng thanh điều hướng" : "ChapterOS"}
              aria-label={collapsed ? "Mở rộng thanh điều hướng" : "ChapterOS"}
            >
              <GraduationCap strokeWidth={1.5} className="h-5 w-5" />
            </button>
            <div
              className={cn(
                "flex flex-col truncate transition-all duration-200 ease-in-out origin-left whitespace-nowrap overflow-hidden",
                collapsed ? "w-0 opacity-0 -translate-x-2.5 max-w-0 pointer-events-none" : "w-auto opacity-100 translate-x-0 max-w-[160px]"
              )}
            >
              <span className="font-bold tracking-tight text-ink-navy text-base leading-tight truncate">
                ChapterOS
              </span>
              <span className="text-[11px] text-signal-blue font-semibold tracking-wider uppercase truncate">
                Operations Suite
              </span>
            </div>
          </div>
          <Button
            id="btn-toggle-sidebar"
            variant="ghost"
            size="icon-xs"
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:flex text-slate-gray hover:text-ink-navy hover:bg-pebble rounded-lg transition-all duration-200 shrink-0",
              collapsed ? "w-0 opacity-0 p-0 overflow-hidden pointer-events-none" : "w-8 h-8 opacity-100"
            )}
            aria-label="Thu gọn thanh điều hướng"
            title="Thu gọn thanh điều hướng"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-4 space-y-6">
          {/* Operations Section */}
          <div>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200 ease-in-out origin-top",
                collapsed ? "max-h-0 opacity-0 mb-0 pointer-events-none" : "max-h-6 opacity-100 mb-1.5"
              )}
            >
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-gray uppercase truncate">
                Quản trị vận hành
              </p>
            </div>
            <nav className="space-y-1">
              {operationsNavItems.map((item) => (
                <NavLinkItem
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  onCloseMobile={onCloseMobile}
                />
              ))}
            </nav>
          </div>

          {/* System & Tools Section */}
          <div>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200 ease-in-out origin-top",
                collapsed ? "max-h-0 opacity-0 mb-0 pointer-events-none" : "max-h-6 opacity-100 mb-1.5"
              )}
            >
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-gray uppercase truncate">
                Hệ thống & Tiện ích
              </p>
            </div>
            <nav className="space-y-1">
              {visibleSystemNavItems.map((item) => (
                <NavLinkItem
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  onCloseMobile={onCloseMobile}
                />
              ))}
            </nav>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-hairline/60 p-2.5 bg-cloud shrink-0">
          <div
            className={cn(
              "overflow-hidden transition-all duration-200 ease-in-out",
              collapsed ? "max-h-0 opacity-0 pointer-events-none" : "max-h-20 opacity-100"
            )}
          >
            <div className="flex items-center gap-2.5 rounded-lg p-2.5 text-xs text-slate-gray bg-white border border-hairline shadow-calendly-sm">
              <Shield className="h-4 w-4 text-signal-blue shrink-0" />
              <div className="truncate">
                <p className="font-bold text-ink-navy text-xs leading-tight truncate">ChapterOS</p>
                <p className="text-[11px] text-slate-gray truncate">Tác giả: <span className="font-semibold text-signal-blue">tienthuan_0909</span></p>
              </div>
            </div>
          </div>
          {collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex justify-center items-center w-10 h-8 mx-auto text-slate-gray hover:text-ink-navy transition-colors cursor-pointer"
              title="Mở rộng thanh điều hướng"
              aria-label="Mở rộng thanh điều hướng"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
