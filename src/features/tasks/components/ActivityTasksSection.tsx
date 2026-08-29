import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Calendar,
  User,
  AlertTriangle,
  ExternalLink,
  Edit2,
  Trash2,
  Clock,
} from 'lucide-react';
import { useTasksByActivity } from '../queries/task.queries';
import { useUpdateTaskStatus, useDeleteTask } from '../mutations/task.mutations';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskProgressBar } from './TaskProgressBar';
import { TaskQuickStatusModal } from './TaskQuickStatusModal';
import { formatDueDateInfo, type TaskListItem, type TaskStatus } from '../types/task.types';

interface ActivityTasksSectionProps {
  activityId: string;
  activityTitle: string;
  organizationId: string;
  canManage: boolean;
  onOpenCreateTaskModal: () => void;
}

export function ActivityTasksSection({
  activityId,
  activityTitle,
  organizationId,
  canManage,
  onOpenCreateTaskModal,
}: ActivityTasksSectionProps) {
  const { data: tasks = [], isLoading, error } = useTasksByActivity(activityId, organizationId);
  const updateStatusMutation = useUpdateTaskStatus();
  const deleteTaskMutation = useDeleteTask();

  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState<TaskListItem | null>(null);

  // Compute metrics
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const inReview = tasks.filter((t) => t.status === 'in_review').length;
  const overdue = tasks.filter((t) => t.isOverdue).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleUpdateStatus = async (status: TaskStatus, progress?: number) => {
    if (!selectedTaskForStatus) return;
    await updateStatusMutation.mutateAsync({
      taskId: selectedTaskForStatus.id,
      organizationId,
      status,
      progress,
      activityId,
    });
  };

  const handleDeleteTask = async (task: TaskListItem) => {
    if (confirm(`Bạn có chắc chắn muốn xóa công việc "${task.title}"?`)) {
      await deleteTaskMutation.mutateAsync({
        taskId: task.id,
        organizationId,
        activityId,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Đang tải danh sách công việc liên quan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center text-rose-700 text-xs">
        <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-rose-500" />
        <p>Không thể tải công việc của hoạt động này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activity Tasks Header Banner */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">
              Công việc thực hiện ({completed}/{total} hoàn tất — {completionRate}%)
            </h4>
            {overdue > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                <span>{overdue} quá hạn</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Các đầu việc phục vụ tổ chức và triển khai cho hoạt động "{activityTitle}".
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            id="add-activity-task-btn"
            onClick={onOpenCreateTaskModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm công việc</span>
          </button>
        )}
      </div>

      {/* Task List or Empty State */}
      {tasks.length === 0 ? (
        <div className="py-12 px-4 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h5 className="text-sm font-bold text-slate-900">Chưa có công việc nào</h5>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Hoạt động này chưa được phân công đầu việc. Hãy tạo các nhiệm vụ như thiết kế, hậu cần, truyền thông để theo dõi.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={onOpenCreateTaskModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Giao việc đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tasks.map((task) => {
            const dueInfo = formatDueDateInfo(task.dueDate, task.status);

            return (
              <div
                key={task.id}
                id={`act-task-item-${task.id}`}
                className={`p-4 bg-white rounded-xl border transition-all shadow-xs flex flex-col justify-between space-y-3 ${
                  dueInfo.isOverdue
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <TaskPriorityBadge priority={task.priority} size="sm" />
                      <div
                        onClick={() => canManage && setSelectedTaskForStatus(task)}
                        className={canManage ? 'cursor-pointer' : ''}
                      >
                        <TaskStatusBadge status={task.status} size="sm" />
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Xem chi tiết công việc"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa công việc"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/tasks/${task.id}`}
                    className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 block"
                  >
                    {task.title}
                  </Link>
                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <TaskProgressBar progress={task.progress} size="sm" />

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      {task.assignee ? (
                        <>
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                            {task.assignee.fullName?.charAt(0) || 'U'}
                          </div>
                          <span className="font-medium text-slate-800 text-[11px] truncate max-w-[120px]">
                            {task.assignee.fullName}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Chưa phân công</span>
                      )}
                    </div>

                    <div
                      className={`text-[11px] font-medium ${
                        dueInfo.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {dueInfo.text}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Status Modal */}
      <TaskQuickStatusModal
        isOpen={Boolean(selectedTaskForStatus)}
        onClose={() => setSelectedTaskForStatus(null)}
        task={selectedTaskForStatus}
        onUpdateStatus={handleUpdateStatus}
        isLoading={updateStatusMutation.isPending}
      />
    </div>
  );
}
