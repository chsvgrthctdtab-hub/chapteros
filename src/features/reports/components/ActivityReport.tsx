import { useReportActivityStats } from '../reports.queries';
import type { ReportFilterParams } from '@/types/report';
import { ReportSkeleton } from './ReportSkeleton';
import { ReportErrorState } from './ReportErrorState';
import { ReportEmptyState } from './ReportEmptyState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar, CheckCircle2, PlayCircle, Clock, Target, AlertTriangle, ArrowRight, BarChart3 } from 'lucide-react';
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

interface ActivityReportProps {
  organizationId?: string;
  filterParams?: ReportFilterParams;
}

const CATEGORY_NAMES: Record<string, string> = {
  academic: 'Học thuật',
  volunteer: 'Tình nguyện',
  sports: 'Thể thao',
  culture: 'Văn hóa & Văn nghệ',
  meeting: 'Hội họp & Đại hội',
  training: 'Tập huấn & Kỹ năng',
  general: 'Hoạt động chung',
};

const STATUS_NAMES: Record<string, { label: string; color: string; badgeClass: string }> = {
  completed: { label: 'Đã hoàn thành', color: '#10b981', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_progress: { label: 'Đang diễn ra', color: '#3b82f6', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  published: { label: 'Đã công bố', color: '#6366f1', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  planning: { label: 'Lập kế hoạch', color: '#f59e0b', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  draft: { label: 'Dự thảo', color: '#94a3b8', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  cancelled: { label: 'Đã hủy', color: '#ef4444', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const PALETTE = ['#0284c7', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b'];

export function ActivityReport({ organizationId, filterParams }: ActivityReportProps) {
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useReportActivityStats(organizationId, filterParams);

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (isError) {
    return (
      <ReportErrorState
        message={error instanceof Error ? error.message : 'Lỗi khi tải thống kê hoạt động'}
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (!stats || stats.totalActivities === 0) {
    return (
      <ReportEmptyState
        title="Chưa có dữ liệu hoạt động"
        description="Không tìm thấy chương trình sự kiện nào phù hợp với điều kiện lọc."
      />
    );
  }

  const {
    totalActivities,
    completedActivities,
    inProgressActivities,
    publishedActivities,
    planningActivities,
    draftActivities,
    cancelledActivities,
    byCategory,
    byStatus,
    byMonth,
    totalTargetMembers,
  } = stats;

  const ongoingTotal = inProgressActivities + publishedActivities;
  const planningTotal = planningActivities + draftActivities;
  const completionRate = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  // Format Status for PieChart
  const statusPieData = byStatus.map((s) => ({
    name: STATUS_NAMES[s.status]?.label || s.status,
    count: s.count,
    color: STATUS_NAMES[s.status]?.color || '#94a3b8',
  }));

  // Format Category for BarChart
  const categoryBarData = byCategory.map((c) => ({
    category: CATEGORY_NAMES[c.category] || c.category,
    count: c.count,
  }));

  return (
    <div className="space-y-6" id="activity-report-section">
      {/* 1. KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Tổng sự kiện</span>
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-2 text-xl font-black text-slate-900">{totalActivities}</div>
            <div className="mt-0.5 text-3xs text-slate-400">Tất cả danh mục</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-emerald-600">Hoàn thành</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-2 text-xl font-black text-emerald-700">{completedActivities}</div>
            <div className="mt-0.5 text-3xs text-emerald-600 font-semibold">{completionRate}% tỷ lệ đạt</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-blue-600">Đang triển khai</span>
              <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-2 text-xl font-black text-blue-700">{ongoingTotal}</div>
            <div className="mt-0.5 text-3xs text-slate-400">{inProgressActivities} chạy • {publishedActivities} công bố</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-amber-600">Kế hoạch / Dự thảo</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-2 text-xl font-black text-amber-700">{planningTotal}</div>
            <div className="mt-0.5 text-3xs text-slate-400">{planningActivities} kế hoạch • {draftActivities} nháp</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-rose-600">Đã hủy</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="mt-2 text-xl font-black text-rose-700">{cancelledActivities}</div>
            <div className="mt-0.5 text-3xs text-slate-400">Không tổ chức</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-purple-600">Chỉ tiêu quy mô</span>
              <Target className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="mt-2 text-xl font-black text-purple-700">{totalTargetMembers}</div>
            <div className="mt-0.5 text-3xs text-slate-400">Lượt người tham gia</div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Breakdown Bar Chart */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Phân bổ Hoạt động theo Mảng Nghiệp vụ
            </CardTitle>
            <CardDescription className="text-2xs text-slate-500">
              Số lượng chương trình theo từng loại hình hoạt động
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {categoryBarData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBarData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={90} />
                    <Tooltip
                      formatter={(val: number) => [`${val} hoạt động`, 'Số lượng']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#0284c7" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                Chưa có số liệu danh mục
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Cơ cấu Trạng thái Tiến độ Hoạt động
            </CardTitle>
            <CardDescription className="text-2xs text-slate-500">
              Tỷ lệ phân bổ trạng thái các chương trình
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {statusPieData.length > 0 ? (
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
                      formatter={(val: number) => [`${val} hoạt động`, 'Số lượng']}
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
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                Chưa có số liệu trạng thái
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Monthly Activity Trends */}
      {byMonth.length > 0 && (
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Biến động Mật độ Hoạt động theo Tháng
            </CardTitle>
            <CardDescription className="text-2xs text-slate-500">
              Số lượng sự kiện khởi động theo từng mốc thời gian
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: number) => [`${val} hoạt động`, 'Khởi động']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Detailed Category Breakdown Matrix Table */}
      <Card className="border-slate-200/90 shadow-2xs bg-white">
        <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Bảng Tổng hợp Hiệu suất Hoạt động theo Mảng
            </CardTitle>
            <CardDescription className="text-2xs text-slate-500">
              Chi tiết phân bổ và tỷ trọng từng danh mục hoạt động trong kỳ
            </CardDescription>
          </div>
          <Link
            to="/activities"
            className="text-2xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Mở danh sách hoạt động</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                <tr>
                  <th className="py-2.5 px-4">Mảng hoạt động</th>
                  <th className="py-2.5 px-3 text-center">Số lượng</th>
                  <th className="py-2.5 px-3 text-center">Tỷ trọng</th>
                  <th className="py-2.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {byCategory.map((cat) => {
                  const percentage = totalActivities > 0 ? Math.round((cat.count / totalActivities) * 100) : 0;
                  return (
                    <tr key={cat.category} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {CATEGORY_NAMES[cat.category] || cat.category}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        {cat.count}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-2xs text-slate-500 font-medium">{percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to="/activities"
                          className="text-2xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Xem chi tiết
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
