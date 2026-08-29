import {
  useFinanceTransactions,
  useFinanceSummary,
  useFinanceCategories,
  useFinanceTerms,
  useFinanceActivities,
  useActivityFinance,
} from '@/features/finance/queries/finance.queries';
import {
  useCreateFinanceTransaction,
  useUpdateFinanceTransaction,
  useDeleteFinanceTransaction,
  useCreateFinanceCategory,
  useUpdateFinanceCategory,
  useDeleteFinanceCategory,
} from '@/features/finance/mutations/finance.mutations';
import type {
  FinanceFilterParams,
  FinanceType,
} from '@/features/finance/types/finance.types';

/**
 * Primary Unified Hook for Finance Transactions & Management
 */
export function useFinance(organizationId?: string, params: FinanceFilterParams = {}) {
  const transactionsQuery = useFinanceTransactions(organizationId, params);
  const summaryQuery = useFinanceSummary(organizationId, params);

  const createTxMutation = useCreateFinanceTransaction();
  const updateTxMutation = useUpdateFinanceTransaction();
  const deleteTxMutation = useDeleteFinanceTransaction();

  return {
    transactions: transactionsQuery.data?.transactions || [],
    totalCount: transactionsQuery.data?.totalCount || 0,
    page: transactionsQuery.data?.page || 1,
    pageSize: transactionsQuery.data?.pageSize || 15,
    totalPages: transactionsQuery.data?.totalPages || 0,
    isLoading: transactionsQuery.isLoading,
    isFetching: transactionsQuery.isFetching,
    error: transactionsQuery.error,
    refetch: transactionsQuery.refetch,

    // Summary stats
    summary: summaryQuery.data || {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0,
      incomeCount: 0,
      expenseCount: 0,
      thisMonthIncome: 0,
      thisMonthExpense: 0,
      thisMonthBalance: 0,
    },
    isSummaryLoading: summaryQuery.isLoading,
    refetchSummary: summaryQuery.refetch,

    // Mutations
    createTransaction: createTxMutation.mutateAsync,
    isCreatingTransaction: createTxMutation.isPending,

    updateTransaction: updateTxMutation.mutateAsync,
    isUpdatingTransaction: updateTxMutation.isPending,

    deleteTransaction: deleteTxMutation.mutateAsync,
    isDeletingTransaction: deleteTxMutation.isPending,
  };
}

/**
 * Hook for Finance Categories
 */
export function useFinanceCategoriesList(organizationId?: string, type?: FinanceType | 'all') {
  const categoriesQuery = useFinanceCategories(organizationId, type);
  const createCatMutation = useCreateFinanceCategory();
  const updateCatMutation = useUpdateFinanceCategory();
  const deleteCatMutation = useDeleteFinanceCategory();

  return {
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
    refetch: categoriesQuery.refetch,

    // Category mutations
    createCategory: createCatMutation.mutateAsync,
    isCreatingCategory: createCatMutation.isPending,

    updateCategory: updateCatMutation.mutateAsync,
    isUpdatingCategory: updateCatMutation.isPending,

    deleteCategory: deleteCatMutation.mutateAsync,
    isDeletingCategory: deleteCatMutation.isPending,
  };
}

/**
 * Hook for Activity Financials
 */
export function useActivityFinancials(organizationId?: string, activityId?: string) {
  const activityFinanceQuery = useActivityFinance(organizationId, activityId);

  return {
    data: activityFinanceQuery.data || {
      transactions: [],
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
    },
    isLoading: activityFinanceQuery.isLoading,
    error: activityFinanceQuery.error,
    refetch: activityFinanceQuery.refetch,
  };
}

/**
 * Re-export query hooks for convenience
 */
export {
  useFinanceTransactions,
  useFinanceSummary,
  useFinanceCategories,
  useFinanceTerms,
  useFinanceActivities,
  useActivityFinance,
  useCreateFinanceTransaction,
  useUpdateFinanceTransaction,
  useDeleteFinanceTransaction,
  useCreateFinanceCategory,
  useUpdateFinanceCategory,
  useDeleteFinanceCategory,
};
