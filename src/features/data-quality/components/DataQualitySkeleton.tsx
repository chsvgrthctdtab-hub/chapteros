export function DataQualitySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="rounded-3xl bg-slate-800/20 h-56 p-6 border border-slate-700/30 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-3 w-1/2">
            <div className="h-6 w-32 bg-slate-700/40 rounded-lg" />
            <div className="h-9 w-3/4 bg-slate-700/40 rounded-xl" />
            <div className="h-4 w-1/2 bg-slate-700/30 rounded-md" />
          </div>
          <div className="h-28 w-28 rounded-full bg-slate-700/40" />
        </div>
        <div className="flex gap-4 pt-4 border-t border-slate-700/30">
          <div className="h-10 w-36 bg-slate-700/40 rounded-xl" />
          <div className="h-10 w-44 bg-slate-700/40 rounded-xl" />
        </div>
      </div>

      {/* KPI 4 Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-5 border border-slate-200 shadow-2xs space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-200 rounded-md" />
              <div className="h-8 w-8 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-8 w-16 bg-slate-300 rounded-lg" />
            <div className="h-3 w-full bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-6 w-48 bg-slate-200 rounded-lg" />
              <div className="h-8 w-32 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-20 bg-slate-50 border border-slate-200/70 rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="h-5 w-40 bg-slate-200 rounded-lg" />
            <div className="h-48 bg-slate-50 rounded-xl" />
          </div>
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="h-5 w-36 bg-slate-200 rounded-lg" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((k) => (
                <div key={k} className="h-10 bg-slate-50 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
