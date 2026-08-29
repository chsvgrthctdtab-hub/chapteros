import React from 'react';
import { X, ArrowRight, Shield } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Cập nhật trạng thái nhiệm vụ</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nhiệm vụ</span>
            <p className="font-bold text-slate-900 text-xs mt-0.5 line-clamp-2">{task.title}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Trạng thái hiện tại:</span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border',
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
            <span className="text-xs font-bold text-slate-700 block mb-1">
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
                      'w-full flex items-center justify-between px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                      isDestructive
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                        : isComplete
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('w-1.5 h-1.5 rounded-full', nextConfig.colorClasses.dot)} />
                      <span>{nextConfig.label}</span>
                      {isComplete && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded font-normal">
                          (Tự động 100%)
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
