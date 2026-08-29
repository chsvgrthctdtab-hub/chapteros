import type { ReportOverview } from '@/types/report';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, TrendingUp, ShieldCheck, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';
import { formatVND } from '@/features/dashboard/utils/formatters';

interface ExecutiveInsightsPanelProps {
  overview?: ReportOverview | null;
}

export function ExecutiveInsightsPanel({ overview }: ExecutiveInsightsPanelProps) {
  if (!overview) return null;

  const {
    memberCount,
    activeMemberCount,
    activityCount,
    taskCount,
    totalIncome,
    totalExpense,
    balance,
  } = overview;

  const activeMemberRatio = memberCount > 0 ? Math.round((activeMemberCount / memberCount) * 100) : 0;
  const isFinancialHealthy = balance >= 0;
  const expenseRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : totalExpense > 0 ? 100 : 0;

  return (
    <Card className="border-slate-200/90 shadow-2xs bg-gradient-to-br from-slate-900 to-slate-800 text-white" id="executive-insights-panel">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-700/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-white tracking-tight">
                Nhận định Điều hành & Tín hiệu Vận hành (Executive Insights)
              </CardTitle>
              <p className="text-2xs text-slate-400 mt-0.5">
                Tổng hợp tự động các chỉ số sức khỏe tổ chức và rủi ro cần lưu ý
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-2xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Trực tiếp từ số liệu chi hội
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Insight 1: Member Engagement */}
        <div className="rounded-xl bg-slate-800/80 border border-slate-700/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Gắn kết hội viên</span>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${activeMemberRatio >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {activeMemberRatio >= 70 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white">{activeMemberRatio}%</span>
            <span className="text-2xs text-slate-300">đang duy trì sinh hoạt</span>
          </div>
          <p className="text-2xs text-slate-400 leading-relaxed">
            {activeMemberRatio >= 80
              ? 'Tỷ lệ duy trì hội viên ở mức rất cao, phong trào sinh hoạt ổn định vững vàng.'
              : activeMemberRatio >= 60
              ? 'Tỷ lệ sinh hoạt đạt mức khá. Cần tăng cường hoạt động phong trào để thu hút hội viên.'
              : 'Tỷ lệ sinh hoạt cần được cải thiện. Ban chấp hành nên rà soát lại phương thức tổ chức phong trào.'}
          </p>
        </div>

        {/* Insight 2: Treasury Health */}
        <div className="rounded-xl bg-slate-800/80 border border-slate-700/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Sức khỏe ngân sách</span>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${isFinancialHealthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isFinancialHealthy ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-black ${isFinancialHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatVND(balance)}
            </span>
            <span className="text-2xs text-slate-300">
              {isFinancialHealthy ? 'Thặng dư' : 'Thâm hụt'}
            </span>
          </div>
          <p className="text-2xs text-slate-400 leading-relaxed">
            {isFinancialHealthy
              ? `Quỹ duy trì dương an toàn. Tỷ lệ chi/thu đạt ${expenseRatio}%, kiểm soát ngân sách hiệu quả.`
              : 'Cảnh báo: Chi vượt thu trong kỳ báo cáo. Ban tài chính cần kiểm tra các phiếu duyệt chi.'}
          </p>
        </div>

        {/* Insight 3: Operational Intensity */}
        <div className="rounded-xl bg-slate-800/80 border border-slate-700/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Quy mô vận hành</span>
            <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white">{activityCount}</span>
            <span className="text-2xs text-slate-300">sự kiện / {taskCount} nhiệm vụ</span>
          </div>
          <p className="text-2xs text-slate-400 leading-relaxed">
            {activityCount > 0
              ? `Trung bình ${taskCount > 0 ? (taskCount / activityCount).toFixed(1) : 0} đầu việc/hoạt động, phản ánh mức độ phân công công việc cụ thể cho nhân sự.`
              : 'Chưa ghi nhận hoạt động nào trong kỳ. Hãy lập kế hoạch chương trình sắp tới.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
