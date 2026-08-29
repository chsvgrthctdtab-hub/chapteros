import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportErrorStateProps {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ReportErrorState({
  message = 'Không thể tải dữ liệu báo cáo',
  onRetry,
  isRetrying = false,
}: ReportErrorStateProps) {
  return (
    <div
      id="report-error-state"
      className="rounded-xl border border-rose-200 bg-rose-50/70 p-6 text-center space-y-4 max-w-lg mx-auto my-8 shadow-xs"
    >
      <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-rose-900">Không thể tải dữ liệu báo cáo</h3>
        <p className="text-sm text-rose-700">{message}</p>
      </div>
      <div>
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          variant="outline"
          className="border-rose-300 text-rose-800 hover:bg-rose-100 bg-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Đang thử lại...' : 'Thử lại'}
        </Button>
      </div>
    </div>
  );
}
