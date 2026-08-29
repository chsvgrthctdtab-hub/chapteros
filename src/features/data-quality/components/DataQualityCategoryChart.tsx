import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CATEGORY_META } from '../utils/quality-helpers';
import type { DataQualityCategory, DataQualitySummary } from '../types';
import { PieChart as PieChartIcon, CheckCircle2 } from 'lucide-react';

interface DataQualityCategoryChartProps {
  summary?: DataQualitySummary | null;
  selectedCategory?: DataQualityCategory | 'all';
  onSelectCategory: (cat: DataQualityCategory | 'all') => void;
}

export function DataQualityCategoryChart({
  summary,
  selectedCategory = 'all',
  onSelectCategory,
}: DataQualityCategoryChartProps) {
  const chartData = useMemo(() => {
    if (!summary?.byCategory) return [];

    const categories: DataQualityCategory[] = [
      'members',
      'terms',
      'activities',
      'tasks',
      'finance',
      'documents',
    ];

    return categories
      .map((cat) => {
        const meta = CATEGORY_META[cat];
        const breakdown = summary.byCategory[cat] || { total: 0, critical: 0, warning: 0, info: 0 };
        return {
          id: cat,
          name: meta?.label || cat,
          value: breakdown.total,
          color: meta?.color || '#94a3b8',
          critical: breakdown.critical,
          warning: breakdown.warning,
          info: breakdown.info,
        };
      })
      .filter((item) => item.value > 0);
  }, [summary]);

  const totalIssues = summary?.totalIssues ?? 0;

  return (
    <div className="rounded-xl bg-white p-6 border border-slate-200/90 shadow-2xs space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-emerald-700" />
            <span>Phân bổ theo danh mục</span>
          </h2>
          <p className="text-xs text-slate-500">Tỷ lệ vấn đề dữ liệu qua các phân hệ</p>
        </div>
      </div>

      {totalIssues === 0 || chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold text-slate-800">Không có dữ liệu lệch chuẩn</span>
          <span className="text-xs text-slate-500 mt-0.5">Tất cả các danh mục đều đạt chuẩn 100%</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart Container */}
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onClick={() => onSelectCategory(entry.id as DataQualityCategory)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl bg-slate-900 text-white p-2.5 shadow-xl text-xs space-y-1 z-50">
                          <div className="font-bold flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: data.color }}
                            />
                            <span>{data.name}</span>
                          </div>
                          <div className="text-slate-300">Tổng: {data.value} mục</div>
                          <div className="flex gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                            <span className="text-rose-400">Khẩn: {data.critical}</span>
                            <span className="text-amber-400">Cảnh báo: {data.warning}</span>
                            <span className="text-sky-400">Gợi ý: {data.info}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-mono text-slate-800">{totalIssues}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Vấn đề
              </span>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {chartData.map((item) => {
              const isSelected = selectedCategory === item.id;
              const percentage = Math.round((item.value / totalIssues) * 100);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onSelectCategory(
                      isSelected ? 'all' : (item.id as DataQualityCategory)
                    )
                  }
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-300'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-400 font-normal">{percentage}%</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-md text-[11px]">
                      {item.value}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
