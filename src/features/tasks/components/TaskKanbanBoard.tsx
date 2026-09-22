import React, { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  Check,
  RotateCcw,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import type { TaskListItem, TaskStatus } from '../types/task.types';
import { TASK_STATUSES, formatDueDateInfo } from '../types/task.types';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskProgressBar } from './TaskProgressBar';
import { getAllowedTransitions } from '../utils/task-workflow';
import { cn } from '@/lib/utils';

interface TaskKanbanBoardProps {
  tasks: TaskListItem[];
  onUpdateStatus: (taskId: string, targetStatus: TaskStatus, currentProgress?: number) => Promise<void>;
  onSelectTask?: (task: TaskListItem) => void;
  onEdit?: (task: TaskListItem) => void;
  onDelete?: (task: TaskListItem) => void;
  onQuickStatus?: (task: TaskListItem) => void;
  onQuickProgress?: (task: TaskListItem) => void;
  userRole?: string | null;
  canManage?: boolean;
  currentUserId?: string;
  isUpdating?: boolean;
}

const KANBAN_COLUMNS: Array<{
  id: TaskStatus;
  title: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  headerBorder: string;
}> = [
  {
    id: 'todo',
    title: 'Cần làm',
    badgeBg: 'bg-cloud',
    badgeText: 'text-slate-gray',
    borderClass: 'border-hairline',
    headerBorder: 'border-hairline',
  },
  {
    id: 'in_progress',
    title: 'Đang thực hiện',
    badgeBg: 'bg-[#e6f0ff]',
    badgeText: 'text-signal-blue',
    borderClass: 'border-[#d4e4fa]',
    headerBorder: 'border-[#d4e4fa]',
  },
  {
    id: 'in_review',
    title: 'Chờ duyệt',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderClass: 'border-amber-200/70',
    headerBorder: 'border-amber-400',
  },
  {
    id: 'completed',
    title: 'Hoàn thành',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderClass: 'border-emerald-200/70',
    headerBorder: 'border-emerald-500',
  },
  {
    id: 'cancelled',
    title: 'Đã hủy',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    borderClass: 'border-rose-200/70',
    headerBorder: 'border-rose-400',
  },
];

export function TaskKanbanBoard({
  tasks,
  onUpdateStatus,
  onSelectTask,
  userRole,
  canManage = false,
  currentUserId,
  isUpdating = false,
}: TaskKanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === targetStatus) return;

    await onUpdateStatus(taskId, targetStatus, task.progress);
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-3.5 min-w-[1180px] items-start">
        {KANBAN_COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              id={`kanban-col-${col.id}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={cn(
                'flex-1 flex flex-col min-w-[230px] max-w-[280px] rounded-2xl border bg-cloud/80 transition-colors duration-150 shadow-xs',
                isOver ? 'border-signal-blue bg-[#e6f0ff]/30 ring-2 ring-signal-blue/20' : col.borderClass
              )}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-hairline bg-white rounded-t-2xl flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-ink-navy tracking-tight">
                    {col.title}
                  </h3>
                  <span
                    className={cn(
                      'inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold rounded-full tabular-nums border border-hairline',
                      col.badgeBg,
                      col.badgeText
                    )}
                  >
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Column Body / Card Container */}
              <div className="p-2 space-y-2.5 min-h-[480px] max-h-[calc(100vh-280px)] overflow-y-auto">
                {columnTasks.length === 0 ? (
                  <div className="h-28 border border-dashed border-hairline rounded-xl flex flex-col items-center justify-center text-center p-3 text-mist-gray select-none">
                    <p className="text-xs font-medium text-slate-gray">Chưa có việc</p>
                    <p className="text-[10px] mt-0.5 text-mist-gray">Kéo thả nhiệm vụ vào đây</p>
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const dueInfo = formatDueDateInfo(task.dueDate, task.status);
                    const isAssignee = Boolean(currentUserId && task.assignedTo === currentUserId);
                    const canAct = canManage || isAssignee;
                    const isDraggable = task.status !== 'completed' && task.status !== 'cancelled' && !isUpdating;
                    const allowedTransitions = getAllowedTransitions(task.status, userRole);
                    const taskCode = task.id.length > 8 ? `TSK-${task.id.slice(0, 5).toUpperCase()}` : task.id;

                    return (
                      <div
                        key={task.id}
                        id={`kanban-card-${task.id}`}
                        draggable={isDraggable}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onSelectTask ? onSelectTask(task) : undefined}
                        className={cn(
                          'bg-white rounded-xl p-3 border border-hairline shadow-xs hover:shadow-xs transition-all space-y-2 select-none cursor-pointer group',
                          draggedTaskId === task.id ? 'opacity-40 scale-95' : 'opacity-100',
                          isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                          dueInfo.isOverdue ? 'border-rose-300 ring-1 ring-rose-200/50' : 'hover:border-slate-gray/30'
                        )}
                      >
                        {/* Top: Priority Indicator + Task ID */}
                        <div className="flex items-center justify-between gap-1.5">
                          <TaskPriorityBadge priority={task.priority} size="sm" />
                          <span className="font-mono tabular-nums text-[10px] text-mist-gray font-medium">
                            #{taskCode}
                          </span>
                        </div>

                        {/* Middle: Title & Optional Activity */}
                        <div className="space-y-1">
                          <h4 className="font-semibold text-ink-navy group-hover:text-signal-blue transition-colors text-xs leading-snug line-clamp-2">
                            {task.title}
                          </h4>

                          {task.activity && (
                            <div className="text-[10px]">
                              <span
                                className="inline-flex items-center gap-1 font-medium text-ink-navy bg-cloud border border-hairline px-2 py-0.5 rounded-full truncate max-w-full"
                                title={task.activity.title}
                              >
                                <span className="truncate">{task.activity.title}</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Bottom: Assignee + Due date */}
                        <div className="pt-1.5 border-t border-hairline flex items-center justify-between text-[11px] text-slate-gray gap-2">
                          {/* Assignee */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            {task.assignee ? (
                              <>
                                {task.assignee.avatarUrl ? (
                                  <img
                                    src={task.assignee.avatarUrl}
                                    alt={task.assignee.fullName}
                                    referrerPolicy="no-referrer"
                                    className="w-4.5 h-4.5 rounded-full object-cover shrink-0 border border-hairline"
                                  />
                                ) : (
                                  <div className="w-4.5 h-4.5 rounded-full bg-[#e6f0ff] text-signal-blue font-bold text-[9px] flex items-center justify-center shrink-0 border border-[#d4e4fa]">
                                    {task.assignee.fullName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="truncate max-w-[85px] font-medium text-ink-navy text-[11px]">
                                  {task.assignee.fullName}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] text-mist-gray italic">Chưa phân công</span>
                            )}
                          </div>

                          {/* Due Date */}
                          <div className="shrink-0">
                            {dueInfo.isOverdue ? (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[10px] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 tabular-nums">
                                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>{dueInfo.daysDiff < 0 ? `Quá hạn · ${Math.abs(dueInfo.daysDiff)}d` : 'Quá hạn'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-gray tabular-nums">
                                <Calendar className="w-3 h-3 text-mist-gray shrink-0" />
                                <span>{dueInfo.formattedDate}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer: Progress Bar */}
                        <div className="space-y-0.5">
                          <TaskProgressBar progress={task.progress} size="xs" showLabel={false} />
                        </div>

                        {/* Contextual Quick Transition Actions */}
                        {allowedTransitions.length > 0 && canAct && (
                          <div
                            className="pt-1.5 border-t border-hairline flex flex-wrap gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {allowedTransitions.map((nextStatus) => {
                              const isApprove = nextStatus === 'completed';
                              const isReject = task.status === 'in_review' && nextStatus === 'in_progress';
                              const isCancel = nextStatus === 'cancelled';
                              const isStart = nextStatus === 'in_progress' && task.status === 'todo';
                              const isReview = nextStatus === 'in_review';

                              let buttonLabel = 'Tiếp';
                              if (isApprove) buttonLabel = 'Duyệt';
                              else if (isReject) buttonLabel = 'Yêu cầu sửa';
                              else if (isCancel) buttonLabel = 'Hủy';
                              else if (isStart) buttonLabel = 'Bắt đầu';
                              else if (isReview) buttonLabel = 'Gửi duyệt';
                              else buttonLabel = TASK_STATUSES[nextStatus].label;

                              return (
                                <button
                                  key={nextStatus}
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => onUpdateStatus(task.id, nextStatus, task.progress)}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors cursor-pointer',
                                    isApprove
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                      : isReject
                                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                      : isCancel
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                      : 'bg-cloud text-ink-navy border-hairline hover:bg-pebble'
                                  )}
                                  title={`Chuyển sang ${TASK_STATUSES[nextStatus].label}`}
                                >
                                  {isApprove && <Check className="w-2.5 h-2.5" />}
                                  {isReject && <RotateCcw className="w-2.5 h-2.5" />}
                                  {isCancel && <XCircle className="w-2.5 h-2.5" />}
                                  {!isApprove && !isReject && !isCancel && <ArrowRight className="w-2.5 h-2.5" />}
                                  <span>{buttonLabel}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
