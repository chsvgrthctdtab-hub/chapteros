import React from 'react';
import {
  Calendar,
  Users,
  Activity,
  CheckSquare,
  Wallet,
  ArrowRightLeft,
  CheckCircle,
  Eye,
  Edit2,
  Lock,
  Archive,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TermStatusBadge } from './TermStatusBadge';
import dayjs from 'dayjs';
import type { Term } from '@/types';

interface TermCardsGridProps {
  terms: Term[];
  currentTermId?: string | null;
  onOpenDetail: (term: Term) => void;
  onActivate: (term: Term) => void;
  onTransfer: (term: Term) => void;
  onComplete: (term: Term) => void;
  onArchive: (term: Term) => void;
  onEdit: (term: Term) => void;
  onViewSnapshot: (term: Term) => void;
  activitiesCountMap?: Record<string, number>;
  tasksCountMap?: Record<string, number>;
  financeBalanceMap?: Record<string, number>;
  canManage?: boolean;
}

export function TermCardsGrid({
  terms,
  currentTermId,
  onOpenDetail,
  onActivate,
  onTransfer,
  onComplete,
  onArchive,
  onEdit,
  onViewSnapshot,
  activitiesCountMap = {},
  tasksCountMap = {},
  financeBalanceMap = {},
  canManage = true,
}: TermCardsGridProps) {
  if (terms.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-white p-12 text-center">
        <Calendar className="h-10 w-10 text-mist-gray mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-ink-navy">Không tìm thấy nhiệm kỳ nào</h3>
        <p className="text-xs text-mist-gray max-w-sm mx-auto mt-1">
          Không có nhiệm kỳ nào phù hợp với bộ lọc tìm kiếm. Hãy thử điều chỉnh từ khóa hoặc bộ lọc.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {terms.map((term) => {
        const isCurrent = term.isCurrent || term.id === currentTermId;
        const isLocked = term.status === 'completed' || term.status === 'archived';
        const activityCount = activitiesCountMap[term.id] ?? 0;
        const taskCount = tasksCountMap[term.id] ?? 0;
        const balance = financeBalanceMap[term.id];

        const start = dayjs(term.startDate);
        const end = dayjs(term.endDate);
        const formattedDates = `${start.isValid() ? start.format('DD/MM/YYYY') : term.startDate} → ${
          end.isValid() ? end.format('DD/MM/YYYY') : term.endDate
        }`;

        const formattedBalance = balance !== undefined
          ? new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              maximumFractionDigits: 0,
            }).format(balance)
          : '—';

        return (
          <div
            key={term.id}
            className={`rounded-xl border bg-white p-5 shadow-xs transition-all flex flex-col justify-between ${
              isCurrent
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                : 'border-hairline hover:border-[#d4e4fa] hover:shadow-xs'
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                    <TermStatusBadge status={term.status} isCurrent={isCurrent} />
                    {term.closingSnapshot && (
                      <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded font-medium whitespace-nowrap shrink-0">
                        Đã chốt sổ
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-ink-navy mt-1">{term.name}</h3>
                </div>

                <div className="flex items-center gap-1">
                  {!isLocked && canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(term)}
                      className="h-7 w-7 p-0 text-mist-gray hover:text-slate-gray"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-1.5 text-xs text-mist-gray font-mono mt-2">
                <Calendar className="h-3.5 w-3.5 text-mist-gray shrink-0" />
                <span>{formattedDates}</span>
              </div>

              {/* Operational Metrics Matrix */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-hairline text-xs">
                <div className="bg-cloud rounded-lg p-2 border border-hairline">
                  <span className="text-[11px] text-mist-gray flex items-center gap-1">
                    <Users className="h-3 w-3 text-signal-blue" />
                    Hội viên
                  </span>
                  <span className="text-sm font-bold text-ink-navy block mt-0.5">
                    {term.memberCount ?? 0}
                  </span>
                </div>

                <div className="bg-cloud rounded-lg p-2 border border-hairline">
                  <span className="text-[11px] text-mist-gray flex items-center gap-1">
                    <Activity className="h-3 w-3 text-signal-blue" />
                    Hoạt động
                  </span>
                  <span className="text-sm font-bold text-ink-navy block mt-0.5">
                    {activityCount}
                  </span>
                </div>

                <div className="bg-cloud rounded-lg p-2 border border-hairline">
                  <span className="text-[11px] text-mist-gray flex items-center gap-1">
                    <CheckSquare className="h-3 w-3 text-amber-500" />
                    Nhiệm vụ
                  </span>
                  <span className="text-sm font-bold text-ink-navy block mt-0.5">
                    {taskCount}
                  </span>
                </div>

                <div className="bg-cloud rounded-lg p-2 border border-hairline">
                  <span className="text-[11px] text-mist-gray flex items-center gap-1">
                    <Wallet className="h-3 w-3 text-emerald-500" />
                    Tồn quỹ
                  </span>
                  <span className="text-xs font-bold text-ink-navy block mt-0.5 tabular-nums truncate">
                    {formattedBalance}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="mt-5 pt-3 border-t border-hairline flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenDetail(term)}
                className="text-xs h-8 px-3 text-slate-gray hover:bg-cloud border-hairline cursor-pointer flex-1"
              >
                <Eye className="h-3.5 w-3.5 mr-1 text-mist-gray" />
                Chi tiết
              </Button>

              {term.closingSnapshot && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewSnapshot(term)}
                  className="text-xs h-8 px-2 text-teal-700 hover:bg-teal-50 border-teal-200 cursor-pointer"
                  title="Xem ảnh chụp tổng kết"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                </Button>
              )}

              {canManage && !isCurrent && term.status !== 'archived' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onActivate(term)}
                  className="text-xs h-8 px-2.5 text-emerald-700 hover:bg-emerald-50 border-emerald-200 cursor-pointer"
                  title="Đặt làm Nhiệm kỳ hiện hành"
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Kích hoạt
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
