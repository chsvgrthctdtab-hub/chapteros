import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, Calendar, User, ArrowRight, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';
import { formatShortDate, TASK_PRIORITY_META, TASK_STATUS_META } from '../utils/formatters';
import type { UpcomingTaskItem } from '../types/dashboard.types';
import { EmptyState } from '@/components/common/EmptyState';

interface UpcomingTasksSectionProps {
  tasks: UpcomingTaskItem[];
  canCreateTask?: boolean;
}

function getInitials(name?: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UpcomingTasksSection({
  tasks,
  canCreateTask = false,
}: UpcomingTasksSectionProps) {
  const navigate = useNavigate();
  const hasTasks = tasks && tasks.length > 0;

  return (
    <Card className="rounded-xl border-slate-200/90 shadow-2xs bg-white">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Trung tâm Công việc (Task Center)
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Các nhiệm vụ ưu tiên, tiến độ và gần hạn chót nhất
              </p>
            </div>
          </div>

          <Link to="/tasks">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-8 px-2.5">
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-2">
        {hasTasks ? (
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const priorityMeta = TASK_PRIORITY_META[task.priority] || {
                label: task.priority,
                badgeVariant: 'outline' as const,
                colorClass: 'text-slate-600',
                bgClass: 'bg-slate-50 border-slate-200 text-slate-600',
              };

              const statusMeta = TASK_STATUS_META[task.status] || {
                label: task.status,
                colorClass: 'text-slate-700',
                bgClass: 'bg-slate-100 text-slate-700',
              };

              return (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="group block py-3 first:pt-1.5 last:pb-0.5 focus:outline-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[11px] py-0 px-2 font-semibold border ${priorityMeta.bgClass}`}
                        >
                          {priorityMeta.label}
                        </Badge>

                        <Badge
                          variant="outline"
                          className={`text-[11px] py-0 px-2 font-medium border ${statusMeta.bgClass}`}
                        >
                          {statusMeta.label}
                        </Badge>

                        {task.activity && (
                          <span className="text-xs text-emerald-700 font-medium truncate max-w-[180px]">
                            #{task.activity.code} - {task.activity.title}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {task.title}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
                        {task.dueDate ? (
                          <div className={`flex items-center gap-1.5 ${task.isOverdue ? 'text-rose-600 font-semibold' : ''}`}>
                            {task.isOverdue ? (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            ) : (
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>Hạn: {formatShortDate(task.dueDate)}</span>
                            {task.isOverdue && (
                              <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">
                                Quá hạn
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Không có hạn</span>
                        )}

                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          {task.assignee?.avatarUrl ? (
                            <img
                              src={task.assignee.avatarUrl}
                              alt={task.assignee.fullName}
                              className="w-4 h-4 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-slate-200 text-[9px] font-bold text-slate-700 flex items-center justify-center">
                              {getInitials(task.assignee?.fullName)}
                            </div>
                          )}
                          <span className="truncate max-w-[130px]">
                            {task.assignee ? task.assignee.fullName : 'Chưa phân công'}
                          </span>
                        </div>

                        {task.progress !== undefined && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, task.progress))}%` }}
                              />
                            </div>
                            <span className="font-semibold text-slate-700 font-mono text-[11px]">{task.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 pt-1 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            compact
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            title="Không có công việc đang xử lý"
            description="Mọi công việc đã được hoàn thành đúng hạn hoặc chưa có phân công mới."
            actionLabel={canCreateTask ? 'Giao nhiệm vụ mới' : undefined}
            actionIcon={<Plus className="w-3.5 h-3.5" />}
            onAction={canCreateTask ? () => navigate('/tasks') : undefined}
          />
        )}
      </CardContent>
    </Card>
  );
}
