import React from 'react';
import {
  Building2,
  User,
  Users,
  Wallet,
  Boxes,
  ShieldCheck,
  Wrench,
  ChevronRight,
} from 'lucide-react';

export type SettingsTabId =
  | 'organization'
  | 'profile'
  | 'roles'
  | 'finance'
  | 'integrations'
  | 'security'
  | 'maintenance';

export interface SettingsNavItem {
  id: SettingsTabId;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'general' | 'operations' | 'integrations' | 'security';
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  // General
  {
    id: 'organization',
    label: 'Organization',
    shortDesc: 'Chapter identity & settings',
    icon: Building2,
    group: 'general',
  },
  {
    id: 'profile',
    label: 'Account & Profile',
    shortDesc: 'Personal profile & credentials',
    icon: User,
    group: 'general',
  },
  // Operations
  {
    id: 'roles',
    label: 'Members & Roles',
    shortDesc: 'Executive board & RBAC roles',
    icon: Users,
    group: 'operations',
  },
  {
    id: 'finance',
    label: 'Finance Governance',
    shortDesc: 'Approval rules & accounting',
    icon: Wallet,
    group: 'operations',
  },
  // Integrations
  {
    id: 'integrations',
    label: 'Google Workspace',
    shortDesc: 'Services & OAuth connections',
    icon: Boxes,
    group: 'integrations',
  },
  // Security & Data
  {
    id: 'security',
    label: 'Security & Access',
    shortDesc: 'Permissions & audit tracking',
    icon: ShieldCheck,
    group: 'security',
  },
  {
    id: 'maintenance',
    label: 'Data & Maintenance',
    shortDesc: 'Diagnostics & cache tools',
    icon: Wrench,
    group: 'security',
  },
];

interface SettingsNavRailProps {
  activeTab: SettingsTabId;
  onSelectTab: (tab: SettingsTabId) => void;
}

export function SettingsNavRail({ activeTab, onSelectTab }: SettingsNavRailProps) {
  const groups: Array<{ key: SettingsNavItem['group']; title: string }> = [
    { key: 'general', title: 'GENERAL' },
    { key: 'operations', title: 'OPERATIONS' },
    { key: 'integrations', title: 'INTEGRATIONS' },
    { key: 'security', title: 'SECURITY & DATA' },
  ];

  return (
    <div id="settings-nav-rail" className="w-full">
      {/* Mobile / Tablet Horizontal Navigation Selector */}
      <div className="lg:hidden mb-4 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-1.5 min-w-max p-1 bg-pebble rounded-xl border border-hairline">
          {SETTINGS_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-signal-blue shadow-xs border border-hairline'
                    : 'text-slate-gray hover:text-ink-navy hover:bg-cloud'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-signal-blue' : 'text-mist-gray'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Vertical Navigation Rail */}
      <div className="hidden lg:block space-y-6">
        {groups.map((grp) => {
          const items = SETTINGS_NAV_ITEMS.filter((i) => i.group === grp.key);
          if (items.length === 0) return null;

          return (
            <div key={grp.key} className="space-y-1.5">
              <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-mist-gray">
                {grp.title}
              </h4>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-[#e6f0ff] border border-[#d4e4fa] text-signal-blue shadow-xs font-semibold'
                          : 'bg-transparent border border-transparent text-slate-gray hover:bg-cloud hover:text-ink-navy'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? 'bg-signal-blue text-white'
                              : 'bg-cloud text-mist-gray group-hover:bg-pebble group-hover:text-slate-gray'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 truncate">
                          <p className={`text-xs truncate ${isActive ? 'font-bold text-signal-blue' : 'font-medium'}`}>
                            {item.label}
                          </p>
                          <p className="text-[11px] text-mist-gray truncate mt-0.5">
                            {item.shortDesc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                          isActive
                            ? 'text-signal-blue translate-x-0.5'
                            : 'text-mist-gray/50 opacity-0 group-hover:opacity-100 group-hover:text-mist-gray'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {/* System & Author Info */}
        <div className="pt-4 mt-4 border-t border-hairline text-center text-[11px] text-mist-gray space-y-0.5">
          <p className="font-semibold text-slate-gray">ChapterOS v2.0</p>
          <p>Tác giả: <span className="text-signal-blue font-semibold">tienthuan_0909</span></p>
        </div>
      </div>
    </div>
  );
}
