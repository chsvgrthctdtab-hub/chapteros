import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  User,
  AlertTriangle,
  Check,
  RotateCcw,
  XCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { TaskListItem, TaskStatus } from '../types/task.types';
import { TASK_STATUSES, formatDueDateInfo } from '../types/task.types';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskProgressBar } from './TaskProgressBar';
import { getAllowedTransitions, getTaskStatusLabel } from '../utils/task-workflow';
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
    badgeBg: 'bg-slate-200/80',
    badgeText: 'text-slate-700',
    borderClass: 'border-slate-200/80',
    headerBorder: 'border-slate-300',
  },
  {
    id: 'in_progress',
    title: 'Đang thực hiện',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    borderClass: 'border-sky-200/70',
    headerBorder: 'border-sky-400',
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
  onEdit,
  onDelete,
  onQuickStatus,
  onQuickProgress,
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
                'flex-1 flex flex-col min-w-[230px] max-w-[280px] rounded-xl border bg-slate-100/60 transition-colors duration-150 shadow-2xs',
                isOver ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-300/40' : col.borderClass
              )}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-200/80 bg-white rounded-t-xl flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight">
                    {col.title}
                  </h3>
                  <span
                    className={cn(
                      'inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full font-mono',
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
                  <div className="h-28 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-center p-3 text-slate-400 select-none">
                    <p className="text-xs font-medium text-slate-400">No tasks</p>
                    <p className="text-[10px] mt-0.5 text-slate-400">Drop tasks here</p>
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
                          'bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-2 select-none cursor-pointer group',
                          draggedTaskId === task.id ? 'opacity-40 scale-95' : 'opacity-100',
                          isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                          dueInfo.isOverdue ? 'border-rose-300 ring-1 ring-rose-200/50' : 'hover:border-slate-300'
                        )}
                      >
                        {/* Top: Priority Indicator + Task ID */}
                        <div className="flex items-center justify-between gap-1.5">
                          <TaskPriorityBadge priority={task.priority} size="sm" />
                          <span className="font-mono text-[10px] text-slate-400 font-medium">
                            #{taskCode}
                          </span>
                        </div>

                        {/* Middle: Title & Optional Activity */}
                        <div className="space-y-1">
                          <h4 className="font-semibold text-slate-900 group-hover:text-emerald-800 transition-colors text-xs leading-snug line-clamp-2">
                            {task.title}
                          </h4>

                          {task.activity && (
                            <div className="text-[10px]">
                              <span
                                className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-full"
                                title={task.activity.title}
                              >
                                <span className="truncate">{task.activity.title}</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Bottom: Assignee + Due date */}
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 gap-2">
                          {/* Assignee */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            {task.assignee ? (
                              <>
                                {task.assignee.avatarUrl ? (
                                  <img
                                    src={task.assignee.avatarUrl}
                                    alt={task.assignee.fullName}
                                    referrerPolicy="no-referrer"
                                    className="w-4.5 h-4.5 rounded-full object-cover shrink-0 border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-4.5 h-4.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[9px] flex items-center justify-center shrink-0 border border-slate-200">
                                    {task.assignee.fullName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="truncate max-w-[85px] font-medium text-slate-700 text-[11px]">
                                  {task.assignee.fullName}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                            )}
                          </div>

                          {/* Due Date */}
                          <div className="shrink-0">
                            {dueInfo.isOverdue ? (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[10px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>{dueInfo.daysDiff < 0 ? `Overdue · ${Math.abs(dueInfo.daysDiff)}d` : 'Overdue'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
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
                            className="pt-1.5 border-t border-slate-100 flex flex-wrap gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {allowedTransitions.map((nextStatus) => {
                              const isApprove = nextStatus === 'completed';
                              const isReject = task.status === 'in_review' && nextStatus === 'in_progress';
                              const isCancel = nextStatus === 'cancelled';
                              const isStart = nextStatus === 'in_progress' && task.status === 'todo';
                              const isReview = nextStatus === 'in_review';

                              let buttonLabel = 'Next';
                              if (isApprove) buttonLabel = 'Approve';
                              else if (isReject) buttonLabel = 'Request Changes';
                              else if (isCancel) buttonLabel = 'Cancel';
                              else if (isStart) buttonLabel = 'Start';
                              else if (isReview) buttonLabel = 'Send Review';
                              else buttonLabel = TASK_STATUSES[nextStatus].label;

                              return (
                                <button
                                  key={nextStatus}
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => onUpdateStatus(task.id, nextStatus, task.progress)}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border transition-colors cursor-pointer',
                                    isApprove
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                      : isReject
                                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                      : isCancel
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                  )}
                                  title={`Transition to ${TASK_STATUSES[nextStatus].label}`}
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
