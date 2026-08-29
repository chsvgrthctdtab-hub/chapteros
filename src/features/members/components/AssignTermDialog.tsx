import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, AlertCircle, Loader2 } from 'lucide-react';
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
import { termMemberFormSchema, type TermMemberFormData } from '../schemas/member.schema';
import { TERM_MEMBER_STATUSES, COMMON_POSITIONS, COMMON_DEPARTMENTS } from '../types/member.types';
import type { Member, Term } from '@/types';
import type { MemberTermHistoryItem } from '../types/member.types';

interface AssignTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TermMemberFormData) => Promise<void>;
  member: Member | null;
  terms: Term[];
  initialData?: MemberTermHistoryItem | null;
  isLoading?: boolean;
}

export function AssignTermDialog({
  open,
  onOpenChange,
  onSubmit,
  member,
  terms = [],
  initialData,
  isLoading = false,
}: AssignTermDialogProps) {
  const isEditing = Boolean(initialData);
  const [formError, setFormError] = useState<string | null>(null);

  const activeTerm = terms.find((t) => t.isCurrent) || terms[0];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<TermMemberFormData>({
    resolver: zodResolver(termMemberFormSchema),
    defaultValues: {
      termId: activeTerm?.id || '',
      position: 'Hội viên',
      department: '',
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      setFormError(null);
      if (initialData) {
        reset({
          termId: initialData.termId,
          position: initialData.position || 'Hội viên',
          department: initialData.department || '',
          status: initialData.status || 'active',
          joinedDate: initialData.joinedDate || '',
          notes: initialData.notes || '',
        });
      } else {
        reset({
          termId: activeTerm?.id || '',
          position: 'Hội viên',
          department: '',
          status: 'active',
          joinedDate: new Date().toISOString().split('T')[0],
          notes: '',
        });
      }
    }
  }, [open, initialData, reset, activeTerm]);

  const handleFormSubmit = async (data: TermMemberFormData) => {
    setFormError(null);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error?.message || 'Có lỗi xảy ra khi lưu phân công nhiệm kỳ');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>
                {isEditing ? 'Cập nhật phân công nhiệm kỳ' : 'Gán hội viên vào nhiệm kỳ'}
              </DialogTitle>
              <DialogDescription>
                {member ? (
                  <span>
                    Hội viên: <strong className="text-slate-800 font-semibold">{member.fullName}</strong> {member.studentId ? `(${member.studentId})` : ''}
                  </span>
                ) : (
                  'Chọn nhiệm kỳ và chức vụ phụ trách cho hội viên.'
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3.5 pt-1">
          {/* Nhiệm kỳ */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Nhiệm kỳ Chi hội <span className="text-rose-500">*</span>
            </label>
            <Controller
              name="termId"
              control={control}
              render={({ field }) => (
                <Select
                  disabled={isEditing}
                  value={field.value || ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full h-9 text-sm bg-white border-slate-200">
                    <SelectValue placeholder="-- Chọn nhiệm kỳ --" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} {t.isCurrent ? '(Hiện tại)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.termId && (
              <p className="text-[11px] text-rose-500">{errors.termId.message}</p>
            )}
          </div>

          {/* Chức vụ */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Chức vụ trong nhiệm kỳ <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register('position')}
              placeholder="Ví dụ: Hội viên, Chi hội phó..."
              list="term-positions-select"
            />
            <datalist id="term-positions-select">
              {COMMON_POSITIONS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            {errors.position && (
              <p className="text-[11px] text-rose-500">{errors.position.message}</p>
            )}
          </div>

          {/* Ban / Bộ phận */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Ban / Bộ phận chuyên trách</label>
            <Input
              {...register('department')}
              placeholder="Ví dụ: Ban Phong trào, Ban Truyền thông..."
              list="term-dept-select"
            />
            <datalist id="term-dept-select">
              {COMMON_DEPARTMENTS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          {/* Trạng thái trong nhiệm kỳ */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Trạng thái trong nhiệm kỳ</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || 'active'}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full h-9 text-sm bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TERM_MEMBER_STATUSES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Ngày bắt đầu */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Ngày bắt đầu tham gia nhiệm kỳ</label>
            <Controller
              name="joinedDate"
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

          {/* Ghi chú */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Ghi chú nhiệm kỳ</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Ghi chú phân công, lý do miễn nhiệm nếu có..."
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Đang lưu...
                </>
              ) : isEditing ? (
                'Cập nhật'
              ) : (
                'Gán nhiệm kỳ'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
