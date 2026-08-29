import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  Calendar,
  MapPin,
  Sparkles,
  Loader2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { activityFormSchema, type ActivityFormData } from '@/features/activities/schemas/activity.schema';
import { ACTIVITY_CATEGORIES } from '@/features/activities/types/activity.types';
import { toDateTimeLocalString, fromDateTimeLocalString } from '@/lib/date';
import { activityRepository } from '@/repositories/activity.repository';
import { useAuth } from '@/contexts/AuthContext';
import type { Term, Member, Organization } from '@/types';

interface CreatePlanActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  terms: Term[];
  leadCandidates?: Member[];
  hostOrganizations: { organizationId: string; organization?: Organization; isHost: boolean }[];
  onSuccess: () => void;
}

export function CreatePlanActivityDialog({
  isOpen,
  onClose,
  planId,
  terms,
  leadCandidates = [],
  hostOrganizations = [],
  onSuccess,
}: CreatePlanActivityDialogProps) {
  const { user, activeOrganization } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentTerm = terms.find((t) => t.isCurrent) || terms[0];
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    activeOrganization?.id || hostOrganizations[0]?.organizationId || ''
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema) as never,
    defaultValues: {
      title: '',
      termId: currentTerm?.id || '',
      code: '',
      leadMemberId: '',
      category: 'volunteer',
      status: 'planning',
      location: '',
      startDate: '',
      endDate: '',
      targetMembers: 0,
      bannerUrl: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      setSelectedOrgId(activeOrganization?.id || hostOrganizations[0]?.organizationId || '');

      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const afterTwoHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

      reset({
        title: '',
        termId: currentTerm?.id || '',
        code: `ACT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        leadMemberId: '',
        category: 'volunteer',
        status: 'planning',
        location: '',
        startDate: toDateTimeLocalString(nextHour.toISOString()),
        endDate: toDateTimeLocalString(afterTwoHours.toISOString()),
        targetMembers: 50,
        bannerUrl: '',
        description: '',
      });
    }
  }, [isOpen, currentTerm, activeOrganization, hostOrganizations, reset]);

  const onSubmit = async (data: ActivityFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      if (!selectedOrgId) {
        throw new Error('Vui lòng chọn đơn vị phụ trách hoạt động');
      }

      await activityRepository.create({
        organization_id: selectedOrgId,
        term_id: data.termId,
        plan_id: planId,
        code: data.code?.trim() ? data.code.trim().toUpperCase() : null,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        category: data.category,
        status: data.status,
        location: data.location?.trim() || null,
        start_date: fromDateTimeLocalString(data.startDate) || new Date().toISOString(),
        end_date: fromDateTimeLocalString(data.endDate) || new Date().toISOString(),
        target_members: data.targetMembers || 0,
        banner_url: data.bannerUrl?.trim() || null,
        lead_member_id: data.leadMemberId?.trim() || null,
        created_by: user?.id || null,
      });

      onClose();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to create plan activity:', err);
      setSubmitError(err?.message || 'Không thể tạo hoạt động. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent id="create-plan-activity-dialog" className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader className="space-y-1 text-left">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs mb-0.5">
              <Calendar className="h-4 w-4" />
              <span>Kế hoạch / Chiến dịch</span>
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Thêm Hoạt Động Vào Kế Hoạch
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tạo sự kiện hoặc hoạt động thành phần trực thuộc chiến dịch này.
            </DialogDescription>
          </DialogHeader>

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{submitError}</div>
            </div>
          )}

          <div className="space-y-4">
            {/* Choose Responsible Organization */}
            <div className="space-y-1">
              <label htmlFor="activity-org" className="block text-xs font-semibold text-slate-700">
                Đơn vị phụ trách thực hiện <span className="text-rose-500">*</span>
              </label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger id="activity-org" className="h-9 bg-slate-50/50 border-slate-200 text-xs">
                  <SelectValue placeholder="Chọn đơn vị phụ trách" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {hostOrganizations.map((h) => (
                    <SelectItem key={h.organizationId} value={h.organizationId} className="text-xs">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-blue-600" />
                        <span className="font-medium text-slate-800">
                          {h.organization?.name || 'Đơn vị'}
                        </span>
                        {h.isHost && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded">
                            Chủ trì
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label htmlFor="activity-title" className="block text-xs font-semibold text-slate-700">
                Tên hoạt động <span className="text-rose-500">*</span>
              </label>
              <Input
                id="activity-title"
                {...register('title')}
                placeholder="Ví dụ: Ngày Chủ Nhật Xanh, Gian hàng gây quỹ..."
                className="h-9 bg-slate-50/50 border-slate-200 text-xs"
              />
              {errors.title && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.title.message}</p>
              )}
            </div>

            {/* Term & Code & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label htmlFor="activity-term" className="block text-xs font-semibold text-slate-700">
                  Nhiệm kỳ <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="termId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="activity-term" className="h-9 bg-slate-50/50 border-slate-200 text-xs">
                        <SelectValue placeholder="Chọn nhiệm kỳ" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
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
                  <p className="text-[11px] text-rose-600 font-medium">{errors.termId.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="activity-code" className="block text-xs font-semibold text-slate-700">
                  Mã hoạt động
                </label>
                <Input
                  id="activity-code"
                  {...register('code')}
                  placeholder="ACT-2025-01"
                  className="h-9 bg-slate-50/50 border-slate-200 text-xs font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="activity-cat" className="block text-xs font-semibold text-slate-700">
                  Phân loại <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'volunteer'}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="activity-cat" className="h-9 bg-slate-50/50 border-slate-200 text-xs">
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        {Object.entries(ACTIVITY_CATEGORIES).map(([key, cat]) => (
                          <SelectItem key={key} value={key} className="text-xs">
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Dates & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Thời gian bắt đầu <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      showTime
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn ngày và giờ bắt đầu"
                    />
                  )}
                />
                {errors.startDate && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Thời gian kết thúc <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      showTime
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn ngày và giờ kết thúc"
                    />
                  )}
                />
                {errors.endDate && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Location & Target */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="activity-location" className="block text-xs font-semibold text-slate-700">
                  Địa điểm tổ chức
                </label>
                <Input
                  id="activity-location"
                  {...register('location')}
                  placeholder="Hội trường A, Sân trường..."
                  className="h-9 bg-slate-50/50 border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="activity-target" className="block text-xs font-semibold text-slate-700">
                  Số lượng dự kiến
                </label>
                <Input
                  id="activity-target"
                  type="number"
                  {...register('targetMembers')}
                  placeholder="50"
                  className="h-9 bg-slate-50/50 border-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Lead Member */}
            <div className="space-y-1">
              <label htmlFor="activity-lead" className="block text-xs font-semibold text-slate-700">
                Trưởng ban tổ chức (Hội viên phụ trách)
              </label>
              <Controller
                name="leadMemberId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(val) => field.onChange(val === 'none' ? '' : val)}
                  >
                    <SelectTrigger id="activity-lead" className="h-9 bg-slate-50/50 border-slate-200 text-xs">
                      <SelectValue placeholder="Chọn người phụ trách" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 max-h-64">
                      <SelectItem value="none" className="text-xs text-slate-500">
                        -- Không chọn --
                      </SelectItem>
                      {leadCandidates.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">
                          <span className="font-medium text-slate-900">{m.fullName}</span>
                          {m.position ? (
                            <span className="text-slate-500 ml-1 font-normal">
                              - {m.position}
                            </span>
                          ) : m.email ? (
                            <span className="text-slate-400 ml-1 font-normal">
                              ({m.email})
                            </span>
                          ) : m.studentId ? (
                            <span className="text-slate-400 ml-1 font-normal">
                              ({m.studentId})
                            </span>
                          ) : null}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label htmlFor="activity-desc" className="block text-xs font-semibold text-slate-700">
                Nội dung chi tiết
              </label>
              <textarea
                id="activity-desc"
                {...register('description')}
                rows={3}
                placeholder="Kế hoạch, phân công công việc, timeline sự kiện..."
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              id="btn-submit-plan-activity"
              type="submit"
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Tạo Hoạt Động
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
