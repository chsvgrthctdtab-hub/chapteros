import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  User,
  Edit2,
  Trash2,
  ExternalLink,
  AlertTriangle,
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
    <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-cloud border-b border-hairline text-[11px] font-bold text-slate-gray uppercase tracking-wider select-none">
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
          <tbody className="divide-y divide-hairline">
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
                    'group hover:bg-cloud/60 transition-colors duration-150 cursor-pointer',
                    dueInfo.isOverdue && 'bg-rose-50/20'
                  )}
                >
                  {/* Task Column: Title + Small Task ID */}
                  <td className="py-2.5 px-3.5 align-middle">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-ink-navy group-hover:text-signal-blue transition-colors line-clamp-1 text-xs">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-mist-gray">
                        <span className="font-mono tabular-nums text-[10px] text-mist-gray font-medium">
                          #{taskCode}
                        </span>
                        {task.description && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[180px] text-[10px] text-slate-gray">
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
                            className="w-6 h-6 rounded-full object-cover shrink-0 border border-hairline shadow-xs hover:scale-110 transition-transform"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#e6f0ff] text-signal-blue flex items-center justify-center font-bold text-[11px] shrink-0 border border-[#d4e4fa] shadow-xs hover:scale-110 transition-transform">
                            {task.assignee.fullName?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="inline-flex items-center justify-center text-mist-gray"
                        title="Chưa phân công phụ trách"
                      >
                        <div className="w-6 h-6 rounded-full border border-dashed border-hairline flex items-center justify-center text-[10px] text-mist-gray">
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
                        className="inline-flex items-center gap-1 text-ink-navy hover:text-signal-blue bg-cloud hover:bg-pebble px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors max-w-full truncate border border-hairline"
                        title={task.activity.title}
                      >
                        <span className="truncate">
                          {task.activity.code ? `${task.activity.code} · ` : ''}
                          {task.activity.title}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-[11px] text-mist-gray italic">
                        Độc lập
                      </span>
                    )}
                  </td>

                  {/* Due Date Column with Overdue treatment */}
                  <td className="py-2.5 px-2.5 text-center align-middle whitespace-nowrap">
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-medium tabular-nums',
                        dueInfo.isOverdue
                          ? 'text-rose-700 font-semibold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200'
                          : 'text-slate-gray'
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
                          <Calendar className="w-3.5 h-3.5 text-mist-gray shrink-0" />
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

                  {/* Actions Column */}
                  <td className="py-2.5 px-3 align-middle text-right">
                    <div
                      className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        id={`view-task-drawer-${task.id}`}
                        onClick={() => onSelectTask ? onSelectTask(task) : undefined}
                        className="p-1.5 text-slate-gray hover:text-ink-navy hover:bg-pebble rounded-lg transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {canManage && onEdit && (
                        <button
                          type="button"
                          id={`edit-task-table-${task.id}`}
                          onClick={() => onEdit(task)}
                          className="p-1.5 text-slate-gray hover:text-ink-navy hover:bg-pebble rounded-lg transition-colors cursor-pointer"
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
                          className="p-1.5 text-slate-gray hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
