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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, User, Building2, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAddCollabParticipant, useCollabPlanPersonnel } from '../queries/collab.queries';
import { getOrgTypeLabel, getOrgTypeBadgeClass } from '@/lib/organization.utils';
import type { CollabMemberOption } from '@/types';

const participantSchema = z.object({
  mode: z.enum(['existing_member', 'manual'] as const),
  memberId: z.string().optional().nullable(),
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
  studentId: z.string().optional(),
  className: z.string().optional(),
  cohort: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  organizationId: z.string().min(1, 'Vui lòng chọn đơn vị'),
  attendanceStatus: z.enum(['unmarked', 'present', 'absent'] as const),
  notes: z.string().optional(),
});

type ParticipantFormData = z.infer<typeof participantSchema>;

interface AddCollabParticipantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  planId?: string;
  defaultOrganizationId?: string;
  participatingOrganizations?: { id: string; name: string; code: string }[];
  onSuccess?: () => void;
}

export function AddCollabParticipantDialog({
  isOpen,
  onClose,
  activityId,
  planId,
  defaultOrganizationId,
  participatingOrganizations = [],
  onSuccess,
}: AddCollabParticipantDialogProps) {
  const addMutation = useAddCollabParticipant(activityId, planId);
  const { data: personnel = [] } = useCollabPlanPersonnel(planId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<ParticipantFormData>({
    resolver: zodResolver(participantSchema) as never,
    defaultValues: {
      mode: 'existing_member',
      memberId: null,
      fullName: '',
      studentId: '',
      className: '',
      cohort: '',
      phone: '',
      email: '',
      organizationId: defaultOrganizationId || participatingOrganizations[0]?.id || '',
      attendanceStatus: 'unmarked',
      notes: '',
    },
  });

  const mode = watch('mode');

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      reset({
        mode: 'existing_member',
        memberId: null,
        fullName: '',
        studentId: '',
        className: '',
        cohort: '',
        phone: '',
        email: '',
        organizationId: defaultOrganizationId || participatingOrganizations[0]?.id || '',
        attendanceStatus: 'unmarked',
        notes: '',
      });
    }
  }, [isOpen, defaultOrganizationId, participatingOrganizations, reset]);

  const handleSelectMember = (memberId: string) => {
    if (!memberId || memberId === 'none') {
      setValue('memberId', null);
      return;
    }
    const mem = personnel.find((p) => p.userId === memberId || p.profileId === memberId);
    if (mem) {
      setValue('memberId', mem.userId);
      setValue('fullName', mem.fullName);
      setValue('studentId', mem.studentId || '');
      setValue('className', mem.className || '');
      setValue('cohort', mem.cohort || '');
      setValue('phone', mem.phone || '');
      setValue('email', mem.email || '');
      setValue('organizationId', mem.organizationId);
    }
  };

  const onSubmit = async (data: ParticipantFormData) => {
    try {
      setSubmitError(null);
      await addMutation.mutateAsync({
        activityId,
        organizationId: data.organizationId,
        memberId: data.memberId || undefined,
        fullName: data.fullName,
        studentId: data.studentId,
        className: data.className,
        cohort: data.cohort,
        phone: data.phone,
        email: data.email,
        attendanceStatus: data.attendanceStatus,
        notes: data.notes,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || 'Không thể thêm người tham gia');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-slate-100">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-purple-600" />
            <span>Thêm Người Tham Gia / Tình Nguyện Viên</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Ghi danh cá nhân hoặc chọn nhanh từ danh bạ đơn vị tham gia chiến dịch.
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setValue('mode', 'existing_member')}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                mode === 'existing_member'
                  ? 'bg-white text-purple-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Chọn từ Danh bạ đơn vị ({personnel.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('mode', 'manual');
                setValue('memberId', null);
              }}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                mode === 'manual'
                  ? 'bg-white text-purple-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Nhập sinh viên / Tự do
            </button>
          </div>

          {/* If existing member mode: Fast Member Picker */}
          {mode === 'existing_member' && (
            <div className="space-y-1.5 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <label className="block text-xs font-semibold text-purple-900 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                Chọn thành viên
              </label>
              <Select onValueChange={handleSelectMember}>
                <SelectTrigger className="h-9 text-xs bg-white border-purple-200">
                  <SelectValue placeholder="-- Chọn từ danh bạ các đơn vị --" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 max-h-56">
                  {personnel.map((p) => {
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
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium shrink-0">
                            {p.organizationCode}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Họ và tên *</label>
            <Input
              {...register('fullName')}
              placeholder="Nguyễn Văn A"
              className="h-9 text-xs bg-slate-50/50 focus:bg-white"
            />
            {errors.fullName && (
              <p className="text-[11px] text-rose-500">{errors.fullName.message}</p>
            )}
          </div>

          {/* Student ID, Class, Cohort (3 columns) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">MSSV</label>
              <Input
                {...register('studentId')}
                placeholder="B2100000"
                className="h-9 text-xs bg-slate-50/50 focus:bg-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Lớp</label>
              <Input
                {...register('className')}
                placeholder="DI21"
                className="h-9 text-xs bg-slate-50/50 focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Khóa</label>
              <Input
                {...register('cohort')}
                placeholder="44"
                className="h-9 text-xs bg-slate-50/50 focus:bg-white font-mono"
              />
            </div>
          </div>

          {/* Organization Selector */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Đơn vị trực thuộc</label>
            <Controller
              name="organizationId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50/50">
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {participatingOrganizations.map((org) => (
                      <SelectItem key={org.id} value={org.id} className="text-xs">
                        {org.code} - {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Contact (Phone & Email) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Số điện thoại</label>
              <Input
                {...register('phone')}
                placeholder="0912345678"
                className="h-9 text-xs bg-slate-50/50 focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Email</label>
              <Input
                {...register('email')}
                placeholder="sinhvien@ctu.edu.vn"
                className="h-9 text-xs bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {/* Attendance Initial Status */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Trạng thái điểm danh ban đầu</label>
            <Controller
              name="attendanceStatus"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50/50">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="unmarked" className="text-xs">Chưa điểm danh</SelectItem>
                    <SelectItem value="present" className="text-xs text-emerald-700 font-semibold">Có mặt</SelectItem>
                    <SelectItem value="absent" className="text-xs text-rose-700 font-semibold">Vắng</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
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
              disabled={addMutation.isPending}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5"
            >
              {addMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Thêm người tham gia</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
