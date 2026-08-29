import type {
  FinanceType,
  TransactionStatus,
  PeriodClosingStatus,
  ReconciliationStatus,
  PeriodClosingType,
} from '@/types';

/**
 * Format raw number to standard Vietnamese Dong string (e.g. "1.500.000 ₫")
 * Always formats as positive amount unless signed is explicitly requested.
 */
export function formatVND(amount: number | null | undefined, fallback = '0 ₫'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return fallback;
  }

  // Format as integer VND
  const cleanAmount = Math.round(amount);
  return `${cleanAmount.toLocaleString('vi-VN')} ₫`;
}

/**
 * Format signed VND for income (+) or expense (-)
 */
export function formatSignedVND(amount: number, type: FinanceType): string {
  const formatted = formatVND(Math.abs(amount));
  return type === 'income' ? `+${formatted}` : `-${formatted}`;
}

/**
 * Format number for input display preview
 */
export function formatNumberPreview(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9]/g, '')) : value;
  if (isNaN(num) || num === 0) return '0 ₫';
  return formatVND(num);
}

/**
 * Calculate net balance and totals with unified calculation rule:
 * Balance = Total Income - Total Expense
 */
export function calculateFinanceBalance(
  transactions: Array<{ transactionType: FinanceType; amount: number; status?: TransactionStatus }>
): {
  totalIncome: number;
  totalExpense: number;
  balance: number;
} {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    // Only calculate for official transactions (posted or approved or legacy)
    const isOfficial = !tx.status || tx.status === 'posted' || tx.status === 'approved';
    if (!isOfficial) continue;

    const amt = Math.abs(tx.amount) || 0;
    if (tx.transactionType === 'income') {
      totalIncome += amt;
    } else if (tx.transactionType === 'expense') {
      totalExpense += amt;
    }
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

/**
 * Get visual configuration and label for transaction type
 */
export function getTransactionTypeConfig(type: FinanceType) {
  switch (type) {
    case 'income':
      return {
        label: 'Khoản Thu',
        shortLabel: 'Thu',
        prefix: '+',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        amountColor: 'text-emerald-600',
        iconColor: 'text-emerald-500',
        accentBorder: 'border-l-emerald-500',
      };
    case 'expense':
      return {
        label: 'Khoản Chi',
        shortLabel: 'Chi',
        prefix: '-',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        amountColor: 'text-rose-600',
        iconColor: 'text-rose-500',
        accentBorder: 'border-l-rose-500',
      };
    default:
      return {
        label: 'Khác',
        shortLabel: '—',
        prefix: '',
        badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
        amountColor: 'text-slate-700',
        iconColor: 'text-slate-400',
        accentBorder: 'border-l-slate-300',
      };
  }
}

/**
 * Get visual config and label for Transaction approval status
 */
export function getTransactionStatusConfig(status?: TransactionStatus) {
  switch (status) {
    case 'draft':
      return {
        key: 'draft',
        label: 'Bản nháp',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
        dotColor: 'bg-slate-400',
      };
    case 'pending_approval':
      return {
        key: 'pending_approval',
        label: 'Chờ phê duyệt',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
        dotColor: 'bg-amber-500 animate-pulse',
      };
    case 'approved':
      return {
        key: 'approved',
        label: 'Đã phê duyệt',
        badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
        dotColor: 'bg-blue-500',
      };
    case 'posted':
      return {
        key: 'posted',
        label: 'Đã ghi sổ',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotColor: 'bg-emerald-500',
      };
    case 'rejected':
      return {
        key: 'rejected',
        label: 'Bị từ chối',
        badgeBg: 'bg-rose-50 text-rose-800 border-rose-200 font-semibold',
        dotColor: 'bg-rose-500',
      };
    default:
      return {
        key: 'posted',
        label: 'Đã ghi sổ',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotColor: 'bg-emerald-500',
      };
  }
}

/**
 * Get visual config for Period Closing Status
 */
export function getPeriodClosingStatusConfig(status?: PeriodClosingStatus) {
  switch (status) {
    case 'closed':
      return {
        label: 'Đã chốt sổ (Khóa)',
        badgeBg: 'bg-slate-900 text-white border-slate-700',
        isLocked: true,
      };
    case 'reopened':
      return {
        label: 'Đã mở lại',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
        isLocked: false,
      };
    default:
      return {
        label: 'Đã chốt sổ',
        badgeBg: 'bg-slate-900 text-white border-slate-700',
        isLocked: true,
      };
  }
}

/**
 * Get visual config for Reconciliation Status
 */
export function getReconciliationStatusConfig(status?: ReconciliationStatus) {
  switch (status) {
    case 'balanced':
      return {
        label: 'Khớp 100% sổ sách',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'mismatch':
      return {
        label: 'Lệch quỹ thực tế',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    case 'override':
      return {
        label: 'Đã giải trình lệch',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    default:
      return {
        label: 'Đã kiểm tra',
        badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
      };
  }
}

/**
 * Get human-readable label for Period Type
 */
export function getPeriodTypeLabel(type?: PeriodClosingType): string {
  switch (type) {
    case 'month':
      return 'Theo Tháng';
    case 'quarter':
      return 'Theo Quý';
    case 'custom':
      return 'Tùy chỉnh / Nhiệm kỳ';
    default:
      return 'Kỳ định kỳ';
  }
}
