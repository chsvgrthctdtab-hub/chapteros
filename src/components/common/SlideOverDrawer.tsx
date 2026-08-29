import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tag?: string;
  badge?: React.ReactNode;
  headerActions?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  id?: string;
  className?: string;
}

const sizeClasses = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export function SlideOverDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  tag,
  badge,
  headerActions,
  size = '2xl',
  children,
  footer,
  id,
  className,
}: SlideOverDrawerProps) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id={id ? `${id}-container` : 'slide-over-drawer-container'}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end transition-opacity animate-in fade-in duration-200"
    >
      {/* Click backdrop to close */}
      <div
        id={id ? `${id}-backdrop` : 'slide-over-drawer-backdrop'}
        className="fixed inset-0 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div
        id={id || 'slide-over-drawer-panel'}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 border-l border-slate-200',
          sizeClasses[size],
          className
        )}
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              {(tag || badge) && (
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {tag && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  )}
                  {badge}
                </div>
              )}
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">
                {title}
              </h2>
              {subtitle && (
                <div className="text-xs text-slate-500 line-clamp-2">{subtitle}</div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {headerActions}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close panel</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {children}
        </div>

        {/* Drawer Footer (Optional) */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 shrink-0 flex items-center justify-between gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
