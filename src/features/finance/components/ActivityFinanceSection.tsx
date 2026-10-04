import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  DollarSign,
  AlertCircle,
  Scale,
  ExternalLink,
  Edit2,
  Trash2,
  User,
  Check,
} from '@/lib/icons';
import { useToast } from '@/contexts/ToastContext';
import {
  useActivityFinance,
  useFinanceCategories,
  useFinanceTerms,
  useFinanceActivities,
} from '../queries/finance.queries';
import {
  useCreateFinanceTransaction,
  useUpdateFinanceTransaction,
  useDeleteFinanceTransaction,
} from '../mutations/finance.mutations';
import { formatVND, getTransactionTypeConfig } from '../utils/finance.utils';
import { formatDate } from '@/lib/date';
import { TransactionFormModal } from './TransactionFormModal';
import type { FinanceTransactionListItem, FinanceType } from '../types/finance.types';
import type { TransactionFormData } from '../schemas/finance.schema';

interface ActivityFinanceSectionProps {
  organizationId: string;
  activityId: string;
  activityTitle: string;
  termId?: string;
  canManage: boolean;
}

export function ActivityFinanceSection({
  organizationId,
  activityId,
  activityTitle,
  termId,
  canManage,
}: ActivityFinanceSectionProps) {
  const { data, isLoading } = useActivityFinance(organizationId, activityId);
  const { data: categories = [] } = useFinanceCategories(organizationId);
  const { data: terms = [] } = useFinanceTerms(organizationId);
  const { data: activities = [] } = useFinanceActivities(organizationId);

  const createTxMutation = useCreateFinanceTransaction();
  const updateTxMutation = useUpdateFinanceTransaction();
  const deleteTxMutation = useDeleteFinanceTransaction();
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<FinanceType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransactionListItem | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<FinanceTransactionListItem | null>(null);

  const transactions = data?.transactions || [];
  const totalIncome = data?.totalIncome || 0;
  const totalExpense = data?.totalExpense || 0;
  const balance = data?.balance || 0;
  const isBalancePositive = balance >= 0;

  const handleToggleReimbursed = async (tx: FinanceTransactionListItem) => {
    const currentlyReimbursed = tx.isReimbursed === true || tx.isUnpaid === false;
    const nextReimbursed = !currentlyReimbursed;
    try {
      await updateTxMutation.mutateAsync({
        transactionId: tx.id,
        organizationId,
        data: {
          description: tx.cleanDescription || tx.description,
          amount: tx.amount,
          transactionType: tx.transactionType,
          categoryId: tx.categoryId,
          activityId: tx.activityId || activityId,
          termId: tx.termId,
          transactionDate: tx.transactionDate,
          personProfileId: tx.person?.profileId || 'none',
          personName: tx.person?.name || '',
          receiptUrl: tx.receiptUrl || '',
          isReimbursed: nextReimbursed,
          isUnpaid: !nextReimbursed,
        },
      });
      toast.success(nextReimbursed ? 'Đã xác nhận "Đã thanh"' : 'Đã chuyển về "Chưa thanh"');
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleOpenCreate = (type: FinanceType = 'expense') => {
    setEditingTransaction(null);
    setModalDefaultType(type);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: FinanceTransactionListItem) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: TransactionFormData) => {
    if (editingTransaction) {
      await updateTxMutation.mutateAsync({
        transactionId: editingTransaction.id,
        organizationId,
        data: {
          ...formData,
          activityId,
        },
      });
    } else {
      await createTxMutation.mutateAsync({
        organizationId,
        data: {
          ...formData,
          activityId,
        },
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    await deleteTxMutation.mutateAsync({
      transactionId: deletingTransaction.id,
      organizationId,
      activityId,
    });
    setDeletingTransaction(null);
  };

  if (isLoading) {
    return (
      <div className="py-12 px-4 text-center space-y-4">
        <div className="w-8 h-8 border-3 border-signal-blue border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-mist-gray">Đang tải dữ liệu tài chính của hoạt động...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-ink-navy">
            Kế hoạch Thu - Chi &amp; Quyết toán Hoạt động
          </h3>
          <p className="text-xs text-slate-gray">
            Theo dõi chi phí thực tế, các nguồn thu và cân đối ngân sách cho: <span className="font-semibold text-ink-navy">{activityTitle}</span>
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => handleOpenCreate('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-signal-blue hover:bg-[#005be0] active:bg-[#004fcc] rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ghi nhận giao dịch</span>
          </button>
        )}
      </div>

      {/* 2. Mini Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-white rounded-2xl p-4 border border-hairline shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-mist-gray uppercase tracking-wider">
              Tổng Thu vào
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-600">
            +{formatVND(totalIncome)}
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-2xl p-4 border border-hairline shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-mist-gray uppercase tracking-wider">
              Tổng Đã Chi
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-600">
            -{formatVND(totalExpense)}
          </div>
        </div>

        {/* Balance for this Activity */}
        <div
          className={`rounded-2xl p-4 border shadow-xs ${
            isBalancePositive
              ? 'bg-ink-navy text-white border-[#1a2a4a]'
              : 'bg-rose-950 text-white border-rose-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-mist-gray uppercase tracking-wider">
              Cân đối thu chi
            </span>
            <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white">
            {formatVND(balance)}
          </div>
        </div>
      </div>

      {/* 3. Transaction List or Empty State */}
      {transactions.length === 0 ? (
        <div className="py-12 px-4 text-center max-w-md mx-auto space-y-3 bg-cloud rounded-2xl border border-dashed border-hairline">
          <div className="w-12 h-12 rounded-2xl bg-white text-mist-gray flex items-center justify-center mx-auto border border-hairline shadow-xs">
            <DollarSign strokeWidth={1.5} className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-ink-navy">
            Chưa có phiếu thu chi nào cho hoạt động này
          </h4>
          <p className="text-xs text-mist-gray leading-relaxed">
            Ghi nhận các chi phí chuẩn bị, mua sắm vật tư, giải thưởng hoặc nguồn tài trợ gắn liền với hoạt động này.
          </p>
          {canManage && (
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenCreate('expense')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-signal-blue hover:bg-[#005be0] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi nhận giao dịch đầu tiên</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-cloud border-b border-hairline text-xs font-semibold text-mist-gray uppercase tracking-wider">
                  <th className="py-3 px-4">Ngày</th>
                  <th className="py-3 px-4">Loại &amp; Danh mục</th>
                  <th className="py-3 px-4">Nội dung</th>
                  <th className="py-3 px-4">Người lập</th>
                  <th className="py-3 px-4 text-right">Số tiền</th>
                  {canManage && <th className="py-3 px-4 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {transactions.map((tx) => {
                  const typeConfig = getTransactionTypeConfig(tx.transactionType);
                  return (
                    <tr key={tx.id} className="hover:bg-cloud transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-gray">
                        {formatDate(tx.transactionDate)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${typeConfig.badgeBg}`}
                          >
                            {typeConfig.shortLabel}
                          </span>
                          <span className="text-xs font-medium text-ink-navy">
                            {tx.category?.name || 'Khác'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-ink-navy line-clamp-1">
                            {tx.cleanDescription || tx.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {tx.person && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-ink-navy bg-cloud px-1.5 py-0.5 rounded border border-hairline">
                                <User className="w-3 h-3 text-slate-gray shrink-0" />
                                <span className="truncate max-w-[120px]">{tx.person.name}</span>
                              </span>
                            )}
                            {/* Nút Đã thanh trực tiếp ở ngoài */}
                            {tx.transactionType === 'expense' && (
                              tx.person ||
                              tx.isUnpaid !== undefined ||
                              tx.isReimbursed !== undefined
                            ) && (
                              <button
                                type="button"
                                disabled={!canManage || updateTxMutation.isPending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleReimbursed(tx);
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
                                <span>Đã thanh</span>
                              </button>
                            )}
                            {tx.receiptUrl && (
                              <a
                                href={tx.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-signal-blue hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Chứng từ</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-gray">
                        {tx.recorder?.fullName || 'BCH'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={`text-sm font-bold ${typeConfig.amountColor}`}>
                          {typeConfig.prefix}
                          {formatVND(tx.amount)}
                        </span>
                      </td>
                      {canManage && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(tx)}
                              className="p-1 text-mist-gray hover:text-signal-blue rounded"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTransaction(tx)}
                              className="p-1 text-mist-gray hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editingTransaction={editingTransaction}
        defaultTermId={termId}
        defaultActivityId={activityId}
        defaultType={modalDefaultType}
        categories={categories}
        terms={terms}
        activities={activities}
        organizationId={organizationId}
        isLoading={createTxMutation.isPending || updateTxMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      {deletingTransaction && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-hairline shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-ink-navy">
                Xác nhận xóa phiếu thu/chi?
              </h4>
              <p className="text-xs text-mist-gray mt-1">
                Giao dịch <span className="font-semibold text-slate-gray">"{deletingTransaction.description}"</span> với số tiền{' '}
                <span className="font-bold text-ink-navy">{formatVND(deletingTransaction.amount)}</span> sẽ bị xóa khỏi sổ quỹ.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTransaction(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-gray hover:bg-cloud rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteTxMutation.isPending}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
              >
                {deleteTxMutation.isPending ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
