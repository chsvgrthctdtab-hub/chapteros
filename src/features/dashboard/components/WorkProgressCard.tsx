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
    <Card className="border-slate-200/90 shadow-2xs rounded-xl overflow-hidden bg-white">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Work Progress
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Completion rate & task health metrics
              </p>
            </div>
          </div>

          {hasData ? (
            <div className="text-right">
              <span className="text-lg sm:text-xl font-bold font-mono text-emerald-700">{completionRate}%</span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">completed</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">No tasks</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-3.5 space-y-3.5">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <Progress
            value={hasData ? completionRate : 0}
            className="h-2 bg-slate-100 rounded-full"
            indicatorClassName={
              completionRate >= 80
                ? 'bg-emerald-600'
                : completionRate >= 50
                ? 'bg-slate-700'
                : 'bg-amber-500'
            }
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Đã xong: <strong className="text-slate-800 font-mono">{completed}</strong> / {total} công việc
            </span>
            <span>Đang làm: <strong className="text-slate-800 font-mono">{active}</strong></span>
          </div>
        </div>

        {/* Breakdown Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <div className="truncate">
              <div className="text-[11px] text-slate-500 font-medium">Đang làm</div>
              <div className="font-bold font-mono text-slate-800 text-xs sm:text-sm">{active}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div className="truncate">
              <div className="text-[11px] text-emerald-800 font-medium">Hoàn thành</div>
              <div className="font-bold font-mono text-emerald-900 text-xs sm:text-sm">{completed}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50/50 border border-rose-100">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <div className="truncate">
              <div className="text-[11px] text-rose-800 font-medium">Quá hạn</div>
              <div className="font-bold font-mono text-rose-900 text-xs sm:text-sm">{overdue}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/50 border border-amber-100">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <div className="truncate">
              <div className="text-[11px] text-amber-800 font-medium">Ưu tiên cao</div>
              <div className="font-bold font-mono text-amber-900 text-xs sm:text-sm">{highOrUrgent}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
