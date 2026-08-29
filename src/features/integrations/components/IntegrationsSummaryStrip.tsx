import { 
  Boxes, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  Activity, 
  ShieldCheck,
  FileSpreadsheet,
  CalendarDays,
  FileText,
  FolderSync
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { GoogleServiceMetrics, GoogleIntegrationOverview } from '../types/google.types';
import { formatDate } from '@/lib/date';

interface IntegrationsSummaryStripProps {
  overview: GoogleIntegrationOverview | undefined;
  metrics: GoogleServiceMetrics | undefined;
  isLoading: boolean;
  onSelectService?: (serviceKey: 'forms' | 'sheets' | 'calendar' | 'drive') => void;
}

export function IntegrationsSummaryStrip({
  overview,
  metrics,
  isLoading,
  onSelectService,
}: IntegrationsSummaryStripProps) {
  const isOrgConnected = Boolean(overview?.isOrgConnected);
  const totalServices = 4;
  const readyServices = isOrgConnected ? 4 : 0;
  
  // Calculate warning items if any
  const warningCount = overview?.healthItems.filter(
    (item) => item.status === 'warning' || item.status === 'error'
  ).length || 0;

  // Find most recent sync timestamp across services
  const timestamps = [
    metrics?.forms.lastSyncedAt,
    metrics?.sheets.lastExportAt,
    metrics?.sheets.lastImportAt,
    metrics?.calendar.lastSyncedAt,
    metrics?.drive.lastLinkedAt,
  ].filter(Boolean) as string[];

  const latestSyncTime = timestamps.length > 0
    ? timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
    : null;

  return (
    <div id="integrations-summary-strip" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Connected Services Metric */}
      <Card 
        className="border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer bg-white"
        onClick={() => onSelectService && onSelectService('sheets')}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Dịch vụ Google Workspace
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900">
                {isLoading ? '...' : `${readyServices}/${totalServices}`}
              </span>
              <span className="text-xs text-slate-500 font-medium">Sẵn sàng</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {isOrgConnected ? 'Forms, Sheets, Calendar, Drive' : 'Cần ủy quyền tài khoản'}
            </p>
          </div>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
              isOrgConnected
                ? 'bg-blue-50 text-blue-600 border-blue-100'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            <Boxes className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Operational Health Status */}
      <Card className="border-slate-200 shadow-2xs bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Trạng thái Vận hành
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">
                {isOrgConnected ? '100% Sẵn sàng' : 'Chờ kích hoạt'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {isOrgConnected ? 'Xác thực OAuth 2.0 hợp lệ' : 'Cần kết nối Đơn vị'}
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Activity className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Attention & Conflict Alerts */}
      <Card className="border-slate-200 shadow-2xs bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Cảnh báo & Đối soát
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">
                {warningCount} Cảnh báo
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {warningCount === 0 ? 'Hạ tầng ổn định, không lỗi' : 'Có mục cần Ban Chấp Hành xử lý'}
            </p>
          </div>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
              warningCount > 0
                ? 'bg-amber-50 text-amber-600 border-amber-100'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            <AlertCircle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Last Sync & Timezone */}
      <Card className="border-slate-200 shadow-2xs bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Đồng bộ Gần nhất
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900">
                {latestSyncTime ? formatDate(latestSyncTime, 'HH:mm dd/MM') : 'Theo phiên'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Múi giờ Asia/Ho_Chi_Minh (GMT+7)
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Clock className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
