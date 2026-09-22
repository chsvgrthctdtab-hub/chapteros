import React from 'react';
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatDate } from '@/lib/date';
import { formatVND } from '../utils/finance.utils';
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
      <div className="bg-white border border-hairline rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-ink-navy">
              Hàng đợi chờ phê duyệt thu chi
            </h2>
          </div>
          <p className="text-xs text-slate-gray mt-0.5">
            Các khoản thu chi cần kiểm duyệt hoặc vượt hạn mức quy chế ({formatVND(threshold)}).
          </p>
        </div>

        {canApprove && onOpenThresholdModal && (
          <button
            type="button"
            onClick={onOpenThresholdModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-navy bg-cloud hover:bg-pebble border border-hairline rounded-lg transition-all cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-signal-blue" />
            <span>Hạn mức phê duyệt: {formatVND(threshold)}</span>
          </button>
        )}
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-hairline rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-gray">
            Chờ xét duyệt
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-amber-950 tabular-nums">
              {pendingTransactions.length}
            </span>
            <span className="text-xs text-slate-gray">
              tổng cộng <strong className="text-ink-navy tabular-nums">{formatVND(totalPendingAmount)}</strong>
            </span>
          </div>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-gray">
            Vượt hạn mức
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-rose-700 tabular-nums">
              {highValueCount}
            </span>
            <span className="text-xs text-slate-gray">
              giao dịch lớn
            </span>
          </div>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-gray">
            Giao dịch chờ lâu nhất
          </div>
          <div className="mt-1 text-xs text-ink-navy font-medium tabular-nums">
            {oldestPendingDate ? formatDate(new Date(oldestPendingDate).toISOString()) : 'Không có'}
          </div>
        </div>
      </div>

      {/* Queue Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-hairline p-6 space-y-3 shadow-xs">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 animate-pulse">
              <div className="w-24 h-4 bg-pebble rounded" />
              <div className="w-48 h-4 bg-pebble rounded" />
              <div className="w-24 h-5 bg-pebble rounded" />
              <div className="w-28 h-7 bg-pebble rounded" />
            </div>
          ))}
        </div>
      ) : pendingTransactions.length === 0 ? (
        <div className="bg-white border border-hairline rounded-2xl p-10 text-center space-y-2 shadow-xs">
          <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 strokeWidth={1.5} className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="text-sm font-bold text-ink-navy">
            Không có khoản nào đang chờ duyệt
          </h3>
          <p className="text-xs text-slate-gray max-w-sm mx-auto">
            Tất cả các phiếu thu/chi gửi lên đã được xử lý xong. Sổ quỹ đã cập nhật trạng thái mới nhất.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-cloud/95 backdrop-blur-xs border-b border-hairline text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
                  <th className="py-3 px-4 w-[110px]">Ngày</th>
                  <th className="py-3 px-4 min-w-[200px]">Nội dung giao dịch</th>
                  <th className="py-3 px-4 w-[120px]">Danh mục</th>
                  <th className="py-3 px-4 w-[140px] text-right">Số tiền</th>
                  <th className="py-3 px-4 w-[150px]">Người lập</th>
                  <th className="py-3 px-4 w-[160px]">Lý do / Cảnh báo</th>
                  <th className="py-3 px-4 w-[160px] text-right">Thao tác duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {pendingTransactions.map((tx) => {
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
                      className="hover:bg-cloud/80 transition-colors cursor-pointer"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-gray font-medium">
                        <div className="flex flex-col">
                          <span className="text-ink-navy tabular-nums">{formatDate(tx.transactionDate)}</span>
                          {tx.term && (
                            <span className="text-[10px] text-mist-gray">
                              {tx.term.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Transaction */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col max-w-[260px]">
                          <span className="font-semibold text-ink-navy line-clamp-1">
                            {tx.description}
                          </span>
                          <span className="tabular-nums text-[10px] text-mist-gray mt-0.5">
                            {txCode}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-cloud text-ink-navy text-[11px] font-medium border border-hairline">
                          {tx.category?.name || 'Khác'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <span
                          className={`tabular-nums text-xs font-bold ${
                            isIncome ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isIncome ? `+${formatVND(tx.amount)}` : `−${formatVND(tx.amount)}`}
                        </span>
                      </td>

                      {/* Recorded By */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 rounded-full bg-pebble text-ink-navy text-[10px] font-bold flex items-center justify-center border border-hairline shrink-0">
                            {(tx.recorder?.fullName || 'U')[0]}
                          </div>
                          <span className="text-ink-navy text-[11px]">
                            {tx.recorder?.fullName || 'Chưa rõ'}
                          </span>
                        </div>
                      </td>

                      {/* Flag / Reason */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isHighValue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="h-3 w-3" />
                            Vượt hạn mức ({`≥ ${formatVND(threshold)}`})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200">
                            Phê duyệt thường
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
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-900 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 font-medium">
                              <AlertCircle className="h-3 w-3 text-amber-600" />
                              Chờ người khác duyệt
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => onApprove(tx)}
                                disabled={isApproving}
                                className="h-7 px-2.5 bg-signal-blue hover:bg-[#005be0] text-white text-[11px] font-semibold shadow-xs rounded-lg"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Duyệt
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onReject(tx)}
                                disabled={isApproving}
                                className="h-7 px-2 text-rose-600 border-rose-200 hover:bg-rose-50 text-[11px] rounded-lg"
                              >
                                <ShieldAlert className="h-3 w-3 mr-1" />
                                Từ chối
                              </Button>
                            </div>
                          )
                        ) : (
                          <span className="text-[11px] text-mist-gray">
                            Chỉ xem
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
