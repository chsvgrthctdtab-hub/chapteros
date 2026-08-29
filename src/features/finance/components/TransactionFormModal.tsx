import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  FileText,
  Tag,
  Link2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  transactionFormSchema,
  type TransactionFormData,
} from '../schemas/finance.schema';
import { formatVND } from '../utils/finance.utils';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type {
  FinanceCategoryOption,
  FinanceTermOption,
  FinanceActivityOption,
  FinanceTransactionListItem,
  FinanceType,
} from '../types/finance.types';
import dayjs from 'dayjs';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  editingTransaction?: FinanceTransactionListItem | null;
  defaultTermId?: string;
  defaultActivityId?: string;
  defaultType?: FinanceType;
  categories: FinanceCategoryOption[];
  terms: FinanceTermOption[];
  activities: FinanceActivityOption[];
  isLoading?: boolean;
}

export function TransactionFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingTransaction,
  defaultTermId,
  defaultActivityId,
  defaultType = 'income',
  categories,
  terms,
  activities,
  isLoading = false,
}: TransactionFormModalProps) {
  const isEditing = Boolean(editingTransaction);
  const activeTerm = terms.find((t) => t.isCurrent) || terms[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema) as any,
    defaultValues: {
      transactionType: defaultType,
      categoryId: '',
      termId: defaultTermId || activeTerm?.id || '',
      amount: 0,
      transactionDate: dayjs().format('YYYY-MM-DD'),
      description: '',
      activityId: defaultActivityId || null,
      receiptUrl: '',
    },
  });

  const selectedType = watch('transactionType') || 'income';
  const watchAmount = watch('amount') || 0;
  const watchTermId = watch('termId');

  const availableCategories = categories.filter((c) => c.type === selectedType);
  const availableActivities = activities.filter((a) => {
    if (!watchTermId || watchTermId === 'all') return true;
    return a.termId === watchTermId;
  });

  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        reset({
          transactionType: editingTransaction.transactionType,
          categoryId: editingTransaction.categoryId,
          termId: editingTransaction.termId,
          amount: editingTransaction.amount,
          transactionDate: editingTransaction.transactionDate
            ? dayjs(editingTransaction.transactionDate).format('YYYY-MM-DD')
            : dayjs().format('YYYY-MM-DD'),
          description: editingTransaction.description || '',
          activityId: editingTransaction.activityId || null,
          receiptUrl: editingTransaction.receiptUrl || '',
        });
      } else {
        const initialType = defaultType || 'income';
        const initialCategories = categories.filter((c) => c.type === initialType);
        reset({
          transactionType: initialType,
          categoryId: initialCategories[0]?.id || '',
          termId: defaultTermId || activeTerm?.id || '',
          amount: undefined as any,
          transactionDate: dayjs().format('YYYY-MM-DD'),
          description: '',
          activityId: defaultActivityId || null,
          receiptUrl: '',
        });
      }
    }
  }, [isOpen, editingTransaction, reset, defaultTermId, defaultActivityId, defaultType, activeTerm, categories]);

  const handleTypeSwitch = (newType: FinanceType) => {
    setValue('transactionType', newType);
    const matching = categories.filter((c) => c.type === newType);
    if (matching.length > 0) {
      setValue('categoryId', matching[0].id);
    } else {
      setValue('categoryId', '');
    }
  };

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      await onSubmit({
        ...data,
        amount: Math.abs(Number(data.amount)),
        activityId: data.activityId ? data.activityId : null,
        receiptUrl: data.receiptUrl?.trim() || null,
      });
      onClose();
    } catch (err) {
      console.error('Error submitting transaction form:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                selectedType === 'income'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {selectedType === 'income' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEditing ? 'Edit Transaction' : 'Record Transaction'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isEditing
                  ? 'Update transaction record and parameters'
                  : 'Log income inflow or operational expense disbursement'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4 text-xs">
          {/* Section 1: TRANSACTION */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              1. Transaction Parameters
            </div>

            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeSwitch('income')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  selectedType === 'income'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Income (Khoản Thu)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSwitch('expense')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  selectedType === 'expense'
                    ? 'bg-rose-800 text-white border-rose-800 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Expense (Khoản Chi)</span>
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Amount (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="e.g. 500000"
                  {...register('amount')}
                  className={`w-full pl-3 pr-12 py-2 text-sm font-mono font-bold bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all ${
                    errors.amount ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  VNĐ
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                <span className="text-slate-500">Standard preview:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedType === 'income' ? '+' : '−'}
                  {formatVND(watchAmount)}
                </span>
              </div>
              {errors.amount && (
                <p className="text-[11px] text-rose-600 mt-0.5">{errors.amount.message}</p>
              )}
            </div>

            {/* Category & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Danh mục thu chi <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full h-9 bg-slate-50 border-slate-200 text-xs">
                        <SelectValue placeholder="-- Chọn danh mục --" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{errors.categoryId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Ngày giao dịch <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="transactionDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn ngày giao dịch"
                    />
                  )}
                />
                {errors.transactionDate && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{errors.transactionDate.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Nội dung / Diễn giải chi tiết <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Ghi rõ lý do chi tiêu, người nộp/nhận, lưu ý chứng từ..."
                {...register('description')}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              {errors.description && (
                <p className="text-[11px] text-rose-600 mt-0.5">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Section 2: CONTEXT */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              2. Bối cảnh hoạt động & Nhiệm kỳ
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nhiệm kỳ hoạt động <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="termId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full h-9 bg-slate-50 border-slate-200 text-xs">
                        <SelectValue placeholder="-- Chọn nhiệm kỳ --" />
                      </SelectTrigger>
                      <SelectContent>
                        {terms.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} {t.isCurrent ? '(Hiện tại)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.termId && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{errors.termId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Hoạt động liên kết (Tùy chọn)
                </label>
                <Controller
                  name="activityId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                    >
                      <SelectTrigger className="w-full h-9 bg-slate-50 border-slate-200 text-xs">
                        <SelectValue placeholder="-- Quỹ chung (Không gắn hoạt động) --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Quỹ chung (Không gắn hoạt động) --</SelectItem>
                        {availableActivities.map((act) => (
                          <SelectItem key={act.id} value={act.id}>
                            {act.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Section 3: DOCUMENTATION */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              3. Supporting Documentation
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Receipt / Invoice URL (Drive / Image link)
              </label>
              <div className="relative">
                <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://..."
                  {...register('receiptUrl')}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              {errors.receiptUrl && (
                <p className="text-[11px] text-rose-600 mt-0.5">{errors.receiptUrl.message}</p>
              )}
            </div>
          </div>

          {/* Section 4: GOVERNANCE & APPROVAL NOTICE */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 flex items-start gap-2 text-[11px] leading-relaxed">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Transactions will be validated against internal control limits. Disbursements over approval threshold require board review.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting || isLoading}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isLoading}
              className={`text-xs h-8 ${
                selectedType === 'income'
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                  : 'bg-rose-800 hover:bg-rose-900 text-white'
              }`}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>{isEditing ? 'Update Transaction' : 'Record Transaction'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
