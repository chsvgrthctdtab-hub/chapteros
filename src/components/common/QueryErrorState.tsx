import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatErrorMessage } from '@/lib/error-formatter';

export interface QueryErrorStateProps {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}

export function QueryErrorState({
  title,
  error,
  onRetry,
  className = '',
}: QueryErrorStateProps) {
  const formatted = formatErrorMessage(error);
  const displayTitle = title || formatted.title;
  const displayMessage = formatted.message;

  return (
    <div
      className={`p-6 sm:p-8 rounded-xl border border-rose-200/80 bg-rose-50/30 text-center flex flex-col items-center justify-center my-3 ${className}`}
    >
      <div className="w-10 h-10 rounded-lg bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mb-3 shadow-2xs">
        <AlertCircle className="w-5 h-5" />
      </div>

      <h3 className="text-sm font-semibold text-slate-900 mb-0.5">
        {displayTitle}
      </h3>

      <p className="text-xs text-slate-600 max-w-md leading-relaxed mb-4">
        {displayMessage}
      </p>

      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="font-medium gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Thử lại</span>
        </Button>
      )}
    </div>
  );
}
