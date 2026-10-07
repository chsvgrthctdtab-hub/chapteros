import {
  TrendingUp,
  TrendingDown,
  Eye,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  User,
  Check,
} from '@/lib/icons';
import { formatDate } from '@/lib/date';
import {
  formatVND,
  getTransactionTypeConfig,
  getTransactionStatusConfig,
} from '../utils/finance.utils';
import type { FinanceTransactionListItem } from '../types/finance.types';

interface FinanceTransactionTableProps {
  transactions: FinanceTransactionListItem[];
  canManage: boolean;
  canApprove: boolean;
  currentUserId?: string;
  onSelectTransaction?: (tx: FinanceTransactionListItem) => void;
  onEdit: (tx: FinanceTransactionListItem) => void;
  onDelete: (tx: FinanceTransactionListItem) => void;
  onApprove?: (tx: FinanceTransactionListItem) => void;
  onReject?: (tx: FinanceTransactionListItem) => void;
  onToggleReimbursed?: (tx: FinanceTransactionListItem) => void;
  isApproving?: boolean;
  isLoading?: boolean;
}

export function FinanceTransactionTable({
  transactions,
  canManage,
  canApprove,
  currentUserId,
  onSelectTransaction,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onToggleReimbursed,
  isApproving = false,
  isLoading = false,
}: FinanceTransactionTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden p-6 space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 animate-pulse">
            <div className="w-20 h-4 bg-pebble rounded" />
            <div className="w-48 h-4 bg-pebble rounded" />
            <div className="w-20 h-5 bg-pebble rounded" />
            <div className="w-16 h-5 bg-pebble rounded" />
            <div className="w-24 h-4 bg-pebble rounded" />
            <div className="w-24 h-4 bg-pebble rounded" />
            <div className="w-20 h-5 bg-pebble rounded" />
            <div className="w-16 h-6 bg-pebble rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-cloud/95 backdrop-blur-xs border-b border-hairline text-[11px] font-bold text-slate-gray uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[110px]">Ngày</th>
              <th className="py-3.5 px-4 min-w-[200px]">Nội dung giao dịch</th>
              <th className="py-3.5 px-4 w-[140px]">Danh mục</th>
              <th className="py-3.5 px-4 w-[100px]">Loại</th>
              <th className="py-3.5 px-4 w-[140px] text-right">Số tiền</th>
              <th className="py-3.5 px-4 w-[150px]">Người lập</th>
              <th className="py-3.5 px-4 w-[130px]">Trạng thái</th>
              <th className="py-3.5 px-4 w-[110px] text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {transactions.map((tx) => {
              const typeConfig = getTransactionTypeConfig(tx.transactionType);
              const statusConfig = getTransactionStatusConfig(tx.status);
              const isIncome = tx.transactionType === 'income';
              const isPending = tx.status === 'pending_approval';
              const isLocked = Boolean(tx.periodClosingId);
              const isSelfRecorded = Boolean(
                currentUserId && tx.recordedBy && tx.recordedBy === currentUserId
              );

              const txCode = `FIN-${tx.id.slice(0, 8).toUpperCase()}`;

              return (
                <tr
                  key={tx.id}
                  onClick={() => onSelectTransaction?.(tx)}
                  className={`hover:bg-cloud/80 transition-colors group cursor-pointer ${
                    isPending ? 'bg-amber-50/20' : ''
                  }`}
                >
                  {/* 1. Date */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-gray font-medium">
                    <div className="flex flex-col">
                      <span className="text-ink-navy tabular-nums">{formatDate(tx.transactionDate)}</span>
                      {tx.term && (
                        <span className="text-[10px] text-mist-gray font-normal">
                          {tx.term.name}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 2. Transaction Description + Monospace Code */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col max-w-[320px]">
                      <span className="font-semibold text-ink-navy line-clamp-1 group-hover:text-signal-blue transition-colors">
                        {tx.cleanDescription || tx.description}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="tabular-nums font-medium text-[10px] text-slate-gray bg-cloud px-1.5 py-0.5 rounded border border-hairline">
                          {txCode}
                        </span>
                        {tx.person && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-ink-navy bg-cloud px-1.5 py-0.5 rounded border border-hairline">
                            <User className="w-3 h-3 text-slate-gray shrink-0" />
                            <span className="truncate max-w-[120px]">{tx.person.name}</span>
                          </span>
                        )}
                        {!isIncome && (
                          tx.person ||
                          tx.isUnpaid !== undefined ||
                          tx.isReimbursed !== undefined
                        ) && (
                          <button
                            type="button"
                            disabled={!canManage}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleReimbursed?.(tx);
                            }}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all select-none ${
                              canManage ? 'cursor-pointer hover:shadow-2xs active:scale-95' : 'cursor-default'
                            } ${
                              tx.isReimbursed === true || tx.isUnpaid === false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80'
                                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100/80'
                            }`}
                            title={
                              canManage
                                ? tx.isReimbursed === true || tx.isUnpaid === false
                                  ? 'Khoản chi đã thanh (Bấm để chuyển về Chưa thanh)'
                                  : 'Khoản chi chưa thanh (Bấm để xác nhận Đã thanh)'
                                : tx.isReimbursed === true || tx.isUnpaid === false
                                ? 'Đã thanh'
                                : 'Chưa thanh'
                            }
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                                tx.isReimbursed === true || tx.isUnpaid === false
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'bg-white border-amber-400'
                              }`}
                            >
                              {(tx.isReimbursed === true || tx.isUnpaid === false) && (
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              )}
                            </span>
                            <span>
                              {tx.isReimbursed === true || tx.isUnpaid === false
                                ? 'Đã thanh'
                                : 'Chưa thanh'}
                            </span>
                          </button>
                        )}
                        {tx.activity && (
                          <span className="text-[10px] text-signal-blue truncate max-w-[140px]" title={tx.activity.title}>
                            • {tx.activity.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 3. Category */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-gray font-medium">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-cloud text-ink-navy border border-hairline text-[11px]">
                      {tx.category?.name || 'Khác'}
                    </span>
                  </td>

                  {/* 4. Type */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${typeConfig.badgeBg}`}
                    >
                      {isIncome ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {typeConfig.shortLabel || typeConfig.label}
                    </span>
                  </td>

                  {/* 5. Amount */}
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <span
                      className={`tabular-nums text-xs font-bold ${
                        isIncome ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isIncome ? `+${formatVND(tx.amount)}` : `−${formatVND(tx.amount)}`}
                    </span>
                  </td>

                  {/* 6. Recorded By */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 max-w-[140px]">
                      <div className="h-6 w-6 rounded-full bg-pebble text-ink-navy text-[10px] font-bold flex items-center justify-center shrink-0 border border-hairline">
                        {(tx.recorder?.fullName || 'U')[0]}
                      </div>
                      <span className="text-ink-navy truncate text-[11px]">
                        {tx.recorder?.fullName || 'Chưa rõ'}
                      </span>
                    </div>
                  </td>

                  {/* 7. Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusConfig.badgeBg}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor}`} />
                        {statusConfig.label}
                      </span>
                      {isLocked && (
                        <span title="Locked in closed period">
                          <Lock className="h-3 w-3 text-mist-gray" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 8. Actions */}
                  <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectTransaction?.(tx)}
                        title="Xem chi tiết"
                        className="p-1.5 text-mist-gray hover:text-ink-navy hover:bg-cloud rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {isPending && canApprove && (
                        <>
                          {!isSelfRecorded ? (
                            <button
                              type="button"
                              onClick={() => onApprove?.(tx)}
                              disabled={isApproving}
                              title="Phê duyệt nhanh"
                              className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <span title="Chờ người khác duyệt (Không được tự duyệt)" className="p-1 text-amber-500">
                              <AlertCircle className="h-3.5 w-3.5" />
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => onReject?.(tx)}
                            disabled={isApproving}
                            title="Từ chối"
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}

                      {!isLocked && canManage && !isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(tx)}
                            title="Chỉnh sửa"
                            className="p-1.5 text-mist-gray hover:text-ink-navy hover:bg-cloud rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(tx)}
                            title="Xóa"
                            className="p-1.5 text-mist-gray hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
