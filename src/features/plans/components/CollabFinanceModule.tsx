import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Search,
  Filter,
  FileText,
  ExternalLink,
  Trash2,
  Edit,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  Sparkles,
  PieChart,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCollabTransactions,
  useCreateCollabTransaction,
  useUpdateCollabTransaction,
  useDeleteCollabTransaction,
} from '../queries/collab.queries';
import { useAuth } from '@/contexts/AuthContext';
import { formatError } from '@/lib/error-formatter';
import { formatDate } from '@/lib/date';
import type { Plan, CollabActivity, CollabTransaction, FinanceType } from '@/types';

const transactionSchema = z.object({
  transactionType: z.enum(['income', 'expense'] as const),
  amount: z.coerce.number().positive('Số tiền phải lớn hơn 0'),
  categoryName: z.string().min(2, 'Vui lòng chọn hoặc nhập danh mục'),
  organizationId: z.string().min(1, 'Vui lòng chọn đơn vị chịu trách nhiệm'),
  collabActivityId: z.string().optional().nullable(),
  transactionDate: z.string().min(1, 'Vui lòng chọn ngày giao dịch'),
  description: z.string().min(3, 'Vui lòng nhập nội dung chi tiết'),
  receiptUrl: z.string().url('Đường dẫn chứng từ không hợp lệ').optional().or(z.literal('')),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface CollabFinanceModuleProps {
  plan: Plan;
  collabActivities?: CollabActivity[];
  canManage?: boolean;
}

const DEFAULT_INCOME_CATEGORIES = [
  'Gây quỹ sự kiện',
  'Tài trợ từ doanh nghiệp',
  'Đóng góp từ Quỹ đơn vị',
  'Hỗ trợ từ Đoàn - Hội cấp trên',
  'Bán vé / Thu phí tham gia',
  'Khác',
];

const DEFAULT_EXPENSE_CATEGORIES = [
  'Hậu cần & Vật tư',
  'Quà tặng & Khen thưởng',
  'Truyền thông & In ấn backdrop',
  'Thuê âm thanh, ánh sáng & Địa điểm',
  'Nước uống & Tiếp tân',
  'Chi phí đi lại & Vận chuyển',
  'Khác',
];

export function CollabFinanceModule({
  plan,
  collabActivities = [],
  canManage = true,
}: CollabFinanceModuleProps) {
  const { user } = useAuth();
  const { data: transactions = [], isLoading } = useCollabTransactions(plan?.id);
  const createMutation = useCreateCollabTransaction();
  const updateMutation = useUpdateCollabTransaction();
  const deleteMutation = useDeleteCollabTransaction();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<CollabTransaction | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOrg, setFilterOrg] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Participating organizations (active only)
  const participatingOrganizations = useMemo(() => {
    const list: { id: string; name: string; code: string }[] = [];
    if (plan?.leadOrganization) {
      list.push({
        id: plan.leadOrganization.id,
        name: plan.leadOrganization.name,
        code: plan.leadOrganization.code,
      });
    }
    (plan?.organizations || []).forEach((po) => {
      if (po.organization && po.organizationId !== plan.leadOrganizationId && po.status === 'active') {
        list.push({
          id: po.organization.id,
          name: po.organization.name,
          code: po.organization.code || 'ORG',
        });
      }
    });
    return list;
  }, [plan]);

  // Form handling
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema) as never,
    defaultValues: {
      transactionType: 'expense',
      amount: 0,
      categoryName: 'Hậu cần & Vật tư',
      organizationId: plan?.leadOrganizationId || '',
      collabActivityId: null,
      transactionDate: new Date().toISOString().split('T')[0],
      description: '',
      receiptUrl: '',
    },
  });

  const selectedType = watch('transactionType');

  const openCreateDialog = (type: FinanceType = 'expense') => {
    if (!canManage) {
      setActionError('Đơn vị chưa được kích hoạt tham gia kế hoạch hoặc bạn không thuộc Ban Chấp Hành nên chưa thể ghi nhận thu chi.');
      return;
    }
    setEditingTransaction(null);
    setSubmitError(null);
    reset({
      transactionType: type,
      amount: 0,
      categoryName: type === 'income' ? 'Gây quỹ sự kiện' : 'Hậu cần & Vật tư',
      organizationId: plan?.leadOrganizationId || participatingOrganizations[0]?.id || '',
      collabActivityId: null,
      transactionDate: new Date().toISOString().split('T')[0],
      description: '',
      receiptUrl: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (tx: CollabTransaction) => {
    if (!canManage) {
      setActionError('Đơn vị chưa được kích hoạt tham gia kế hoạch hoặc bạn không thuộc Ban Chấp Hành nên chưa thể sửa giao dịch.');
      return;
    }
    setEditingTransaction(tx);
    setSubmitError(null);
    reset({
      transactionType: tx.transactionType,
      amount: tx.amount,
      categoryName: tx.categoryName,
      organizationId: tx.organizationId,
      collabActivityId: tx.collabActivityId || null,
      transactionDate: tx.transactionDate.split('T')[0],
      description: tx.description,
      receiptUrl: tx.receiptUrl || '',
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: TransactionFormData) => {
    if (!canManage) {
      setSubmitError('Đơn vị chưa được kích hoạt tham gia kế hoạch hoặc bạn không thuộc Ban Chấp Hành nên không có quyền thực hiện.');
      return;
    }
    try {
      setSubmitError(null);
      if (editingTransaction) {
        await updateMutation.mutateAsync({
          id: editingTransaction.id,
          payload: {
            transaction_type: data.transactionType,
            amount: data.amount,
            category_name: data.categoryName,
            organization_id: data.organizationId,
            collab_activity_id: data.collabActivityId || null,
            transaction_date: data.transactionDate,
            description: data.description.trim(),
            receipt_url: data.receiptUrl?.trim() || null,
          },
        });
      } else {
        await createMutation.mutateAsync({
          payload: {
            plan_id: plan.id,
            transaction_type: data.transactionType,
            amount: data.amount,
            category_name: data.categoryName,
            organization_id: data.organizationId,
            collab_activity_id: data.collabActivityId || null,
            transaction_date: data.transactionDate,
            description: data.description.trim(),
            receipt_url: data.receiptUrl?.trim() || null,
            recorded_by: user?.id || null,
          },
        });
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      console.error('Failed to save transaction:', err);
      const formatted = formatError(err);
      setSubmitError(formatted.message || 'Đơn vị chưa được kích hoạt tham gia kế hoạch nên chưa thể thực hiện thao tác này.');
    }
  };

  const handleDelete = async (txId: string) => {
    if (!canManage) {
      setActionError('Đơn vị chưa được kích hoạt tham gia kế hoạch hoặc bạn không thuộc Ban Chấp Hành nên chưa thể xóa giao dịch.');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này khỏi hệ thống?')) return;
    try {
      setActionError(null);
      await deleteMutation.mutateAsync({ id: txId, planId: plan.id });
    } catch (err: unknown) {
      console.error('Failed to delete transaction:', err);
      const formatted = formatError(err);
      setActionError(formatted.message || 'Đơn vị chưa được kích hoạt tham gia kế hoạch nên chưa thể thực hiện thao tác này.');
    }
  };

  // Financial calculations
  const { totalIncome, totalExpense, netBalance, orgDistribution } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const orgMap: Record<string, { income: number; expense: number }> = {};

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (!orgMap[tx.organizationId]) {
        orgMap[tx.organizationId] = { income: 0, expense: 0 };
      }

      if (tx.transactionType === 'income') {
        income += amt;
        orgMap[tx.organizationId].income += amt;
      } else {
        expense += amt;
        orgMap[tx.organizationId].expense += amt;
      }
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
      orgDistribution: orgMap,
    };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== 'all' && tx.transactionType !== filterType) return false;
      if (filterOrg !== 'all' && tx.organizationId !== filterOrg) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = tx.description?.toLowerCase().includes(q);
        const catMatch = tx.categoryName?.toLowerCase().includes(q);
        const orgMatch = tx.organization?.name?.toLowerCase().includes(q);
        return descMatch || catMatch || orgMatch;
      }
      return true;
    });
  }, [transactions, filterType, filterOrg, searchQuery]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div id="collab-finance-module" className="space-y-6">
      {/* Informational Banner for Read-only / Non-manage Mode */}
      {!canManage && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Chế độ xem tài chính: </span>
            Chỉ Ban Chấp Hành (BCH) của các đơn vị đang hoạt động (active) trong chiến dịch mới có quyền ghi nhận, sửa hoặc xóa các khoản thu chi.
          </div>
        </div>
      )}

      {/* Action Error Banner */}
      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-2 text-xs text-rose-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{actionError}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActionError(null)}
            className="h-5 px-1 text-xs text-rose-600 hover:bg-rose-100"
          >
            Đóng
          </Button>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income Card */}
        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Tổng Thu (Gây Quỹ & Tài Trợ)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xl font-bold text-emerald-950 font-mono">
              {formatVND(totalIncome)}
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Từ các nguồn tài trợ, quỹ hội & đóng góp
            </p>
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
              Tổng Chi (Hậu Cần & Vật Tư)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xl font-bold text-rose-950 font-mono">
              {formatVND(totalExpense)}
            </p>
            <p className="text-[11px] text-rose-700 mt-0.5">
              Kinh phí triển khai các hoạt động collab
            </p>
          </div>
        </div>

        {/* Net Balance Card */}
        <div
          className={`border rounded-2xl p-4 shadow-sm relative overflow-hidden ${
            netBalance >= 0
              ? 'bg-blue-50/50 border-blue-200/80 text-blue-900'
              : 'bg-amber-50/50 border-amber-200/80 text-amber-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Số Dư Khả Dụng
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                netBalance >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xl font-bold font-mono">
              {formatVND(netBalance)}
            </p>
            <p className="text-[11px] opacity-80 mt-0.5">
              {netBalance >= 0 ? 'Quỹ hoạt động dương' : 'Cần bổ sung nguồn quỹ'}
            </p>
          </div>
        </div>

        {/* Quick Actions & Count */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Giao Dịch Ghi Nhận
            </span>
            <span className="font-mono font-bold text-slate-800 text-sm">
              {transactions.length} khoản
            </span>
          </div>
          {canManage && (
            <div className="flex items-center gap-2 mt-3">
              <Button
                id="btn-add-income"
                size="sm"
                onClick={() => openCreateDialog('income')}
                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Thu quỹ
              </Button>
              <Button
                id="btn-add-expense"
                size="sm"
                onClick={() => openCreateDialog('expense')}
                className="flex-1 text-xs bg-rose-600 hover:bg-rose-700 text-white h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ghi Chi
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Organization Financial Breakdown Section */}
      {participatingOrganizations.length > 1 && (
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <PieChart className="h-4 w-4 text-purple-600" />
              <span>Phân bổ Thu / Chi theo Đơn vị tham gia</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Minh bạch tài chính giữa {participatingOrganizations.length} đơn vị
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {participatingOrganizations.map((org) => {
              const orgStats = orgDistribution[org.id] || { income: 0, expense: 0 };
              const orgNet = orgStats.income - orgStats.expense;
              const isLead = org.id === plan.leadOrganizationId;

              return (
                <div
                  key={org.id}
                  className="bg-white border border-slate-200/80 rounded-xl p-3.5 text-xs space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {org.code.slice(0, 2)}
                      </div>
                      <span className="font-semibold text-slate-900 truncate">
                        {org.name}
                      </span>
                    </div>
                    {isLead && (
                      <Badge className="bg-purple-100 text-purple-800 border-none text-[10px] px-1.5 py-0.5 shrink-0">
                        Chủ trì
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Đã thu/gây</span>
                      <span className="font-semibold text-emerald-600 font-mono">
                        {formatVND(orgStats.income)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Đã giải ngân</span>
                      <span className="font-semibold text-rose-600 font-mono">
                        {formatVND(orgStats.expense)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Chênh lệch</span>
                      <span
                        className={`font-semibold font-mono ${
                          orgNet >= 0 ? 'text-blue-600' : 'text-amber-600'
                        }`}
                      >
                        {formatVND(orgNet)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions List with Search & Filters */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              Sổ Nhật Ký Thu - Chi & Chứng Từ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Toàn bộ các khoản thu chi, phân bổ kinh phí và đính kèm hóa đơn kiểm toán.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nội dung, danh mục..."
                className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>

            {/* Filter by Type */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 text-xs w-[110px] bg-slate-50">
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-xs">Tất cả loại</SelectItem>
                <SelectItem value="income" className="text-xs">Khoản Thu</SelectItem>
                <SelectItem value="expense" className="text-xs">Khoản Chi</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter by Org */}
            {participatingOrganizations.length > 1 && (
              <Select value={filterOrg} onValueChange={setFilterOrg}>
                <SelectTrigger className="h-8 text-xs w-[130px] bg-slate-50">
                  <SelectValue placeholder="Đơn vị" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="all" className="text-xs">Tất cả đơn vị</SelectItem>
                  {participatingOrganizations.map((org) => (
                    <SelectItem key={org.id} value={org.id} className="text-xs">
                      {org.code} - {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Transactions Table */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            <span>Đang tải dữ liệu thu chi...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
            <Wallet className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Chưa có giao dịch tài chính nào</p>
            <p className="mt-1">
              Bắt đầu ghi nhận các khoản thu gây quỹ hoặc chi phí triển khai chiến dịch.
            </p>
            {canManage && (
              <Button
                size="sm"
                onClick={() => openCreateDialog('expense')}
                className="mt-3 text-xs bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ghi nhận giao dịch đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3">Loại & Danh mục</th>
                  <th className="px-4 py-3">Đơn vị thực hiện</th>
                  <th className="px-4 py-3">Nội dung chi tiết</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3 text-center">Chứng từ</th>
                  {canManage && <th className="px-4 py-3 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.transactionType === 'income';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Ngày giao dịch */}
                      <td className="px-4 py-3 font-mono whitespace-nowrap text-slate-600">
                        {formatDate(tx.transactionDate)}
                      </td>

                      {/* Loại & Danh mục */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={`text-[10px] px-1.5 py-0.5 font-medium border-none ${
                              isIncome
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isIncome ? 'Thu / Gây quỹ' : 'Khoản Chi'}
                          </Badge>
                          <span className="font-semibold text-slate-900">
                            {tx.categoryName}
                          </span>
                        </div>
                      </td>

                      {/* Đơn vị thực hiện */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded bg-slate-100 text-slate-600 font-bold text-[9px] flex items-center justify-center">
                            {tx.organization?.code?.slice(0, 2) || 'OR'}
                          </div>
                          <span className="text-slate-800 font-medium truncate max-w-[140px]">
                            {tx.organization?.name || 'Đơn vị'}
                          </span>
                        </div>
                        {tx.collabActivity && (
                          <span className="text-[10px] text-purple-600 block mt-0.5 truncate max-w-[150px]">
                            ↳ {tx.collabActivity.title}
                          </span>
                        )}
                      </td>

                      {/* Nội dung */}
                      <td className="px-4 py-3 text-slate-800 max-w-xs">
                        <p className="line-clamp-2 leading-relaxed">{tx.description}</p>
                      </td>

                      {/* Số tiền */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold text-xs ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{formatVND(tx.amount)}
                        </span>
                      </td>

                      {/* Chứng từ / Hóa đơn đính kèm */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {tx.receiptUrl ? (
                          <a
                            href={tx.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 hover:text-purple-800 hover:underline bg-purple-50 px-2 py-1 rounded-lg border border-purple-200/60"
                            title="Xem hóa đơn / chứng từ minh bạch"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Xem chứng từ</span>
                            <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Chưa đính kèm
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      {canManage && (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(tx)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                              title="Sửa giao dịch"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(tx.id)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Xóa giao dịch"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog: Create / Edit Transaction */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              {editingTransaction ? 'Chỉnh Sửa Giao Dịch' : 'Ghi Nhận Thu / Chi Chiến Dịch'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ghi lại các khoản thu gây quỹ, giải ngân hậu cần và đính kèm đường link hóa đơn minh bạch.
            </DialogDescription>
          </DialogHeader>

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{submitError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 py-1 text-left">
            {/* Loại giao dịch */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setValue('transactionType', 'income');
                  setValue('categoryName', 'Gây quỹ sự kiện');
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  selectedType === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Khoản Thu (Gây quỹ / Tài trợ)
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('transactionType', 'expense');
                  setValue('categoryName', 'Hậu cần & Vật tư');
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  selectedType === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingDown className="h-3.5 w-3.5" />
                Khoản Chi (Giải ngân / Mua sắm)
              </button>
            </div>

            {/* Số tiền & Ngày */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="tx-amount" className="block text-xs font-semibold text-slate-700">
                  Số tiền (VND) <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="tx-amount"
                  type="number"
                  {...register('amount')}
                  placeholder="500000"
                  className="h-9 text-xs font-mono bg-slate-50/50"
                />
                {errors.amount && (
                  <p className="text-[11px] text-rose-500">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Ngày giao dịch <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="transactionDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn ngày giao dịch"
                    />
                  )}
                />
                {errors.transactionDate && (
                  <p className="text-[11px] text-rose-500">{errors.transactionDate.message}</p>
                )}
              </div>
            </div>

            {/* Danh mục */}
            <div className="space-y-1">
              <label htmlFor="tx-category" className="block text-xs font-semibold text-slate-700">
                Danh mục Thu / Chi <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="categoryName"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="tx-category" className="h-9 text-xs bg-slate-50/50">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {(selectedType === 'income'
                        ? DEFAULT_INCOME_CATEGORIES
                        : DEFAULT_EXPENSE_CATEGORIES
                      ).map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Đơn vị thực hiện & Hoạt động liên quan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="tx-org" className="block text-xs font-semibold text-slate-700">
                  Đơn vị chịu trách nhiệm <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="organizationId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="tx-org" className="h-9 text-xs bg-slate-50/50">
                        <SelectValue placeholder="Chọn đơn vị" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        {participatingOrganizations.map((org) => (
                          <SelectItem key={org.id} value={org.id} className="text-xs">
                            {org.name} ({org.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="tx-activity" className="block text-xs font-semibold text-slate-700">
                  Thuộc Hoạt Động (Tùy chọn)
                </label>
                <Controller
                  name="collabActivityId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                    >
                      <SelectTrigger id="tx-activity" className="h-9 text-xs bg-slate-50/50">
                        <SelectValue placeholder="Chọn hoạt động" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 max-h-48">
                        <SelectItem value="none" className="text-xs text-slate-400">
                          -- Chung cho toàn chiến dịch --
                        </SelectItem>
                        {collabActivities.map((act) => (
                          <SelectItem key={act.id} value={act.id} className="text-xs">
                            {act.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Nội dung chi tiết */}
            <div className="space-y-1">
              <label htmlFor="tx-description" className="block text-xs font-semibold text-slate-700">
                Nội dung diễn giải <span className="text-rose-500">*</span>
              </label>
              <Textarea
                id="tx-description"
                {...register('description')}
                rows={2}
                placeholder="Ví dụ: Mua 100 chai nước suối, in ấn 2 backdrop sân khấu A..."
                className="text-xs bg-slate-50/50 resize-none"
              />
              {errors.description && (
                <p className="text-[11px] text-rose-500">{errors.description.message}</p>
              )}
            </div>

            {/* Link chứng từ / Hóa đơn */}
            <div className="space-y-1">
              <label htmlFor="tx-receipt" className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Link Chứng từ / Hóa đơn VAT (Google Drive / Ảnh)</span>
                <span className="text-[10px] text-slate-400 font-normal">Minh bạch kiểm toán</span>
              </label>
              <Input
                id="tx-receipt"
                {...register('receiptUrl')}
                placeholder="https://drive.google.com/file/d/..."
                className="h-9 text-xs bg-slate-50/50 font-mono"
              />
              {errors.receiptUrl && (
                <p className="text-[11px] text-rose-500">{errors.receiptUrl.message}</p>
              )}
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
                className={`text-xs text-white ${
                  selectedType === 'income'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu giao dịch'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
