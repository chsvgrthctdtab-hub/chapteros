import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FolderKanban,
  Edit3,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useUpdatePlan } from '../queries/plan.queries';
import type { Plan, PlanStatus } from '@/types';

const editPlanFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Tên chương trình Collab phải có ít nhất 3 ký tự')
    .max(200, 'Tên không vượt quá 200 ký tự'),
  code: z
    .string()
    .trim()
    .min(2, 'Mã code phải có ít nhất 2 ký tự')
    .max(50, 'Mã code không vượt quá 50 ký tự'),
  description: z.string().trim().max(2000, 'Mô tả không quá 2000 ký tự').optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  status: z.enum(['planning', 'active', 'completed', 'cancelled', 'draft']),
});

type EditPlanFormData = z.infer<typeof editPlanFormSchema>;

interface EditPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onSuccess?: () => void;
}

export function EditPlanDialog({
  isOpen,
  onClose,
  plan,
  onSuccess,
}: EditPlanDialogProps) {
  const toast = useToast();
  const updatePlanMutation = useUpdatePlan();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditPlanFormData>({
    resolver: zodResolver(editPlanFormSchema),
  });

  useEffect(() => {
    if (isOpen && plan) {
      setSubmitError(null);
      reset({
        name: plan.name,
        code: plan.code,
        description: plan.description || '',
        startDate: plan.startDate ? plan.startDate.split('T')[0] : '',
        endDate: plan.endDate ? plan.endDate.split('T')[0] : '',
        status: plan.status || 'active',
      });
    }
  }, [isOpen, plan, reset]);

  const onSubmit = async (data: EditPlanFormData) => {
    if (!plan) return;
    try {
      setSubmitError(null);
      await updatePlanMutation.mutateAsync({
        id: plan.id,
        payload: {
          name: data.name.trim(),
          code: data.code.trim().toUpperCase(),
          description: data.description?.trim() || null,
          start_date: data.startDate || null,
          end_date: data.endDate || null,
          status: data.status,
          updated_at: new Date().toISOString(),
        },
      });

      toast.success('Đã cập nhật chương trình Collab thành công.');
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Lỗi cập nhật Collab:', err);
      const msg = (err as Error)?.message || 'Không thể cập nhật chương trình Collab. Vui lòng thử lại sau.';
      setSubmitError(msg);
      toast.error(err);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent id="edit-plan-dialog" className="sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto bg-white border border-hairline shadow-sm rounded-2xl p-6 sm:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader className="space-y-1 text-left pb-2 border-b border-hairline">
            <div className="flex items-center gap-2 text-signal-blue font-semibold text-xs mb-0.5">
              <Edit3 className="h-4 w-4" />
              <span>Chỉnh sửa chương trình Collab</span>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold text-ink-navy">
              Cập Nhật Thông Tin Collab
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-gray leading-relaxed">
              Thay đổi tên chương trình, tiến độ, thời gian diễn ra và thông tin phối hợp.
            </DialogDescription>
          </DialogHeader>

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{submitError}</div>
            </div>
          )}

          <div className="space-y-3.5">
            {/* Plan Name */}
            <div className="space-y-1">
              <label htmlFor="edit-plan-name" className="block text-xs font-semibold text-ink-navy">
                Tên chương trình Collab <span className="text-rose-500">*</span>
              </label>
              <Input
                id="edit-plan-name"
                {...register('name')}
                placeholder="Ví dụ: Chiến dịch Xuân Tình Nguyện 2026..."
                className="h-9.5 bg-white border-hairline text-xs rounded-lg text-ink-navy placeholder:text-mist-gray focus:border-signal-blue"
              />
              {errors.name && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Code & Status in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="edit-plan-code" className="block text-xs font-semibold text-ink-navy">
                  Mã code định danh <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="edit-plan-code"
                  {...register('code')}
                  className="h-9.5 font-mono text-xs uppercase bg-white border-hairline rounded-lg text-ink-navy tabular-nums focus:border-signal-blue"
                />
                {errors.code && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink-navy">
                  Trạng thái thực hiện <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'active'}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-9.5 bg-white border-hairline text-xs rounded-lg text-ink-navy">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-hairline shadow-sm">
                        <SelectItem value="planning" className="text-xs">Đang lập kế hoạch</SelectItem>
                        <SelectItem value="active" className="text-xs">Đang triển khai</SelectItem>
                        <SelectItem value="completed" className="text-xs">Đã hoàn thành</SelectItem>
                        <SelectItem value="draft" className="text-xs">Bản nháp</SelectItem>
                        <SelectItem value="cancelled" className="text-xs">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Dates in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink-navy">
                  Ngày bắt đầu
                </label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn ngày bắt đầu"
                      className="h-9.5 text-xs rounded-lg border-hairline"
                    />
                  )}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink-navy">
                  Ngày kết thúc dự kiến
                </label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn ngày kết thúc"
                      className="h-9.5 text-xs rounded-lg border-hairline"
                    />
                  )}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label htmlFor="edit-plan-desc" className="block text-xs font-semibold text-ink-navy">
                Mô tả chi tiết mục tiêu & nội dung
              </label>
              <textarea
                id="edit-plan-desc"
                {...register('description')}
                rows={3}
                placeholder="Mô tả mục tiêu, đối tượng hướng đến và đơn vị phối hợp..."
                className="w-full p-3 bg-white border border-hairline rounded-lg text-xs text-ink-navy placeholder:text-mist-gray focus:outline-none focus:border-signal-blue transition-all resize-none"
              />
              {errors.description && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.description.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-hairline">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || updatePlanMutation.isPending}
              className="rounded-lg text-xs h-9 px-4 border-hairline text-ink-navy hover:bg-pebble"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || updatePlanMutation.isPending}
              className="rounded-lg text-xs h-9 px-4 bg-signal-blue hover:bg-[#005be0] text-white font-semibold gap-1.5 shadow-sm cursor-pointer"
            >
              {isSubmitting || updatePlanMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu thay đổi</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
