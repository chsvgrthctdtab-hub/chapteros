import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, CheckCircle2, Archive } from 'lucide-react';
import type { TermStatus } from '@/types';

interface TermStatusBadgeProps {
  status: TermStatus | string;
  isCurrent?: boolean;
  className?: string;
  showIcon?: boolean;
}

export function TermStatusBadge({
  status,
  isCurrent = false,
  className = '',
  showIcon = true,
}: TermStatusBadgeProps) {
  if (isCurrent) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs ${className}`}
      >
        {showIcon && <Sparkles className="h-3 w-3 text-emerald-600 shrink-0" />}
        <span>Hiện tại</span>
      </span>
    );
  }

  switch (status) {
    case 'active':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 ${className}`}
        >
          {showIcon && <Sparkles className="h-3 w-3 text-emerald-600 shrink-0" />}
          <span>Đang hoạt động</span>
        </span>
      );
    case 'draft':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/70 ${className}`}
        >
          {showIcon && <Clock className="h-3 w-3 text-amber-600 shrink-0" />}
          <span>Dự thảo / Sắp tới</span>
        </span>
      );
    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cloud text-slate-gray border border-hairline ${className}`}
        >
          {showIcon && <CheckCircle2 className="h-3 w-3 text-mist-gray shrink-0" />}
          <span>Đã kết thúc</span>
        </span>
      );
    case 'archived':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cloud text-mist-gray border border-hairline ${className}`}
        >
          {showIcon && <Archive className="h-3 w-3 text-mist-gray shrink-0" />}
          <span>Lưu trữ</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cloud text-slate-gray border border-hairline ${className}`}
        >
          <span>{status}</span>
        </span>
      );
  }
}
