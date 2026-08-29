import React from 'react';
import {
  Columns,
  Calendar,
  Users,
  Activity,
  CheckSquare,
  Wallet,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Archive,
} from 'lucide-react';
import { TermStatusBadge } from './TermStatusBadge';
import dayjs from 'dayjs';
import type { Term } from '@/types';

interface TermComparisonProps {
  terms: Term[];
  currentTermId?: string | null;
  activitiesCountMap?: Record<string, number>;
  tasksCountMap?: Record<string, number>;
  financeBalanceMap?: Record<string, number>;
  onSelectTerm: (term: Term) => void;
}

export function TermComparison({
  terms,
  currentTermId,
  activitiesCountMap = {},
  tasksCountMap = {},
  financeBalanceMap = {},
  onSelectTerm,
}: TermComparisonProps) {
  // Sort chronologically ascending
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
      id="term-comparison-matrix"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Columns className="h-4 w-4 text-emerald-600" />
            Term-over-Term Operational Comparison Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Side-by-side comparative analysis of organizational parameters across all recorded terms.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <table className="w-full text-xs text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
              <th className="py-3 px-4 w-44">Operational Dimension</th>
              {sortedTerms.map((term) => {
                const isCurrent = term.isCurrent || term.id === currentTermId;
                return (
                  <th
                    key={term.id}
                    className={`py-3 px-4 text-center min-w-[150px] ${
                      isCurrent ? 'bg-emerald-50/60 text-emerald-950 font-bold' : ''
                    }`}
                  >
                    <button
                      onClick={() => onSelectTerm(term)}
                      className="hover:underline font-bold text-slate-900 text-xs block mx-auto"
                    >
                      {term.name}
                    </button>
                    <div className="mt-1 flex justify-center">
                      <TermStatusBadge status={term.status} isCurrent={isCurrent} />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {/* Timeline Row */}
            <tr className="hover:bg-slate-50/40">
              <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Date Range
              </td>
              {sortedTerms.map((term) => (
                <td key={term.id} className="py-2.5 px-4 text-center font-mono text-[11px]">
                  {dayjs(term.startDate).format('DD/MM/YY')} → {dayjs(term.endDate).format('DD/MM/YY')}
                </td>
              ))}
            </tr>

            {/* Duration (Months) */}
            <tr className="hover:bg-slate-50/40">
              <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Duration
              </td>
              {sortedTerms.map((term) => {
                const start = dayjs(term.startDate);
                const end = dayjs(term.endDate);
                const months = start.isValid() && end.isValid() ? Math.round(end.diff(start, 'month', true)) : '—';
                return (
                  <td key={term.id} className="py-2.5 px-4 text-center font-medium">
                    {months} months
                  </td>
                );
              })}
            </tr>

            {/* Members Roster */}
            <tr className="hover:bg-slate-50/40">
              <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-500" />
                Members Assigned
              </td>
              {sortedTerms.map((term) => (
                <td key={term.id} className="py-2.5 px-4 text-center font-bold text-slate-900">
                  {term.memberCount ?? 0}
                </td>
              ))}
            </tr>

            {/* Activities Count */}
            <tr className="hover:bg-slate-50/40">
              <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-indigo-500" />
                Activities Executed
              </td>
              {sortedTerms.map((term) => (
                <td key={term.id} className="py-2.5 px-4 text-center font-bold text-slate-900">
                  {activitiesCountMap[term.id] ?? 0}
                </td>
              ))}
            </tr>

            {/* Tasks Count */}
            <tr className="hover:bg-slate-50/40">
              <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-amber-500" />
                Tasks Managed
              </td>
              {sortedTerms.map((term) => (
                <td key={term.id} className="py-2.5 px-4 text-center font-bold text-slate-900">
                  {tasksCountMap[term.id] ?? 0}
                </td>
              ))}
            </tr>

            {/* Treasury Balance */}
            <tr className="hover:bg-slate-50/40">
              <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                Treasury Balance
              </td>
              {sortedTerms.map((term) => {
                const bal = financeBalanceMap[term.id];
                const formatted = bal !== undefined
                  ? new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      maximumFractionDigits: 0,
                    }).format(bal)
                  : '—';
                return (
                  <td key={term.id} className="py-2.5 px-4 text-center font-mono font-medium text-slate-800">
                    {formatted}
                  </td>
                );
              })}
            </tr>

            {/* Closing Snapshot State */}
            <tr className="hover:bg-slate-50/40">
              <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />
                Audit Snapshot
              </td>
              {sortedTerms.map((term) => (
                <td key={term.id} className="py-2.5 px-4 text-center">
                  {term.closingSnapshot ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Recorded
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">—</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
