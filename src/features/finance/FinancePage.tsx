import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Lock,
  List,
  LayoutGrid,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  canManageFinance,
  canApproveFinance,
  canCloseFinancePeriod,
} from '@/types/roles';

// Components
import { FinanceSummaryStrip } from './components/FinanceSummaryStrip';
import { FinanceFilters } from './components/FinanceFilters';
import { FinanceTransactionTable } from './components/FinanceTransactionTable';
import { FinanceTransactionCard } from './components/FinanceTransactionCard';
import { ApprovalQueue } from './components/ApprovalQueue';
import { PeriodClosingSection } from './components/PeriodClosingSection';
import { TransactionDetailDrawer } from './components/TransactionDetailDrawer';
import { TransactionFormModal } from './components/TransactionFormModal';
import { CategoryManagementModal } from './components/CategoryManagementModal';
import { ThresholdSettingsModal } from './components/ThresholdSettingsModal';
import { ClosePeriodModal } from './components/ClosePeriodModal';
import { ReopenPeriodModal } from './components/ReopenPeriodModal';
import { RejectReasonModal } from './components/RejectReasonModal';
import { GoogleSheetsExportModal } from '@/integrations/google/sheets/components/GoogleSheetsExportModal';
import { GoogleSheetsImportWizardModal } from '@/integrations/google/sheets/components/GoogleSheetsImportWizardModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { QueryErrorState } from '@/components/common/QueryErrorState';
import { Button } from '@/components/ui/button';

// Queries
import {
  useFinanceSummary,
  useFinanceTransactions,
  useFinanceThreshold,
  usePeriodClosings,
  useFinanceCategories,
  useFinanceTerms,
  useFinanceActivities,
} from './queries/finance.queries';

// Mutations
import {
  useCreateFinanceTransaction,
  useUpdateFinanceTransaction,
  useDeleteFinanceTransaction,
  useApproveFinanceTransaction,
  useRejectFinanceTransaction,
  useUpdateFinanceThreshold,
  useCloseFinancePeriod,
  useReopenFinancePeriod,
  useCreateFinanceCategory,
  useUpdateFinanceCategory,
  useDeleteFinanceCategory,
} from './mutations/finance.mutations';

import type {
  FinanceFilterParams,
  FinanceTransactionListItem,
  FinancePeriodClosingItem,
  FinanceType,
  CreatePeriodClosingInput,
} from './types/finance.types';
import type { TransactionFormData, CategoryFormData } from './schemas/finance.schema';
import { formatVND } from './utils/finance.utils';

export function FinancePage() {
  const { activeOrganization, activeMembership, profile, user } = useAuth();
  const toast = useToast();
  const organizationId = activeOrganization?.id || '';
  const userRole = activeMembership?.role;

  // RBAC Permission checks
  const canManage = canManageFinance(userRole);
  const canApprove = canApproveFinance(userRole);
  const canClose = canCloseFinancePeriod(userRole);

  // Active Main Workspace Tab: 'ledger' | 'approvals' | 'closings'
  const [activeTab, setActiveTab] = useState<'ledger' | 'approvals' | 'closings'>('ledger');

  // View & Filter States
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [filters, setFilters] = useState<FinanceFilterParams>({
    search: '',
    type: 'all',
    status: 'all',
    categoryId: 'all',
    termId: 'all',
    activityId: 'all',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 15,
    sortBy: 'transaction_date',
    sortOrder: 'desc',
  });

  const [closingTermFilter, setClosingTermFilter] = useState<string>('all');

  // Detail Drawer State
  const [selectedTransactionForDrawer, setSelectedTransactionForDrawer] =
    useState<FinanceTransactionListItem | null>(null);

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [isClosePeriodModalOpen, setIsClosePeriodModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<FinanceType>('income');
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransactionListItem | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<FinanceTransactionListItem | null>(null);
  const [rejectingTransaction, setRejectingTransaction] = useState<FinanceTransactionListItem | null>(null);
  const [reopeningPeriod, setReopeningPeriod] = useState<FinancePeriodClosingItem | null>(null);
  const [sheetsExportOpen, setSheetsExportOpen] = useState(false);
  const [sheetsImportOpen, setSheetsImportOpen] = useState(false);

  // Queries
  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useFinanceSummary(organizationId, filters);

  const {
    data: transactionData,
    isLoading: isTransactionsLoading,
    isFetching: isTransactionsFetching,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useFinanceTransactions(organizationId, filters);

  const { data: threshold = 2000000, refetch: refetchThreshold } = useFinanceThreshold(organizationId);

  const {
    data: periodClosings = [],
    isLoading: isPeriodClosingsLoading,
    refetch: refetchPeriodClosings,
  } = usePeriodClosings(
    organizationId,
    closingTermFilter !== 'all' ? closingTermFilter : undefined
  );

  const { data: categories = [] } = useFinanceCategories(organizationId);
  const { data: terms = [] } = useFinanceTerms(organizationId);
  const { data: activities = [] } = useFinanceActivities(organizationId);

  // Mutations
  const createTxMutation = useCreateFinanceTransaction();
  const updateTxMutation = useUpdateFinanceTransaction();
  const deleteTxMutation = useDeleteFinanceTransaction();
  const approveTxMutation = useApproveFinanceTransaction();
  const rejectTxMutation = useRejectFinanceTransaction();
  const updateThresholdMutation = useUpdateFinanceThreshold();
  const closePeriodMutation = useCloseFinancePeriod();
  const reopenPeriodMutation = useReopenFinancePeriod();
  const createCategoryMutation = useCreateFinanceCategory();
  const updateCategoryMutation = useUpdateFinanceCategory();
  const deleteCategoryMutation = useDeleteFinanceCategory();

  const transactions = transactionData?.transactions || [];
  const totalCount = transactionData?.totalCount || 0;
  const currentPage = transactionData?.page || 1;
  const totalPages = transactionData?.totalPages || 1;

  const currentTerm = terms.find((t) => t.isCurrent) || terms[0];

  // Refresh helper
  const handleRefreshAll = () => {
    refetchSummary();
    refetchTransactions();
    refetchPeriodClosings();
    refetchThreshold();
  };

  // Filter change helper
  const handleFilterChange = (newFilters: Partial<FinanceFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      status: 'all',
      categoryId: 'all',
      termId: 'all',
      activityId: 'all',
      startDate: '',
      endDate: '',
      page: 1,
      pageSize: 15,
      sortBy: 'transaction_date',
      sortOrder: 'desc',
    });
  };

  // Create / Edit modal openers
  const handleOpenCreate = (defaultType: FinanceType = 'income') => {
    setEditingTransaction(null);
    setModalDefaultType(defaultType);
    setIsTransactionModalOpen(true);
  };

  const handleOpenEdit = (tx: FinanceTransactionListItem) => {
    setEditingTransaction(tx);
    setModalDefaultType(tx.transactionType);
    setIsTransactionModalOpen(true);
  };

  // Transaction submit
  const handleTransactionSubmit = async (data: TransactionFormData) => {
    try {
      if (editingTransaction) {
        await updateTxMutation.mutateAsync({
          transactionId: editingTransaction.id,
          organizationId,
          data,
          recordedBy: profile?.id || user?.id || null,
        });
        toast.success('Cập nhật giao dịch thành công.');
      } else {
        await createTxMutation.mutateAsync({
          organizationId,
          data,
          recordedBy: profile?.id || user?.id || null,
        });
        toast.success('Ghi nhận giao dịch thành công.');
      }
      setIsTransactionModalOpen(false);
      setEditingTransaction(null);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  // Transaction Delete
  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    try {
      await deleteTxMutation.mutateAsync({
        transactionId: deletingTransaction.id,
        organizationId,
        activityId: deletingTransaction.activityId,
        recordedBy: profile?.id || user?.id || null,
      });
      toast.success('Xóa phiếu thu / chi thành công.');
      setDeletingTransaction(null);
      if (selectedTransactionForDrawer?.id === deletingTransaction.id) {
        setSelectedTransactionForDrawer(null);
      }
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  // Approve Transaction
  const handleApproveTransaction = async (tx: FinanceTransactionListItem) => {
    try {
      await approveTxMutation.mutateAsync({
        transactionId: tx.id,
        organizationId,
        actorUserId: profile?.id || user?.id || '',
        actorRole: userRole,
      });
      toast.success(`Đã phê duyệt giao dịch "${tx.description}".`);
      if (selectedTransactionForDrawer?.id === tx.id) {
        setSelectedTransactionForDrawer({ ...tx, status: 'approved' });
      }
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  // Reject Transaction Confirmation
  const handleRejectConfirm = async (reason: string) => {
    if (!rejectingTransaction) return;
    try {
      await rejectTxMutation.mutateAsync({
        transactionId: rejectingTransaction.id,
        organizationId,
        rejectionReason: reason,
        actorUserId: profile?.id || user?.id || '',
        actorRole: userRole,
      });
      toast.success(`Đã từ chối giao dịch "${rejectingTransaction.description}".`);
      setRejectingTransaction(null);
      if (selectedTransactionForDrawer?.id === rejectingTransaction.id) {
        setSelectedTransactionForDrawer({
          ...rejectingTransaction,
          status: 'rejected',
          rejectionReason: reason,
        });
      }
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  // Threshold Save
  const handleSaveThreshold = async (newThreshold: number) => {
    try {
      await updateThresholdMutation.mutateAsync({
        organizationId,
        threshold: newThreshold,
        actorUserId: profile?.id || user?.id || null,
        actorRole: userRole,
      });
      toast.success(`Đã cập nhật hạn mức phê duyệt chi tiêu: ${formatVND(newThreshold)}`);
      setIsThresholdModalOpen(false);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  // Close Period Submit
  const handleClosePeriodSubmit = async (input: CreatePeriodClosingInput) => {
    try {
      await closePeriodMutation.mutateAsync({
        organizationId,
        input,
        actorUserId: profile?.id || user?.id || '',
        actorUserName: profile?.fullName || user?.email || 'Admin',
        actorRole: userRole,
      });
      toast.success(`Chốt sổ kỳ "${input.periodName}" thành công.`);
      setIsClosePeriodModalOpen(false);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  // Reopen Period Submit
  const handleReopenPeriodSubmit = async (periodId: string, reason: string) => {
    try {
      await reopenPeriodMutation.mutateAsync({
        input: {
          periodId,
          organizationId,
          reopenReason: reason,
          reopenedByUserId: profile?.id || user?.id,
          reopenedByUserName: profile?.fullName || user?.email || 'Admin',
        },
        actorUserId: profile?.id || user?.id || '',
        actorUserName: profile?.fullName || user?.email || 'Admin',
        actorRole: userRole,
      });
      toast.success('Mở lại sổ kỳ thành công.');
      setReopeningPeriod(null);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  // Category handlers
  const handleCreateCategory = async (data: CategoryFormData) => {
    try {
      await createCategoryMutation.mutateAsync({
        organizationId,
        data,
        actorUserId: profile?.id || user?.id || null,
      });
      toast.success('Thêm danh mục thành công.');
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleUpdateCategory = async (categoryId: string, data: Partial<CategoryFormData>) => {
    try {
      await updateCategoryMutation.mutateAsync({
        categoryId,
        organizationId,
        data,
        actorUserId: profile?.id || user?.id || null,
      });
      toast.success('Cập nhật danh mục thành công.');
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategoryMutation.mutateAsync({
        categoryId,
        organizationId,
        actorUserId: profile?.id || user?.id || null,
      });
      toast.success('Xóa danh mục thành công.');
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  if (!organizationId) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">
          Chưa chọn Chi hội làm việc
        </h3>
        <p className="text-sm text-slate-500">
          Vui lòng chọn hoặc tham gia một Chi hội để truy cập sổ quỹ tài chính.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Finance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage chapter funds, transactions, approvals and reconciliation.
          </p>
        </div>

        {/* Top Actions Row */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRefreshAll}
            disabled={isTransactionsFetching}
            title="Refresh Ledger"
            className="h-8 w-8 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isTransactionsFetching ? 'animate-spin text-emerald-600' : ''}`}
            />
          </Button>

          {canApprove && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsThresholdModalOpen(true)}
              title="Approval limit settings"
              className="h-8 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
              <span>Threshold: {formatVND(threshold)}</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCategoryModalOpen(true)}
            className="h-8 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <span>Categories ({categories.length})</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSheetsExportOpen(true)}
            className="h-8 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 mr-1" />
            <span>Export Sheets</span>
          </Button>

          {canManage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSheetsImportOpen(true)}
              className="h-8 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 mr-1" />
              <span>Import Sheets</span>
            </Button>
          )}

          {canManage && (
            <Button
              size="sm"
              onClick={() => handleOpenCreate('income')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 shadow-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>New Transaction</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Operational Summary Strip */}
      <FinanceSummaryStrip
        summary={summary}
        isLoading={isSummaryLoading}
        onSelectPending={() => setActiveTab('approvals')}
        onFilterType={(type) => handleFilterChange({ type, page: 1 })}
        activeTypeFilter={filters.type}
        currentPeriodName={currentTerm?.name || 'Current Term'}
        isPeriodOpen={Boolean(currentTerm?.isCurrent)}
      />

      {/* 3. Primary Workspace Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Ledger</span>
          <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-600">
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'approvals'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Approval Queue</span>
          {summary?.pendingApprovalCount ? (
            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {summary.pendingApprovalCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('closings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'closings'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Period Closing</span>
          <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-600">
            {periodClosings.length}
          </span>
        </button>
      </div>

      {/* 4. Tab Workspace 1: Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Toolbar & Filters */}
          <FinanceFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            categories={categories}
            terms={terms}
            activities={activities}
          />

          {/* Counts & View Mode Switcher */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="text-slate-900 font-semibold">{transactions.length}</strong> of {totalCount} transactions
              </span>
              {isTransactionsFetching && (
                <span className="text-blue-600 font-medium animate-pulse text-[11px]">
                  (Syncing...)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table view"
                className={`p-1 rounded transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Card view"
                className={`p-1 rounded transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Transactions Presentation / Empty States */}
          {isTransactionsLoading ? (
            <FinanceTransactionTable
              transactions={[]}
              canManage={canManage}
              canApprove={canApprove}
              currentUserId={profile?.id || user?.id}
              onSelectTransaction={(tx) => setSelectedTransactionForDrawer(tx)}
              onEdit={handleOpenEdit}
              onDelete={(tx) => setDeletingTransaction(tx)}
              isLoading={true}
            />
          ) : transactionsError ? (
            <QueryErrorState
              title="Failed to load ledger transactions"
              error={transactionsError}
              onRetry={handleRefreshAll}
            />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-8 h-8 text-slate-400" />}
              title={
                filters.search ||
                filters.type !== 'all' ||
                filters.status !== 'all' ||
                filters.categoryId !== 'all'
                  ? 'No matching transactions found'
                  : 'Ledger is currently empty'
              }
              description={
                filters.search ||
                filters.type !== 'all' ||
                filters.status !== 'all' ||
                filters.categoryId !== 'all'
                  ? 'Try modifying your search or reset filter parameters.'
                  : 'Record revenue inflows and operational disbursements to build transparent accounting records.'
              }
              actionLabel={
                filters.search ||
                filters.type !== 'all' ||
                filters.status !== 'all' ||
                filters.categoryId !== 'all'
                  ? 'Clear filters'
                  : canManage
                  ? 'Record transaction'
                  : undefined
              }
              actionIcon={<Plus className="w-3.5 h-3.5" />}
              onAction={
                filters.search ||
                filters.type !== 'all' ||
                filters.status !== 'all' ||
                filters.categoryId !== 'all'
                  ? handleResetFilters
                  : () => handleOpenCreate('income')
              }
            />
          ) : viewMode === 'table' ? (
            <FinanceTransactionTable
              transactions={transactions}
              canManage={canManage}
              canApprove={canApprove}
              currentUserId={profile?.id || user?.id}
              onSelectTransaction={(tx) => setSelectedTransactionForDrawer(tx)}
              onEdit={handleOpenEdit}
              onDelete={(tx) => setDeletingTransaction(tx)}
              onApprove={handleApproveTransaction}
              onReject={(tx) => setRejectingTransaction(tx)}
              isApproving={approveTxMutation.isPending || rejectTxMutation.isPending}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {transactions.map((tx) => (
                <FinanceTransactionCard
                  key={tx.id}
                  transaction={tx}
                  canManage={canManage}
                  canApprove={canApprove}
                  currentUserId={profile?.id || user?.id}
                  onSelectTransaction={(tx) => setSelectedTransactionForDrawer(tx)}
                  onEdit={handleOpenEdit}
                  onDelete={(tx) => setDeletingTransaction(tx)}
                  onApprove={handleApproveTransaction}
                  onReject={(tx) => setRejectingTransaction(tx)}
                  isApproving={approveTxMutation.isPending || rejectTxMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 px-1 text-xs">
              <span className="text-slate-500">
                Page <strong className="text-slate-800 font-semibold">{currentPage}</strong> of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1 || isTransactionsFetching}
                  onClick={() => handleFilterChange({ page: currentPage - 1 })}
                  className="h-7 text-xs px-2.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages || isTransactionsFetching}
                  onClick={() => handleFilterChange({ page: currentPage + 1 })}
                  className="h-7 text-xs px-2.5"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab Workspace 2: Approval Queue */}
      {activeTab === 'approvals' && (
        <ApprovalQueue
          transactions={transactions}
          threshold={threshold}
          canApprove={canApprove}
          currentUserId={profile?.id || user?.id}
          onSelectTransaction={(tx) => setSelectedTransactionForDrawer(tx)}
          onApprove={handleApproveTransaction}
          onReject={(tx) => setRejectingTransaction(tx)}
          isApproving={approveTxMutation.isPending || rejectTxMutation.isPending}
          isLoading={isTransactionsLoading}
          onOpenThresholdModal={() => setIsThresholdModalOpen(true)}
        />
      )}

      {/* 6. Tab Workspace 3: Periodic Closings & Reconciliation */}
      {activeTab === 'closings' && (
        <PeriodClosingSection
          periods={periodClosings}
          terms={terms}
          selectedTermId={closingTermFilter}
          onTermChange={setClosingTermFilter}
          canClose={canClose}
          onOpenCloseModal={() => setIsClosePeriodModalOpen(true)}
          onOpenReopenModal={(period) => setReopeningPeriod(period)}
          isLoading={isPeriodClosingsLoading}
        />
      )}

      {/* 7. Slide-over Transaction Detail Drawer */}
      <TransactionDetailDrawer
        isOpen={Boolean(selectedTransactionForDrawer)}
        onClose={() => setSelectedTransactionForDrawer(null)}
        transaction={selectedTransactionForDrawer}
        canManage={canManage}
        canApprove={canApprove}
        currentUserId={profile?.id || user?.id}
        onEdit={handleOpenEdit}
        onDelete={(tx) => setDeletingTransaction(tx)}
        onApprove={handleApproveTransaction}
        onReject={(tx) => setRejectingTransaction(tx)}
        isApproving={approveTxMutation.isPending || rejectTxMutation.isPending}
      />

      {/* 8. Modals & Dialogs */}

      {/* 8.1 Create/Edit Transaction Modal */}
      <TransactionFormModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSubmit={handleTransactionSubmit}
        editingTransaction={editingTransaction}
        defaultType={modalDefaultType}
        categories={categories}
        terms={terms}
        activities={activities}
        isLoading={createTxMutation.isPending || updateTxMutation.isPending}
      />

      {/* 8.2 Category Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        canManage={canManage}
        isLoading={
          createCategoryMutation.isPending ||
          updateCategoryMutation.isPending ||
          deleteCategoryMutation.isPending
        }
      />

      {/* 8.3 Rejection Reason Modal */}
      <RejectReasonModal
        isOpen={Boolean(rejectingTransaction)}
        onClose={() => setRejectingTransaction(null)}
        transaction={rejectingTransaction}
        onConfirm={handleRejectConfirm}
        isLoading={rejectTxMutation.isPending}
      />

      {/* 8.4 Threshold Settings Modal */}
      <ThresholdSettingsModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        currentThreshold={threshold}
        onSave={handleSaveThreshold}
        isLoading={updateThresholdMutation.isPending}
        canEdit={canApprove}
      />

      {/* 8.5 Close Period Modal */}
      <ClosePeriodModal
        isOpen={isClosePeriodModalOpen}
        onClose={() => setIsClosePeriodModalOpen(false)}
        organizationId={organizationId}
        terms={terms}
        defaultTermId={filters.termId !== 'all' ? filters.termId : undefined}
        onClosePeriod={handleClosePeriodSubmit}
        isLoading={closePeriodMutation.isPending}
      />

      {/* 8.6 Reopen Period Modal */}
      <ReopenPeriodModal
        isOpen={Boolean(reopeningPeriod)}
        onClose={() => setReopeningPeriod(null)}
        period={reopeningPeriod}
        onReopen={handleReopenPeriodSubmit}
        isLoading={reopenPeriodMutation.isPending}
      />

      {/* 8.7 Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(deletingTransaction)}
        onOpenChange={(open) => !open && setDeletingTransaction(null)}
        title="Xóa phiếu thu / chi?"
        description={`Bạn có chắc chắn muốn xóa giao dịch "${deletingTransaction?.description}" với số tiền ${
          deletingTransaction ? formatVND(deletingTransaction.amount) : ''
        }?`}
        warningNote="Hành động này sẽ xóa vĩnh viễn giao dịch khỏi sổ quỹ và tự động cập nhật lại số dư."
        confirmLabel="Xác nhận xóa"
        variant="destructive"
        isLoading={deleteTxMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {/* 8.8 Google Sheets Export Modal */}
      <GoogleSheetsExportModal
        open={sheetsExportOpen}
        onOpenChange={setSheetsExportOpen}
        module="finance"
        termId={filters.termId !== 'all' ? filters.termId : undefined}
        customFilters={{
          category: filters.categoryId !== 'all' ? filters.categoryId : undefined,
          fromDate: filters.startDate || undefined,
          toDate: filters.endDate || undefined,
        }}
      />

      {/* 8.9 Google Sheets Import Wizard Modal */}
      <GoogleSheetsImportWizardModal
        open={sheetsImportOpen}
        onOpenChange={setSheetsImportOpen}
        module="finance"
        termId={filters.termId !== 'all' ? filters.termId : undefined}
        onImportSuccess={handleRefreshAll}
      />
    </div>
  );
}
