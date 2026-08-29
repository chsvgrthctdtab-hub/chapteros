import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Target,
  User,
  AlertTriangle,
  Edit2,
  Trash2,
  Phone,
  Mail,
  GraduationCap,
  Percent,
  Check,
  RotateCcw,
  XCircle,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useCurrentOrg } from '@/features/auth/hooks/useCurrentOrg';
import {
  useTaskDetail,
  useTaskAssignees,
  useTaskActivities,
  useTaskTerms,
} from './queries/task.queries';
import {
  useUpdateTask,
  useUpdateTaskStatus,
  useUpdateTaskProgress,
  useDeleteTask,
} from './mutations/task.mutations';
import { TaskStatusBadge } from './components/TaskStatusBadge';
import { TaskPriorityBadge } from './components/TaskPriorityBadge';
import { TaskProgressBar } from './components/TaskProgressBar';
import { TaskFormModal } from './components/TaskFormModal';
import { TaskQuickProgressModal } from './components/TaskQuickProgressModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  TASK_STATUSES,
  formatDueDateInfo,
  type TaskStatus,
} from './types/task.types';
import { getAllowedTransitions } from './utils/task-workflow';
import type { TaskFormData } from './schemas/task.schema';
import { cn } from '@/lib/utils';

const WORKFLOW_STEPS: Array<{ key: TaskStatus; label: string; number: number }> = [
  { key: 'todo', label: 'Cần làm', number: 1 },
  { key: 'in_progress', label: 'Đang làm', number: 2 },
  { key: 'in_review', label: 'Chờ duyệt', number: 3 },
  { key: 'completed', label: 'Hoàn thành', number: 4 },
];

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrg, isBoard, isAdmin, role, user } = useCurrentOrg();
  const canManage = isBoard || isAdmin;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: task, isLoading, error, refetch } = useTaskDetail(id, currentOrg?.id);
  const { data: assignees = [] } = useTaskAssignees(currentOrg?.id);
  const { data: activities = [] } = useTaskActivities(currentOrg?.id);
  const { data: terms = [] } = useTaskTerms(currentOrg?.id);

  const updateTaskMutation = useUpdateTask();
  const updateStatusMutation = useUpdateTaskStatus();
  const updateProgressMutation = useUpdateTaskProgress();
  const deleteTaskMutation = useDeleteTask();

  const isAssignee = Boolean(user && task && task.assignedTo === user.id);
  const canUpdate = canManage || isAssignee;

  const showNotice = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message: msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleEditSubmit = async (data: TaskFormData) => {
    if (!task || !currentOrg) return;
    try {
      await updateTaskMutation.mutateAsync({
        taskId: task.id,
        organizationId: currentOrg.id,
        data,
        updatedBy: user?.id,
      });
      showNotice('Task updated successfully.', 'success');
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Failed to update task.', 'error');
    }
  };

  const handleStatusTransition = async (nextStatus: TaskStatus, progress?: number) => {
    if (!task || !currentOrg) return;
    try {
      await updateStatusMutation.mutateAsync({
        taskId: task.id,
        organizationId: currentOrg.id,
        status: nextStatus,
        progress,
        activityId: task.activityId,
        updatedBy: user?.id,
        userRole: role,
      });
      showNotice(`Changed status to "${TASK_STATUSES[nextStatus].label}".`, 'success');
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    }
  };

  const handleProgressUpdate = async (newProgress: number) => {
    if (!task || !currentOrg) return;
    try {
      await updateProgressMutation.mutateAsync({
        taskId: task.id,
        organizationId: currentOrg.id,
        progress: newProgress,
        activityId: task.activityId,
        updatedBy: user?.id,
      });
      showNotice(`Updated progress to ${newProgress}%.`, 'success');
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Failed to update progress.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!task || !currentOrg) return;
    try {
      await deleteTaskMutation.mutateAsync({
        taskId: task.id,
        organizationId: currentOrg.id,
        activityId: task.activityId,
        deletedBy: user?.id,
      });
      navigate('/tasks');
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Failed to delete task.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500 max-w-5xl mx-auto px-4">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium text-slate-500">Loading task details...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-slate-200/90 rounded-2xl text-center space-y-4 shadow-2xs">
        <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Task not found</h3>
        <p className="text-xs text-slate-500">
          This task does not exist or you do not have permission to view it.
        </p>
        <Link
          to="/tasks"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to tasks</span>
        </Link>
      </div>
    );
  }

  const dueInfo = formatDueDateInfo(task.dueDate, task.status);
  const allowedTransitions = getAllowedTransitions(task.status, role);
  const taskCode = task.id.length > 8 ? `TSK-${task.id.slice(0, 6).toUpperCase()}` : task.id;
  const currentStepIndex = WORKFLOW_STEPS.findIndex((s) => s.key === task.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-800 bg-white border border-slate-200/90 px-3 py-2 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Tasks</span>
        </button>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="edit-task-detail-btn"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              id="delete-task-detail-btn"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={cn(
            'p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-2xs',
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          )}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-500 hover:text-slate-800 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Left Details & Right Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Task Primary Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <TaskPriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
                <span className="font-mono text-xs text-slate-400 font-semibold">
                  #{taskCode}
                </span>
                {dueInfo.isOverdue && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>Overdue</span>
                  </span>
                )}
              </div>

              {task.term && (
                <div className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                  {task.term.name}
                </div>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {task.title}
            </h1>

            {/* Workflow Progression Lifecycle */}
            <div className="pt-2 space-y-3">
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tiến trình thực hiện
              </h3>

              {task.status === 'cancelled' ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Công việc đã bị hủy</span>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <div className="grid grid-cols-4 gap-1 relative">
                    {WORKFLOW_STEPS.map((step, idx) => {
                      const isPassed = currentStepIndex > idx;
                      const isCurrent = currentStepIndex === idx;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center">
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors mb-1',
                              isCurrent
                                ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-200'
                                : isPassed
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-white text-slate-400 border-slate-200'
                            )}
                          >
                            {isPassed ? <Check className="w-3 h-3 text-emerald-700" /> : step.number}
                          </div>
                          <span
                            className={cn(
                              'text-[10px] font-medium leading-tight',
                              isCurrent ? 'text-emerald-900 font-bold' : isPassed ? 'text-slate-700' : 'text-slate-400'
                            )}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status Workflow Action Bar */}
              {canUpdate && allowedTransitions.length > 0 && (
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Allowed Status Actions</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {allowedTransitions.map((nextStatus) => {
                      const isApprove = nextStatus === 'completed';
                      const isReject = task.status === 'in_review' && nextStatus === 'in_progress';
                      const isCancel = nextStatus === 'cancelled';
                      const isStart = nextStatus === 'in_progress' && task.status === 'todo';
                      const isReview = nextStatus === 'in_review';

                      let label = 'Transition';
                      if (isApprove) label = 'Approve & Complete';
                      else if (isReject) label = 'Request Changes';
                      else if (isCancel) label = 'Cancel Task';
                      else if (isStart) label = 'Start Working';
                      else if (isReview) label = 'Submit for Review';
                      else label = TASK_STATUSES[nextStatus].label;

                      return (
                        <button
                          key={nextStatus}
                          type="button"
                          id={`action-status-${nextStatus}`}
                          onClick={() =>
                            handleStatusTransition(
                              nextStatus,
                              isApprove ? 100 : task.progress
                            )
                          }
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs',
                            isApprove
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                              : isReject
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                              : isCancel
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                          )}
                        >
                          {isApprove && <Check className="w-3.5 h-3.5" />}
                          {isReject && <RotateCcw className="w-3.5 h-3.5" />}
                          {isCancel && <XCircle className="w-3.5 h-3.5" />}
                          {!isApprove && !isReject && !isCancel && <ArrowRight className="w-3.5 h-3.5" />}
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Description & Requirements */}
            <div className="pt-2">
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Description & Instructions
              </h3>
              {task.description ? (
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                  {task.description}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No description provided for this task.</p>
              )}
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-700" />
                <span>Execution Progress</span>
              </h3>

              <span className="text-xs font-mono font-bold text-slate-800">
                {task.progress}%
              </span>
            </div>

            <TaskProgressBar progress={task.progress} size="md" showLabel={false} />

            {/* Quick interactive progress buttons if authorized */}
            {canUpdate && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-slate-500">Quick set:</span>
                <div className="flex items-center gap-1.5">
                  {[0, 25, 50, 75, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleProgressUpdate(val)}
                      className={cn(
                        'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer font-mono',
                        task.progress === val
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      )}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Metadata Sidebars */}
        <div className="space-y-6">
          {/* Due Date & Timeline Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-3.5 shadow-2xs">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Deadline
            </h3>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-semibold text-slate-900">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'No deadline set'}
                </span>
              </div>

              <div
                className={cn(
                  'text-xs font-medium',
                  dueInfo.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                )}
              >
                Status: {dueInfo.text}
              </div>
            </div>

            {task.createdAt && (
              <div className="text-[11px] text-slate-400">
                Created on {new Date(task.createdAt).toLocaleDateString('vi-VN')}
              </div>
            )}
          </div>

          {/* Related Activity Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-3.5 shadow-2xs">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Linked Activity & Plan
            </h3>

            {task.activity ? (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">{task.activity.title}</span>
                </div>
                {task.activity.code && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    Code: {task.activity.code}
                  </div>
                )}
                {task.activity.plan && (
                  <div className="pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Plan</span>
                    <Link
                      to={`/plans/${task.activity.plan.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
                    >
                      <Target className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{task.activity.plan.name}</span>
                    </Link>
                  </div>
                )}
                <Link
                  to={`/activities/${task.activity.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline pt-1"
                >
                  <span>View activity details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-400 italic">
                Standalone task (Not attached to an activity)
              </div>
            )}
          </div>

          {/* Assignee Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-3.5 shadow-2xs">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Assignee
            </h3>

            {task.assignee ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  {task.assignee.avatarUrl ? (
                    <img
                      src={task.assignee.avatarUrl}
                      alt={task.assignee.fullName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                      {task.assignee.fullName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{task.assignee.fullName}</h4>
                    {task.memberDetails?.position && (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        {task.memberDetails.position}
                      </p>
                    )}
                    {task.assignee.studentId && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        MSSV: {task.assignee.studentId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                  {task.assignee.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{task.assignee.email}</span>
                    </div>
                  )}
                  {task.assignee.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{task.assignee.phone}</span>
                    </div>
                  )}
                  {task.memberDetails?.className && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Class: {task.memberDetails.className}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-400 italic flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Unassigned</span>
              </div>
            )}
          </div>

          {/* Created by Card */}
          {task.creator && (
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs text-xs text-slate-500 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs shrink-0 border border-slate-200">
                {task.creator.fullName?.charAt(0) || 'C'}
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] text-slate-400">Created by</span>
                <span className="font-semibold text-slate-800 truncate block text-xs">
                  {task.creator.fullName}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Task Modal */}
      <TaskFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialTask={task}
        terms={terms}
        activities={activities}
        assignees={assignees}
        isLoading={updateTaskMutation.isPending}
      />

      {/* Quick Progress Modal */}
      <TaskQuickProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        task={task}
        onUpdateProgress={handleProgressUpdate}
        isLoading={updateProgressMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete task?"
        description={`Are you sure you want to delete task "${task.title}"?`}
        warningNote="This action cannot be undone."
        confirmLabel="Confirm delete"
        variant="destructive"
        isLoading={deleteTaskMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default TaskDetailPage;
