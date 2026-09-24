import { CalendarRange, Users, ShieldCheck, CheckCircle2, Archive, Clock } from 'lucide-react';
import type { Term } from '@/types';

interface TermMetricStripProps {
  terms: Term[];
  currentTerm: Term | null;
  totalMembersAssigned: number;
  totalActivitiesCount: number;
}

export function TermMetricStrip({
  terms,
  currentTerm,
  totalMembersAssigned,
  totalActivitiesCount,
}: TermMetricStripProps) {
  const activeCount = terms.filter((t) => t.status === 'active' || t.isCurrent).length;
  const draftCount = terms.filter((t) => t.status === 'draft').length;
  const completedCount = terms.filter((t) => t.status === 'completed' || t.status === 'archived').length;
  const snapshottedCount = terms.filter((t) => Boolean(t.closingSnapshot)).length;

  return (
    <div
      id="term-metric-strip"
      className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
    >
      {/* Metric 1: Total Governance Terms */}
      <div className="rounded-xl border border-hairline bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-mist-gray uppercase tracking-wider">
            Tổng số nhiệm kỳ
          </span>
          <div className="h-7 w-7 rounded-lg bg-[#e6f0ff] text-signal-blue flex items-center justify-center">
            <CalendarRange className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-ink-navy">
            {terms.length}
          </span>
          <span className="text-xs text-mist-gray font-medium">kỳ</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-mist-gray flex-nowrap whitespace-nowrap overflow-hidden">
          <span className="text-emerald-700 font-semibold shrink-0">{activeCount} đang diễn ra</span>
          <span className="shrink-0">•</span>
          <span className="text-amber-700 font-semibold shrink-0">{draftCount} dự thảo</span>
          <span className="shrink-0">•</span>
          <span className="text-slate-gray font-medium shrink-0">{completedCount} đã kết thúc</span>
        </div>
      </div>

      {/* Metric 2: Active Lifecycle State */}
      <div className="rounded-xl border border-hairline bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-mist-gray uppercase tracking-wider">
            Nhiệm kỳ hiện hành
          </span>
          <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-ink-navy truncate">
            {currentTerm ? currentTerm.name : 'Chưa kích hoạt'}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-mist-gray truncate">
          {currentTerm ? (
            <span className="text-emerald-700 font-medium truncate font-mono">
              {currentTerm.startDate} → {currentTerm.endDate}
            </span>
          ) : (
            <span className="text-amber-700 font-medium">Cần kích hoạt nhiệm kỳ</span>
          )}
        </div>
      </div>

      {/* Metric 3: Personnel Roster */}
      <div className="rounded-xl border border-hairline bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-mist-gray uppercase tracking-wider">
            Nhân sự nhiệm kỳ
          </span>
          <div className="h-7 w-7 rounded-lg bg-[#e6f0ff] text-signal-blue flex items-center justify-center">
            <Users className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-ink-navy">
            {totalMembersAssigned}
          </span>
          <span className="text-xs text-mist-gray font-medium">lượt phân bổ</span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[11px] text-mist-gray">
          <span className="text-signal-blue font-semibold">{totalActivitiesCount} hoạt động</span>
          <span>qua các kỳ</span>
        </div>
      </div>

      {/* Metric 4: Governance & Snapshots */}
      <div className="rounded-xl border border-hairline bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-mist-gray uppercase tracking-wider">
            Mức độ lưu trữ
          </span>
          <div className="h-7 w-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-ink-navy">
            {snapshottedCount} / {completedCount || 1}
          </span>
          <span className="text-xs text-mist-gray font-medium">bản tổng kết</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-mist-gray">
          <CheckCircle2 className="h-3 w-3 text-teal-600" />
          <span>Hồ sơ tổng kết đã lưu</span>
        </div>
      </div>
    </div>
  );
}
