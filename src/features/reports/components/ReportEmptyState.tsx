import { BarChart3 } from 'lucide-react';

interface ReportEmptyStateProps {
  title?: string;
  description?: string;
}

export function ReportEmptyState({
  title = 'Chưa có dữ liệu',
  description = 'Hiện tại chưa có đủ dữ liệu để tạo báo cáo phân tích cho tiêu chí đã chọn.',
}: ReportEmptyStateProps) {
  return (
    <div
      id="report-empty-state"
      className="rounded-xl border border-dashed border-hairline bg-cloud p-8 text-center space-y-3 max-w-md mx-auto my-8"
    >
      <div className="mx-auto w-12 h-12 rounded-full bg-pebble flex items-center justify-center text-mist-gray">
        <BarChart3 strokeWidth={1.5} className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-ink-navy">{title}</h3>
        <p className="text-sm text-mist-gray">{description}</p>
      </div>
    </div>
  );
}
