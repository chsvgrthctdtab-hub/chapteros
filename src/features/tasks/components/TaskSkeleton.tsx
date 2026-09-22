import React from 'react';

interface TaskSkeletonProps {
  viewMode: 'table' | 'kanban' | 'cards';
  count?: number;
}

export function TaskSkeleton({ viewMode, count = 6 }: TaskSkeletonProps) {
  if (viewMode === 'table') {
    return (
      <div className="bg-white rounded-xl border border-hairline shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-cloud border-b border-hairline text-[11px] font-semibold text-mist-gray uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[260px]">Task</th>
                <th className="py-3 px-3.5 min-w-[120px]">Status</th>
                <th className="py-3 px-3 min-w-[100px]">Priority</th>
                <th className="py-3 px-3.5 min-w-[160px]">Assignee</th>
                <th className="py-3 px-3.5 min-w-[170px]">Activity</th>
                <th className="py-3 px-3.5 min-w-[140px]">Due Date</th>
                <th className="py-3 px-3.5 min-w-[120px]">Progress</th>
                <th className="py-3 px-4 text-right min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline animate-pulse">
              {Array.from({ length: count }).map((_, i) => (
                <tr key={i} className="h-14">
                  <td className="py-3 px-4">
                    <div className="space-y-1.5">
                      <div className="h-3.5 bg-pebble rounded w-44" />
                      <div className="h-2.5 bg-cloud rounded w-24" />
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="h-5 bg-pebble rounded-md w-20" />
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="h-5 bg-pebble rounded-md w-16" />
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5.5 h-5.5 bg-pebble rounded-full shrink-0" />
                      <div className="h-3 bg-pebble rounded w-24" />
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="h-5 bg-cloud rounded-md w-28" />
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="h-3.5 bg-pebble rounded w-20" />
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="space-y-1 w-24">
                      <div className="h-2 bg-cloud rounded w-8" />
                      <div className="h-1.5 bg-pebble rounded w-full" />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-6 h-6 bg-cloud rounded" />
                      <div className="w-6 h-6 bg-cloud rounded" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (viewMode === 'kanban') {
    return (
      <div className="w-full overflow-x-auto pb-4">
        <div className="flex gap-3.5 min-w-[1180px] items-start animate-pulse">
          {Array.from({ length: 5 }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="flex-1 flex flex-col min-w-[230px] max-w-[280px] rounded-xl border border-hairline bg-cloud p-2.5 space-y-2.5"
            >
              <div className="p-2 border-b border-hairline bg-white rounded-lg flex items-center justify-between">
                <div className="h-3.5 bg-pebble rounded w-20" />
                <div className="h-4 bg-cloud rounded-full w-6" />
              </div>
              <div className="space-y-2.5 min-h-[400px]">
                {Array.from({ length: 3 }).map((_, cardIdx) => (
                  <div
                    key={cardIdx}
                    className="bg-white rounded-xl p-3 border border-hairline shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-pebble rounded w-16" />
                      <div className="h-3 bg-cloud rounded w-10" />
                    </div>
                    <div className="h-3.5 bg-pebble rounded w-full" />
                    <div className="h-3 bg-cloud rounded w-3/4" />
                    <div className="pt-2 border-t border-hairline flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4.5 h-4.5 bg-pebble rounded-full" />
                        <div className="h-2.5 bg-pebble rounded w-14" />
                      </div>
                      <div className="h-2.5 bg-pebble rounded w-16" />
                    </div>
                    <div className="h-1.5 bg-cloud rounded w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Cards Grid view skeleton
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-hairline p-4 space-y-3.5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 bg-pebble rounded w-16" />
              <div className="h-5 bg-pebble rounded w-20" />
            </div>
            <div className="h-3 bg-cloud rounded w-12" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 bg-pebble rounded w-full" />
            <div className="h-3 bg-cloud rounded w-4/5" />
          </div>
          <div className="h-5 bg-cloud rounded w-28" />
          <div className="h-2 bg-pebble rounded w-full" />
          <div className="pt-3 border-t border-hairline flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-pebble rounded-full" />
              <div className="h-3 bg-pebble rounded w-20" />
            </div>
            <div className="h-3 bg-pebble rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
