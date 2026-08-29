import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  Lock,
  AlertTriangle,
  Eye,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/date';
import {
  formatVND,
  getTransactionTypeConfig,
  getTransactionStatusConfig,
} from '../utils/finance.utils';
import type { FinanceTransactionListItem } from '../types/finance.types';

export interface FinanceTransactionCardProps {
  transaction: FinanceTransactionListItem;
  canManage: boolean;
  canApprove?: boolean;
  currentUserId?: string;
  onSelectTransaction?: (tx: FinanceTransactionListItem) => void;
  onEdit: (tx: FinanceTransactionListItem) => void;
  onDelete: (tx: FinanceTransactionListItem) => void;
  onApprove?: (tx: FinanceTransactionListItem) => void;
  onReject?: (tx: FinanceTransactionListItem) => void;
  isApproving?: boolean;
}

export function FinanceTransactionCard({
  transaction: tx,
  canManage,
  canApprove = false,
  currentUserId,
  onSelectTransaction,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  isApproving = false,
}: FinanceTransactionCardProps) {
  const typeConfig = getTransactionTypeConfig(tx.transactionType);
  const statusConfig = getTransactionStatusConfig(tx.status);
  const isIncome = tx.transactionType === 'income';
  const isPending = tx.status === 'pending_approval';
  const isRejected = tx.status === 'rejected';
  const isLocked = Boolean(tx.periodClosingId);
  const isSelfRecorded = Boolean(
    currentUserId && tx.recordedBy && tx.recordedBy === currentUserId
  );
  const txCode = `FIN-${tx.id.slice(0, 8).toUpperCase()}`;

  return (
    <div
      onClick={() => onSelectTransaction?.(tx)}
      className={`bg-white rounded-xl border p-3.5 shadow-2xs hover:border-slate-300 transition-all space-y-2.5 cursor-pointer flex flex-col justify-between ${
        isPending ? 'border-amber-300 bg-amber-50/15' : 'border-slate-200'
      }`}
    >
      <div className="space-y-2">
        {/* Header: Type, Status, Category, and Amount */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${typeConfig.badgeBg}`}
            >
              {isIncome ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {typeConfig.shortLabel || typeConfig.label}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${statusConfig.badgeBg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor}`} />
              {statusConfig.label}
            </span>

            {isLocked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                <Lock className="h-2.5 w-2.5" /> Locked
              </span>
            )}
          </div>

          <div
            className={`font-mono text-xs font-bold tracking-tight tabular-nums ${
              isIncome ? 'text-emerald-800' : 'text-rose-800'
            }`}
          >
            {isIncome ? `+${formatVND(tx.amount)}` : `−${formatVND(tx.amount)}`}
          </div>
        </div>

        {/* Description & ID */}
        <div>
          <p className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2">
            {tx.description}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
              {txCode}
            </span>
            <span className="text-[11px] text-slate-500">
              {tx.category?.name || 'Khác'}
            </span>
          </div>
        </div>

        {/* Rejection notice */}
        {isRejected && tx.rejectionReason && (
          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              <strong>Lý do từ chối:</strong> {tx.rejectionReason}
            </span>
          </div>
        )}
      </div>

      {/* Footer: Date, Recorder & Actions */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
          <Calendar className="h-3 w-3 text-slate-400" />
          <span>{formatDate(tx.transactionDate)}</span>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onSelectTransaction?.(tx)}
            title="Xem chi tiết"
            className="p-1 text-slate-400 hover:text-slate-700 rounded"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>

          {isPending && canApprove && (
            <>
              {!isSelfRecorded ? (
                <button
                  type="button"
                  onClick={() => onApprove?.(tx)}
                  disabled={isApproving}
                  title="Phê duyệt"
                  className="p-1 text-emerald-800 hover:bg-emerald-50 rounded"
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
                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {!isLocked && canManage && !isPending && (
            <>
              <button
                type="button"
                onClick={() => onEdit(tx)}
                title="Chỉnh sửa"
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(tx)}
                title="Xóa"
                className="p-1 text-slate-400 hover:text-rose-600 rounded"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
