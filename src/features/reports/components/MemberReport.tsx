import { useReportMemberStats } from '../reports.queries';
import { ReportSkeleton } from './ReportSkeleton';
import { ReportErrorState } from './ReportErrorState';
import { ReportEmptyState } from './ReportEmptyState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, UserCheck, UserMinus, GraduationCap, ArrowRightLeft, ShieldCheck, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface MemberReportProps {
  organizationId?: string;
  termId?: string;
}

const STATUS_COLORS = {
  active: '#10b981',
  inactive: '#94a3b8',
  alumni: '#6366f1',
  transferred: '#f59e0b',
};

const CHART_COLORS = ['#0284c7', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b'];

export function MemberReport({ organizationId, termId }: MemberReportProps) {
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useReportMemberStats(organizationId, termId);

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (isError) {
    return (
      <ReportErrorState
        message={error instanceof Error ? error.message : 'Lỗi khi tải thống kê hội viên'}
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (!stats || stats.totalMembers === 0) {
    return (
      <ReportEmptyState
        title="Chưa có dữ liệu hội viên"
        description="Chi hội chưa có hồ sơ hội viên nào trong hệ thống hoặc không tìm thấy bản ghi phù hợp."
      />
    );
  }

  const {
    totalMembers,
    activeMembers,
    alumniMembers,
    transferredMembers,
    positionDistribution,
    majorDistribution,
    cohortDistribution,
    termMembersCount,
    termMembersByDepartment,
    termMembersByPosition,
  } = stats;

  const activeRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;

  const statusData = [
    { name: 'Đang hoạt động', count: activeMembers, color: STATUS_COLORS.active },
    { name: 'Cựu hội viên', count: alumniMembers, color: STATUS_COLORS.alumni },
  ].filter((item) => item.count > 0);

  // Position chart data
  const positionChartData = positionDistribution.slice(0, 6).map((p) => ({
    position: p.position || 'Hội viên',
    count: p.count,
  }));

  return (
    <div className="space-y-6" id="member-report-section">
      {/* 1. KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Tổng hội viên</span>
              <Users className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-2 text-xl font-black text-slate-900">{totalMembers}</div>
            <div className="mt-0.5 text-3xs text-slate-400">Tất cả hồ sơ</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-emerald-600">Đang hoạt động</span>
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-2 text-xl font-black text-emerald-700">{activeMembers}</div>
            <div className="mt-0.5 text-3xs text-emerald-600 font-semibold">{activeRate}% tỷ lệ duy trì</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-indigo-600">Cựu hội viên</span>
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="mt-2 text-xl font-black text-indigo-700">{alumniMembers}</div>
            <div className="mt-0.5 text-3xs text-slate-400">Đã tốt nghiệp</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-amber-600">Chuyển sinh hoạt</span>
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-2 text-xl font-black text-amber-700">{transferredMembers}</div>
            <div className="mt-0.5 text-3xs text-slate-400">Chuyển chi hội khác</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-purple-600">Nhân sự nhiệm kỳ</span>
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="mt-2 text-xl font-black text-purple-700">
              {termMembersCount !== null ? termMembersCount : '---'}
            </div>
            <div className="mt-0.5 text-3xs text-slate-400">BCH & Ban chuyên môn</div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Member Status Pie Chart */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Phân bổ Tình trạng Sinh hoạt Hội viên
            </CardTitle>
            <CardDescription className="text-2xs text-slate-500">
              Cơ cấu nhân sự đang hoạt động và cựu hội viên
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val} người`, 'Số lượng']}
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

        {/* Position Distribution Bar Chart */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Cơ cấu Chức vụ & Vị trí Phụ trách
            </CardTitle>
            <CardDescription className="text-2xs text-slate-500">
              Phân bổ nhân sự theo từng chức danh trong Chi hội
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {positionChartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={positionChartData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis dataKey="position" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={100} />
                    <Tooltip
                      formatter={(val: number) => [`${val} thành viên`, 'Số lượng']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                Chưa có số liệu chức vụ
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Demographics breakdown: Majors & Cohorts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Majors Breakdown */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Phân bổ theo Chuyên ngành Học
              </CardTitle>
              <CardDescription className="text-2xs text-slate-500">
                {majorDistribution.length} chuyên ngành ghi nhận
              </CardDescription>
            </div>
            <Link to="/members" className="text-2xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <span>Hồ sơ hội viên</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-2xs sticky top-0">
                <tr>
                  <th className="py-2 px-4">Chuyên ngành</th>
                  <th className="py-2 px-3 text-center">Hội viên</th>
                  <th className="py-2 px-4 text-right">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {majorDistribution.length > 0 ? (
                  majorDistribution.map((m) => {
                    const pct = totalMembers > 0 ? Math.round((m.count / totalMembers) * 100) : 0;
                    return (
                      <tr key={m.major} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-4 font-semibold text-slate-800">{m.major}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-900">{m.count}</td>
                        <td className="py-2 px-4 text-right text-2xs text-slate-500 font-medium">{pct}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-xs text-slate-400">
                      Chưa có dữ liệu chuyên ngành
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Cohort Breakdown */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Phân bổ theo Khóa sinh viên
              </CardTitle>
              <CardDescription className="text-2xs text-slate-500">
                {cohortDistribution.length} khóa tuyển sinh tham gia
              </CardDescription>
            </div>
            <Link to="/members" className="text-2xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <span>Hồ sơ hội viên</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-2xs sticky top-0">
                <tr>
                  <th className="py-2 px-4">Khóa</th>
                  <th className="py-2 px-3 text-center">Hội viên</th>
                  <th className="py-2 px-4 text-right">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cohortDistribution.length > 0 ? (
                  cohortDistribution.map((c) => {
                    const pct = totalMembers > 0 ? Math.round((c.count / totalMembers) * 100) : 0;
                    return (
                      <tr key={c.cohort} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-4 font-semibold text-slate-800">Khóa {c.cohort}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-900">{c.count}</td>
                        <td className="py-2 px-4 text-right text-2xs text-slate-500 font-medium">{pct}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-xs text-slate-400">
                      Chưa có dữ liệu khóa sinh viên
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* 4. Term Department Structure (if term selected and data available) */}
      {termMembersByDepartment.length > 0 && (
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Cơ cấu Ban Chuyên môn trong Nhiệm kỳ
              </CardTitle>
              <CardDescription className="text-2xs text-slate-500">
                Phân bổ nhân lực Ban Chấp hành theo các ban chuyên môn
              </CardDescription>
            </div>
            <span className="text-2xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {termMembersCount} nhân sự
            </span>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {termMembersByDepartment.map((dept) => (
                <div key={dept.department} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{dept.department}</span>
                    <span className="text-2xs text-slate-500">Ban chuyên môn</span>
                  </div>
                  <div className="text-base font-black text-indigo-700">
                    {dept.count} <span className="text-2xs font-normal text-slate-500">người</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
