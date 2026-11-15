import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Users,
  Calendar,
  CalendarCheck,
  Sparkles,
  CheckSquare,
  TrendingUp,
  History,
  RefreshCw,
  ExternalLink,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from '@/lib/icons';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

interface DatabaseMonitorSectionProps {
  organizationId?: string;
  organizationName?: string;
}

interface TableMetricItem {
  id: string;
  tableName: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number | null;
  link: string;
  accentColor: string;
  bgLight: string;
}

export function DatabaseMonitorSection({
  organizationId,
  organizationName = 'Đơn vị',
}: DatabaseMonitorSectionProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [counts, setCounts] = useState<{
    members: number | null;
    termMembers: number | null;
    terms: number | null;
    activities: number | null;
    tasks: number | null;
    transactions: number | null;
    auditLogs: number | null;
  }>({
    members: null,
    termMembers: null,
    terms: null,
    activities: null,
    tasks: null,
    transactions: null,
    auditLogs: null,
  });

  const projectUrl = import.meta.env.VITE_SUPABASE_URL || '';
  // Extract project ref from URL (e.g. https://mjunrouwyzlrhqctesmw.supabase.co -> mjunrouwyzlrhqctesmw)
  const projectRef = projectUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1] || 'mjunrouwyzlrhqctesmw';
  const supabaseDashboardUrl = `https://supabase.com/dashboard/project/${projectRef}`;

  const fetchMetrics = useCallback(async (showToast = false) => {
    if (!isSupabaseConfigured || !organizationId) return;

    setIsLoading(true);
    const start = performance.now();

    try {
      // 1. Fetch terms to resolve term_members for this organization
      const { data: orgTerms } = await supabase
        .from('terms')
        .select('id')
        .eq('organization_id', organizationId);

      const termIds = (orgTerms || []).map((t: { id: string }) => t.id);

      // 2. Query exact head counts in parallel (lightweight metadata request)
      const [
        membersRes,
        termsRes,
        activitiesRes,
        tasksRes,
        transactionsRes,
        auditLogsRes,
        termMembersRes,
      ] = await Promise.all([
        supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        supabase
          .from('terms')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        supabase
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        supabase
          .from('finance_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        supabase
          .from('audit_logs')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        termIds.length > 0
          ? supabase
              .from('term_members')
              .select('*', { count: 'exact', head: true })
              .in('term_id', termIds)
          : Promise.resolve({ count: 0 }),
      ]);

      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setLastUpdated(new Date());

      setCounts({
        members: membersRes.count ?? 0,
        terms: termsRes.count ?? 0,
        activities: activitiesRes.count ?? 0,
        tasks: tasksRes.count ?? 0,
        transactions: transactionsRes.count ?? 0,
        auditLogs: auditLogsRes.count ?? 0,
        termMembers: termMembersRes.count ?? 0,
      });

      if (showToast) {
        toast.success('Đã cập nhật số lượng bản ghi mới nhất từ Supabase.');
      }
    } catch (err: unknown) {
      console.error('[DatabaseMonitor] Failed to fetch metrics:', err);
      if (showToast) {
        toast.error('Không thể kiểm tra số lượng bản ghi CSDL.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, toast]);

  useEffect(() => {
    fetchMetrics(false);
  }, [fetchMetrics]);

  const tableList: TableMetricItem[] = [
    {
      id: 'members',
      tableName: 'members',
      label: 'Hồ sơ Hội viên',
      description: 'Danh bạ toàn bộ sinh viên trong đơn vị',
      icon: Users,
      count: counts.members,
      link: '/members',
      accentColor: 'text-[#2e64de]',
      bgLight: 'bg-[#eff6ff]',
    },
    {
      id: 'term_members',
      tableName: 'term_members',
      label: 'Phân công Nhiệm kỳ',
      description: 'Lượt ghi danh hội viên theo nhiệm kỳ',
      icon: CalendarCheck,
      count: counts.termMembers,
      link: '/terms',
      accentColor: 'text-emerald-700',
      bgLight: 'bg-emerald-50',
    },
    {
      id: 'terms',
      tableName: 'terms',
      label: 'Nhiệm kỳ Hoạt động',
      description: 'Các chu kỳ quản trị của Chi hội',
      icon: Calendar,
      count: counts.terms,
      link: '/terms',
      accentColor: 'text-purple-700',
      bgLight: 'bg-purple-50',
    },
    {
      id: 'activities',
      tableName: 'activities',
      label: 'Hoạt động & Sự kiện',
      description: 'Chương trình, tình nguyện, tập huấn',
      icon: Sparkles,
      count: counts.activities,
      link: '/activities',
      accentColor: 'text-amber-700',
      bgLight: 'bg-amber-50',
    },
    {
      id: 'tasks',
      tableName: 'tasks',
      label: 'Nhiệm vụ & Công việc',
      description: 'Phân công theo dõi tiến độ công việc',
      icon: CheckSquare,
      count: counts.tasks,
      link: '/tasks',
      accentColor: 'text-indigo-700',
      bgLight: 'bg-indigo-50',
    },
    {
      id: 'finance_transactions',
      tableName: 'finance_transactions',
      label: 'Sổ cái Thu / Chi',
      description: 'Các khoản thu quỹ, chi phí và hoàn ứng',
      icon: TrendingUp,
      count: counts.transactions,
      link: '/finance',
      accentColor: 'text-teal-700',
      bgLight: 'bg-teal-50',
    },
    {
      id: 'audit_logs',
      tableName: 'audit_logs',
      label: 'Nhật ký Kiểm toán',
      description: 'Lịch sử thao tác tạo, sửa, xóa hệ thống',
      icon: History,
      count: counts.auditLogs,
      link: '/audit-logs',
      accentColor: 'text-slate-700',
      bgLight: 'bg-slate-100',
    },
  ];

  const totalRecords = Object.values(counts).reduce<number>(
    (sum, val) => sum + (val || 0),
    0
  );

  return (
    <Card className="border border-hairline shadow-xs bg-white rounded-2xl overflow-hidden">
      <CardHeader className="p-5 sm:p-6 pb-4 border-b border-hairline">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e6f0ff] text-signal-blue flex items-center justify-center border border-[#d4e4fa] shrink-0 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base sm:text-lg font-bold text-ink-navy">
                  Giám Sát Cơ Sở Dữ Liệu Supabase
                </CardTitle>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang kết nối
                </span>
                {latencyMs !== null && (
                  <span className="text-[11px] font-mono text-mist-gray">
                    ({latencyMs}ms)
                  </span>
                )}
              </div>
              <CardDescription className="text-xs text-mist-gray mt-1">
                Theo dõi số lượng bản ghi thực tế được lưu trữ trên đám mây của <strong className="text-ink-navy font-semibold">{organizationName}</strong>
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMetrics(true)}
              disabled={isLoading}
              className="text-xs h-8.5 px-3 border-hairline text-slate-gray hover:text-ink-navy hover:bg-cloud cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin text-signal-blue' : 'text-mist-gray'}`}
              />
              <span>{isLoading ? 'Đang đếm...' : 'Làm mới số liệu'}</span>
            </Button>

            <a
              href={supabaseDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold h-8.5 px-3 rounded-lg bg-ink-navy hover:bg-[#0b3558]/90 text-white transition-colors shadow-xs"
              title="Mở Supabase Studio trực tiếp trong tab mới"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mở Supabase Studio</span>
              <span className="sm:hidden">Studio</span>
            </a>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {tableList.map((item) => {
            const Icon = item.icon;
            const hasData = item.count !== null && item.count > 0;
            const isZero = item.count === 0;

            return (
              <div
                key={item.id}
                className="group relative rounded-xl border border-hairline bg-[#fbfcfd] p-3.5 hover:bg-white hover:border-[#d4e4fa] hover:shadow-xs transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg ${item.bgLight} ${item.accentColor} flex items-center justify-center shrink-0`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-2xs font-bold text-slate-gray bg-cloud px-1.5 py-0.5 rounded border border-hairline truncate">
                        {item.tableName}
                      </span>
                    </div>

                    {item.count === null ? (
                      <Loader2 className="w-3.5 h-3.5 text-mist-gray animate-spin" />
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          hasData
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {hasData ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5" /> Có dữ liệu
                          </>
                        ) : (
                          'Trống'
                        )}
                      </span>
                    )}
                  </div>

                  <div className="mt-1">
                    <p className="text-xs font-bold text-ink-navy truncate">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-mist-gray line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-hairline flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-ink-navy tabular-nums">
                      {item.count === null ? '—' : item.count.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-2xs text-mist-gray font-medium">bản ghi</span>
                  </div>

                  <Link
                    to={item.link}
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-signal-blue hover:text-[#005be0] transition-colors"
                  >
                    <span>Xem</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Metadata & Info Strip */}
        <div className="rounded-xl bg-cloud border border-hairline p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap text-slate-gray">
            <span className="font-semibold text-ink-navy">
              Tổng cộng:{' '}
              <strong className="text-signal-blue tabular-nums font-bold">
                {isLoading && counts.members === null
                  ? '...'
                  : totalRecords.toLocaleString('vi-VN')}
              </strong>{' '}
              bản ghi
            </span>
            <span>•</span>
            <span className="font-mono text-[11px]">
              Dự án: <span className="font-semibold text-ink-navy">{projectRef}</span>
            </span>
            {lastUpdated && (
              <>
                <span>•</span>
                <span className="text-mist-gray">
                  Cập nhật lúc: {lastUpdated.toLocaleTimeString('vi-VN')}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`${supabaseDashboardUrl}/editor`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-signal-blue hover:underline inline-flex items-center gap-1"
            >
              Trình chỉnh sửa bảng (Table Editor)
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
