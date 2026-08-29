export function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" id="report-skeleton">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-100 border border-slate-200/60 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-8 rounded-lg bg-slate-200" />
            </div>
            <div className="h-7 w-28 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-72 rounded-xl bg-slate-100 border border-slate-200/60 p-4 space-y-3">
          <div className="h-5 w-40 bg-slate-200 rounded" />
          <div className="h-52 w-full bg-slate-200/50 rounded-lg" />
        </div>
        <div className="h-72 rounded-xl bg-slate-100 border border-slate-200/60 p-4 space-y-3">
          <div className="h-5 w-40 bg-slate-200 rounded" />
          <div className="h-52 w-full bg-slate-200/50 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
