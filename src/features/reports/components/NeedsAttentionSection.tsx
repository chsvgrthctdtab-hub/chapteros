import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, ArrowRight, CheckCircle2, CheckSquare, Wallet, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReportOverview } from '@/types/report';

interface NeedsAttentionSectionProps {
  overview?: ReportOverview | null;
}

export function NeedsAttentionSection({ overview }: NeedsAttentionSectionProps) {
  if (!overview) return null;

  const {
    memberCount,
    activeMemberCount,
    activityCount,
    taskCount,
    balance,
  } = overview;

  const isBudgetDeficit = balance < 0;

  const issues: Array<{
    id: string;
    type: 'danger' | 'warning' | 'info';
    title: string;
    description: string;
    linkText: string;
    linkUrl: string;
    icon: typeof AlertTriangle;
  }> = [];

  if (isBudgetDeficit) {
    issues.push({
      id: 'finance-deficit',
      type: 'danger',
      title: 'Quỹ chi hội đang âm số dư',
      description: 'Số dư khả dụng đang bị thâm hụt. Cần kiểm tra các khoản chi và bổ sung nguồn thu kịp thời.',
      linkText: 'Kiểm tra sổ quỹ',
      linkUrl: '/finance',
      icon: Wallet,
    });
  }

  if (memberCount > 0 && activeMemberCount / memberCount < 0.6) {
    issues.push({
      id: 'members-active-low',
      type: 'warning',
      title: `Tỷ lệ hội viên đang hoạt động chỉ đạt ${Math.round((activeMemberCount / memberCount) * 100)}%`,
      description: 'Số lượng hội viên tích cực đang thấp hơn mục tiêu. Cần rà soát danh sách và đẩy mạnh hoạt động gắn kết.',
      linkText: 'Xem danh sách hội viên',
      linkUrl: '/members',
      icon: Users,
    });
  }

  if (activityCount === 0) {
    issues.push({
      id: 'activities-empty',
      type: 'info',
      title: 'Chưa có kế hoạch hoạt động nào được ghi nhận',
      description: 'Nhiệm kỳ chưa có chương trình hoặc sự kiện nào. Hãy khởi tạo chương trình hoạt động mới.',
      linkText: 'Tạo hoạt động mới',
      linkUrl: '/activities',
      icon: Calendar,
    });
  }

  if (taskCount === 0 && activityCount > 0) {
    issues.push({
      id: 'tasks-empty',
      type: 'warning',
      title: 'Chưa phân công đầu việc cho các hoạt động',
      description: 'Đã có hoạt động nhưng chưa tạo các nhiệm vụ cụ thể phân công cho nhân sự thực hiện.',
      linkText: 'Quản lý nhiệm vụ',
      linkUrl: '/tasks',
      icon: CheckSquare,
    });
  }

  if (issues.length === 0) {
    return (
      <Card className="border-slate-200/90 shadow-2xs bg-emerald-50/50 border-emerald-200/80" id="needs-attention-healthy">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-900">
                Vận hành ổn định — Không có điểm nghẽn nghiêm trọng
              </div>
              <div className="text-2xs text-emerald-700 mt-0.5">
                Các chỉ số về nhân sự, tài chính và phân công công việc của chi hội đều trong ngưỡng kiểm soát tốt.
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-2xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md">
            Sẵn sàng điều hành
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/90 shadow-2xs bg-white" id="needs-attention-section">
      <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Điểm nghẽn cần lưu ý ({issues.length})
          </CardTitle>
        </div>
        <span className="text-2xs text-slate-500 font-medium">Khuyến nghị điều hành</span>
      </CardHeader>
      <CardContent className="p-3 divide-y divide-slate-100">
        {issues.map((issue) => {
          const Icon = issue.icon;
          const isDanger = issue.type === 'danger';
          const isWarning = issue.type === 'warning';

          return (
            <div key={issue.id} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                    isDanger
                      ? 'bg-rose-50 text-rose-600'
                      : isWarning
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDanger ? 'text-rose-900' : isWarning ? 'text-amber-900' : 'text-blue-900'}`}>
                    {issue.title}
                  </h4>
                  <p className="text-2xs text-slate-600 mt-0.5 leading-relaxed">
                    {issue.description}
                  </p>
                </div>
              </div>
              <Link
                to={issue.linkUrl}
                className="shrink-0 inline-flex items-center gap-1 text-2xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-md transition-colors border border-slate-200"
              >
                <span>{issue.linkText}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
