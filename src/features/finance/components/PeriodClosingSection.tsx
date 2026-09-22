import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Calendar,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { formatDate } from '@/lib/date';
import {
  formatVND,
  getPeriodClosingStatusConfig,
  getReconciliationStatusConfig,
  getPeriodTypeLabel,
} from '../utils/finance.utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type {
  FinancePeriodClosingItem,
  FinanceTermOption,
} from '../types/finance.types';

interface PeriodClosingSectionProps {
  periods: FinancePeriodClosingItem[];
  terms: FinanceTermOption[];
  selectedTermId: string;
  onTermChange: (termId: string) => void;
  canClose: boolean;
  onOpenCloseModal: () => void;
  onOpenReopenModal: (period: FinancePeriodClosingItem) => void;
  isLoading?: boolean;
}

export function PeriodClosingSection({
  periods,
  terms,
  selectedTermId,
  onTermChange,
  canClose,
  onOpenCloseModal,
  onOpenReopenModal,
  isLoading = false,
}: PeriodClosingSectionProps) {
  const [expandedPeriodId, setExpandedPeriodId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedPeriodId(expandedPeriodId === id ? null : id);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Banner / Explainer */}
      <div className="bg-white border border-hairline rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cloud text-slate-gray border border-hairline">
              <Lock className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-ink-navy">
              Period Closing &amp; Reconciliation
            </h2>
          </div>
          <p className="text-xs text-mist-gray mt-0.5 max-w-2xl">
            Close accounting periods to freeze approved transactions and reconcile physical cash counts against ledger balances.
          </p>
        </div>

        {canClose && (
          <Button
            size="sm"
            onClick={onOpenCloseModal}
            className="bg-ink-navy hover:bg-[#1a2a4a] text-white text-xs h-8 shadow-xs flex-shrink-0"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Close New Period
          </Button>
        )}
      </div>

      {/* Filter and Overview Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-hairline shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-gray whitespace-nowrap">
            Lọc theo nhiệm kỳ:
          </span>
          <Select
            value={selectedTermId}
            onValueChange={onTermChange}
          >
            <SelectTrigger className="h-8 px-2.5 text-xs bg-cloud border-hairline w-auto min-w-[140px]">
              <SelectValue placeholder="Tất cả nhiệm kỳ" />
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
        </div>

        <div className="text-xs text-mist-gray">
          Total of <strong className="text-ink-navy font-semibold">{periods.length}</strong> closed periods on record
        </div>
      </div>

      {/* Periods Table & Details */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-hairline p-6 space-y-3 shadow-xs">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 animate-pulse">
              <div className="w-32 h-4 bg-cloud rounded" />
              <div className="w-24 h-4 bg-cloud rounded" />
              <div className="w-20 h-5 bg-cloud rounded" />
              <div className="w-24 h-4 bg-cloud rounded" />
            </div>
          ))}
        </div>
      ) : periods.length === 0 ? (
        <div className="bg-white border border-hairline rounded-xl p-10 text-center space-y-2 shadow-xs">
          <div className="h-10 w-10 rounded-full bg-cloud text-mist-gray flex items-center justify-center mx-auto">
            <Lock strokeWidth={1.5} className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-ink-navy">
            No closed periods found
          </h3>
          <p className="text-xs text-mist-gray max-w-sm mx-auto">
            Accounting periods have not been closed yet. When an operating month or term ends, an executive officer can execute a period close.
          </p>
          {canClose && (
            <Button
              size="sm"
              onClick={onOpenCloseModal}
              className="mt-2 bg-ink-navy hover:bg-[#1a2a4a] text-white text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Close First Period
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {periods.map((p) => {
            const statusConfig = getPeriodClosingStatusConfig(p.status);
            const reconConfig = getReconciliationStatusConfig(p.reconciliationStatus);
            const isExpanded = expandedPeriodId === p.id;
            const hasDiscrepancy = Math.abs(p.discrepancy || p.reconciliationDiscrepancy || 0) > 0.001;

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-hairline shadow-xs overflow-hidden transition-all"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(p.id)}
                  className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer hover:bg-cloud transition-colors"
                >
                  {/* Left: Period Name & Range */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-ink-navy">
                        {p.periodName}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${statusConfig.badgeBg}`}
                      >
                        {statusConfig.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${reconConfig.badgeBg}`}
                      >
                        {p.reconciliationStatus === 'balanced' ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                        )}
                        {reconConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-mist-gray">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-mist-gray" />
                        {formatDate(p.periodStart)} &rarr; {formatDate(p.periodEnd)}
                      </span>
                      <span>•</span>
                      <span>{p.term?.name || 'Nhiệm kỳ'}</span>
                      <span>•</span>
                      <span>{getPeriodTypeLabel(p.periodType)}</span>
                    </div>
                  </div>

                  {/* Right: Balances & Actions */}
                  <div
                    className="flex items-center justify-between lg:justify-end gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-hairline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Numbers */}
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-mist-gray">
                          Book Balance
                        </div>
                        <div className="tabular-nums text-xs font-bold text-slate-gray">
                          {formatVND(p.closingBalance)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-semibold text-mist-gray">
                          Actual Balance
                        </div>
                        <div className="tabular-nums text-xs font-bold text-ink-navy">
                          {formatVND(p.actualBalance)}
                        </div>
                      </div>

                      {hasDiscrepancy && (
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-rose-500">
                            Difference
                          </div>
                          <div className="tabular-nums text-xs font-bold text-rose-700">
                            {(p.discrepancy || p.reconciliationDiscrepancy || 0) > 0
                              ? `+${formatVND(p.discrepancy || p.reconciliationDiscrepancy || 0)}`
                              : formatVND(p.discrepancy || p.reconciliationDiscrepancy || 0)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reopen Action if permitted */}
                    {canClose && p.status === 'closed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenReopenModal(p)}
                        className="text-xs h-7 text-amber-800 border-amber-300 hover:bg-amber-50"
                      >
                        <Unlock className="h-3 w-3 mr-1" />
                        Reopen
                      </Button>
                    )}

                    {/* Expand Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(p.id)}
                      className="p-1 text-mist-gray hover:text-slate-gray rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Inspection Section */}
                {isExpanded && (
                  <div className="border-t border-hairline bg-cloud p-4 space-y-3 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-hairline">
                        <div className="text-[10px] uppercase text-mist-gray font-semibold">
                          Opening Balance
                        </div>
                        <div className="tabular-nums text-xs font-bold text-ink-navy mt-0.5">
                          {formatVND(p.openingBalance)}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-hairline">
                        <div className="text-[10px] uppercase text-emerald-800 font-semibold">
                          Period Inflow (Thu)
                        </div>
                        <div className="tabular-nums text-xs font-bold text-emerald-800 mt-0.5">
                          +{formatVND(p.totalIncome)}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-hairline">
                        <div className="text-[10px] uppercase text-rose-800 font-semibold">
                          Period Outflow (Chi)
                        </div>
                        <div className="tabular-nums text-xs font-bold text-rose-800 mt-0.5">
                          −{formatVND(p.totalExpense)}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-hairline">
                        <div className="text-[10px] uppercase text-mist-gray font-semibold">
                          Transactions Locked
                        </div>
                        <div className="tabular-nums text-xs font-bold text-ink-navy mt-0.5">
                          {p.transactionCount || 0} records
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Audit */}
                    <div className="bg-white p-3 rounded-lg border border-hairline space-y-1.5 text-slate-gray">
                      <div className="flex justify-between items-center">
                        <span className="text-mist-gray">Executed by:</span>
                        <span className="font-medium text-ink-navy">
                          {p.closedByProfile?.fullName || p.closedByName || 'Ban chủ nhiệm'} ({formatDate(p.closedAt)})
                        </span>
                      </div>

                      {p.notes && (
                        <div className="pt-1 border-t border-hairline">
                          <span className="text-mist-gray font-semibold">Notes: </span>
                          <span className="text-ink-navy">{p.notes}</span>
                        </div>
                      )}

                      {p.overrideReason && (
                        <div className="pt-1 border-t border-hairline text-rose-700 bg-rose-50/50 p-2 rounded">
                          <span className="font-bold">Discrepancy Override Justification: </span>
                          <span>{p.overrideReason}</span>
                        </div>
                      )}

                      {p.status === 'reopened' && p.reopenReason && (
                        <div className="pt-1 border-t border-hairline text-amber-900 bg-amber-50/50 p-2 rounded">
                          <span className="font-bold">Reopen Audit Reason: </span>
                          <span>{p.reopenReason} ({formatDate(p.reopenedAt || '')})</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
