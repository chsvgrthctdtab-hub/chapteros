import { useReportFundStats } from '../reports.queries';
import type { ReportFilterParams } from '@/types/report';
import { ReportSkeleton } from './ReportSkeleton';
import { ReportErrorState } from './ReportErrorState';
import { ReportEmptyState } from './ReportEmptyState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Wallet, ArrowUpRight, ArrowDownRight, Scale, Receipt, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatVND } from '@/features/dashboard/utils/formatters';
import { Link } from 'react-router-dom';
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

interface FundReportProps {
  organizationId?: string;
  filterParams?: ReportFilterParams;
}

const INCOME_PALETTE = ['#10b981', '#0284c7', '#6366f1', '#14b8a6', '#06b6d4', '#8b5cf6', '#3b82f6'];
const EXPENSE_PALETTE = ['#f43f5e', '#f97316', '#f59e0b', '#ec4899', '#8b5cf6', '#a855f7', '#64748b'];

export function FundReport({ organizationId, filterParams }: FundReportProps) {
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useReportFundStats(organizationId, filterParams);

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (isError) {
    return (
      <ReportErrorState
        message={error instanceof Error ? error.message : 'Lỗi khi tải thống kê tài chính'}
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (!stats || (stats.totalIncome === 0 && stats.totalExpense === 0 && stats.incomeByCategory.length === 0)) {
    return (
      <ReportEmptyState
        title="Chưa có dữ liệu tài chính"
        description="Không tìm thấy giao dịch thu chi nào phù hợp với bộ lọc đang chọn."
      />
    );
  }

  const {
    totalIncome,
    totalExpense,
    balance,
    incomeTransactionCount,
    expenseTransactionCount,
    incomeByCategory,
    expenseByCategory,
    byMonth,
  } = stats;

  const totalTransactions = incomeTransactionCount + expenseTransactionCount;
  const isSurplus = balance >= 0;

  // Income Pie Chart Data
  const incomePieData = incomeByCategory.map((c, i) => ({
    name: c.categoryName,
    value: c.amount,
    color: INCOME_PALETTE[i % INCOME_PALETTE.length],
  }));

  // Expense Pie Chart Data
  const expensePieData = expenseByCategory.map((c, i) => ({
    name: c.categoryName,
    value: c.amount,
    color: EXPENSE_PALETTE[i % EXPENSE_PALETTE.length],
  }));

  return (
    <div className="space-y-6" id="fund-report-section">
      {/* 1. KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Income */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Tổng nguồn thu</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-700">{formatVND(totalIncome)}</div>
            <div className="mt-0.5 text-2xs text-slate-400">
              {incomeTransactionCount} phiếu thu hợp lệ
            </div>
          </CardContent>
        </Card>

        {/* Total Expense */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Tổng các khoản chi</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-rose-700">{formatVND(totalExpense)}</div>
            <div className="mt-0.5 text-2xs text-slate-400">
              {expenseTransactionCount} phiếu chi đã duyệt
            </div>
          </CardContent>
        </Card>

        {/* Current Balance */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Số dư khả dụng</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSurplus ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className={`mt-2 text-xl sm:text-2xl font-black ${isSurplus ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatVND(balance)}
            </div>
            <div className="mt-0.5 text-2xs text-slate-400">
              {isSurplus ? 'Thặng dư ngân sách an toàn' : 'Cảnh báo thâm hụt quỹ'}
            </div>
          </CardContent>
        </Card>

        {/* Transactions summary */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Tổng số giao dịch</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900">{totalTransactions}</div>
            <div className="mt-0.5 text-2xs text-slate-400">
              {incomeTransactionCount} thu • {expenseTransactionCount} chi
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Monthly Financial Trend Chart */}
      {byMonth.length > 0 && (
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Biến động Dòng tiền Thu & Chi theo Tháng
              </CardTitle>
              <CardDescription className="text-2xs text-slate-500">
                So sánh tổng thu và tổng chi qua từng kỳ kế toán
              </CardDescription>
            </div>
            <Link
              to="/finance"
              className="text-2xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Mở sổ quỹ tài chính</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val: number) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return String(val);
                    }}
                  />
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      formatVND(val),
                      name === 'income' ? 'Tổng thu' : name === 'expense' ? 'Tổng chi' : 'Số dư',
                    ]}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val: string) => (
                      <span className="text-2xs font-medium text-slate-700">
                        {val === 'income' ? 'Khoản thu' : val === 'expense' ? 'Khoản chi' : 'Số dư'}
                      </span>
                    )}
                  />
                  <Bar dataKey="income" name="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="expense" name="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Category Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income by Category */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Cơ cấu Nguồn thu theo Danh mục
            </CardTitle>
            <CardDescription className="text-2xs text-slate-500">
              Tỷ trọng các nguồn tiền tài trợ, hội phí và đóng góp
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {incomePieData.length > 0 ? (
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {incomePieData.map((entry, index) => (
                        <Cell key={`income-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatVND(val), 'Số tiền']}
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
                Chưa có dữ liệu nguồn thu
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense by Category */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Cơ cấu Khoản chi theo Danh mục
            </CardTitle>
            <CardDescription className="text-2xs text-slate-500">
              Tỷ trọng các chi phí tổ chức sự kiện, hậu cần và văn phòng phẩm
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {expensePieData.length > 0 ? (
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {expensePieData.map((entry, index) => (
                        <Cell key={`expense-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatVND(val), 'Số tiền']}
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
                Chưa có dữ liệu khoản chi
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Detailed Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income Table */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Bảng Thống kê Nguồn thu theo Danh mục
              </CardTitle>
              <CardDescription className="text-2xs text-slate-500">
                {incomeByCategory.length} hạng mục thu được ghi nhận
              </CardDescription>
            </div>
            <Link to="/finance" className="text-2xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
              <span>Sổ thu</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                <tr>
                  <th className="py-2.5 px-4">Danh mục thu</th>
                  <th className="py-2.5 px-3 text-right">Số tiền</th>
                  <th className="py-2.5 px-3 text-center">Tỷ trọng</th>
                  <th className="py-2.5 px-4 text-center">Số GD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomeByCategory.length > 0 ? (
                  incomeByCategory.map((c) => (
                    <tr key={c.categoryId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{c.categoryName}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatVND(c.amount)}</td>
                      <td className="py-2.5 px-3 text-center text-2xs text-slate-500 font-medium">{c.percentage}%</td>
                      <td className="py-2.5 px-4 text-center text-2xs text-slate-600">{c.count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-slate-400">
                      Chưa có giao dịch thu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Expense Table */}
        <Card className="border-slate-200/90 shadow-2xs bg-white">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Bảng Thống kê Khoản chi theo Danh mục
              </CardTitle>
              <CardDescription className="text-2xs text-slate-500">
                {expenseByCategory.length} hạng mục chi đã thanh toán
              </CardDescription>
            </div>
            <Link to="/finance" className="text-2xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1">
              <span>Sổ chi</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                <tr>
                  <th className="py-2.5 px-4">Danh mục chi</th>
                  <th className="py-2.5 px-3 text-right">Số tiền</th>
                  <th className="py-2.5 px-3 text-center">Tỷ trọng</th>
                  <th className="py-2.5 px-4 text-center">Số GD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenseByCategory.length > 0 ? (
                  expenseByCategory.map((c) => (
                    <tr key={c.categoryId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{c.categoryName}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-700">{formatVND(c.amount)}</td>
                      <td className="py-2.5 px-3 text-center text-2xs text-slate-500 font-medium">{c.percentage}%</td>
                      <td className="py-2.5 px-4 text-center text-2xs text-slate-600">{c.count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-slate-400">
                      Chưa có giao dịch chi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
