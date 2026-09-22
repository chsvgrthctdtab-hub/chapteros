import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Clock,
} from 'lucide-react';
import { formatVND } from '../utils/finance.utils';
import type { FinanceSummaryStats, TransactionStatus } from '../types/finance.types';

interface FinanceSummaryCardsProps {
  summary?: FinanceSummaryStats;
  isLoading?: boolean;
  onFilterType?: (type: 'all' | 'income' | 'expense') => void;
  onFilterStatus?: (status: 'all' | TransactionStatus) => void;
  activeTypeFilter?: 'all' | 'income' | 'expense';
  activeStatusFilter?: 'all' | TransactionStatus;
}

export function FinanceSummaryCards({
  summary,
  isLoading = false,
  onFilterType,
  onFilterStatus,
  activeTypeFilter = 'all',
  activeStatusFilter = 'all',
}: FinanceSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-hairline shadow-xs animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-20 h-4 bg-pebble rounded-md" />
              <div className="w-9 h-9 bg-pebble rounded-xl" />
            </div>
            <div className="w-32 h-7 bg-pebble rounded-md" />
            <div className="w-24 h-3 bg-cloud rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  const {
    totalIncome = 0,
    totalExpense = 0,
    balance = 0,
    incomeCount = 0,
    expenseCount = 0,
    thisMonthIncome = 0,
    thisMonthExpense = 0,
    thisMonthBalance = 0,
    pendingApprovalCount = 0,
    pendingApprovalAmount = 0,
  } = summary || {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    incomeCount: 0,
    expenseCount: 0,
    thisMonthIncome: 0,
    thisMonthExpense: 0,
    thisMonthBalance: 0,
    pendingApprovalCount: 0,
    pendingApprovalAmount: 0,
  };

  const isBalancePositive = balance >= 0;

  return (
    <div className="space-y-3">
      {/* Pending Approval notification ribbon if any */}
      {pendingApprovalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-950 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-950">
                Có <span className="underline font-extrabold">{pendingApprovalCount}</span> phiếu thu chi chờ Ban chủ nhiệm phê duyệt
              </div>
              <div className="text-[11px] text-amber-800">
                Tổng giá trị: <strong className="font-bold tabular-nums">{formatVND(pendingApprovalAmount)}</strong> (vượt hạn mức chi hoặc cần duyệt)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onFilterStatus?.(activeStatusFilter === 'pending_approval' ? 'all' : 'pending_approval')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeStatusFilter === 'pending_approval'
                ? 'bg-amber-800 text-white'
                : 'bg-white text-amber-950 hover:bg-amber-100 border border-amber-300'
            }`}
          >
            {activeStatusFilter === 'pending_approval' ? 'Đang lọc chờ duyệt' : 'Xem phiếu chờ duyệt'}
          </button>
        </div>
      )}

      {/* 4 Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Current Net Balance */}
        <div
          className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 shadow-sm ${
            isBalancePositive
              ? 'bg-ink-navy text-white border-ink-navy'
              : 'bg-rose-900 text-white border-rose-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-mist-gray">
              Số dư quỹ hiện tại
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <Wallet strokeWidth={1.5} className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-white tabular-nums">
              {formatVND(balance)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-mist-gray">
              <Scale className="w-3.5 h-3.5 text-mist-gray" />
              <span>
                Tổng thu - Tổng chi (đã duyệt)
              </span>
            </div>
          </div>
        </div>

        {/* 2. Total Income */}
        <div
          onClick={() => onFilterType?.(activeTypeFilter === 'income' ? 'all' : 'income')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 shadow-sm bg-white hover:border-[#d4e4fa] ${
            activeTypeFilter === 'income' ? 'ring-2 ring-signal-blue border-signal-blue bg-[#e6f0ff]/10' : 'border-hairline'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-gray">
              Tổng các khoản thu
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <TrendingUp strokeWidth={1.5} className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
              +{formatVND(totalIncome)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-gray">
              <span>{incomeCount} phiếu thu đã ghi</span>
              <span className="inline-flex items-center text-emerald-700 font-semibold">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                Thu vào
              </span>
            </div>
          </div>
        </div>

        {/* 3. Total Expense */}
        <div
          onClick={() => onFilterType?.(activeTypeFilter === 'expense' ? 'all' : 'expense')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 shadow-sm bg-white hover:border-[#d4e4fa] ${
            activeTypeFilter === 'expense' ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/20' : 'border-hairline'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-gray">
              Tổng các khoản chi
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
              <TrendingDown strokeWidth={1.5} className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-rose-700 tabular-nums">
              -{formatVND(totalExpense)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-gray">
              <span>{expenseCount} phiếu chi đã duyệt</span>
              <span className="inline-flex items-center text-rose-700 font-semibold">
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
                Chi ra
              </span>
            </div>
          </div>
        </div>

        {/* 4. This Month Finance */}
        <div className="rounded-2xl p-5 border border-hairline bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-gray">
              Phát sinh tháng này
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#e6f0ff] text-signal-blue flex items-center justify-center border border-[#d4e4fa]">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-ink-navy tabular-nums">
              {formatVND(thisMonthBalance)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-gray pt-0.5">
              <span className="text-emerald-700 font-medium tabular-nums">+{formatVND(thisMonthIncome)}</span>
              <span className="text-mist-gray">|</span>
              <span className="text-rose-700 font-medium tabular-nums">-{formatVND(thisMonthExpense)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
