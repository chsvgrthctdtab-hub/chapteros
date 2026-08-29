import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Scale,
  DollarSign,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { formatVND } from '../utils/finance.utils';
import { usePeriodReconciliationPreview } from '../queries/finance.queries';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type {
  FinanceTermOption,
  CreatePeriodClosingInput,
  PeriodClosingType,
} from '../types/finance.types';

interface ClosePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  terms: FinanceTermOption[];
  defaultTermId?: string;
  onClosePeriod: (input: CreatePeriodClosingInput) => Promise<void>;
  isLoading?: boolean;
}

export function ClosePeriodModal({
  isOpen,
  onClose,
  organizationId,
  terms,
  defaultTermId,
  onClosePeriod,
  isLoading = false,
}: ClosePeriodModalProps) {
  const [termId, setTermId] = useState<string>(defaultTermId || terms[0]?.id || '');
  const [periodType, setPeriodType] = useState<PeriodClosingType>('month');
  const [periodName, setPeriodName] = useState<string>('');
  
  // Date calculation defaults to current month
  const now = new Date();
  const firstDayStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDayStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [periodStart, setPeriodStart] = useState<string>(firstDayStr);
  const [periodEnd, setPeriodEnd] = useState<string>(lastDayStr);

  const [actualBalanceInput, setActualBalanceInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Auto set period name when dates/type changes
  useEffect(() => {
    if (isOpen) {
      if (defaultTermId) setTermId(defaultTermId);
      else if (terms.length > 0 && !termId) setTermId(terms[0].id);

      const d = new Date(periodEnd || now);
      const monthNum = d.getMonth() + 1;
      const yearNum = d.getFullYear();

      if (periodType === 'month') {
        setPeriodName(`Chốt sổ Tháng ${monthNum}/${yearNum}`);
      } else if (periodType === 'quarter') {
        const quarterNum = Math.ceil(monthNum / 3);
        setPeriodName(`Chốt sổ Quý ${quarterNum}/${yearNum}`);
      } else {
        const selectedTerm = terms.find((t) => t.id === termId);
        setPeriodName(`Chốt sổ Kỳ tùy chỉnh - ${selectedTerm?.name || ''}`);
      }
    }
  }, [isOpen, periodType, periodEnd, termId, defaultTermId, terms]);

  // Preview reconciliation calculation
  const { data: previewData, isFetching: isPreviewFetching } = usePeriodReconciliationPreview(
    organizationId,
    termId,
    periodStart,
    periodEnd
  );

  const openingBalance = previewData?.openingBalance ?? 0;
  const totalIncome = previewData?.totalIncome ?? 0;
  const totalExpense = previewData?.totalExpense ?? 0;
  const calculatedClosingBalance = previewData?.closingBalance ?? (openingBalance + totalIncome - totalExpense);
  const transactionCount = previewData?.transactionCount ?? 0;

  // Actual balance parse
  const actualBalanceNum =
    actualBalanceInput === ''
      ? calculatedClosingBalance
      : parseFloat(actualBalanceInput.replace(/[^0-9-]/g, '')) || 0;

  const discrepancy = actualBalanceNum - calculatedClosingBalance;
  const hasDiscrepancy = Math.abs(discrepancy) > 0.001;

  if (!isOpen) return null;

  const handleActualBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setActualBalanceInput(val);
    if (error) setError('');
  };

  const handleSetActualToCalculated = () => {
    setActualBalanceInput(calculatedClosingBalance.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termId) {
      setError('Vui lòng chọn nhiệm kỳ liên kết.');
      return;
    }
    if (!periodName.trim()) {
      setError('Vui lòng nhập tên kỳ chốt sổ.');
      return;
    }
    if (!periodStart || !periodEnd) {
      setError('Vui lòng chọn ngày bắt đầu và kết thúc kỳ.');
      return;
    }
    if (new Date(periodStart) > new Date(periodEnd)) {
      setError('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }
    if (hasDiscrepancy && (!overrideReason.trim() || overrideReason.trim().length < 5)) {
      setError('Có chênh lệch giữa số dư tính toán và thực tế. Vui lòng nhập giải trình (tối thiểu 5 ký tự).');
      return;
    }

    try {
      setError('');
      await onClosePeriod({
        organizationId,
        termId,
        periodType,
        periodName: periodName.trim(),
        periodStart,
        periodEnd,
        openingBalance,
        totalIncome,
        totalExpense,
        closingBalance: calculatedClosingBalance,
        actualBalance: actualBalanceNum,
        notes: notes.trim() || undefined,
        overrideReason: hasDiscrepancy ? overrideReason.trim() : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể thực hiện chốt sổ.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Chốt Sổ & Đối Soát Tài Chính Định Kỳ
              </h3>
              <p className="text-xs text-slate-300">
                Khóa các giao dịch trong kỳ, lập biên bản đối soát số dư thực tế
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. Basic Period Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nhiệm kỳ áp dụng <span className="text-rose-500">*</span>
              </label>
              <Select
                value={termId}
                onValueChange={(val) => setTermId(val)}
              >
                <SelectTrigger className="w-full h-9 text-xs bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Chọn nhiệm kỳ" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.isCurrent ? '(Hiện tại)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Loại kỳ chốt sổ <span className="text-rose-500">*</span>
              </label>
              <Select
                value={periodType}
                onValueChange={(val) => setPeriodType(val as PeriodClosingType)}
              >
                <SelectTrigger className="w-full h-9 text-xs bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Theo Tháng</SelectItem>
                  <SelectItem value="quarter">Theo Quý</SelectItem>
                  <SelectItem value="custom">Tùy chỉnh khoảng ngày</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Từ ngày <span className="text-rose-500">*</span>
              </label>
              <DatePicker
                value={periodStart}
                onChange={(val) => setPeriodStart(val)}
                placeholder="Chọn từ ngày"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Đến ngày <span className="text-rose-500">*</span>
              </label>
              <DatePicker
                value={periodEnd}
                onChange={(val) => setPeriodEnd(val)}
                placeholder="Chọn đến ngày"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên biên bản chốt <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
                placeholder="VD: Chốt sổ Tháng 8/2026"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* 2. Reconciliation Engine Summary Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-blue-600" />
                Bảng Tính Toán Đối Soát Tự Động
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {transactionCount} giao dịch trong kỳ
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[11px] text-slate-400 font-medium block">Số dư đầu kỳ</span>
                <span className="text-sm font-bold text-slate-800">
                  {formatVND(openingBalance)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[11px] text-emerald-600 font-medium block">+ Tổng Thu</span>
                <span className="text-sm font-bold text-emerald-600">
                  +{formatVND(totalIncome)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[11px] text-rose-600 font-medium block">- Tổng Chi</span>
                <span className="text-sm font-bold text-rose-600">
                  -{formatVND(totalExpense)}
                </span>
              </div>
              <div className="bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-300 font-medium block">Số dư tính toán</span>
                <span className="text-sm font-bold text-white">
                  {formatVND(calculatedClosingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Actual Balance & Discrepancy Check */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Số dư thực tế kiểm kê <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleSetActualToCalculated}
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  Khớp với sổ tính
                </button>
              </div>
              <input
                type="text"
                value={actualBalanceInput !== '' ? actualBalanceInput : calculatedClosingBalance.toLocaleString('vi-VN')}
                onChange={handleActualBalanceChange}
                placeholder="Nhập số tiền thực tế tại quỹ..."
                className="w-full px-3.5 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Tổng tiền mặt thực tế tại két quỹ + số dư tài khoản ngân hàng chi hội.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kết quả đối soát
              </label>
              <div
                className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  hasDiscrepancy
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {hasDiscrepancy ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold">
                    {hasDiscrepancy ? 'Có chênh lệch số dư' : 'Khớp 100% với sổ sách'}
                  </div>
                  <div className="text-xs font-medium">
                    {hasDiscrepancy ? (
                      <span>
                        Chênh lệch: <strong className="text-rose-700 font-bold">{formatVND(discrepancy)}</strong>
                      </span>
                    ) : (
                      <span>Không có sai lệch giữa sổ tính và thực tế</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Override Reason if Discrepancy */}
          {hasDiscrepancy && (
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5 animate-in fade-in duration-200">
              <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider">
                Giải trình chênh lệch kiểm kê <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={2}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Giải trình nguyên nhân chênh lệch (ví dụ: Khoản chi lẻ chưa nộp hóa đơn, tiền lẻ chưa đối chiếu...)"
                className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-rose-950 placeholder:text-rose-400"
              />
            </div>
          )}

          {/* 5. Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ghi chú chốt sổ (Tùy chọn)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Đã đối chiếu sao kê tài khoản ngân hàng..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
            />
          </div>

          {/* Warning banner */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Lưu ý quan trọng:</strong> Sau khi chốt sổ, toàn bộ giao dịch trong khoảng thời gian từ <strong>{periodStart}</strong> đến <strong>{periodEnd}</strong> sẽ bị <strong>khóa bất biến</strong> (không thể sửa hoặc xóa) để đảm bảo tính toàn vẹn tài chính.
            </p>
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}

          {/* Actions */}
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
              disabled={isLoading || isPreviewFetching}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 rounded-xl transition-all shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Đang chốt sổ...' : 'Xác nhận Chốt Sổ Kỳ Này'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
