import { useQuery } from '@tanstack/react-query';
import { financeService } from '@/services/finance.service';
import type {
  FinanceFilterParams,
  FinanceSummaryStats,
  FinanceCategoryOption,
  FinanceTermOption,
  FinanceActivityOption,
  FinanceType,
  FinancePeriodClosingItem,
} from '../types/finance.types';
import type { FinanceListResponse } from '@/repositories/finance.repository';

export const financeKeys = {
  all: ['finance'] as const,
  transactions: (orgId?: string, filters?: FinanceFilterParams) =>
    filters !== undefined
      ? ([...financeKeys.all, 'transactions', orgId, filters] as const)
      : orgId !== undefined
      ? ([...financeKeys.all, 'transactions', orgId] as const)
      : ([...financeKeys.all, 'transactions'] as const),
  summary: (orgId?: string, filters?: Partial<FinanceFilterParams>) =>
    filters !== undefined
      ? ([...financeKeys.all, 'summary', orgId, filters] as const)
      : orgId !== undefined
      ? ([...financeKeys.all, 'summary', orgId] as const)
      : ([...financeKeys.all, 'summary'] as const),
  categories: (orgId?: string, type?: FinanceType | 'all') =>
    type !== undefined
      ? ([...financeKeys.all, 'categories', orgId, type] as const)
      : orgId !== undefined
      ? ([...financeKeys.all, 'categories', orgId] as const)
      : ([...financeKeys.all, 'categories'] as const),
  terms: (orgId?: string) =>
    orgId !== undefined
      ? ([...financeKeys.all, 'terms', orgId] as const)
      : ([...financeKeys.all, 'terms'] as const),
  activities: (orgId?: string, termId?: string) =>
    termId !== undefined
      ? ([...financeKeys.all, 'activities', orgId, termId] as const)
      : orgId !== undefined
      ? ([...financeKeys.all, 'activities', orgId] as const)
      : ([...financeKeys.all, 'activities'] as const),
  activityFinance: (orgId?: string, activityId?: string) =>
    activityId !== undefined
      ? ([...financeKeys.all, 'activity-finance', orgId, activityId] as const)
      : orgId !== undefined
      ? ([...financeKeys.all, 'activity-finance', orgId] as const)
      : ([...financeKeys.all, 'activity-finance'] as const),
  threshold: (orgId?: string) =>
    orgId !== undefined
      ? ([...financeKeys.all, 'threshold', orgId] as const)
      : ([...financeKeys.all, 'threshold'] as const),
  periodClosings: (orgId?: string, termId?: string) =>
    termId !== undefined
      ? ([...financeKeys.all, 'period-closings', orgId, termId] as const)
      : orgId !== undefined
      ? ([...financeKeys.all, 'period-closings', orgId] as const)
      : ([...financeKeys.all, 'period-closings'] as const),
  periodClosingDetail: (orgId?: string, id?: string) =>
    id !== undefined
      ? ([...financeKeys.all, 'period-closing-detail', orgId, id] as const)
      : orgId !== undefined
      ? ([...financeKeys.all, 'period-closing-detail', orgId] as const)
      : ([...financeKeys.all, 'period-closing-detail'] as const),
  periodReconciliationPreview: (
    orgId?: string,
    termId?: string,
    periodStart?: string,
    periodEnd?: string
  ) =>
    [
      ...financeKeys.all,
      'reconciliation-preview',
      orgId,
      termId,
      periodStart,
      periodEnd,
    ] as const,
};

/**
 * Fetch and manage finance categories for an organization
 */
export function useFinanceCategories(organizationId?: string, type?: FinanceType | 'all') {
  return useQuery<FinanceCategoryOption[]>({
    queryKey: financeKeys.categories(organizationId, type),
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId) return [];
      return financeService.listCategories(organizationId, type);
    },
  });
}

/**
 * Fetch paginated and filtered transactions for an organization
 */
export function useFinanceTransactions(
  organizationId?: string,
  filters: FinanceFilterParams = {}
) {
  return useQuery<FinanceListResponse>({
    queryKey: financeKeys.transactions(organizationId, filters),
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId) {
        return {
          transactions: [],
          totalCount: 0,
          page: 1,
          pageSize: filters.pageSize || 15,
          totalPages: 0,
        };
      }
      return financeService.listTransactions(organizationId, filters);
    },
  });
}

/**
 * Fetch financial summary statistics (dynamic balance calculation)
 */
export function useFinanceSummary(
  organizationId?: string,
  filters: Partial<FinanceFilterParams> = {}
) {
  return useQuery<FinanceSummaryStats>({
    queryKey: financeKeys.summary(organizationId, filters),
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId) {
        return {
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          transactionCount: 0,
          incomeCount: 0,
          expenseCount: 0,
          thisMonthIncome: 0,
          thisMonthExpense: 0,
          thisMonthBalance: 0,
          pendingApprovalCount: 0,
          pendingApprovalAmount: 0,
          approvedCount: 0,
          postedCount: 0,
          rejectedCount: 0,
        };
      }
      return financeService.getFinanceSummary(organizationId, filters);
    },
  });
}

/**
 * Fetch terms for dropdown selection in Finance module
 */
export function useFinanceTerms(organizationId?: string) {
  return useQuery<FinanceTermOption[]>({
    queryKey: financeKeys.terms(organizationId),
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId) return [];
      return financeService.getFinanceTerms(organizationId);
    },
  });
}

/**
 * Fetch activities for dropdown selection / linking in Finance module
 */
export function useFinanceActivities(organizationId?: string, termId?: string) {
  return useQuery<FinanceActivityOption[]>({
    queryKey: financeKeys.activities(organizationId, termId),
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId) return [];
      return financeService.getFinanceActivities(organizationId, termId);
    },
  });
}

/**
 * Fetch financial status and transaction list for a specific activity
 */
export function useActivityFinance(organizationId?: string, activityId?: string) {
  return useQuery({
    queryKey: financeKeys.activityFinance(organizationId, activityId),
    enabled: !!organizationId && !!activityId,
    queryFn: async () => {
      if (!organizationId || !activityId) {
        return {
          transactions: [],
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
        };
      }
      return financeService.getActivityFinance(organizationId, activityId);
    },
  });
}

/**
 * Fetch finance approval threshold for organization
 */
export function useFinanceThreshold(organizationId?: string) {
  return useQuery<number>({
    queryKey: financeKeys.threshold(organizationId),
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId) return 2000000;
      return financeService.getApprovalThreshold(organizationId);
    },
  });
}

/**
 * Fetch period closings for organization
 */
export function usePeriodClosings(organizationId?: string, termId?: string) {
  return useQuery<FinancePeriodClosingItem[]>({
    queryKey: financeKeys.periodClosings(organizationId, termId),
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId) return [];
      return financeService.listPeriodClosings(organizationId, termId);
    },
  });
}

/**
 * Fetch single period closing details
 */
export function usePeriodClosingDetail(organizationId?: string, id?: string) {
  return useQuery<FinancePeriodClosingItem | null>({
    queryKey: financeKeys.periodClosingDetail(organizationId, id),
    enabled: !!organizationId && !!id,
    queryFn: async () => {
      if (!organizationId || !id) return null;
      return financeService.getPeriodClosingById(id, organizationId);
    },
  });
}

/**
 * Fetch reconciliation preview calculation before closing
 */
export function usePeriodReconciliationPreview(
  organizationId?: string,
  termId?: string,
  periodStart?: string,
  periodEnd?: string
) {
  return useQuery({
    queryKey: financeKeys.periodReconciliationPreview(
      organizationId,
      termId,
      periodStart,
      periodEnd
    ),
    enabled: !!organizationId && !!termId && !!periodStart && !!periodEnd,
    queryFn: async () => {
      if (!organizationId || !termId || !periodStart || !periodEnd) {
        return {
          openingBalance: 0,
          totalIncome: 0,
          totalExpense: 0,
          closingBalance: 0,
          transactionCount: 0,
          transactions: [],
        };
      }
      return financeService.calculatePeriodReconciliation(
        organizationId,
        termId,
        periodStart,
        periodEnd
      );
    },
  });
}
