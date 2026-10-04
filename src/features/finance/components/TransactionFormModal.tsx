import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  TrendingUp,
  TrendingDown,
  Link2,
  Loader2,
  CheckCircle2,
  Info,
  User,
} from '@/lib/icons';
import {
  transactionFormSchema,
  type TransactionFormData,
} from '../schemas/finance.schema';
import { formatVND, parseTransactionMetadata } from '../utils/finance.utils';
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
import type { TaskAssigneeOption } from '@/features/tasks/types/task.types';
import { useTaskAssignees } from '@/features/tasks/queries/task.queries';
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
  organizationId?: string;
  assignees?: TaskAssigneeOption[];
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
  organizationId,
  assignees,
  isLoading = false,
}: TransactionFormModalProps) {
  const isEditing = Boolean(editingTransaction);
  const activeTerm = terms.find((t) => t.isCurrent) || terms[0];

  const { data: fetchedAssignees = [] } = useTaskAssignees(organizationId);
  const allAssignees = assignees && assignees.length > 0 ? assignees : fetchedAssignees;
  const boardAssignees = allAssignees.filter((u) => u.isBoard);
  const regularAssignees = allAssignees.filter((u) => !u.isBoard);

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
      personProfileId: 'none',
      personName: '',
      isUnpaid: false,
      isReimbursed: true,
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
        const meta = parseTransactionMetadata(editingTransaction.description);
        const isUnpaid =
          editingTransaction.isUnpaid ??
          meta.isUnpaid ??
          (editingTransaction.isReimbursed === false);
        reset({
          transactionType: editingTransaction.transactionType,
          categoryId: editingTransaction.categoryId,
          termId: editingTransaction.termId,
          amount: editingTransaction.amount,
          transactionDate: editingTransaction.transactionDate
            ? dayjs(editingTransaction.transactionDate).format('YYYY-MM-DD')
            : dayjs().format('YYYY-MM-DD'),
          description: meta.cleanDescription || editingTransaction.description || '',
          activityId: editingTransaction.activityId || null,
          receiptUrl: editingTransaction.receiptUrl || '',
          personProfileId: editingTransaction.person?.profileId || meta.person?.profileId || 'none',
          personName: editingTransaction.person?.name || meta.person?.name || '',
          isUnpaid: Boolean(isUnpaid),
          isReimbursed: !isUnpaid,
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
          personProfileId: 'none',
          personName: '',
          isUnpaid: false,
          isReimbursed: true,
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
      const isUnpaid = selectedType === 'expense' ? Boolean(data.isUnpaid) : null;
      await onSubmit({
        ...data,
        amount: Math.abs(Number(data.amount)),
        activityId: data.activityId ? data.activityId : null,
        receiptUrl: data.receiptUrl?.trim() || null,
        personProfileId:
          data.personProfileId && data.personProfileId !== 'none'
            ? data.personProfileId
            : null,
        personName: data.personName?.trim() || null,
        isUnpaid,
        isReimbursed: selectedType === 'expense' ? !isUnpaid : null,
      });
      onClose();
    } catch (err) {
      console.error('Error submitting transaction form:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-navy/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full border border-hairline overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline bg-cloud">
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
              <h3 className="text-sm font-bold text-ink-navy">
                {isEditing ? 'Chỉnh sửa giao dịch' : 'Ghi nhận giao dịch'}
              </h3>
              <p className="text-[11px] text-slate-gray">
                {isEditing
                  ? 'Cập nhật nội dung và thông số phiếu thu/chi'
                  : 'Ghi chép dòng thu ngân quỹ hoặc giải ngân chi phí'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-mist-gray hover:text-ink-navy rounded-lg hover:bg-pebble transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4 text-xs">
          {/* Section 1: TRANSACTION */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-navy">
              1. Thông tin thu chi
            </div>

            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeSwitch('income')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === 'income'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-cloud text-slate-gray border-hairline hover:bg-pebble'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Khoản Thu (Income)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSwitch('expense')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === 'expense'
                    ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                    : 'bg-cloud text-slate-gray border-hairline hover:bg-pebble'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Khoản Chi (Expense)</span>
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-gray mb-1">
                Số tiền (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="VD: 500000"
                  {...register('amount')}
                  className={`w-full pl-3 pr-12 py-2 text-sm font-bold tabular-nums bg-cloud border rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-signal-blue text-ink-navy transition-all ${
                    errors.amount ? 'border-rose-300 bg-rose-50/30' : 'border-hairline'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-mist-gray">
                  VNĐ
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                <span className="text-slate-gray">Xem trước định dạng:</span>
                <span className="font-bold text-ink-navy tabular-nums">
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
                <label className="block text-[11px] font-semibold text-slate-gray mb-1">
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
                      <SelectTrigger className="w-full h-9 bg-cloud border-hairline rounded-lg text-xs text-ink-navy">
                        <SelectValue placeholder="-- Chọn danh mục --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-hairline bg-white shadow-lg">
                        {availableCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="text-xs">
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
                <label className="block text-[11px] font-semibold text-slate-gray mb-1">
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

            {/* Person selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-gray mb-1">
                {selectedType === 'income' ? 'Người nộp tiền' : 'Người chi tiền / tạm ứng'}
              </label>
              <Controller
                name="personProfileId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(val) => {
                      field.onChange(val);
                      if (val !== 'none') {
                        const matched = allAssignees.find((a) => a.profileId === val);
                        if (matched) {
                          setValue('personName', matched.fullName);
                        }
                      } else {
                        setValue('personName', '');
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-9 bg-cloud border-hairline rounded-lg text-xs text-ink-navy">
                      <SelectValue
                        placeholder={
                          selectedType === 'income'
                            ? '-- Chọn người nộp --'
                            : '-- Chọn người chi --'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="none" className="text-xs">
                        -- Chưa xác định / Khác --
                      </SelectItem>
                      {boardAssignees.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-[10px] font-bold text-signal-blue uppercase tracking-wider bg-[#e6f0ff]/60 rounded-sm my-1">
                            Ban Chấp Hành / Điều Hành
                          </div>
                          {boardAssignees.map((u) => (
                            <SelectItem
                              key={u.profileId}
                              value={u.profileId}
                              className="text-xs font-medium"
                            >
                              {u.fullName} {u.studentId ? `(${u.studentId})` : ''}{' '}
                              {u.position ? `— [${u.position}]` : ''}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {regularAssignees.length > 0 && (
                        <>
                          {boardAssignees.length > 0 && (
                            <div className="px-2 py-1 text-[10px] font-semibold text-slate-gray uppercase tracking-wider bg-cloud rounded-sm my-1">
                              Hội viên Chi hội
                            </div>
                          )}
                          {regularAssignees.map((u) => (
                            <SelectItem key={u.profileId} value={u.profileId} className="text-xs">
                              {u.fullName} {u.studentId ? `(${u.studentId})` : ''}{' '}
                              {u.position ? `— ${u.position}` : ''}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-gray mb-1">
                Nội dung / Diễn giải chi tiết <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Ghi rõ lý do chi tiêu, người nộp/nhận, lưu ý chứng từ..."
                {...register('description')}
                className="w-full px-2.5 py-1.5 bg-cloud border border-hairline rounded-lg text-ink-navy text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-signal-blue resize-none"
              />
              {errors.description && (
                <p className="text-[11px] text-rose-600 mt-0.5">{errors.description.message}</p>
              )}
            </div>

            {/* Checkbox Chưa thanh (Chỉ cho Khoản Chi) */}
            {selectedType === 'expense' && (
              <label className="flex items-center gap-2 cursor-pointer pt-0.5 text-xs text-ink-navy select-none">
                <input
                  type="checkbox"
                  {...register('isUnpaid')}
                  className="h-4 w-4 rounded border-hairline text-signal-blue focus:ring-signal-blue cursor-pointer"
                />
                <span className="font-medium text-ink-navy">Chưa thanh</span>
              </label>
            )}
          </div>

          {/* Section 2: CONTEXT */}
          <div className="pt-2 border-t border-hairline space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-navy">
              2. Bối cảnh hoạt động & Nhiệm kỳ
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-gray mb-1">
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
                      <SelectTrigger className="w-full h-9 bg-cloud border-hairline rounded-lg text-xs text-ink-navy">
                        <SelectValue placeholder="-- Chọn nhiệm kỳ --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-hairline bg-white shadow-lg">
                        {terms.map((t) => (
                          <SelectItem key={t.id} value={t.id} className="text-xs">
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
                <label className="block text-[11px] font-semibold text-slate-gray mb-1">
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
                      <SelectTrigger className="w-full h-9 bg-cloud border-hairline rounded-lg text-xs text-ink-navy">
                        <SelectValue placeholder="-- Quỹ chung (Không gắn hoạt động) --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-hairline bg-white shadow-lg">
                        <SelectItem value="none" className="text-xs">-- Quỹ chung (Không gắn hoạt động) --</SelectItem>
                        {availableActivities.map((act) => (
                          <SelectItem key={act.id} value={act.id} className="text-xs">
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
          <div className="pt-2 border-t border-hairline space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-navy">
              3. Chứng từ đính kèm
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-gray mb-1">
                Đường dẫn liên kết chứng từ / Hóa đơn (Drive / Ảnh)
              </label>
              <div className="relative">
                <Link2 className="w-3.5 h-3.5 text-mist-gray absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://..."
                  {...register('receiptUrl')}
                  className="w-full pl-8 pr-3 py-1.5 bg-cloud border border-hairline rounded-lg text-ink-navy focus:bg-white focus:outline-none focus:ring-1 focus:ring-signal-blue"
                />
              </div>
              {errors.receiptUrl && (
                <p className="text-[11px] text-rose-600 mt-0.5">{errors.receiptUrl.message}</p>
              )}
            </div>
          </div>

          {/* Section 4: GOVERNANCE & APPROVAL NOTICE */}
          <div className="p-2.5 rounded-lg bg-cloud border border-hairline text-slate-gray flex items-start gap-2 text-[11px] leading-relaxed">
            <Info className="w-3.5 h-3.5 text-signal-blue shrink-0 mt-0.5" />
            <span>
              Các giao dịch sẽ được kiểm tra tự động theo ngưỡng hạn mức chi tiêu. Các khoản chi vượt hạn mức sẽ chuyển sang danh sách chờ Ban Chủ nhiệm duyệt.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-hairline">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting || isLoading}
              className="text-xs h-8 rounded-lg border-hairline text-ink-navy hover:bg-cloud"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isLoading}
              className={`text-xs h-8 rounded-lg shadow-sm font-semibold ${
                selectedType === 'income'
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-rose-700 hover:bg-rose-800 text-white'
              }`}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>{isEditing ? 'Cập nhật giao dịch' : 'Ghi nhận giao dịch'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
