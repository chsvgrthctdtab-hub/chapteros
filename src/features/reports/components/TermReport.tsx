import { useReportTermStats } from '../reports.queries';
import { ReportSkeleton } from './ReportSkeleton';
import { ReportErrorState } from './ReportErrorState';
import { ReportEmptyState } from './ReportEmptyState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Layers, CheckCircle2, Clock, Archive, FileEdit, Star, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { formatVND } from '@/features/dashboard/utils/formatters';
import dayjs from 'dayjs';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface TermReportProps {
  organizationId?: string;
}

export function TermReport({ organizationId }: TermReportProps) {
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useReportTermStats(organizationId);

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (isError) {
    return (
      <ReportErrorState
        message={error instanceof Error ? error.message : 'Lỗi khi tải thống kê nhiệm kỳ'}
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (!stats || stats.totalTerms === 0) {
    return (
      <ReportEmptyState
        title="Chưa có dữ liệu nhiệm kỳ"
        description="Chi hội chưa tạo nhiệm kỳ nào trong hệ thống."
      />
    );
  }

  const {
    totalTerms,
    draftTerms,
    activeTerms,
    completedTerms,
    archivedTerms,
    termsList,
  } = stats;

  const comparisonChartData = termsList.map((t) => ({
    name: t.name,
    members: t.memberCount,
    activities: t.activityCount,
    tasks: t.taskCount,
    balance: t.balance,
  }));

  return (
    <div className="space-y-6" id="term-report-section">
      {/* 1. KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Tổng nhiệm kỳ</span>
              <Layers className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-2 text-xl font-black text-slate-900">{totalTerms}</div>
            <div className="mt-0.5 text-3xs text-slate-400">Toàn bộ lịch sử</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-emerald-600">Đang diễn ra</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-2 text-xl font-black text-emerald-700">{activeTerms}</div>
            <div className="mt-0.5 text-3xs text-emerald-600 font-semibold">Nhiệm kỳ hiện tại</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-indigo-600">Đã hoàn thành</span>
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="mt-2 text-xl font-black text-indigo-700">{completedTerms}</div>
            <div className="mt-0.5 text-3xs text-slate-400">Đã kết thúc kỳ</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Dự thảo</span>
              <FileEdit className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-2 text-xl font-black text-slate-700">{draftTerms}</div>
            <div className="mt-0.5 text-3xs text-slate-400">Đang chuẩn bị</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Lưu trữ</span>
              <Archive className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-2 text-xl font-black text-slate-700">{archivedTerms}</div>
            <div className="mt-0.5 text-3xs text-slate-400">Đóng hồ sơ</div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Cross-Term Activity & Personnel Evolution Chart */}
      {comparisonChartData.length > 0 && (
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
              So sánh Quy mô Hoạt động & Nhân sự qua các Nhiệm kỳ
            </CardTitle>
            <CardDescription className="text-2xs text-slate-500">
              Biểu đồ đối sánh số lượng nhân sự BCH, sự kiện tổ chức và nhiệm vụ phân công
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val: string) => (
                      <span className="text-2xs font-medium text-slate-700">
                        {val === 'members' ? 'Nhân sự' : val === 'activities' ? 'Hoạt động' : 'Nhiệm vụ'}
                      </span>
                    )}
                  />
                  <Bar dataKey="members" name="members" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="activities" name="activities" fill="#0284c7" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="tasks" name="tasks" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Comprehensive Comparative Terms Table */}
      <Card className="border-slate-200/90 shadow-2xs bg-white">
        <CardHeader className="p-4 pb-3 border-b border-slate-100">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Bảng Ma trận So sánh Toàn diện qua các Nhiệm kỳ
          </CardTitle>
          <CardDescription className="text-2xs text-slate-500">
            Tổng hợp đối sánh quy mô nhân sự, sự kiện, khối lượng công việc và tình hình ngân sách từng nhiệm kỳ
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[760px]">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                <tr>
                  <th className="py-2.5 px-4">Nhiệm kỳ</th>
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3 text-center">Nhân sự</th>
                  <th className="py-2.5 px-3 text-center">Hoạt động</th>
                  <th className="py-2.5 px-3 text-center">Nhiệm vụ</th>
                  <th className="py-2.5 px-3 text-right">Tổng thu</th>
                  <th className="py-2.5 px-3 text-right">Tổng chi</th>
                  <th className="py-2.5 px-4 text-right">Số dư</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {termsList.map((term) => {
                  const isCurrent = term.isCurrent || term.status === 'active';
                  const isSurplus = term.balance >= 0;
                  return (
                    <tr
                      key={term.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCurrent ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          {isCurrent && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                          <span>{term.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-2xs text-slate-500">
                        {term.startDate ? dayjs(term.startDate).format('DD/MM/YYYY') : '---'}
                        {' → '}
                        {term.endDate ? dayjs(term.endDate).format('DD/MM/YYYY') : '---'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold border ${
                            term.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : term.status === 'completed'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {term.status === 'active'
                            ? 'Hiện tại'
                            : term.status === 'completed'
                            ? 'Đã kết thúc'
                            : term.status === 'draft'
                            ? 'Dự thảo'
                            : 'Lưu trữ'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800">
                        {term.memberCount}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800">
                        {term.activityCount}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800">
                        {term.taskCount}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-emerald-600 text-2xs">
                        {formatVND(term.totalIncome)}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-rose-600 text-2xs">
                        {formatVND(term.totalExpense)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${
                          isSurplus ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatVND(term.balance)}
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
