import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
  Wallet,
  Scale,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
} from 'lucide-react';
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<FinanceType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransactionListItem | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<FinanceTransactionListItem | null>(null);

  const transactions = data?.transactions || [];
  const totalIncome = data?.totalIncome || 0;
  const totalExpense = data?.totalExpense || 0;
  const balance = data?.balance || 0;
  const isBalancePositive = balance >= 0;

  const handleOpenCreate = (type: FinanceType) => {
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
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Đang tải dữ liệu tài chính của hoạt động...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Kế hoạch Thu - Chi & Quyết toán Hoạt động
          </h3>
          <p className="text-xs text-slate-500">
            Theo dõi chi phí thực tế, các nguồn thu và cân đối ngân sách cho: <span className="font-semibold text-slate-700">{activityTitle}</span>
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenCreate('income')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-xs"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Ghi khoản Thu</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenCreate('expense')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ghi khoản Chi</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Mini Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-rose-950 text-white border-rose-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
        <div className="py-12 px-4 text-center max-w-md mx-auto space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center mx-auto border border-slate-200 shadow-xs">
            <DollarSign className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Chưa có phiếu thu chi nào cho hoạt động này
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ghi nhận các chi phí chuẩn bị, mua sắm vật tư, giải thưởng hoặc nguồn tài trợ gắn liền với hoạt động này.
          </p>
          {canManage && (
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenCreate('expense')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi nhận chi phí đầu tiên</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Ngày</th>
                  <th className="py-3 px-4">Loại & Danh mục</th>
                  <th className="py-3 px-4">Nội dung</th>
                  <th className="py-3 px-4">Người lập</th>
                  <th className="py-3 px-4 text-right">Số tiền</th>
                  {canManage && <th className="py-3 px-4 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const typeConfig = getTransactionTypeConfig(tx.transactionType);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600">
                        {formatDate(tx.transactionDate)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${typeConfig.badgeBg}`}
                          >
                            {typeConfig.shortLabel}
                          </span>
                          <span className="text-xs font-medium text-slate-800">
                            {tx.category?.name || 'Khác'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-slate-900 line-clamp-1">
                            {tx.description}
                          </p>
                          {tx.receiptUrl && (
                            <a
                              href={tx.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Chứng từ</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600">
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
                              className="p-1 text-slate-400 hover:text-blue-600 rounded"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTransaction(tx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
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
        isLoading={createTxMutation.isPending || updateTxMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      {deletingTransaction && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Xác nhận xóa phiếu thu/chi?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Giao dịch <span className="font-semibold text-slate-700">"{deletingTransaction.description}"</span> với số tiền{' '}
                <span className="font-bold text-slate-900">{formatVND(deletingTransaction.amount)}</span> sẽ bị xóa khỏi sổ quỹ.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTransaction(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
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
