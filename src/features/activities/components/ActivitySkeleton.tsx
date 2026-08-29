import React from 'react';

export function ActivityTableSkeleton({ rowCount = 6 }: { rowCount?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
      <div className="animate-pulse">
        {/* Table Header */}
        <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded w-32" />
          <div className="h-4 bg-slate-200 rounded w-20" />
        </div>
        {/* Table Rows */}
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rowCount }).map((_, idx) => (
            <div key={idx} className="px-4 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-[200px] flex-1">
                <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-5 bg-slate-100 rounded-full w-20 shrink-0 hidden sm:block" />
              <div className="h-4 bg-slate-100 rounded w-24 shrink-0 hidden md:block" />
              <div className="h-4 bg-slate-100 rounded w-28 shrink-0 hidden lg:block" />
              <div className="h-4 bg-slate-200 rounded w-16 shrink-0" />
              <div className="h-6 bg-slate-100 rounded w-12 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ActivityCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs animate-pulse space-y-3.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-4 bg-slate-200 rounded-full w-16" />
          </div>
          <div className="space-y-1.5">
            <div className="h-5 bg-slate-200 rounded w-5/6" />
            <div className="h-3.5 bg-slate-100 rounded w-2/3" />
          </div>
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="h-3.5 bg-slate-100 rounded w-3/4" />
            <div className="h-3.5 bg-slate-100 rounded w-1/2" />
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="h-4 bg-slate-100 rounded w-20" />
            <div className="h-4 bg-slate-200 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityCalendarSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-slate-200 rounded w-36" />
        <div className="flex gap-1.5">
          <div className="h-8 bg-slate-100 rounded w-16" />
          <div className="h-8 bg-slate-100 rounded w-8" />
          <div className="h-8 bg-slate-100 rounded w-8" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-6 bg-slate-100 rounded" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-50 rounded-lg border border-slate-100 p-1.5" />
        ))}
      </div>
    </div>
  );
}

export function ActivityDetailSkeleton() {
  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-pulse">
      {/* Breadcrumbs */}
      <div className="h-4 bg-slate-200 rounded w-48" />

      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-5 bg-slate-200 rounded w-28" />
              <div className="h-5 bg-slate-200 rounded-full w-20" />
            </div>
            <div className="h-7 bg-slate-200 rounded w-3/4" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-slate-100 rounded-lg w-20" />
            <div className="h-9 bg-slate-200 rounded-lg w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-50 rounded-lg" />
          ))}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200/90 h-18" />
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/90 h-96" />
    </div>
  );
}
