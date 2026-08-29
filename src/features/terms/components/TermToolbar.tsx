import React from 'react';
import { Search, Filter, ArrowUpDown, LayoutGrid, Table as TableIcon, Columns, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { TermStatus } from '@/types';

export type TermViewMode = 'table' | 'cards' | 'comparison';
export type TermSortOption = 'start_desc' | 'start_asc' | 'end_desc' | 'name_asc';

interface TermToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  sortOption: TermSortOption;
  onSortOptionChange: (val: TermSortOption) => void;
  viewMode: TermViewMode;
  onViewModeChange: (val: TermViewMode) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  totalResultsCount: number;
}

export function TermToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortOptionChange,
  viewMode,
  onViewModeChange,
  onResetFilters,
  hasActiveFilters,
  totalResultsCount,
}: TermToolbarProps) {
  return (
    <div
      id="term-toolbar"
      className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/90 bg-white shadow-2xs"
    >
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo tên, năm học, mốc thời gian..."
          className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filters, Sort, and View Switches */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={onStatusFilterChange}
        >
          <SelectTrigger className="h-8.5 text-xs bg-slate-50 border-slate-200 w-auto min-w-[140px]">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="draft">Dự thảo / Sắp tới</SelectItem>
            <SelectItem value="completed">Đã kết thúc</SelectItem>
            <SelectItem value="archived">Lưu trữ</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Filter */}
        <Select
          value={sortOption}
          onValueChange={(val) => onSortOptionChange(val as TermSortOption)}
        >
          <SelectTrigger className="h-8.5 text-xs bg-slate-50 border-slate-200 w-auto min-w-[140px]">
            <SelectValue placeholder="Sắp xếp..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start_desc">Mới nhất trước</SelectItem>
            <SelectItem value="start_asc">Cũ nhất trước</SelectItem>
            <SelectItem value="end_desc">Ngày kết thúc gần nhất</SelectItem>
            <SelectItem value="name_asc">Tên nhiệm kỳ (A-Z)</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        )}

        <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            title="Dense Table View"
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            title="Card Grid View"
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('comparison')}
            title="Side-by-Side Comparison"
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              viewMode === 'comparison'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
