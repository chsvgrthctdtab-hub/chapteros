import React from 'react';

export function PageLoadingFallback() {
  return (
    <div className="flex h-[45vh] min-h-[240px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#2e89f7]" />
        <span className="text-xs font-medium text-slate-gray">Đang tải trang...</span>
      </div>
    </div>
  );
}
