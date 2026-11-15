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
        <Card className="h-full rounded-2xl border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Tổng hội viên
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1a73e8] border border-blue-100/80 flex items-center justify-center transition-colors">
                  <Users size={18} />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold text-[#0b3558] tracking-tight leading-tight tabular-nums">
                  {members.active}
                  <span className="text-xs font-normal text-slate-500 ml-1.5">đang hoạt động</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Tổng hồ sơ: <span className="font-semibold text-slate-800 tabular-nums">{members.total}</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-[#1a73e8] transition-colors">
              <span>Xem danh sách</span>
              <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 2. Hoạt động quản lý */}
      <Link to="/activities" className="group block focus:outline-none">
        <Card className="h-full rounded-2xl border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Hoạt động phong trào
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100/80 flex items-center justify-center transition-colors">
                  <CalendarCheck size={18} />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold text-[#0b3558] tracking-tight leading-tight tabular-nums">
                  {activities.total}
                  <span className="text-xs font-normal text-slate-500 ml-1.5">tổng cộng</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  {activities.upcoming > 0 ? (
                    <span className="inline-flex items-center text-[#1a73e8] font-semibold bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full text-[11px] tabular-nums">
                      <Sparkles size={12} className="mr-1 text-[#1a73e8]" />
                      {activities.upcoming} sắp tới
                    </span>
                  ) : (
                    <span><span className="tabular-nums font-semibold text-slate-800">{activities.completed}</span> đã diễn ra</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-[#1a73e8] transition-colors">
              <span>Xem hoạt động</span>
              <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 3. Nhiệm vụ đang thực hiện */}
      <Link to="/tasks" className="group block focus:outline-none">
        <Card className="h-full rounded-2xl border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Nhiệm vụ đang làm
                </span>
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-100/80 flex items-center justify-center transition-colors">
                  <CheckSquare size={18} />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold text-[#0b3558] tracking-tight leading-tight tabular-nums">
                  {tasks.active}
                  <span className="text-xs font-normal text-slate-500 ml-1.5">đang thực hiện</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <span>Tiến độ:</span>
                  <span className="font-semibold text-sky-700 tabular-nums">{tasks.completionRate}%</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-[#1a73e8] transition-colors">
              <span>Bảng nhiệm vụ</span>
              <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 4. Nhiệm vụ quá hạn */}
      <Link to="/tasks?onlyOverdue=true" className="group block focus:outline-none">
        <Card className={`h-full rounded-2xl shadow-xs hover:shadow-sm transition-all duration-200 bg-white ${
          tasks.overdue > 0 ? 'border-rose-300' : 'border-slate-200/80'
        }`}>
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Nhiệm vụ quá hạn
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  tasks.overdue > 0
                    ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                    : 'bg-slate-50 text-slate-600 border border-slate-200/80'
                }`}>
                  <AlertTriangle size={18} />
                </div>
              </div>

              <div className="mt-2.5">
                <div className={`text-2xl sm:text-[28px] font-bold tracking-tight leading-tight tabular-nums ${
                  tasks.overdue > 0 ? 'text-rose-700' : 'text-[#0b3558]'
                }`}>
                  {tasks.overdue}
                  <span className="text-xs font-normal text-slate-500 ml-1.5">quá hạn</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {tasks.overdue > 0 ? (
                    <Badge variant="destructive" className="text-[11px] px-2 py-0.5 rounded-full font-semibold">
                      Cần xử lý ngay
                    </Badge>
                  ) : (
                    <span className="text-emerald-700 font-semibold">Đúng tiến độ</span>
                  )}
                </div>
              </div>
            </div>

            <div className={`mt-3.5 flex items-center justify-between text-xs font-semibold transition-colors ${
              tasks.overdue > 0 ? 'text-rose-700' : 'text-slate-500 group-hover:text-[#1a73e8]'
            }`}>
              <span>{tasks.overdue > 0 ? 'Xử lý ngay' : 'Chi tiết'}</span>
              <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 5. Số dư quỹ */}
      <Link to="/finance" className="group block focus:outline-none">
        <Card className="h-full rounded-2xl border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Số dư quỹ Đơn vị
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  finance.balance >= 0
                    ? 'bg-amber-50 text-amber-700 border border-amber-100/80'
                    : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                }`}>
                  <Wallet size={18} />
                </div>
              </div>

              <div className="mt-2.5">
                <div className={`text-lg sm:text-xl font-bold tracking-tight truncate leading-tight tabular-nums ${
                  finance.balance >= 0 ? 'text-[#0b3558]' : 'text-rose-700'
                }`}>
                  {formatVND(finance.balance)}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-emerald-700 font-semibold truncate tabular-nums">Tổng thu: {formatVND(finance.totalIncome)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-[#1a73e8] transition-colors">
              <span>Sổ cái & ngân sách</span>
              <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 6. Tỷ lệ tham gia */}
      <Link to="/reports" className="group block focus:outline-none">
        <Card className="h-full rounded-2xl border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 bg-white">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Tỷ lệ tham gia
                </span>
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 border border-violet-100/80 flex items-center justify-center transition-colors">
                  <UserCheck size={18} />
                </div>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-[28px] font-bold text-[#0b3558] tracking-tight leading-tight tabular-nums">
                  {participation.overallRate}%
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <TrendingUp size={14} className="text-emerald-600" />
                  <span className="truncate">TB: <span className="tabular-nums font-semibold text-slate-800">{participation.averagePerActivity}</span> hội viên / hoạt động</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-[#1a73e8] transition-colors">
              <span>Xem báo cáo</span>
              <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
