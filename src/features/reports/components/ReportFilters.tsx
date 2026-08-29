import { useState, useEffect, useId } from 'react';
import { Calendar, Filter, Layers, Building2 } from 'lucide-react';
import type { Term } from '@/types';
import type { ReportFilterParams } from '@/types/report';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import dayjs from 'dayjs';

interface ReportFiltersProps {
  organizationName?: string;
  terms: Term[];
  isTermsLoading?: boolean;
  filterParams: ReportFilterParams;
  onFilterChange: (params: ReportFilterParams) => void;
}

export type TimeRangePreset = 'all' | 'this_month' | 'this_quarter' | 'this_year' | 'custom';

export function ReportFilters({
  organizationName = 'Chi hội',
  terms,
  isTermsLoading = false,
  filterParams,
  onFilterChange,
}: ReportFiltersProps) {
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
      const currentMonth = now.month(); // 0-11
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

  return (
    <div
      id="report-filters-bar"
      className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Active Organization Info */}
        <div className="flex items-center gap-2 text-slate-700">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Chi hội đang chọn</span>
            <span className="text-sm font-bold text-slate-900">{organizationName}</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Term Switcher */}
          <Select
            value={selectedTermId}
            onValueChange={handleTermChange}
            disabled={isTermsLoading}
          >
            <SelectTrigger id={termSelectId} className="h-8.5 text-xs font-semibold bg-slate-50 border-slate-200/80 w-auto min-w-[140px]">
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

          {/* Time Range Preset */}
          <Select
            value={timePreset}
            onValueChange={(val) => handlePresetChange(val as TimeRangePreset)}
          >
            <SelectTrigger id={timePresetSelectId} className="h-8.5 text-xs font-semibold bg-slate-50 border-slate-200/80 w-auto min-w-[140px]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <SelectValue placeholder="Toàn thời gian" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toàn thời gian</SelectItem>
              <SelectItem value="this_month">Tháng này</SelectItem>
              <SelectItem value="this_quarter">Quý này</SelectItem>
              <SelectItem value="this_year">Năm này</SelectItem>
              <SelectItem value="custom">Tùy chỉnh...</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Date Range Inputs (when 'custom' preset is selected) */}
      {timePreset === 'custom' && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-medium text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Khoảng ngày tùy chỉnh:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Từ:</span>
            <DatePicker
              value={customStartDate}
              onChange={(val) => handleCustomDateChange(val || '', customEndDate)}
              placeholder="Từ ngày"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Đến:</span>
            <DatePicker
              value={customEndDate}
              onChange={(val) => handleCustomDateChange(customStartDate, val || '')}
              placeholder="Đến ngày"
            />
          </div>
        </div>
      )}
    </div>
  );
}
