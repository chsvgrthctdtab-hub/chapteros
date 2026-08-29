import React from 'react';
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { formatDate } from '@/lib/date';
import { formatVND, getTransactionTypeConfig } from '../utils/finance.utils';
import { Button } from '@/components/ui/button';
import type { FinanceTransactionListItem } from '../types/finance.types';

interface ApprovalQueueProps {
  transactions: FinanceTransactionListItem[];
  threshold: number;
  canApprove: boolean;
  currentUserId?: string;
  onSelectTransaction?: (tx: FinanceTransactionListItem) => void;
  onApprove: (tx: FinanceTransactionListItem) => void;
  onReject: (tx: FinanceTransactionListItem) => void;
  isApproving?: boolean;
  isLoading?: boolean;
  onOpenThresholdModal?: () => void;
}

export function ApprovalQueue({
  transactions,
  threshold,
  canApprove,
  currentUserId,
  onSelectTransaction,
  onApprove,
  onReject,
  isApproving = false,
  isLoading = false,
  onOpenThresholdModal,
}: ApprovalQueueProps) {
  const pendingTransactions = transactions.filter(
    (tx) => tx.status === 'pending_approval'
  );

  const highValueCount = pendingTransactions.filter(
    (tx) => tx.amount >= threshold
  ).length;

  const totalPendingAmount = pendingTransactions.reduce(
    (acc, tx) => acc + (tx.amount || 0),
    0
  );

  // Find oldest pending date
  const oldestPendingDate = pendingTransactions.length > 0
    ? pendingTransactions.reduce((minDate, tx) => {
        const txDate = new Date(tx.transactionDate || tx.createdAt || '').getTime();
        return txDate < minDate ? txDate : minDate;
      }, new Date(pendingTransactions[0].transactionDate || pendingTransactions[0].createdAt || '').getTime())
    : null;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80">
              <Clock className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Hàng đợi chờ phê duyệt thu chi
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Các khoản thu chi cần kiểm duyệt hoặc vượt hạn mức quy chế ({formatVND(threshold)}).
          </p>
        </div>

        {canApprove && onOpenThresholdModal && (
          <button
            type="button"
            onClick={onOpenThresholdModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Hạn mức phê duyệt: {formatVND(threshold)}</span>
          </button>
        )}
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Chờ xét duyệt
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold text-amber-950">
              {pendingTransactions.length}
            </span>
            <span className="text-xs text-slate-500">
              tổng cộng <strong className="font-mono text-slate-800">{formatVND(totalPendingAmount)}</strong>
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Vượt hạn mức
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold text-rose-900">
              {highValueCount}
            </span>
            <span className="text-xs text-slate-500">
              giao dịch lớn
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Giao dịch chờ lâu nhất
          </div>
          <div className="mt-1 text-xs text-slate-800 font-medium">
            {oldestPendingDate ? formatDate(new Date(oldestPendingDate).toISOString()) : 'Không có'}
          </div>
        </div>
      </div>

      {/* Queue Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3 shadow-2xs">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 animate-pulse">
              <div className="w-24 h-4 bg-slate-100 rounded" />
              <div className="w-48 h-4 bg-slate-100 rounded" />
              <div className="w-24 h-5 bg-slate-100 rounded" />
              <div className="w-28 h-7 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : pendingTransactions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2 shadow-2xs">
          <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            All caught up!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no pending finance approvals waiting for review. All recorded income and expense requests have been processed.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-[110px]">Date</th>
                  <th className="py-3 px-4 min-w-[200px]">Transaction</th>
                  <th className="py-3 px-4 w-[120px]">Category</th>
                  <th className="py-3 px-4 w-[140px] text-right">Amount</th>
                  <th className="py-3 px-4 w-[150px]">Recorded By</th>
                  <th className="py-3 px-4 w-[160px]">Reason / Flag</th>
                  <th className="py-3 px-4 w-[160px] text-right">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingTransactions.map((tx) => {
                  const typeConfig = getTransactionTypeConfig(tx.transactionType);
                  const isIncome = tx.transactionType === 'income';
                  const isHighValue = tx.amount >= threshold;
                  const isSelfRecorded = Boolean(
                    currentUserId && tx.recordedBy && tx.recordedBy === currentUserId
                  );
                  const txCode = `FIN-${tx.id.slice(0, 8).toUpperCase()}`;

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => onSelectTransaction?.(tx)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                        <div className="flex flex-col">
                          <span className="text-slate-900">{formatDate(tx.transactionDate)}</span>
                          {tx.term && (
                            <span className="text-[10px] text-slate-400">
                              {tx.term.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Transaction */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col max-w-[260px]">
                          <span className="font-semibold text-slate-900 line-clamp-1">
                            {tx.description}
                          </span>
                          <span className="font-mono text-[10px] text-slate-600 mt-0.5">
                            {txCode}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/60">
                          {tx.category?.name || 'Khác'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <span
                          className={`font-mono text-xs font-bold tabular-nums ${
                            isIncome ? 'text-emerald-800' : 'text-rose-800'
                          }`}
                        >
                          {isIncome ? `+${formatVND(tx.amount)}` : `−${formatVND(tx.amount)}`}
                        </span>
                      </td>

                      {/* Recorded By */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                            {(tx.recorder?.fullName || 'U')[0]}
                          </div>
                          <span className="text-slate-700 text-[11px]">
                            {tx.recorder?.fullName || 'Unknown'}
                          </span>
                        </div>
                      </td>

                      {/* Flag / Reason */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isHighValue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="h-3 w-3" />
                            Over Limit ({`≥ ${formatVND(threshold)}`})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            Standard Approval
                          </span>
                        )}
                      </td>

                      {/* Review Actions */}
                      <td
                        className="py-3 px-4 whitespace-nowrap text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canApprove ? (
                          isSelfRecorded ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-medium">
                              <AlertCircle className="h-3 w-3 text-amber-600" />
                              Awaiting another approver
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => onApprove(tx)}
                                disabled={isApproving}
                                className="h-7 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold shadow-2xs"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Approve
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onReject(tx)}
                                disabled={isApproving}
                                className="h-7 px-2 text-rose-600 border-rose-200 hover:bg-rose-50 text-[11px]"
                              >
                                <ShieldAlert className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            View Only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
