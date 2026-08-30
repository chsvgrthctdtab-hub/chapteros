import { useReportOverview, useReportActivityStats, useReportTaskStats, useReportFundStats, useReportMemberStats } from '../reports.queries';
import type { ReportFilterParams } from '@/types/report';
import { ReportSkeleton } from './ReportSkeleton';
import { ReportErrorState } from './ReportErrorState';
import { ReportEmptyState } from './ReportEmptyState';
import { ExecutiveInsightsPanel } from './ExecutiveInsightsPanel';
import { NeedsAttentionSection } from './NeedsAttentionSection';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Calendar, CheckSquare, Wallet, ArrowUpRight, ArrowDownRight, Layers, ArrowRight, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatVND } from '@/features/dashboard/utils/formatters';
import { Link } from 'react-router-dom';

interface OverviewReportProps {
  organizationId?: string;
  filterParams?: ReportFilterParams;
}

export function OverviewReport({ organizationId, filterParams }: OverviewReportProps) {
  const {
    data: overview,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    error: overviewError,
    refetch: refetchOverview,
    isFetching: isOverviewFetching,
  } = useReportOverview(organizationId, filterParams?.termId);

  const { data: activityStats } = useReportActivityStats(organizationId, filterParams);
  const { data: taskStats } = useReportTaskStats(organizationId, filterParams);
  const { data: fundStats } = useReportFundStats(organizationId, filterParams);
  const { data: memberStats } = useReportMemberStats(organizationId, filterParams?.termId);

  if (isOverviewLoading) {
    return <ReportSkeleton />;
  }

  if (isOverviewError) {
    return (
      <ReportErrorState
        message={overviewError instanceof Error ? overviewError.message : 'Lỗi khi tải báo cáo tổng quan'}
        onRetry={() => refetchOverview()}
        isRetrying={isOverviewFetching}
      />
    );
  }

  if (!overview) {
    return <ReportEmptyState title="Chưa có dữ liệu tổng quan" />;
  }

  const {
    memberCount,
    activeMemberCount,
    termCount,
    currentTerm,
    activityCount,
    taskCount,
    totalIncome,
    totalExpense,
    balance,
  } = overview;

  const hasAnyData =
    memberCount > 0 ||
    termCount > 0 ||
    activityCount > 0 ||
    taskCount > 0 ||
    totalIncome > 0 ||
    totalExpense > 0;

  if (!hasAnyData) {
    return (
      <ReportEmptyState
        title="Chưa có số liệu tổng quan"
        description="Chi hội chưa ghi nhận hoạt động, hội viên hay giao dịch tài chính nào trong hệ thống."
      />
    );
  }

  return (
    <div className="space-y-6" id="overview-report-section">
      {/* 1. Executive Insights Signal Panel */}
      <ExecutiveInsightsPanel overview={overview} />

      {/* 2. Needs Attention / Bottlenecks */}
      <NeedsAttentionSection overview={overview} />

      {/* 3. Operational Performance Breakdown by Domain */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Bức tranh Hoạt động Toàn diện (Operational Performance Overview)
            </h3>
            <p className="text-2xs text-slate-500 mt-0.5">
              Tổng hợp hiệu suất vận hành theo từng khối nghiệp vụ chính của Đơn vị
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Box 1: Operations & Activities */}
          <Card className="border-slate-200/90 shadow-2xs bg-white">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold text-slate-900">Hoạt động & Sự kiện</CardTitle>
                  <CardDescription className="text-2xs text-slate-500">
                    {activityCount} chương trình trong kỳ
                  </CardDescription>
                </div>
              </div>
              <Link
                to="/activities"
                className="text-2xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <span>Xem chi tiết</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                  <div className="text-base font-black text-emerald-600">
                    {activityStats ? activityStats.completedActivities : '---'}
                  </div>
                  <div className="text-2xs text-slate-500 mt-0.5 font-medium">Hoàn thành</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                  <div className="text-base font-black text-blue-600">
                    {activityStats ? activityStats.inProgressActivities + activityStats.publishedActivities : '---'}
                  </div>
                  <div className="text-2xs text-slate-500 mt-0.5 font-medium">Đang triển khai</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                  <div className="text-base font-black text-amber-600">
                    {activityStats ? activityStats.planningActivities + activityStats.draftActivities : '---'}
                  </div>
                  <div className="text-2xs text-slate-500 mt-0.5 font-medium">Kế hoạch / Dự thảo</div>
                </div>
              </div>

              {activityStats && activityStats.byCategory.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Các mảng hoạt động trọng tâm
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activityStats.byCategory.slice(0, 4).map((c) => (
                      <span
                        key={c.category}
                        className="px-2 py-0.5 rounded-md text-2xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60"
                      >
                        {c.category}: {c.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Box 2: Task Execution */}
          <Card className="border-slate-200/90 shadow-2xs bg-white">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold text-slate-900">Tiến độ Thực thi Nhiệm vụ</CardTitle>
                  <CardDescription className="text-2xs text-slate-500">
                    {taskCount} đầu việc được giao
                  </CardDescription>
                </div>
              </div>
              <Link
                to="/tasks"
                className="text-2xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Xem bảng việc</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-2xs">
                  <span className="font-semibold text-slate-700">Tỷ lệ hoàn thành công việc</span>
                  <span className="font-bold text-emerald-700">
                    {taskStats ? `${taskStats.completionRate}%` : '---'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${taskStats?.completionRate || 0}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
                <div className="rounded-lg bg-emerald-50/70 p-1.5 border border-emerald-100">
                  <div className="text-sm font-black text-emerald-700">
                    {taskStats ? taskStats.completedTasks : '---'}
                  </div>
                  <div className="text-3xs text-emerald-800 font-medium">Xong</div>
                </div>
                <div className="rounded-lg bg-blue-50/70 p-1.5 border border-blue-100">
                  <div className="text-sm font-black text-blue-700">
                    {taskStats ? taskStats.inProgressTasks : '---'}
                  </div>
                  <div className="text-3xs text-blue-800 font-medium">Đang làm</div>
                </div>
                <div className="rounded-lg bg-purple-50/70 p-1.5 border border-purple-100">
                  <div className="text-sm font-black text-purple-700">
                    {taskStats ? taskStats.inReviewTasks : '---'}
                  </div>
                  <div className="text-3xs text-purple-800 font-medium">Duyệt</div>
                </div>
                <div className="rounded-lg bg-amber-50/70 p-1.5 border border-amber-100">
                  <div className="text-sm font-black text-amber-700">
                    {taskStats ? taskStats.todoTasks : '---'}
                  </div>
                  <div className="text-3xs text-amber-800 font-medium">Cần làm</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Box 3: Treasury Position */}
          <Card className="border-slate-200/90 shadow-2xs bg-white">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold text-slate-900">Vị thế Ngân sách & Sổ quỹ</CardTitle>
                  <CardDescription className="text-2xs text-slate-500">
                    Kiểm soát thu chi minh bạch
                  </CardDescription>
                </div>
              </div>
              <Link
                to="/finance"
                className="text-2xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Sổ quỹ tài chính</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-medium text-slate-600">Số dư khả dụng</span>
                <span className={`text-base font-black ${balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatVND(balance)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                  <span className="text-2xs text-slate-600 flex items-center">
                    <ArrowUpRight className="w-3 h-3 text-emerald-600 mr-1" />
                    Tổng thu
                  </span>
                  <span className="font-bold text-emerald-700">{formatVND(totalIncome)}</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                  <span className="text-2xs text-slate-600 flex items-center">
                    <ArrowDownRight className="w-3 h-3 text-rose-600 mr-1" />
                    Tổng chi
                  </span>
                  <span className="font-bold text-rose-700">{formatVND(totalExpense)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Box 4: Member Roster */}
          <Card className="border-slate-200/90 shadow-2xs bg-white">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold text-slate-900">Quy mô Hội viên & Nhân sự</CardTitle>
                  <CardDescription className="text-2xs text-slate-500">
                    {memberCount} hồ sơ hội viên
                  </CardDescription>
                </div>
              </div>
              <Link
                to="/members"
                className="text-2xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Danh sách hội viên</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-lg bg-emerald-50/70 p-2 border border-emerald-100">
                  <div className="text-base font-black text-emerald-700">{activeMemberCount}</div>
                  <div className="text-2xs text-emerald-800 font-medium">Hoạt động</div>
                </div>
                <div className="rounded-lg bg-indigo-50/70 p-2 border border-indigo-100">
                  <div className="text-base font-black text-indigo-700">
                    {memberStats ? memberStats.alumniMembers : Math.max(0, memberCount - activeMemberCount)}
                  </div>
                  <div className="text-2xs text-indigo-800 font-medium">Cựu hội viên</div>
                </div>
              </div>

              {currentTerm && (
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-2xs">
                  <span className="text-slate-500">Nhân sự trong nhiệm kỳ {currentTerm.name}:</span>
                  <span className="font-bold text-indigo-700">{currentTerm.memberCount} thành viên</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Consolidated Executive Summary Table */}
      <Card className="border-slate-200/90 shadow-2xs bg-white">
        <CardHeader className="p-4 pb-3 border-b border-slate-100">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Bảng Tổng hợp Chỉ số Điều hành Chi hội
          </CardTitle>
          <CardDescription className="text-2xs text-slate-500">
            Bảng tra cứu nhanh các chỉ số cốt lõi phục vụ báo cáo Ban Chấp hành và Đoàn cấp trên
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                <tr>
                  <th className="py-2.5 px-4">Lĩnh vực báo cáo</th>
                  <th className="py-2.5 px-3">Chỉ số chính</th>
                  <th className="py-2.5 px-3">Chỉ số chi tiết</th>
                  <th className="py-2.5 px-3">Đánh giá vận hành</th>
                  <th className="py-2.5 px-4 text-right">Điều hướng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    Nhân sự & Hội viên
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-800">
                    {memberCount} hội viên
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-2xs">
                    {activeMemberCount} hoạt động ({memberCount > 0 ? Math.round((activeMemberCount / memberCount) * 100) : 0}%)
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      Ổn định
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to="/members" className="text-2xs font-semibold text-blue-600 hover:text-blue-800">
                      Xem danh sách
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Hoạt động & Sự kiện
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-800">
                    {activityCount} chương trình
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-2xs">
                    {activityStats?.completedActivities || 0} đã xong • {activityStats?.inProgressActivities || 0} đang diễn ra
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                      Tích cực
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to="/activities" className="text-2xs font-semibold text-amber-600 hover:text-amber-800">
                      Xem chương trình
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    Thực thi Nhiệm vụ
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-800">
                    {taskCount} nhiệm vụ
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-2xs">
                    Tỷ lệ xong: {taskStats?.completionRate || 0}% • {taskStats?.overdueTasks || 0} trễ hạn
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold ${
                      (taskStats?.overdueTasks || 0) > 0
                        ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    }`}>
                      {(taskStats?.overdueTasks || 0) > 0 ? 'Cần đôn đốc' : 'Đúng tiến độ'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to="/tasks" className="text-2xs font-semibold text-indigo-600 hover:text-indigo-800">
                      Xem bảng việc
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                    Tài chính & Ngân sách
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-800">
                    {formatVND(balance)}
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-2xs">
                    Thu: {formatVND(totalIncome)} • Chi: {formatVND(totalExpense)}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold ${
                      balance >= 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    }`}>
                      {balance >= 0 ? 'Thặng dư an toàn' : 'Thâm hụt'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to="/finance" className="text-2xs font-semibold text-emerald-600 hover:text-emerald-800">
                      Xem sổ quỹ
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
