import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Users,
  ShieldAlert,
  Layers,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import type { AuditLogItemWithActor } from '../types/audit-log.types';
import {
  AUDIT_MODULE_CONFIG,
  inferActionImpact,
} from '../utils/audit-log-formatter';

interface AuditLogSummaryCardsProps {
  logs: AuditLogItemWithActor[];
  totalCount: number;
  isLoading?: boolean;
}

export function AuditLogSummaryCards({
  logs,
  totalCount,
  isLoading,
}: AuditLogSummaryCardsProps) {
  const stats = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        uniqueActorsCount: 0,
        highImpactCount: 0,
        topModule: null as { key: string; label: string; count: number } | null,
        creationCount: 0,
      };
    }

    const uniqueActors = new Set<string>();
    let highImpact = 0;
    let creations = 0;
    const moduleCounts: Record<string, number> = {};

    logs.forEach((log) => {
      if (log.userId || log.actor?.fullName) {
        uniqueActors.add(log.userId || log.actor?.fullName || 'system');
      }

      const impact = inferActionImpact(log.action);
      if (impact === 'delete' || impact === 'approval' || impact === 'security') {
        highImpact++;
      }
      if (impact === 'create') {
        creations++;
      }

      const mod = log.module || 'system';
      moduleCounts[mod] = (moduleCounts[mod] || 0) + 1;
    });

    let maxModKey = '';
    let maxModCount = 0;
    Object.entries(moduleCounts).forEach(([k, count]) => {
      if (count > maxModCount) {
        maxModCount = count;
        maxModKey = k;
      }
    });

    const topModule = maxModKey
      ? {
          key: maxModKey,
          label: AUDIT_MODULE_CONFIG[maxModKey]?.label || maxModKey,
          count: maxModCount,
        }
      : null;

    return {
      uniqueActorsCount: uniqueActors.size,
      highImpactCount: highImpact,
      topModule,
      creationCount: creations,
    };
  }, [logs]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 bg-white rounded-xl border border-slate-200/80 p-4 animate-pulse space-y-2"
          >
            <div className="h-3.5 bg-slate-100 rounded w-1/2" />
            <div className="h-6 bg-slate-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Total Events */}
      <Card className="border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span>Tổng sự kiện ghi nhận</span>
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {new Intl.NumberFormat('vi-VN').format(totalCount)}
              </span>
              <span className="text-[11px] font-medium text-emerald-600">bất biến</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100/90 text-slate-700 flex items-center justify-center border border-slate-200/60 shrink-0">
            <Activity className="w-5 h-5 text-slate-700" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Active Operators / Actors */}
      <Card className="border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span>Người thao tác (Trang hiện tại)</span>
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {stats.uniqueActorsCount}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">cán bộ/hệ thống</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60 shrink-0">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* 3. High Impact Actions */}
      <Card className="border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span>Tác vụ trọng yếu / Rủi ro</span>
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {stats.highImpactCount}
              </span>
              <span className="text-[11px] text-amber-600 font-medium">xóa / duyệt / quyền</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60 shrink-0">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Top Active Module */}
      <Card className="border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors bg-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span>Phân hệ tác động nhiều nhất</span>
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-slate-900 truncate max-w-[130px]">
                {stats.topModule?.label || 'Chưa xác định'}
              </span>
              {stats.topModule && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 font-mono text-slate-600 bg-slate-50"
                >
                  {stats.topModule.count} logs
                </Badge>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200/60 shrink-0">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
