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
  MoreHorizontal,
  Lock,
  Archive,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TermStatusBadge } from './TermStatusBadge';
import dayjs from 'dayjs';
import type { Term } from '@/types';

interface TermTableProps {
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

export function TermTable({
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
}: TermTableProps) {
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
    <div className="rounded-xl border border-hairline bg-white overflow-hidden shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-cloud hover:bg-cloud border-b border-hairline">
            <TableHead className="w-[260px] text-xs font-semibold uppercase tracking-wider text-mist-gray">
              Nhiệm kỳ & Niên khóa
            </TableHead>
            <TableHead className="w-[200px] text-xs font-semibold uppercase tracking-wider text-mist-gray">
              Thời gian
            </TableHead>
            <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-mist-gray">
              Trạng thái
            </TableHead>
            <TableHead className="w-[110px] text-xs font-semibold uppercase tracking-wider text-mist-gray text-center">
              Hội viên
            </TableHead>
            <TableHead className="w-[100px] text-xs font-semibold uppercase tracking-wider text-mist-gray text-center">
              Hoạt động
            </TableHead>
            <TableHead className="w-[100px] text-xs font-semibold uppercase tracking-wider text-mist-gray text-center">
              Nhiệm vụ
            </TableHead>
            <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-mist-gray text-right">
              Tồn quỹ
            </TableHead>
            <TableHead className="w-[110px] text-xs font-semibold uppercase tracking-wider text-mist-gray text-right">
              Thao tác
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {terms.map((term) => {
            const isCurrent = term.isCurrent || term.id === currentTermId;
            const isLocked = term.status === 'completed' || term.status === 'archived';
            const activityCount = activitiesCountMap[term.id] ?? 0;
            const taskCount = tasksCountMap[term.id] ?? 0;
            const balance = financeBalanceMap[term.id];

            const start = dayjs(term.startDate);
            const end = dayjs(term.endDate);
            const durationMonths = start.isValid() && end.isValid() ? Math.round(end.diff(start, 'month', true)) : null;

            const formattedBalance = balance !== undefined
              ? new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  maximumFractionDigits: 0,
                }).format(balance)
              : '—';

            return (
              <TableRow
                key={term.id}
                className={`transition-colors ${
                  isCurrent
                    ? 'bg-emerald-50/35 hover:bg-emerald-50/50 border-l-4 border-l-emerald-600'
                    : 'hover:bg-cloud'
                }`}
              >
                {/* Term Name & Snapshot Indicator */}
                <TableCell className="py-3.5">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => onOpenDetail(term)}
                      className="text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                        <span className="text-sm font-bold text-ink-navy group-hover:text-emerald-700 transition-colors whitespace-nowrap">
                          {term.name}
                        </span>
                        {term.closingSnapshot && (
                          <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded font-medium whitespace-nowrap shrink-0">
                            Đã chốt sổ
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-mist-gray font-mono block mt-0.5 whitespace-nowrap">
                        ID: {term.id.slice(0, 8)}
                      </span>
                    </button>
                  </div>
                </TableCell>

                {/* Date Duration */}
                <TableCell className="py-3.5 text-xs text-slate-gray font-mono whitespace-nowrap">
                  <div>
                    {start.isValid() ? start.format('DD/MM/YYYY') : term.startDate} →{' '}
                    {end.isValid() ? end.format('DD/MM/YYYY') : term.endDate}
                  </div>
                  {durationMonths !== null && (
                    <span className="text-[11px] text-mist-gray font-sans">
                      ({durationMonths} tháng)
                    </span>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell className="py-3.5 whitespace-nowrap">
                  <TermStatusBadge status={term.status} isCurrent={isCurrent} />
                </TableCell>

                {/* Members */}
                <TableCell className="py-3.5 text-center">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-navy bg-cloud px-2 py-0.5 rounded-md border border-hairline">
                    <Users className="h-3 w-3 text-mist-gray" />
                    {term.memberCount ?? 0}
                  </span>
                </TableCell>

                {/* Activities */}
                <TableCell className="py-3.5 text-center">
                  <span className="text-xs font-semibold text-slate-gray">
                    {activityCount}
                  </span>
                </TableCell>

                {/* Tasks */}
                <TableCell className="py-3.5 text-center">
                  <span className="text-xs font-semibold text-slate-gray">
                    {taskCount}
                  </span>
                </TableCell>

                {/* Finance Balance */}
                <TableCell className="py-3.5 text-right font-mono text-xs text-ink-navy font-medium">
                  {formattedBalance}
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenDetail(term)}
                      className="h-8 w-8 p-0 text-slate-gray hover:text-ink-navy hover:bg-cloud cursor-pointer"
                      title="Inspect workspace"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-mist-gray hover:text-ink-navy hover:bg-cloud cursor-pointer"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg border border-hairline">
                        <DropdownMenuItem
                          onClick={() => onOpenDetail(term)}
                          className="text-xs text-slate-gray cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 mr-2 text-mist-gray" />
                          Chi tiết nhiệm kỳ
                        </DropdownMenuItem>

                        {term.closingSnapshot && (
                          <DropdownMenuItem
                            onClick={() => onViewSnapshot(term)}
                            className="text-xs text-teal-700 cursor-pointer"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-teal-500" />
                            Xem ảnh chụp tổng kết
                          </DropdownMenuItem>
                        )}

                        {canManage && (
                          <>
                            <DropdownMenuSeparator />

                            {!isCurrent && term.status !== 'archived' && (
                              <DropdownMenuItem
                                onClick={() => onActivate(term)}
                                className="text-xs text-emerald-700 cursor-pointer"
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                Đặt làm Nhiệm kỳ hiện hành
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => onTransfer(term)}
                              className="text-xs text-slate-gray cursor-pointer"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5 mr-2 text-mist-gray" />
                              Chuyển giao nhân sự
                            </DropdownMenuItem>

                            {!isLocked && (
                              <DropdownMenuItem
                                onClick={() => onEdit(term)}
                                className="text-xs text-slate-gray cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5 mr-2 text-mist-gray" />
                                Chỉnh sửa thông tin nhiệm kỳ
                              </DropdownMenuItem>
                            )}

                            {term.status !== 'completed' && term.status !== 'archived' && (
                              <DropdownMenuItem
                                onClick={() => onComplete(term)}
                                className="text-xs text-amber-700 cursor-pointer"
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                Tổng kết & Khóa sổ
                              </DropdownMenuItem>
                            )}

                            {term.status === 'completed' && (
                              <DropdownMenuItem
                                onClick={() => onArchive(term)}
                                className="text-xs text-slate-gray cursor-pointer"
                              >
                                <Archive className="h-3.5 w-3.5 mr-2 text-mist-gray" />
                                Lưu trữ nhiệm kỳ
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
