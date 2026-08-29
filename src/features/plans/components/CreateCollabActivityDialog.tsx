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
import { Sparkles, Calendar, MapPin, Building2, Loader2, AlertCircle, ImageIcon } from 'lucide-react';
import { useCreateCollabActivity } from '../queries/collab.queries';
import { useAuth } from '@/contexts/AuthContext';
import { formatError } from '@/lib/error-formatter';
import { getOrgTypeLabel, getOrgTypeBadgeClass } from '@/lib/organization.utils';
import type { Plan, ActivityCategory, ActivityStatus } from '@/types';

const collabActivitySchema = z.object({
  title: z.string().min(3, 'Tên hoạt động phải có ít nhất 3 ký tự'),
  code: z.string().min(2, 'Mã hoạt động không hợp lệ'),
  category: z.enum(['general', 'volunteer', 'academic', 'sports', 'culture', 'meeting', 'training'] as const),
  status: z.enum(['draft', 'planning', 'published', 'in_progress', 'completed', 'cancelled'] as const),
  leadOrganizationId: z.string().min(1, 'Vui lòng chọn đơn vị phụ trách chính'),
  startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
  endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
  location: z.string().optional(),
  description: z.string().optional(),
  bannerUrl: z.string().optional(),
});

type CollabActivityFormData = z.infer<typeof collabActivitySchema>;

interface CreateCollabActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
  onSuccess?: () => void;
}

export function CreateCollabActivityDialog({
  isOpen,
  onClose,
  plan,
  onSuccess,
}: CreateCollabActivityDialogProps) {
  const { user } = useAuth();
  const createMutation = useCreateCollabActivity();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Extract all participating organizations (Host + Co-hosts)
  const participatingOrganizations = [
    ...(plan?.leadOrganization
      ? [
          {
            id: plan.leadOrganization.id,
            name: plan.leadOrganization.name,
            code: plan.leadOrganization.code,
            type: plan.leadOrganization.type,
            roleTag: 'Đơn vị chủ trì',
            isHost: true,
          },
        ]
      : []),
    ...(plan?.organizations || [])
      .filter((po) => po.organizationId !== plan.leadOrganizationId && po.organization && po.status === 'active')
      .map((po) => ({
        id: po.organizationId,
        name: po.organization?.name || 'Đơn vị',
        code: po.organization?.code || 'ORG',
        type: po.organization?.type,
        roleTag: po.roleDescription || 'Đồng tổ chức',
        isHost: false,
      })),
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<CollabActivityFormData>({
    resolver: zodResolver(collabActivitySchema) as never,
    defaultValues: {
      title: '',
      code: '',
      category: 'volunteer',
      status: 'planning',
      leadOrganizationId: plan?.leadOrganizationId || '',
      startDate: plan?.startDate || new Date().toISOString().split('T')[0],
      endDate: plan?.endDate || '',
      location: '',
      description: '',
      bannerUrl: '',
    },
  });

  useEffect(() => {
    if (isOpen && plan) {
      setSubmitError(null);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      reset({
        title: '',
        code: `ACT-${plan.code || 'COL'}-${randomSuffix}`,
        category: 'volunteer',
        status: 'planning',
        leadOrganizationId: plan.leadOrganizationId,
        startDate: plan.startDate || new Date().toISOString().split('T')[0],
        endDate: plan.endDate || '',
        location: '',
        description: '',
        bannerUrl: '',
      });
    }
  }, [isOpen, plan, reset]);

  const onSubmit = async (data: CollabActivityFormData) => {
    try {
      setSubmitError(null);
      await createMutation.mutateAsync({
        payload: {
          plan_id: plan.id,
          title: data.title.trim(),
          code: data.code.trim().toUpperCase(),
          category: data.category,
          status: data.status,
          lead_organization_id: data.leadOrganizationId,
          organization_id: data.leadOrganizationId,
          start_date: data.startDate,
          end_date: data.endDate,
          location: data.location?.trim() || null,
          description: data.description?.trim() || null,
          banner_url: data.bannerUrl?.trim() || null,
          created_by: user?.id || null,
        },
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Error creating collab activity:', err);
      const formatted = formatError(err);
      setSubmitError(formatted.message || 'Không thể tạo hoạt động. Vui lòng kiểm tra quyền của đơn vị.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto bg-white border border-slate-200/80 shadow-2xl rounded-3xl p-6 sm:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="space-y-1 text-left pb-1">
          <div className="flex items-center gap-2 text-purple-600 font-semibold text-xs mb-0.5">
            <Sparkles className="h-4 w-4" />
            <span>Chiến dịch: {plan?.name}</span>
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Tạo Hoạt Động Phối Hợp Mới
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Tạo một hoạt động collab liên đơn vị, phân công đơn vị phụ trách chính và lộ trình thực hiện.
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{submitError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2 text-left">
          {/* Tên hoạt động & Mã code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="collab-act-title" className="block text-xs font-semibold text-slate-700">
                Tên hoạt động <span className="text-rose-500">*</span>
              </label>
              <Input
                id="collab-act-title"
                {...register('title')}
                placeholder="Ví dụ: Ngày hội Hiến máu Tình nguyện 2026..."
                className="h-9 text-xs bg-slate-50/50 focus:bg-white"
              />
              {errors.title && (
                <p className="text-[11px] text-rose-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="collab-act-code" className="block text-xs font-semibold text-slate-700">
                Mã hoạt động <span className="text-rose-500">*</span>
              </label>
              <Input
                id="collab-act-code"
                {...register('code')}
                placeholder="ACT-01..."
                className="h-9 text-xs font-mono uppercase bg-slate-50/50 focus:bg-white"
              />
              {errors.code && (
                <p className="text-[11px] text-rose-500">{errors.code.message}</p>
              )}
            </div>
          </div>

          {/* Phân loại & Trạng thái */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="collab-act-category" className="block text-xs font-semibold text-slate-700">
                Phân loại hoạt động
              </label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'volunteer'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="collab-act-category" className="h-9 text-xs bg-slate-50/50">
                      <SelectValue placeholder="Chọn phân loại" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="volunteer" className="text-xs">Tình nguyện vì cộng đồng</SelectItem>
                      <SelectItem value="academic" className="text-xs">Học thuật & Nghiên cứu</SelectItem>
                      <SelectItem value="sports" className="text-xs">Thể dục thể thao</SelectItem>
                      <SelectItem value="culture" className="text-xs">Văn hóa & Nghệ thuật</SelectItem>
                      <SelectItem value="meeting" className="text-xs">Họp & Hội thảo</SelectItem>
                      <SelectItem value="training" className="text-xs">Tập huấn kỹ năng</SelectItem>
                      <SelectItem value="general" className="text-xs">Hoạt động chung</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="collab-act-status" className="block text-xs font-semibold text-slate-700">
                Trạng thái ban đầu
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'planning'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="collab-act-status" className="h-9 text-xs bg-slate-50/50">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="planning" className="text-xs">Đang lập kế hoạch</SelectItem>
                      <SelectItem value="published" className="text-xs">Đã công bố</SelectItem>
                      <SelectItem value="in_progress" className="text-xs">Đang diễn ra</SelectItem>
                      <SelectItem value="completed" className="text-xs">Đã hoàn thành</SelectItem>
                      <SelectItem value="draft" className="text-xs">Bản nháp</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Đơn vị phụ trách chính */}
          <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100 space-y-1.5">
            <label htmlFor="collab-act-org" className="block text-xs font-semibold text-purple-900 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-purple-600" />
              Đơn vị phụ trách chính (Lead Unit) <span className="text-rose-500">*</span>
            </label>
            <Controller
              name="leadOrganizationId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="collab-act-org" className="h-9 text-xs bg-white border-purple-200">
                    <SelectValue placeholder="Chọn đơn vị phụ trách" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 max-h-60">
                    {participatingOrganizations.map((org) => {
                      const typeLabel = getOrgTypeLabel(org.type);
                      const typeBadgeClass = getOrgTypeBadgeClass(org.type);
                      return (
                        <SelectItem key={org.id} value={org.id} className="text-xs">
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${typeBadgeClass}`}>
                                {typeLabel}
                              </span>
                              <span className="font-medium text-slate-900 truncate">{org.name}</span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                              org.isHost ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {org.roleTag}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.leadOrganizationId && (
              <p className="text-[11px] text-rose-500">{errors.leadOrganizationId.message}</p>
            )}
          </div>

          {/* Ngày bắt đầu & Ngày kết thúc */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Ngày bắt đầu <span className="text-rose-500">*</span>
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
              {errors.startDate && (
                <p className="text-[11px] text-rose-500">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Ngày kết thúc <span className="text-rose-500">*</span>
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
                <p className="text-[11px] text-rose-500">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Địa điểm */}
          <div className="space-y-1.5">
            <label htmlFor="collab-act-location" className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              Địa điểm tổ chức
            </label>
            <Input
              id="collab-act-location"
              {...register('location')}
              placeholder="Ví dụ: Hội trường A, Nhà văn hóa sinh viên hoặc Online qua MS Teams..."
              className="h-9 text-xs bg-slate-50/50 focus:bg-white"
            />
          </div>

          {/* Banner URL */}
          <div className="space-y-1.5">
            <label htmlFor="collab-act-banner" className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
              Ảnh Banner hoạt động (URL)
            </label>
            <Input
              id="collab-act-banner"
              {...register('bannerUrl')}
              placeholder="https://images.unsplash.com/..."
              className="h-9 text-xs bg-slate-50/50 focus:bg-white"
            />
          </div>

          {/* Mô tả chi tiết */}
          <div className="space-y-1.5">
            <label htmlFor="collab-act-desc" className="block text-xs font-semibold text-slate-700">
              Mục tiêu & Kế hoạch chi tiết
            </label>
            <Textarea
              id="collab-act-desc"
              {...register('description')}
              rows={3}
              placeholder="Mô tả nội dung chương trình, các mốc thời gian và kế hoạch triển khai..."
              className="text-xs bg-slate-50/50 focus:bg-white resize-none"
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
              disabled={createMutation.isPending}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Đang tạo hoạt động...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Tạo Hoạt Động Collab
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
