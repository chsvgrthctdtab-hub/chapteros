import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DashboardErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

export function DashboardErrorState({
  title = 'Không thể tải dữ liệu',
  message = 'Đã có lỗi xảy ra trong quá trình truy vấn dữ liệu từ máy chủ.',
  onRetry,
  fullPage = false,
}: DashboardErrorStateProps) {
  if (fullPage) {
    return (
      <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{message}</p>
        </div>
        {onRetry && (
          <Button size="sm" onClick={onRetry} className="text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Thử tải lại dữ liệu
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-rose-200 bg-rose-50/40 shadow-2xs">
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <div>
            <h5 className="text-xs font-bold text-rose-950">{title}</h5>
            <p className="text-[11px] text-rose-700">{message}</p>
          </div>
        </div>

        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="text-xs h-7 border-rose-200 bg-white hover:bg-rose-50 text-rose-700 shrink-0"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Thử lại
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
