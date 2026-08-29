import { type ReactNode } from 'react';
import { AlertTriangle, Trash2, HelpCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  warningNote?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  warningNote,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  variant = 'destructive',
  isLoading = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: <Trash2 className="w-5 h-5" />,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/10',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/10',
        };
      case 'primary':
      default:
        return {
          icon: <HelpCircle className="w-5 h-5" />,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10',
        };
    }
  };

  const style = getVariantStyles();

  return (
    <Dialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 sm:p-6 rounded-xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${style.iconBg}`}>
              {style.icon}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <DialogTitle className="text-base font-semibold text-slate-900 leading-snug">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Custom child content */}
        {children && <div className="my-2">{children}</div>}

        {/* Warning Note */}
        {warningNote && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2 my-1">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{warningNote}</p>
          </div>
        )}

        <DialogFooter className="mt-3 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="font-medium"
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className={`font-medium gap-1.5 ${style.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
