import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Clock,
  Calendar,
  CheckSquare,
  Wallet,
  Boxes,
  Info,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { NotificationItem } from '../types/notification.types';
import { formatRelativeTime } from '@/features/audit-logs/utils/audit-log-formatter';

interface NotificationItemRowProps {
  item: NotificationItem;
  onMarkRead: (key: string) => void;
  onClosePopover?: () => void;
}

export function NotificationItemRow({
  item,
  onMarkRead,
  onClosePopover,
}: NotificationItemRowProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!item.isRead) {
      onMarkRead(item.key);
    }
    if (onClosePopover) {
      onClosePopover();
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'task':
        return <CheckSquare className="w-3.5 h-3.5" />;
      case 'activity':
        return <Calendar className="w-3.5 h-3.5" />;
      case 'finance':
        return <Wallet className="w-3.5 h-3.5" />;
      case 'integration':
        return <Boxes className="w-3.5 h-3.5" />;
      default:
        return <Info className="w-3.5 h-3.5" />;
    }
  };

  const getTypeStyles = () => {
    switch (item.type) {
      case 'danger':
        return {
          iconBg: 'bg-rose-100 text-rose-700',
          dotBg: 'bg-rose-600',
          border: 'border-rose-100',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-700',
          dotBg: 'bg-amber-500',
          border: 'border-amber-100',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-100 text-emerald-700',
          dotBg: 'bg-emerald-600',
          border: 'border-emerald-100',
        };
      default:
        return {
          iconBg: 'bg-blue-100 text-blue-700',
          dotBg: 'bg-blue-600',
          border: 'border-blue-100',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      onClick={handleClick}
      className={`group relative p-3 transition-colors cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 flex items-start gap-3 ${
        !item.isRead ? 'bg-blue-50/30' : 'bg-white'
      }`}
    >
      {/* Icon */}
      <div
        className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${styles.iconBg}`}
      >
        {getCategoryIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-1.5">
          <h4
            className={`text-xs font-semibold truncate leading-tight ${
              !item.isRead ? 'text-slate-900 font-bold' : 'text-slate-700'
            }`}
          >
            {item.title}
          </h4>
          {!item.isRead && (
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${styles.dotBg}`}
              title="Chưa đọc"
            />
          )}
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {item.message}
        </p>

        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
          <span>{formatRelativeTime(item.createdAt)}</span>

          {!item.isRead && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(item.key);
              }}
              className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Đánh dấu đã đọc"
            >
              <Check className="w-3 h-3" />
              <span>Đã đọc</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
