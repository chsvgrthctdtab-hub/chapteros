import type {
  FinanceType,
  TransactionStatus,
  PeriodClosingType,
  PeriodClosingStatus,
  ReconciliationStatus,
  Profile,
  Activity,
  Term,
} from '@/types';

export type {
  FinanceType,
  TransactionStatus,
  PeriodClosingType,
  PeriodClosingStatus,
  ReconciliationStatus,
};

export interface FinanceCategoryItem {
  id: string;
  organizationId: string;
  name: string;
  type: FinanceType;
  description?: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceTransactionListItem {
  id: string;
  organizationId: string;
  termId: string;
  categoryId: string;
  activityId?: string | null;
  transactionType: FinanceType;
  amount: number; // Always positive number in database
  description: string;
  transactionDate: string;
  status: TransactionStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  periodClosingId?: string | null;
  receiptUrl?: string | null;
  recordedBy?: string | null;
  createdAt: string;
  updatedAt: string;

  // Joined / Relational data
  category?: {
    id: string;
    name: string;
    type: FinanceType;
    description?: string | null;
    isSystem: boolean;
  } | null;
  activity?: {
    id: string;
    title: string;
    code?: string | null;
    category?: string;
    status?: string;
  } | null;
  term?: {
    id: string;
    name: string;
    isCurrent?: boolean;
    status?: string;
  } | null;
  recorder?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    studentId?: string | null;
  } | null;
  approver?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
}

export interface FinanceSummaryStats {
  totalIncome: number;
  totalExpense: number;
  balance: number; // calculated: totalIncome - totalExpense (posted/approved transactions only)
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
  thisMonthBalance: number;
  pendingApprovalCount: number;
  pendingApprovalAmount: number;
  approvedCount: number;
  postedCount: number;
  rejectedCount: number;
}

export interface FinanceFilterParams {
  search?: string;
  type?: 'all' | 'income' | 'expense';
  status?: 'all' | TransactionStatus;
  categoryId?: string; // 'all' or category ID
  termId?: string; // 'all' or term ID
  activityId?: string; // 'all', 'independent' (no activity), or activity ID
  periodClosingId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  page?: number;
  pageSize?: number;
  sortBy?: 'transaction_date' | 'amount' | 'created_at' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface FinanceCategoryOption {
  id: string;
  name: string;
  type: FinanceType;
  description?: string | null;
  isSystem?: boolean;
}

export interface FinanceTermOption {
  id: string;
  name: string;
  isCurrent: boolean;
  status: string;
}

export interface FinanceActivityOption {
  id: string;
  title: string;
  termId: string;
  code?: string | null;
  status?: string;
}

export interface FinancePeriodClosingItem {
  id: string;
  organizationId: string;
  termId: string;
  periodType: PeriodClosingType;
  periodName: string;
  periodStart: string;
  periodEnd: string;
  status: PeriodClosingStatus;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  actualBalance: number;
  reconciliationStatus: ReconciliationStatus;
  reconciliationDiscrepancy?: number;
  discrepancy?: number;
  reconciliationNotes?: string | null;
  notes?: string | null;
  overrideReason?: string | null;
  closedAt: string;
  closedBy?: string | null;
  closedByName?: string | null;
  closedByProfile?: {
    id: string;
    fullName: string;
    email?: string;
    avatarUrl?: string | null;
  } | null;
  reopenedAt?: string | null;
  reopenedBy?: string | null;
  reopenedByName?: string | null;
  reopenReason?: string | null;
  reopenedByProfile?: {
    id: string;
    fullName: string;
    email?: string;
    avatarUrl?: string | null;
  } | null;
  snapshotData?: any;
  createdAt: string;
  updatedAt: string;
  term?: {
    id: string;
    name: string;
    status: string;
  } | null;
  transactionCount?: number;
}

export interface CreatePeriodClosingInput {
  organizationId: string;
  termId: string;
  periodType: PeriodClosingType;
  periodName: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  totalIncome?: number;
  totalExpense?: number;
  closingBalance?: number;
  actualBalance: number;
  reconciliationNotes?: string;
  notes?: string;
  overrideReason?: string;
  closedByUserId?: string;
  closedByUserName?: string;
}

export interface ReopenPeriodInput {
  periodId: string;
  organizationId: string;
  reopenedByUserId?: string;
  reopenedByUserName?: string;
  reopenReason: string;
}

export interface ApproveTransactionInput {
  transactionId: string;
  organizationId: string;
  approverUserId: string;
}

export interface RejectTransactionInput {
  transactionId: string;
  organizationId: string;
  rejecterUserId: string;
  rejectionReason: string;
}
