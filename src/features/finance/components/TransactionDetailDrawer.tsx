import React from 'react';
import {
  Calendar,
  Tag,
  DollarSign,
  User,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Lock,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileText,
} from 'lucide-react';
import { formatDate } from '@/lib/date';
import {
  formatVND,
  getTransactionTypeConfig,
  getTransactionStatusConfig,
} from '../utils/finance.utils';
import { Button } from '@/components/ui/button';
import { SlideOverDrawer } from '@/components/common/SlideOverDrawer';
import type { FinanceTransactionListItem } from '../types/finance.types';

interface TransactionDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FinanceTransactionListItem | null;
  canManage: boolean;
  canApprove: boolean;
  currentUserId?: string;
  onEdit: (tx: FinanceTransactionListItem) => void;
  onDelete: (tx: FinanceTransactionListItem) => void;
  onApprove?: (tx: FinanceTransactionListItem) => void;
  onReject?: (tx: FinanceTransactionListItem) => void;
  isApproving?: boolean;
}

export function TransactionDetailDrawer({
  isOpen,
  onClose,
  transaction,
  canManage,
  canApprove,
  currentUserId,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  isApproving = false,
}: TransactionDetailDrawerProps) {
  if (!isOpen || !transaction) return null;

  const typeConfig = getTransactionTypeConfig(transaction.transactionType);
  const statusConfig = getTransactionStatusConfig(transaction.status);
  const isIncome = transaction.transactionType === 'income';
  const isPending = transaction.status === 'pending_approval';
  const isLocked = Boolean(transaction.periodClosingId);
  const isSelfRecorded = Boolean(
    currentUserId && transaction.recordedBy && transaction.recordedBy === currentUserId
  );

  const txCode = `FIN-${transaction.id.slice(0, 8).toUpperCase()}`;

  const headerBadge = (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
        {txCode}
      </span>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusConfig.badgeBg}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
        {statusConfig.label}
      </span>
    </div>
  );

  const footer = (
    <div className="w-full flex items-center justify-between gap-2">
      {isPending && canApprove ? (
        <div className="w-full flex items-center justify-between gap-2">
          {isSelfRecorded ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex-1">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Awaiting another approver (Self-approval disallowed)</span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                onApprove?.(transaction);
                onClose();
              }}
              disabled={isApproving}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Phê duyệt
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onReject?.(transaction);
              onClose();
            }}
            disabled={isApproving}
            className="text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <ShieldAlert className="h-3.5 w-3.5 mr-1" />
            Từ chối
          </Button>
        </div>
      ) : isLocked ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 w-full justify-center">
          <Lock className="h-3.5 w-3.5 text-slate-400" />
          <span>Giao dịch đã khóa chốt sổ (Chỉ xem)</span>
        </div>
      ) : canManage ? (
        <div className="flex items-center justify-between w-full gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onDelete(transaction);
            }}
            className="text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Xóa
          </Button>

          <Button
            size="sm"
            onClick={() => {
              onClose();
              onEdit(transaction);
            }}
            className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            Chỉnh sửa
          </Button>
        </div>
      ) : (
        <div className="text-xs text-slate-400 w-full text-center">
          Chế độ chỉ xem
        </div>
      )}
    </div>
  );

  return (
    <SlideOverDrawer
      id="transaction-detail-drawer"
      isOpen={isOpen}
      onClose={onClose}
      title={transaction.description}
      tag="Finance Ledger"
      badge={headerBadge}
      size="2xl"
      footer={footer}
    >
      {/* Prominent Amount Box */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Số tiền giao dịch
        </span>
        <div
          className={`font-mono text-xl font-bold ${
            isIncome ? 'text-emerald-800' : 'text-rose-800'
          }`}
        >
          {isIncome ? `+${formatVND(transaction.amount)}` : `−${formatVND(transaction.amount)}`}
        </div>
      </div>

      {/* 1. TRANSACTION DETAILS */}
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          Transaction Details
        </h4>

        <div className="space-y-2 bg-slate-50/60 p-4 rounded-xl border border-slate-200/70 text-xs">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-500">Transaction ID:</span>
            <span className="font-mono text-[11px] font-semibold text-slate-800 select-all">
              {transaction.id}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-500">Phân loại:</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              {isIncome ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-700" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-rose-700" />
              )}
              {typeConfig.label}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-500">Danh mục thu/chi:</span>
            <span className="font-semibold text-slate-800">
              {transaction.category?.name || 'Chưa phân loại'}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-500">Ngày giao dịch:</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {formatDate(transaction.transactionDate)}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-500">Nhiệm kỳ ghi nhận:</span>
            <span className="font-semibold text-slate-800">
              {transaction.term?.name || 'Toàn thời gian'}
            </span>
          </div>

          {transaction.activity && (
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Hoạt động gắn kèm:</span>
              <span className="font-semibold text-emerald-800 truncate max-w-[220px]">
                {transaction.activity.title}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. AUDIT TRAIL & PARTICIPANTS */}
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          Audit Trail & Approvals
        </h4>

        <div className="space-y-2 bg-slate-50/60 p-4 rounded-xl border border-slate-200/70 text-xs">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-500">Người lập phiếu:</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-slate-400" />
              {transaction.recorder?.fullName || 'Hệ thống'}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-500">Thời gian tạo:</span>
            <span className="font-mono text-slate-600">
              {new Date(transaction.createdAt).toLocaleString('vi-VN')}
            </span>
          </div>

          {transaction.approver && (
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Người phê duyệt:</span>
              <span className="font-semibold text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                {transaction.approver.fullName}
              </span>
            </div>
          )}

          {transaction.approvedAt && (
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Thời gian duyệt:</span>
              <span className="font-mono text-slate-600">
                {new Date(transaction.approvedAt).toLocaleString('vi-VN')}
              </span>
            </div>
          )}

          {transaction.rejectionReason && (
            <div className="pt-2 border-t border-slate-200/70 space-y-1">
              <span className="text-rose-700 font-bold flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                Lý do từ chối phê duyệt:
              </span>
              <p className="text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-200 leading-relaxed font-mono text-[11px]">
                {transaction.rejectionReason}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. ATTACHMENTS & RECEIPTS */}
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-slate-500" />
          Receipts & References
        </h4>

        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/70 text-xs space-y-2">
          {transaction.receiptUrl ? (
            <a
              href={transaction.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-800 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 font-semibold shadow-2xs transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Xem chứng từ gốc đính kèm</span>
            </a>
          ) : (
            <p className="text-slate-400 italic">Không có chứng từ liên kết</p>
          )}

          {isLocked && (
            <p className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200">
              Transaction is immutable because it belongs to a closed accounting period or archived term.
            </p>
          )}
        </div>
      </div>
    </SlideOverDrawer>
  );
}
