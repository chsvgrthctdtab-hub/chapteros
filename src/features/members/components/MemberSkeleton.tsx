import React from 'react';

export function MemberTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
      <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 flex items-center justify-between gap-4 animate-pulse">
            {/* Avatar & Name */}
            <div className="flex items-center space-x-3 w-1/4">
              <div className="h-9 w-9 rounded-xl bg-slate-200 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-slate-200 rounded w-4/5" />
                <div className="h-2.5 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
            {/* Student ID */}
            <div className="h-4 bg-slate-200 rounded w-20" />
            {/* Class */}
            <div className="h-3.5 bg-slate-200 rounded w-24 hidden sm:block" />
            {/* Contact */}
            <div className="h-3.5 bg-slate-100 rounded w-32 hidden md:block" />
            {/* Term */}
            <div className="h-5 bg-slate-200 rounded-md w-24 hidden lg:block" />
            {/* Role */}
            <div className="h-5 bg-slate-200 rounded-md w-20" />
            {/* Status */}
            <div className="h-5 bg-slate-200 rounded-md w-20" />
            {/* Action */}
            <div className="h-7 w-7 bg-slate-100 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MemberCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3.5 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-slate-200 shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3.5 bg-slate-200 rounded w-28" />
                <div className="h-2.5 bg-slate-100 rounded w-16" />
              </div>
            </div>
            <div className="h-5 bg-slate-200 rounded w-16" />
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="h-3 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
            <div className="h-7 bg-slate-100 rounded w-16" />
            <div className="h-7 bg-slate-200 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
