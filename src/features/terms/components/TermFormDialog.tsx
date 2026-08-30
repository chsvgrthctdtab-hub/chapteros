import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarRange, AlertCircle, Loader2 } from 'lucide-react';
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
import { termFormSchema, type TermFormData } from '../schemas/term.schema';
import { TERM_STATUS_OPTIONS } from '../types/term.types';
import type { Term } from '@/types';

interface TermFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TermFormData) => Promise<void>;
  initialData?: Term | null;
  isLoading?: boolean;
}

export function TermFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: TermFormDialogProps) {
  const isEditing = Boolean(initialData);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<TermFormData>({
    resolver: zodResolver(termFormSchema),
    defaultValues: {
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      status: 'draft',
    },
  });

  useEffect(() => {
    if (open) {
      setFormError(null);
      if (initialData) {
        reset({
          name: initialData.name,
          startDate: initialData.startDate,
          endDate: initialData.endDate,
          status: initialData.status,
        });
      } else {
        const today = new Date();
        const currentYear = today.getFullYear();
        reset({
          name: `Nhiệm kỳ ${currentYear} - ${currentYear + 1}`,
          startDate: today.toISOString().split('T')[0],
          endDate: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0],
          status: 'draft',
        });
      }
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: TermFormData) => {
    setFormError(null);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error?.message || 'Có lỗi xảy ra khi lưu thông tin nhiệm kỳ.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {isEditing ? 'Chỉnh sửa nhiệm kỳ' : 'Tạo nhiệm kỳ mới'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {isEditing
                  ? 'Cập nhật thông tin mốc thời gian và trạng thái nhiệm kỳ'
                  : 'Thiết lập thông tin nhiệm kỳ hoạt động mới cho Đơn vị'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{formError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên nhiệm kỳ <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('name')}
              placeholder="ví dụ: Nhiệm kỳ 2026 - 2028"
              className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-[11px] text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày bắt đầu <span className="text-red-500">*</span>
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
                <p className="text-[11px] text-red-600 mt-1">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày kết thúc <span className="text-red-500">*</span>
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
                <p className="text-[11px] text-red-600 mt-1">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trạng thái <span className="text-red-500">*</span>
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    disabled={isLoading}
                    value={field.value || 'draft'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full h-9 text-sm bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TERM_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">Lưu ý:</p>
            <p>• Khi tạo nhiệm kỳ, hệ thống <strong>chỉ tạo bản ghi trong bảng nhiệm kỳ</strong> với trạng thái ban đầu là Bản nháp.</p>
            <p>• Việc kích hoạt nhiệm kỳ hiện hành được thực hiện riêng bằng nút <strong>Kích hoạt</strong>.</p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Lưu thay đổi' : 'Tạo nhiệm kỳ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
