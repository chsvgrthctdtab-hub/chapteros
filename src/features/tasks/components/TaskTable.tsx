import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  User,
  Edit2,
  Trash2,
  ExternalLink,
  AlertTriangle,
  MoreHorizontal,
  Layers,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import type { TaskListItem } from '../types/task.types';
import { formatDueDateInfo } from '../types/task.types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskProgressBar } from './TaskProgressBar';
import { cn } from '@/lib/utils';

interface TaskTableProps {
  tasks: TaskListItem[];
  onSelectTask?: (task: TaskListItem) => void;
  onEdit?: (task: TaskListItem) => void;
  onDelete?: (task: TaskListItem) => void;
  onQuickStatus?: (task: TaskListItem) => void;
  onQuickProgress?: (task: TaskListItem) => void;
  canManage?: boolean;
  currentUserId?: string;
}

export function TaskTable({
  tasks,
  onSelectTask,
  onEdit,
  onDelete,
  onQuickStatus,
  onQuickProgress,
  canManage = false,
  currentUserId,
}: TaskTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/90 text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <th className="py-3 px-3.5 min-w-[200px]">Nhiệm vụ</th>
              <th className="py-3 px-2 text-center w-28">Trạng thái</th>
              <th className="py-3 px-2 text-center w-24">Ưu tiên</th>
              <th className="py-3 px-2 text-center w-14">Phụ trách</th>
              <th className="py-3 px-2.5 max-w-[150px]">Hoạt động</th>
              <th className="py-3 px-2.5 text-center w-32">Hạn chót</th>
              <th className="py-3 px-2.5 text-center w-24">Tiến độ</th>
              <th className="py-3 px-3 text-right w-20">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90">
            {tasks.map((task) => {
              const dueInfo = formatDueDateInfo(task.dueDate, task.status);
              const isAssignee = Boolean(currentUserId && task.assignedTo === currentUserId);
              const canUpdate = canManage || isAssignee;

              // Generate short formatted task code for monospace display
              const taskCode = task.id.length > 8 ? `TSK-${task.id.slice(0, 6).toUpperCase()}` : task.id;

              return (
                <tr
                  key={task.id}
                  id={`task-row-${task.id}`}
                  onClick={() => onSelectTask ? onSelectTask(task) : undefined}
                  className={cn(
                    'group hover:bg-slate-50/90 transition-colors duration-150 cursor-pointer',
                    dueInfo.isOverdue && 'bg-rose-50/20'
                  )}
                >
                  {/* Task Column: Title + Small Task ID */}
                  <td className="py-2.5 px-3.5 align-middle">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1 text-xs">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="font-mono text-[10px] text-slate-400 font-medium">
                          #{taskCode}
                        </span>
                        {task.description && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[180px] text-[10px] text-slate-500">
                              {task.description}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Status Column */}
                  <td className="py-2.5 px-2 text-center align-middle">
                    <div
                      onClick={(e) => {
                        if (canUpdate && onQuickStatus) {
                          e.stopPropagation();
                          onQuickStatus(task);
                        }
                      }}
                      className={cn(
                        'inline-block',
                        canUpdate && 'hover:opacity-85'
                      )}
                      title={canUpdate ? 'Nhấp để đổi trạng thái' : undefined}
                    >
                      <TaskStatusBadge status={task.status} size="sm" />
                    </div>
                  </td>

                  {/* Priority Column */}
                  <td className="py-2.5 px-2 text-center align-middle">
                    <TaskPriorityBadge priority={task.priority} size="sm" />
                  </td>

                  {/* Assignee Column: Compact Avatar with Tooltip */}
                  <td className="py-2.5 px-2 text-center align-middle">
                    {task.assignee ? (
                      <div
                        className="inline-flex items-center justify-center group/avatar cursor-help"
                        title={`${task.assignee.fullName}${task.assignee.studentId ? ` (${task.assignee.studentId})` : ''}`}
                      >
                        {task.assignee.avatarUrl ? (
                          <img
                            src={task.assignee.avatarUrl}
                            alt={task.assignee.fullName}
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs hover:scale-110 transition-transform"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0 border border-emerald-200 shadow-2xs hover:scale-110 transition-transform">
                            {task.assignee.fullName?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="inline-flex items-center justify-center text-slate-300"
                        title="Chưa phân công phụ trách"
                      >
                        <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                          <User className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Activity Column */}
                  <td className="py-2.5 px-2.5 align-middle max-w-[150px]">
                    {task.activity ? (
                      <Link
                        to={`/activities/${task.activity.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-800 bg-slate-100/70 hover:bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors max-w-full truncate border border-slate-200/60"
                        title={task.activity.title}
                      >
                        <span className="truncate">
                          {task.activity.code ? `${task.activity.code} · ` : ''}
                          {task.activity.title}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Độc lập
                      </span>
                    )}
                  </td>

                  {/* Due Date Column with Overdue treatment */}
                  <td className="py-2.5 px-2.5 text-center align-middle whitespace-nowrap">
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-medium',
                        dueInfo.isOverdue
                          ? 'text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200'
                          : 'text-slate-600'
                      )}
                    >
                      {dueInfo.isOverdue ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>
                            {dueInfo.daysDiff < 0
                              ? `Quá hạn · ${Math.abs(dueInfo.daysDiff)} ngày`
                              : 'Quá hạn'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{dueInfo.formattedDate}</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Progress Column */}
                  <td className="py-2.5 px-2.5 text-center align-middle">
                    <div
                      onClick={(e) => {
                        if (canUpdate && onQuickProgress) {
                          e.stopPropagation();
                          onQuickProgress(task);
                        }
                      }}
                      className={cn('w-20 mx-auto', canUpdate && 'hover:opacity-85')}
                      title={canUpdate ? 'Nhấp để cập nhật tiến độ' : undefined}
                    >
                      <TaskProgressBar progress={task.progress} size="sm" showLabel={true} />
                    </div>
                  </td>

                  {/* Actions Column (Revealed / Highlighted on hover) */}
                  <td className="py-2.5 px-3 align-middle text-right">
                    <div
                      className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        id={`view-task-drawer-${task.id}`}
                        onClick={() => onSelectTask ? onSelectTask(task) : undefined}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {canManage && onEdit && (
                        <button
                          type="button"
                          id={`edit-task-table-${task.id}`}
                          onClick={() => onEdit(task)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Chỉnh sửa nhiệm vụ"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canManage && onDelete && (
                        <button
                          type="button"
                          id={`delete-task-table-${task.id}`}
                          onClick={() => onDelete(task)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Xóa nhiệm vụ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
