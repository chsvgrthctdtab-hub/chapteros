import type { ReportOverview } from '@/types/report';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, CheckSquare, Wallet, ArrowUpRight, ArrowDownRight, Layers, AlertCircle } from 'lucide-react';
import { formatVND } from '@/features/dashboard/utils/formatters';

interface ExecutiveSummaryStripProps {
  overview?: ReportOverview | null;
  isLoading?: boolean;
}

export function ExecutiveSummaryStrip({ overview, isLoading }: ExecutiveSummaryStripProps) {
  if (isLoading || !overview) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5" id="executive-summary-skeleton">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-cloud border border-hairline animate-pulse p-4 space-y-2">
            <div className="h-3.5 w-20 bg-pebble rounded" />
            <div className="h-6 w-24 bg-pebble rounded" />
          </div>
        ))}
      </div>
    );
  }

  const {
    memberCount,
    activeMemberCount,
    termCount,
    currentTerm,
    activityCount,
    taskCount,
    totalIncome,
    totalExpense,
    balance,
  } = overview;

  const isSurplus = balance >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5" id="executive-summary-strip">
      {/* 1. Members */}
      <Card className="border-hairline shadow-xs bg-white hover:border-pebble transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-mist-gray">Hội viên</span>
            <div className="w-7 h-7 rounded-lg bg-[#e6f0ff] text-signal-blue flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-ink-navy tracking-tight">{memberCount}</div>
            <div className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
              {activeMemberCount} hoạt động
            </div>
          </div>
          <div className="mt-1 text-2xs text-mist-gray">
            {memberCount > 0 ? `${Math.round((activeMemberCount / memberCount) * 100)}% tỷ lệ tham gia` : 'Chưa có hội viên'}
          </div>
        </CardContent>
      </Card>

      {/* 2. Operations / Activities */}
      <Card className="border-hairline shadow-xs bg-white hover:border-pebble transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-mist-gray">Hoạt động sự kiện</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-ink-navy tracking-tight">{activityCount}</div>
            <span className="text-2xs text-mist-gray">Chương trình</span>
          </div>
          <div className="mt-1 text-2xs text-mist-gray truncate">
            Đã đăng ký trong kỳ
          </div>
        </CardContent>
      </Card>

      {/* 3. Task Execution */}
      <Card className="border-hairline shadow-xs bg-white hover:border-pebble transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-mist-gray">Nhiệm vụ phân công</span>
            <div className="w-7 h-7 rounded-lg bg-[#e6f0ff] text-signal-blue flex items-center justify-center">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-ink-navy tracking-tight">{taskCount}</div>
            <span className="text-2xs text-mist-gray">Đầu việc</span>
          </div>
          <div className="mt-1 text-2xs text-mist-gray">
            Theo dõi tiến độ vận hành
          </div>
        </CardContent>
      </Card>

      {/* 4. Treasury Net Balance */}
      <Card className="border-hairline shadow-xs bg-white hover:border-pebble transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-mist-gray">Số dư ngân sách</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSurplus ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-lg sm:text-xl font-black tracking-tight truncate ${isSurplus ? 'text-emerald-700' : 'text-rose-700'}`} title={formatVND(balance)}>
              {formatVND(balance)}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2 text-2xs text-mist-gray font-medium">
            <span className="text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              {formatVND(totalIncome)}
            </span>
            <span className="text-rose-600 flex items-center">
              <ArrowDownRight className="w-3 h-3" />
              {formatVND(totalExpense)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 5. Term Context */}
      <Card className="border-hairline shadow-xs bg-white hover:border-pebble transition-colors col-span-2 sm:col-span-1">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-mist-gray">Nhiệm kỳ</span>
            <div className="w-7 h-7 rounded-lg bg-cloud text-slate-gray flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-ink-navy truncate" title={currentTerm?.name || 'Toàn thời gian'}>
              {currentTerm?.name || 'Tất cả nhiệm kỳ'}
            </div>
          </div>
          <div className="mt-1 text-2xs text-mist-gray flex items-center justify-between">
            <span>{termCount} nhiệm kỳ lịch sử</span>
            {currentTerm && (
              <span className="text-signal-blue font-medium">{currentTerm.memberCount} nhân sự</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
