import React from 'react';
import { Sparkles, Calendar, Users, Activity, ChevronRight, CheckCircle2, Clock, Lock } from 'lucide-react';
import { TermStatusBadge } from './TermStatusBadge';
import dayjs from 'dayjs';
import type { Term } from '@/types';

interface TermTimelineProps {
  terms: Term[];
  currentTermId?: string | null;
  onSelectTerm: (term: Term) => void;
  activitiesCountMap?: Record<string, number>;
}

export function TermTimeline({
  terms,
  currentTermId,
  onSelectTerm,
  activitiesCountMap = {},
}: TermTimelineProps) {
  // Sort chronologically ascending (oldest to newest) for timeline flow
  const sortedTerms = React.useMemo(() => {
    return [...terms].sort((a, b) => {
      const aDate = a.startDate || '';
      const bDate = b.startDate || '';
      return aDate.localeCompare(bDate);
    });
  }, [terms]);

  if (terms.length === 0) return null;

  return (
    <div
      id="term-timeline-section"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            Organizational Lifecycle Timeline
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological term progression from historical archives to active and upcoming periods.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {sortedTerms.length} terms in chronological flow
        </span>
      </div>

      {/* Desktop Horizontal Timeline (with smooth horizontal scroll for many terms) */}
      <div className="hidden md:block overflow-x-auto pb-3 pt-2">
        <div className="flex items-stretch gap-3 min-w-max">
          {sortedTerms.map((term, index) => {
            const isCurrent = term.isCurrent || term.id === currentTermId;
            const isClosed = term.status === 'completed' || term.status === 'archived';
            const isDraft = term.status === 'draft';
            const activityCount = activitiesCountMap[term.id] ?? 0;

            const start = dayjs(term.startDate);
            const end = dayjs(term.endDate);
            const formattedDates = `${start.isValid() ? start.format('MMM YYYY') : term.startDate} → ${
              end.isValid() ? end.format('MMM YYYY') : term.endDate
            }`;

            return (
              <React.Fragment key={term.id}>
                <div
                  onClick={() => onSelectTerm(term)}
                  className={`group relative flex flex-col justify-between w-64 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50/30 shadow-xs ring-2 ring-emerald-500/20'
                      : isClosed
                      ? 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                      : 'border-amber-200 bg-amber-50/20 hover:bg-white hover:border-amber-300'
                  }`}
                >
                  {/* Node Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <TermStatusBadge status={term.status} isCurrent={isCurrent} />
                      {term.closingSnapshot && (
                        <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded font-mono">
                          Snapshot
                        </span>
                      )}
                    </div>

                    <div>
                      <h4
                        className={`text-sm font-bold truncate transition-colors ${
                          isCurrent
                            ? 'text-emerald-950'
                            : 'text-slate-900 group-hover:text-emerald-600'
                        }`}
                      >
                        {term.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{formattedDates}</p>
                    </div>
                  </div>

                  {/* Node Footer: Compact Stats */}
                  <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <strong>{term.memberCount ?? 0}</strong> members
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5 text-slate-400" />
                      <strong>{activityCount}</strong> activities
                    </span>
                  </div>
                </div>

                {index < sortedTerms.length - 1 && (
                  <div className="flex items-center justify-center text-slate-300 px-1">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Timeline */}
      <div className="block md:hidden space-y-3 relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {sortedTerms.map((term) => {
          const isCurrent = term.isCurrent || term.id === currentTermId;
          const isClosed = term.status === 'completed' || term.status === 'archived';
          const activityCount = activitiesCountMap[term.id] ?? 0;

          return (
            <div
              key={term.id}
              onClick={() => onSelectTerm(term)}
              className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                isCurrent
                  ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30'
                  : isClosed
                  ? 'border-slate-200 bg-slate-50/60'
                  : 'border-amber-200 bg-amber-50/30'
              }`}
            >
              {/* Dot on line */}
              <div
                className={`absolute -left-[19px] top-4 h-3.5 w-3.5 rounded-full border-2 bg-white ${
                  isCurrent
                    ? 'border-emerald-600 bg-emerald-600'
                    : isClosed
                    ? 'border-slate-400'
                    : 'border-amber-500'
                }`}
              />

              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900">{term.name}</h4>
                <TermStatusBadge status={term.status} isCurrent={isCurrent} />
              </div>

              <p className="text-xs text-slate-500 font-mono mt-1">
                {term.startDate} → {term.endDate}
              </p>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  {term.memberCount ?? 0} members
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-slate-400" />
                  {activityCount} activities
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
