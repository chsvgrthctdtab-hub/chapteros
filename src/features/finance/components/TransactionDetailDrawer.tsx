import React from 'react';
import {
  Calendar,
  Tag,
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
      <span className="tabular-nums font-mono text-[11px] font-semibold text-slate-gray bg-cloud px-2 py-0.5 rounded border border-hairline shadow-xs">
        {txCode}
      </span>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.badgeBg}`}
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
            <div className="flex items-center gap-1.5 text-xs text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex-1">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Chờ người khác duyệt (Không được tự duyệt)</span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                onApprove?.(transaction);
                onClose();
              }}
              disabled={isApproving}
              className="flex-1 bg-signal-blue hover:bg-[#005be0] text-white text-xs h-8 rounded-lg shadow-sm font-semibold"
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
            className="text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg"
          >
            <ShieldAlert className="h-3.5 w-3.5 mr-1" />
            Từ chối
          </Button>
        </div>
      ) : isLocked ? (
        <div className="flex items-center gap-2 text-xs text-slate-gray w-full justify-center">
          <Lock className="h-3.5 w-3.5 text-mist-gray" />
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
            className="text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg"
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
            className="text-xs h-8 bg-ink-navy hover:bg-[#002d52] text-white rounded-lg font-medium"
          >
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            Chỉnh sửa
          </Button>
        </div>
      ) : (
        <div className="text-xs text-mist-gray w-full text-center">
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
      <div className="flex items-center justify-between p-4 rounded-xl bg-cloud border border-hairline shadow-xs">
        <span className="text-xs font-semibold text-slate-gray uppercase tracking-wider">
          Số tiền giao dịch
        </span>
        <div
          className={`text-xl font-bold tabular-nums ${
            isIncome ? 'text-emerald-700' : 'text-rose-700'
          }`}
        >
          {isIncome ? `+${formatVND(transaction.amount)}` : `−${formatVND(transaction.amount)}`}
        </div>
      </div>

      {/* 1. TRANSACTION DETAILS */}
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-gray" />
          Thông tin chi tiết giao dịch
        </h4>

        <div className="space-y-2 bg-cloud p-4 rounded-xl border border-hairline text-xs">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-gray">Transaction ID:</span>
            <span className="tabular-nums font-mono text-[11px] font-semibold text-ink-navy select-all">
              {transaction.id}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-gray">Phân loại:</span>
            <span className="font-semibold text-ink-navy flex items-center gap-1">
              {isIncome ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-700" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-rose-700" />
              )}
              {typeConfig.label}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-gray">Danh mục thu/chi:</span>
            <span className="font-semibold text-ink-navy">
              {transaction.category?.name || 'Chưa phân loại'}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-gray">Ngày giao dịch:</span>
            <span className="font-semibold text-ink-navy flex items-center gap-1 tabular-nums">
              <Calendar className="h-3.5 w-3.5 text-mist-gray" />
              {formatDate(transaction.transactionDate)}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-gray">Nhiệm kỳ ghi nhận:</span>
            <span className="font-semibold text-ink-navy">
              {transaction.term?.name || 'Toàn thời gian'}
            </span>
          </div>

          {transaction.activity && (
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-gray">Hoạt động gắn kèm:</span>
              <span className="font-semibold text-signal-blue truncate max-w-[220px]">
                {transaction.activity.title}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. AUDIT TRAIL & PARTICIPANTS */}
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-gray" />
          Nhật ký duyệt & Người thực hiện
        </h4>

        <div className="space-y-2 bg-cloud p-4 rounded-xl border border-hairline text-xs">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-gray">Người lập phiếu:</span>
            <span className="font-semibold text-ink-navy flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-mist-gray" />
              {transaction.recorder?.fullName || 'Hệ thống'}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-gray">Thời gian tạo:</span>
            <span className="tabular-nums font-mono text-slate-gray">
              {new Date(transaction.createdAt).toLocaleString('vi-VN')}
            </span>
          </div>

          {transaction.approver && (
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-gray">Người phê duyệt:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                {transaction.approver.fullName}
              </span>
            </div>
          )}

          {transaction.approvedAt && (
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-gray">Thời gian duyệt:</span>
              <span className="tabular-nums font-mono text-slate-gray">
                {new Date(transaction.approvedAt).toLocaleString('vi-VN')}
              </span>
            </div>
          )}

          {transaction.rejectionReason && (
            <div className="pt-2 border-t border-hairline space-y-1">
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
        <h4 className="text-[11px] font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-slate-gray" />
          Chứng từ & Tham chiếu
        </h4>

        <div className="bg-cloud p-4 rounded-xl border border-hairline text-xs space-y-2">
          {transaction.receiptUrl ? (
            <a
              href={transaction.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-signal-blue bg-white hover:bg-cloud px-3 py-2 rounded-lg border border-hairline font-semibold shadow-xs transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Xem chứng từ gốc đính kèm</span>
            </a>
          ) : (
            <p className="text-mist-gray italic">Không có chứng từ liên kết</p>
          )}

          {isLocked && (
            <p className="text-[11px] text-slate-gray bg-white p-2.5 rounded-lg border border-hairline">
              Giao dịch này không thể chỉnh sửa do thuộc kỳ chốt sổ đã hoàn thành.
            </p>
          )}
        </div>
      </div>
    </SlideOverDrawer>
  );
}
