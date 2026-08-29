import React from 'react';
import {
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Term } from '@/types';

interface TermOperationalSignalsProps {
  terms: Term[];
  currentTerm: Term | null;
  onActivateTerm: (term: Term) => void;
  onCompleteTerm: (term: Term) => void;
}

export function TermOperationalSignals({
  terms,
  currentTerm,
  onActivateTerm,
  onCompleteTerm,
}: TermOperationalSignalsProps) {
  const signals: Array<{
    id: string;
    type: 'warning' | 'info' | 'notice';
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    linkTo?: string;
  }> = [];

  // Check 1: No current term
  if (!currentTerm && terms.length > 0) {
    const candidate = terms.find((t) => t.status === 'active' || t.status === 'draft') || terms[0];
    signals.push({
      id: 'no-current-term',
      type: 'warning',
      title: 'No active term is designated as current',
      description:
        'The chapter has registered terms but none is marked current. Set a term as current to anchor activities and reports.',
      actionLabel: candidate ? `Set "${candidate.name}" as Current` : undefined,
      onAction: candidate ? () => onActivateTerm(candidate) : undefined,
    });
  }

  // Check 2: Current term approaching end date (< 60 days)
  if (currentTerm) {
    const end = dayjs(currentTerm.endDate);
    const now = dayjs();
    const daysLeft = end.diff(now, 'day');

    if (daysLeft >= 0 && daysLeft <= 60) {
      signals.push({
        id: 'term-closing-soon',
        type: 'warning',
        title: `Current term "${currentTerm.name}" ends in ${daysLeft} days`,
        description:
          'Prepare handover documentation, resolve pending tasks, and finalize financial accounts for the closing checklist.',
        actionLabel: 'Evaluate Closing Checklist',
        onAction: () => onCompleteTerm(currentTerm),
      });
    } else if (daysLeft < 0) {
      signals.push({
        id: 'term-overdue',
        type: 'warning',
        title: `Current term "${currentTerm.name}" has passed its scheduled end date`,
        description:
          'The official term date has concluded. Initiate term transition, transfer members, or archive with closing snapshot.',
        actionLabel: 'Complete Term & Snapshot',
        onAction: () => onCompleteTerm(currentTerm),
      });
    }
  }

  // Check 3: Draft terms ready
  const draftTerms = terms.filter((t) => t.status === 'draft');
  if (draftTerms.length > 0 && currentTerm) {
    signals.push({
      id: 'draft-term-planned',
      type: 'info',
      title: `${draftTerms.length} upcoming term(s) configured`,
      description: `Draft terms (${draftTerms.map((t) => t.name).join(', ')}) are staged for future governance cycles.`,
      linkTo: `/members`,
    });
  }

  if (signals.length === 0) return null;

  return (
    <div
      id="term-operational-signals"
      className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-blue-600" />
          Operational Governance Signals
        </h4>
        <Link
          to="/data-quality"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
        >
          Data Quality Workspace
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              signal.type === 'warning'
                ? 'bg-amber-50/50 border-amber-200/80 text-amber-950'
                : 'bg-blue-50/40 border-blue-200/70 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  signal.type === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {signal.type === 'warning' ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                  <Info className="h-3.5 w-3.5" />
                )}
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-bold">{signal.title}</h5>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {signal.description}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-center">
              {signal.onAction && signal.actionLabel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={signal.onAction}
                  className={`text-xs h-7 px-2.5 font-medium cursor-pointer shadow-2xs ${
                    signal.type === 'warning'
                      ? 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100'
                      : 'bg-white border-blue-300 text-blue-900 hover:bg-blue-50'
                  }`}
                >
                  {signal.actionLabel}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
