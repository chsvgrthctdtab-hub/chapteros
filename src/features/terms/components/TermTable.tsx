import React from 'react';
import {
  Calendar,
  Users,
  Activity,
  CheckSquare,
  Wallet,
  Sparkles,
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
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-800">No terms found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          No terms matched your search filters. Try adjusting your query or filter selections.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
            <TableHead className="w-[260px] text-xs font-semibold uppercase tracking-wider text-slate-500">
              Term & Period
            </TableHead>
            <TableHead className="w-[200px] text-xs font-semibold uppercase tracking-wider text-slate-500">
              Date Duration
            </TableHead>
            <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status
            </TableHead>
            <TableHead className="w-[110px] text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
              Members
            </TableHead>
            <TableHead className="w-[100px] text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
              Activities
            </TableHead>
            <TableHead className="w-[100px] text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
              Tasks
            </TableHead>
            <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
              Treasury
            </TableHead>
            <TableHead className="w-[110px] text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
              Actions
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
                    : 'hover:bg-slate-50/70'
                }`}
              >
                {/* Term Name & Snapshot Indicator */}
                <TableCell className="py-3.5">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => onOpenDetail(term)}
                      className="text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {term.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded border border-emerald-300">
                            Active
                          </span>
                        )}
                        {term.closingSnapshot && (
                          <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded font-mono">
                            Snapshot
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                        ID: {term.id.slice(0, 8)}
                      </span>
                    </button>
                  </div>
                </TableCell>

                {/* Date Duration */}
                <TableCell className="py-3.5 text-xs text-slate-600 font-mono">
                  <div>
                    {start.isValid() ? start.format('DD/MM/YYYY') : term.startDate} →{' '}
                    {end.isValid() ? end.format('DD/MM/YYYY') : term.endDate}
                  </div>
                  {durationMonths !== null && (
                    <span className="text-[11px] text-slate-400 font-sans">
                      ({durationMonths} months)
                    </span>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell className="py-3.5">
                  <TermStatusBadge status={term.status} isCurrent={isCurrent} />
                </TableCell>

                {/* Members */}
                <TableCell className="py-3.5 text-center">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                    <Users className="h-3 w-3 text-slate-500" />
                    {term.memberCount ?? 0}
                  </span>
                </TableCell>

                {/* Activities */}
                <TableCell className="py-3.5 text-center">
                  <span className="text-xs font-semibold text-slate-700">
                    {activityCount}
                  </span>
                </TableCell>

                {/* Tasks */}
                <TableCell className="py-3.5 text-center">
                  <span className="text-xs font-semibold text-slate-700">
                    {taskCount}
                  </span>
                </TableCell>

                {/* Finance Balance */}
                <TableCell className="py-3.5 text-right font-mono text-xs text-slate-800 font-medium">
                  {formattedBalance}
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenDetail(term)}
                      className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                      title="Inspect workspace"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg border border-slate-200">
                        <DropdownMenuItem
                          onClick={() => onOpenDetail(term)}
                          className="text-xs text-slate-700 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 mr-2 text-slate-400" />
                          Inspect Workspace
                        </DropdownMenuItem>

                        {term.closingSnapshot && (
                          <DropdownMenuItem
                            onClick={() => onViewSnapshot(term)}
                            className="text-xs text-teal-700 cursor-pointer"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-teal-500" />
                            View Closing Snapshot
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
                                <Sparkles className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                Set as Current Term
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => onTransfer(term)}
                              className="text-xs text-slate-700 cursor-pointer"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5 mr-2 text-slate-400" />
                              Transfer Members
                            </DropdownMenuItem>

                            {!isLocked && (
                              <DropdownMenuItem
                                onClick={() => onEdit(term)}
                                className="text-xs text-slate-700 cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                Edit Term Details
                              </DropdownMenuItem>
                            )}

                            {term.status !== 'completed' && term.status !== 'archived' && (
                              <DropdownMenuItem
                                onClick={() => onComplete(term)}
                                className="text-xs text-amber-700 cursor-pointer"
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                Complete & Snapshot
                              </DropdownMenuItem>
                            )}

                            {term.status === 'completed' && (
                              <DropdownMenuItem
                                onClick={() => onArchive(term)}
                                className="text-xs text-slate-600 cursor-pointer"
                              >
                                <Archive className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                Archive Term
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
