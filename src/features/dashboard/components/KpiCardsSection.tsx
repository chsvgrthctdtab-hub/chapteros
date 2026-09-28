import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  CalendarCheck,
  CheckSquare,
  AlertTriangle,
  Wallet,
  UserCheck,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
} from '@/lib/icons';
import { formatVND } from '../utils/formatters';
import type { DashboardStats } from '../types/dashboard.types';

interface KpiCardsSectionProps {
  stats: DashboardStats;
  selectedTermId: string;
}

export function KpiCardsSection({ stats }: KpiCardsSectionProps) {
  const { members, activities, tasks, finance, participation } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
      {/* 1. Tổng hội viên */}
      <Link to="/members" className="group block focus:outline-none">
        <Card className="h-full rounded-2xl border-[#e2e8f0] shadow-xs hover:border-[#b8cce0] hover:shadow-sm transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Total Members
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#fff7ed] text-[#d97706] flex items-center justify-center transition-colors">
                  <Users size={18} />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold text-[#0b3558] tracking-tight leading-tight tabular-nums">
                  {members.active}
                  <span className="text-xs font-normal text-[#64748b] ml-1.5">active</span>
                </div>
                <div className="text-xs text-[#64748b] mt-1">
                  Total records: <span className="font-semibold text-[#1e293b] tabular-nums">{members.total}</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b] font-semibold group-hover:text-[#2e89f7] transition-colors">
              <span>View directory</span>
              <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 2. Hoạt động quản lý */}
      <Link to="/activities" className="group block focus:outline-none">
        <Card className="h-full rounded-2xl border-[#e2e8f0] shadow-xs hover:border-[#b8cce0] hover:shadow-sm transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Activities
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#f0fdfa] text-[#16a6d5] flex items-center justify-center transition-colors">
                  <CalendarCheck size={18} />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold text-[#0b3558] tracking-tight leading-tight tabular-nums">
                  {activities.total}
                  <span className="text-xs font-normal text-[#64748b] ml-1.5">total</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#64748b] mt-1">
                  {activities.upcoming > 0 ? (
                    <span className="inline-flex items-center text-[#1a73e8] font-semibold bg-[#e8f0fe] border border-[#c2e7ff] px-2 py-0.5 rounded-full text-[11px] tabular-nums">
                      <Sparkles size={12} className="mr-1 text-[#1a73e8]" />
                      {activities.upcoming} upcoming
                    </span>
                  ) : (
                    <span><span className="tabular-nums font-semibold text-[#1e293b]">{activities.completed}</span> completed</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b] font-semibold group-hover:text-[#2e89f7] transition-colors">
              <span>View activities</span>
              <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 3. Nhiệm vụ đang thực hiện */}
      <Link to="/tasks" className="group block focus:outline-none">
        <Card className="h-full rounded-2xl border-[#e2e8f0] shadow-xs hover:border-[#b8cce0] hover:shadow-sm transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Active Tasks
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#eff6ff] text-[#2e64de] flex items-center justify-center transition-colors">
                  <CheckSquare size={18} />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold text-[#0b3558] tracking-tight leading-tight tabular-nums">
                  {tasks.active}
                  <span className="text-xs font-normal text-[#64748b] ml-1.5">in progress</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#64748b] mt-1">
                  <span>Rate:</span>
                  <span className="font-semibold text-[#2e64de] tabular-nums">{tasks.completionRate}%</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b] font-semibold group-hover:text-[#2e89f7] transition-colors">
              <span>Task board</span>
              <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 4. Nhiệm vụ quá hạn */}
      <Link to="/tasks?onlyOverdue=true" className="group block focus:outline-none">
        <Card className={`h-full rounded-2xl shadow-xs hover:shadow-sm transition-all duration-200 bg-white ${
          tasks.overdue > 0 ? 'border-rose-300' : 'border-[#e2e8f0]'
        }`}>
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Overdue Tasks
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  tasks.overdue > 0
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-[#f0f4f9] text-[#64748b]'
                }`}>
                  <AlertTriangle size={18} />
                </div>
              </div>

              <div className="mt-2.5">
                <div className={`text-2xl sm:text-[28px] font-bold tracking-tight leading-tight tabular-nums ${
                  tasks.overdue > 0 ? 'text-rose-700' : 'text-[#0b3558]'
                }`}>
                  {tasks.overdue}
                  <span className="text-xs font-normal text-[#64748b] ml-1.5">overdue</span>
                </div>
                <div className="text-xs text-[#64748b] mt-1">
                  {tasks.overdue > 0 ? (
                    <Badge variant="destructive" className="text-[11px] px-2 py-0.5 rounded-full font-semibold">
                      Action Required
                    </Badge>
                  ) : (
                    <span className="text-emerald-700 font-semibold">On schedule</span>
                  )}
                </div>
              </div>
            </div>

            <div className={`mt-3.5 pt-2.5 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-semibold transition-colors ${
              tasks.overdue > 0 ? 'text-rose-700' : 'text-[#64748b] group-hover:text-[#2e89f7]'
            }`}>
              <span>{tasks.overdue > 0 ? 'Resolve now' : 'Details'}</span>
              <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 5. Số dư quỹ */}
      <Link to="/finance" className="group block focus:outline-none">
        <Card className="h-full rounded-2xl border-[#e2e8f0] shadow-xs hover:border-[#b8cce0] hover:shadow-sm transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Treasury Balance
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#fffbeb] text-[#ce7918] flex items-center justify-center transition-colors">
                  <Wallet size={18} />
                </div>
              </div>

              <div className="mt-2.5">
                <div className={`text-lg sm:text-xl font-bold tracking-tight truncate leading-tight tabular-nums ${
                  finance.balance >= 0 ? 'text-[#0b3558]' : 'text-rose-700'
                }`}>
                  {formatVND(finance.balance)}
                </div>
                <div className="text-xs text-[#64748b] mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-emerald-700 font-semibold truncate tabular-nums">In: {formatVND(finance.totalIncome)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b] font-semibold group-hover:text-[#2e89f7] transition-colors">
              <span>Ledger & budget</span>
              <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 6. Tỷ lệ tham gia */}
      <Link to="/reports" className="group block focus:outline-none">
        <Card className="h-full rounded-2xl border-[#e2e8f0] shadow-xs hover:border-[#b8cce0] hover:shadow-sm transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Engagement
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#f5f3ff] text-[#6858d2] flex items-center justify-center transition-colors">
                  <UserCheck size={18} />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold text-[#0b3558] tracking-tight leading-tight tabular-nums">
                  {participation.overallRate}%
                </div>
                <div className="text-xs text-[#64748b] mt-1 flex items-center gap-1">
                  <TrendingUp size={14} className="text-emerald-600" />
                  <span className="truncate">Avg: <span className="tabular-nums font-semibold text-[#1e293b]">{participation.averagePerActivity}</span> members</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b] font-semibold group-hover:text-[#2e89f7] transition-colors">
              <span>View reports</span>
              <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
