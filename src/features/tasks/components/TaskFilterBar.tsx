import { useState } from 'react';
import {
  Search,
  X,
  LayoutGrid,
  List,
  FolderKanban,
  AlertTriangle,
  ArrowUpDown,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import type { TaskFilterParams, TaskAssigneeOption, TaskPriority, TaskStatus } from '../types/task.types';
import type { Term, Activity } from '@/types';
import { TASK_STATUSES, TASK_PRIORITIES } from '../types/task.types';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TaskFilterBarProps {
  filters: TaskFilterParams;
  onFilterChange: (newFilters: Partial<TaskFilterParams>) => void;
  onResetFilters: () => void;
  viewMode: 'table' | 'kanban' | 'cards';
  onToggleViewMode: (mode: 'table' | 'kanban' | 'cards') => void;
  terms: Term[];
  activities: Activity[];
  assignees: TaskAssigneeOption[];
  totalResults: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onExportSheets?: () => void;
  onImportSheets?: () => void;
  canManage?: boolean;
}

export function TaskFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  viewMode,
  onToggleViewMode,
  terms,
  activities,
  assignees,
  totalResults,
  onRefresh,
  isRefreshing,
}: TaskFilterBarProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Count active filters (excluding default values)
  let activeFilterCount = 0;
  if (filters.search) activeFilterCount++;
  if (filters.status && filters.status !== 'all') activeFilterCount++;
  if (filters.priority && filters.priority !== 'all') activeFilterCount++;
  if (filters.termId && filters.termId !== 'all') activeFilterCount++;
  if (filters.activityId && filters.activityId !== 'all') activeFilterCount++;
  if (filters.assignedTo && filters.assignedTo !== 'all') activeFilterCount++;
  if (filters.onlyOverdue) activeFilterCount++;

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
      {/* Top Toolbar: Search + Mobile Filter Toggle + Sort + View Switcher */}
      <div className="p-2.5 sm:p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 sm:gap-2.5 border-b border-hairline">
        {/* Left: Search input */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-[200px] max-w-lg">
            <Search className="w-4 h-4 text-mist-gray absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="task-search-input"
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
              placeholder="Tìm theo tên nhiệm vụ, mã hoặc nội dung..."
              className="w-full pl-9 pr-8 h-9 text-xs bg-cloud border border-hairline rounded-lg text-ink-navy placeholder:text-mist-gray focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-signal-blue/20 focus:border-signal-blue transition-all font-medium"
            />
            {filters.search && (
              <button
                type="button"
                id="clear-search-btn"
                onClick={() => onFilterChange({ search: '', page: 1 })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mist-gray hover:text-ink-navy p-0.5 rounded-md cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            id="mobile-filters-toggle-btn"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className={cn(
              'md:hidden inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer shrink-0',
              mobileFiltersOpen || hasActiveFilters
                ? 'bg-[#e6f0ff] border-[#d4e4fa] text-signal-blue'
                : 'bg-white border-hairline text-slate-gray hover:bg-pebble'
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Bộ lọc</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-signal-blue text-[10px] text-white font-bold tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Sort + View Switcher + Actions */}
        <div className="flex items-center gap-2 justify-between md:justify-end shrink-0 flex-wrap sm:flex-nowrap">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-cloud border border-hairline rounded-lg px-2 h-9 text-xs text-ink-navy shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-mist-gray shrink-0" />
            <Select
              value={`${filters.sortBy || 'due_date'}_${filters.sortOrder || 'asc'}`}
              onValueChange={(val) => {
                const [sortBy, sortOrder] = val.split('_') as [
                  TaskFilterParams['sortBy'],
                  TaskFilterParams['sortOrder']
                ];
                onFilterChange({ sortBy, sortOrder, page: 1 });
              }}
            >
              <SelectTrigger className="h-7 border-0 bg-transparent shadow-none px-1 text-xs font-medium text-ink-navy focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date_asc">Hạn chót (Gần nhất)</SelectItem>
                <SelectItem value="due_date_desc">Hạn chót (Xa nhất)</SelectItem>
                <SelectItem value="priority_desc">Ưu tiên (Cao → Thấp)</SelectItem>
                <SelectItem value="progress_desc">Tiến độ (Cao → Thấp)</SelectItem>
                <SelectItem value="created_at_desc">Mới tạo nhất</SelectItem>
                <SelectItem value="title_asc">Tiêu đề (A → Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Switcher: Table | Kanban | Cards */}
          <div className="flex items-center border border-hairline rounded-lg p-0.5 bg-pebble shrink-0 gap-0.5">
            <button
              type="button"
              id="view-mode-table-btn"
              onClick={() => onToggleViewMode('table')}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                viewMode === 'table'
                  ? 'bg-white text-ink-navy shadow-xs font-semibold'
                  : 'text-slate-gray hover:text-ink-navy'
              )}
              title="Xem dạng bảng"
            >
              <List className="w-3.5 h-3.5 text-signal-blue" />
              <span>Bảng</span>
            </button>

            <button
              type="button"
              id="view-mode-kanban-btn"
              onClick={() => onToggleViewMode('kanban')}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                viewMode === 'kanban'
                  ? 'bg-white text-ink-navy shadow-xs font-semibold'
                  : 'text-slate-gray hover:text-ink-navy'
              )}
              title="Xem dạng Kanban"
            >
              <FolderKanban className="w-3.5 h-3.5 text-signal-blue" />
              <span>Kanban</span>
            </button>

            <button
              type="button"
              id="view-mode-cards-btn"
              onClick={() => onToggleViewMode('cards')}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                viewMode === 'cards'
                  ? 'bg-white text-ink-navy shadow-xs font-semibold'
                  : 'text-slate-gray hover:text-ink-navy'
              )}
              title="Xem dạng lưới thẻ"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-signal-blue" />
              <span>Thẻ</span>
            </button>
          </div>

          {/* Quick Refresh */}
          {onRefresh && (
            <button
              type="button"
              id="refresh-tasks-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center w-9 h-9 text-slate-gray hover:text-ink-navy bg-white border border-hairline rounded-lg hover:bg-pebble transition-colors shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
              title="Làm mới dữ liệu nhiệm vụ"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin text-signal-blue')} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Selectors Bar */}
      <div
        className={cn(
          'p-2.5 sm:p-3 bg-cloud/50 border-t border-hairline',
          mobileFiltersOpen ? 'block' : 'hidden md:block'
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Term Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-gray uppercase tracking-wider mb-1">
              Nhiệm kỳ
            </label>
            <Select
              value={filters.termId || 'all'}
              onValueChange={(val) => onFilterChange({ termId: val, page: 1 })}
            >
              <SelectTrigger className="h-8.5 text-xs bg-white border-hairline text-ink-navy">
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

          {/* Activity Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-gray uppercase tracking-wider mb-1">
              Hoạt động
            </label>
            <Select
              value={filters.activityId || 'all'}
              onValueChange={(val) => onFilterChange({ activityId: val, page: 1 })}
            >
              <SelectTrigger className="h-8.5 text-xs bg-white border-hairline text-ink-navy">
                <SelectValue placeholder="Tất cả hoạt động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hoạt động</SelectItem>
                <SelectItem value="standalone">Nhiệm vụ độc lập</SelectItem>
                {activities.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-gray uppercase tracking-wider mb-1">
              Người phụ trách
            </label>
            <Select
              value={filters.assignedTo || 'all'}
              onValueChange={(val) => onFilterChange({ assignedTo: val, page: 1 })}
            >
              <SelectTrigger className="h-8.5 text-xs bg-white border-hairline text-ink-navy">
                <SelectValue placeholder="Tất cả người phụ trách" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả người phụ trách</SelectItem>
                <SelectItem value="unassigned">Chưa phân công</SelectItem>
                {assignees.map((u) => (
                  <SelectItem key={u.profileId} value={u.profileId}>
                    {u.fullName} {u.studentId ? `(${u.studentId})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-gray uppercase tracking-wider mb-1">
              Mức ưu tiên
            </label>
            <Select
              value={filters.priority || 'all'}
              onValueChange={(val) => onFilterChange({ priority: val as TaskPriority | 'all', page: 1 })}
            >
              <SelectTrigger className="h-8.5 text-xs bg-white border-hairline text-ink-navy">
                <SelectValue placeholder="Tất cả mức ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức ưu tiên</SelectItem>
                {Object.entries(TASK_PRIORITIES).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-gray uppercase tracking-wider mb-1">
              Trạng thái
            </label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(val) => onFilterChange({ status: val as TaskStatus | 'all', page: 1 })}
            >
              <SelectTrigger className="h-8.5 text-xs bg-white border-hairline text-ink-navy">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {Object.entries(TASK_STATUSES).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due date / Overdue Filter Button */}
          <div className="flex flex-col justify-end">
            <label className="block text-[10px] font-semibold text-slate-gray uppercase tracking-wider mb-1">
              Hạn chót
            </label>
            <button
              type="button"
              id="toggle-overdue-filter-btn"
              onClick={() => onFilterChange({ onlyOverdue: !filters.onlyOverdue, page: 1 })}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 h-8.5 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                filters.onlyOverdue
                  ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs font-semibold'
                  : 'bg-white hover:bg-pebble border-hairline text-slate-gray'
              )}
            >
              <AlertTriangle className={cn('w-3.5 h-3.5', filters.onlyOverdue ? 'text-rose-600' : 'text-mist-gray')} />
              <span>Chỉ việc quá hạn</span>
            </button>
          </div>
        </div>

        {/* Active Filters Summary Strip */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-hairline text-xs">
            <div className="flex items-center gap-2 text-slate-gray flex-wrap">
              <span>
                Tìm thấy <strong className="text-ink-navy font-semibold tabular-nums">{totalResults}</strong> nhiệm vụ phù hợp
              </span>
            </div>

            <button
              type="button"
              id="reset-task-filters-btn"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-signal-blue hover:text-[#005be0] hover:underline transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
