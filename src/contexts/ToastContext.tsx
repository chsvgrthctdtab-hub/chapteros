import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { formatErrorMessage } from '@/lib/error-formatter';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
  success: (message: string, title?: string) => string;
  error: (errorOrMessage: unknown, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastItem, 'id'>) => {
      // Prevent duplicate messages shown concurrently
      const isDuplicate = toasts.some((t) => t.message === message && t.type === type);
      if (isDuplicate) {
        return '';
      }

      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Limit to max 5 visible toasts

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [toasts, dismissToast]
  );

  const success = useCallback(
    (message: string, title = 'Thành công') => {
      return showToast({ type: 'success', title, message });
    },
    [showToast]
  );

  const error = useCallback(
    (errorOrMessage: unknown, title?: string) => {
      const formatted = formatErrorMessage(errorOrMessage);
      return showToast({
        type: 'error',
        title: title || formatted.title,
        message: formatted.message,
        duration: 6000,
      });
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, title = 'Cảnh báo') => {
      return showToast({ type: 'warning', title, message });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, title = 'Thông báo') => {
      return showToast({ type: 'info', title, message });
    },
    [showToast]
  );

  const contextValue = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
      success,
      error,
      warning,
      info,
    }),
    [toasts, showToast, dismissToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Accessible Toast Viewport */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-md w-full px-4 sm:px-0 pointer-events-none"
      >
        <AnimatePresence mode="sync">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto"
            >
              <ToastCard toast={t} onDismiss={() => dismissToast(t.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const getTheme = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
          containerClass: 'bg-white border-emerald-200 shadow-emerald-500/10',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-100',
          titleColor: 'text-emerald-950',
          textColor: 'text-slate-600',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
          containerClass: 'bg-white border-rose-200 shadow-rose-500/10',
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-100',
          titleColor: 'text-rose-950',
          textColor: 'text-slate-600',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
          containerClass: 'bg-white border-amber-200 shadow-amber-500/10',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-100',
          titleColor: 'text-amber-950',
          textColor: 'text-slate-600',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
          containerClass: 'bg-white border-sky-200 shadow-sky-500/10',
          badgeClass: 'bg-sky-50 text-sky-800 border-sky-100',
          titleColor: 'text-sky-950',
          textColor: 'text-slate-600',
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl transition-all ${theme.containerClass}`}
    >
      {theme.icon}
      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <h4 className={`text-sm font-semibold leading-tight mb-1 ${theme.titleColor}`}>
            {toast.title}
          </h4>
        )}
        <p className={`text-xs leading-relaxed ${theme.textColor}`}>
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Đóng thông báo"
        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 -mr-1 -mt-1 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
