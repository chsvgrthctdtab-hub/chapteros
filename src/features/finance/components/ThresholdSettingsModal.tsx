import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { formatVND } from '../utils/finance.utils';

interface ThresholdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThreshold: number;
  onSave: (threshold: number) => Promise<void>;
  isLoading?: boolean;
  canEdit?: boolean;
}

export function ThresholdSettingsModal({
  isOpen,
  onClose,
  currentThreshold,
  onSave,
  isLoading = false,
  canEdit = true,
}: ThresholdSettingsModalProps) {
  const [thresholdValue, setThresholdValue] = useState<number>(currentThreshold || 2000000);
  const [displayValue, setDisplayValue] = useState<string>(
    (currentThreshold || 2000000).toLocaleString('vi-VN')
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setThresholdValue(currentThreshold || 2000000);
      setDisplayValue((currentThreshold || 2000000).toLocaleString('vi-VN'));
      setError('');
    }
  }, [isOpen, currentThreshold]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(rawVal, 10);
    if (isNaN(num)) {
      setThresholdValue(0);
      setDisplayValue('');
    } else {
      setThresholdValue(num);
      setDisplayValue(num.toLocaleString('vi-VN'));
    }
    if (error) setError('');
  };

  const handleQuickSelect = (amount: number) => {
    setThresholdValue(amount);
    setDisplayValue(amount.toLocaleString('vi-VN'));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (thresholdValue < 0) {
      setError('Hạn mức phê duyệt không được âm.');
      return;
    }

    try {
      await onSave(thresholdValue);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể lưu hạn mức.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hạn Mức Phê Duyệt Chi Tiêu
              </h3>
              <p className="text-xs text-slate-500">
                Quy định ngưỡng kiểm soát chi tiêu tự động
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
          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-800 space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Quy tắc kiểm soát chi tiêu:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-blue-700">
              <li>
                Các khoản chi <span className="font-semibold">&lt; Hạn mức</span> sẽ được tự động ghi sổ (<code className="bg-blue-100 px-1 py-0.5 rounded">posted</code>).
              </li>
              <li>
                Các khoản chi <span className="font-semibold">&ge; Hạn mức</span> sẽ chuyển trạng thái <span className="font-semibold text-amber-800">Chờ phê duyệt</span> và cần Ban Chủ nhiệm / Admin duyệt.
              </li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ngưỡng phê duyệt (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={!canEdit || isLoading}
                value={displayValue}
                onChange={handleInputChange}
                placeholder="2.000.000"
                className="w-full pl-3.5 pr-12 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all disabled:opacity-60"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                VNĐ
              </span>
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          {/* Quick choices */}
          {canEdit && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400">
                Gợi ý nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[1000000, 2000000, 5000000, 10000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickSelect(amt)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                      thresholdValue === amt
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {formatVND(amt)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all"
            >
              Đóng
            </button>
            {canEdit && (
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 rounded-xl transition-all shadow-sm"
              >
                {isLoading ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
