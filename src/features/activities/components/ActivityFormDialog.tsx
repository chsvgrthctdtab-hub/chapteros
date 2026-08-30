import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Calendar, MapPin, Tag, Users, AlertCircle, Loader2, Sparkles, UserCheck, Lock } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  activityFormSchema,
  type ActivityFormData,
} from '../schemas/activity.schema';
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_STATUSES,
  type ActivityListItem,
} from '../types/activity.types';
import { isActivityLocked } from '../utils/activity-workflow';
import {
  toDateTimeLocalString,
  fromDateTimeLocalString,
} from '@/lib/date';
import type { Term, Member } from '@/types';

interface ActivityFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityFormData) => Promise<void>;
  activityToEdit?: ActivityListItem | null;
  terms: Term[];
  leadCandidates?: Member[];
  isSubmitting?: boolean;
}

export function ActivityFormDialog({
  isOpen,
  onClose,
  onSubmit,
  activityToEdit,
  terms,
  leadCandidates = [],
  isSubmitting = false,
}: ActivityFormDialogProps) {
  const isEditMode = Boolean(activityToEdit);
  const isLocked = isEditMode && isActivityLocked(activityToEdit?.status || 'draft');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Find default current term
  const currentTerm = terms.find((t) => t.isCurrent) || terms[0];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ActivityFormData>({
    // Type casting resolver to avoid subtle TS Resolver mismatch
    resolver: zodResolver(activityFormSchema) as never,
    defaultValues: {
      title: '',
      termId: currentTerm?.id || '',
      code: '',
      leadMemberId: '',
      category: 'general',
      status: 'draft',
      location: '',
      startDate: '',
      endDate: '',
      targetMembers: 0,
      bannerUrl: '',
      description: '',
    },
  });

  const category = watch('category');

  // Sync form values when dialog opens or editing activity changes
  useEffect(() => {
    if (!isOpen) {
      setSubmitError(null);
      return;
    }

    if (activityToEdit) {
      reset({
        title: activityToEdit.title,
        termId: activityToEdit.termId,
        code: activityToEdit.code || '',
        leadMemberId: activityToEdit.leadMemberId || '',
        category: activityToEdit.category,
        status: activityToEdit.status,
        location: activityToEdit.location || '',
        startDate: toDateTimeLocalString(activityToEdit.startDate),
        endDate: toDateTimeLocalString(activityToEdit.endDate),
        targetMembers: activityToEdit.targetMembers || 0,
        bannerUrl: activityToEdit.bannerUrl || '',
        description: activityToEdit.description || '',
      });
    } else {
      // Default dates for new activity: tomorrow at 08:00 to 11:30
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(11, 30, 0, 0);

      reset({
        title: '',
        termId: currentTerm?.id || '',
        code: '',
        leadMemberId: '',
        category: 'general',
        status: 'draft',
        location: '',
        startDate: toDateTimeLocalString(tomorrow),
        endDate: toDateTimeLocalString(tomorrowEnd),
        targetMembers: 50,
        bannerUrl: '',
        description: '',
      });
    }
  }, [isOpen, activityToEdit, currentTerm, reset]);

  // Auto generate activity code suggestion
  const handleGenerateCode = () => {
    const currentYear = new Date().getFullYear();
    const prefix = category ? category.substring(0, 2).toUpperCase() : 'HD';
    const rand = Math.floor(100 + Math.random() * 900);
    setValue('code', `${prefix}-${currentYear}-${rand}`);
  };

  const handleFormSubmit = async (data: ActivityFormData) => {
    setSubmitError(null);
    try {
      // Convert datetime-local inputs to full ISO timestamp strings
      const payload: ActivityFormData = {
        ...data,
        leadMemberId: data.leadMemberId?.trim() || undefined,
        startDate: fromDateTimeLocalString(data.startDate),
        endDate: fromDateTimeLocalString(data.endDate),
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setSubmitError((err as Error).message || 'Đã có lỗi xảy ra khi lưu hoạt động');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="activity-form-dialog"
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditMode ? 'Chỉnh sửa hoạt động / sự kiện' : 'Tạo mới hoạt động / sự kiện'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditMode
                ? 'Cập nhật thông tin chi tiết, kế hoạch và thời gian tổ chức'
                : 'Lập kế hoạch tổ chức chương trình mới cho Đơn vị'}
            </p>
          </div>
          <button
            type="button"
            id="close-activity-dialog-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form
          onSubmit={handleSubmit(handleFormSubmit, (valErrors) => {
            console.error('Form validation failed:', valErrors);
            const firstErr = Object.values(valErrors)[0];
            if (firstErr?.message) {
              setSubmitError(String(firstErr.message));
            }
          })}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {/* Locked Notice Banner */}
          {isLocked && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs">
              <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span className="font-bold">Hoạt động đã ở trạng thái kết thúc ({activityToEdit?.status === 'completed' ? 'Đã hoàn thành' : 'Đã hủy'}).</span>
                <p className="mt-0.5 text-amber-700">Dữ liệu cốt lõi đã được lưu trữ an toàn trong lịch sử Đơn vị.</p>
              </div>
            </div>
          )}

          {/* Submission Error Banner */}
          {submitError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Activity Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tên hoạt động / chương trình <span className="text-rose-500">*</span>
            </label>
            <input
              id="activity-title-input"
              type="text"
              disabled={isLocked}
              placeholder="VD: Chiến dịch Mùa Hè Xanh 2026, Giải bóng đá Hội đồng hương..."
              {...register('title')}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 ${
                errors.title ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title.message}</p>}
          </div>

          {/* Code & Term Selector Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Activity Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Mã hoạt động (Tùy chọn)
                </label>
                {!isLocked && (
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 font-medium cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Tạo mã tự động</span>
                  </button>
                )}
              </div>
              <input
                id="activity-code-input"
                type="text"
                disabled={isLocked}
                placeholder="VD: TN-2026-001"
                {...register('code')}
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 ${
                  errors.code ? 'border-rose-400' : 'border-slate-300'
                }`}
              />
              {errors.code && <p className="text-xs text-rose-600 mt-1">{errors.code.message}</p>}
            </div>

            {/* Term Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nhiệm kỳ tổ chức <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="termId"
                control={control}
                render={({ field }) => (
                  <Select
                    disabled={isLocked || terms.length === 0}
                    value={field.value || ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="activity-term-select" className="w-full h-10 text-sm bg-white">
                      <SelectValue placeholder="Chọn nhiệm kỳ tổ chức" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} {t.isCurrent ? '(Nhiệm kỳ hiện tại)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.termId && <p className="text-xs text-rose-600 mt-1">{errors.termId.message}</p>}
            </div>
          </div>

          {/* Lead Member & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Responsible Person (Lead Member) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Người phụ trách chính
              </label>
              <Controller
                name="leadMemberId"
                control={control}
                render={({ field }) => (
                  <Select
                    disabled={isLocked}
                    value={field.value || 'none'}
                    onValueChange={(val) => field.onChange(val === 'none' ? '' : val)}
                  >
                    <SelectTrigger id="activity-lead-member-select" className="w-full h-10 text-sm bg-white">
                      <SelectValue placeholder="-- Chưa chỉ định người phụ trách --" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="none">-- Chưa chỉ định người phụ trách --</SelectItem>
                      {leadCandidates.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="font-medium text-slate-900">{m.fullName}</span>
                          {m.position ? (
                            <span className="text-slate-500 ml-1.5 text-xs font-normal">
                              - {m.position}
                            </span>
                          ) : m.email ? (
                            <span className="text-slate-400 ml-1.5 text-xs font-normal">
                              ({m.email})
                            </span>
                          ) : m.studentId ? (
                            <span className="text-slate-400 ml-1.5 text-xs font-normal">
                              ({m.studentId})
                            </span>
                          ) : null}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.leadMemberId && <p className="text-xs text-rose-600 mt-1">{errors.leadMemberId.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phân loại hoạt động <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    disabled={isLocked}
                    value={field.value || 'general'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="activity-category-select" className="w-full h-10 text-sm bg-white">
                      <SelectValue placeholder="Chọn phân loại hoạt động" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ACTIVITY_CATEGORIES).map((c) => (
                        <SelectItem key={c.key} value={c.key}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-xs text-rose-600 mt-1">{errors.category.message}</p>}
            </div>
          </div>

          {/* Status Row (Only visible when editing existing activity) */}
          {isEditMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Trạng thái hoạt động <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    disabled={isLocked}
                    value={field.value || 'draft'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="activity-status-select" className="w-full h-10 text-sm bg-white">
                      <SelectValue placeholder="Chọn trạng thái hoạt động" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ACTIVITY_STATUSES).map((s) => (
                        <SelectItem key={s.key} value={s.key}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && <p className="text-xs text-rose-600 mt-1">{errors.status.message}</p>}
            </div>
          )}

          {/* Dates Row: Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Thời gian bắt đầu <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    showTime={true}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Chọn thời gian bắt đầu"
                    disabled={isLocked}
                  />
                )}
              />
              {errors.startDate && <p className="text-xs text-rose-600 mt-1">{errors.startDate.message}</p>}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Thời gian kết thúc <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    showTime={true}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Chọn thời gian kết thúc"
                    disabled={isLocked}
                  />
                )}
              />
              {errors.endDate && <p className="text-xs text-rose-600 mt-1">{errors.endDate.message}</p>}
            </div>
          </div>

          {/* Location & Target Members Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Địa điểm tổ chức
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="activity-location-input"
                  type="text"
                  disabled={isLocked}
                  placeholder="VD: Hội trường A, Sân vận động trường..."
                  {...register('location')}
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
              {errors.location && <p className="text-xs text-rose-600 mt-1">{errors.location.message}</p>}
            </div>

            {/* Target Members */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Số người tham gia dự kiến
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="activity-target-members-input"
                  type="number"
                  min="0"
                  disabled={isLocked}
                  placeholder="0"
                  {...register('targetMembers')}
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
              {errors.targetMembers && <p className="text-xs text-rose-600 mt-1">{errors.targetMembers.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mô tả chi tiết & Kế hoạch nội dung
            </label>
            <textarea
              id="activity-description-input"
              rows={3}
              disabled={isLocked}
              placeholder="Mục đích, ý nghĩa hoạt động, đối tượng hướng đến, lưu ý cho người tham gia..."
              {...register('description')}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
            />
            {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description.message}</p>}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              id="cancel-activity-form-btn"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {isLocked ? 'Đóng' : 'Hủy bỏ'}
            </button>
            {!isLocked && (
              <button
                type="submit"
                id="submit-activity-form-btn"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs focus:ring-2 focus:ring-indigo-500/30 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>{isEditMode ? 'Lưu thay đổi' : 'Tạo hoạt động'}</span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
