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

  // Color mapping based on progress using Calendly system
  let barColor = 'bg-mist-gray';
  if (cleanProgress === 100) {
    barColor = 'bg-emerald-600';
  } else if (cleanProgress >= 50) {
    barColor = 'bg-signal-blue';
  } else if (cleanProgress > 0) {
    barColor = 'bg-[#006bff]/80';
  }

  const heightClasses =
    size === 'xs' ? 'h-1' : size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-2.5' : 'h-2';

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-slate-gray font-medium">Tiến độ</span>
          <span className="font-semibold text-ink-navy tabular-nums">{cleanProgress}%</span>
        </div>
      )}
      <div className={cn('w-full bg-pebble rounded-full overflow-hidden border border-hairline/60', heightClasses)}>
        <div
          className={cn(heightClasses, 'rounded-full transition-all duration-300', barColor)}
          style={{ width: `${cleanProgress}%` }}
        />
      </div>
    </div>
  );
}
