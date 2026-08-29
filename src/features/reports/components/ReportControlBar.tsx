import { useState, useEffect, useId } from 'react';
import { Calendar, Filter, Layers, RotateCcw, ChevronDown, Check } from 'lucide-react';
import type { Term } from '@/types';
import type { ReportFilterParams } from '@/types/report';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import dayjs from 'dayjs';

export type TimeRangePreset = 'all' | 'this_month' | 'this_quarter' | 'this_year' | 'custom';

export type ReportScope = 'overview' | 'activities' | 'members' | 'tasks' | 'finance' | 'terms';

interface ReportControlBarProps {
  terms: Term[];
  isTermsLoading?: boolean;
  filterParams: ReportFilterParams;
  onFilterChange: (params: ReportFilterParams) => void;
  activeScope: ReportScope;
  onScopeChange: (scope: ReportScope) => void;
}

export function ReportControlBar({
  terms,
  isTermsLoading = false,
  filterParams,
  onFilterChange,
  activeScope,
  onScopeChange,
}: ReportControlBarProps) {
  const [selectedTermId, setSelectedTermId] = useState<string>(filterParams.termId || 'all');
  const [timePreset, setTimePreset] = useState<TimeRangePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(filterParams.startDate || '');
  const [customEndDate, setCustomEndDate] = useState<string>(filterParams.endDate || '');

  const termSelectId = useId();
  const timePresetSelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();

  // Sync internal selected term if parent changes it
  useEffect(() => {
    setSelectedTermId(filterParams.termId || 'all');
  }, [filterParams.termId]);

  // Handle Term Selection
  const handleTermChange = (termId: string) => {
    setSelectedTermId(termId);
    onFilterChange({
      ...filterParams,
      termId: termId === 'all' ? undefined : termId,
    });
  };

  // Handle Time Range Preset
  const handlePresetChange = (preset: TimeRangePreset) => {
    setTimePreset(preset);

    const now = dayjs();
    let startDate: string | undefined = undefined;
    let endDate: string | undefined = undefined;

    if (preset === 'this_month') {
      startDate = now.startOf('month').format('YYYY-MM-DD');
      endDate = now.endOf('month').format('YYYY-MM-DD');
    } else if (preset === 'this_quarter') {
      const currentMonth = now.month();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      startDate = now.month(quarterStartMonth).startOf('month').format('YYYY-MM-DD');
      endDate = now.month(quarterStartMonth + 2).endOf('month').format('YYYY-MM-DD');
    } else if (preset === 'this_year') {
      startDate = now.startOf('year').format('YYYY-MM-DD');
      endDate = now.endOf('year').format('YYYY-MM-DD');
    } else if (preset === 'custom') {
      startDate = customStartDate || undefined;
      endDate = customEndDate || undefined;
    }

    onFilterChange({
      termId: selectedTermId === 'all' ? undefined : selectedTermId,
      startDate,
      endDate,
    });
  };

  // Handle Custom Date Range Change
  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    if (timePreset === 'custom') {
      onFilterChange({
        termId: selectedTermId === 'all' ? undefined : selectedTermId,
        startDate: start || undefined,
        endDate: end || undefined,
      });
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedTermId('all');
    setTimePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    onFilterChange({
      termId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const isFiltered = selectedTermId !== 'all' || timePreset !== 'all' || !!filterParams.startDate || !!filterParams.endDate;

  const currentTermObj = terms.find((t) => t.id === selectedTermId);

  const scopes: Array<{ id: ReportScope; label: string }> = [
    { id: 'overview', label: 'Tổng quan điều hành' },
    { id: 'activities', label: 'Hoạt động & Sự kiện' },
    { id: 'members', label: 'Nhân sự & Hội viên' },
    { id: 'tasks', label: 'Thực thi Nhiệm vụ' },
    { id: 'finance', label: 'Tài chính & Ngân sách' },
    { id: 'terms', label: 'So sánh Nhiệm kỳ' },
  ];

  return (
    <div className="space-y-3 print:hidden" id="report-control-bar">
      {/* Top row: Filter selectors and Quick Reset */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Active context indicator */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Bộ lọc báo cáo:
            </span>

            {/* Term Dropdown */}
            <Select
              value={selectedTermId}
              onValueChange={handleTermChange}
              disabled={isTermsLoading}
            >
              <SelectTrigger id={termSelectId} className="h-8.5 text-xs font-semibold bg-slate-50 border-slate-200/90 w-auto min-w-[140px]">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <SelectValue placeholder="Tất cả nhiệm kỳ" />
                </div>
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

            {/* Time Preset Dropdown */}
            <Select
              value={timePreset}
              onValueChange={(val) => handlePresetChange(val as TimeRangePreset)}
            >
              <SelectTrigger id={timePresetSelectId} className="h-8.5 text-xs font-semibold bg-slate-50 border-slate-200/90 w-auto min-w-[140px]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <SelectValue placeholder="Toàn thời gian" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toàn thời gian</SelectItem>
                <SelectItem value="this_month">Tháng này</SelectItem>
                <SelectItem value="this_quarter">Quý này</SelectItem>
                <SelectItem value="this_year">Năm nay</SelectItem>
                <SelectItem value="custom">Khoảng ngày tùy chỉnh...</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Button */}
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 px-2.5 text-2xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Đặt lại
              </Button>
            )}
          </div>

          {/* Right: Active Period Summary Chip */}
          <div className="flex items-center gap-2 text-2xs text-slate-500 bg-slate-50 border border-slate-200/70 rounded-lg px-3 py-1.5 self-start lg:self-center">
            <span className="font-medium text-slate-700">
              Phạm vi: {currentTermObj ? currentTermObj.name : 'Toàn thời gian'}
            </span>
            {(filterParams.startDate || filterParams.endDate) && (
              <>
                <span className="text-slate-300">•</span>
                <span>
                  {filterParams.startDate ? dayjs(filterParams.startDate).format('DD/MM/YYYY') : 'Từ đầu'}
                  {' → '}
                  {filterParams.endDate ? dayjs(filterParams.endDate).format('DD/MM/YYYY') : 'Hiện tại'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Custom date range row */}
        {timePreset === 'custom' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-2xs font-medium text-slate-500">Từ ngày:</span>
              <DatePicker
                value={customStartDate}
                onChange={(val) => handleCustomDateChange(val || '', customEndDate)}
                placeholder="Từ ngày"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xs font-medium text-slate-500">Đến ngày:</span>
              <DatePicker
                value={customEndDate}
                onChange={(val) => handleCustomDateChange(customStartDate, val || '')}
                placeholder="Đến ngày"
              />
            </div>
          </div>
        )}
      </div>

      {/* Scope Navigation Tabs */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 min-w-max">
          {scopes.map((scope) => {
            const isActive = activeScope === scope.id;
            return (
              <button
                key={scope.id}
                type="button"
                onClick={() => onScopeChange(scope.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {scope.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
