import { useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Lock,
  FileSpreadsheet,
  CheckSquare,
  Calendar,
  Users,
  DollarSign,
  ChevronDown,
  ChevronUp,
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
import { Badge } from '@/components/ui/badge';
import { useTermClosingChecklist } from '../queries/term.queries';
import type { Term } from '@/types';
import type { CloseTermParams } from '../types/term.types';

interface CompleteTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term: Term | null;
  organizationId: string;
  currentUserId?: string;
  currentUserName?: string;
  onConfirmClose: (params: CloseTermParams, actorUserName?: string) => Promise<void>;
  isLoading?: boolean;
}

export function CompleteTermDialog({
  open,
  onOpenChange,
  term,
  organizationId,
  currentUserId,
  currentUserName,
  onConfirmClose,
  isLoading = false,
}: CompleteTermDialogProps) {
  const [isOverridden, setIsOverridden] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: checklist, isLoading: isLoadingChecklist } = useTermClosingChecklist(
    open && term ? term.id : undefined,
    organizationId
  );

  if (!term) return null;

  const hasBlockingIssues = checklist ? !checklist.ready : false;
  const canSubmit = checklist?.ready || (isOverridden && overrideReason.trim().length >= 5);

  const handleConfirm = async () => {
    setError(null);
    if (!canSubmit) {
      if (hasBlockingIssues && !isOverridden) {
        setError('Nhiệm kỳ còn tồn đọng chưa hoàn tất. Vui lòng xử lý hoặc chọn xác nhận bỏ qua.');
        return;
      }
      if (isOverridden && overrideReason.trim().length < 5) {
        setError('Vui lòng nhập lý do hợp lệ khi xác nhận bỏ qua cảnh báo (tối thiểu 5 ký tự).');
        return;
      }
    }

    try {
      await onConfirmClose(
        {
          termId: term.id,
          organizationId,
          actorUserId: currentUserId,
          isOverridden,
          overrideReason: isOverridden ? overrideReason.trim() : undefined,
          handoverNotes: handoverNotes.trim() || undefined,
        },
        currentUserName
      );
      onOpenChange(false);
      setIsOverridden(false);
      setOverrideReason('');
      setHandoverNotes('');
    } catch (err: unknown) {
      const e = err as Error;
      setError(e?.message || 'Có lỗi xảy ra khi đóng nhiệm kỳ.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/80">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Tổng kết & Đóng nhiệm kỳ ({term.name})
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Kiểm tra checklist bàn giao, tạo snapshot lưu trữ bất biến và khóa dữ liệu nghiệp vụ
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Checklist loading state */}
          {isLoadingChecklist ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2 bg-white rounded-xl border border-slate-200">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-xs">Đang tổng hợp dữ liệu kiểm tra nhiệm kỳ...</p>
            </div>
          ) : checklist ? (
            <div className="space-y-4">
              {/* Ready status banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  checklist.ready
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {checklist.ready ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm">
                      {checklist.ready
                        ? 'Đủ điều kiện đóng nhiệm kỳ'
                        : `Còn ${checklist.blockingIssues.length} vấn đề tồn đọng`}
                    </span>
                    <Badge
                      className={
                        checklist.ready
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }
                    >
                      {checklist.ready ? 'Sẵn sàng' : 'Cần xử lý'}
                    </Badge>
                  </div>
                  <p className="text-xs mt-1 opacity-90">
                    {checklist.ready
                      ? 'Tất cả các hoạt động, công việc và sổ quỹ tài chính đã được hoàn tất nghiệm thu.'
                      : 'Hệ thống phát hiện một số hoạt động hoặc công việc chưa hoàn thành. Cần giải quyết hoặc ghi đè lý do trước khi đóng.'}
                  </p>
                </div>
              </div>

              {/* Statistics Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                    Hội viên
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {checklist.stats.members.total}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {checklist.stats.members.active} đang sinh hoạt
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                    Hoạt động
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {checklist.stats.activities.completed}/{checklist.stats.activities.total}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {checklist.stats.activities.inProgressOrDraft} chưa đóng
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                    <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                    Công việc
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {checklist.stats.tasks.completed}/{checklist.stats.tasks.total}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {checklist.stats.tasks.open} đang mở
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    Số dư quỹ
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {new Intl.NumberFormat('vi-VN').format(checklist.stats.finance.balance)} ₫
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {checklist.stats.finance.transactionCount} giao dịch
                  </div>
                </div>
              </div>

              {/* Blocking issues list (if any) */}
              {!checklist.ready && (
                <div className="bg-white rounded-xl border border-amber-200 p-4 space-y-3">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Chi tiết các mục chưa hoàn thành:
                  </div>
                  <div className="space-y-2">
                    {checklist.blockingIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-lg text-xs flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800">{issue.title}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">{issue.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Override controls */}
                  <div className="pt-2 border-t border-amber-100 space-y-2.5">
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isOverridden}
                        onChange={(e) => setIsOverridden(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs font-semibold text-amber-950">
                        Xác nhận bỏ qua các vấn đề tồn đọng để hoàn tất đóng nhiệm kỳ (Sẽ ghi lại Audit Log)
                      </span>
                    </label>

                    {isOverridden && (
                      <div className="pl-6 space-y-1">
                        <label className="block text-[11px] font-medium text-slate-700">
                          Lý do bỏ qua cảnh báo đóng nhiệm kỳ <span className="text-red-500">*</span>:
                        </label>
                        <textarea
                          rows={2}
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          placeholder="Ví dụ: Các công việc còn lại đã được chuyển giao cho nhiệm kỳ sau theo biên bản số..."
                          className="w-full text-xs p-2.5 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Handover notes input */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
                    Biên bản & Ghi chú bàn giao (Lưu vào Snapshot)
                  </label>
                  <span className="text-[11px] text-slate-400">Tùy chọn</span>
                </div>
                <textarea
                  rows={3}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="Ghi chú tóm tắt bàn giao tài chính, hồ sơ sổ sách, con dấu, cơ sở vật chất hoặc chỉ đạo cho Ban Chấp hành nhiệm kỳ mới..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>

              {/* Locking warning reminder */}
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  Hiệu lực của việc Đóng nhiệm kỳ:
                </p>
                <p>• Hệ thống sẽ snapshot toàn bộ tài chính, danh sách hội viên và hoạt động vào thời điểm đóng.</p>
                <p>• Sau khi đóng, mọi dữ liệu Hoạt động, Điểm danh, Thu/Chi và Phân công nhân sự trong nhiệm kỳ này sẽ chuyển sang trạng thái <strong>Chỉ Đọc (Read-Only)</strong> để bảo vệ tính toàn vẹn dữ liệu.</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-slate-200 bg-white flex items-center justify-between sm:justify-between">
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
            disabled={isLoading || isLoadingChecklist || !canSubmit}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-xs"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Lock className="h-4 w-4" />
            Khóa & Đóng nhiệm kỳ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
