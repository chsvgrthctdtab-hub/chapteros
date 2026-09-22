export function DashboardSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6 animate-pulse pb-8">
      {/* Tier 1: Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-hairline">
        <div className="space-y-2">
          <div className="h-3.5 w-32 bg-pebble rounded" />
          <div className="h-6 w-56 bg-pebble rounded" />
          <div className="h-3 w-72 bg-cloud rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-32 bg-pebble rounded-lg" />
          <div className="h-8 w-16 bg-pebble rounded-lg" />
        </div>
      </div>

      {/* Tier 1: Quick Action Bar Skeleton */}
      <div className="h-12 w-full bg-cloud border border-hairline rounded-xl" />

      {/* Tier 1: 6 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 bg-white border border-hairline rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <div className="h-2.5 w-16 bg-pebble rounded" />
              <div className="h-7 w-7 bg-pebble rounded-lg" />
            </div>
            <div className="h-6 w-20 bg-pebble rounded" />
            <div className="h-2.5 w-24 bg-cloud rounded" />
          </div>
        ))}
      </div>

      {/* Tier 2: Operational Priority (Activities & Tasks) Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <div className="h-64 bg-white border border-hairline rounded-xl p-4 space-y-3">
          <div className="h-4 w-36 bg-pebble rounded" />
          <div className="space-y-2 pt-1">
            {[1, 2, 3].map((k) => (
              <div key={k} className="h-12 bg-cloud rounded-lg" />
            ))}
          </div>
        </div>

        <div className="h-64 bg-white border border-hairline rounded-xl p-4 space-y-3">
          <div className="h-4 w-36 bg-pebble rounded" />
          <div className="space-y-2 pt-1">
            {[1, 2, 3].map((k) => (
              <div key={k} className="h-12 bg-cloud rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Tier 3: Daily Operations, Finance & Work Progress Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        <div className="lg:col-span-5 h-72 bg-white border border-hairline rounded-xl p-4 space-y-3">
          <div className="h-4 w-32 bg-pebble rounded" />
          <div className="h-44 bg-cloud rounded-lg" />
        </div>

        <div className="lg:col-span-7 space-y-5">
          <div className="h-36 bg-white border border-hairline rounded-xl p-4 space-y-3">
            <div className="h-4 w-28 bg-pebble rounded" />
            <div className="h-16 bg-cloud rounded-lg" />
          </div>
          <div className="h-32 bg-white border border-hairline rounded-xl p-4 space-y-3">
            <div className="h-4 w-28 bg-pebble rounded" />
            <div className="h-12 bg-cloud rounded-lg" />
          </div>
        </div>
      </div>

      {/* Tier 4: Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <div className="h-68 bg-white border border-hairline rounded-xl p-4 space-y-3">
          <div className="h-4 w-40 bg-pebble rounded" />
          <div className="h-48 bg-cloud rounded-lg" />
        </div>
        <div className="h-68 bg-white border border-hairline rounded-xl p-4 space-y-3">
          <div className="h-4 w-40 bg-pebble rounded" />
          <div className="h-48 bg-cloud rounded-lg" />
        </div>
      </div>
    </div>
  );
}
