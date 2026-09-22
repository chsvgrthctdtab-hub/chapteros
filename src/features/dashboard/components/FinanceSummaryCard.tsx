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
    <Card className="border-hairline shadow-sm rounded-2xl overflow-hidden bg-white">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-hairline">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-ink-navy leading-tight">
                Finance Overview
              </CardTitle>
              <p className="text-xs text-slate-gray mt-0.5">
                Treasury balance & cash flow summary
              </p>
            </div>
          </div>

          <Link to="/finance">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm text-signal-blue hover:text-signal-blue/80 hover:bg-pebble h-8 px-2.5 font-semibold">
              <span>Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-3.5 space-y-3.5">
        {/* Main Balance Banner */}
        <div className="p-3.5 rounded-xl bg-pebble border border-hairline flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-gray font-semibold uppercase tracking-wider">Current Balance</div>
            <div className={`text-lg sm:text-xl font-bold tracking-tight mt-0.5 tabular-nums ${isPositive ? 'text-ink-navy' : 'text-rose-700'}`}>
              {formatVND(balance)}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-slate-gray font-semibold uppercase tracking-wider">This Month</div>
            <div className={`font-bold text-xs sm:text-sm mt-0.5 tabular-nums ${thisMonthBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
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
            <div className="text-sm sm:text-base font-bold text-ink-navy tabular-nums">
              {formatVND(totalIncome)}
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5 tabular-nums">
              +{formatVND(thisMonthIncome)} this month
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
            <div className="flex items-center justify-between text-xs text-rose-800 mb-0.5">
              <span className="font-semibold">Total Out</span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-sm sm:text-base font-bold text-ink-navy tabular-nums">
              {formatVND(totalExpense)}
            </div>
            <div className="text-[11px] text-rose-700 mt-0.5 tabular-nums">
              -{formatVND(thisMonthExpense)} this month
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
