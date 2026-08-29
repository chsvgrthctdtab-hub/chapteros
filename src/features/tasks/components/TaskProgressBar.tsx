import React from 'react';
import { cn } from '@/lib/utils';

interface TaskProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function TaskProgressBar({
  progress,
  className = '',
  showLabel = true,
  size = 'sm',
}: TaskProgressBarProps) {
  const cleanProgress = Math.min(100, Math.max(0, Math.round(progress || 0)));

  // Color mapping based on progress
  let barColor = 'bg-slate-400';
  if (cleanProgress === 100) {
    barColor = 'bg-emerald-600';
  } else if (cleanProgress >= 70) {
    barColor = 'bg-emerald-500';
  } else if (cleanProgress >= 30) {
    barColor = 'bg-sky-500';
  } else if (cleanProgress > 0) {
    barColor = 'bg-amber-500';
  }

  const heightClasses =
    size === 'xs' ? 'h-1' : size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-2.5' : 'h-2';

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-slate-500 font-medium">Tiến độ</span>
          <span className="font-semibold text-slate-700 font-mono">{cleanProgress}%</span>
        </div>
      )}
      <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', heightClasses)}>
        <div
          className={cn(heightClasses, 'rounded-full transition-all duration-300', barColor)}
          style={{ width: `${cleanProgress}%` }}
        />
      </div>
    </div>
  );
}
