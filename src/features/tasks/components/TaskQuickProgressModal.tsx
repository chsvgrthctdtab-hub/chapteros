import { useState, useEffect } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-navy/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-hairline shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-cloud">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e6f0ff] border border-[#d4e4fa] text-signal-blue flex items-center justify-center shadow-xs">
              <Percent className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-ink-navy">Cập nhật tiến độ nhiệm vụ</h3>
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

          {/* Current & Target Slider */}
          <div className="p-4 bg-cloud rounded-xl border border-hairline space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-gray">Tiến độ lựa chọn:</span>
              <span className="font-mono tabular-nums text-lg font-bold text-signal-blue">{progressValue}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progressValue}
              onChange={(e) => setProgressValue(Number(e.target.value))}
              className="w-full h-1.5 bg-pebble rounded-lg appearance-none cursor-pointer accent-signal-blue"
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
                    'flex-1 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer font-mono tabular-nums',
                    progressValue === preset
                      ? 'bg-signal-blue text-white border-signal-blue shadow-xs'
                      : 'bg-white text-slate-gray border-hairline hover:bg-pebble hover:text-ink-navy'
                  )}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-cloud border-t border-hairline flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-gray hover:text-ink-navy bg-white hover:bg-pebble border border-hairline rounded-lg transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            id="save-progress-btn"
            disabled={isLoading}
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-medium text-white bg-signal-blue hover:bg-[#005be0] disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            {isLoading ? 'Đang lưu...' : 'Lưu tiến độ'}
          </button>
        </div>
      </div>
    </div>
  );
}
