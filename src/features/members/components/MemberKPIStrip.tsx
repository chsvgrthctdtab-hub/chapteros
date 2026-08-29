import React from 'react';
import {
  Users,
  UserCheck,
  GraduationCap,
  CalendarCheck,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { MemberFilterParams } from '../types/member.types';

interface MemberKPIStripProps {
  stats: {
    total: number;
    active: number;
    alumni: number;
    assignedToTerm: number;
    boardCount: number;
  };
  currentFilters: MemberFilterParams;
  onFilterSelect: (partial: Partial<MemberFilterParams>) => void;
  activeTermId?: string;
}

export function MemberKPIStrip({
  stats,
  currentFilters,
  onFilterSelect,
  activeTermId,
}: MemberKPIStripProps) {
  const { t, language } = useLanguage();
  const isAllActive = !currentFilters.status || currentFilters.status === 'all';
  const isActiveFilter = currentFilters.status === 'active';
  const isAlumniFilter = currentFilters.status === 'alumni';
  const isTermFilter = Boolean(activeTermId && currentFilters.termId === activeTermId);
  const isBoardFilter = currentFilters.position === 'bch';

  const cards = [
    {
      id: 'total',
      label: language === 'vi' ? 'Tổng hồ sơ' : 'Total Members',
      value: stats.total,
      subtext: language === 'vi' ? 'Toàn bộ hội viên' : 'All member profiles',
      icon: Users,
      color: 'text-slate-900',
      badgeBg: 'bg-slate-100 text-slate-700',
      active: isAllActive && !isBoardFilter && !isTermFilter,
      onClick: () =>
        onFilterSelect({
          status: 'all',
          position: 'all',
          termId: 'all',
          page: 1,
        }),
    },
    {
      id: 'active',
      label: language === 'vi' ? 'Đang hoạt động' : 'Active',
      value: stats.active,
      subtext: language === 'vi' ? 'Đang sinh hoạt thường xuyên' : 'Regular active members',
      icon: UserCheck,
      color: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      active: isActiveFilter && !isBoardFilter,
      onClick: () =>
        onFilterSelect({
          status: isActiveFilter ? 'all' : 'active',
          page: 1,
        }),
    },
    {
      id: 'alumni',
      label: language === 'vi' ? 'Cựu hội viên' : 'Alumni',
      value: stats.alumni,
      subtext: language === 'vi' ? 'Đã tốt nghiệp ra trường' : 'Graduated members',
      icon: GraduationCap,
      color: 'text-indigo-700',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
      active: isAlumniFilter,
      onClick: () =>
        onFilterSelect({
          status: isAlumniFilter ? 'all' : 'alumni',
          page: 1,
        }),
    },
    {
      id: 'current-term',
      label: language === 'vi' ? 'Đã gán nhiệm kỳ' : 'Current Term',
      value: stats.assignedToTerm,
      subtext: activeTermId
        ? language === 'vi'
          ? 'Có phân công nhiệm vụ'
          : 'Assigned to current term'
        : language === 'vi'
        ? 'Hồ sơ có nhiệm kỳ'
        : 'Assigned to a term',
      icon: CalendarCheck,
      color: 'text-blue-700',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200/80',
      active: isTermFilter,
      onClick: () => {
        if (activeTermId) {
          onFilterSelect({
            termId: isTermFilter ? 'all' : activeTermId,
            page: 1,
          });
        }
      },
    },
    {
      id: 'board',
      label: language === 'vi' ? 'Ban Chấp Hành' : 'Executive Board',
      value: stats.boardCount,
      subtext: language === 'vi' ? 'Cán bộ cốt cán Chi hội' : 'Chapter leadership accounts',
      icon: ShieldAlert,
      color: 'text-indigo-700',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
      active: isBoardFilter,
      onClick: () =>
        onFilterSelect({
          position: isBoardFilter ? 'all' : 'bch',
          page: 1,
        }),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.id}
            type="button"
            onClick={card.onClick}
            className={cn(
              'flex flex-col text-left p-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-2 cursor-pointer active:scale-[0.98]',
              card.active
                ? 'bg-emerald-50/40 border-emerald-600/80 shadow-xs ring-1 ring-emerald-600/20'
                : 'bg-white border-slate-200/80 hover:bg-slate-50/50 hover:border-slate-300/80 hover:shadow-2xs'
            )}
          >
            {/* Top row: Label and Icon */}
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                {card.label}
              </span>
              <div
                className={cn(
                  'h-7 w-7 rounded-xl flex items-center justify-center transition-colors shadow-2xs',
                  card.active
                    ? 'bg-emerald-100/90 text-emerald-800'
                    : 'bg-slate-100/80 text-slate-500 group-hover:text-slate-700 group-hover:bg-slate-200/70'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>

            {/* Middle row: Big Value */}
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={cn('text-xl font-bold tracking-tight', card.color)}>
                {card.value}
              </span>
            </div>

            {/* Bottom row: Subtext */}
            <div className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
              {card.subtext}
            </div>

            {/* Active Indicator bar */}
            {card.active && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-600 rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

