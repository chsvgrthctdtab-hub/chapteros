import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, AlertCircle, Loader2, Search } from 'lucide-react';
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
import { termMemberAssignmentSchema, type TermMemberAssignmentFormData } from '../schemas/term.schema';
import {
  TERM_MEMBER_STATUS_OPTIONS,
  COMMON_TERM_POSITIONS,
  COMMON_TERM_DEPARTMENTS,
} from '../types/term.types';
import { useAvailableMembersForTerm } from '../queries/term.queries';
import type { TermMember } from '@/types';

interface AddTermMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TermMemberAssignmentFormData) => Promise<void>;
  termId: string;
  termName: string;
  organizationId: string;
  existingMemberIds?: string[];
  initialData?: TermMember | null;
  isLoading?: boolean;
}

export function AddTermMemberDialog({
  open,
  onOpenChange,
  onSubmit,
  termId,
  termName,
  organizationId,
  existingMemberIds: _existingMemberIds = [],
  initialData,
  isLoading = false,
}: AddTermMemberDialogProps) {
  const isEditing = Boolean(initialData);
  const [formError, setFormError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  // Fetch available members of this organization not yet assigned to the term
  const { data: availableList = [], isLoading: isLoadingMembers } = useAvailableMembersForTerm(
    termId,
    organizationId
  );

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return availableList;
    const q = memberSearch.toLowerCase().trim();
    return availableList.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        (m.studentId && m.studentId.toLowerCase().includes(q)) ||
        (m.className && m.className.toLowerCase().includes(q))
    );
  }, [availableList, memberSearch]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<TermMemberAssignmentFormData>({
    resolver: zodResolver(termMemberAssignmentSchema),
    defaultValues: {
      memberId: '',
      position: 'Hội viên',
      department: '',
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const selectedMemberId = watch('memberId');
  const currentPosition = watch('position');
  const currentDepartment = watch('department');

  useEffect(() => {
    if (open) {
      setFormError(null);
      setMemberSearch('');
      if (initialData) {
        reset({
          memberId: initialData.memberId,
          position: initialData.position || 'Hội viên',
          department: initialData.department || '',
          status: initialData.status || 'active',
          joinedDate: initialData.joinedDate || new Date().toISOString().split('T')[0],
          notes: initialData.notes || '',
        });
      } else {
        reset({
          memberId: '',
          position: 'Hội viên',
          department: '',
          status: 'active',
          joinedDate: new Date().toISOString().split('T')[0],
          notes: '',
        });
      }
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: TermMemberAssignmentFormData) => {
    setFormError(null);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error?.message || 'Có lỗi xảy ra khi phân công hội viên');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto bg-white border border-hairline shadow-sm rounded-2xl p-6 pr-10 sm:p-8 sm:pr-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="pb-1">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-[#e6f0ff] text-signal-blue flex items-center justify-center border border-[#d4e4fa] shrink-0">
              <UserPlus strokeWidth={1.5} className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-ink-navy">
                {isEditing ? 'Cập nhật phân công nhiệm kỳ' : 'Thêm hội viên vào nhiệm kỳ'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-gray">
                Nhiệm kỳ: <span className="font-semibold text-ink-navy">{termName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">{formError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-1">
          {/* Member Selection (only selectable on Add mode) */}
          {!isEditing ? (
            <div>
              <label className="block text-xs font-semibold text-ink-navy mb-1">
                Chọn hội viên <span className="text-rose-500">*</span>
              </label>

              {/* Quick filter box */}
              <div className="relative mb-2">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-mist-gray" />
                <Input
                  placeholder="Lọc nhanh theo tên hoặc MSSV..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-cloud border-hairline text-ink-navy placeholder:text-mist-gray focus:border-signal-blue"
                />
              </div>

              <Select
                disabled={isLoading || isLoadingMembers || filteredMembers.length === 0}
                value={watch('memberId') || ''}
                onValueChange={(val) => setValue('memberId', val, { shouldValidate: true })}
              >
                <SelectTrigger className={`w-full h-10 rounded-xl ${errors.memberId ? 'border-rose-500' : 'border-hairline'} bg-cloud text-xs text-ink-navy`}>
                  <SelectValue
                    placeholder={
                      isLoadingMembers
                        ? 'Đang tải danh sách hội viên...'
                        : filteredMembers.length === 0
                        ? '-- Không còn hội viên nào khả dụng --'
                        : '-- Chọn hội viên trong Đơn vị --'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-white border-hairline shadow-sm">
                  {filteredMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.fullName} {m.studentId ? `(${m.studentId})` : ''} {m.className ? `- ${m.className}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filteredMembers.length === 0 && !isLoadingMembers && (
                <p className="text-[11px] text-slate-gray mt-1">
                  Tất cả hội viên của Đơn vị đã được thêm vào nhiệm kỳ này hoặc chưa có hồ sơ hội viên.
                </p>
              )}
              {errors.memberId && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.memberId.message}</p>
              )}
            </div>
          ) : (
            <div className="p-3.5 bg-cloud border border-hairline rounded-xl text-xs">
              <span className="text-slate-gray font-medium">Hội viên: </span>
              <span className="font-bold text-ink-navy">{initialData?.member?.fullName}</span>
              {initialData?.member?.studentId && (
                <span className="text-slate-gray font-mono ml-1">({initialData.member.studentId})</span>
              )}
            </div>
          )}

          {/* Position */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-navy">
              Chức vụ trong nhiệm kỳ <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register('position')}
              className={`h-10 rounded-xl bg-cloud border-hairline text-xs text-ink-navy ${errors.position ? 'border-rose-500' : ''}`}
              disabled={isLoading}
            />
            {/* Quick Position Pills */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {COMMON_TERM_POSITIONS.slice(0, 5).map((pos) => (
                <button
                  type="button"
                  key={pos}
                  onClick={() => setValue('position', pos, { shouldValidate: true })}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    currentPosition === pos
                      ? 'bg-signal-blue text-white border-signal-blue font-semibold shadow-xs'
                      : 'bg-cloud text-slate-gray border-hairline hover:bg-pebble'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
            {errors.position && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.position.message}</p>
            )}
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-navy">
              Ban / Bộ phận phân công (tùy chọn)
            </label>
            <Input
              {...register('department')}
              className="h-10 rounded-xl bg-cloud border-hairline text-xs text-ink-navy"
              disabled={isLoading}
            />
            {/* Quick Department Pills */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {COMMON_TERM_DEPARTMENTS.slice(0, 5).map((dept) => (
                <button
                  type="button"
                  key={dept}
                  onClick={() => setValue('department', dept, { shouldValidate: true })}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    currentDepartment === dept
                      ? 'bg-signal-blue text-white border-signal-blue font-semibold shadow-xs'
                      : 'bg-cloud text-slate-gray border-hairline hover:bg-pebble'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-navy">
                Trạng thái sinh hoạt <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    disabled={isLoading}
                    value={field.value || 'active'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full h-10 rounded-xl border-hairline bg-cloud text-xs text-ink-navy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-hairline shadow-sm">
                      {TERM_MEMBER_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Joined date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-navy">
                Ngày bắt đầu tham gia
              </label>
              <Controller
                name="joinedDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Chọn ngày tham gia"
                    disabled={isLoading}
                  />
                )}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-navy">
              Ghi chú thêm (tùy chọn)
            </label>
            <Input
              {...register('notes')}
              className="h-10 rounded-xl bg-cloud border-hairline text-xs text-ink-navy placeholder:text-mist-gray"
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="pt-3 gap-2 border-t border-hairline">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-9 px-4 rounded-lg border-hairline text-ink-navy hover:bg-pebble text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (!isEditing && !selectedMemberId)}
              className="h-9 px-4 rounded-lg bg-signal-blue hover:bg-[#005be0] text-white font-semibold shadow-sm text-xs"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Cập nhật phân công' : 'Thêm vào nhiệm kỳ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
