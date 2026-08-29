import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { formatVND } from '../utils/formatters';
import type { DashboardChartData } from '../types/dashboard.types';

interface DashboardChartsSectionProps {
  chartData: DashboardChartData;
  isLoading?: boolean;
}

export function DashboardChartsSection({ chartData, isLoading = false }: DashboardChartsSectionProps) {
  const { taskStatusDistribution, activityCategoryDistribution, monthlyFinanceTrend } = chartData;

  const totalTasks = taskStatusDistribution.reduce((acc, curr) => acc + curr.count, 0);
  const totalActivities = activityCategoryDistribution.reduce((acc, curr) => acc + curr.count, 0);
  const hasFinanceData = monthlyFinanceTrend.some((item) => item.income > 0 || item.expense > 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 rounded-xl bg-slate-100 animate-pulse" />
        <div className="h-72 rounded-xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
      {/* Chart 1: Monthly Cashflow Trend */}
      <Card className="border-slate-200/90 shadow-2xs rounded-xl bg-white">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Xu hướng Thu - Chi (6 tháng gần nhất)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Biến động dòng tiền quỹ Chi hội theo từng tháng
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 pt-3.5">
          {hasFinanceData ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyFinanceTrend}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return val;
                    }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-md text-xs space-y-1.5">
                            <div className="font-bold text-slate-900 mb-1">Tháng {label}</div>
                            {payload.map((entry: any, index: number) => (
                              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                  {entry.name === 'income' ? 'Tổng thu' : 'Tổng chi'}:
                                </span>
                                <span className="font-bold font-mono text-slate-900">
                                  {formatVND(entry.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                    formatter={(value) => (value === 'income' ? 'Tổng thu' : 'Tổng chi')}
                  />
                  <Bar dataKey="income" name="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="expense" name="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <BarChart3 className="w-9 h-9 text-slate-300 mb-2" />
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Chưa có dữ liệu phát sinh giao dịch thu chi</p>
              <p className="text-xs text-slate-400 mt-0.5">Các giao dịch 6 tháng gần nhất sẽ hiển thị tại đây</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Task Status Distribution */}
      <Card className="border-slate-200/90 shadow-2xs rounded-xl bg-white">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Phân bố Trạng thái Công việc
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Tổng quan tình trạng xử lý các nhiệm vụ trong nhiệm kỳ
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 pt-3.5">
          {totalTasks > 0 ? (
            <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-center gap-5">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusDistribution.filter((i) => i.count > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {taskStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percentage = ((data.count / totalTasks) * 100).toFixed(0);
                          return (
                            <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-md text-xs">
                              <span className="font-semibold text-slate-800">{data.name}: </span>
                              <span className="font-bold font-mono text-slate-900">{data.count} ({percentage}%)</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-2 text-xs w-full">
                {taskStatusDistribution.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold font-mono text-slate-900">
                      {item.count}{' '}
                      <span className="text-[11px] font-normal text-slate-400">
                        ({totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <PieIcon className="w-9 h-9 text-slate-300 mb-2" />
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Chưa có dữ liệu công việc</p>
              <p className="text-xs text-slate-400 mt-0.5">Phân bố trạng thái sẽ tự động xuất hiện khi giao việc</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
