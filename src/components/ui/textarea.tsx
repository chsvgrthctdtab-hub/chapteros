import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink-navy placeholder:text-mist-gray shadow-sm transition-all duration-150 hover:border-slate-gray/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-signal-blue/20 focus-visible:border-signal-blue disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-pebble',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
