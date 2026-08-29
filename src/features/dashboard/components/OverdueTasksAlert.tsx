import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ArrowRight, User } from 'lucide-react';
import { formatShortDate, TASK_PRIORITY_META } from '../utils/formatters';
import type { OverdueTaskItem } from '../types/dashboard.types';

interface OverdueTasksAlertProps {
  overdueTasks: OverdueTaskItem[];
}

export function OverdueTasksAlert({ overdueTasks }: OverdueTasksAlertProps) {
  const hasOverdue = overdueTasks && overdueTasks.length > 0;

  if (!hasOverdue) {
    return (
      <Card className="border-emerald-200/80 bg-emerald-50/40 shadow-2xs">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Tiến độ đúng hạn
              </h4>
              <p className="text-xs text-emerald-800">
                Tuyệt vời! Không có công việc nào bị quá hạn trong nhiệm kỳ này.
              </p>
            </div>
          </div>

          <Link to="/tasks" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 shrink-0">
            Xem danh sách việc
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-rose-200 bg-rose-50/40 shadow-2xs">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-rose-950 flex items-center gap-2">
                <span>Cảnh báo công việc quá hạn</span>
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  {overdueTasks.length} nhiệm vụ
                </Badge>
              </CardTitle>
              <p className="text-[11px] text-rose-700">
                Cần Ban Chấp Hành đôn đốc và hỗ trợ xử lý ngay
              </p>
            </div>
          </div>

          <Link to="/tasks?onlyOverdue=true">
            <span className="text-xs font-medium text-rose-700 hover:text-rose-800 flex items-center">
              Xem tất cả
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1">
        <div className="divide-y divide-rose-100">
          {overdueTasks.map((task) => {
            const priorityMeta = TASK_PRIORITY_META[task.priority] || {
              label: task.priority,
              badgeVariant: 'outline' as const,
              colorClass: 'text-slate-600',
              bgClass: 'bg-white text-slate-700 border-slate-200',
            };

            return (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="group block py-2.5 first:pt-1 last:pb-0 focus:outline-none"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-rose-700 bg-rose-100/80 px-1.5 py-0.2 rounded text-[10px]">
                        Quá hạn {task.daysOverdue} ngày
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0 px-1.5 font-medium border ${priorityMeta.bgClass}`}
                      >
                        {priorityMeta.label}
                      </Badge>
                      {task.activity && (
                        <span className="text-[11px] text-slate-500 font-mono truncate">
                          #{task.activity.code}
                        </span>
                      )}
                    </div>

                    <h5 className="text-xs font-semibold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                      {task.title}
                    </h5>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>Hạn chót: {formatShortDate(task.dueDate)}</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[120px]">
                          {task.assignee ? task.assignee.fullName : 'Chưa phân công'}
                        </span>
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-rose-400 group-hover:text-rose-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
