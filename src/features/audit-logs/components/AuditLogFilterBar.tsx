import React from 'react';
import {
  Search,
  RotateCcw,
  Calendar,
  Layers,
  Download,
  Filter,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import dayjs from 'dayjs';
import type { AuditLogFilterParams } from '../types/audit-log.types';
import { AUDIT_MODULE_CONFIG } from '../utils/audit-log-formatter';

interface AuditLogFilterBarProps {
  filters: AuditLogFilterParams;
  onFilterChange: (newFilters: Partial<AuditLogFilterParams>) => void;
  onResetFilters: () => void;
  onExport?: () => void;
  isExporting?: boolean;
  totalCount?: number;
}

const QUICK_MODULE_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'member', label: 'Hội viên' },
  { id: 'finance', label: 'Tài chính' },
  { id: 'activity', label: 'Hoạt động' },
  { id: 'task', label: 'Công việc' },
  { id: 'document', label: 'Tài liệu' },
  { id: 'term', label: 'Nhiệm kỳ' },
  { id: 'google_integration', label: 'Google Workspace' },
];

export function AuditLogFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  onExport,
  isExporting,
  totalCount = 0,
}: AuditLogFilterBarProps) {
  const activeFilterCount = [
    Boolean(filters.module && filters.module !== 'all'),
    Boolean(filters.search && filters.search.trim() !== ''),
    Boolean(filters.dateFrom),
    Boolean(filters.dateTo),
  ].filter(Boolean).length;

  const handleDatePreset = (preset: 'today' | '7days' | '30days' | 'all') => {
    const today = dayjs().format('YYYY-MM-DD');
    if (preset === 'today') {
      onFilterChange({ dateFrom: today, dateTo: today, page: 1 });
    } else if (preset === '7days') {
      onFilterChange({
        dateFrom: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
        dateTo: today,
        page: 1,
      });
    } else if (preset === '30days') {
      onFilterChange({
        dateFrom: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
        dateTo: today,
        page: 1,
      });
    } else {
      onFilterChange({ dateFrom: '', dateTo: '', page: 1 });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3.5 shadow-2xs">
      {/* Category Pills Header */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
          {QUICK_MODULE_CATEGORIES.map((cat) => {
            const isSelected =
              (!filters.module && cat.id === 'all') || filters.module === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  onFilterChange({ module: cat.id === 'all' ? 'all' : cat.id, page: 1 })
                }
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 bg-slate-50 border border-slate-200/60'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isExporting || totalCount === 0}
            className="text-xs h-8 px-2.5 shrink-0 text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
            title="Xuất dữ liệu kiểm toán CSV"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            <span>Xuất CSV</span>
          </Button>
        )}
      </div>

      {/* Main Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
        {/* Search by text */}
        <div className="sm:col-span-2 lg:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder="Tìm theo hành động, tên, ID..."
            className="pl-9 pr-8 text-xs h-9"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: '', page: 1 })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Detailed Module Selector */}
        <div className="lg:col-span-3">
          <Select
            value={filters.module || 'all'}
            onValueChange={(val) => onFilterChange({ module: val, page: 1 })}
          >
            <SelectTrigger className="text-xs h-9">
              <div className="flex items-center gap-2 truncate">
                <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <SelectValue placeholder="Tất cả phân hệ" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-medium">
                Tất cả phân hệ
              </SelectItem>
              {Object.entries(AUDIT_MODULE_CONFIG).map(([key, item]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="lg:col-span-2">
          <DatePicker
            value={filters.dateFrom || ''}
            onChange={(val) => onFilterChange({ dateFrom: val || undefined, page: 1 })}
            placeholder="Từ ngày"
          />
        </div>

        {/* Date To */}
        <div className="lg:col-span-2">
          <DatePicker
            value={filters.dateTo || ''}
            onChange={(val) => onFilterChange({ dateTo: val || undefined, page: 1 })}
            placeholder="Đến ngày"
          />
        </div>

        {/* Reset Filter Button */}
        <div className="lg:col-span-1 flex items-center justify-end">
          {activeFilterCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="w-full text-xs h-9 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
              title="Đặt lại tất cả bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Xóa ({activeFilterCount})</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="w-full text-xs h-9 px-2 text-slate-300"
            >
              <Filter className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Date Quick Presets */}
      <div className="flex items-center gap-2 pt-0.5 text-xs text-slate-500">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">Lọc nhanh thời gian:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleDatePreset('today')}
            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => handleDatePreset('7days')}
            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => handleDatePreset('30days')}
            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            30 ngày qua
          </button>
          <button
            type="button"
            onClick={() => handleDatePreset('all')}
            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            Tất cả thời gian
          </button>
        </div>
      </div>
    </div>
  );
}
