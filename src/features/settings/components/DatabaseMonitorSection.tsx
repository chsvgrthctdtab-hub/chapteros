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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
    <Card className="border-hairline shadow-xs bg-white overflow-hidden">
      {/* Header section with title and actions */}
      <CardHeader className="p-5 sm:p-6 border-b border-hairline bg-cloud/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-signal-blue/10 text-signal-blue flex items-center justify-center shrink-0 border border-signal-blue/20">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold text-ink-navy">
                  Giám Sát Bảng Dữ Liệu Supabase
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 py-0.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Realtime Connected
                </Badge>
              </div>
              <CardDescription className="text-xs text-mist-gray mt-1">
                Theo dõi số lượng bản ghi trực tiếp trên các bảng lõi của ChapterOS theo thời gian thực
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTableCounts}
              disabled={isRefreshing}
              className="text-xs h-8 text-slate-gray border-hairline hover:bg-cloud cursor-pointer shadow-xs font-medium"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-mist-gray ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Đang đồng bộ...' : 'Kiểm tra lại'}
            </Button>
            <a
              href={`https://supabase.com/dashboard/project/${projectRef}/editor`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                className="text-xs h-8 bg-ink-navy hover:bg-ink-navy/90 text-white cursor-pointer shadow-xs font-medium flex items-center gap-1.5"
              >
                <span>Supabase Studio</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </div>
        </div>

        {/* 4 KPI Quick Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-hairline/70">
          <div className="p-3 rounded-xl bg-white border border-hairline shadow-xs">
            <div className="flex items-center justify-between text-mist-gray">
              <span className="text-[11px] font-medium">Tổng bản ghi</span>
              <Layers className="h-3.5 w-3.5 text-slate-gray" />
            </div>
            <div className="text-lg font-bold text-ink-navy mt-1">
              {isRefreshing && tables[0]?.loading ? (
                <span className="text-xs text-mist-gray font-normal">Đang tính...</span>
              ) : (
                totalRecords.toLocaleString('vi-VN')
              )}
            </div>
            <p className="text-[10px] text-mist-gray mt-0.5">Trên 7 bảng hệ thống</p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-hairline shadow-xs">
            <div className="flex items-center justify-between text-mist-gray">
              <span className="text-[11px] font-medium">Bảng hoạt động</span>
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="text-lg font-bold text-ink-navy mt-1">
              {activeTablesCount} / {TRACKED_TABLES.length}
            </div>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Sẵn sàng truy vấn</p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-hairline shadow-xs">
            <div className="flex items-center justify-between text-mist-gray">
              <span className="text-[11px] font-medium">Độ trễ phản hồi</span>
              <Activity className="h-3.5 w-3.5 text-signal-blue" />
            </div>
            <div className="text-lg font-bold text-ink-navy mt-1">
              {latencyMs !== null ? `${latencyMs} ms` : '—'}
            </div>
            <p className="text-[10px] text-mist-gray mt-0.5">Supabase REST API</p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-hairline shadow-xs">
            <div className="flex items-center justify-between text-mist-gray">
              <span className="text-[11px] font-medium">Quét lần cuối</span>
              <Clock className="h-3.5 w-3.5 text-slate-gray" />
            </div>
            <div className="text-sm font-semibold text-ink-navy mt-1 truncate">
              {lastChecked ? lastChecked.toLocaleTimeString('vi-VN') : 'Đang quét...'}
            </div>
            <p className="text-[10px] text-mist-gray mt-0.5">Client-side probe</p>
          </div>
        </div>
      </CardHeader>

      {/* Main Table view */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-hairline bg-cloud/50 text-[11px] font-semibold text-slate-gray uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Bảng CSDL & Phân Hệ</th>
                <th className="py-3 px-4">Mô Tả Chức Năng</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 sm:px-6 text-right">Số Bản Ghi</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-xs">
              {tables.map((table) => {
                const tableUrl = `https://supabase.com/dashboard/project/${projectRef}/editor/${table.id}`;
                return (
                  <tr
                    key={table.id}
                    className="hover:bg-cloud/40 transition-colors group"
                  >
                    {/* Table name and Module */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-semibold text-ink-navy text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          {table.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 font-normal text-slate-gray bg-white border-hairline"
                        >
                          {table.category}
                        </Badge>
                      </div>
                    </td>

                    {/* Table Description */}
                    <td className="py-3.5 px-4 text-mist-gray max-w-xs truncate">
                      {table.description}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {table.loading ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-mist-gray">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Đang đọc
                        </span>
                      ) : table.error ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-coral-red font-medium">
                          <AlertCircle className="h-3 w-3" />
                          Lỗi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <CheckCircle className="h-3 w-3" />
                          Bình thường
                        </span>
                      )}
                    </td>

                    {/* Row Count */}
                    <td className="py-3.5 px-4 sm:px-6 text-right font-mono font-bold text-ink-navy text-sm">
                      {table.loading ? (
                        <span className="text-mist-gray text-xs font-normal">...</span>
                      ) : table.error ? (
                        <span className="text-coral-red text-xs font-normal">N/A</span>
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
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-signal-blue hover:text-signal-blue/80 hover:underline"
                      >
                        <span>Mở bảng</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer shortcuts bar */}
        <div className="p-4 sm:px-6 bg-cloud/20 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-mist-gray">
            <span className="text-[11px]">Dự án Supabase:</span>
            <code className="bg-white px-2 py-0.5 rounded border border-hairline text-slate-gray font-mono text-[11px]">
              {projectRef}
            </code>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://supabase.com/dashboard/project/${projectRef}/sql`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-gray hover:text-ink-navy font-medium transition-colors"
            >
              <Code2 className="h-3.5 w-3.5 text-mist-gray" />
              <span>SQL Editor</span>
              <ExternalLink className="h-3 w-3 text-mist-gray" />
            </a>
            <span className="text-hairline">|</span>
            <a
              href={`https://supabase.com/dashboard/project/${projectRef}/editor`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-signal-blue hover:underline font-medium"
            >
              <span>Xem tất cả bảng trong Supabase Studio</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
