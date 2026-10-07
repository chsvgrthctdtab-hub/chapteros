import React from 'react';
import {
  Users,
  CheckCircle2,
  Percent,
  CheckSquare,
  DollarSign,
  TrendingUp,
} from '@/lib/icons';
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
      color: 'text-[#0b3558]',
      badgeBg: 'bg-[#fff7ed] text-[#d97706] border-transparent',
    },
    {
      id: 'kpi-present',
      label: 'Có mặt',
      vnLabel: 'Có mặt',
      value: presentCount,
      subtext: `${registeredCount - presentCount} chưa điểm danh`,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-transparent',
    },
    {
      id: 'kpi-rate',
      label: 'Tỉ lệ tham gia',
      vnLabel: 'Tỉ lệ tham gia',
      value: `${participationRate}%`,
      subtext: `${presentCount} / ${registeredCount} đã điểm danh`,
      icon: Percent,
      color: 'text-[#1a73e8]',
      badgeBg: 'bg-[#e8f0fe] text-[#1a73e8] border-transparent',
    },
    {
      id: 'kpi-tasks',
      label: 'Công việc',
      vnLabel: 'Công việc',
      value: tasksCount ? `${tasksCount.completed}/${tasksCount.total}` : '0/0',
      subtext: tasksCount ? `${tasksCount.open} việc đang mở` : 'Tiến độ phân công',
      icon: CheckSquare,
      color: 'text-[#6858d2]',
      badgeBg: 'bg-[#f5f3ff] text-[#6858d2] border-transparent',
    },
    {
      id: 'kpi-finance',
      label: 'Ngân sách',
      vnLabel: 'Ngân sách',
      value: financeSummary ? `${Math.round(financeSummary.balance / 1000).toLocaleString('vi-VN')}k` : '0k',
      subtext: financeSummary
        ? financeSummary.income > 0
          ? `Thu: ${Math.round(financeSummary.income / 1000).toLocaleString('vi-VN')}k • Chi: ${Math.round(financeSummary.expense / 1000).toLocaleString('vi-VN')}k`
          : `Tổng chi: ${Math.round(financeSummary.expense / 1000).toLocaleString('vi-VN')}k`
        : 'Kinh phí & thu chi',
      icon: DollarSign,
      color: financeSummary
        ? financeSummary.balance > 0
          ? 'text-emerald-700'
          : financeSummary.balance < 0
          ? 'text-rose-600'
          : 'text-slate-gray'
        : 'text-[#ce7918]',
      badgeBg: 'bg-[#fffbeb] text-[#ce7918] border-transparent',
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
            className="bg-white p-3.5 rounded-2xl border border-[#e2e8f0] shadow-xs hover:border-[#b8cce0] hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider truncate">{kpi.label}</span>
              <div className={cn('p-1.5 rounded-xl border shrink-0', kpi.badgeBg)}>
                <Icon size={15} />
              </div>
            </div>
            <div>
              <div className={cn('text-xl font-bold tracking-tight tabular-nums', kpi.color)}>
                {kpi.value}
              </div>
              <p className="text-[11px] text-[#64748b] font-normal truncate mt-0.5">
                {kpi.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
