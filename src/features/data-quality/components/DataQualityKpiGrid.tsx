import {
  Layers,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
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
  healthyCount = 0,
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
            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
            : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isAllSelected ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Tổng vấn đề phát hiện
          </span>
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-lg ${
              isAllSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Layers className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-bold font-mono tracking-tight">{totalIssues}</span>
          <span
            className={`text-xs font-medium ${
              isAllSelected ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            mục cần rà soát
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100/30">
          <span className={isAllSelected ? 'text-slate-300' : 'text-slate-500'}>
            {totalIssues === 0 ? 'Hệ thống đạt chuẩn' : 'Bấm để lọc tất cả'}
          </span>
          <ChevronRight
            className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
              isAllSelected ? 'text-emerald-400' : 'text-slate-400'
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
            : 'bg-white text-slate-800 border-slate-200/90 hover:border-rose-300 shadow-2xs'
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
            className={`text-3xl sm:text-4xl font-bold font-mono tracking-tight ${
              isCriticalSelected ? 'text-white' : 'text-rose-600'
            }`}
          >
            {criticalCount}
          </span>
          <span
            className={`text-xs font-medium ${
              isCriticalSelected ? 'text-rose-300' : 'text-slate-500'
            }`}
          >
            lỗi vận hành
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-rose-100/30">
          <span className={isCriticalSelected ? 'text-rose-200' : 'text-slate-500'}>
            {criticalCount > 0 ? 'Ưu tiên khắc phục' : 'Không có lỗi chặn'}
          </span>
          <ChevronRight
            className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
              isCriticalSelected ? 'text-rose-300' : 'text-slate-400'
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
            : 'bg-white text-slate-800 border-slate-200/90 hover:border-amber-300 shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isWarningSelected ? 'text-amber-200' : 'text-amber-700'
            }`}
          >
            Cần chú ý (Warnings)
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
            className={`text-3xl sm:text-4xl font-bold font-mono tracking-tight ${
              isWarningSelected ? 'text-white' : 'text-amber-600'
            }`}
          >
            {warningCount}
          </span>
          <span
            className={`text-xs font-medium ${
              isWarningSelected ? 'text-amber-300' : 'text-slate-500'
            }`}
          >
            cảnh báo
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-amber-100/30">
          <span className={isWarningSelected ? 'text-amber-200' : 'text-slate-500'}>
            {warningCount > 0 ? 'Thiếu thông tin / Quá hạn' : 'Dữ liệu chuẩn chỉ'}
          </span>
          <ChevronRight
            className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
              isWarningSelected ? 'text-amber-300' : 'text-slate-400'
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
            ? 'bg-sky-900 text-white border-sky-900 shadow-md ring-2 ring-sky-600/30'
            : 'bg-white text-slate-800 border-slate-200/90 hover:border-sky-300 shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isInfoSelected ? 'text-sky-200' : 'text-sky-700'
            }`}
          >
            Gợi ý tối ưu (Suggestions)
          </span>
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-lg ${
              isInfoSelected ? 'bg-sky-800 text-sky-200' : 'bg-sky-50 text-sky-600'
            }`}
          >
            <Info className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span
            className={`text-3xl sm:text-4xl font-bold font-mono tracking-tight ${
              isInfoSelected ? 'text-white' : 'text-sky-600'
            }`}
          >
            {infoCount}
          </span>
          <span
            className={`text-xs font-medium ${
              isInfoSelected ? 'text-sky-300' : 'text-slate-500'
            }`}
          >
            khuyến nghị
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-sky-100/30">
          <span className={isInfoSelected ? 'text-sky-200' : 'text-slate-500'}>
            Khuyến nghị chuẩn hóa
          </span>
          <ChevronRight
            className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
              isInfoSelected ? 'text-sky-300' : 'text-slate-400'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
