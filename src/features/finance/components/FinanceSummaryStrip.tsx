import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Lock,
  Scale,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { formatVND } from '../utils/finance.utils';
import type { FinanceSummaryStats, TransactionStatus } from '../types/finance.types';

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
            className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2 animate-pulse"
          >
            <div className="w-16 h-3 bg-slate-100 rounded" />
            <div className="w-24 h-5 bg-slate-100 rounded" />
            <div className="w-20 h-2.5 bg-slate-100 rounded" />
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
        className={`bg-white border rounded-xl p-3.5 shadow-2xs flex flex-col justify-between transition-colors ${
          isBalanceNegative
            ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-200'
            : 'border-slate-200/90'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Current Balance
          </span>
          <Wallet
            className={`h-3.5 w-3.5 ${
              isBalanceNegative ? 'text-rose-500' : 'text-slate-400'
            }`}
          />
        </div>

        <div className="mt-2 space-y-0.5">
          <div
            className={`font-mono text-base sm:text-lg font-bold tracking-tight ${
              isBalanceNegative ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            {isBalanceNegative ? `−${formatVND(Math.abs(balance))}` : formatVND(balance)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            {isBalanceNegative ? (
              <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                <AlertTriangle className="h-3 w-3" />
                Thâm hụt quỹ
              </span>
            ) : (
              <span className="text-slate-500">Quỹ hoạt động thực tế</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Total Income */}
      <button
        type="button"
        onClick={() => onFilterType?.(activeTypeFilter === 'income' ? 'all' : 'income')}
        className={`bg-white border rounded-xl p-3.5 shadow-2xs flex flex-col justify-between text-left transition-all cursor-pointer ${
          activeTypeFilter === 'income'
            ? 'border-emerald-600 ring-1 ring-emerald-600 bg-emerald-50/20'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            Tổng thu
          </span>
          <TrendingUp className="h-3.5 w-3.5 text-emerald-700" />
        </div>

        <div className="mt-2 space-y-0.5">
          <div className="font-mono text-base sm:text-lg font-bold text-emerald-800 tracking-tight">
            +{formatVND(totalIncome)}
          </div>
          <div className="text-[11px] text-slate-500">
            Khoản thu đã duyệt
          </div>
        </div>
      </button>

      {/* 3. Total Expense */}
      <button
        type="button"
        onClick={() => onFilterType?.(activeTypeFilter === 'expense' ? 'all' : 'expense')}
        className={`bg-white border rounded-xl p-3.5 shadow-2xs flex flex-col justify-between text-left transition-all cursor-pointer ${
          activeTypeFilter === 'expense'
            ? 'border-rose-600 ring-1 ring-rose-600 bg-rose-50/20'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-800">
            Tổng chi
          </span>
          <TrendingDown className="h-3.5 w-3.5 text-rose-700" />
        </div>

        <div className="mt-2 space-y-0.5">
          <div className="font-mono text-base sm:text-lg font-bold text-rose-800 tracking-tight">
            −{formatVND(totalExpense)}
          </div>
          <div className="text-[11px] text-slate-500">
            Khoản chi đã duyệt
          </div>
        </div>
      </button>

      {/* 4. Pending Approval */}
      <button
        type="button"
        onClick={onSelectPending}
        className={`bg-white border rounded-xl p-3.5 shadow-2xs flex flex-col justify-between text-left transition-all cursor-pointer ${
          pendingApprovalCount > 0
            ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900">
            Chờ phê duyệt
          </span>
          <Clock className="h-3.5 w-3.5 text-amber-600" />
        </div>

        <div className="mt-2 space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-base sm:text-lg font-bold text-amber-950">
              {pendingApprovalCount}
            </span>
            {pendingApprovalCount > 0 && (
              <span className="text-[10px] text-amber-800 font-medium">
                ({formatVND(pendingApprovalAmount)})
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            {pendingApprovalCount > 0 ? 'Cần BCH xét duyệt' : 'Đã duyệt hết'}
          </div>
        </div>
      </button>

      {/* 5. Period / Reconciliation Status */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Period Status
          </span>
          <Lock className="h-3.5 w-3.5 text-slate-400" />
        </div>

        <div className="mt-2 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                isPeriodOpen
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isPeriodOpen ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {isPeriodOpen ? 'Open Period' : 'Closed'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 truncate" title={currentPeriodName}>
            {currentPeriodName}
          </div>
        </div>
      </div>
    </div>
  );
}
