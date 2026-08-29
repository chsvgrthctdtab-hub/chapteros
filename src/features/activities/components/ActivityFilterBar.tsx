import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  CalendarDays,
  ArrowUpDown,
  Download,
  Upload,
} from 'lucide-react';
import { ACTIVITY_CATEGORIES, type ActivityFilterParams } from '../types/activity.types';
import type { ActivityCategory, Term } from '@/types';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';

export type ActivityViewMode = 'table' | 'cards' | 'calendar';

interface ActivityFilterBarProps {
  filters: ActivityFilterParams;
  onFilterChange: (filters: Partial<ActivityFilterParams>) => void;
  onResetFilters: () => void;
  terms: Term[];
  viewMode: ActivityViewMode;
  onViewModeChange: (mode: ActivityViewMode) => void;
  onExportSheets?: () => void;
  onImportSheets?: () => void;
  canManage?: boolean;
  isLoading?: boolean;
}

export function ActivityFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  terms,
  viewMode,
  onViewModeChange,
  onExportSheets,
  onImportSheets,
  canManage = false,
  isLoading = false,
}: ActivityFilterBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Calculate active filters count
  let activeFilterCount = 0;
  if (filters.termId && filters.termId !== 'all') activeFilterCount++;
  if (filters.category && filters.category !== 'all') activeFilterCount++;
  if (filters.startDateFrom) activeFilterCount++;
  if (filters.startDateTo) activeFilterCount++;
  if (filters.sortBy && filters.sortBy !== 'start_date') activeFilterCount++;

  const hasActiveFilters = activeFilterCount > 0 || Boolean(filters.search && filters.search.trim() !== '');

  return (
    <div className="space-y-2.5">
      {/* Primary Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="activity-search-input"
            type="text"
            placeholder="Search activities by name, code, venue..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50/80 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 font-medium transition-all"
          />
          {filters.search && (
            <button
              type="button"
              id="clear-activity-search-btn"
              onClick={() => onFilterChange({ search: '', page: 1 })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Center: Inline quick filter dropdowns (Desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Term Selector */}
          <Select
            value={filters.termId || 'all'}
            onValueChange={(val) => onFilterChange({ termId: val, page: 1 })}
          >
            <SelectTrigger id="activity-filter-term" className="h-8.5 text-xs bg-slate-50 border-slate-200 w-auto min-w-[140px]">
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

          {/* Category Selector */}
          <Select
            value={filters.category || 'all'}
            onValueChange={(val) => onFilterChange({ category: val as ActivityCategory | 'all', page: 1 })}
          >
            <SelectTrigger id="activity-filter-category" className="h-8.5 text-xs bg-slate-50 border-slate-200 w-auto min-w-[140px]">
              <SelectValue placeholder="Tất cả phân loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phân loại</SelectItem>
              {Object.values(ACTIVITY_CATEGORIES).map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select
            value={`${filters.sortBy || 'start_date'}_${filters.sortOrder || 'desc'}`}
            onValueChange={(val) => {
              const [sortBy, sortOrder] = val.split('_') as [ActivityFilterParams['sortBy'], ActivityFilterParams['sortOrder']];
              onFilterChange({ sortBy, sortOrder, page: 1 });
            }}
          >
            <SelectTrigger id="activity-filter-sort" className="h-8.5 text-xs bg-slate-50 border-slate-200 w-auto min-w-[150px]">
              <SelectValue placeholder="Sắp xếp theo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start_date_desc">Ngày tổ chức (Mới nhất)</SelectItem>
              <SelectItem value="start_date_asc">Ngày tổ chức (Cũ nhất)</SelectItem>
              <SelectItem value="created_at_desc">Mới tạo gần đây</SelectItem>
              <SelectItem value="title_asc">Tiêu đề (A - Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right Actions & View Switcher */}
        <div className="flex items-center justify-between md:justify-end gap-1.5 flex-wrap">
          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            id="open-activity-filter-drawer-btn"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={cn(
              'lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer',
              activeFilterCount > 0 || isDrawerOpen
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Bộ lọc</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Reset button if filters active */}
          {hasActiveFilters && (
            <button
              type="button"
              id="reset-activity-filters-btn"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors font-medium cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          )}

          {/* View Mode Toggle: Table | Cards | Calendar */}
          <div className="flex items-center border border-slate-200/90 rounded-lg p-0.5 bg-slate-100/80 shrink-0 gap-0.5">
            <button
              type="button"
              id="activity-view-table-btn"
              onClick={() => onViewModeChange('table')}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              )}
              title="Bảng"
            >
              <TableIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden md:inline">Bảng</span>
            </button>

            <button
              type="button"
              id="activity-view-cards-btn"
              onClick={() => onViewModeChange('cards')}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              )}
              title="Thẻ"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden md:inline">Thẻ</span>
            </button>

            <button
              type="button"
              id="activity-view-calendar-btn"
              onClick={() => onViewModeChange('calendar')}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              )}
              title="Lịch"
            >
              <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden md:inline">Lịch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded / Mobile Filters Drawer Panel */}
      {isDrawerOpen && (
        <div className="lg:hidden bg-slate-50/90 rounded-xl border border-slate-200/90 p-3.5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Tùy chọn bộ lọc
            </span>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Term */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Nhiệm kỳ</label>
              <Select
                value={filters.termId || 'all'}
                onValueChange={(val) => onFilterChange({ termId: val, page: 1 })}
              >
                <SelectTrigger className="w-full h-8.5 text-xs bg-white">
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
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Phân loại</label>
              <Select
                value={filters.category || 'all'}
                onValueChange={(val) => onFilterChange({ category: val as ActivityCategory | 'all', page: 1 })}
              >
                <SelectTrigger className="w-full h-8.5 text-xs bg-white">
                  <SelectValue placeholder="Tất cả phân loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phân loại</SelectItem>
                  {Object.values(ACTIVITY_CATEGORIES).map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date From */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Từ ngày</label>
              <DatePicker
                value={filters.startDateFrom || ''}
                onChange={(val) => onFilterChange({ startDateFrom: val || undefined, page: 1 })}
                placeholder="Chọn từ ngày..."
                className="w-full text-xs"
              />
            </div>

            {/* Start Date To */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Đến ngày</label>
              <DatePicker
                value={filters.startDateTo || ''}
                onChange={(val) => onFilterChange({ startDateTo: val || undefined, page: 1 })}
                placeholder="Chọn đến ngày..."
                className="w-full text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
