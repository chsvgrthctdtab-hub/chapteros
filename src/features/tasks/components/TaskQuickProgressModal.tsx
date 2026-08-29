import React, { useState, useEffect } from 'react';
import { X, Percent } from 'lucide-react';
import type { TaskListItem } from '../types/task.types';
import { cn } from '@/lib/utils';

interface TaskQuickProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskListItem | null;
  onUpdateProgress: (progress: number) => Promise<void>;
  isLoading?: boolean;
}

export function TaskQuickProgressModal({
  isOpen,
  onClose,
  task,
  onUpdateProgress,
  isLoading = false,
}: TaskQuickProgressModalProps) {
  const [progressValue, setProgressValue] = useState<number>(0);

  useEffect(() => {
    if (task) {
      setProgressValue(task.progress || 0);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const presets = [0, 25, 50, 75, 100];

  const handleSave = async () => {
    await onUpdateProgress(progressValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Cập nhật tiến độ nhiệm vụ</h3>
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

          {/* Current & Target Slider */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Tiến độ lựa chọn:</span>
              <span className="font-mono text-lg font-bold text-emerald-700">{progressValue}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progressValue}
              onChange={(e) => setProgressValue(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
            />

            {/* Quick Presets */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  id={`preset-btn-${preset}`}
                  onClick={() => setProgressValue(preset)}
                  className={cn(
                    'flex-1 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer font-mono',
                    progressValue === preset
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            id="save-progress-btn"
            disabled={isLoading}
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            {isLoading ? 'Đang lưu...' : 'Lưu tiến độ'}
          </button>
        </div>
      </div>
    </div>
  );
}
