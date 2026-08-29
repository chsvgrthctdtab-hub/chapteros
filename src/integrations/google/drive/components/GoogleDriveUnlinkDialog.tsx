import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Link2Off, ShieldAlert, Loader2, ExternalLink } from 'lucide-react';
import type { DocumentItem } from '@/features/documents/types/document.types';

interface GoogleDriveUnlinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onConfirmUnlink: () => Promise<void>;
  isLoading: boolean;
}

export function GoogleDriveUnlinkDialog({
  isOpen,
  onClose,
  document,
  onConfirmUnlink,
  isLoading,
}: GoogleDriveUnlinkDialogProps) {
  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Link2Off className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Gỡ liên kết tài liệu Google Drive
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Xác nhận hủy liên kết với hồ sơ trong hệ thống Chi hội
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-800 line-clamp-1">{document.title}</div>
            {document.driveUrl && (
              <a
                href={document.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-mono truncate"
              >
                <span className="truncate">{document.driveUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            )}
          </div>

          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 flex items-start gap-2.5 text-blue-900 leading-relaxed text-[11px]">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Chính sách Unlink-only an toàn:</strong> Thao tác này chỉ hủy liên kết tài liệu
              khỏi ChapterOS. <strong>Tệp gốc trên Google Drive của bạn sẽ hoàn toàn được giữ nguyên</strong> và không bị xóa hay chỉnh sửa.
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirmUnlink}
            disabled={isLoading}
            className="text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Link2Off className="w-3.5 h-3.5" />
            )}
            {isLoading ? 'Đang gỡ liên kết...' : 'Gỡ liên kết'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
