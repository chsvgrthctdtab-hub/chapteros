import { X, Shield } from 'lucide-react';
import type { TaskListItem, TaskStatus } from '../types/task.types';
import { TASK_STATUSES } from '../types/task.types';
import { getAllowedTransitions } from '../utils/task-workflow';
import { cn } from '@/lib/utils';

interface TaskQuickStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskListItem | null;
  onUpdateStatus: (status: TaskStatus, progress?: number) => Promise<void>;
  userRole?: string | null;
  isLoading?: boolean;
}

export function TaskQuickStatusModal({
  isOpen,
  onClose,
  task,
  onUpdateStatus,
  userRole,
  isLoading = false,
}: TaskQuickStatusModalProps) {
  if (!isOpen || !task) return null;

  const currentStatusConfig = TASK_STATUSES[task.status];
  const allowedTransitions = getAllowedTransitions(task.status, userRole);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-navy/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-hairline shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-cloud">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e6f0ff] border border-[#d4e4fa] text-signal-blue flex items-center justify-center shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-ink-navy">Cập nhật trạng thái nhiệm vụ</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-gray hover:text-ink-navy rounded-lg hover:bg-pebble cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <span className="text-[10px] font-semibold text-slate-gray uppercase tracking-wider">Nhiệm vụ</span>
            <p className="font-bold text-ink-navy text-xs mt-0.5 line-clamp-2">{task.title}</p>
          </div>

          <div className="p-3 bg-cloud rounded-xl border border-hairline flex items-center justify-between">
            <span className="text-xs text-slate-gray font-medium">Trạng thái hiện tại:</span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tabular-nums',
                currentStatusConfig.colorClasses.bg,
                currentStatusConfig.colorClasses.text,
                currentStatusConfig.colorClasses.border
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', currentStatusConfig.colorClasses.dot)} />
              <span>{currentStatusConfig.label}</span>
            </span>
          </div>

          {/* Transition Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-gray block mb-1 uppercase tracking-wider">
              Chuyển sang trạng thái:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {allowedTransitions.map((nextStatus) => {
                const nextConfig = TASK_STATUSES[nextStatus];
                const isDestructive = nextStatus === 'cancelled';
                const isComplete = nextStatus === 'completed';

                return (
                  <button
                    key={nextStatus}
                    type="button"
                    id={`transition-btn-${nextStatus}`}
                    disabled={isLoading}
                    onClick={async () => {
                      await onUpdateStatus(
                        nextStatus,
                        isComplete ? 100 : task.progress
                      );
                      onClose();
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs',
                      isDestructive
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                        : isComplete
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-cloud hover:bg-pebble text-ink-navy border-hairline'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', nextConfig.colorClasses.dot)} />
                      <span>{nextConfig.label}</span>
                    </span>
                    <span className="text-[10px] text-mist-gray">Chọn</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
