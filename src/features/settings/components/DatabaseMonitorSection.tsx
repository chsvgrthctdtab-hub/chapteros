import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Activity,
  Layers,
  Clock,
  Code2,
  ArrowUpRight,
} from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

interface TableStat {
  id: string;
  name: string;
  description: string;
  category: string;
  count: number | null;
  loading: boolean;
  error?: string | null;
}

const TRACKED_TABLES: Omit<TableStat, 'count' | 'loading' | 'error'>[] = [
  {
    id: 'members',
    name: 'members',
    description: 'Hồ sơ hội viên & thông tin cá nhân',
    category: 'Nhân sự',
  },
  {
    id: 'term_members',
    name: 'term_members',
    description: 'Phân công hội viên theo từng nhiệm kỳ',
    category: 'Nhiệm kỳ',
  },
  {
    id: 'terms',
    name: 'terms',
    description: 'Danh mục nhiệm kỳ & niên khóa',
    category: 'Nhiệm kỳ',
  },
  {
    id: 'activities',
    name: 'activities',
    description: 'Sự kiện, buổi họp & phong trào sinh hoạt',
    category: 'Hoạt động',
  },
  {
    id: 'tasks',
    name: 'tasks',
    description: 'Công việc & phân công phụ trách',
    category: 'Công việc',
  },
  {
    id: 'finance_transactions',
    name: 'finance_transactions',
    description: 'Chứng từ thu - chi ngân quỹ',
    category: 'Tài chính',
  },
  {
    id: 'audit_logs',
    name: 'audit_logs',
    description: 'Nhật ký truy vết thao tác & bảo mật',
    category: 'Kiểm toán',
  },
];

interface DatabaseMonitorSectionProps {
  organizationId?: string;
  organizationName?: string;
}

export function DatabaseMonitorSection({ organizationId }: DatabaseMonitorSectionProps) {
  const toast = useToast();
  const [tables, setTables] = useState<TableStat[]>(() =>
    TRACKED_TABLES.map((t) => ({ ...t, count: null, loading: true, error: null }))
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Supabase Project Ref from environment or fallback
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const projectRef = supabaseUrl.includes('supabase.co')
    ? supabaseUrl.replace('https://', '').split('.')[0]
    : 'mjunrouwyzlrhqctesmw';

  const fetchTableCounts = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setTables((prev) => prev.map((t) => ({ ...t, loading: false, count: 0 })));
      return;
    }

    setIsRefreshing(true);
    const startTime = performance.now();

    try {
      const results = await Promise.allSettled(
        TRACKED_TABLES.map(async (table) => {
          let query = supabase.from(table.id).select('*', { count: 'exact', head: true });
          if (organizationId) {
            query = query.eq('organization_id', organizationId);
          }
          const { count, error } = await query;
          if (error) {
            // Some tables might not have organization_id; fallback to plain count
            const fallback = await supabase.from(table.id).select('*', { count: 'exact', head: true });
            if (fallback.error) {
              throw fallback.error;
            }
            return { id: table.id, count: fallback.count ?? 0 };
          }
          return { id: table.id, count: count ?? 0 };
        })
      );

      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      setLastChecked(new Date());

      setTables((prev) =>
        prev.map((t, idx) => {
          const res = results[idx];
          if (res.status === 'fulfilled') {
            return { ...t, count: res.value.count, loading: false, error: null };
          } else {
            return {
              ...t,
              count: null,
              loading: false,
              error: (res.reason as { message?: string })?.message || 'Lỗi truy vấn',
            };
          }
        })
      );
    } catch {
      toast.error('Không thể kiểm tra dữ liệu Supabase.');
    } finally {
      setIsRefreshing(false);
    }
  }, [organizationId, toast]);

  useEffect(() => {
    fetchTableCounts();
  }, [fetchTableCounts]);

  const totalRecords = tables.reduce((acc, t) => acc + (t.count ?? 0), 0);
  const activeTablesCount = tables.filter((t) => !t.error).length;

  return (
    <div className="relative rounded-2xl bg-[#090D16] border border-slate-800 shadow-xl overflow-hidden text-slate-100">
      {/* Header section with title and actions - Pure Clean Monochrome / Slate */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80 bg-[#0D121F]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 border border-slate-700 shadow-inner">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Giám Sát Bảng Dữ Liệu Supabase
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Realtime Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Theo dõi trực tiếp dung lượng bản ghi và độ trễ kết nối tầng vật lý theo thời gian thực
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTableCounts}
              disabled={isRefreshing}
              className="text-xs h-8 bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white cursor-pointer shadow-xs font-medium"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Đang đồng bộ...' : 'Quét lại'}
            </Button>
            <a
              href={`https://supabase.com/dashboard/project/${projectRef}/editor`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                className="text-xs h-8 bg-white hover:bg-slate-100 text-slate-900 cursor-pointer shadow-sm font-semibold flex items-center gap-1.5 border border-transparent"
              >
                <span>Supabase Studio</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </div>
        </div>

        {/* 4 KPI Quick Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-[#111726] border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Tổng bản ghi</span>
              <Layers className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1.5 tracking-tight">
              {isRefreshing && tables[0]?.loading ? (
                <span className="text-xs text-slate-400 font-normal">Đang đếm...</span>
              ) : (
                totalRecords.toLocaleString('vi-VN')
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Trên 7 bảng hệ thống</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#111726] border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Bảng hoạt động</span>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1.5 tracking-tight">
              {activeTablesCount} / {TRACKED_TABLES.length}
            </div>
            <p className="text-[11px] text-emerald-400 font-medium mt-0.5">Sẵn sàng truy vấn</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#111726] border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Độ trễ mạng</span>
              <Activity className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1.5 tracking-tight">
              {latencyMs !== null ? `${latencyMs} ms` : '—'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Supabase REST API</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#111726] border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Lần quét gần nhất</span>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-base font-bold font-mono text-white mt-2 truncate">
              {lastChecked ? lastChecked.toLocaleTimeString('vi-VN') : 'Đang quét...'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Client-side probe</p>
          </div>
        </div>
      </div>

      {/* Main Table view */}
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-[#0C101A] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Bảng CSDL & Phân Hệ</th>
              <th className="py-3.5 px-4">Mô Tả Chức Năng</th>
              <th className="py-3.5 px-4 text-center">Trạng Thái</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Số Bản Ghi</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-xs">
            {tables.map((table) => {
              const tableUrl = `https://supabase.com/dashboard/project/${projectRef}/editor/${table.id}`;
              return (
                <tr
                  key={table.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Table name and Module badge */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-semibold text-slate-100 text-xs bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded shadow-xs">
                        {table.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-2 font-medium bg-slate-800/60 text-slate-300 border-slate-700"
                      >
                        {table.category}
                      </Badge>
                    </div>
                  </td>

                  {/* Table Description */}
                  <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate text-xs font-normal">
                    {table.description}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    {table.loading ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />
                        Đang đọc
                      </span>
                    ) : table.error ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-semibold font-mono">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                        Lỗi truy vấn
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Bình thường
                      </span>
                    )}
                  </td>

                  {/* Row Count */}
                  <td className="py-3.5 px-4 sm:px-6 text-right font-mono font-bold text-white text-sm sm:text-base">
                    {table.loading ? (
                      <span className="text-slate-500 text-xs font-normal">...</span>
                    ) : table.error ? (
                      <span className="text-rose-400 text-xs font-normal">N/A</span>
                    ) : (
                      (table.count ?? 0).toLocaleString('vi-VN')
                    )}
                  </td>

                  {/* Supabase Action */}
                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={tableUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white hover:underline transition-colors"
                    >
                      <span>Mở bảng</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer shortcuts bar */}
      <div className="p-4 sm:px-6 bg-[#0C101A] border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400">Dự án Supabase:</span>
          <code className="bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700 text-slate-200 font-mono text-xs font-medium">
            {projectRef}
          </code>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={`https://supabase.com/dashboard/project/${projectRef}/sql`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium transition-colors"
          >
            <Code2 className="h-3.5 w-3.5 text-slate-400" />
            <span>SQL Query Editor</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
          <span className="text-slate-700">|</span>
          <a
            href={`https://supabase.com/dashboard/project/${projectRef}/editor`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-200 hover:text-white hover:underline font-medium"
          >
            <span>Mở Table Editor trên Supabase</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
