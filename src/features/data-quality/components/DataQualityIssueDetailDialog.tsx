import { useNavigate } from 'react-router-dom';
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
import {
  SEVERITY_META,
  CATEGORY_META,
  formatVietnameseDateTime,
  getEntityDisplayName,
} from '../utils/quality-helpers';
import type { DataQualityIssue } from '../types';
import {
  ExternalLink,
  Code2,
  Calendar,
  Layers,
  HelpCircle,
  Wrench,
  CheckCircle2,
} from 'lucide-react';

interface DataQualityIssueDetailDialogProps {
  issue: DataQualityIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataQualityIssueDetailDialog({
  issue,
  open,
  onOpenChange,
}: DataQualityIssueDetailDialogProps) {
  const navigate = useNavigate();

  if (!issue) return null;

  const severityMeta = SEVERITY_META[issue.severity];
  const categoryMeta = CATEGORY_META[issue.category];
  const SeverityIcon = severityMeta.icon;
  const CategoryIcon = categoryMeta.icon;

  const handleNavigateToEntity = () => {
    onOpenChange(false);
    if (issue.actionRoute) {
      navigate(issue.actionRoute);
    } else {
      navigate(categoryMeta.route);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-xl border-slate-200">
        {/* Header with Severity Banner */}
        <div
          className={`p-6 border-b ${
            issue.severity === 'critical'
              ? 'bg-rose-50/70 border-rose-100'
              : issue.severity === 'warning'
              ? 'bg-amber-50/70 border-amber-100'
              : 'bg-sky-50/70 border-sky-100'
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${severityMeta.badgeClass}`}
            >
              <SeverityIcon className="w-3.5 h-3.5" />
              {severityMeta.label}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${categoryMeta.badgeClass}`}
            >
              <CategoryIcon className="w-3.5 h-3.5" />
              {categoryMeta.label}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <Code2 className="w-3.5 h-3.5 text-slate-500" />
              {issue.code}
            </span>
          </div>

          <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {issue.title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            {issue.description}
          </DialogDescription>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs sm:text-sm text-slate-700">
          {/* Target Entity Information */}
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200/80 space-y-2.5">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>Đối tượng liên quan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Phân loại thực thể:</span>
                <span className="font-semibold text-slate-800">
                  {getEntityDisplayName(issue.entityType)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Tên / Nhãn hiển thị:</span>
                <span className="font-bold text-slate-900 truncate block">
                  {issue.entityName || 'Không có tên cụ thể'}
                </span>
              </div>

              {issue.entityId && (
                <div className="sm:col-span-2">
                  <span className="text-slate-500 text-xs block mb-0.5">Mã định danh (ID):</span>
                  <span className="font-mono text-xs text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200 block truncate">
                    {issue.entityId}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Thời điểm phát hiện:</span>
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatVietnameseDateTime(issue.detectedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Remediation Guide & Suggested Fix */}
          <div className="rounded-lg bg-emerald-50/60 p-4 border border-emerald-200/70 space-y-2">
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-emerald-700" />
              <span>Hướng dẫn xử lý chuẩn hóa</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
              Nhấn nút{' '}
              <strong>
                "{issue.actionLabel || `Đi tới quản lý ${categoryMeta.label}`}"
              </strong>{' '}
              để chuyển hướng trực tiếp đến trang nghiệp vụ tương ứng và cập nhật lại thông tin đúng quy chuẩn.
            </p>
          </div>

          {/* Additional Metadata JSON (if any) */}
          {issue.metadata && Object.keys(issue.metadata).length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Thông số kỹ thuật bổ sung</span>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-32">
                {JSON.stringify(issue.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <DialogFooter className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-row items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg text-xs font-medium cursor-pointer"
          >
            Đóng
          </Button>

          <Button
            type="button"
            onClick={handleNavigateToEntity}
            className="rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white gap-2 cursor-pointer shadow-2xs"
          >
            <span>{issue.actionLabel || `Đi tới ${categoryMeta.label}`}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
