import { type ReactNode } from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  className = '',
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-dashed border-slate-200/90 bg-slate-50/40 text-center flex flex-col items-center justify-center ${
        compact ? 'p-4 sm:p-5 my-1' : 'p-8 sm:p-10 my-3'
      } ${className}`}
    >
      <div
        className={`${
          compact ? 'w-8 h-8 mb-2' : 'w-10 h-10 mb-3'
        } rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center shadow-2xs`}
      >
        {icon || <FolderOpen className={compact ? 'w-4 h-4' : 'w-5 h-5'} />}
      </div>

      <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-0.5">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-2.5">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button
          type="button"
          onClick={onAction}
          size="sm"
          className={`font-medium gap-1.5 cursor-pointer ${
            compact ? 'h-7 text-xs px-2.5 rounded-lg' : ''
          }`}
        >
          {actionIcon}
          <span>{actionLabel}</span>
        </Button>
      )}
    </div>
  );
}
