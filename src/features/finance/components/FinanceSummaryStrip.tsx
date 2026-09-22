import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { formatVND } from '../utils/finance.utils';
import type { FinanceSummaryStats } from '../types/finance.types';

interface FinanceSummaryStripProps {
  summary?: FinanceSummaryStats;
  isLoading?: boolean;
  onSelectPending?: () => void;
  onFilterType?: (type: 'all' | 'income' | 'expense') => void;
  activeTypeFilter?: 'all' | 'income' | 'expense';
  currentPeriodName?: string;
  isPeriodOpen?: boolean;
}

export function FinanceSummaryStrip({
  summary,
  isLoading = false,
  onSelectPending,
  onFilterType,
  activeTypeFilter = 'all',
  currentPeriodName = 'Nhiệm kỳ hiện tại',
  isPeriodOpen = true,
}: FinanceSummaryStripProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white border border-hairline rounded-2xl p-3.5 shadow-xs space-y-2 animate-pulse"
          >
            <div className="w-16 h-3 bg-pebble rounded" />
            <div className="w-24 h-5 bg-pebble rounded" />
            <div className="w-20 h-2.5 bg-cloud rounded" />
          </div>
        ))}
      </div>
    );
  }

  const {
    totalIncome = 0,
    totalExpense = 0,
    balance = 0,
    pendingApprovalCount = 0,
    pendingApprovalAmount = 0,
  } = summary || {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    pendingApprovalCount: 0,
    pendingApprovalAmount: 0,
  };

  const isBalanceNegative = balance < 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. Current Balance */}
      <div
        className={`bg-white border rounded-2xl p-3.5 shadow-xs flex flex-col justify-between transition-colors ${
          isBalanceNegative
            ? 'border-rose-300 bg-rose-50/40 ring-1 ring-rose-200'
            : 'border-hairline'
        }`}
      >
        <div className="flex items-center justify-between text-slate-gray">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Current Balance
          </span>
          <Wallet
            className={`h-3.5 w-3.5 ${
              isBalanceNegative ? 'text-rose-500' : 'text-mist-gray'
            }`}
          />
        </div>

        <div className="mt-2 space-y-0.5">
          <div
            className={`text-base sm:text-lg font-bold tracking-tight tabular-nums ${
              isBalanceNegative ? 'text-rose-700' : 'text-ink-navy'
            }`}
          >
            {isBalanceNegative ? `−${formatVND(Math.abs(balance))}` : formatVND(balance)}
          </div>
          <div className="text-[11px] text-slate-gray flex items-center gap-1">
            {isBalanceNegative ? (
              <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                <AlertTriangle className="h-3 w-3" />
                Thâm hụt quỹ
              </span>
            ) : (
              <span className="text-slate-gray">Quỹ hoạt động thực tế</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Total Income */}
      <button
        type="button"
        onClick={() => onFilterType?.(activeTypeFilter === 'income' ? 'all' : 'income')}
        className={`bg-white border rounded-2xl p-3.5 shadow-xs flex flex-col justify-between text-left transition-all cursor-pointer ${
          activeTypeFilter === 'income'
            ? 'border-signal-blue ring-1 ring-signal-blue bg-[#e6f0ff]/20'
            : 'border-hairline hover:border-[#d4e4fa]'
        }`}
      >
        <div className="flex items-center justify-between text-slate-gray">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Tổng thu
          </span>
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
        </div>

        <div className="mt-2 space-y-0.5">
          <div className="text-base sm:text-lg font-bold text-emerald-700 tracking-tight tabular-nums">
            +{formatVND(totalIncome)}
          </div>
          <div className="text-[11px] text-slate-gray">
            Khoản thu đã duyệt
          </div>
        </div>
      </button>

      {/* 3. Total Expense */}
      <button
        type="button"
        onClick={() => onFilterType?.(activeTypeFilter === 'expense' ? 'all' : 'expense')}
        className={`bg-white border rounded-2xl p-3.5 shadow-xs flex flex-col justify-between text-left transition-all cursor-pointer ${
          activeTypeFilter === 'expense'
            ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20'
            : 'border-hairline hover:border-[#d4e4fa]'
        }`}
      >
        <div className="flex items-center justify-between text-slate-gray">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
            Tổng chi
          </span>
          <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
        </div>

        <div className="mt-2 space-y-0.5">
          <div className="text-base sm:text-lg font-bold text-rose-700 tracking-tight tabular-nums">
            −{formatVND(totalExpense)}
          </div>
          <div className="text-[11px] text-slate-gray">
            Khoản chi đã duyệt
          </div>
        </div>
      </button>

      {/* 4. Pending Approval */}
      <button
        type="button"
        onClick={onSelectPending}
        className={`bg-white border rounded-2xl p-3.5 shadow-xs flex flex-col justify-between text-left transition-all cursor-pointer ${
          pendingApprovalCount > 0
            ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400'
            : 'border-hairline hover:border-[#d4e4fa]'
        }`}
      >
        <div className="flex items-center justify-between text-slate-gray">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900">
            Chờ phê duyệt
          </span>
          <Clock className="h-3.5 w-3.5 text-amber-600" />
        </div>

        <div className="mt-2 space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold text-amber-950 tabular-nums">
              {pendingApprovalCount}
            </span>
            {pendingApprovalCount > 0 && (
              <span className="text-[10px] text-amber-800 font-medium tabular-nums">
                ({formatVND(pendingApprovalAmount)})
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-gray">
            {pendingApprovalCount > 0 ? 'Cần BCH xét duyệt' : 'Đã duyệt hết'}
          </div>
        </div>
      </button>

      {/* 5. Period / Reconciliation Status */}
      <div className="bg-white border border-hairline rounded-2xl p-3.5 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-slate-gray">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Period Status
          </span>
          <Lock className="h-3.5 w-3.5 text-mist-gray" />
        </div>

        <div className="mt-2 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                isPeriodOpen
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-cloud text-slate-gray border border-hairline'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isPeriodOpen ? 'bg-emerald-600 animate-pulse' : 'bg-mist-gray'
                }`}
              />
              {isPeriodOpen ? 'Open Period' : 'Closed'}
            </span>
          </div>
          <div className="text-[11px] text-slate-gray truncate" title={currentPeriodName}>
            {currentPeriodName}
          </div>
        </div>
      </div>
    </div>
  );
}
