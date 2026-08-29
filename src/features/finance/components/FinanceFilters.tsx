import React, { useState } from 'react';
import {
  Search,
  X,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  SlidersHorizontal,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  Lock,
} from 'lucide-react';
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 space-y-3">
      {/* Primary Toolbar Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions by description, code, person..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all placeholder:text-slate-400"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '', page: 1 })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type pills: All, Income, Expense */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => onFilterChange({ type: 'all', categoryId: 'all', page: 1 })}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              !filters.type || filters.type === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ type: 'income', categoryId: 'all', page: 1 })}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              filters.type === 'income'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            Income
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ type: 'expense', categoryId: 'all', page: 1 })}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              filters.type === 'expense'
                ? 'bg-rose-800 text-white shadow-2xs'
                : 'text-rose-800 hover:bg-rose-50'
            }`}
          >
            <TrendingDown className="h-3 w-3" />
            Expenses
          </button>
        </div>

        {/* Term Dropdown */}
        <div className="flex items-center gap-1.5">
          <Select
            value={filters.termId || 'all'}
            onValueChange={(val) => onFilterChange({ termId: val, page: 1 })}
          >
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 w-auto min-w-[130px]">
              <SelectValue placeholder="Tất cả nhiệm kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhiệm kỳ</SelectItem>
              {terms.map((t) => (
                <SelectItem key={t.id} value={t.id}>
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
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 w-auto min-w-[140px]">
              <SelectValue placeholder="Tất cả danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
              isAdvancedOpen || hasActiveFilters
                ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>Bộ lọc</span>
            {hasActiveFilters && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              title="Đặt lại bộ lọc"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-transparent transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Advanced Filters */}
      {isAdvancedOpen && (
        <div className="pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs animate-in fade-in duration-100">
          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
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
              <SelectTrigger className="w-full h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
                <SelectItem value="pending_approval">Chờ phê duyệt</SelectItem>
                <SelectItem value="approved">Đã phê duyệt</SelectItem>
                <SelectItem value="posted">Đã ghi sổ</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activity Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Hoạt động liên kết
            </label>
            <Select
              value={filters.activityId || 'all'}
              onValueChange={(val) => onFilterChange({ activityId: val, page: 1 })}
            >
              <SelectTrigger className="w-full h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Tất cả hoạt động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hoạt động</SelectItem>
                {activities.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
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
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
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
