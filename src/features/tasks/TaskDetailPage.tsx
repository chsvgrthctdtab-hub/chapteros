import { useState } from 'react';
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

  const { data: task, isLoading, error } = useTaskDetail(id, currentOrg?.id);
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
      showNotice('Đã cập nhật nhiệm vụ thành công.', 'success');
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Không thể cập nhật nhiệm vụ.', 'error');
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
      showNotice(`Đã chuyển trạng thái sang "${TASK_STATUSES[nextStatus].label}".`, 'success');
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Không thể chuyển trạng thái.', 'error');
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
      showNotice(`Đã cập nhật tiến độ lên ${newProgress}%.`, 'success');
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Không thể cập nhật tiến độ.', 'error');
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
      showNotice(err instanceof Error ? err.message : 'Không thể xóa nhiệm vụ.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-gray max-w-5xl mx-auto px-4">
        <div className="w-8 h-8 border-2 border-signal-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium text-slate-gray">Đang tải chi tiết nhiệm vụ...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-hairline rounded-2xl text-center space-y-4 shadow-xs">
        <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-ink-navy">Không tìm thấy nhiệm vụ</h3>
        <p className="text-xs text-slate-gray">
          Nhiệm vụ này không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <Link
          to="/tasks"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-signal-blue hover:bg-[#005be0] rounded-lg shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về danh sách nhiệm vụ</span>
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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-gray hover:text-ink-navy bg-white border border-hairline px-3 py-2 rounded-lg shadow-xs hover:bg-pebble transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tất cả nhiệm vụ</span>
        </button>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="edit-task-detail-btn"
              onClick={() => setIsEditModalOpen(true)}
              title="Chỉnh sửa nhiệm vụ"
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-slate-gray bg-white hover:bg-pebble hover:text-ink-navy border border-hairline rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Chỉnh sửa</span>
            </button>
            <button
              type="button"
              id="delete-task-detail-btn"
              onClick={() => setIsDeleteDialogOpen(true)}
              title="Xóa nhiệm vụ"
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Xóa</span>
            </button>
          </div>
        )}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={cn(
            'p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-xs',
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          )}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-gray hover:text-ink-navy text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Main Grid: Left Details & Right Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left Column: Task Primary Overview */}
        <div className="lg:col-span-2 flex flex-col">
          {/* Unified Primary Card */}
          <div className="bg-white rounded-2xl border border-hairline p-5 sm:p-6 space-y-5 shadow-xs flex flex-col flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <TaskPriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
                <span className="font-mono tabular-nums text-xs text-mist-gray font-semibold">
                  #{taskCode}
                </span>
                {dueInfo.isOverdue && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full tabular-nums">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Quá hạn</span>
                  </span>
                )}
              </div>

              {task.term && (
                <div className="text-xs font-semibold text-slate-gray bg-cloud border border-hairline px-2.5 py-1 rounded-full">
                  {task.term.name}
                </div>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-ink-navy leading-tight">
              {task.title}
            </h1>

            {/* Workflow Progression Lifecycle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
                  Tiến trình thực hiện
                </h3>
                {canUpdate && allowedTransitions.includes('cancelled') && (
                  <button
                    type="button"
                    onClick={() => handleStatusTransition('cancelled')}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    title="Hủy nhiệm vụ này"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Hủy nhiệm vụ</span>
                  </button>
                )}
              </div>

              {task.status === 'cancelled' ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2.5 text-rose-800 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Công việc đã bị hủy</span>
                  </div>
                  {canUpdate && allowedTransitions.includes('todo') && (
                    <button
                      type="button"
                      onClick={() => handleStatusTransition('todo', 0)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-signal-blue bg-white hover:bg-pebble border border-hairline px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Khôi phục nhiệm vụ</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-cloud/70 border border-hairline rounded-xl">
                  <div className="relative">
                    {/* Connecting line behind circles */}
                    <div className="absolute top-3 left-[12.5%] right-[12.5%] h-0.5 -translate-y-1/2 bg-mist-gray/25">
                      <div
                        className="h-full bg-signal-blue transition-all duration-300"
                        style={{
                          width: `${Math.max(0, Math.min(100, (Math.max(0, currentStepIndex) / (WORKFLOW_STEPS.length - 1)) * 100))}%`,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-1 relative z-10">
                      {WORKFLOW_STEPS.map((step, idx) => {
                        const isPassed = currentStepIndex > idx;
                        const isCurrent = currentStepIndex === idx;
                        const canTransition = canUpdate && allowedTransitions.includes(step.key);

                        const content = (
                          <>
                            <div
                              className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all mb-1.5 tabular-nums',
                                isCurrent
                                  ? 'bg-signal-blue text-white border-signal-blue ring-4 ring-signal-blue/15 scale-105 shadow-xs'
                                  : isPassed
                                  ? 'bg-signal-blue text-white border-signal-blue group-hover:scale-110 group-hover:ring-4 group-hover:ring-signal-blue/20'
                                  : canTransition
                                  ? 'bg-white text-mist-gray border-hairline group-hover:border-signal-blue group-hover:text-signal-blue group-hover:scale-110 group-hover:ring-4 group-hover:ring-signal-blue/15'
                                  : 'bg-white text-mist-gray border-hairline'
                              )}
                            >
                              {isPassed ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : step.number}
                            </div>
                            <span
                              className={cn(
                                'text-[11px] font-medium leading-tight transition-colors',
                                isCurrent
                                  ? 'text-ink-navy font-bold'
                                  : isPassed
                                  ? 'text-slate-gray group-hover:text-signal-blue'
                                  : canTransition
                                  ? 'text-mist-gray group-hover:text-signal-blue font-medium'
                                  : 'text-mist-gray'
                              )}
                            >
                              {step.label}
                            </span>
                          </>
                        );

                        if (canTransition) {
                          return (
                            <button
                              key={step.key}
                              type="button"
                              onClick={() =>
                                handleStatusTransition(
                                  step.key,
                                  step.key === 'completed' ? 100 : (step.key === 'todo' ? 0 : task.progress)
                                )
                              }
                              title={`Chuyển trạng thái sang "${step.label}"`}
                              className="group flex flex-col items-center text-center cursor-pointer transition-transform focus:outline-none"
                            >
                              {content}
                            </button>
                          );
                        }

                        return (
                          <div
                            key={step.key}
                            className={cn(
                              'flex flex-col items-center text-center select-none',
                              isCurrent ? 'cursor-default' : 'cursor-not-allowed opacity-60'
                            )}
                            title={isCurrent ? `Trạng thái hiện tại: ${step.label}` : undefined}
                          >
                            {content}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Section (Merged into main card) */}
            <div className="p-4 bg-cloud/50 rounded-xl border border-hairline space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-signal-blue" />
                  <span>Tiến độ thực hiện</span>
                </span>

                <span className="text-xs font-bold text-ink-navy tabular-nums">
                  {task.progress}%
                </span>
              </div>

              <TaskProgressBar progress={task.progress} size="md" showLabel={false} />

              {/* Quick interactive progress buttons if authorized */}
              {canUpdate && (
                <div className="pt-2 border-t border-hairline/80 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs text-slate-gray">Chọn nhanh:</span>
                  <div className="flex items-center gap-1.5">
                    {[0, 25, 50, 75, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleProgressUpdate(val)}
                        className={cn(
                          'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer tabular-nums',
                          task.progress === val
                            ? 'bg-signal-blue text-white border-signal-blue shadow-xs'
                            : 'bg-white hover:bg-pebble text-slate-gray hover:text-ink-navy border-hairline'
                        )}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description & Requirements (auto flex-1 to equalize column height) */}
            <div className="pt-1 flex flex-col flex-1">
              <h3 className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider mb-2">
                Mô tả chi tiết & Yêu cầu bàn giao
              </h3>
              {task.description ? (
                <div className="text-xs text-ink-navy leading-relaxed whitespace-pre-wrap bg-cloud/60 p-4 rounded-xl border border-hairline flex-1">
                  {task.description}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-cloud/40 border border-dashed border-hairline flex items-center justify-center text-xs text-mist-gray italic flex-1 min-h-[90px]">
                  Chưa có mô tả cho nhiệm vụ này.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata Sidebars */}
        <div className="flex flex-col space-y-6">
          {/* Due Date & Timeline Card */}
          <div className="bg-white rounded-2xl border border-hairline p-5 space-y-3.5 shadow-xs">
            <h3 className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
              Hạn chót
            </h3>

            <div className="p-3 rounded-xl bg-cloud border border-hairline space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-signal-blue shrink-0" />
                <span className="text-xs font-semibold text-ink-navy">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Không đặt hạn chót'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-hairline/80 text-xs">
                <span className="text-[11px] text-slate-gray">Trạng thái hạn:</span>
                <span
                  className={cn(
                    'text-[11px] font-semibold tabular-nums px-2.5 py-0.5 rounded-full border',
                    dueInfo.isOverdue
                      ? 'text-rose-700 bg-rose-50 border-rose-200'
                      : 'text-signal-blue bg-[#e6f0ff] border-[#d4e4fa]'
                  )}
                >
                  {dueInfo.isOverdue ? dueInfo.text : (dueInfo.daysDiff >= 0 ? `Còn ${dueInfo.daysDiff} ngày` : 'Đúng hạn')}
                </span>
              </div>
            </div>

            {task.createdAt && (
              <div className="text-[11px] text-mist-gray tabular-nums">
                Tạo ngày {new Date(task.createdAt).toLocaleDateString('vi-VN')}
              </div>
            )}
          </div>

          {/* Related Activity Card */}
          <div className="bg-white rounded-2xl border border-hairline p-5 space-y-3.5 shadow-xs">
            <h3 className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
              Hoạt động & Kế hoạch liên kết
            </h3>

            {task.activity ? (
              <div className="p-3 rounded-xl bg-cloud border border-hairline space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink-navy">
                  <Calendar className="w-3.5 h-3.5 text-signal-blue shrink-0" />
                  <span className="truncate">{task.activity.title}</span>
                </div>
                {task.activity.code && (
                  <div className="text-[11px] text-slate-gray font-mono tabular-nums">
                    Mã: {task.activity.code}
                  </div>
                )}
                {task.activity.plan && (
                  <div className="pt-1 border-t border-hairline">
                    <span className="text-[10px] uppercase font-semibold text-slate-gray block mb-0.5">Kế hoạch</span>
                    <Link
                      to={`/plans/${task.activity.plan.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-signal-blue hover:underline"
                    >
                      <Target className="w-3.5 h-3.5 text-signal-blue shrink-0" />
                      <span>{task.activity.plan.name}</span>
                    </Link>
                  </div>
                )}
                <Link
                  to={`/activities/${task.activity.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-signal-blue hover:underline pt-1"
                >
                  <span>Xem hoạt động này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-cloud border border-hairline text-xs text-mist-gray italic">
                Nhiệm vụ độc lập (Không gắn với hoạt động)
              </div>
            )}
          </div>

          {/* Assignee Card */}
          <div className="bg-white rounded-2xl border border-hairline p-5 space-y-3.5 shadow-xs">
            <h3 className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
              Người phụ trách
            </h3>

            {task.assignee ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  {task.assignee.avatarUrl ? (
                    <img
                      src={task.assignee.avatarUrl}
                      alt={task.assignee.fullName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-hairline"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#e6f0ff] text-signal-blue flex items-center justify-center font-bold text-xs border border-[#d4e4fa]">
                      {task.assignee.fullName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-ink-navy">{task.assignee.fullName}</h4>
                    {task.memberDetails?.position && (
                      <p className="text-[11px] text-signal-blue font-medium">
                        {task.memberDetails.position}
                      </p>
                    )}
                    {task.assignee.studentId && (
                      <p className="text-[10px] text-slate-gray font-mono tabular-nums">
                        MSSV: {task.assignee.studentId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-hairline text-[11px] text-slate-gray">
                  {task.assignee.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-mist-gray shrink-0" />
                      <span className="truncate">{task.assignee.email}</span>
                    </div>
                  )}
                  {task.assignee.phone && (
                    <div className="flex items-center gap-2 tabular-nums">
                      <Phone className="w-3.5 h-3.5 text-mist-gray shrink-0" />
                      <span>{task.assignee.phone}</span>
                    </div>
                  )}
                  {task.memberDetails?.className && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-mist-gray shrink-0" />
                      <span>Lớp: {task.memberDetails.className}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-cloud border border-hairline text-xs text-mist-gray italic flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Chưa phân công</span>
              </div>
            )}
          </div>

          {/* Created by Card */}
          {task.creator && (
            <div className="bg-white rounded-2xl border border-hairline p-3.5 shadow-xs text-xs text-slate-gray flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-pebble text-ink-navy flex items-center justify-center font-semibold text-xs shrink-0 border border-hairline">
                {task.creator.fullName?.charAt(0) || 'C'}
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] text-mist-gray">Người tạo nhiệm vụ</span>
                <span className="font-semibold text-ink-navy truncate block text-xs">
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
        title="Xóa nhiệm vụ?"
        description={`Bạn có chắc chắn muốn xóa nhiệm vụ "${task.title}" không?`}
        warningNote="Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn nhiệm vụ."
        confirmLabel="Xác nhận xóa"
        variant="destructive"
        isLoading={deleteTaskMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default TaskDetailPage;
