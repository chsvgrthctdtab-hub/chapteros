import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '@/services/finance.service';
import { financeKeys } from '../queries/finance.queries';
import type { OrganizationRole } from '@/types/roles';
import type {
  CreatePeriodClosingInput,
  ReopenPeriodInput,
} from '../types/finance.types';
import type { TransactionFormData, CategoryFormData } from '../schemas/finance.schema';

export interface CreateTransactionParams {
  organizationId: string;
  data: TransactionFormData;
  recordedBy?: string | null;
}

export interface UpdateTransactionParams {
  transactionId: string;
  organizationId: string;
  data: Partial<TransactionFormData>;
  recordedBy?: string | null;
}

export interface DeleteTransactionParams {
  transactionId: string;
  organizationId: string;
  activityId?: string | null;
  recordedBy?: string | null;
}

export interface ApproveTransactionParams {
  transactionId: string;
  organizationId: string;
  actorUserId: string;
  actorRole?: OrganizationRole | null;
}

export interface RejectTransactionParams {
  transactionId: string;
  organizationId: string;
  rejectionReason: string;
  actorUserId: string;
  actorRole?: OrganizationRole | null;
}

export interface UpdateThresholdParams {
  organizationId: string;
  threshold: number;
  actorUserId?: string | null;
  actorRole?: OrganizationRole | null;
}

export interface ClosePeriodParams {
  organizationId: string;
  input: CreatePeriodClosingInput;
  actorUserId: string;
  actorUserName: string;
  actorRole?: OrganizationRole | null;
}

export interface ReopenPeriodParams {
  input: ReopenPeriodInput;
  actorUserId: string;
  actorUserName: string;
  actorRole?: OrganizationRole | null;
}

export interface CreateCategoryParams {
  organizationId: string;
  data: CategoryFormData;
  actorUserId?: string | null;
}

export interface UpdateCategoryParams {
  categoryId: string;
  organizationId: string;
  data: Partial<CategoryFormData>;
  actorUserId?: string | null;
}

export interface DeleteCategoryParams {
  categoryId: string;
  organizationId: string;
  actorUserId?: string | null;
}

/**
 * Mutation to create a new finance transaction (Income or Expense)
 */
export function useCreateFinanceTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, data, recordedBy }: CreateTransactionParams) => {
      return financeService.createTransaction(organizationId, data, recordedBy);
    },
    onSuccess: (createdTx, variables) => {
      queryClient.invalidateQueries({
        queryKey: financeKeys.transactions(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: financeKeys.summary(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'stats', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'charts', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['audit-logs', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['notifications', variables.organizationId],
      });

      if (createdTx.activityId) {
        queryClient.invalidateQueries({
          queryKey: financeKeys.activityFinance(variables.organizationId, createdTx.activityId),
        });
      }
    },
  });
}

/**
 * Mutation to update an existing finance transaction
 */
export function useUpdateFinanceTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      organizationId,
      data,
      recordedBy,
    }: UpdateTransactionParams) => {
      return financeService.updateTransaction(
        transactionId,
        organizationId,
        data,
        recordedBy
      );
    },
    onSuccess: (updatedTx, variables) => {
      queryClient.invalidateQueries({
        queryKey: financeKeys.transactions(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: financeKeys.summary(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'stats', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'charts', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['audit-logs', variables.organizationId],
      });

      if (updatedTx.activityId || variables.data.activityId) {
        const targetActId = updatedTx.activityId || variables.data.activityId;
        if (targetActId) {
          queryClient.invalidateQueries({
            queryKey: financeKeys.activityFinance(variables.organizationId, targetActId),
          });
        }
      }
    },
  });
}

/**
 * Mutation to approve a pending transaction
 */
export function useApproveFinanceTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      organizationId,
      actorUserId,
      actorRole,
    }: ApproveTransactionParams) => {
      return financeService.approveTransaction(
        transactionId,
        organizationId,
        actorUserId,
        actorRole
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: financeKeys.transactions(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: financeKeys.summary(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'stats', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['audit-logs', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['notifications', variables.organizationId],
      });
    },
  });
}

/**
 * Mutation to reject a transaction with reason
 */
export function useRejectFinanceTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      organizationId,
      rejectionReason,
      actorUserId,
      actorRole,
    }: RejectTransactionParams) => {
      return financeService.rejectTransaction(
        transactionId,
        organizationId,
        rejectionReason,
        actorUserId,
        actorRole
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: financeKeys.transactions(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: financeKeys.summary(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'stats', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['audit-logs', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['notifications', variables.organizationId],
      });
    },
  });
}

/**
 * Mutation to update finance approval threshold
 */
export function useUpdateFinanceThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      threshold,
      actorUserId,
      actorRole,
    }: UpdateThresholdParams) => {
      return financeService.updateApprovalThreshold(
        organizationId,
        threshold,
        actorUserId,
        actorRole
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: financeKeys.threshold(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['audit-logs', variables.organizationId],
      });
    },
  });
}

/**
 * Mutation to close a financial period
 */
export function useCloseFinancePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      input,
      actorUserId,
      actorUserName,
      actorRole,
    }: ClosePeriodParams) => {
      return financeService.closePeriod(
        organizationId,
        input,
        actorUserId,
        actorUserName,
        actorRole
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: financeKeys.periodClosings(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: financeKeys.transactions(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: financeKeys.summary(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['audit-logs', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['notifications', variables.organizationId],
      });
    },
  });
}

/**
 * Mutation to reopen a closed financial period
 */
export function useReopenFinancePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      input,
      actorUserId,
      actorUserName,
      actorRole,
    }: ReopenPeriodParams) => {
      return financeService.reopenPeriod(
        input,
        actorUserId,
        actorUserName,
        actorRole
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: financeKeys.periodClosings(variables.input.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: financeKeys.transactions(variables.input.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: financeKeys.summary(variables.input.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['audit-logs', variables.input.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['notifications', variables.input.organizationId],
      });
    },
  });
}

/**
 * Mutation to delete / void a finance transaction
 */
export function useDeleteFinanceTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      organizationId,
      activityId,
      recordedBy,
    }: DeleteTransactionParams) => {
      await financeService.deleteTransaction(
        transactionId,
        organizationId,
        activityId,
        recordedBy
      );
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: financeKeys.transactions(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: financeKeys.summary(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'stats', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'charts', variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['audit-logs', variables.organizationId],
      });

      if (variables.activityId) {
        queryClient.invalidateQueries({
          queryKey: financeKeys.activityFinance(variables.organizationId, variables.activityId),
        });
      }
    },
  });
}

/**
 * Mutation to create a new category (Income or Expense)
 */
export function useCreateFinanceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, data, actorUserId }: CreateCategoryParams) => {
      return financeService.createCategory(organizationId, data, actorUserId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: financeKeys.categories(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['audit-logs', variables.organizationId],
      });
    },
  });
}

/**
 * Mutation to update an existing category
 */
export function useUpdateFinanceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      organizationId,
      data,
      actorUserId,
    }: UpdateCategoryParams) => {
      return financeService.updateCategory(
        categoryId,
        organizationId,
        data,
        actorUserId
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: financeKeys.categories(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['audit-logs', variables.organizationId],
      });
    },
  });
}

/**
 * Mutation to delete a category
 */
export function useDeleteFinanceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      organizationId,
      actorUserId,
    }: DeleteCategoryParams) => {
      await financeService.deleteCategory(categoryId, organizationId, actorUserId);
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: financeKeys.categories(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['audit-logs', variables.organizationId],
      });
    },
  });
}
