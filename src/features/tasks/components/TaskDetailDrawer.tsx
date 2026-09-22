import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Target,
  RotateCcw,
  Check,
  XCircle,
} from 'lucide-react';
import type { TaskListItem, TaskStatus } from '../types/task.types';
import { TASK_STATUSES, formatDueDateInfo } from '../types/task.types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskProgressBar } from './TaskProgressBar';
import { getAllowedTransitions } from '../utils/task-workflow';
import { SlideOverDrawer } from '@/components/common/SlideOverDrawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskDetailDrawerProps {
  task: TaskListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (task: TaskListItem) => void;
  onDelete?: (task: TaskListItem) => void;
  onUpdateStatus?: (taskId: string, targetStatus: TaskStatus, currentProgress?: number) => Promise<void>;
  onUpdateProgress?: (progress: number) => Promise<void>;
  canManage?: boolean;
  userRole?: string | null;
  currentUserId?: string;
  isUpdating?: boolean;
}

const WORKFLOW_STEPS: Array<{ key: TaskStatus; label: string; number: number }> = [
  { key: 'todo', label: 'Cần làm', number: 1 },
  { key: 'in_progress', label: 'Đang làm', number: 2 },
  { key: 'in_review', label: 'Chờ duyệt', number: 3 },
  { key: 'completed', label: 'Hoàn thành', number: 4 },
];

export function TaskDetailDrawer({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdateProgress,
  canManage = false,
  userRole,
  currentUserId,
  isUpdating = false,
}: TaskDetailDrawerProps) {
  const [, setSliderProgress] = useState<number>(0);

  useEffect(() => {
    if (task) {
      setSliderProgress(task.progress || 0);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const dueInfo = formatDueDateInfo(task.dueDate, task.status);
  const isAssignee = Boolean(currentUserId && task.assignedTo === currentUserId);
  const canUpdate = canManage || isAssignee;
  const allowedTransitions = getAllowedTransitions(task.status, userRole);
  const taskCode = task.id.length > 8 ? `TSK-${task.id.slice(0, 6).toUpperCase()}` : task.id;
  const currentStepIndex = WORKFLOW_STEPS.findIndex((s) => s.key === task.status);

  const headerActions = (
    <div className="flex items-center gap-1">
      <Link
        to={`/tasks/${task.id}`}
        className="p-1.5 text-slate-gray hover:text-ink-navy hover:bg-pebble rounded-lg transition-colors"
        title="Mở toàn màn hình"
      >
        <ExternalLink className="w-4 h-4" />
      </Link>

      {canManage && onEdit && (
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="p-1.5 text-slate-gray hover:text-ink-navy hover:bg-pebble rounded-lg transition-colors cursor-pointer"
          title="Chỉnh sửa nhiệm vụ"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )}

      {canManage && onDelete && (
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="p-1.5 text-slate-gray hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          title="Xóa nhiệm vụ"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const headerBadge = (
    <div className="flex items-center gap-1.5 flex-wrap">
      <TaskPriorityBadge priority={task.priority} size="sm" />
      <TaskStatusBadge status={task.status} size="sm" />
      <span className="font-mono tabular-nums text-xs text-mist-gray font-semibold ml-1">
        #{taskCode}
      </span>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between w-full text-xs">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClose}
        className="text-xs h-8 text-slate-gray bg-white hover:bg-pebble hover:text-ink-navy border-hairline rounded-lg"
      >
        Đóng
      </Button>

      <Link
        to={`/tasks/${task.id}`}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-signal-blue text-white hover:bg-[#005be0] font-semibold text-xs transition-colors shadow-xs"
      >
        <span>Chi tiết đầy đủ</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );

  return (
    <SlideOverDrawer
      id="task-detail-drawer"
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      tag="Chi tiết nhiệm vụ"
      badge={headerBadge}
      headerActions={headerActions}
      size="2xl"
      footer={footer}
    >
      {/* Workflow Timeline */}
      <div className="space-y-2.5">
        <h3 className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
          Tiến trình thực hiện
        </h3>

        {task.status === 'cancelled' ? (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">Công việc đã bị hủy</span>
          </div>
        ) : (
          <div className="p-3.5 bg-cloud border border-hairline rounded-xl space-y-2">
            <div className="grid grid-cols-4 gap-1 relative">
              {WORKFLOW_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors mb-1 tabular-nums',
                        isCurrent
                          ? 'bg-signal-blue text-white border-signal-blue ring-2 ring-signal-blue/20'
                          : isPassed
                          ? 'bg-[#e6f0ff] text-signal-blue border-[#d4e4fa]'
                          : 'bg-white text-mist-gray border-hairline'
                      )}
                    >
                      {isPassed ? <Check className="w-3 h-3 text-signal-blue" /> : step.number}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-medium leading-tight',
                        isCurrent ? 'text-ink-navy font-bold' : isPassed ? 'text-slate-gray' : 'text-mist-gray'
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

        {/* Quick Transition Action Buttons */}
        {allowedTransitions.length > 0 && canUpdate && onUpdateStatus && (
          <div className="pt-1 flex flex-wrap gap-1.5">
            {allowedTransitions.map((nextStatus) => {
              const isApprove = nextStatus === 'completed';
              const isReject = task.status === 'in_review' && nextStatus === 'in_progress';
              const isCancel = nextStatus === 'cancelled';
              const isStart = nextStatus === 'in_progress' && task.status === 'todo';
              const isReview = nextStatus === 'in_review';

              let label = 'Chuyển';
              if (isApprove) label = 'Duyệt & Hoàn thành';
              else if (isReject) label = 'Yêu cầu sửa đổi';
              else if (isCancel) label = 'Hủy nhiệm vụ';
              else if (isStart) label = 'Bắt đầu làm';
              else if (isReview) label = 'Gửi chờ duyệt';
              else label = TASK_STATUSES[nextStatus].label;

              return (
                <button
                  key={nextStatus}
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onUpdateStatus(task.id, nextStatus, task.progress)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs',
                    isApprove
                      ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                      : isReject
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                      : isCancel
                      ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                      : 'bg-white text-ink-navy border-hairline hover:bg-cloud'
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
        )}
      </div>

      {/* Progress Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
            Tiến độ
          </h3>
          <span className="text-xs font-bold text-ink-navy tabular-nums">
            {task.progress}%
          </span>
        </div>

        <TaskProgressBar progress={task.progress} size="md" showLabel={false} />

        {/* Quick Progress Buttons */}
        {canUpdate && onUpdateProgress && (
          <div className="flex items-center gap-1.5 pt-1">
            {[0, 25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                disabled={isUpdating}
                onClick={() => onUpdateProgress(pct)}
                className={cn(
                  'flex-1 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer tabular-nums',
                  task.progress === pct
                    ? 'bg-signal-blue text-white border-signal-blue shadow-xs'
                    : 'bg-white text-slate-gray border-hairline hover:bg-pebble hover:text-ink-navy'
                )}
              >
                {pct}%
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="space-y-2.5">
        <h3 className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
          Phân công & Ngữ cảnh
        </h3>

        <div className="bg-cloud rounded-xl border border-hairline p-4 space-y-3 text-xs">
          {/* Assignee */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-gray font-medium shrink-0">Người phụ trách:</span>
            <div className="text-right">
              {task.assignee ? (
                <div className="flex items-center gap-2 justify-end">
                  {task.assignee.avatarUrl ? (
                    <img
                      src={task.assignee.avatarUrl}
                      alt={task.assignee.fullName}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover shrink-0 border border-hairline"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#e6f0ff] text-signal-blue font-bold text-[9px] flex items-center justify-center shrink-0 border border-[#d4e4fa]">
                      {task.assignee.fullName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-ink-navy text-xs">
                      {task.assignee.fullName}
                    </p>
                    {task.assignee.studentId && (
                      <p className="text-[10px] text-slate-gray font-mono tabular-nums">
                        MSSV: {task.assignee.studentId}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-mist-gray italic">Chưa phân công</span>
              )}
            </div>
          </div>

          {/* Activity Context */}
          <div className="flex items-start justify-between gap-2 pt-2.5 border-t border-hairline">
            <span className="text-slate-gray font-medium shrink-0">Hoạt động:</span>
            <div className="text-right">
              {task.activity ? (
                <Link
                  to={`/activities/${task.activity.id}`}
                  className="inline-flex items-center gap-1.5 font-semibold text-ink-navy hover:text-signal-blue bg-white px-2 py-1 rounded-full border border-hairline shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5 text-signal-blue shrink-0" />
                  <span className="truncate max-w-[200px]">{task.activity.title}</span>
                </Link>
              ) : (
                <span className="text-mist-gray">Nhiệm vụ độc lập</span>
              )}
            </div>
          </div>

          {/* Plan Context */}
          {task.activity?.plan && (
            <div className="flex items-start justify-between gap-2 pt-2.5 border-t border-hairline">
              <span className="text-slate-gray font-medium shrink-0">Kế hoạch:</span>
              <div className="text-right">
                <Link
                  to={`/plans/${task.activity.plan.id}`}
                  className="inline-flex items-center gap-1.5 font-semibold text-signal-blue hover:underline bg-[#e6f0ff]/60 px-2.5 py-1 rounded-full border border-[#d4e4fa] shadow-xs"
                >
                  <Target className="w-3.5 h-3.5 text-signal-blue shrink-0" />
                  <span className="truncate max-w-[200px]">{task.activity.plan.name}</span>
                </Link>
              </div>
            </div>
          )}

          {/* Term */}
          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-hairline">
            <span className="text-slate-gray font-medium shrink-0">Nhiệm kỳ:</span>
            <span className="font-semibold text-ink-navy">
              {task.term?.name || 'Nhiệm kỳ hiện tại'}
            </span>
          </div>

          {/* Due Date & Overdue Info */}
          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-hairline">
            <span className="text-slate-gray font-medium shrink-0">Hạn chót:</span>
            <div>
              {dueInfo.isOverdue ? (
                <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-xs bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 tabular-nums">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{dueInfo.formattedDate} ({dueInfo.text})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-ink-navy tabular-nums">
                  <Calendar className="w-3.5 h-3.5 text-mist-gray shrink-0" />
                  <span>{dueInfo.formattedDate}</span>
                </span>
              )}
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-hairline text-mist-gray text-[11px] tabular-nums">
            <span>Ngày tạo:</span>
            <span>
              {new Date(task.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
          Mô tả nhiệm vụ
        </h3>
        <div className="p-4 bg-cloud rounded-xl border border-hairline text-xs text-ink-navy leading-relaxed min-h-[80px]">
          {task.description ? (
            <p className="whitespace-pre-wrap">{task.description}</p>
          ) : (
            <p className="text-mist-gray italic">Chưa có mô tả chi tiết cho nhiệm vụ này.</p>
          )}
        </div>
      </div>
    </SlideOverDrawer>
  );
}
