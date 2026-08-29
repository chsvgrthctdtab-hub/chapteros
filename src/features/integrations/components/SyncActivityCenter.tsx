import { useState } from 'react';
import { 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileSpreadsheet, 
  FileText, 
  CalendarDays, 
  FolderSync, 
  Filter, 
  Layers,
  ArrowUpRight,
  ShieldCheck,
  User
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { IntegrationSyncActivity } from '../types/google.types';
import type { GoogleServiceKey } from '@/types';
import { formatDate } from '@/lib/date';

interface SyncActivityCenterProps {
  activities: IntegrationSyncActivity[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onInspectService?: (serviceKey: GoogleServiceKey) => void;
}

export function SyncActivityCenter({
  activities,
  isLoading,
  onRefresh,
  onInspectService,
}: SyncActivityCenterProps) {
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<'all' | GoogleServiceKey>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (selectedServiceFilter === 'all') return true;
    return act.service === selectedServiceFilter;
  });

  const getServiceIcon = (service: GoogleServiceKey) => {
    switch (service) {
      case 'forms':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'sheets':
        return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
      case 'calendar':
        return <CalendarDays className="h-4 w-4 text-blue-600" />;
      case 'drive':
        return <FolderSync className="h-4 w-4 text-teal-600" />;
    }
  };

  const getServiceBadge = (service: GoogleServiceKey) => {
    switch (service) {
      case 'forms':
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-200 text-purple-700 bg-purple-50">Forms</Badge>;
      case 'sheets':
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-200 text-emerald-700 bg-emerald-50">Sheets</Badge>;
      case 'calendar':
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-200 text-blue-700 bg-blue-50">Calendar</Badge>;
      case 'drive':
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-teal-200 text-teal-700 bg-teal-50">Drive</Badge>;
    }
  };

  return (
    <Card id="sync-activity-center" className="border-slate-200 shadow-2xs bg-white rounded-2xl overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                Nhật ký Đồng bộ & Vận hành Tích hợp
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Theo dõi các tiến trình trao đổi dữ liệu, xuất nhập bảng tính và đối soát tự động
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Filter pills */}
            <div className="inline-flex items-center rounded-xl bg-slate-100/90 p-1 text-xs shrink-0 border border-slate-200/60 shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedServiceFilter('all')}
                className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  selectedServiceFilter === 'all'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setSelectedServiceFilter('sheets')}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  selectedServiceFilter === 'sheets'
                    ? 'bg-white text-emerald-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sheets
              </button>
              <button
                type="button"
                onClick={() => setSelectedServiceFilter('forms')}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  selectedServiceFilter === 'forms'
                    ? 'bg-white text-purple-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Forms
              </button>
              <button
                type="button"
                onClick={() => setSelectedServiceFilter('calendar')}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  selectedServiceFilter === 'calendar'
                    ? 'bg-white text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Calendar
              </button>
              <button
                type="button"
                onClick={() => setSelectedServiceFilter('drive')}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  selectedServiceFilter === 'drive'
                    ? 'bg-white text-teal-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Drive
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="text-xs h-8 px-3 border-slate-200 hover:bg-slate-50 font-medium whitespace-nowrap shrink-0 cursor-pointer rounded-xl"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Clock className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-xs font-medium text-slate-600">
              Chưa có nhật ký đồng bộ nào cho bộ lọc đã chọn.
            </p>
            <p className="text-[11px] text-slate-400">
              Các tác vụ đồng bộ Google Workspace mới nhất sẽ tự động hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActivities.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 mt-0.5">
                    {getServiceIcon(item.service)}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-xs">
                        {item.actionTitle}
                      </span>
                      {getServiceBadge(item.service)}
                      <Badge variant="success" className="text-[10px] py-0 px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                        Thành công
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed truncate max-w-xl">
                      {item.description}
                    </p>
                    {item.actorName && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Thực hiện bởi: {item.actorName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[11px] font-mono text-slate-500">
                    {formatDate(item.timestamp, 'HH:mm dd/MM/yyyy')}
                  </span>
                  {onInspectService && (
                    <button
                      type="button"
                      onClick={() => onInspectService(item.service)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 hover:underline"
                    >
                      <span>Kiểm tra</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
