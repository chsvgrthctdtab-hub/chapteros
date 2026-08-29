import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import { taskFormSchema, type TaskFormData } from '../schemas/task.schema';
import type { TaskListItem, TaskAssigneeOption, TaskPriority, TaskStatus } from '../types/task.types';
import { TASK_STATUSES, TASK_PRIORITIES } from '../types/task.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { Term, Activity } from '@/types';
import { cn } from '@/lib/utils';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  initialTask?: TaskListItem | null;
  defaultTermId?: string;
  defaultActivityId?: string;
  terms: Term[];
  activities: Activity[];
  assignees: TaskAssigneeOption[];
  isLoading?: boolean;
}

export function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
  defaultTermId,
  defaultActivityId,
  terms,
  activities,
  assignees,
  isLoading = false,
}: TaskFormModalProps) {
  const { t, language } = useLanguage();
  const isEditing = Boolean(initialTask);

  const formatForDateInput = (isoDate?: string | null) => {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      termId: defaultTermId || terms.find((t) => t.isCurrent)?.id || terms[0]?.id || '',
      activityId: defaultActivityId || null,
      assignedTo: null,
      status: 'todo',
      priority: 'medium',
      progress: 0,
      dueDate: '',
    },
  });

  const currentStatus = watch('status');
  const currentProgress = watch('progress');
  const selectedTermId = watch('termId');

  const matchingActivities = activities.filter(
    (a) => !selectedTermId || !a.termId || a.termId === selectedTermId
  );
  const displayActivities = matchingActivities.length > 0 ? matchingActivities : activities;

  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        reset({
          title: initialTask.title,
          description: initialTask.description || '',
          termId: initialTask.termId,
          activityId: initialTask.activityId || null,
          assignedTo: initialTask.assignedTo || null,
          status: initialTask.status,
          priority: initialTask.priority,
          progress: initialTask.progress || 0,
          dueDate: formatForDateInput(initialTask.dueDate),
        });
      } else {
        const activeTerm = terms.find((t) => t.isCurrent)?.id || terms[0]?.id || '';
        reset({
          title: '',
          description: '',
          termId: defaultTermId || activeTerm,
          activityId: defaultActivityId || null,
          assignedTo: null,
          status: 'todo',
          priority: 'medium',
          progress: 0,
          dueDate: '',
        });
      }
    }
  }, [isOpen, initialTask, defaultTermId, defaultActivityId, terms, reset]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    setValue('status', newStatus);
    if (newStatus === 'completed' && currentProgress < 100) {
      setValue('progress', 100);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-2xs">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing
                  ? t('task.modal.title_edit', 'Chỉnh sửa nhiệm vụ')
                  : t('task.modal.title_new', 'Thêm nhiệm vụ mới')}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? t('task.modal.subtitle_edit', 'Cập nhật phân công, tiến độ và hạn hoàn thành')
                  : t('task.modal.subtitle_new', 'Phân công nhiệm vụ cho cán bộ hoặc tạo công việc Chi hội')}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-task-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="task-form-title" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('task.form.title', 'Tên nhiệm vụ')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="task-form-title"
              {...register('title')}
              placeholder={
                language === 'vi'
                  ? 'Ví dụ: Thiết kế banner sự kiện, Chuẩn bị âm thanh ánh sáng...'
                  : 'e.g. Design event banner, Prepare audio equipment...'
              }
              className={cn(
                'w-full text-xs px-3.5 py-2.5 bg-slate-50 border rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all font-medium',
                errors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
              )}
            />
            {errors.title && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.title.message}</span>
              </p>
            )}
          </div>

          {/* Term & Related Activity Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Term */}
            <div>
              <label htmlFor="task-form-term" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('task.form.term', 'Nhiệm kỳ')} <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="termId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="task-form-term" className="w-full text-xs h-9 bg-slate-50">
                      <SelectValue placeholder="Chọn nhiệm kỳ..." />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map((tItem) => (
                        <SelectItem key={tItem.id} value={tItem.id}>
                          {tItem.name} {tItem.isCurrent ? (language === 'vi' ? '(Hiện tại)' : '(Active)') : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.termId && (
                <p className="text-xs text-rose-600 mt-1">{errors.termId.message}</p>
              )}
            </div>

            {/* Related Activity */}
            <div>
              <label htmlFor="task-form-activity" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('task.form.activity', 'Hoạt động liên kết')}
              </label>
              <Controller
                name="activityId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                  >
                    <SelectTrigger id="task-form-activity" className="w-full text-xs h-9 bg-slate-50">
                      <SelectValue placeholder={language === 'vi' ? '— Độc lập (Không liên kết) —' : '— Standalone —'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {language === 'vi' ? '— Độc lập (Không liên kết hoạt động) —' : '— Standalone (No activity) —'}
                      </SelectItem>
                      {displayActivities.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.title} {a.code ? `(${a.code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Assignee & Due Date Row */}
          {/* Row: Assignee, Due Date & Priority */}
          <div className={cn(
            'grid gap-3.5',
            isEditing ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'
          )}>
            {/* Assignee */}
            <div>
              <label htmlFor="task-form-assignee" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('task.form.assignee', 'Người phụ trách')}
              </label>
              <Controller
                name="assignedTo"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                  >
                    <SelectTrigger id="task-form-assignee" className="w-full text-xs h-9 bg-slate-50">
                      <SelectValue placeholder={language === 'vi' ? '— Chưa phân công —' : '— Unassigned —'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {language === 'vi' ? '— Chưa phân công —' : '— Unassigned —'}
                      </SelectItem>
                      {assignees.map((u) => (
                        <SelectItem key={u.profileId} value={u.profileId}>
                          {u.fullName} {u.studentId ? `(${u.studentId})` : ''} {u.position ? `— ${u.position}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="task-form-due-date" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('task.form.due_date', 'Hạn hoàn thành')}
              </label>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('task.form.due_date_placeholder', 'Chọn hạn hoàn thành...')}
                    className="w-full text-xs"
                  />
                )}
              />
            </div>

            {/* Priority on Create Mode */}
            {!isEditing && (
              <div>
                <label htmlFor="task-form-priority-create" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t('task.form.priority', 'Mức độ ưu tiên')}
                </label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'medium'}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="task-form-priority-create" className="w-full text-xs h-9 bg-slate-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TASK_PRIORITIES).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            {t(`task.priority.${key}`, cfg.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          {/* Edit-only Status & Progress tracking section */}
          {isEditing && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
              {/* Priority */}
              <div>
                <label htmlFor="task-form-priority" className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  {t('task.form.priority', 'Mức độ ưu tiên')}
                </label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'medium'}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="task-form-priority" className="w-full text-xs h-8 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TASK_PRIORITIES).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            {t(`task.priority.${key}`, cfg.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="task-form-status" className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  {t('task.form.status', 'Trạng thái')}
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'todo'}
                      onValueChange={(val: any) => {
                        field.onChange(val);
                        if (val === 'completed' && currentProgress < 100) {
                          setValue('progress', 100);
                        }
                      }}
                    >
                      <SelectTrigger id="task-form-status" className="w-full text-xs h-8 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TASK_STATUSES).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            {t(`task.status.${key}`, cfg.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Progress (%) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="task-form-progress" className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    {t('task.form.progress', 'Tiến độ (%)')}
                  </label>
                  <span className="font-mono font-bold text-xs text-emerald-700">{currentProgress}%</span>
                </div>
                <input
                  type="range"
                  id="task-form-progress"
                  min="0"
                  max="100"
                  step="5"
                  {...register('progress')}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700 mt-1.5"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label htmlFor="task-form-desc" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('task.form.description', 'Mô tả & Yêu cầu kết quả')}
            </label>
            <textarea
              id="task-form-desc"
              rows={3}
              {...register('description')}
              placeholder={
                language === 'vi'
                  ? 'Ghi rõ hướng dẫn thực hiện, kết quả bàn giao cần có, tiêu chuẩn chất lượng...'
                  : 'Provide specific instructions, deliverables, quality expectations...'
              }
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 leading-relaxed resize-none font-medium"
            />
            {errors.description && (
              <p className="text-xs text-rose-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              id="cancel-task-btn"
              onClick={onClose}
              disabled={isSubmitting || isLoading}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              {t('common.cancel', 'Hủy')}
            </button>
            <button
              type="submit"
              id="submit-task-btn"
              disabled={isSubmitting || isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting || isLoading ? (
                <span>{language === 'vi' ? 'Đang lưu...' : 'Saving...'}</span>
              ) : (
                <span>
                  {isEditing
                    ? t('task.action.save_changes', 'Lưu thay đổi')
                    : t('task.action.create', 'Tạo nhiệm vụ')}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

