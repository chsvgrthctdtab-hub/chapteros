import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  User,
  Edit2,
  Trash2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import type { TaskListItem } from '../types/task.types';
import { formatDueDateInfo } from '../types/task.types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskProgressBar } from './TaskProgressBar';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  key?: React.Key;
  task: TaskListItem;
  onSelectTask?: (task: TaskListItem) => void;
  onEdit?: (task: TaskListItem) => void;
  onDelete?: (task: TaskListItem) => void;
  onQuickStatus?: (task: TaskListItem) => void;
  onQuickProgress?: (task: TaskListItem) => void;
  canManage?: boolean;
  isAssignee?: boolean;
}

export function TaskCard({
  task,
  onSelectTask,
  onEdit,
  onDelete,
  onQuickStatus,
  onQuickProgress,
  canManage = false,
  isAssignee = false,
}: TaskCardProps) {
  const dueInfo = formatDueDateInfo(task.dueDate, task.status);
  const canUpdate = canManage || isAssignee;
  const taskCode = task.id.length > 8 ? `TSK-${task.id.slice(0, 6).toUpperCase()}` : task.id;

  return (
    <div
      id={`task-card-${task.id}`}
      onClick={() => onSelectTask ? onSelectTask(task) : undefined}
      className={cn(
        'group bg-white rounded-xl border transition-all duration-150 shadow-2xs hover:shadow-xs flex flex-col justify-between overflow-hidden cursor-pointer',
        dueInfo.isOverdue
          ? 'border-rose-300 ring-1 ring-rose-200/50'
          : 'border-slate-200/90 hover:border-slate-300'
      )}
    >
      <div className="p-4 space-y-3">
        {/* Header: Priority + Status + Task ID + Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <TaskPriorityBadge priority={task.priority} size="sm" />
            <div
              onClick={(e) => {
                if (canUpdate && onQuickStatus) {
                  e.stopPropagation();
                  onQuickStatus(task);
                }
              }}
            >
              <TaskStatusBadge status={task.status} size="sm" />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] text-slate-400 font-medium mr-1">
              #{taskCode}
            </span>

            {canManage && (
              <div
                className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                {onEdit && (
                  <button
                    type="button"
                    id={`edit-task-btn-${task.id}`}
                    onClick={() => onEdit(task)}
                    className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    title="Edit task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    id={`delete-task-btn-${task.id}`}
                    onClick={() => onDelete(task)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Related Activity */}
        <div className="text-xs">
          {task.activity ? (
            <Link
              to={`/activities/${task.activity.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-slate-700 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors max-w-full truncate"
              title={task.activity.title}
            >
              <span className="truncate">{task.activity.title}</span>
            </Link>
          ) : (
            <span className="inline-flex items-center text-slate-400 text-[11px]">
              Standalone task
            </span>
          )}
        </div>

        {/* Progress Bar with quick click action */}
        <div
          onClick={(e) => {
            if (canUpdate && onQuickProgress) {
              e.stopPropagation();
              onQuickProgress(task);
            }
          }}
          className={cn(canUpdate && 'hover:opacity-85')}
          title={canUpdate ? 'Click to update progress' : undefined}
        >
          <TaskProgressBar progress={task.progress} size="sm" />
        </div>
      </div>

      {/* Footer: Assignee & Due Date */}
      <div className="bg-slate-50/70 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        {/* Assignee */}
        <div className="flex items-center gap-2 min-w-0">
          {task.assignee ? (
            <>
              {task.assignee.avatarUrl ? (
                <img
                  src={task.assignee.avatarUrl}
                  alt={task.assignee.fullName}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[9px] shrink-0 border border-slate-200">
                  {task.assignee.fullName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-slate-800 truncate text-[11px]">
                  {task.assignee.fullName}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1 text-slate-400 text-[11px] italic">
              <User className="w-3 h-3" />
              <span>Unassigned</span>
            </div>
          )}
        </div>

        {/* Due date */}
        <div className="shrink-0 text-right">
          <div
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-medium',
              dueInfo.isOverdue
                ? 'text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200'
                : 'text-slate-600'
            )}
          >
            {dueInfo.isOverdue ? (
              <>
                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                <span>{dueInfo.daysDiff < 0 ? `Overdue · ${Math.abs(dueInfo.daysDiff)}d` : 'Overdue'}</span>
              </>
            ) : (
              <>
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{dueInfo.formattedDate}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
