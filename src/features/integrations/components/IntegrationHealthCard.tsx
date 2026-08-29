import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  Loader2, 
  ShieldCheck
} from 'lucide-react';
import type { GoogleIntegrationHealthItem } from '../types/google.types';
import { formatDate } from '@/lib/date';

interface IntegrationHealthCardProps {
  healthItems: GoogleIntegrationHealthItem[];
  onRefresh: () => Promise<void>;
}

export function IntegrationHealthCard({
  healthItems,
  onRefresh,
}: IntegrationHealthCardProps) {
  const [isRunningCheck, setIsRunningCheck] = useState(false);

  const handleRunDiagnostic = async () => {
    setIsRunningCheck(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRunningCheck(false), 600);
    }
  };

  const getStatusBadge = (status: GoogleIntegrationHealthItem['status']) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge variant="success" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Bình thường
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="warning" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Khuyến nghị
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Cần xử lý
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 flex items-center gap-1 text-slate-500">
            <Info className="h-3 w-3" />
            Thông tin
          </Badge>
        );
    }
  };

  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Chẩn đoán & Giám sát Hạ tầng Tích hợp
              </CardTitle>
              <CardDescription className="text-xs">
                Kiểm tra tính toàn vẹn của kết nối Google OAuth 2.0 và chính sách bảo mật RLS
              </CardDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRunDiagnostic}
            disabled={isRunningCheck}
            className="text-xs h-8"
          >
            {isRunningCheck ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            )}
            Chẩn đoán lại
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-1 text-xs">
        <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {healthItems.map((item) => (
            <div key={item.key} className="p-3 bg-white flex items-start justify-between gap-3 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-xs">{item.title}</span>
                  {getStatusBadge(item.status)}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.message}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {formatDate(item.timestamp, 'HH:mm dd/MM')}
              </span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="bg-slate-50/50 border-t border-slate-100 py-2.5 px-4 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Hệ thống sẵn sàng vận hành Phase 9 (Foundation)
        </span>
        <span className="font-mono text-[10px]">Tự động cập nhật mỗi 30s</span>
      </CardFooter>
    </Card>
  );
}
