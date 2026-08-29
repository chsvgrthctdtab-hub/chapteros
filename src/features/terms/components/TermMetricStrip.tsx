import React from 'react';
import { CalendarRange, Sparkles, Users, ShieldCheck, CheckCircle2, Archive, Clock } from 'lucide-react';
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
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Terms
          </span>
          <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarRange className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {terms.length}
          </span>
          <span className="text-xs text-slate-500 font-medium">periods</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
          <span className="text-emerald-700 font-semibold">{activeCount} active</span>
          <span>•</span>
          <span className="text-amber-700 font-semibold">{draftCount} draft</span>
          <span>•</span>
          <span className="text-slate-600 font-medium">{completedCount} closed</span>
        </div>
      </div>

      {/* Metric 2: Active Lifecycle State */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Cycle
          </span>
          <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-slate-900 truncate">
            {currentTerm ? currentTerm.name : 'None Active'}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
          {currentTerm ? (
            <span className="text-emerald-700 font-medium truncate font-mono">
              {currentTerm.startDate} → {currentTerm.endDate}
            </span>
          ) : (
            <span className="text-amber-700 font-medium">Needs activation</span>
          )}
        </div>
      </div>

      {/* Metric 3: Personnel Roster */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Term Personnel
          </span>
          <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {totalMembersAssigned}
          </span>
          <span className="text-xs text-slate-500 font-medium">assignments</span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
          <span className="text-indigo-700 font-semibold">{totalActivitiesCount} activities</span>
          <span>across all cycles</span>
        </div>
      </div>

      {/* Metric 4: Governance & Snapshots */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Audit Readiness
          </span>
          <div className="h-7 w-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {snapshottedCount} / {completedCount || 1}
          </span>
          <span className="text-xs text-slate-500 font-medium">snapshots</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
          <CheckCircle2 className="h-3 w-3 text-teal-600" />
          <span>Immutable closing logs</span>
        </div>
      </div>
    </div>
  );
}
