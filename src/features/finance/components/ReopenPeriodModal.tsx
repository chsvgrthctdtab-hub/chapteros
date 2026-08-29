import React, { useState } from 'react';
import { X, Unlock, AlertTriangle } from 'lucide-react';
import type { FinancePeriodClosingItem } from '../types/finance.types';

interface ReopenPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: FinancePeriodClosingItem | null;
  onReopen: (periodId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function ReopenPeriodModal({
  isOpen,
  onClose,
  period,
  onReopen,
  isLoading = false,
}: ReopenPeriodModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !period) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Vui lòng nhập lý do mở lại sổ chi tiết (tối thiểu 5 ký tự).');
      return;
    }

    try {
      setError('');
      await onReopen(period.id, reason.trim());
      setReason('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể mở lại kỳ chốt sổ.');
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Unlock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Mở lại kỳ chốt sổ tài chính
              </h3>
              <p className="text-xs text-slate-500">
                Hành động này sẽ mở khóa chỉnh sửa các giao dịch trong kỳ
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

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Kỳ chốt sổ:</span>
              <span className="font-bold text-slate-800">{period.periodName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Khoảng thời gian:</span>
              <span className="font-medium text-slate-700">
                {period.periodStart} &rarr; {period.periodEnd}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Chốt bởi:</span>
              <span className="font-medium text-slate-700">
                {period.closedByProfile?.fullName || '—'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Lý do mở lại sổ <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Giải trình lý do cần mở lại kỳ chốt sổ (ví dụ: Bổ sung phiếu chi phát sinh muộn, điều chỉnh hóa đơn sai lệch...)"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 placeholder:text-slate-400"
            />
            {error && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              Lý do mở lại sẽ được ghi nhận vào Nhật ký kiểm toán hệ thống (Audit Log).
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading || !reason.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 rounded-xl transition-all shadow-sm"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Đang mở lại...' : 'Xác nhận Mở lại sổ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
