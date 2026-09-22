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
} from 'lucide-react';
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
        <Card className="h-full rounded-2xl border-hairline shadow-sm hover:shadow-md transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
                  Total Members
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center transition-colors">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold text-ink-navy tracking-tight leading-tight tabular-nums">
                  {members.active}
                  <span className="text-xs font-normal text-slate-gray ml-1.5">active</span>
                </div>
                <div className="text-xs text-slate-gray mt-1">
                  Total records: <span className="font-semibold text-ink-navy tabular-nums">{members.total}</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-hairline flex items-center justify-between text-xs text-slate-gray font-semibold group-hover:text-signal-blue transition-colors">
              <span>View directory</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 2. Hoạt động quản lý */}
      <Link to="/activities" className="group block focus:outline-none">
        <Card className="h-full rounded-2xl border-hairline shadow-sm hover:shadow-md transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
                  Activities
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#e6f0ff] text-signal-blue flex items-center justify-center transition-colors">
                  <CalendarCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold text-ink-navy tracking-tight leading-tight tabular-nums">
                  {activities.total}
                  <span className="text-xs font-normal text-slate-gray ml-1.5">total</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-gray mt-1">
                  {activities.upcoming > 0 ? (
                    <span className="inline-flex items-center text-signal-blue font-semibold bg-[#e6f0ff] border border-hairline px-2 py-0.5 rounded-full text-[11px] tabular-nums">
                      <Sparkles className="w-3 h-3 mr-1 text-signal-blue" />
                      {activities.upcoming} upcoming
                    </span>
                  ) : (
                    <span><span className="tabular-nums font-semibold text-ink-navy">{activities.completed}</span> completed</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-hairline flex items-center justify-between text-xs text-slate-gray font-semibold group-hover:text-signal-blue transition-colors">
              <span>View activities</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 3. Nhiệm vụ đang thực hiện */}
      <Link to="/tasks" className="group block focus:outline-none">
        <Card className="h-full rounded-2xl border-hairline shadow-sm hover:shadow-md transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
                  Active Tasks
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center transition-colors">
                  <CheckSquare className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold text-ink-navy tracking-tight leading-tight tabular-nums">
                  {tasks.active}
                  <span className="text-xs font-normal text-slate-gray ml-1.5">in progress</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-gray mt-1">
                  <span>Rate:</span>
                  <span className="font-semibold text-amber-700 tabular-nums">{tasks.completionRate}%</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-hairline flex items-center justify-between text-xs text-slate-gray font-semibold group-hover:text-signal-blue transition-colors">
              <span>Task board</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 4. Nhiệm vụ quá hạn */}
      <Link to="/tasks?onlyOverdue=true" className="group block focus:outline-none">
        <Card className={`h-full rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 bg-white ${
          tasks.overdue > 0 ? 'border-rose-300' : 'border-hairline'
        }`}>
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
                  Overdue Tasks
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  tasks.overdue > 0
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-pebble text-slate-gray'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2.5">
                <div className={`text-2xl sm:text-[28px] font-bold tracking-tight leading-tight tabular-nums ${
                  tasks.overdue > 0 ? 'text-rose-700' : 'text-ink-navy'
                }`}>
                  {tasks.overdue}
                  <span className="text-xs font-normal text-slate-gray ml-1.5">overdue</span>
                </div>
                <div className="text-xs text-slate-gray mt-1">
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

            <div className={`mt-3.5 pt-2.5 border-t border-hairline flex items-center justify-between text-xs font-semibold transition-colors ${
              tasks.overdue > 0 ? 'text-rose-700' : 'text-slate-gray group-hover:text-signal-blue'
            }`}>
              <span>{tasks.overdue > 0 ? 'Resolve now' : 'Details'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 5. Số dư quỹ */}
      <Link to="/finance" className="group block focus:outline-none">
        <Card className="h-full rounded-2xl border-hairline shadow-sm hover:shadow-md transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
                  Treasury Balance
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center transition-colors">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2.5">
                <div className={`text-lg sm:text-xl font-bold tracking-tight truncate leading-tight tabular-nums ${
                  finance.balance >= 0 ? 'text-ink-navy' : 'text-rose-700'
                }`}>
                  {formatVND(finance.balance)}
                </div>
                <div className="text-xs text-slate-gray mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-emerald-700 font-semibold truncate tabular-nums">In: {formatVND(finance.totalIncome)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-hairline flex items-center justify-between text-xs text-slate-gray font-semibold group-hover:text-signal-blue transition-colors">
              <span>Ledger & budget</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 6. Tỷ lệ tham gia */}
      <Link to="/reports" className="group block focus:outline-none">
        <Card className="h-full rounded-2xl border-hairline shadow-sm hover:shadow-md transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
                  Engagement
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#e6f0ff] text-signal-blue flex items-center justify-center transition-colors">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold text-ink-navy tracking-tight leading-tight tabular-nums">
                  {participation.overallRate}%
                </div>
                <div className="text-xs text-slate-gray mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate">Avg: <span className="tabular-nums font-semibold text-ink-navy">{participation.averagePerActivity}</span> members</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-hairline flex items-center justify-between text-xs text-slate-gray font-semibold group-hover:text-signal-blue transition-colors">
              <span>View reports</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
