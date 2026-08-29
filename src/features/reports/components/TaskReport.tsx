import { useReportTaskStats } from '../reports.queries';
import type { ReportFilterParams } from '@/types/report';
import { ReportSkeleton } from './ReportSkeleton';
import { ReportErrorState } from './ReportErrorState';
import { ReportEmptyState } from './ReportEmptyState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckSquare, CheckCircle2, PlayCircle, Clock, AlertTriangle, ArrowRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface TaskReportProps {
  organizationId?: string;
  filterParams?: ReportFilterParams;
}

const PRIORITY_META: Record<string, { label: string; color: string; badgeClass: string }> = {
  urgent: { label: 'Khẩn cấp', color: '#e11d48', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  high: { label: 'Ưu tiên cao', color: '#f59e0b', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  medium: { label: 'Trung bình', color: '#3b82f6', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  low: { label: 'Thấp', color: '#94a3b8', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const STATUS_META: Record<string, { label: string; color: string; badgeClass: string }> = {
  completed: { label: 'Đã hoàn thành', color: '#10b981', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_progress: { label: 'Đang thực hiện', color: '#3b82f6', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_review: { label: 'Đang chờ duyệt', color: '#8b5cf6', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  todo: { label: 'Cần làm', color: '#f59e0b', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelled: { label: 'Đã hủy', color: '#94a3b8', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export function TaskReport({ organizationId, filterParams }: TaskReportProps) {
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useReportTaskStats(organizationId, filterParams);

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (isError) {
    return (
      <ReportErrorState
        message={error instanceof Error ? error.message : 'Lỗi khi tải thống kê nhiệm vụ'}
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (!stats || stats.totalTasks === 0) {
    return (
      <ReportEmptyState
        title="Chưa có dữ liệu nhiệm vụ"
        description="Không tìm thấy nhiệm vụ phân công nào phù hợp với bộ lọc đang chọn."
      />
    );
  }

  const {
    totalTasks,
    completedTasks,
    inProgressTasks,
    inReviewTasks,
    todoTasks,
    cancelledTasks,
    overdueTasks,
    completionRate,
    averageProgress,
    byPriority,
    byStatus,
  } = stats;

  const ongoingTasks = inProgressTasks + inReviewTasks;

  // Format Status for PieChart
  const statusPieData = byStatus.map((s) => ({
    name: STATUS_META[s.status]?.label || s.status,
    count: s.count,
    color: STATUS_META[s.status]?.color || '#94a3b8',
  }));

  // Format Priority for BarChart
  const priorityBarData = byPriority.map((p) => ({
    priority: PRIORITY_META[p.priority]?.label || p.priority,
    count: p.count,
    color: PRIORITY_META[p.priority]?.color || '#3b82f6',
  }));

  return (
    <div className="space-y-6" id="task-report-section">
      {/* Overdue Warning Alert Banner if overdue > 0 */}
      {overdueTasks > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm">
                Điểm nghẽn tiến độ: Có {overdueTasks} nhiệm vụ đang bị trễ hạn chót!
              </span>
              <p className="text-2xs text-rose-700 mt-0.5">
                Các nhiệm vụ chưa hoàn thành và đã quá hạn cần được Ban Chấp hành đôn đốc nhân sự phụ trách xử lý ngay.
              </p>
            </div>
          </div>
          <Link
            to="/tasks"
            className="shrink-0 inline-flex items-center gap-1 text-2xs font-semibold px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-2xs self-start sm:self-center"
          >
            <span>Mở bảng nhiệm vụ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 1. KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Tổng đầu việc</span>
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-2 text-xl font-black text-slate-900">{totalTasks}</div>
            <div className="mt-0.5 text-3xs text-slate-400">Đã giao cho nhân sự</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-emerald-600">Đã hoàn thành</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-2 text-xl font-black text-emerald-700">{completedTasks}</div>
            <div className="mt-0.5 text-3xs text-emerald-600 font-semibold">{completionRate}% tỷ lệ hoàn tất</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-blue-600">Đang triển khai</span>
              <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-2 text-xl font-black text-blue-700">{ongoingTasks}</div>
            <div className="mt-0.5 text-3xs text-slate-400">{inProgressTasks} đang làm • {inReviewTasks} chờ duyệt</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-amber-600">Cần làm</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-2 text-xl font-black text-amber-700">{todoTasks}</div>
            <div className="mt-0.5 text-3xs text-slate-400">Chưa bắt đầu</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-rose-600">Quá hạn</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className={`mt-2 text-xl font-black ${overdueTasks > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
              {overdueTasks}
            </div>
            <div className="mt-0.5 text-3xs text-slate-400">Vượt quá hạn chót</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-purple-600">Tiến độ TB</span>
              <div className="w-3.5 h-3.5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-3xs font-bold">%</div>
            </div>
            <div className="mt-2 text-xl font-black text-purple-700">{averageProgress}%</div>
            <div className="mt-0.5 text-3xs text-slate-400">Toàn bộ danh mục</div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution Pie Chart */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Phân bổ Trạng thái Nhiệm vụ
            </CardTitle>
            <CardDescription className="text-2xs text-slate-500">
              Tỷ lệ hoàn thành và các giai đoạn thực hiện công việc
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val} nhiệm vụ`, 'Số lượng']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val: string) => <span className="text-2xs font-medium text-slate-700">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution Bar Chart */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Phân loại theo Mức độ Ưu tiên
            </CardTitle>
            <CardDescription className="text-2xs text-slate-500">
              Khối lượng công việc theo mức độ khẩn cấp
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {priorityBarData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityBarData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis dataKey="priority" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={90} />
                    <Tooltip
                      formatter={(val: number) => [`${val} nhiệm vụ`, 'Số lượng']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16}>
                      {priorityBarData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                Chưa có số liệu ưu tiên
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Detailed Task Status Table */}
      <Card className="border-slate-200/90 shadow-2xs bg-white">
        <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Bảng Tổng kết Thực thi Nhiệm vụ theo Trạng thái
            </CardTitle>
            <CardDescription className="text-2xs text-slate-500">
              Chi tiết số lượng và tỷ trọng các giai đoạn xử lý công việc
            </CardDescription>
          </div>
          <Link
            to="/tasks"
            className="text-2xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Mở bảng nhiệm vụ Kanban</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                <tr>
                  <th className="py-2.5 px-4">Trạng thái nhiệm vụ</th>
                  <th className="py-2.5 px-3 text-center">Số lượng</th>
                  <th className="py-2.5 px-3 text-center">Tỷ trọng</th>
                  <th className="py-2.5 px-4 text-right">Điều hướng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {byStatus.map((st) => {
                  const percentage = totalTasks > 0 ? Math.round((st.count / totalTasks) * 100) : 0;
                  const meta = STATUS_META[st.status] || { label: st.status, badgeClass: 'bg-slate-100 text-slate-700' };
                  return (
                    <tr key={st.status} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold border ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        {st.count}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-2xs text-slate-500 font-medium">{percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to="/tasks"
                          className="text-2xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Xem danh sách việc
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
