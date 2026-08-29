import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Clock,
  CalendarCheck2,
  CalendarClock,
  WalletCards,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Unlink,
} from 'lucide-react';
import { formatVND } from '../utils/formatters';
import type { DashboardStats, UpcomingActivityItem, DashboardTermOption } from '../types/dashboard.types';

interface AlertCenterProps {
  stats: DashboardStats;
  upcomingActivities: UpcomingActivityItem[];
  terms: DashboardTermOption[];
  hasGoogleSyncError?: boolean;
}

export function AlertCenter({
  stats,
  upcomingActivities,
  terms,
  hasGoogleSyncError = false,
}: AlertCenterProps) {
  const alerts: Array<{
    id: string;
    type: 'danger' | 'warning' | 'info';
    icon: React.ReactNode;
    title: string;
    description: string;
    actionLabel: string;
    actionLink: string;
  }> = [];

  // 1. Quá hạn công việc
  if (stats.tasks.overdue > 0) {
    alerts.push({
      id: 'overdue-tasks',
      type: 'danger',
      icon: <Clock className="w-4 h-4 text-rose-600" />,
      title: `${stats.tasks.overdue} nhiệm vụ đã quá hạn xử lý`,
      description: 'Cần Ban Chấp Hành đôn đốc các thành viên phụ trách hoàn tất sớm.',
      actionLabel: 'Xử lý ngay',
      actionLink: '/tasks?onlyOverdue=true',
    });
  }

  // 2. Hoạt động sắp diễn ra trong 7 ngày tới
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const urgentActivities = upcomingActivities.filter((a) => {
    const actDate = new Date(a.startDate);
    return actDate >= now && actDate <= next7Days;
  });

  if (urgentActivities.length > 0) {
    alerts.push({
      id: 'urgent-activities',
      type: 'warning',
      icon: <CalendarCheck2 className="w-4 h-4 text-amber-600" />,
      title: `${urgentActivities.length} hoạt động sắp diễn ra trong 7 ngày tới`,
      description: `Bao gồm: ${urgentActivities.map((a) => a.title).slice(0, 2).join(', ')}${urgentActivities.length > 2 ? '...' : ''}.`,
      actionLabel: 'Xem kế hoạch',
      actionLink: '/activities',
    });
  }

  // 3. Cảnh báo số dư quỹ âm
  if (stats.finance.balance < 0) {
    alerts.push({
      id: 'negative-balance',
      type: 'danger',
      icon: <WalletCards className="w-4 h-4 text-rose-600" />,
      title: `Số dư quỹ đang bị thâm hụt (${formatVND(stats.finance.balance)})`,
      description: 'Tổng các khoản chi vượt quá tổng thu. Vui lòng rà soát chứng từ thu chi.',
      actionLabel: 'Kiểm tra sổ quỹ',
      actionLink: '/finance',
    });
  }

  // 4. Cảnh báo chưa có nhiệm kỳ hiện tại
  const hasCurrentTerm = terms.some((t) => t.isCurrent);
  if (terms.length > 0 && !hasCurrentTerm) {
    alerts.push({
      id: 'no-current-term',
      type: 'warning',
      icon: <CalendarClock className="w-4 h-4 text-amber-600" />,
      title: 'Chưa thiết lập Nhiệm kỳ hoạt động hiện tại',
      description: 'Chi hội cần đánh dấu một nhiệm kỳ là hiện tại để tổng hợp dữ liệu chính xác.',
      actionLabel: 'Cấu hình nhiệm kỳ',
      actionLink: '/terms',
    });
  }

  // 5. Cảnh báo gián đoạn Google Integration
  if (hasGoogleSyncError) {
    alerts.push({
      id: 'google-sync-error',
      type: 'info',
      icon: <Unlink className="w-4 h-4 text-indigo-600" />,
      title: 'Kết nối Google Workspace cần xác thực lại',
      description: 'Một số tính năng đồng bộ Lịch/Drive có thể tạm gián đoạn.',
      actionLabel: 'Kết nối lại',
      actionLink: '/integrations/google',
    });
  }

  // If no active alerts, show positive operational status banner
  if (alerts.length === 0) {
    return (
      <Card className="rounded-xl border-slate-200/90 bg-white shadow-2xs">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
                  All Systems & Operations Normal
                </h4>
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200/80 text-[11px] py-0 px-2 font-medium hover:bg-emerald-50">
                  Optimal
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                No overdue tasks, chapter treasury is balanced, and planned activities are on track.
              </p>
            </div>
          </div>

          <Link to="/tasks" className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center shrink-0 self-end sm:self-auto transition-colors">
            <span>Operational queue</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-60" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-slate-200/90 bg-white shadow-2xs">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Attention Required</span>
                <Badge variant="outline" className="text-[11px] px-1.5 py-0 bg-amber-50 text-amber-800 border-amber-200 font-semibold">
                  {alerts.length} action items
                </Badge>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                High-priority operational items requiring immediate review
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-1.5">
        <div className="divide-y divide-slate-100">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="py-3 first:pt-1.5 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="flex items-start gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  alert.type === 'danger'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    : alert.type === 'warning'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                }`}>
                  {alert.icon}
                </div>
                <div className="space-y-0.5">
                  <h5 className="text-xs sm:text-sm font-semibold text-slate-900">
                    {alert.title}
                  </h5>
                  <p className="text-xs text-slate-500">
                    {alert.description}
                  </p>
                </div>
              </div>

              <Link to={alert.actionLink} className="shrink-0 self-end sm:self-auto">
                <Button
                  size="sm"
                  variant={alert.type === 'danger' ? 'destructive' : 'outline'}
                  className="text-xs h-7.5 px-2.5 rounded-lg shadow-2xs font-semibold cursor-pointer"
                >
                  <span>{alert.actionLabel}</span>
                  <ArrowRight className="w-3 h-3 ml-1.5" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
