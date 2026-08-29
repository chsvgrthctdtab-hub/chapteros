import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, ShieldCheck, Unlink } from 'lucide-react';
import type { GoogleConnection } from '@/types';

interface DisconnectConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  connection: GoogleConnection | null;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function DisconnectConfirmDialog({
  isOpen,
  onClose,
  connection,
  onConfirm,
  isLoading,
}: DisconnectConfirmDialogProps) {
  if (!connection) return null;

  const isOrg = connection.connectionType === 'organization';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-700 border border-amber-200/60">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
                Xác nhận ngắt kết nối Google
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Tài khoản Google Workspace của Đơn vị • <span className="font-semibold text-slate-700">{connection.googleEmail}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-3 text-xs">
          <div className="rounded-2xl bg-amber-50/90 border border-amber-200/80 p-4 text-amber-950 space-y-2">
            <p className="font-semibold flex items-center gap-2 text-amber-900 text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              Lưu ý quan trọng về dữ liệu hệ thống:
            </p>
            <p className="text-amber-900 leading-relaxed text-xs">
              Ngắt kết nối Google <strong>KHÔNG</strong> xóa bất kỳ tài khoản hay dữ liệu nào của bạn trên ChapterOS.
            </p>
            <ul className="list-disc list-inside space-y-1 text-amber-800/90 text-xs pl-1">
              <li>Hồ sơ tài khoản, vai trò và phân quyền trong Đơn vị được giữ nguyên vẹn.</li>
              <li>Dữ liệu hoạt động, tài chính, công việc và hội viên hoàn toàn không bị ảnh hưởng.</li>
              <li>Chỉ tạm thời thu hồi quyền đồng bộ tự động với Google Drive, Sheets & Calendar.</li>
            </ul>
          </div>

          <p className="text-slate-500 text-xs leading-relaxed px-1">
            Bạn có thể kết nối lại bất cứ lúc nào qua trang Tích hợp này mà không bị mất dữ liệu.
          </p>
        </div>

        <DialogFooter className="flex gap-2.5 sm:justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs rounded-xl h-9 px-4 border-slate-200 hover:bg-slate-50"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="text-xs rounded-xl h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Unlink className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isLoading ? 'Đang ngắt kết nối...' : 'Xác nhận ngắt kết nối'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
