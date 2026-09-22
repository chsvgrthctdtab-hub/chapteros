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
  const { language } = useLanguage();
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
      color: 'text-ink-navy',
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
      color: 'text-signal-blue',
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
      color: 'text-signal-blue',
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
      subtext: language === 'vi' ? 'Cán bộ cốt cán Đơn vị' : 'Organization leadership accounts',
      icon: ShieldAlert,
      color: 'text-signal-blue',
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
              'flex flex-col text-left p-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-signal-blue/40 focus-visible:ring-offset-2 cursor-pointer active:scale-[0.98]',
              card.active
                ? 'bg-[#e6f0ff]/50 border-signal-blue shadow-xs ring-1 ring-signal-blue/20'
                : 'bg-white border-hairline hover:bg-cloud hover:border-slate-gray/40 hover:shadow-xs'
            )}
          >
            {/* Top row: Label and Icon */}
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider truncate">
                {card.label}
              </span>
              <div
                className={cn(
                  'h-7 w-7 rounded-xl flex items-center justify-center transition-colors shadow-xs',
                  card.active
                    ? 'bg-[#e6f0ff] text-signal-blue border border-[#d4e4fa]'
                    : 'bg-pebble text-slate-gray group-hover:text-ink-navy group-hover:bg-cloud'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>

            {/* Middle row: Big Value */}
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={cn('text-xl font-bold tracking-tight tabular-nums', card.color)}>
                {card.value}
              </span>
            </div>

            {/* Bottom row: Subtext */}
            <div className="text-[11px] text-slate-gray truncate mt-0.5 font-normal">
              {card.subtext}
            </div>

            {/* Active Indicator bar */}
            {card.active && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-signal-blue rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
