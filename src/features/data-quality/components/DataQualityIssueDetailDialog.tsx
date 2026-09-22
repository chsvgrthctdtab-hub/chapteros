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
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-xl border-hairline">
        {/* Header with Severity Banner */}
        <div
          className={`p-6 border-b ${
            issue.severity === 'critical'
              ? 'bg-rose-50/70 border-rose-100'
              : issue.severity === 'warning'
              ? 'bg-amber-50/70 border-amber-100'
              : 'bg-[#e6f0ff]/70 border-[#d4e4fa]'
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

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-cloud text-slate-gray border border-hairline">
              <Code2 className="w-3.5 h-3.5 text-mist-gray" />
              {issue.code}
            </span>
          </div>

          <DialogTitle className="text-lg sm:text-xl font-bold text-ink-navy leading-snug">
            {issue.title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-gray mt-1.5 leading-relaxed">
            {issue.description}
          </DialogDescription>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs sm:text-sm text-slate-gray">
          {/* Target Entity Information */}
          <div className="rounded-lg bg-cloud p-4 border border-hairline space-y-2.5">
            <div className="text-xs font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-signal-blue" />
              <span>Đối tượng liên quan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-mist-gray text-xs block mb-0.5">Phân loại thực thể:</span>
                <span className="font-semibold text-ink-navy">
                  {getEntityDisplayName(issue.entityType)}
                </span>
              </div>

              <div>
                <span className="text-mist-gray text-xs block mb-0.5">Tên / Nhãn hiển thị:</span>
                <span className="font-bold text-ink-navy truncate block">
                  {issue.entityName || 'Không có tên cụ thể'}
                </span>
              </div>

              {issue.entityId && (
                <div className="sm:col-span-2">
                  <span className="text-mist-gray text-xs block mb-0.5">Mã định danh (ID):</span>
                  <span className="font-mono text-xs text-slate-gray bg-white px-2 py-1 rounded-md border border-hairline block truncate">
                    {issue.entityId}
                  </span>
                </div>
              )}

              <div>
                <span className="text-mist-gray text-xs block mb-0.5">Thời điểm phát hiện:</span>
                <span className="font-medium text-slate-gray flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-mist-gray" />
                  {formatVietnameseDateTime(issue.detectedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Remediation Guide & Suggested Fix */}
          <div className="rounded-lg bg-[#e6f0ff]/60 p-4 border border-[#d4e4fa] space-y-2">
            <div className="text-xs font-bold text-ink-navy flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-signal-blue" />
              <span>Hướng dẫn xử lý chuẩn hóa</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-gray leading-relaxed">
              Nhấn nút{' '}
              <strong className="text-ink-navy">
                "{issue.actionLabel || `Đi tới quản lý ${categoryMeta.label}`}"
              </strong>{' '}
              để chuyển hướng trực tiếp đến trang nghiệp vụ tương ứng và cập nhật lại thông tin đúng quy chuẩn.
            </p>
          </div>

          {/* Additional Metadata JSON (if any) */}
          {issue.metadata && Object.keys(issue.metadata).length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-gray flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-mist-gray" />
                <span>Thông số kỹ thuật bổ sung</span>
              </div>
              <pre className="p-3 bg-ink-navy text-cloud rounded-lg text-xs font-mono overflow-x-auto max-h-32 border border-hairline">
                {JSON.stringify(issue.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <DialogFooter className="p-4 bg-cloud/80 border-t border-hairline flex flex-row items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg text-xs font-medium cursor-pointer border-hairline text-slate-gray hover:bg-white hover:text-ink-navy"
          >
            Đóng
          </Button>

          <Button
            type="button"
            onClick={handleNavigateToEntity}
            className="rounded-lg text-xs font-semibold bg-signal-blue hover:bg-[#005be0] text-white gap-2 cursor-pointer shadow-xs"
          >
            <span>{issue.actionLabel || `Đi tới ${categoryMeta.label}`}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
