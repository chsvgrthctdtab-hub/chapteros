import {
  Search,
  X,
  RotateCcw,
  LayoutGrid,
  List,
  Shield,
  SlidersHorizontal,
} from '@/lib/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { MEMBER_STATUSES } from '../types/member.types';
import type { MemberFilterParams } from '../types/member.types';
import type { Term } from '@/types';

export type MemberViewMode = 'table' | 'cards';

interface MemberFiltersProps {
  filters: MemberFilterParams;
  onFilterChange: (newFilters: Partial<MemberFilterParams>) => void;
  onReset: () => void;
  terms: Term[];
  totalResults?: number;
  viewMode: MemberViewMode;
  onViewModeChange: (mode: MemberViewMode) => void;
}

export function MemberFilters({
  filters,
  onFilterChange,
  onReset,
  terms,
  totalResults,
  viewMode,
  onViewModeChange,
}: MemberFiltersProps) {
  const { language } = useLanguage();
  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.status && filters.status !== 'all') ||
      (filters.position && filters.position !== 'all') ||
      (filters.termId && filters.termId !== 'all') ||
      (filters.sortBy && filters.sortBy !== 'created_at')
  );

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top row: Search, Dropdowns, View Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Input */}
        <div className="lg:col-span-4 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
          <Input
            type="text"
            placeholder={
              language === 'vi'
                ? 'Tìm theo họ tên, MSSV, lớp, email...'
                : 'Search by name, student ID, class, email...'
            }
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="pl-9 pr-9 text-xs h-9 bg-[#f8fafd] border-[#e2e8f0] text-[#1e293b] placeholder:text-[#94a3b8] hover:border-[#b8cce0] hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2e89f7]/20 focus:border-[#2e89f7] transition-all rounded-full font-medium"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '', page: 1 })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#1e293b] p-0.5 rounded-full cursor-pointer"
              title={language === 'vi' ? 'Xóa tìm kiếm' : 'Clear search'}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Term Dropdown */}
        <div className="lg:col-span-3">
          <Select
            value={filters.termId || 'all'}
            onValueChange={(val) => onFilterChange({ termId: val, page: 1 })}
          >
            <SelectTrigger className="w-full h-9 rounded-full border-[#e2e8f0] bg-[#f8fafd] text-xs text-[#1e293b] font-medium">
              <SelectValue placeholder={language === 'vi' ? 'Tất cả nhiệm kỳ' : 'All Terms'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === 'vi' ? 'Tất cả nhiệm kỳ' : 'All Terms'}
              </SelectItem>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name} {term.isCurrent ? (language === 'vi' ? '(Hiện tại)' : '(Current)') : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Dropdown */}
        <div className="lg:col-span-2">
          <Select
            value={filters.status || 'all'}
            onValueChange={(val) =>
              onFilterChange({
                status: val as MemberFilterParams['status'],
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-full h-9 rounded-full border-[#e2e8f0] bg-[#f8fafd] text-xs text-[#1e293b] font-medium">
              <SelectValue placeholder={language === 'vi' ? 'Tất cả trạng thái' : 'All Statuses'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === 'vi' ? 'Tất cả trạng thái' : 'All Statuses'}
              </SelectItem>
              {Object.entries(MEMBER_STATUSES).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {language === 'vi'
                    ? config.label
                    : key === 'active'
                    ? 'Active'
                    : key === 'alumni'
                    ? 'Alumni'
                    : 'Inactive'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View Switcher & Actions */}
        <div className="lg:col-span-3 flex items-center justify-end gap-2">
          <div className="flex items-center bg-[#f0f4f9] p-0.5 rounded-full border border-[#e2e8f0] gap-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#1a73e8] shadow-xs font-semibold'
                  : 'text-[#64748b] hover:text-[#1e293b]'
              }`}
              title={language === 'vi' ? 'Xem dạng bảng' : 'Table view'}
            >
              <List size={14} className={viewMode === 'table' ? 'text-[#2e89f7]' : 'text-[#64748b]'} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('cards')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-[#1a73e8] shadow-xs font-semibold'
                  : 'text-[#64748b] hover:text-[#1e293b]'
              }`}
              title={language === 'vi' ? 'Xem dạng lưới thẻ' : 'Cards view'}
            >
              <LayoutGrid size={14} className={viewMode === 'cards' ? 'text-[#2e89f7]' : 'text-[#64748b]'} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: Quick Filter Chips & Results Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e2e8f0] text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[#64748b] font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5 mr-1">
            <SlidersHorizontal size={12} />
            {language === 'vi' ? 'Lọc nhanh:' : 'Quick Filter:'}
          </span>

          <button
            type="button"
            onClick={() => onFilterChange({ position: 'all', status: 'all', page: 1 })}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 tracking-wide ${
              (!filters.position || filters.position === 'all') &&
              (!filters.status || filters.status === 'all')
                ? 'bg-[#0b3558] text-white border-[#0b3558] shadow-xs'
                : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f0f4f9] hover:text-[#1e293b]'
            }`}
          >
            {language === 'vi' ? 'Tất cả' : 'All'}
          </button>

          <button
            type="button"
            onClick={() =>
              onFilterChange({
                position: filters.position === 'bch' ? 'all' : 'bch',
                page: 1,
              })
            }
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 tracking-wide ${
              filters.position === 'bch'
                ? 'bg-[#e8f0fe] text-[#1a73e8] border-[#c2e7ff] font-bold shadow-xs'
                : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f0f4f9] hover:text-[#1e293b]'
            }`}
          >
            <Shield size={13} />
            {language === 'vi' ? 'Ban Chấp Hành' : 'Executive Board'}
          </button>

          <button
            type="button"
            onClick={() =>
              onFilterChange({
                status: filters.status === 'active' ? 'all' : 'active',
                page: 1,
              })
            }
            className={`px-3.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 tracking-wide ${
              filters.status === 'active'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-xs'
                : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f0f4f9] hover:text-[#1e293b]'
            }`}
          >
            {language === 'vi' ? 'Đang hoạt động' : 'Active'}
          </button>

          <button
            type="button"
            onClick={() =>
              onFilterChange({
                status: filters.status === 'alumni' ? 'all' : 'alumni',
                page: 1,
              })
            }
            className={`px-3.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 tracking-wide ${
              filters.status === 'alumni'
                ? 'bg-[#f0f4f9] text-[#1e293b] border-[#e2e8f0] font-bold shadow-xs'
                : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f0f4f9] hover:text-[#1e293b]'
            }`}
          >
            {language === 'vi' ? 'Cựu hội viên' : 'Alumni'}
          </button>
        </div>

        <div className="flex items-center space-x-3 text-[#64748b]">
          <span>
            {language === 'vi' ? 'Kết quả:' : 'Results:'}{' '}
            <strong className="text-[#0b3558] font-semibold tabular-nums">{totalResults ?? 0}</strong>{' '}
            {filters.position === 'bch'
              ? language === 'vi'
                ? 'cán bộ BCH'
                : 'board accounts'
              : language === 'vi'
              ? 'hội viên'
              : 'members'}
          </span>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-6 text-xs text-[#1a73e8] hover:text-[#005be0] hover:bg-transparent px-1.5 cursor-pointer font-semibold rounded-full"
            >
              <RotateCcw size={12} className="mr-1" />
              {language === 'vi' ? 'Đặt lại' : 'Reset'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
