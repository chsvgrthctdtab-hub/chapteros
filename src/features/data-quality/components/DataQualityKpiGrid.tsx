import {
  Layers,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
} from 'lucide-react';
import type { DataQualitySeverity } from '../types';

interface DataQualityKpiGridProps {
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  healthyCount?: number;
  selectedSeverity?: DataQualitySeverity | 'all';
  onSelectSeverity: (severity: DataQualitySeverity | 'all') => void;
}

export function DataQualityKpiGrid({
  totalIssues,
  criticalCount,
  warningCount,
  infoCount,
  selectedSeverity = 'all',
  onSelectSeverity,
}: DataQualityKpiGridProps) {
  const isAllSelected = selectedSeverity === 'all';
  const isCriticalSelected = selectedSeverity === 'critical';
  const isWarningSelected = selectedSeverity === 'warning';
  const isInfoSelected = selectedSeverity === 'info';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Issues Card */}
      <div
        id="kpi-card-total-issues"
        onClick={() => onSelectSeverity('all')}
        className={`group relative overflow-hidden rounded-xl p-5 sm:p-6 border transition-all duration-150 cursor-pointer ${
          isAllSelected
            ? 'bg-ink-navy text-white border-ink-navy shadow-md ring-2 ring-ink-navy/20'
            : 'bg-white text-ink-navy border-hairline hover:border-slate-gray shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isAllSelected ? 'text-mist-gray' : 'text-mist-gray'
            }`}
          >
            Tổng vấn đề phát hiện
          </span>
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-lg ${
              isAllSelected ? 'bg-white/10 text-white' : 'bg-cloud text-slate-gray'
            }`}
          >
            <Layers className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">{totalIssues}</span>
          <span
            className={`text-xs font-medium ${
              isAllSelected ? 'text-mist-gray' : 'text-mist-gray'
            }`}
          >
            mục cần rà soát
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-hairline/30">
          <span className={isAllSelected ? 'text-mist-gray' : 'text-mist-gray'}>
            {totalIssues === 0 ? 'Hệ thống đạt chuẩn' : 'Bấm để lọc tất cả'}
          </span>
          <ChevronRight
            className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
              isAllSelected ? 'text-signal-blue' : 'text-mist-gray'
            }`}
          />
        </div>
      </div>

      {/* 2. Critical Issues Card */}
      <div
        id="kpi-card-critical-issues"
        onClick={() => onSelectSeverity('critical')}
        className={`group relative overflow-hidden rounded-xl p-5 sm:p-6 border transition-all duration-150 cursor-pointer ${
          isCriticalSelected
            ? 'bg-rose-900 text-white border-rose-900 shadow-md ring-2 ring-rose-600/30'
            : 'bg-white text-ink-navy border-hairline hover:border-rose-300 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isCriticalSelected ? 'text-rose-200' : 'text-rose-700'
            }`}
          >
            Nghiêm trọng (Critical)
          </span>
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-lg ${
              isCriticalSelected ? 'bg-rose-800 text-rose-200' : 'bg-rose-50 text-rose-600'
            }`}
          >
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span
            className={`text-3xl sm:text-4xl font-bold tracking-tight tabular-nums ${
              isCriticalSelected ? 'text-white' : 'text-rose-600'
            }`}
          >
            {criticalCount}
          </span>
          <span
            className={`text-xs font-medium ${
              isCriticalSelected ? 'text-rose-300' : 'text-mist-gray'
            }`}
          >
            lỗi vận hành
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-rose-100/30">
          <span className={isCriticalSelected ? 'text-rose-200' : 'text-mist-gray'}>
            {criticalCount > 0 ? 'Cần xử lý ngay' : 'Không có lỗi nghiêm trọng'}
          </span>
          <ChevronRight
            className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
              isCriticalSelected ? 'text-rose-300' : 'text-mist-gray'
            }`}
          />
        </div>
      </div>

      {/* 3. Warning Issues Card */}
      <div
        id="kpi-card-warning-issues"
        onClick={() => onSelectSeverity('warning')}
        className={`group relative overflow-hidden rounded-xl p-5 sm:p-6 border transition-all duration-150 cursor-pointer ${
          isWarningSelected
            ? 'bg-amber-900 text-white border-amber-900 shadow-md ring-2 ring-amber-600/30'
            : 'bg-white text-ink-navy border-hairline hover:border-amber-300 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isWarningSelected ? 'text-amber-200' : 'text-amber-700'
            }`}
          >
            Cảnh báo (Warnings)
          </span>
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-lg ${
              isWarningSelected ? 'bg-amber-800 text-amber-200' : 'bg-amber-50 text-amber-600'
            }`}
          >
            <AlertCircle className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span
            className={`text-3xl sm:text-4xl font-bold tracking-tight tabular-nums ${
              isWarningSelected ? 'text-white' : 'text-amber-600'
            }`}
          >
            {warningCount}
          </span>
          <span
            className={`text-xs font-medium ${
              isWarningSelected ? 'text-amber-300' : 'text-mist-gray'
            }`}
          >
            cảnh báo
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-amber-100/30">
          <span className={isWarningSelected ? 'text-amber-200' : 'text-mist-gray'}>
            {warningCount > 0 ? 'Thiếu thông tin / Quá hạn' : 'Dữ liệu chuẩn chỉ'}
          </span>
          <ChevronRight
            className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
              isWarningSelected ? 'text-amber-300' : 'text-mist-gray'
            }`}
          />
        </div>
      </div>

      {/* 4. Info / Suggestion Card */}
      <div
        id="kpi-card-info-issues"
        onClick={() => onSelectSeverity('info')}
        className={`group relative overflow-hidden rounded-xl p-5 sm:p-6 border transition-all duration-150 cursor-pointer ${
          isInfoSelected
            ? 'bg-ink-navy text-white border-ink-navy shadow-md ring-2 ring-signal-blue/30'
            : 'bg-white text-ink-navy border-hairline hover:border-[#d4e4fa] shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isInfoSelected ? 'text-signal-blue' : 'text-signal-blue'
            }`}
          >
            Gợi ý tối ưu (Suggestions)
          </span>
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-lg ${
              isInfoSelected ? 'bg-signal-blue text-white' : 'bg-[#e6f0ff] text-signal-blue'
            }`}
          >
            <Info className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span
            className={`text-3xl sm:text-4xl font-bold tracking-tight tabular-nums ${
              isInfoSelected ? 'text-white' : 'text-signal-blue'
            }`}
          >
            {infoCount}
          </span>
          <span
            className={`text-xs font-medium ${
              isInfoSelected ? 'text-mist-gray' : 'text-mist-gray'
            }`}
          >
            khuyến nghị
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-hairline/30">
          <span className={isInfoSelected ? 'text-mist-gray' : 'text-mist-gray'}>
            Khuyến nghị chuẩn hóa
          </span>
          <ChevronRight
            className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
              isInfoSelected ? 'text-signal-blue' : 'text-mist-gray'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
