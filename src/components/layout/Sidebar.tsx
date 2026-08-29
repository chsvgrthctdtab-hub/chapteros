import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

import { useAuth } from '@/hooks/useAuth';

export interface NavItem {
  name: string;
  href: string;
  symbol: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'warning';
}

const operationsNavItems: NavItem[] = [
  { name: 'Tổng quan', href: '/', symbol: 'dashboard' },
  { name: 'Collab', href: '/plans', symbol: 'folder_shared' },
  { name: 'Hoạt động', href: '/activities', symbol: 'event_available' },
  { name: 'Nhiệm vụ', href: '/tasks', symbol: 'task_alt' },
  { name: 'Hội viên', href: '/members', symbol: 'group' },
  { name: 'Tài chính', href: '/finance', symbol: 'account_balance_wallet' },
  { name: 'Văn bản', href: '/documents', symbol: 'folder' },
  { name: 'Báo cáo', href: '/reports', symbol: 'analytics' },
];

const systemNavItems: NavItem[] = [
  { name: 'Nhiệm kỳ', href: '/terms', symbol: 'date_range' },
  { name: 'Kiểm tra dữ liệu', href: '/data-quality', symbol: 'verified_user' },
  { name: 'Nhật ký kiểm toán', href: '/audit-logs', symbol: 'history' },
  { name: 'Tích hợp Google', href: '/integrations', symbol: 'extension' },
  { name: 'Cài đặt', href: '/settings', symbol: 'settings' },
];

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
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="app-sidebar"
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-slate-200/90 bg-white transition-all duration-200 ease-in-out lg:static shrink-0 select-none overflow-x-hidden",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0 shadow-2xl rounded-r-3xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand header */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-slate-100 transition-all duration-200",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {collapsed ? (
            <button
              type="button"
              id="btn-sidebar-expand"
              onClick={onToggleCollapse}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-2xs font-bold ring-1 ring-emerald-800/20 hover:bg-emerald-800 active:scale-95 transition-all cursor-pointer"
              title="Expand navigation sidebar"
              aria-label="Expand navigation sidebar"
            >
              <GraduationCap className="h-5 w-5" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-2xs font-bold ring-1 ring-emerald-800/20">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="font-bold tracking-tight text-slate-900 text-base leading-tight truncate">
                    ChapterOS
                  </span>
                  <span className="text-[11px] text-emerald-700/90 font-semibold tracking-wider uppercase truncate">
                    Operations Suite
                  </span>
                </div>
              </div>
              <Button
                id="btn-toggle-sidebar"
                variant="ghost"
                size="icon-xs"
                onClick={onToggleCollapse}
                className="hidden lg:flex text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                aria-label="Collapse navigation sidebar"
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-4 space-y-6">
          {/* Operations Section */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Quản trị vận hành
              </p>
            )}
            <nav className="space-y-1">
              {operationsNavItems.map((item) => {
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === '/'}
                    id={`nav-link-${item.href.replace('/', '') || 'dashboard'}`}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center text-sm font-semibold transition-all duration-200 relative",
                        isActive
                          ? "bg-emerald-100/90 text-emerald-950 font-bold shadow-2xs"
                          : "text-slate-700 hover:bg-slate-200/60 hover:text-slate-950",
                        collapsed
                          ? "justify-center w-12 h-9 mx-auto px-0 rounded-full"
                          : "gap-3.5 px-4 py-2.5 rounded-full"
                      )
                    }
                    title={collapsed ? item.name : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          name={item.symbol}
                          filled={isActive}
                          size={22}
                          className={cn(
                            "shrink-0 transition-all duration-150",
                            isActive ? "text-emerald-900" : "text-slate-500 group-hover:text-slate-800"
                          )}
                        />
                        {!collapsed && (
                          <span className="flex-1 truncate">{item.name}</span>
                        )}
                        {!collapsed && item.badge && (
                          <Badge variant={item.badgeVariant || 'secondary'} className="text-[11px] px-2 py-0.5 rounded-full">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* System & Tools Section */}
          <div>
            {!collapsed && (
              <p className="px-4 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Hệ thống & Tiện ích
              </p>
            )}
            <nav className="space-y-1">
              {visibleSystemNavItems.map((item) => {
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    id={`nav-link-${item.href.replace('/', '')}`}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center text-sm font-semibold transition-all duration-200 relative",
                        isActive
                          ? "bg-emerald-100/90 text-emerald-950 font-bold shadow-2xs"
                          : "text-slate-700 hover:bg-slate-200/60 hover:text-slate-950",
                        collapsed
                          ? "justify-center w-12 h-9 mx-auto px-0 rounded-full"
                          : "gap-3.5 px-4 py-2.5 rounded-full"
                      )
                    }
                    title={collapsed ? item.name : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          name={item.symbol}
                          filled={isActive}
                          size={22}
                          className={cn(
                            "shrink-0 transition-all duration-150",
                            isActive ? "text-emerald-900" : "text-slate-500 group-hover:text-slate-800"
                          )}
                        />
                        {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-100 p-2.5 bg-slate-50/60 shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 rounded-xl p-2.5 text-xs text-slate-500 bg-white border border-slate-200/80 shadow-2xs">
              <Shield className="h-4 w-4 text-emerald-700 shrink-0" />
              <div className="truncate">
                <p className="font-bold text-slate-800 text-xs leading-tight truncate">ChapterOS</p>
                <p className="text-[11px] text-slate-400 truncate">Governance Suite v2</p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex justify-center items-center w-10 h-8 mx-auto text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

