import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckSquare, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { DashboardTaskKpi } from '../types/dashboard.types';

interface WorkProgressCardProps {
  tasks: DashboardTaskKpi;
}

export function WorkProgressCard({ tasks }: WorkProgressCardProps) {
  const { total, active, completed, overdue, highOrUrgent, completionRate } = tasks;
  const hasData = total > 0;

  return (
    <Card className="border-hairline shadow-sm rounded-2xl overflow-hidden bg-white">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-hairline">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pebble text-ink-navy border border-hairline flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-ink-navy leading-tight">
                Work Progress
              </CardTitle>
              <p className="text-xs text-slate-gray mt-0.5">
                Completion rate & task health metrics
              </p>
            </div>
          </div>

          {hasData ? (
            <div className="text-right">
              <span className="text-lg sm:text-xl font-bold text-signal-blue tabular-nums">{completionRate}%</span>
              <span className="text-[11px] text-slate-gray block -mt-0.5">completed</span>
            </div>
          ) : (
            <span className="text-xs text-mist-gray italic">No tasks</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-3.5 space-y-3.5">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <Progress
            value={hasData ? completionRate : 0}
            className="h-2 bg-pebble rounded-full border border-hairline/40"
            indicatorClassName="bg-signal-blue"
          />
          <div className="flex items-center justify-between text-xs text-slate-gray">
            <span>
              Đã xong: <strong className="text-ink-navy tabular-nums">{completed}</strong> / <span className="tabular-nums">{total}</span> công việc
            </span>
            <span>Đang làm: <strong className="text-ink-navy tabular-nums">{active}</strong></span>
          </div>
        </div>

        {/* Breakdown Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-hairline text-xs">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-pebble border border-hairline">
            <Clock className="w-3.5 h-3.5 text-slate-gray shrink-0" />
            <div className="truncate">
              <div className="text-[11px] text-slate-gray font-medium">Đang làm</div>
              <div className="font-bold text-ink-navy text-xs sm:text-sm tabular-nums">{active}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div className="truncate">
              <div className="text-[11px] text-emerald-800 font-medium">Hoàn thành</div>
              <div className="font-bold text-emerald-950 text-xs sm:text-sm tabular-nums">{completed}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-50/50 border border-rose-100">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <div className="truncate">
              <div className="text-[11px] text-rose-800 font-medium">Quá hạn</div>
              <div className="font-bold text-rose-950 text-xs sm:text-sm tabular-nums">{overdue}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/50 border border-amber-100">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <div className="truncate">
              <div className="text-[11px] text-amber-800 font-medium">Ưu tiên cao</div>
              <div className="font-bold text-amber-950 text-xs sm:text-sm tabular-nums">{highOrUrgent}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
