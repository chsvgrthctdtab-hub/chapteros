import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useDeletePlan } from '../queries/plan.queries';
import type { Plan } from '@/types';

interface DeletePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onSuccess?: () => void;
}

export function DeletePlanDialog({
  isOpen,
  onClose,
  plan,
  onSuccess,
}: DeletePlanDialogProps) {
  const toast = useToast();
  const deletePlanMutation = useDeletePlan();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!plan) return null;

  const handleDelete = async () => {
    try {
      setDeleteError(null);
      await deletePlanMutation.mutateAsync({ id: plan.id });
      toast.success('Đã xóa chương trình Collab thành công.');
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Lỗi xóa Collab:', err);
      const msg = (err as Error)?.message || 'Không thể xóa chương trình Collab. Vui lòng thử lại sau.';
      setDeleteError(msg);
      toast.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !deletePlanMutation.isPending && !open && onClose()}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100/80 text-rose-700 border border-rose-200/60">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Xác nhận xóa chương trình Collab?
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Mã định danh: <span className="font-mono font-semibold text-slate-700">{plan.code}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-3 text-xs">
          {/* Target Plan Preview */}
          <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-1">
            <p className="text-xs font-bold text-slate-900 leading-snug">{plan.name}</p>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              {plan.description || 'Chưa có mô tả chi tiết cho chương trình này.'}
            </p>
          </div>

          <div className="rounded-2xl bg-rose-50/80 border border-rose-200/80 p-4 text-rose-950 space-y-1.5">
            <p className="font-semibold text-rose-900 text-xs">
              Lưu ý quan trọng khi xóa chương trình:
            </p>
            <p className="text-rose-800 leading-relaxed text-xs">
              Hành động này sẽ <strong>xóa toàn bộ</strong> thông tin phối hợp, danh sách ban tổ chức và dữ liệu liên quan của chương trình Collab này khỏi hệ thống.
            </p>
          </div>

          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {deleteError}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deletePlanMutation.isPending}
            className="rounded-xl text-xs h-9"
          >
            Hủy bỏ
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deletePlanMutation.isPending}
            className="rounded-xl text-xs font-semibold h-9 bg-rose-600 hover:bg-rose-700 text-white gap-1.5 cursor-pointer shadow-xs"
          >
            {deletePlanMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa chương trình Collab</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
