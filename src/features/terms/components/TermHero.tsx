import React from 'react';
import {
  CalendarRange,
  Sparkles,
  Calendar,
  Users,
  Activity,
  CheckSquare,
  Wallet,
  ArrowRightLeft,
  CheckCircle,
  Eye,
  Edit2,
  AlertCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TermStatusBadge } from './TermStatusBadge';
import dayjs from 'dayjs';
import type { Term } from '@/types';

interface TermHeroProps {
  currentTerm: Term | null;
  hasTerms: boolean;
  termStats?: {
    memberCount: number;
    activityCount: number;
    taskCount: number;
    balance: number;
  };
  onOpenDetail: (term: Term) => void;
  onTransfer: (term: Term) => void;
  onComplete: (term: Term) => void;
  onEdit: (term: Term) => void;
  onActivateFirstAvailable?: () => void;
  canManage?: boolean;
}

export function TermHero({
  currentTerm,
  hasTerms,
  termStats,
  onOpenDetail,
  onTransfer,
  onComplete,
  onEdit,
  onActivateFirstAvailable,
  canManage = true,
}: TermHeroProps) {
  if (!currentTerm) {
    return (
      <div
        id="term-no-current-hero"
        className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-amber-50/40 to-white p-5 sm:p-6 shadow-2xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-100/90 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300/60 mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                  Operational Notice
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-200/60 text-amber-900">
                  Unset Current Term
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                No current term configured
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                Set an existing term as current to establish the active organizational period for
                member roster assignments, activity scheduling, and financial reconciliations.
              </p>
            </div>
          </div>

          {hasTerms && onActivateFirstAvailable && canManage && (
            <Button
              onClick={onActivateFirstAvailable}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 shrink-0 shadow-2xs font-medium self-start sm:self-auto cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Set Active Term
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Calculate timeline progress
  const start = dayjs(currentTerm.startDate);
  const end = dayjs(currentTerm.endDate);
  const now = dayjs();
  const totalDays = Math.max(1, end.diff(start, 'day'));
  const elapsedDays = Math.max(0, Math.min(totalDays, now.diff(start, 'day')));
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
  const daysRemaining = Math.max(0, end.diff(now, 'day'));

  const formattedStart = start.isValid() ? start.format('DD MMM YYYY') : currentTerm.startDate;
  const formattedEnd = end.isValid() ? end.format('DD MMM YYYY') : currentTerm.endDate;

  const formattedBalance = termStats?.balance !== undefined
    ? new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(termStats.balance)
    : '₫0';

  return (
    <div
      id="current-term-hero"
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs transition-all"
    >
      {/* Subtle background ambient accents */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 translate-y-12 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Term Identity & Timeline */}
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
              Current Term
            </span>
            <TermStatusBadge status={currentTerm.status} isCurrent={true} />
            <span className="text-xs text-slate-400 font-mono">
              ID: {currentTerm.id.slice(0, 8)}
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {currentTerm.name}
            </h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                {formattedStart} → {formattedEnd}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Term timeline completed'}
              </span>
            </div>
          </div>

          {/* Timeline progress mini bar */}
          <div className="space-y-1.5 max-w-md pt-0.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Term Elapsed ({progressPercent}%)</span>
              <span>{daysRemaining}d left</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
          <Button
            onClick={() => onOpenDetail(currentTerm)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 px-4 font-medium shadow-2xs cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Inspect Workspace
          </Button>

          {canManage && (
            <>
              <Button
                variant="outline"
                onClick={() => onTransfer(currentTerm)}
                className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs h-9 px-3 font-medium cursor-pointer"
                title="Transfer members to another term"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                Transfer
              </Button>
              <Button
                variant="outline"
                onClick={() => onComplete(currentTerm)}
                className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-300 text-xs h-9 px-3 font-medium cursor-pointer"
                title="Complete and snapshot term"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                Complete Term
              </Button>
              <Button
                variant="ghost"
                onClick={() => onEdit(currentTerm)}
                className="h-9 w-9 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                title="Edit term metadata"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Operational Statistics Grid */}
      <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            <span>Members Roster</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {termStats?.memberCount ?? currentTerm.memberCount ?? 0}
          </p>
          <span className="text-[11px] text-slate-400">Assigned BCH & Members</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Activity className="h-3.5 w-3.5 text-indigo-600" />
            <span>Activities</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {termStats?.activityCount ?? 0}
          </p>
          <span className="text-[11px] text-slate-400">Program operations</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <CheckSquare className="h-3.5 w-3.5 text-amber-600" />
            <span>Tasks</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {termStats?.taskCount ?? 0}
          </p>
          <span className="text-[11px] text-slate-400">Deliverables tracked</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Wallet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Treasury Balance</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-mono">
            {formattedBalance}
          </p>
          <span className="text-[11px] text-slate-400">Net term funds</span>
        </div>
      </div>
    </div>
  );
}
