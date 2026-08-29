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
  Building2,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useCreatePlan } from '../queries/plan.queries';
import { getOrgTypeLabel, getOrgTypeBadgeClass } from '@/lib/organization.utils';
import type { Organization } from '@/types';

const planFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Tên chiến dịch phải có ít nhất 3 ký tự')
    .max(200, 'Tên chiến dịch không vượt quá 200 ký tự'),
  code: z
    .string()
    .trim()
    .min(2, 'Mã code chiến dịch phải có ít nhất 2 ký tự')
    .max(50, 'Mã code không vượt quá 50 ký tự')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Mã code chỉ gồm chữ cái không dấu, số, gạch nối (-) hoặc gạch dưới (_)'),
  description: z.string().trim().max(2000, 'Mô tả không quá 2000 ký tự').optional().or(z.literal('')),
  leadOrganizationId: z.string().min(1, 'Vui lòng chọn đơn vị chủ trì'),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  status: z.enum(['draft', 'planning', 'active', 'completed', 'cancelled']).default('active'),
}).refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime();
  },
  {
    message: 'Ngày kết thúc không được trước ngày bắt đầu',
    path: ['endDate'],
  }
);

type PlanFormData = z.infer<typeof planFormSchema>;

interface CreatePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableOrganizations: Organization[];
  defaultLeadOrgId?: string;
  onSuccess?: (newPlanId: string) => void;
}

export function CreatePlanDialog({
  isOpen,
  onClose,
  availableOrganizations,
  defaultLeadOrgId,
  onSuccess,
}: CreatePlanDialogProps) {
  const { user } = useAuth();
  const toast = useToast();
  const createPlanMutation = useCreatePlan();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema) as never,
    defaultValues: {
      name: '',
      code: '',
      description: '',
      leadOrganizationId: defaultLeadOrgId || (availableOrganizations[0]?.id || ''),
      startDate: '',
      endDate: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      reset({
        name: '',
        code: `PLAN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        description: '',
        leadOrganizationId: defaultLeadOrgId || (availableOrganizations[0]?.id || ''),
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'active',
      });
    }
  }, [isOpen, defaultLeadOrgId, availableOrganizations, reset]);

  const onSubmit = async (data: PlanFormData) => {
    try {
      setSubmitError(null);

      const newPlan = await createPlanMutation.mutateAsync({
        payload: {
          name: data.name.trim(),
          code: data.code.trim().toUpperCase(),
          description: data.description?.trim() || null,
          lead_organization_id: data.leadOrganizationId,
          start_date: data.startDate || null,
          end_date: data.endDate || null,
          status: data.status,
          created_by: user?.id || null,
        },
      });

      toast.success(`Đã tạo chiến dịch "${data.name.trim()}" thành công!`);
      reset();
      onClose();
      if (onSuccess && newPlan?.id) {
        onSuccess(newPlan.id);
      }
    } catch (err: unknown) {
      console.error('Lỗi tạo kế hoạch:', err);
      const msg = (err as Error)?.message || 'Không thể tạo chiến dịch. Vui lòng thử lại sau.';
      setSubmitError(msg);
      toast.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent id="create-plan-dialog" className="sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto bg-white border border-slate-200/80 shadow-2xl rounded-3xl p-6 sm:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader className="space-y-1 text-left pb-1">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs mb-0.5">
              <FolderKanban className="h-4 w-4" />
              <span>Chương trình Collab & Phối hợp</span>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900">
              Tạo Chương Trình Collab Mới
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Thiết lập chiến dịch phối hợp hoạt động liên đơn vị hoặc chương trình quy mô lớn.
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
              <label htmlFor="plan-name" className="block text-xs font-semibold text-slate-700">
                Tên chiến dịch / Kế hoạch <span className="text-rose-500">*</span>
              </label>
              <Input
                id="plan-name"
                {...register('name')}
                placeholder="Ví dụ: Chiến dịch Xuân Tình Nguyện 2025, Tháng Thanh Niên..."
                className="h-9 bg-slate-50/50 border-slate-200 text-xs"
              />
              {errors.name && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Code and Lead Organization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="plan-code" className="block text-xs font-semibold text-slate-700">
                  Mã Code định danh <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="plan-code"
                  {...register('code')}
                  placeholder="XTN-2025"
                  className="h-9 bg-slate-50/50 border-slate-200 text-xs font-mono uppercase"
                />
                {errors.code && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="plan-lead-org" className="block text-xs font-semibold text-slate-700">
                  Đơn vị chủ trì <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="leadOrganizationId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="plan-lead-org" className="h-10 bg-slate-50/50 border-slate-200 text-xs rounded-xl">
                        <SelectValue placeholder="Chọn đơn vị chủ trì" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 max-h-60 rounded-xl shadow-xl">
                        {availableOrganizations.map((org) => (
                          <SelectItem key={org.id} value={org.id} className="text-xs py-2 cursor-pointer">
                            <span className="font-mono font-bold text-slate-900 mr-1.5">[{org.code}]</span>
                            <span className="text-slate-700">{org.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.leadOrganizationId && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.leadOrganizationId.message}</p>
                )}
              </div>
            </div>

            {/* Dates & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
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
                    />
                  )}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Ngày kết thúc
                </label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn ngày kết thúc"
                    />
                  )}
                />
                {errors.endDate && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.endDate.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="plan-status" className="block text-xs font-semibold text-slate-700">
                  Trạng thái khởi tạo
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'active'}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="plan-status" className="h-10 rounded-xl bg-slate-50/50 border-slate-200 text-xs px-3.5">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-xl">
                        <SelectItem value="planning" className="text-xs">Đang lập kế hoạch</SelectItem>
                        <SelectItem value="active" className="text-xs">Đang triển khai</SelectItem>
                        <SelectItem value="draft" className="text-xs">Bản nháp</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label htmlFor="plan-description" className="block text-xs font-semibold text-slate-700">
                Mô tả mục tiêu chiến dịch
              </label>
              <textarea
                id="plan-description"
                {...register('description')}
                rows={3}
                placeholder="Mô tả mục đích, ý nghĩa, các chỉ tiêu chính của chiến dịch liên đơn vị này..."
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              {errors.description && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.description.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
              disabled={createPlanMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              id="btn-submit-create-plan"
              type="submit"
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs"
              disabled={createPlanMutation.isPending}
            >
              {createPlanMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Tạo Chiến Dịch
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
