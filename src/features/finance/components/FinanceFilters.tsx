import React, { useState } from 'react';
import {
  Search,
  X,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  SlidersHorizontal,
} from '@/lib/icons';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type {
  FinanceFilterParams,
  FinanceCategoryOption,
  FinanceTermOption,
  FinanceActivityOption,
  TransactionStatus,
} from '../types/finance.types';

interface FinanceFiltersProps {
  filters: FinanceFilterParams;
  onFilterChange: (newFilters: Partial<FinanceFilterParams>) => void;
  onReset: () => void;
  categories: FinanceCategoryOption[];
  terms: FinanceTermOption[];
  activities: FinanceActivityOption[];
}

export function FinanceFilters({
  filters,
  onFilterChange,
  onReset,
  categories,
  terms,
  activities,
}: FinanceFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Filter categories matching the selected type if type is not 'all'
  const filteredCategories = categories.filter((cat) => {
    if (!filters.type || filters.type === 'all') return true;
    return cat.type === filters.type;
  });

  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.type && filters.type !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    (filters.categoryId && filters.categoryId !== 'all') ||
    (filters.termId && filters.termId !== 'all') ||
    (filters.activityId && filters.activityId !== 'all') ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate);

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs p-3 space-y-3">
      {/* Primary Toolbar Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm phiếu thu/chi theo nội dung, mã, người lập..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#f8fafd] border border-[#e2e8f0] rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2e89f7]/20 focus:border-[#2e89f7] text-[#1e293b] placeholder:text-[#94a3b8] transition-all font-medium"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '', page: 1 })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#1e293b] p-0.5 rounded-full cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Type pills: All, Income, Expense */}
        <div className="flex items-center gap-0.5 bg-[#f0f4f9] p-0.5 rounded-full border border-[#e2e8f0] self-start md:self-auto">
          <button
            type="button"
            onClick={() => onFilterChange({ type: 'all', categoryId: 'all', page: 1 })}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              !filters.type || filters.type === 'all'
                ? 'bg-white text-[#1a73e8] shadow-xs'
                : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ type: 'income', categoryId: 'all', page: 1 })}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              filters.type === 'income'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <TrendingUp size={13} />
            Thu vào
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ type: 'expense', categoryId: 'all', page: 1 })}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              filters.type === 'expense'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <TrendingDown size={13} />
            Chi ra
          </button>
        </div>

        {/* Term Dropdown */}
        <div className="flex items-center gap-1.5">
          <Select
            value={filters.termId || 'all'}
            onValueChange={(val) => onFilterChange({ termId: val, page: 1 })}
          >
            <SelectTrigger className="h-8.5 text-xs bg-[#f8fafd] border-[#e2e8f0] rounded-full text-[#1e293b] w-auto min-w-[130px]">
              <SelectValue placeholder="Tất cả nhiệm kỳ" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-[#e2e8f0] bg-white shadow-lg">
              <SelectItem value="all" className="text-xs">Tất cả nhiệm kỳ</SelectItem>
              {terms.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.name} {t.isCurrent ? '(Hiện tại)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Dropdown */}
          <Select
            value={filters.categoryId || 'all'}
            onValueChange={(val) => onFilterChange({ categoryId: val, page: 1 })}
          >
            <SelectTrigger className="h-8.5 text-xs bg-[#f8fafd] border-[#e2e8f0] rounded-full text-[#1e293b] w-auto min-w-[140px]">
              <SelectValue placeholder="Tất cả danh mục" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-[#e2e8f0] bg-white shadow-lg">
              <SelectItem value="all" className="text-xs">Tất cả danh mục</SelectItem>
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer ${
              isAdvancedOpen || hasActiveFilters
                ? 'bg-[#0b3558] text-white border-[#0b3558] font-semibold'
                : 'bg-[#f8fafd] text-[#1e293b] border-[#e2e8f0] hover:bg-[#f0f4f9]'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Bộ lọc</span>
            {hasActiveFilters && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#2e89f7]" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              title="Đặt lại bộ lọc"
              className="p-1.5 text-[#94a3b8] hover:text-[#1e293b] hover:bg-[#f0f4f9] rounded-full border border-transparent transition-all cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Advanced Filters */}
      {isAdvancedOpen && (
        <div className="pt-2.5 border-t border-[#e2e8f0] grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs animate-in fade-in duration-100">
          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#64748b] mb-1">
              Trạng thái phê duyệt
            </label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(val) =>
                onFilterChange({
                  status: val as 'all' | TransactionStatus,
                  page: 1,
                })
              }
            >
              <SelectTrigger className="w-full h-8.5 text-xs bg-[#f8fafd] border-[#e2e8f0] rounded-xl text-[#1e293b]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-[#e2e8f0] bg-white shadow-lg">
                <SelectItem value="all" className="text-xs">Tất cả trạng thái</SelectItem>
                <SelectItem value="draft" className="text-xs">Bản nháp</SelectItem>
                <SelectItem value="pending_approval" className="text-xs">Chờ phê duyệt</SelectItem>
                <SelectItem value="approved" className="text-xs">Đã phê duyệt</SelectItem>
                <SelectItem value="posted" className="text-xs">Đã ghi sổ</SelectItem>
                <SelectItem value="rejected" className="text-xs">Từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activity Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#64748b] mb-1">
              Hoạt động liên kết
            </label>
            <Select
              value={filters.activityId || 'all'}
              onValueChange={(val) => onFilterChange({ activityId: val, page: 1 })}
            >
              <SelectTrigger className="w-full h-8.5 text-xs bg-[#f8fafd] border-[#e2e8f0] rounded-xl text-[#1e293b]">
                <SelectValue placeholder="Tất cả hoạt động" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-[#e2e8f0] bg-white shadow-lg">
                <SelectItem value="all" className="text-xs">Tất cả hoạt động</SelectItem>
                {activities.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="text-xs">
                    {a.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold text-[#64748b] mb-1">
              Từ ngày
            </label>
            <DatePicker
              value={filters.startDate || ''}
              onChange={(val) => onFilterChange({ startDate: val || undefined, page: 1 })}
              placeholder="Chọn từ ngày..."
              className="w-full text-xs"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-semibold text-[#64748b] mb-1">
              Đến ngày
            </label>
            <DatePicker
              value={filters.endDate || ''}
              onChange={(val) => onFilterChange({ endDate: val || undefined, page: 1 })}
              placeholder="Chọn đến ngày..."
              className="w-full text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}
