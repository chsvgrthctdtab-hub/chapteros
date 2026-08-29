import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  ShieldAlert,
  Clock,
  User,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/date';
import {
  formatVND,
  getTransactionTypeConfig,
  getTransactionStatusConfig,
} from '../utils/finance.utils';
import type { FinanceTransactionListItem } from '../types/finance.types';

interface FinanceTransactionTableProps {
  transactions: FinanceTransactionListItem[];
  canManage: boolean;
  canApprove: boolean;
  currentUserId?: string;
  onSelectTransaction?: (tx: FinanceTransactionListItem) => void;
  onEdit: (tx: FinanceTransactionListItem) => void;
  onDelete: (tx: FinanceTransactionListItem) => void;
  onApprove?: (tx: FinanceTransactionListItem) => void;
  onReject?: (tx: FinanceTransactionListItem) => void;
  isApproving?: boolean;
  isLoading?: boolean;
}

export function FinanceTransactionTable({
  transactions,
  canManage,
  canApprove,
  currentUserId,
  onSelectTransaction,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  isApproving = false,
  isLoading = false,
}: FinanceTransactionTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden p-6 space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 animate-pulse">
            <div className="w-20 h-4 bg-slate-100 rounded" />
            <div className="w-48 h-4 bg-slate-100 rounded" />
            <div className="w-20 h-5 bg-slate-100 rounded" />
            <div className="w-16 h-5 bg-slate-100 rounded" />
            <div className="w-24 h-4 bg-slate-100 rounded" />
            <div className="w-24 h-4 bg-slate-100 rounded" />
            <div className="w-20 h-5 bg-slate-100 rounded" />
            <div className="w-16 h-6 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/90 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[110px]">Date</th>
              <th className="py-3.5 px-4 min-w-[200px]">Transaction</th>
              <th className="py-3.5 px-4 w-[140px]">Category</th>
              <th className="py-3.5 px-4 w-[100px]">Type</th>
              <th className="py-3.5 px-4 w-[140px] text-right">Amount</th>
              <th className="py-3.5 px-4 w-[150px]">Recorded By</th>
              <th className="py-3.5 px-4 w-[130px]">Status</th>
              <th className="py-3.5 px-4 w-[110px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const typeConfig = getTransactionTypeConfig(tx.transactionType);
              const statusConfig = getTransactionStatusConfig(tx.status);
              const isIncome = tx.transactionType === 'income';
              const isPending = tx.status === 'pending_approval';
              const isLocked = Boolean(tx.periodClosingId);
              const isSelfRecorded = Boolean(
                currentUserId && tx.recordedBy && tx.recordedBy === currentUserId
              );

              const txCode = `FIN-${tx.id.slice(0, 8).toUpperCase()}`;

              return (
                <tr
                  key={tx.id}
                  onClick={() => onSelectTransaction?.(tx)}
                  className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                    isPending ? 'bg-amber-50/15' : ''
                  }`}
                >
                  {/* 1. Date */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                    <div className="flex flex-col">
                      <span className="text-slate-900">{formatDate(tx.transactionDate)}</span>
                      {tx.term && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          {tx.term.name}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 2. Transaction Description + Monospace Code */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col max-w-[280px]">
                      <span className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                        {tx.description}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/80">
                          {txCode}
                        </span>
                        {tx.activity && (
                          <span className="text-[10px] text-blue-700 truncate max-w-[140px]" title={tx.activity.title}>
                            • {tx.activity.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 3. Category */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100/80 text-slate-700 border border-slate-200/70 text-[11px]">
                      {tx.category?.name || 'Khác'}
                    </span>
                  </td>

                  {/* 4. Type */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${typeConfig.badgeBg}`}
                    >
                      {isIncome ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {typeConfig.shortLabel || typeConfig.label}
                    </span>
                  </td>

                  {/* 5. Amount (VND integer tabular mono right-aligned) */}
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <span
                      className={`font-mono text-xs font-bold tracking-tight tabular-nums ${
                        isIncome ? 'text-emerald-800' : 'text-rose-800'
                      }`}
                    >
                      {isIncome ? `+${formatVND(tx.amount)}` : `−${formatVND(tx.amount)}`}
                    </span>
                  </td>

                  {/* 6. Recorded By (Avatar + Name fallback) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 max-w-[140px]">
                      <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {(tx.recorder?.fullName || 'U')[0]}
                      </div>
                      <span className="text-slate-700 truncate text-[11px]">
                        {tx.recorder?.fullName || 'Unknown'}
                      </span>
                    </div>
                  </td>

                  {/* 7. Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusConfig.badgeBg}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor}`} />
                        {statusConfig.label}
                      </span>
                      {isLocked && (
                        <span title="Locked in closed period">
                          <Lock className="h-3 w-3 text-slate-400" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 8. Actions */}
                  <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {/* View Drawer Action */}
                      <button
                        type="button"
                        onClick={() => onSelectTransaction?.(tx)}
                        title="Xem chi tiết"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {/* Pending quick actions for approvers */}
                      {isPending && canApprove && (
                        <>
                          {!isSelfRecorded ? (
                            <button
                              type="button"
                              onClick={() => onApprove?.(tx)}
                              disabled={isApproving}
                              title="Phê duyệt nhanh"
                              className="p-1.5 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/70 rounded-md transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <span title="Chờ người khác duyệt (Không được tự duyệt)" className="p-1 text-amber-500">
                              <AlertCircle className="h-3.5 w-3.5" />
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => onReject?.(tx)}
                            disabled={isApproving}
                            title="Từ chối"
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}

                      {/* Edit / Delete for manageable un-locked transactions */}
                      {!isLocked && canManage && !isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(tx)}
                            title="Chỉnh sửa"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(tx)}
                            title="Xóa"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
