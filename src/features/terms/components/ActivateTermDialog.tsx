import { useState } from 'react';
import { Sparkles, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Term } from '@/types';

interface ActivateTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term: Term | null;
  currentActiveTerm: Term | null;
  onConfirm: (termId: string) => Promise<void>;
  isLoading?: boolean;
}

export function ActivateTermDialog({
  open,
  onOpenChange,
  term,
  currentActiveTerm,
  onConfirm,
  isLoading = false,
}: ActivateTermDialogProps) {
  const [error, setError] = useState<string | null>(null);

  if (!term) return null;

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm(term.id);
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e?.message || 'Có lỗi xảy ra khi kích hoạt nhiệm kỳ.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Kích hoạt Nhiệm kỳ hoạt động
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Xác nhận đặt làm nhiệm kỳ hiện tại của Chi hội
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <div className="space-y-3 py-2 text-sm text-slate-600">
          <p>
            Bạn đang chuẩn bị kích hoạt nhiệm kỳ:
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="font-semibold text-slate-800">{term.name}</p>
            <p className="text-xs text-slate-500 mt-1">
              Thời gian: {term.startDate} → {term.endDate}
            </p>
          </div>

          {currentActiveTerm && currentActiveTerm.id !== term.id && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                Lưu ý chuyển giao nhiệm kỳ:
              </p>
              <p>
                Nhiệm kỳ hiện tại (<strong>{currentActiveTerm.name}</strong>) sẽ tự động chuyển trạng thái không còn là nhiệm kỳ hiện hành. Dữ liệu hội viên và hoạt động của nhiệm kỳ cũ vẫn được bảo toàn nguyên vẹn.
              </p>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Sau khi kích hoạt, toàn bộ các hoạt động, báo cáo và phân loại mặc định trong Chi hội sẽ tự động liên kết với nhiệm kỳ này.
          </p>
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
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Xác nhận kích hoạt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
