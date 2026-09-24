import React from 'react';
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
}: TermStatusBadgeProps) {
  if (isCurrent) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs whitespace-nowrap shrink-0 ${className}`}
      >
        <span>Nhiệm kỳ hiện hành</span>
      </span>
    );
  }

  switch (status) {
    case 'active':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/70 whitespace-nowrap shrink-0 ${className}`}
        >
          <span>Chưa tổng kết</span>
        </span>
      );
    case 'draft':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 whitespace-nowrap shrink-0 ${className}`}
        >
          <span>Dự thảo / Sắp tới</span>
        </span>
      );
    case 'completed':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cloud text-slate-gray border border-hairline whitespace-nowrap shrink-0 ${className}`}
        >
          <span>Đã kết thúc</span>
        </span>
      );
    case 'archived':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cloud text-mist-gray border border-hairline whitespace-nowrap shrink-0 ${className}`}
        >
          <span>Đã lưu trữ</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cloud text-slate-gray border border-hairline whitespace-nowrap shrink-0 ${className}`}
        >
          <span>{status}</span>
        </span>
      );
  }
}
