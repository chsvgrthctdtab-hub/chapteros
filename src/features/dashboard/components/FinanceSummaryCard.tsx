import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { formatVND } from '../utils/formatters';
import type { DashboardFinanceKpi } from '../types/dashboard.types';

interface FinanceSummaryCardProps {
  finance: DashboardFinanceKpi;
}

export function FinanceSummaryCard({ finance }: FinanceSummaryCardProps) {
  const { totalIncome, totalExpense, balance, thisMonthIncome, thisMonthExpense, thisMonthBalance } = finance;
  const isPositive = balance >= 0;

  return (
    <Card className="border-slate-200/90 shadow-2xs rounded-xl overflow-hidden bg-white">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Finance Overview
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Treasury balance & cash flow summary
              </p>
            </div>
          </div>

          <Link to="/finance">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-8 px-2.5 font-semibold">
              <span>Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-3.5 space-y-3.5">
        {/* Main Balance Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Current Balance</div>
            <div className={`text-lg sm:text-xl font-bold font-mono tracking-tight mt-0.5 ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatVND(balance)}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">This Month</div>
            <div className={`font-mono font-bold text-xs sm:text-sm mt-0.5 ${thisMonthBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {thisMonthBalance >= 0 ? '+' : ''}{formatVND(thisMonthBalance)}
            </div>
          </div>
        </div>

        {/* Income & Expense Breakdown */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <div className="flex items-center justify-between text-xs text-emerald-800 mb-0.5">
              <span className="font-semibold">Total In</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-emerald-950">
              {formatVND(totalIncome)}
            </div>
            <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
              +{formatVND(thisMonthIncome)} this month
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
            <div className="flex items-center justify-between text-xs text-rose-800 mb-0.5">
              <span className="font-semibold">Total Out</span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-rose-950">
              {formatVND(totalExpense)}
            </div>
            <div className="text-[11px] text-rose-700 font-mono mt-0.5">
              -{formatVND(thisMonthExpense)} this month
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
