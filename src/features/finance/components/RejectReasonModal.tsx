import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { formatVND } from '../utils/finance.utils';
import type { FinanceTransactionListItem } from '../types/finance.types';

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FinanceTransactionListItem | null;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function RejectReasonModal({
  isOpen,
  onClose,
  transaction,
  onConfirm,
  isLoading = false,
}: RejectReasonModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Vui lòng nhập lý do từ chối cụ thể (tối thiểu 3 ký tự).');
      return;
    }

    try {
      setError('');
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi từ chối giao dịch.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Từ chối phê duyệt giao dịch
              </h3>
              <p className="text-xs text-slate-500">
                Giao dịch sẽ chuyển sang trạng thái từ chối và ghi lại lý do
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Giao dịch:</span>
              <span className="font-semibold text-slate-800 line-clamp-1 max-w-[240px]">
                {transaction.description}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Số tiền:</span>
              <span className="font-bold text-rose-600">
                {formatVND(transaction.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Người tạo phiếu:</span>
              <span className="font-medium text-slate-800">
                {transaction.recorder?.fullName || 'Không rõ'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Lý do từ chối <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Nhập lý do không phê duyệt (ví dụ: Thiếu hóa đơn đính kèm, vượt định mức chi, sai danh mục...)"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-900 transition-all placeholder:text-slate-400"
            />
            {error && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading || !reason.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
            >
              {isLoading ? (
                <span>Đang xử lý...</span>
              ) : (
                <span>Xác nhận từ chối</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
