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
        <Card className="h-full rounded-2xl border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Members
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-100/90 text-slate-600 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors shadow-2xs">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold font-mono text-slate-900 tracking-tight leading-tight">
                  {members.active}
                  <span className="text-xs font-normal text-slate-400 ml-1.5 font-sans">active</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Total records: <span className="font-semibold text-slate-700">{members.total}</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-emerald-700 transition-colors">
              <span>View directory</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 2. Hoạt động quản lý */}
      <Link to="/activities" className="group block focus:outline-none">
        <Card className="h-full rounded-xl border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Activities
                </span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                  <CalendarCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold font-mono text-slate-900 tracking-tight leading-tight">
                  {activities.total}
                  <span className="text-xs font-normal text-slate-400 ml-1.5 font-sans">total</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  {activities.upcoming > 0 ? (
                    <span className="inline-flex items-center text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md text-[11px]">
                      <Sparkles className="w-3 h-3 mr-1 text-blue-600" />
                      {activities.upcoming} upcoming
                    </span>
                  ) : (
                    <span>{activities.completed} completed</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-blue-700 transition-colors">
              <span>View activities</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 3. Nhiệm vụ đang thực hiện */}
      <Link to="/tasks" className="group block focus:outline-none">
        <Card className="h-full rounded-xl border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Active Tasks
                </span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-amber-50 group-hover:text-amber-700 transition-colors">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold font-mono text-slate-900 tracking-tight leading-tight">
                  {tasks.active}
                  <span className="text-xs font-normal text-slate-400 ml-1.5 font-sans">in progress</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <span>Rate:</span>
                  <span className="font-semibold text-amber-700">{tasks.completionRate}%</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-amber-700 transition-colors">
              <span>Task board</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 4. Nhiệm vụ quá hạn */}
      <Link to="/tasks?onlyOverdue=true" className="group block focus:outline-none">
        <Card className={`h-full rounded-xl border-slate-200/90 shadow-2xs hover:shadow-xs transition-all duration-150 bg-white ${
          tasks.overdue > 0 ? 'hover:border-rose-300 border-rose-200/80' : 'hover:border-slate-300'
        }`}>
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Overdue Tasks
                </span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  tasks.overdue > 0
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-2.5">
                <div className={`text-2xl sm:text-[28px] font-bold font-mono tracking-tight leading-tight ${
                  tasks.overdue > 0 ? 'text-rose-700' : 'text-slate-900'
                }`}>
                  {tasks.overdue}
                  <span className="text-xs font-normal text-slate-400 ml-1.5 font-sans">overdue</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {tasks.overdue > 0 ? (
                    <Badge variant="destructive" className="text-[11px] px-1.5 py-0.2 font-semibold">
                      Action Required
                    </Badge>
                  ) : (
                    <span className="text-emerald-700 font-semibold">On schedule</span>
                  )}
                </div>
              </div>
            </div>

            <div className={`mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold transition-colors ${
              tasks.overdue > 0 ? 'text-rose-700' : 'text-slate-500 group-hover:text-slate-900'
            }`}>
              <span>{tasks.overdue > 0 ? 'Resolve now' : 'Details'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 5. Số dư quỹ */}
      <Link to="/finance" className="group block focus:outline-none">
        <Card className="h-full rounded-xl border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Treasury Balance
                </span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-2.5">
                <div className={`text-lg sm:text-xl font-bold font-mono tracking-tight truncate leading-tight ${
                  finance.balance >= 0 ? 'text-slate-900' : 'text-rose-700'
                }`}>
                  {formatVND(finance.balance)}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-emerald-700 font-semibold truncate">In: {formatVND(finance.totalIncome)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-emerald-700 transition-colors">
              <span>Ledger & budget</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 6. Tỷ lệ tham gia */}
      <Link to="/reports" className="group block focus:outline-none">
        <Card className="h-full rounded-xl border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Engagement
                </span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold font-mono text-slate-900 tracking-tight leading-tight">
                  {participation.overallRate}%
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate">Avg: {participation.averagePerActivity} members</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-teal-700 transition-colors">
              <span>View reports</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
