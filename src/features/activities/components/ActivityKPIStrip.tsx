import React from 'react';
import {
  Users,
  CheckCircle2,
  Percent,
  CheckSquare,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import type { ActivityDetail } from '../types/activity.types';
import type { ActivityParticipantsStats } from '@/repositories/activity.repository';
import { cn } from '@/lib/utils';

interface ActivityKPIStripProps {
  activity: ActivityDetail;
  stats?: ActivityParticipantsStats;
  tasksCount?: { total: number; completed: number; open: number };
  financeSummary?: { income: number; expense: number; balance: number };
}

export function ActivityKPIStrip({
  activity,
  stats,
  tasksCount,
  financeSummary,
}: ActivityKPIStripProps) {
  const registeredCount = stats?.total || activity.participantStats?.total || 0;
  const presentCount = stats?.present || activity.participantStats?.present || 0;
  const targetMembers = activity.targetMembers || 0;
  const participationRate = stats?.participationRate || (registeredCount > 0 ? Math.round((presentCount / registeredCount) * 100) : 0);

  const kpis = [
    {
      id: 'kpi-registered',
      label: 'Đăng ký',
      vnLabel: 'Tổng đăng ký',
      value: registeredCount,
      subtext: targetMembers > 0 ? `Chỉ tiêu: ${targetMembers}` : 'Tổng số đăng ký',
      icon: Users,
      color: 'text-slate-900',
      badgeBg: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'kpi-present',
      label: 'Có mặt',
      vnLabel: 'Có mặt',
      value: presentCount,
      subtext: `${registeredCount - presentCount} chưa điểm danh`,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    },
    {
      id: 'kpi-rate',
      label: 'Tỉ lệ tham gia',
      vnLabel: 'Tỉ lệ tham gia',
      value: `${participationRate}%`,
      subtext: `${presentCount} / ${registeredCount} đã điểm danh`,
      icon: Percent,
      color: 'text-sky-700',
      badgeBg: 'bg-sky-50 text-sky-800 border-sky-200/80',
    },
    {
      id: 'kpi-tasks',
      label: 'Công việc',
      vnLabel: 'Công việc',
      value: tasksCount ? `${tasksCount.completed}/${tasksCount.total}` : '0/0',
      subtext: tasksCount ? `${tasksCount.open} việc đang mở` : 'Tiến độ phân công',
      icon: CheckSquare,
      color: 'text-purple-700',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200/80',
    },
    {
      id: 'kpi-finance',
      label: 'Ngân sách',
      vnLabel: 'Ngân sách',
      value: financeSummary ? `${(financeSummary.balance / 1000).toLocaleString()}k` : '0k',
      subtext: financeSummary ? `Chi: ${(financeSummary.expense / 1000).toLocaleString()}k` : 'Kinh phí & thu chi',
      icon: DollarSign,
      color: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            id={kpi.id}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">{kpi.label}</span>
              <div className={cn('p-1.5 rounded-xl border shrink-0 shadow-2xs', kpi.badgeBg)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className={cn('text-xl font-bold tracking-tight', kpi.color)}>
                {kpi.value}
              </div>
              <p className="text-[11px] text-slate-400 font-normal truncate mt-0.5">
                {kpi.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
