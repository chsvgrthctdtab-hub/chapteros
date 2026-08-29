import { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ImportExecutionResult } from '../google-sheets.types';
import { GOOGLE_SHEETS_MODULE_TABS } from '../google-sheets.constants';

interface ImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ImportExecutionResult | null;
  onDone?: () => void;
}

export function ImportResultDialog({
  open,
  onOpenChange,
  result,
  onDone,
}: ImportResultDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const moduleInfo = GOOGLE_SHEETS_MODULE_TABS[result.module];

  const handleCopyErrors = () => {
    if (!result.errors.length) return;
    const text = result.errors
      .map((e) => `[Dòng ${e.rowIndex}] ${e.identifier}: ${e.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    if (onDone) onDone();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">
                Kết quả Nhập dữ liệu ({moduleInfo?.title || result.module})
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Đã hoàn tất đồng bộ dữ liệu từ Google Sheets vào Supabase PostgreSQL
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary Stat Grid */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <div className="text-xl font-bold text-emerald-700">{result.createdCount}</div>
              <div className="text-xs font-medium text-emerald-800 mt-0.5">Tạo mới</div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="text-xl font-bold text-blue-700">{result.updatedCount}</div>
              <div className="text-xs font-medium text-blue-800 mt-0.5">Cập nhật</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <div className="text-xl font-bold text-amber-700">{result.skippedCount}</div>
              <div className="text-xs font-medium text-amber-800 mt-0.5">Bỏ qua</div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-center">
              <div className="text-xl font-bold text-rose-700">{result.failedCount}</div>
              <div className="text-xs font-medium text-rose-800 mt-0.5">Thất bại</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
            <div className="font-semibold text-slate-900 mb-0.5">Thông điệp thực thi:</div>
            <div>{result.message}</div>
          </div>

          {/* Errors Breakdown (if any) */}
          {result.errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Danh sách lỗi ({result.errors.length} dòng):
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyErrors}
                  className="h-7 text-xs px-2.5 gap-1 text-slate-600"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Đã sao chép' : 'Sao chép nhật ký'}
                </Button>
              </div>

              <div className="border border-rose-200 bg-rose-50/50 rounded-lg max-h-48 overflow-y-auto divide-y divide-rose-100 text-xs">
                {result.errors.map((err, idx) => (
                  <div key={idx} className="p-2.5 flex items-start gap-2">
                    <span className="font-mono px-1.5 py-0.5 bg-rose-200/70 text-rose-900 rounded font-semibold text-[11px] shrink-0">
                      Dòng {err.rowIndex}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-rose-950 truncate">{err.identifier}</div>
                      <div className="text-rose-800 text-[11px] mt-0.5">{err.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button onClick={handleClose} className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 text-xs">
            Đóng & Hoàn tất
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
