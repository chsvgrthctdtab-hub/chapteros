import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, AlertCircle, Loader2 } from 'lucide-react';
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { memberFormSchema, type MemberFormData } from '../schemas/member.schema';
import { MEMBER_STATUSES, COMMON_POSITIONS, COMMON_DEPARTMENTS } from '../types/member.types';
import type { Member, Term } from '@/types';

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MemberFormData) => Promise<void>;
  initialData?: Member | null;
  terms?: Term[];
  isLoading?: boolean;
}

export function MemberFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  terms = [],
  isLoading = false,
}: MemberFormDialogProps) {
  const isEditing = Boolean(initialData);
  const [formError, setFormError] = useState<string | null>(null);

  const activeTerm = terms.find((t) => t.isCurrent) || terms[0];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      fullName: '',
      studentId: '',
      email: '',
      phone: '',
      className: '',
      major: '',
      cohort: '',
      position: 'Hội viên',
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
      notes: '',
      assignToTermId: activeTerm?.id || '',
      termPosition: 'Hội viên',
      termDepartment: '',
    },
  });

  useEffect(() => {
    if (open) {
      setFormError(null);
      if (initialData) {
        reset({
          fullName: initialData.fullName || '',
          studentId: initialData.studentId || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          className: initialData.className || '',
          major: initialData.major || '',
          cohort: initialData.cohort || '',
          position: initialData.position || 'Hội viên',
          status: initialData.status || 'active',
          joinedDate: initialData.joinedDate || '',
          notes: initialData.notes || '',
          assignToTermId: null,
          termPosition: null,
          termDepartment: null,
        });
      } else {
        reset({
          fullName: '',
          studentId: '',
          email: '',
          phone: '',
          className: '',
          major: '',
          cohort: '',
          position: 'Hội viên',
          status: 'active',
          joinedDate: new Date().toISOString().split('T')[0],
          notes: '',
          assignToTermId: activeTerm?.id || '',
          termPosition: 'Hội viên',
          termDepartment: '',
        });
      }
    }
  }, [open, initialData, reset, activeTerm]);

  const handleFormSubmit = async (data: MemberFormData) => {
    setFormError(null);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error?.message || 'Có lỗi xảy ra khi lưu thông tin');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto bg-white border border-slate-200/80 shadow-2xl rounded-3xl p-6 sm:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="pb-1">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900">
                {isEditing ? 'Chỉnh sửa hồ sơ hội viên' : 'Thêm hội viên mới'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {isEditing
                  ? 'Cập nhật thông tin lý lịch và trạng thái hội viên trong Đơn vị.'
                  : 'Tạo hồ sơ hội viên mới và liên kết dữ liệu vào Đơn vị.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2 text-rose-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
          {/* Thông tin cơ bản */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Thông tin cá nhân & sinh viên
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Họ tên */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <Input
                  {...register('fullName')}
                  className={`h-10 rounded-xl bg-slate-50/50 border-slate-200 text-xs ${errors.fullName ? 'border-rose-300' : ''}`}
                />
                {errors.fullName && (
                  <p className="text-[11px] text-rose-500 font-medium">{errors.fullName.message}</p>
                )}
              </div>

              {/* MSSV */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Mã số sinh viên (MSSV) <span className="text-rose-500">*</span>
                </label>
                <Input
                  {...register('studentId')}
                  className={`h-10 rounded-xl bg-slate-50/50 border-slate-200 text-xs font-mono ${errors.studentId ? 'border-rose-300' : ''}`}
                />
                {errors.studentId && (
                  <p className="text-[11px] text-rose-500 font-medium">{errors.studentId.message}</p>
                )}
              </div>

              {/* Lớp */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Lớp sinh hoạt / Chi đoàn</label>
                <Input
                  {...register('className')}
                  className="h-10 rounded-xl bg-slate-50/50 border-slate-200 text-xs"
                />
                {errors.className && (
                  <p className="text-[11px] text-rose-500 font-medium">{errors.className.message}</p>
                )}
              </div>

              {/* Khóa (Đã sửa từ Khóa sinh viên -> Khóa) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Khóa</label>
                <Input
                  {...register('cohort')}
                  className="h-10 rounded-xl bg-slate-50/50 border-slate-200 text-xs"
                />
              </div>

              {/* Ngành học */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Chuyên ngành đào tạo</label>
                <Input
                  {...register('major')}
                  className="h-10 rounded-xl bg-slate-50/50 border-slate-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Thông tin liên hệ */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Liên hệ & Tổ chức
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Email liên lạc</label>
                <Input
                  type="email"
                  {...register('email')}
                  className={`h-10 rounded-xl bg-slate-50/50 border-slate-200 text-xs ${errors.email ? 'border-rose-300' : ''}`}
                />
                {errors.email && (
                  <p className="text-[11px] text-rose-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Số điện thoại</label>
                <Input
                  {...register('phone')}
                  className="h-10 rounded-xl bg-slate-50/50 border-slate-200 text-xs font-mono"
                />
              </div>

              {/* Chức vụ trong Đơn vị (Bo tròn & Select chuẩn không bị lỗi tooltip) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Chức vụ trong Đơn vị</label>
                <Controller
                  name="position"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'Hội viên'}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hội viên">Hội viên</SelectItem>
                        <SelectItem value="Chi hội trưởng">Chi hội trưởng</SelectItem>
                        <SelectItem value="Chi hội phó">Chi hội phó</SelectItem>
                        <SelectItem value="Ủy viên Ban Chấp Hành">Ủy viên Ban Chấp Hành</SelectItem>
                        <SelectItem value="Ủy viên Ban Thường Vụ">Ủy viên Ban Thường Vụ</SelectItem>
                        <SelectItem value="Chủ nhiệm CLB / Đội">Chủ nhiệm CLB / Đội</SelectItem>
                        <SelectItem value="Phó Chủ nhiệm CLB / Đội">Phó Chủ nhiệm CLB / Đội</SelectItem>
                        <SelectItem value="Cán sự lớp / Bí thư Chi đoàn">Cán sự lớp / Bí thư Chi đoàn</SelectItem>
                        <SelectItem value="Cộng tác viên">Cộng tác viên</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Trạng thái hồ sơ (Bo tròn) */}
              {isEditing && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Trạng thái hồ sơ</label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || 'active'}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(MEMBER_STATUSES).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

              {/* Ngày tham gia */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Ngày gia nhập Đơn vị</label>
                <Controller
                  name="joinedDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn ngày gia nhập"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Phân công nhiệm kỳ khởi tạo (Chỉ hiển thị khi Thêm mới) */}
          {!isEditing && terms.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">
                  Phân công vào nhiệm kỳ khởi tạo (tùy chọn)
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">Tự động liên kết vào danh sách nhiệm kỳ</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 block">Nhiệm kỳ</label>
                  <Controller
                    name="assignToTermId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || 'none'}
                        onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                      >
                        <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 bg-white text-xs">
                          <SelectValue placeholder="-- Không gán ngay --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Không gán ngay --</SelectItem>
                          {terms.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name} {t.isCurrent ? '(Hiện tại)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 block">Chức vụ nhiệm kỳ</label>
                  <Controller
                    name="termPosition"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || 'Hội viên'}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 bg-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hội viên">Hội viên</SelectItem>
                          <SelectItem value="Chi hội trưởng">Chi hội trưởng</SelectItem>
                          <SelectItem value="Chi hội phó">Chi hội phó</SelectItem>
                          <SelectItem value="Ủy viên Ban Chấp Hành">Ủy viên Ban Chấp Hành</SelectItem>
                          <SelectItem value="Ủy viên Ban Thường Vụ">Ủy viên Ban Thường Vụ</SelectItem>
                          <SelectItem value="Cộng tác viên">Cộng tác viên</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 block">Ban / Bộ phận phụ trách</label>
                  <Controller
                    name="termDepartment"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || 'none'}
                        onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                      >
                        <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 bg-white text-xs">
                          <SelectValue placeholder="-- Không phân ban --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Không phân ban --</SelectItem>
                          {COMMON_DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Ghi chú */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-700 block">Ghi chú bổ sung</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-xl text-xs h-10 px-5"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl text-xs h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Đang lưu...
                </>
              ) : isEditing ? (
                'Cập nhật hồ sơ'
              ) : (
                'Tạo hồ sơ hội viên'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
