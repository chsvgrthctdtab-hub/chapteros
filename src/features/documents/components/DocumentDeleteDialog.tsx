import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import { useDeleteDocument } from '../mutations/document.mutations';
import { formatFileSize } from '../utils/document.utils';
import { DocumentFileIcon } from './DocumentFileIcon';
import type { DocumentItem } from '../types/document.types';

interface DocumentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentItem | null;
  organizationId: string;
  onSuccess?: () => void;
}

export function DocumentDeleteDialog({
  open,
  onOpenChange,
  document,
  organizationId,
  onSuccess,
}: DocumentDeleteDialogProps) {
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteMutation = useDeleteDocument();
  const toast = useToast();

  if (!document) return null;

  const isDriveDoc = document.sourceType === 'google_drive';

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      if (document.driveFileId && !document.driveFileId.startsWith('gfile-')) {
        try {
          const localToken = localStorage.getItem('chapteros_google_access_token');
          await fetch('/api/drive/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(localToken ? { 'x-google-access-token': localToken } : {}),
            },
            body: JSON.stringify({
              driveFileId: document.driveFileId,
              organizationId,
              googleAccessToken: localToken,
            }),
          });
        } catch (cloudDelErr) {
          console.warn('Google Drive cloud file delete notice:', cloudDelErr);
        }
      }

      await deleteMutation.mutateAsync({
        documentId: document.id,
        organizationId,
        storagePath: document.filePath,
        activityId: document.activityId,
        taskId: document.taskId,
      });

      toast.success(
        isDriveDoc ? 'Đã xóa tài liệu khỏi Google Drive và hệ thống.' : 'Đã xóa tài liệu thành công.'
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err);
      setDeleteError((err as Error)?.message || 'Không thể thực hiện thao tác. Vui lòng thử lại.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 bg-rose-50 text-rose-600 border-rose-100">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Xác nhận xóa tài liệu?
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Hành động này sẽ xóa vĩnh viễn tệp tin khỏi hệ thống và Google Drive của bạn.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Target Document preview */}
        <div className="flex items-center gap-3.5 p-4 bg-slate-50 border border-slate-200/90 rounded-2xl my-2">
          <div className="shrink-0">
            <DocumentFileIcon
              filename={isDriveDoc ? (document.driveUrl || document.title) : document.filePath}
              mimeType={document.mimeType}
              size="md"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-xs font-bold text-slate-900 leading-snug break-all">{document.title}</p>
            <p className="text-[11px] text-slate-500 font-mono break-all line-clamp-1">
              {isDriveDoc
                ? (document.driveUrl || 'Liên kết Google Drive')
                : `${document.filePath.split('/').pop()} • ${formatFileSize(document.fileSize)}`}
            </p>
          </div>
        </div>

        {deleteError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {deleteError}
          </div>
        )}

        <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
            className="rounded-xl text-xs h-9 px-4 cursor-pointer"
          >
            Hủy bỏ
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="rounded-xl text-xs h-9 px-4 font-semibold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa tài liệu</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
