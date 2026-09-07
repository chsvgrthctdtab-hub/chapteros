import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckSquare, Calendar, User, Building2, AlertCircle, Loader2, Sparkles, Users, Phone, Clock, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCreateCollabTask,
  useUpdateCollabTask,
  useCollabPlanPersonnel,
  useCollabActivities,
} from '../queries/collab.queries';
import { formatError } from '@/lib/error-formatter';
import { getOrgTypeLabel, getOrgTypeBadgeClass } from '@/lib/organization.utils';
import type { CollabTask, CollabTaskStatus, TaskPriority } from '@/types';

const SUGGESTED_PHASES = [
  'Giai đoạn 1: Chuẩn bị (Trước chương trình)',
  'Giai đoạn 2: Thực hiện (Trong chương trình)',
  'Giai đoạn 3: Tổng kết và Đánh giá (Sau chương trình)',
];

const collabTaskSchema = z.object({
  title: z.string().min(3, 'Tên công việc phải có ít nhất 3 ký tự'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress'] as const),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  phase: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  externalAssignee: z.string().optional().nullable(),
  externalContact: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  collabActivityId: z.string().optional().nullable(),
});

type CollabTaskFormData = z.infer<typeof collabTaskSchema>;

interface CreateCollabTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  collabActivityId?: string;
  editingTask?: CollabTask | null;
  onSuccess?: () => void;
}

export function CreateCollabTaskDialog({
  isOpen,
  onClose,
  planId,
  collabActivityId,
  editingTask,
  onSuccess,
}: CreateCollabTaskDialogProps) {
  const createMutation = useCreateCollabTask();
  const updateMutation = useUpdateCollabTask();
  const { data: personnel = [] } = useCollabPlanPersonnel(planId);
  const { data: activities = [] } = useCollabActivities(planId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [assigneeType, setAssigneeType] = useState<'internal' | 'external'>('internal');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<CollabTaskFormData>({
    resolver: zodResolver(collabTaskSchema) as never,
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      dueTime: '',
      phase: '',
      assignedTo: null,
      externalAssignee: '',
      externalContact: '',
      organizationId: null,
      collabActivityId: collabActivityId || (activities[0]?.id ?? null),
    },
  });

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      if (editingTask) {
        const validStatus = editingTask.status === 'in_progress' ? 'in_progress' : 'todo';
        const isExternal = Boolean(editingTask.externalAssignee);
        setAssigneeType(isExternal ? 'external' : 'internal');

        reset({
          title: editingTask.title,
          description: editingTask.description || '',
          status: validStatus,
          priority: editingTask.priority || 'medium',
          dueDate: editingTask.dueDate ? editingTask.dueDate.split('T')[0] : '',
          dueTime: editingTask.dueTime || '',
          phase: editingTask.phase || '',
          assignedTo: editingTask.assignedTo || null,
          externalAssignee: editingTask.externalAssignee || '',
          externalContact: editingTask.externalContact || '',
          organizationId: editingTask.organizationId || null,
          collabActivityId: editingTask.collabActivityId || collabActivityId || null,
        });
      } else {
        setAssigneeType('internal');
        reset({
          title: '',
          description: '',
          status: 'todo',
          priority: 'medium',
          dueDate: '',
          dueTime: '',
          phase: '',
          assignedTo: null,
          externalAssignee: '',
          externalContact: '',
          organizationId: null,
          collabActivityId: collabActivityId || (activities[0]?.id ?? null),
        });
      }
    }
  }, [isOpen, editingTask, collabActivityId, reset]);

  // Tự động gán hoạt động đầu tiên khi danh sách activities tải xong nếu chưa có giá trị
  useEffect(() => {
    if (isOpen && !collabActivityId && activities.length > 0) {
      const currentActivity = watch('collabActivityId');
      if (!currentActivity) {
        setValue('collabActivityId', activities[0].id);
      }
    }
  }, [isOpen, activities, collabActivityId, setValue, watch]);

  const handleAssigneeChange = (userIdOrNone: string) => {
    if (userIdOrNone === 'none') {
      setValue('assignedTo', null);
      setValue('organizationId', null);
    } else {
      const selectedPerson = personnel.find((p) => p.userId === userIdOrNone);
      setValue('assignedTo', userIdOrNone);
      setValue('organizationId', selectedPerson?.organizationId || null);
    }
  };

  const hasNoActivities = !collabActivityId && activities.length === 0;

  const onSubmit = async (data: CollabTaskFormData) => {
    try {
      setSubmitError(null);
      const targetActivityId = collabActivityId || data.collabActivityId || (activities.length > 0 ? activities[0]?.id : null);

      if (!targetActivityId) {
        setSubmitError('Kế hoạch này chưa có hoạt động nào để gắn nhiệm vụ. Vui lòng tạo ít nhất một hoạt động trước khi phân công.');
        return;
      }

      const payload = {
        collab_activity_id: targetActivityId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        status: data.status,
        priority: data.priority,
        due_date: data.dueDate || null,
        due_time: data.dueTime?.trim() || null,
        phase: data.phase?.trim() || null,
        assigned_to: assigneeType === 'internal' ? (data.assignedTo || null) : null,
        external_assignee: assigneeType === 'external' ? (data.externalAssignee?.trim() || null) : null,
        external_contact: assigneeType === 'external' ? (data.externalContact?.trim() || null) : null,
        organization_id: assigneeType === 'internal' ? (data.organizationId || null) : null,
      };

      if (editingTask) {
        await updateMutation.mutateAsync({
          id: editingTask.id,
          payload,
        });
      } else {
        await createMutation.mutateAsync({
          payload,
        });
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Error saving collab task:', err);
      const formatted = formatError(err);
      setSubmitError(formatted.message || 'Không thể lưu công việc. Vui lòng kiểm tra quyền của đơn vị.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto bg-white border border-slate-200/80 shadow-2xl rounded-3xl p-6 sm:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="space-y-1 text-left pb-1">
          <div className="flex items-center gap-2 text-purple-600 font-semibold text-xs mb-0.5">
            <CheckSquare className="h-4 w-4" />
            <span>Nhiệm vụ Hoạt động</span>
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">
            {editingTask ? 'Chỉnh Sửa Nhiệm Vụ' : 'Giao Việc Mới'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Phân công nhiệm vụ cho nhân sự thuộc các đơn vị tham gia.
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{submitError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2 text-left">
          {/* Cảnh báo nếu kế hoạch chưa có hoạt động nào */}
          {hasNoActivities && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-amber-950">Kế hoạch này chưa có Hoạt động phối hợp nào</div>
                <div className="text-amber-800 leading-relaxed">
                  Mỗi nhiệm vụ cần trực thuộc một hoạt động cụ thể trong Kế hoạch. Vui lòng tạo ít nhất một hoạt động trong tab <strong>"Hoạt động"</strong> trước khi phân công giao việc.
                </div>
              </div>
            </div>
          )}

          {/* Chọn hoạt động collab nếu chưa chỉ định */}
          {!collabActivityId && activities.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="collab-task-act" className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                Hoạt động phối hợp thuộc chiến dịch <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="collabActivityId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || activities[0]?.id || ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="collab-task-act" className="h-9 text-xs bg-slate-50/50">
                      <SelectValue placeholder="Chọn hoạt động" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {activities.map((act) => (
                        <SelectItem key={act.id} value={act.id} className="text-xs">
                          {act.title} ({act.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Tên công việc */}
          <div className="space-y-1.5">
            <label htmlFor="collab-task-title" className="block text-xs font-semibold text-slate-700">
              Tiêu đề công việc <span className="text-rose-500">*</span>
            </label>
            <Input
              id="collab-task-title"
              {...register('title')}
              placeholder="Ví dụ: Thiết kế ấn phẩm truyền thông, Chuẩn bị 50 phần quà..."
              className="h-9 text-xs bg-slate-50/50 focus:bg-white"
            />
            {errors.title && (
              <p className="text-[11px] text-rose-500">{errors.title.message}</p>
            )}
          </div>

          {/* Giai đoạn / Chặng triển khai */}
          <div className="space-y-1.5">
            <label htmlFor="collab-task-phase" className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Flag className="h-3.5 w-3.5 text-purple-600" />
                Giai đoạn / Chặng triển khai (Tùy chọn)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Gợi ý phân loại timeline</span>
            </label>
            <Input
              id="collab-task-phase"
              {...register('phase')}
              placeholder="Nhập tên giai đoạn hoặc bấm gợi ý bên dưới..."
              className="h-9 text-xs bg-slate-50/50 focus:bg-white"
            />
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {SUGGESTED_PHASES.map((sPhase) => (
                <button
                  key={sPhase}
                  type="button"
                  onClick={() => setValue('phase', sPhase)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
                >
                  + {sPhase}
                </button>
              ))}
            </div>
          </div>

          {/* Người phụ trách */}
          <div className="space-y-2.5 p-3.5 bg-purple-50/40 rounded-xl border border-purple-100">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="block text-xs font-semibold text-purple-900 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-purple-600" />
                Người phụ trách
              </label>

              {/* Chuyển đổi giữa nhân sự nội bộ và đối tác ngoài */}
              <div className="flex items-center p-0.5 bg-purple-100/70 rounded-lg text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setAssigneeType('internal')}
                  className={cn(
                    'px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer',
                    assigneeType === 'internal'
                      ? 'bg-white text-purple-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <Building2 className="w-3 h-3" />
                  <span>Đơn vị tham gia</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssigneeType('external')}
                  className={cn(
                    'px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer',
                    assigneeType === 'external'
                      ? 'bg-purple-600 text-white shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <Users className="w-3 h-3" />
                  <span>Đối tác ngoài (Đoàn xã, Trường bạn...)</span>
                </button>
              </div>
            </div>

            {assigneeType === 'internal' ? (
              <Controller
                name="assignedTo"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(val) => {
                      handleAssigneeChange(val);
                      field.onChange(val === 'none' ? null : val);
                    }}
                  >
                    <SelectTrigger id="collab-task-assignee" className="h-9 text-xs bg-white border-purple-200 min-w-0">
                      <SelectValue placeholder="Chọn nhân sự phụ trách từ các đơn vị tham gia" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 max-h-56">
                      <SelectItem value="none" className="text-xs text-slate-400">
                        -- Chưa phân công --
                      </SelectItem>
                      {personnel.map((p) => {
                        const typeLabel = getOrgTypeLabel(p.organizationType);
                        const typeBadgeClass = getOrgTypeBadgeClass(p.organizationType);
                        const studentInfo = [p.studentId, p.className, p.cohort ? `K${p.cohort}` : null]
                          .filter(Boolean)
                          .join(' • ');
                        return (
                          <SelectItem key={`${p.userId}-${p.organizationId}`} value={p.userId} className="text-xs">
                            <div className="flex items-center justify-between w-full gap-2 min-w-0">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-semibold text-slate-900">{p.fullName}</span>
                                {studentInfo && (
                                  <span className="text-[10px] text-slate-400 font-mono">({studentInfo})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${typeBadgeClass}`}>
                                  {typeLabel}
                                </span>
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium truncate max-w-[130px]" title={`${p.organizationName} (${p.organizationCode})`}>
                                  {p.organizationCode}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                <div className="space-y-1">
                  <label htmlFor="collab-task-ext-name" className="block text-[11px] font-semibold text-purple-900 flex items-center gap-1">
                    <User className="w-3 h-3 text-purple-600" />
                    Họ tên / Đơn vị ngoài phụ trách
                  </label>
                  <Input
                    id="collab-task-ext-name"
                    {...register('externalAssignee')}
                    placeholder="VD: Đ/c Nam (Bí thư Đoàn xã Long Bình), Đội SVTN..."
                    className="h-8.5 text-xs bg-white border-purple-200"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="collab-task-ext-phone" className="block text-[11px] font-semibold text-purple-900 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-purple-600" />
                    Số điện thoại / Zalo liên hệ
                  </label>
                  <Input
                    id="collab-task-ext-phone"
                    {...register('externalContact')}
                    placeholder="VD: 0912.345.678"
                    className="h-8.5 text-xs bg-white border-purple-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mức độ ưu tiên, Ngày deadline & Khung giờ & Trạng thái (khi sửa) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {editingTask && (
              <div className="space-y-1.5">
                <label htmlFor="collab-task-status" className="block text-xs font-semibold text-slate-700">
                  Trạng thái
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'todo'}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="collab-task-status" className="h-9 text-xs bg-slate-50/50">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="todo" className="text-xs">Cần làm</SelectItem>
                        <SelectItem value="in_progress" className="text-xs">Đang thực hiện</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="collab-task-priority" className="block text-xs font-semibold text-slate-700">
                Mức độ ưu tiên
              </label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'medium'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="collab-task-priority" className="h-9 text-xs bg-slate-50/50">
                      <SelectValue placeholder="Ưu tiên" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="low" className="text-xs text-slate-600">Thấp</SelectItem>
                      <SelectItem value="medium" className="text-xs text-blue-600">Trung bình</SelectItem>
                      <SelectItem value="high" className="text-xs text-amber-600">Cao</SelectItem>
                      <SelectItem value="urgent" className="text-xs text-rose-600 font-bold">Khẩn cấp</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Hạn chót (Ngày)
              </label>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Chọn ngày hoàn thành"
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="collab-task-time" className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Khung giờ thực hiện (Tùy chọn)
              </label>
              <Input
                id="collab-task-time"
                {...register('dueTime')}
                placeholder="VD: 07:30 - 08:30 hoặc trước 17:00"
                className="h-9 text-xs bg-slate-50/50"
              />
            </div>
          </div>

          {/* Mô tả chi tiết */}
          <div className="space-y-1.5">
            <label htmlFor="collab-task-desc" className="block text-xs font-semibold text-slate-700">
              Yêu cầu & Ghi chú thực hiện
            </label>
            <Textarea
              id="collab-task-desc"
              {...register('description')}
              rows={2}
              placeholder="Ghi rõ yêu cầu đầu ra, các lưu ý về thời gian hoặc địa điểm bàn giao..."
              className="text-xs bg-slate-50/50 resize-none"
            />
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending || updateMutation.isPending || hasNoActivities}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Đang lưu...
                </>
              ) : (
                'Lưu công việc'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
