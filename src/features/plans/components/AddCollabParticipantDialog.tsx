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
import {
  UserPlus,
  Building2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAddCollabParticipant, useCollabPlanPersonnel } from '../queries/collab.queries';

const ROLE_PRESETS = [
  'Tình nguyện viên',
  'Đội Y tế & Sức khỏe',
  'Đội Hậu cần & Đời sống',
  'Đội Truyền thông & Báo chí',
  'Đội Văn nghệ & Sân khấu',
  'Đội An ninh & Trật tự',
  'Đội Khảo sát & Tiền trạm',
];

const participantSchema = z.object({
  mode: z.enum(['existing_member', 'manual'] as const),
  memberId: z.string().optional().nullable(),
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
  studentId: z.string().optional(),
  className: z.string().optional(),
  cohort: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  isExternal: z.boolean().default(false),
  organizationId: z.string().optional().nullable(),
  externalOrganization: z.string().optional().nullable(),
  collabActivityId: z.string().optional().nullable(),
  roleTitle: z.string().optional().nullable(),
  attendanceStatus: z.enum(['unmarked', 'present', 'absent'] as const),
  notes: z.string().optional(),
});

type ParticipantFormData = z.infer<typeof participantSchema>;

interface AddCollabParticipantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  activityId?: string;
  activities?: { id: string; title: string }[];
  defaultOrganizationId?: string;
  participatingOrganizations?: { id: string; name: string; code: string }[];
  onSuccess?: () => void;
}

export function AddCollabParticipantDialog({
  isOpen,
  onClose,
  planId,
  activityId: propActivityId,
  activities = [],
  defaultOrganizationId,
  participatingOrganizations = [],
  onSuccess,
}: AddCollabParticipantDialogProps) {
  const addMutation = useAddCollabParticipant(propActivityId, planId);
  const { data: personnel = [] } = useCollabPlanPersonnel(planId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultOrg = defaultOrganizationId || participatingOrganizations[0]?.id || '';

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
      isExternal: false,
      organizationId: defaultOrg,
      externalOrganization: '',
      collabActivityId: propActivityId || 'all',
      roleTitle: 'Tình nguyện viên',
      attendanceStatus: 'unmarked',
      notes: '',
    },
  });

  const mode = watch('mode');
  const isExternal = watch('isExternal');
  const selectedOrgId = watch('organizationId');
  const selectedRole = watch('roleTitle');

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
        isExternal: false,
        organizationId: defaultOrganizationId || participatingOrganizations[0]?.id || '',
        externalOrganization: '',
        collabActivityId: propActivityId || 'all',
        roleTitle: 'Tình nguyện viên',
        attendanceStatus: 'unmarked',
        notes: '',
      });
    }
  }, [isOpen, defaultOrganizationId, participatingOrganizations, propActivityId, reset]);

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
      setValue('isExternal', false);
      setValue('externalOrganization', '');
      if (mem.position) {
        setValue('roleTitle', mem.position);
      }
    }
  };

  const onSubmit = async (data: ParticipantFormData) => {
    try {
      setSubmitError(null);

      const targetActivityId =
        data.collabActivityId && data.collabActivityId !== 'all'
          ? data.collabActivityId
          : propActivityId || undefined;

      await addMutation.mutateAsync({
        planId,
        activityId: targetActivityId,
        organizationId: data.isExternal ? null : data.organizationId || null,
        externalOrganization: data.isExternal ? data.externalOrganization?.trim() || 'Ngoài trường' : null,
        memberId: data.memberId || undefined,
        fullName: data.fullName.trim(),
        studentId: data.studentId?.trim() || null,
        className: data.className?.trim() || null,
        cohort: data.cohort?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        roleTitle: data.roleTitle?.trim() || 'Tình nguyện viên',
        attendanceStatus: data.attendanceStatus,
        notes: data.notes?.trim() || null,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to add collab participant:', err);
      setSubmitError(err?.message || 'Không thể thêm người tham gia. Vui lòng thử lại.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl w-full bg-white rounded-2xl p-6 pr-10 shadow-sm border border-hairline max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-hairline">
          <DialogTitle className="text-base font-bold text-ink-navy flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#e6f0ff] text-signal-blue flex items-center justify-center">
              <UserPlus className="h-4 w-4" />
            </div>
            <span>Thêm Người Tham Gia / Tình Nguyện Viên</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-gray">
            Ghi nhận thành viên vào danh sách lực lượng chiến dịch hoặc phân công hoạt động cụ thể.
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-pebble p-1 border border-hairline">
            <button
              type="button"
              onClick={() => setValue('mode', 'existing_member')}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all',
                mode === 'existing_member'
                  ? 'bg-white text-ink-navy shadow-sm font-bold'
                  : 'text-slate-gray hover:text-ink-navy'
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
                'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all',
                mode === 'manual'
                  ? 'bg-white text-ink-navy shadow-sm font-bold'
                  : 'text-slate-gray hover:text-ink-navy'
              )}
            >
              Nhập sinh viên / Tự do
            </button>
          </div>

          {/* Quick Picker from Unit Directory */}
          {mode === 'existing_member' && (
            <div className="space-y-1.5 p-3.5 bg-pebble/50 rounded-xl border border-hairline">
              <label className="block text-xs font-semibold text-ink-navy flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-signal-blue" />
                Chọn nhanh từ nhân sự BCH / Thành viên các đơn vị
              </label>
              <Select onValueChange={handleSelectMember}>
                <SelectTrigger className="h-9.5 text-xs bg-white border-hairline rounded-lg text-ink-navy">
                  <SelectValue placeholder="-- Chọn từ danh bạ các đơn vị --" />
                </SelectTrigger>
                <SelectContent className="bg-white border-hairline rounded-xl shadow-sm max-h-56">
                  {personnel.map((p) => {
                    const studentInfo = [p.studentId, p.className, p.cohort ? `K${p.cohort}` : null]
                      .filter(Boolean)
                      .join(' • ');
                    return (
                      <SelectItem
                        key={`${p.userId}-${p.organizationId}`}
                        value={p.userId}
                        className="text-xs text-ink-navy"
                      >
                        <div className="flex items-center justify-between w-full gap-2 min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-semibold text-ink-navy">{p.fullName}</span>
                            {studentInfo && (
                              <span className="text-[10px] text-slate-gray tabular-nums">({studentInfo})</span>
                            )}
                          </div>
                          <span className="text-[10px] bg-pebble text-ink-navy border border-hairline px-2 py-0.5 rounded-full font-medium shrink-0">
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

          {/* 1-Click Organization Badges */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-navy">
              Đơn vị trực thuộc / Phụ trách *
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {participatingOrganizations.map((org) => {
                const isSelected = !isExternal && selectedOrgId === org.id;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      setValue('isExternal', false);
                      setValue('organizationId', org.id);
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-semibold transition-all border inline-flex items-center gap-1.5 cursor-pointer',
                      isSelected
                        ? 'bg-signal-blue text-white border-signal-blue shadow-sm'
                        : 'bg-white text-ink-navy border-hairline hover:bg-pebble'
                    )}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{org.code}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setValue('isExternal', true);
                  setValue('organizationId', null);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-all border inline-flex items-center gap-1.5 cursor-pointer',
                  isExternal
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-ink-navy border-hairline hover:bg-pebble'
                )}
              >
                <span>+ Đối tác / Đơn vị ngoài</span>
              </button>
            </div>

            {/* If External Unit */}
            {isExternal && (
              <div className="pt-1">
                <Input
                  {...register('externalOrganization')}
                  placeholder="Tên đơn vị ngoài (vd: Xã Đoàn Mỹ Thuận, CLB Mầm Xanh...)"
                  className="h-9.5 text-xs bg-white border-hairline rounded-lg text-ink-navy placeholder:text-mist-gray focus:border-signal-blue"
                />
              </div>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-ink-navy">Họ và tên *</label>
            <Input
              {...register('fullName')}
              placeholder="Nguyễn Văn A"
              className="h-9.5 text-xs bg-white border-hairline rounded-lg text-ink-navy placeholder:text-mist-gray focus:border-signal-blue"
            />
            {errors.fullName && (
              <p className="text-[11px] text-rose-500">{errors.fullName.message}</p>
            )}
          </div>

          {/* Student ID, Class, Cohort (3 columns) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-navy">MSSV</label>
              <Input
                {...register('studentId')}
                placeholder="B2100000"
                className="h-9.5 text-xs bg-white border-hairline rounded-lg text-ink-navy placeholder:text-mist-gray focus:border-signal-blue tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-navy">Lớp</label>
              <Input
                {...register('className')}
                placeholder="DI21V7A1"
                className="h-9.5 text-xs bg-white border-hairline rounded-lg text-ink-navy placeholder:text-mist-gray focus:border-signal-blue"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-navy">Khóa</label>
              <Input
                {...register('cohort')}
                placeholder="47"
                className="h-9.5 text-xs bg-white border-hairline rounded-lg text-ink-navy placeholder:text-mist-gray focus:border-signal-blue tabular-nums"
              />
            </div>
          </div>

          {/* Role / Squad Presets */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-navy">
              Đội hình / Vai trò tham gia
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ROLE_PRESETS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setValue('roleTitle', role)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border cursor-pointer',
                    selectedRole === role
                      ? 'bg-signal-blue text-white border-signal-blue shadow-sm'
                      : 'bg-white text-slate-gray border-hairline hover:text-ink-navy hover:bg-pebble'
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
            <Input
              {...register('roleTitle')}
              placeholder="Hoặc nhập vai trò / đội hình khác..."
              className="h-9.5 text-xs bg-white border-hairline rounded-lg text-ink-navy placeholder:text-mist-gray focus:border-signal-blue mt-1"
            />
          </div>

          {/* Contact (Phone & Email) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-navy">Số điện thoại</label>
              <Input
                {...register('phone')}
                placeholder="0912345678"
                className="h-9.5 text-xs bg-white border-hairline rounded-lg text-ink-navy placeholder:text-mist-gray focus:border-signal-blue tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-navy">Email</label>
              <Input
                {...register('email')}
                placeholder="sinhvien@ctu.edu.vn"
                className="h-9.5 text-xs bg-white border-hairline rounded-lg text-ink-navy placeholder:text-mist-gray focus:border-signal-blue"
              />
            </div>
          </div>

          {/* Activity Assignment (If opened at Plan level with activities available) */}
          {activities.length > 0 && !propActivityId && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-navy">
                Phân bổ vào hoạt động
              </label>
              <Controller
                name="collabActivityId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || 'all'} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9.5 text-xs bg-white border-hairline rounded-lg text-ink-navy">
                      <SelectValue placeholder="Chọn hoạt động phân công" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-hairline rounded-xl shadow-sm">
                      <SelectItem value="all" className="text-xs font-medium">
                        Toàn chiến dịch (Lực lượng chung)
                      </SelectItem>
                      {activities.map((act) => (
                        <SelectItem key={act.id} value={act.id} className="text-xs">
                          {act.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Attendance Initial Status */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-ink-navy">
              Trạng thái điểm danh ban đầu
            </label>
            <Controller
              name="attendanceStatus"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9.5 text-xs bg-white border-hairline rounded-lg text-ink-navy">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-hairline rounded-xl shadow-sm">
                    <SelectItem value="unmarked" className="text-xs">
                      Chưa điểm danh
                    </SelectItem>
                    <SelectItem value="present" className="text-xs text-emerald-700 font-semibold">
                      Có mặt
                    </SelectItem>
                    <SelectItem value="absent" className="text-xs text-rose-700 font-semibold">
                      Vắng
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-ink-navy">Ghi chú (Tùy chọn)</label>
            <Input
              {...register('notes')}
              placeholder="Vd: Xe số 1, nhóm hỗ trợ buổi sáng..."
              className="h-9.5 text-xs bg-white border-hairline rounded-lg text-ink-navy placeholder:text-mist-gray focus:border-signal-blue"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-hairline flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-lg border-hairline text-ink-navy hover:bg-pebble"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={addMutation.isPending}
              className="text-xs h-9 px-4 rounded-lg bg-signal-blue hover:bg-[#005be0] text-white font-semibold gap-1.5 shadow-sm"
            >
              {addMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Lưu người tham gia</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
