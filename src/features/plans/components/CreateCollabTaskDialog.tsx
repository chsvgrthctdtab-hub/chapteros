import { useState, useEffect, useMemo } from 'react';
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
import { AlertCircle, Loader2, Sparkles, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCreateCollabTask,
  useUpdateCollabTask,
  useCollabPlanPersonnel,
  useCollabActivities,
} from '../queries/collab.queries';
import { usePlanDetail } from '../queries/plan.queries';
import { formatError } from '@/lib/error-formatter';
import type { CollabTask, TaskPriority } from '@/types';

export const CATEGORY_OPTIONS = [
  'Thiết kế & Truyền thông',
  'Tiền trạm & Địa phương',
  'Chương trình & Sân khấu',
  'Trạm trò chơi & Gian hàng',
  'Hậu cần & Vật phẩm',
  'Tài chính & Quyên góp',
  'Công việc chung',
];

export const PHASE_OPTIONS = [
  'Giai đoạn 1: Chuẩn bị (Trước chương trình)',
  'Giai đoạn 2: Thực hiện (Trong chương trình)',
  'Giai đoạn 3: Tổng kết và Đánh giá (Sau chương trình)',
];

const collabTaskSchema = z.object({
  title: z.string().min(2, 'Tên công việc phải có ít nhất 2 ký tự'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress'] as const),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  category: z.string().optional(),
  phase: z.string().optional(),
  deliverable: z.string().optional(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  externalAssignee: z.string().optional().nullable(),
  externalOrganization: z.string().optional().nullable(),
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
  const { data: plan } = usePlanDetail(planId);
  const { data: personnel = [] } = useCollabPlanPersonnel(planId);
  const { data: activities = [] } = useCollabActivities(planId);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [assigneeType, setAssigneeType] = useState<'internal' | 'external'>('internal');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // Danh sách các đơn vị tham gia trong kế hoạch
  const participatingOrgs = useMemo(() => {
    const list: { id: string; name: string; code: string; color: string; isLead: boolean }[] = [];
    if (plan?.leadOrganization) {
      list.push({
        id: plan.leadOrganization.id,
        name: plan.leadOrganization.name,
        code: plan.leadOrganization.code || 'CHỦ TRÌ',
        color: 'rose',
        isLead: true,
      });
    }
    const colorPalette = ['blue', 'emerald', 'purple', 'amber', 'indigo'];
    let idx = 0;
    (plan?.organizations || []).forEach((po) => {
      if (po.organization && po.organizationId !== plan?.leadOrganizationId && po.status === 'active') {
        list.push({
          id: po.organization.id,
          name: po.organization.name,
          code: po.organization.code || 'PHỐI HỢP',
          color: colorPalette[idx % colorPalette.length],
          isLead: false,
        });
        idx++;
      }
    });
    return list;
  }, [plan]);

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
      category: CATEGORY_OPTIONS[0],
      phase: PHASE_OPTIONS[0],
      deliverable: '',
      dueDate: '',
      dueTime: '',
      assignedTo: null,
      externalAssignee: '',
      externalOrganization: '',
      externalContact: '',
      organizationId: null,
      collabActivityId: collabActivityId || (activities[0]?.id ?? null),
    },
  });

  // Khởi tạo form khi mở dialog
  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      if (editingTask) {
        const validStatus = editingTask.status === 'in_progress' ? 'in_progress' : 'todo';
        const isExternal = Boolean(editingTask.externalAssignee || editingTask.externalOrganization);
        setAssigneeType(isExternal ? 'external' : 'internal');
        setSelectedOrgId(editingTask.organizationId || null);

        reset({
          title: editingTask.title,
          description: editingTask.description || '',
          status: validStatus,
          priority: editingTask.priority || 'medium',
          category: editingTask.category || CATEGORY_OPTIONS[0],
          phase: editingTask.phase || PHASE_OPTIONS[0],
          deliverable: editingTask.deliverable || '',
          dueDate: editingTask.dueDate ? editingTask.dueDate.split('T')[0] : '',
          dueTime: editingTask.dueTime || '',
          assignedTo: editingTask.assignedTo || null,
          externalAssignee: editingTask.externalAssignee || '',
          externalOrganization: editingTask.externalOrganization || '',
          externalContact: editingTask.externalContact || '',
          organizationId: editingTask.organizationId || null,
          collabActivityId: editingTask.collabActivityId || collabActivityId || null,
        });
      } else {
        const defaultLeadOrgId = plan?.leadOrganizationId || participatingOrgs[0]?.id || null;
        setSelectedOrgId(defaultLeadOrgId);
        setAssigneeType('internal');
        reset({
          title: '',
          description: '',
          status: 'todo',
          priority: 'medium',
          category: CATEGORY_OPTIONS[0],
          phase: PHASE_OPTIONS[0],
          deliverable: '',
          dueDate: '',
          dueTime: '',
          assignedTo: null,
          externalAssignee: '',
          externalOrganization: '',
          externalContact: '',
          organizationId: defaultLeadOrgId,
          collabActivityId: collabActivityId || (activities[0]?.id ?? null),
        });
      }
    }
  }, [isOpen, editingTask, collabActivityId, reset, plan, participatingOrgs]);

  // Tự động gán hoạt động đầu tiên khi activities tải xong
  useEffect(() => {
    if (isOpen && !collabActivityId && activities.length > 0) {
      const currentAct = watch('collabActivityId');
      if (!currentAct) {
        setValue('collabActivityId', activities[0].id);
      }
    }
  }, [isOpen, activities, collabActivityId, setValue, watch]);

  // Xử lý chọn đơn vị nhanh qua badge
  const handleSelectOrgBadge = (orgId: string) => {
    setSelectedOrgId(orgId);
    setAssigneeType('internal');
    setValue('organizationId', orgId);
    setValue('externalOrganization', '');
    setValue('externalAssignee', '');
    setValue('externalContact', '');
  };

  const handleSelectExternalMode = () => {
    setAssigneeType('external');
    setSelectedOrgId(null);
    setValue('organizationId', null);
    setValue('assignedTo', null);
  };

  // Lọc nhân sự theo đơn vị được chọn
  const filteredPersonnel = useMemo(() => {
    if (!selectedOrgId) return personnel;
    const matched = personnel.filter((p) => p.organizationId === selectedOrgId);
    return matched.length > 0 ? matched : personnel;
  }, [personnel, selectedOrgId]);

  const hasNoActivities = !collabActivityId && activities.length === 0;

  const onSubmit = async (data: CollabTaskFormData) => {
    try {
      setSubmitError(null);
      const targetActivityId =
        collabActivityId || data.collabActivityId || (activities.length > 0 ? activities[0]?.id : null);

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
        category: data.category?.trim() || null,
        phase: data.phase?.trim() || null,
        deliverable: data.deliverable?.trim() || null,
        due_date: data.dueDate || null,
        due_time: data.dueTime?.trim() || null,
        assigned_to: assigneeType === 'internal' ? (data.assignedTo || null) : null,
        external_assignee: assigneeType === 'external' ? (data.externalAssignee?.trim() || null) : null,
        external_organization: assigneeType === 'external' ? (data.externalOrganization?.trim() || null) : null,
        external_contact: assigneeType === 'external' ? (data.externalContact?.trim() || null) : null,
        organization_id: assigneeType === 'internal' ? (data.organizationId || selectedOrgId || null) : null,
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
      <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[92vh] overflow-y-auto bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-5 sm:p-7 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Header tối giản */}
        <DialogHeader className="space-y-1 text-left pb-2 border-b border-slate-100">
          <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
            {editingTask ? 'Chỉnh sửa nhiệm vụ' : 'Giao việc mới'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Phân công theo mảng phụ trách và đơn vị tham gia chiến dịch.
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800 my-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{submitError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2 text-left">
          {/* Cảnh báo nếu chưa có hoạt động nào */}
          {hasNoActivities && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-semibold text-amber-950">Chưa có hoạt động phối hợp nào</div>
                <div className="text-amber-800 leading-relaxed text-[11px]">
                  Mỗi nhiệm vụ phải gắn liền với một hoạt động trong Kế hoạch. Vui lòng tạo hoạt động trong tab <strong>"Hoạt động"</strong> trước khi giao việc.
                </div>
              </div>
            </div>
          )}

          {/* Chọn Hoạt động (chỉ hiện khi chưa chỉ định từ trước) */}
          {!collabActivityId && activities.length > 0 && (
            <div className="space-y-1">
              <label htmlFor="collab-task-act" className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-purple-600" />
                Hoạt động phối hợp <span className="text-rose-500">*</span>
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

          {/* Tiêu đề công việc */}
          <div className="space-y-1">
            <label htmlFor="collab-task-title" className="block text-xs font-semibold text-slate-700">
              Nội dung công việc <span className="text-rose-500">*</span>
            </label>
            <Input
              id="collab-task-title"
              {...register('title')}
              placeholder="VD: Poster chương trình, Đặt đồ ăn TNV, Kịch bản MC..."
              className="h-10 text-sm font-medium bg-slate-50/50 focus:bg-white border-slate-200 focus:border-purple-400"
            />
            {errors.title && (
              <p className="text-[11px] text-rose-500">{errors.title.message}</p>
            )}
          </div>

          {/* 1-Click Badges: Đơn vị phụ trách */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="block text-xs font-semibold text-slate-700">
                Đơn vị phụ trách
              </span>
              <span className="text-[11px] text-slate-400">
                {assigneeType === 'internal' ? 'Đơn vị trong chiến dịch' : 'Đối tác ngoài'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {participatingOrgs.map((org) => {
                const isSelected = selectedOrgId === org.id && assigneeType === 'internal';
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleSelectOrgBadge(org.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold transition-all border inline-flex items-center gap-1.5 cursor-pointer shadow-2xs",
                      isSelected
                        ? org.color === 'rose'
                          ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-200'
                          : org.color === 'blue'
                          ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200'
                          : org.color === 'emerald'
                          ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-200'
                          : 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-200'
                        : org.color === 'rose'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        : org.color === 'blue'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        : org.color === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                    <span>{org.code}</span>
                    <span className="text-[10px] opacity-75 font-normal max-w-[120px] truncate hidden sm:inline">
                      {org.name}
                    </span>
                  </button>
                );
              })}

              {/* Nút Đối tác ngoài */}
              <button
                type="button"
                onClick={handleSelectExternalMode}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-all border inline-flex items-center gap-1.5 cursor-pointer shadow-2xs",
                  assigneeType === 'external'
                    ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                )}
              >
                <Plus className="w-3 h-3" />
                <span>Đối tác ngoài</span>
                <span className="text-[10px] opacity-75 font-normal hidden sm:inline">
                  (Xã Đoàn, Trường bạn...)
                </span>
              </button>
            </div>
          </div>

          {/* Chi tiết người & đơn vị phụ trách */}
          {assigneeType === 'external' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 animate-in fade-in-50 duration-150">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-amber-900">
                  Tên Đơn vị ngoài <span className="text-rose-500">*</span>
                </label>
                <Input
                  {...register('externalOrganization')}
                  placeholder="VD: Xã Đoàn An Bình, THPT Hùng Vương..."
                  className="h-8 text-xs bg-white border-amber-200 focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-amber-900">
                  Người phụ trách (Họ tên)
                </label>
                <Input
                  {...register('externalAssignee')}
                  placeholder="VD: Anh Tuấn, Chị Hoa..."
                  className="h-8 text-xs bg-white border-amber-200 focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-[11px] font-semibold text-amber-900">
                  Số điện thoại / Zalo liên hệ (Tùy chọn)
                </label>
                <Input
                  {...register('externalContact')}
                  placeholder="VD: 0912.345.678"
                  className="h-8 text-xs bg-white border-amber-200 focus:border-amber-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Người phụ trách cụ thể
              </label>
              <Controller
                name="assignedTo"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(val) => {
                      field.onChange(val === 'none' ? null : val);
                      if (val !== 'none') {
                        const person = personnel.find((p) => p.userId === val);
                        if (person?.organizationId) {
                          setValue('organizationId', person.organizationId);
                          setSelectedOrgId(person.organizationId);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs bg-slate-50/50">
                      <SelectValue placeholder="Đơn vị tự phân công (hoặc chọn cá nhân cụ thể)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 max-h-56">
                      <SelectItem value="none" className="text-xs text-slate-500 italic">
                        -- Đơn vị tự phụ trách (Chưa chỉ định người cụ thể) --
                      </SelectItem>
                      {filteredPersonnel.map((p) => (
                        <SelectItem key={p.userId} value={p.userId} className="text-xs">
                          {p.fullName} ({p.organizationCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Mảng công việc & Giai đoạn (2 cột ngang gọn gàng) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Mảng công việc
              </label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || CATEGORY_OPTIONS[0]}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="h-9 text-xs bg-slate-50/50">
                      <SelectValue placeholder="Chọn mảng công việc" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {CATEGORY_OPTIONS.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Giai đoạn
              </label>
              <Controller
                name="phase"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || PHASE_OPTIONS[0]}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="h-9 text-xs bg-slate-50/50">
                      <SelectValue placeholder="Chọn giai đoạn" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {PHASE_OPTIONS.map((ph) => (
                        <SelectItem key={ph} value={ph} className="text-xs">
                          {ph}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Sản phẩm bàn giao (Cột H trên Google Sheet) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="collab-task-deliverable" className="block text-xs font-semibold text-slate-700">
                Sản phẩm bàn giao / Đầu ra
              </label>
              <span className="text-[10px] text-slate-400">Kết quả cụ thể cần nộp</span>
            </div>
            <Input
              id="collab-task-deliverable"
              {...register('deliverable')}
              placeholder="VD: Poster in ấn & file gốc, 50 suất cơm & nước, Kịch bản Word, Đồ Bowling..."
              className="h-9 text-xs bg-slate-50/50 focus:bg-white"
            />
          </div>

          {/* Hạn chót & Mức độ ưu tiên */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Hạn chót
              </label>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value || ''}
                    onChange={field.onChange}
                    className="h-9 text-xs"
                  />
                )}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Khung giờ (Tùy chọn)
              </label>
              <Input
                {...register('dueTime')}
                placeholder="VD: 07:30 - 08:30"
                className="h-9 text-xs bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Mức ưu tiên
              </label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 text-xs bg-slate-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="low" className="text-xs">Thấp</SelectItem>
                      <SelectItem value="medium" className="text-xs">Trung bình</SelectItem>
                      <SelectItem value="high" className="text-xs">Cao</SelectItem>
                      <SelectItem value="urgent" className="text-xs text-rose-600 font-semibold">Khẩn cấp</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Ghi chú chi tiết */}
          <div className="space-y-1">
            <label htmlFor="collab-task-desc" className="block text-xs font-semibold text-slate-700">
              Ghi chú thêm (Tùy chọn)
            </label>
            <Textarea
              id="collab-task-desc"
              {...register('description')}
              rows={2}
              placeholder="Ghi rõ lưu ý địa điểm, yêu cầu vận chuyển hoặc lưu ý người tham gia..."
              className="text-xs bg-slate-50/50 focus:bg-white resize-none"
            />
          </div>

          {/* Footer nút bấm */}
          <DialogFooter className="pt-2 gap-2 border-t border-slate-100">
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
