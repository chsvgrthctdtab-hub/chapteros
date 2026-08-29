import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type {
  FinanceCategory,
  FinanceTransaction,
  FinanceType,
  TransactionStatus,
  PeriodClosingType,
  PeriodClosingStatus,
  ReconciliationStatus,
} from '@/types';
import type {
  FinanceFilterParams,
  FinanceSummaryStats,
  FinanceTransactionListItem,
  FinanceCategoryOption,
  FinanceTermOption,
  FinanceActivityOption,
  FinancePeriodClosingItem,
  CreatePeriodClosingInput,
  ReopenPeriodInput,
} from '@/features/finance/types/finance.types';

type DbCategory = Database['public']['Tables']['finance_categories']['Row'];
type DbCategoryInsert = Database['public']['Tables']['finance_categories']['Insert'];
type DbCategoryUpdate = Database['public']['Tables']['finance_categories']['Update'];
type DbTransaction = Database['public']['Tables']['finance_transactions']['Row'];
type DbTransactionInsert = Database['public']['Tables']['finance_transactions']['Insert'];
type DbTransactionUpdate = Database['public']['Tables']['finance_transactions']['Update'];
type DbPeriodClosing = Database['public']['Tables']['finance_period_closings']['Row'];
type DbPeriodClosingInsert = Database['public']['Tables']['finance_period_closings']['Insert'];
type DbPeriodClosingUpdate = Database['public']['Tables']['finance_period_closings']['Update'];

export type {
  DbCategoryInsert,
  DbCategoryUpdate,
  DbTransactionInsert,
  DbTransactionUpdate,
  DbPeriodClosingInsert,
  DbPeriodClosingUpdate,
};

export interface FinanceListResponse {
  transactions: FinanceTransactionListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface RawTransactionRow extends DbTransaction {
  category?: {
    id: string;
    name: string;
    type: string;
    description: string | null;
    is_system: boolean;
  } | null;
  activity?: {
    id: string;
    title: string;
    code: string | null;
    category: string;
    status: string;
  } | null;
  term?: {
    id: string;
    name: string;
    is_current: boolean;
    status?: string;
  } | null;
  recorder?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    student_id: string | null;
  } | null;
  approver?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface RawPeriodClosingRow extends DbPeriodClosing {
  term?: {
    id: string;
    name: string;
    status: string;
  } | null;
}

function mapCategoryFromDb(row: DbCategory): FinanceCategory {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    type: row.type as FinanceType,
    description: row.description,
    isSystem: row.is_system,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRawToTransactionItem(row: RawTransactionRow): FinanceTransactionListItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    termId: row.term_id,
    categoryId: row.category_id,
    activityId: row.activity_id,
    transactionType: row.transaction_type as FinanceType,
    amount: Number(row.amount),
    description: row.description,
    transactionDate: row.transaction_date,
    status: (row.status || 'posted') as TransactionStatus,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    rejectionReason: row.rejection_reason,
    rejectedAt: row.rejected_at,
    periodClosingId: row.period_closing_id,
    receiptUrl: row.receipt_url,
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.category
      ? {
          id: row.category.id,
          name: row.category.name,
          type: row.category.type as FinanceType,
          description: row.category.description,
          isSystem: row.category.is_system,
        }
      : null,
    activity: row.activity
      ? {
          id: row.activity.id,
          title: row.activity.title,
          code: row.activity.code,
          category: row.activity.category,
          status: row.activity.status,
        }
      : null,
    term: row.term
      ? {
          id: row.term.id,
          name: row.term.name,
          isCurrent: row.term.is_current,
          status: row.term.status,
        }
      : null,
    recorder: row.recorder
      ? {
          id: row.recorder.id,
          fullName: row.recorder.full_name,
          email: row.recorder.email,
          avatarUrl: row.recorder.avatar_url,
          studentId: row.recorder.student_id,
        }
      : null,
    approver: row.approver
      ? {
          id: row.approver.id,
          fullName: row.approver.full_name,
          email: row.approver.email,
          avatarUrl: row.approver.avatar_url,
        }
      : null,
  };
}

function mapRawToPeriodClosingItem(row: RawPeriodClosingRow): FinancePeriodClosingItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    termId: row.term_id,
    periodType: row.period_type as PeriodClosingType,
    periodName: row.period_name,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status as PeriodClosingStatus,
    openingBalance: Number(row.opening_balance) || 0,
    totalIncome: Number(row.total_income) || 0,
    totalExpense: Number(row.total_expense) || 0,
    closingBalance: Number(row.closing_balance) || 0,
    actualBalance: Number(row.actual_balance) || 0,
    reconciliationStatus: row.reconciliation_status as ReconciliationStatus,
    reconciliationDiscrepancy: Number(row.reconciliation_discrepancy) || 0,
    reconciliationNotes: row.reconciliation_notes,
    closedAt: row.closed_at,
    closedBy: row.closed_by,
    closedByName: row.closed_by_name,
    reopenedAt: row.reopened_at,
    reopenedBy: row.reopened_by,
    reopenedByName: row.reopened_by_name,
    reopenReason: row.reopen_reason,
    snapshotData: row.snapshot_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    term: row.term
      ? {
          id: row.term.id,
          name: row.term.name,
          status: row.term.status,
        }
      : null,
  };
}

const DEFAULT_SYSTEM_CATEGORIES: Array<{
  name: string;
  type: FinanceType;
  description: string;
  is_system: boolean;
}> = [
  { name: 'Hội phí hội viên', type: 'income', description: 'Thu hội phí định kỳ từ hội viên chi hội', is_system: true },
  { name: 'Tài trợ & Bảo trợ', type: 'income', description: 'Nguồn tài trợ từ cựu sinh viên, doanh nghiệp hoặc đối tác', is_system: true },
  { name: 'Hỗ trợ từ Đoàn - Hội cấp trên', type: 'income', description: 'Kinh phí cấp phát từ Đoàn trường / Hội sinh viên', is_system: true },
  { name: 'Đóng góp & Quyên góp', type: 'income', description: 'Đóng góp tự nguyện cho các chiến dịch thiện nguyện, phong trào', is_system: true },
  { name: 'Doanh thu gây quỹ', type: 'income', description: 'Thu từ các hoạt động bán hàng, sự kiện gây quỹ', is_system: true },
  { name: 'Thu khác', type: 'income', description: 'Các khoản thu phát sinh khác', is_system: false },

  { name: 'Tổ chức sự kiện & Hoạt động', type: 'expense', description: 'Chi phí thuê địa điểm, âm thanh, ánh sáng sự kiện', is_system: true },
  { name: 'Vật tư & Ấn phẩm', type: 'expense', description: 'Mua sắm đạo cụ, banner, backdrop, thẻ đeo, dụng cụ', is_system: true },
  { name: 'Quà tặng & Khen thưởng', type: 'expense', description: 'Quà tặng đại biểu, khen thưởng hội viên xuất sắc, giải thưởng', is_system: true },
  { name: 'Truyền thông & In ấn', type: 'expense', description: 'Chi phí in ấn tài liệu, vé, tài liệu hội nghị', is_system: true },
  { name: 'Di chuyển & Hậu cần', type: 'expense', description: 'Thuê xe, nước uống, ăn nhẹ cho ban tổ chức và tình nguyện viên', is_system: true },
  { name: 'Hành chính & Quản lý quỹ', type: 'expense', description: 'Chi phí văn phòng phẩm, dấu mộc, lưu trữ', is_system: true },
  { name: 'Chi khác', type: 'expense', description: 'Các khoản chi phát sinh khác', is_system: false },
];

const TRANSACTION_BASE_SELECT = `
  id,
  organization_id,
  term_id,
  category_id,
  activity_id,
  transaction_type,
  amount,
  description,
  transaction_date,
  status,
  approved_by,
  approved_at,
  rejection_reason,
  rejected_at,
  period_closing_id,
  receipt_url,
  recorded_by,
  created_at,
  updated_at,
  category:finance_categories (
    id,
    name,
    type,
    description,
    is_system
  ),
  activity:activities (
    id,
    title,
    code,
    category,
    status
  ),
  term:terms (
    id,
    name,
    is_current,
    status
  )
`;

type ProfileSummary = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  student_id: string | null;
};

/**
 * Hydrates recorder and approver profile details onto raw transaction rows in a single batch query.
 * Avoids any direct PostgREST nested relationship lookup between finance_transactions and profiles,
 * and eliminates N+1 query patterns.
 */
export async function hydrateTransactionProfiles(
  rows: RawTransactionRow[]
): Promise<RawTransactionRow[]> {
  if (!rows || rows.length === 0 || !isSupabaseConfigured) {
    return rows;
  }

  // 1. Collect all distinct non-null user IDs (recorded_by & approved_by)
  const userIds = Array.from(
    new Set(
      rows
        .flatMap((r) => [r.recorded_by, r.approved_by])
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    )
  );

  if (userIds.length === 0) {
    return rows;
  }

  // 2. Fetch profiles in ONE batch query
  let profileMap = new Map<string, ProfileSummary>();
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, student_id')
      .in('id', userIds);

    if (error) {
      console.warn('[financeRepository] Failed to fetch profiles for transactions:', error.message);
    } else if (profiles) {
      profileMap = new Map((profiles as ProfileSummary[]).map((p) => [p.id, p]));
    }
  } catch (err) {
    console.warn('[financeRepository] Unexpected error hydrating transaction profiles:', err);
  }

  // 3. Attach profile information to raw rows
  return rows.map((row) => {
    const recorderProfile = row.recorded_by ? profileMap.get(row.recorded_by) : undefined;
    const approverProfile = row.approved_by ? profileMap.get(row.approved_by) : undefined;

    return {
      ...row,
      recorder: recorderProfile
        ? {
            id: recorderProfile.id,
            full_name: recorderProfile.full_name,
            email: recorderProfile.email,
            avatar_url: recorderProfile.avatar_url,
            student_id: recorderProfile.student_id,
          }
        : row.recorder ?? null,
      approver: approverProfile
        ? {
            id: approverProfile.id,
            full_name: approverProfile.full_name,
            email: approverProfile.email,
            avatar_url: approverProfile.avatar_url,
          }
        : row.approver ?? null,
    };
  });
}

export const financeRepository = {
  // ==================== ORGANIZATION APPROVAL THRESHOLD ====================

  /**
   * Get approval threshold for an organization (defaults to 2,000,000 VND if unset)
   */
  async getApprovalThreshold(organizationId: string): Promise<number> {
    if (!isSupabaseConfigured || !organizationId) return 2000000;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('finance_approval_threshold')
        .eq('id', organizationId)
        .maybeSingle();

      if (error || !data) return 2000000;
      const raw = (data as any).finance_approval_threshold;
      if (raw === null || raw === undefined) return 2000000;
      return Number(raw) || 0;
    } catch {
      return 2000000;
    }
  },

  /**
   * Update approval threshold for an organization
   */
  async updateApprovalThreshold(organizationId: string, threshold: number): Promise<number> {
    if (!isSupabaseConfigured || !organizationId) throw new Error('Chưa cấu hình Supabase');

    const cleanThreshold = Math.max(0, Number(threshold) || 0);

    const { error } = await (supabase.from('organizations') as any)
      .update({
        finance_approval_threshold: cleanThreshold,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (error) throw new Error(error.message || 'Không thể cập nhật hạn mức phê duyệt');
    return cleanThreshold;
  },

  // ==================== CATEGORIES ====================

  /**
   * Fetch all categories for an organization, optionally filtered by type
   */
  async getCategories(organizationId: string, type?: FinanceType | 'all'): Promise<FinanceCategory[]> {
    if (!isSupabaseConfigured || !organizationId) return [];

    let query = supabase
      .from('finance_categories')
      .select('*')
      .eq('organization_id', organizationId);

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    query = query.order('name', { ascending: true });

    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Không thể tải danh mục thu chi');

    let categories = ((data || []) as unknown as DbCategory[]).map(mapCategoryFromDb);

    // If organization has no categories at all, auto-seed defaults
    if (categories.length === 0 && (!type || type === 'all')) {
      categories = await this.seedDefaultCategories(organizationId);
    }

    return categories;
  },

  /**
   * Seed default system categories for a new organization
   */
  async seedDefaultCategories(organizationId: string): Promise<FinanceCategory[]> {
    if (!isSupabaseConfigured || !organizationId) return [];

    const rowsToInsert = DEFAULT_SYSTEM_CATEGORIES.map((cat) => ({
      organization_id: organizationId,
      name: cat.name,
      type: cat.type,
      description: cat.description,
      is_system: cat.is_system,
    }));

    const { data, error } = await supabase
      .from('finance_categories')
      .insert(rowsToInsert as never)
      .select();

    if (error) {
      console.warn('Seed categories notice:', error.message);
      // Fallback query in case seed had conflicts
      const { data: existing } = await supabase
        .from('finance_categories')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });
      return ((existing || []) as unknown as DbCategory[]).map(mapCategoryFromDb);
    }

    return ((data || []) as unknown as DbCategory[]).map(mapCategoryFromDb);
  },

  /**
   * Get single category by ID
   */
  async getCategoryById(id: string, organizationId?: string): Promise<FinanceCategory | null> {
    if (!isSupabaseConfigured || !id) return null;

    let query = supabase
      .from('finance_categories')
      .select('*')
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message || 'Không thể tải thông tin danh mục');
    if (!data) return null;

    return mapCategoryFromDb(data as unknown as DbCategory);
  },

  /**
   * Get category by Name and Type in an organization
   */
  async getCategoryByName(
    organizationId: string,
    name: string,
    type?: FinanceType
  ): Promise<FinanceCategory | null> {
    if (!isSupabaseConfigured || !organizationId || !name) return null;

    let query = supabase
      .from('finance_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .ilike('name', name.trim());

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.maybeSingle();
    if (error) return null;
    if (!data) return null;

    return mapCategoryFromDb(data as unknown as DbCategory);
  },

  /**
   * Create a new category
   */
  async createCategory(payload: DbCategoryInsert): Promise<FinanceCategory> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình');

    const { data, error } = await supabase
      .from('finance_categories')
      .insert(payload as never)
      .select()
      .single();

    if (error) throw new Error(error.message || 'Không thể tạo danh mục mới');
    return mapCategoryFromDb(data as unknown as DbCategory);
  },

  /**
   * Update category
   */
  async updateCategory(
    id: string,
    payload: DbCategoryUpdate,
    organizationId?: string
  ): Promise<FinanceCategory> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình');

    let query = supabase
      .from('finance_categories')
      .update(payload as never)
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.select().single();
    if (error) throw new Error(error.message || 'Không thể cập nhật danh mục');
    return mapCategoryFromDb(data as unknown as DbCategory);
  },

  /**
   * Delete category
   */
  async deleteCategory(id: string, organizationId?: string): Promise<void> {
    if (!isSupabaseConfigured || !id) return;

    let query = supabase
      .from('finance_categories')
      .delete()
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { error } = await query;
    if (error) {
      if (error.code === '23503') {
        throw new Error('Không thể xóa danh mục này vì đang có giao dịch phát sinh sử dụng danh mục.');
      }
      throw new Error(error.message || 'Không thể xóa danh mục');
    }
  },

  // ==================== TRANSACTIONS ====================

  /**
   * Fetch paginated and filtered transactions for an organization
   */
  async getTransactions(
    organizationId: string,
    params: FinanceFilterParams = {}
  ): Promise<FinanceListResponse> {
    if (!isSupabaseConfigured || !organizationId) {
      return {
        transactions: [],
        totalCount: 0,
        page: 1,
        pageSize: params.pageSize || 15,
        totalPages: 0,
      };
    }

    const {
      search = '',
      type = 'all',
      status = 'all',
      categoryId = 'all',
      termId = 'all',
      activityId = 'all',
      periodClosingId,
      startDate = '',
      endDate = '',
      page = 1,
      pageSize = 15,
      sortBy = 'transaction_date',
      sortOrder = 'desc',
    } = params;

    let query = (supabase.from('finance_transactions') as any)
      .select(TRANSACTION_BASE_SELECT, { count: 'exact' })
      .eq('organization_id', organizationId);

    // Filter Type
    if (type !== 'all') {
      query = query.eq('transaction_type', type);
    }

    // Filter Status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter Category
    if (categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    // Filter Term
    if (termId !== 'all') {
      query = query.eq('term_id', termId);
    }

    // Filter Activity
    if (activityId === 'independent' || activityId === 'none') {
      query = query.is('activity_id', null);
    } else if (activityId !== 'all') {
      query = query.eq('activity_id', activityId);
    }

    // Filter Period Closing ID
    if (periodClosingId) {
      query = query.eq('period_closing_id', periodClosingId);
    }

    // Filter Date Range
    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    // Filter Search
    if (search.trim()) {
      query = query.ilike('description', `%${search.trim()}%`);
    }

    // Sorting
    const isAsc = sortOrder === 'asc';
    if (sortBy === 'amount') {
      query = query.order('amount', { ascending: isAsc });
    } else if (sortBy === 'status') {
      query = query.order('status', { ascending: isAsc });
    } else if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending: isAsc });
    } else {
      query = query
        .order('transaction_date', { ascending: isAsc })
        .order('created_at', { ascending: isAsc });
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message || 'Không thể tải danh sách giao dịch tài chính');

    const rawRows = (data || []) as unknown as RawTransactionRow[];
    const hydratedRows = await hydrateTransactionProfiles(rawRows);
    const transactions = hydratedRows.map(mapRawToTransactionItem);
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      transactions,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  /**
   * Fetch single transaction by ID
   */
  async getTransactionById(
    id: string,
    organizationId?: string
  ): Promise<FinanceTransactionListItem | null> {
    if (!isSupabaseConfigured || !id) return null;

    let query = (supabase.from('finance_transactions') as any)
      .select(TRANSACTION_BASE_SELECT)
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message || 'Không tìm thấy thông tin giao dịch');
    if (!data) return null;

    const rawRows = [data as unknown as RawTransactionRow];
    const [hydratedRow] = await hydrateTransactionProfiles(rawRows);
    return mapRawToTransactionItem(hydratedRow);
  },

  /**
   * Create a new finance transaction
   */
  async createTransaction(payload: DbTransactionInsert): Promise<FinanceTransactionListItem> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình');

    const { data, error } = await (supabase.from('finance_transactions') as any)
      .insert(payload as never)
      .select(TRANSACTION_BASE_SELECT)
      .single();

    if (error) throw new Error(error.message || 'Không thể tạo giao dịch tài chính');
    const rawRows = [data as unknown as RawTransactionRow];
    const [hydratedRow] = await hydrateTransactionProfiles(rawRows);
    return mapRawToTransactionItem(hydratedRow);
  },

  /**
   * Update an existing finance transaction
   */
  async updateTransaction(
    id: string,
    payload: DbTransactionUpdate,
    organizationId?: string
  ): Promise<FinanceTransactionListItem> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình');

    let query = (supabase.from('finance_transactions') as any)
      .update(payload as never)
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query
      .select(TRANSACTION_BASE_SELECT)
      .single();

    if (error) throw new Error(error.message || 'Không thể cập nhật giao dịch tài chính');
    const rawRows = [data as unknown as RawTransactionRow];
    const [hydratedRow] = await hydrateTransactionProfiles(rawRows);
    return mapRawToTransactionItem(hydratedRow);
  },

  /**
   * Approve a pending transaction
   */
  async approveTransaction(
    id: string,
    organizationId: string,
    approverUserId: string
  ): Promise<FinanceTransactionListItem> {
    return this.updateTransaction(
      id,
      {
        status: 'approved',
        approved_by: approverUserId,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      },
      organizationId
    );
  },

  /**
   * Reject a transaction
   */
  async rejectTransaction(
    id: string,
    organizationId: string,
    rejecterUserId: string,
    rejectionReason: string
  ): Promise<FinanceTransactionListItem> {
    return this.updateTransaction(
      id,
      {
        status: 'rejected',
        approved_by: rejecterUserId,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
        rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      organizationId
    );
  },

  /**
   * Delete a finance transaction
   */
  async deleteTransaction(id: string, organizationId?: string): Promise<void> {
    if (!isSupabaseConfigured || !id) return;

    let query = supabase
      .from('finance_transactions')
      .delete()
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { error } = await query;
    if (error) throw new Error(error.message || 'Không thể xóa giao dịch tài chính');
  },

  /**
   * Calculate financial summary stats dynamically (Official balance counts ONLY posted & approved transactions)
   */
  async getSummary(
    organizationId: string,
    filters: Partial<FinanceFilterParams> = {}
  ): Promise<FinanceSummaryStats> {
    if (!isSupabaseConfigured || !organizationId) {
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

    let query = (supabase.from('finance_transactions') as any)
      .select('amount, transaction_type, transaction_date, status')
      .eq('organization_id', organizationId);

    if (filters.termId && filters.termId !== 'all') {
      query = query.eq('term_id', filters.termId);
    }
    if (filters.categoryId && filters.categoryId !== 'all') {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters.activityId === 'independent') {
      query = query.is('activity_id', null);
    } else if (filters.activityId && filters.activityId !== 'all') {
      query = query.eq('activity_id', filters.activityId);
    }
    if (filters.periodClosingId) {
      query = query.eq('period_closing_id', filters.periodClosingId);
    }
    if (filters.startDate) {
      query = query.gte('transaction_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('transaction_date', filters.endDate);
    }
    if (filters.search && filters.search.trim()) {
      query = query.ilike('description', `%${filters.search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Không thể tính toán thống kê tài chính');

    interface SummaryItem {
      amount: number;
      transaction_type: string;
      transaction_date: string;
      status?: string;
    }

    const rows = (data || []) as unknown as SummaryItem[];
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let thisMonthIncome = 0;
    let thisMonthExpense = 0;

    let pendingApprovalCount = 0;
    let pendingApprovalAmount = 0;
    let approvedCount = 0;
    let postedCount = 0;
    let rejectedCount = 0;

    for (const item of rows) {
      const amt = Number(item.amount) || 0;
      const status = item.status || 'posted';
      const isOfficial = status === 'posted' || status === 'approved';
      const isThisMonth = typeof item.transaction_date === 'string' && item.transaction_date.startsWith(currentMonthPrefix);

      if (status === 'pending_approval') {
        pendingApprovalCount++;
        pendingApprovalAmount += amt;
      } else if (status === 'approved') {
        approvedCount++;
      } else if (status === 'posted') {
        postedCount++;
      } else if (status === 'rejected') {
        rejectedCount++;
      }

      // Official balance calculation ONLY includes posted & approved transactions
      if (isOfficial) {
        if (item.transaction_type === 'income') {
          totalIncome += amt;
          incomeCount++;
          if (isThisMonth) {
            thisMonthIncome += amt;
          }
        } else if (item.transaction_type === 'expense') {
          totalExpense += amt;
          expenseCount++;
          if (isThisMonth) {
            thisMonthExpense += amt;
          }
        }
      }
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: rows.length,
      incomeCount,
      expenseCount,
      thisMonthIncome,
      thisMonthExpense,
      thisMonthBalance: thisMonthIncome - thisMonthExpense,
      pendingApprovalCount,
      pendingApprovalAmount,
      approvedCount,
      postedCount,
      rejectedCount,
    };
  },

  /**
   * Fetch all finance transactions and calculated balance for a specific activity
   */
  async getActivityFinance(
    organizationId: string,
    activityId: string
  ): Promise<{
    transactions: FinanceTransactionListItem[];
    totalIncome: number;
    totalExpense: number;
    balance: number;
  }> {
    if (!isSupabaseConfigured || !organizationId || !activityId) {
      return { transactions: [], totalIncome: 0, totalExpense: 0, balance: 0 };
    }

    const { data, error } = await (supabase.from('finance_transactions') as any)
      .select(TRANSACTION_BASE_SELECT)
      .eq('organization_id', organizationId)
      .eq('activity_id', activityId)
      .order('transaction_date', { ascending: false });

    if (error) throw new Error(error.message || 'Không thể tải tài chính hoạt động');

    const rawRows = (data || []) as unknown as RawTransactionRow[];
    const hydratedRows = await hydrateTransactionProfiles(rawRows);
    const transactions = hydratedRows.map(mapRawToTransactionItem);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
      if (tx.status === 'posted' || tx.status === 'approved') {
        if (tx.transactionType === 'income') {
          totalIncome += tx.amount;
        } else {
          totalExpense += tx.amount;
        }
      }
    }

    return {
      transactions,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  },

  // ==================== PERIOD CLOSING & RECONCILIATION ====================

  /**
   * Check if a specific date falls within any active closed period for an organization
   */
  async checkDateInClosedPeriod(
    organizationId: string,
    transactionDate: string
  ): Promise<FinancePeriodClosingItem | null> {
    if (!isSupabaseConfigured || !organizationId || !transactionDate) return null;

    try {
      const { data, error } = await (supabase.from('finance_period_closings') as any)
        .select(
          `
          id,
          organization_id,
          term_id,
          period_type,
          period_name,
          period_start,
          period_end,
          status,
          opening_balance,
          total_income,
          total_expense,
          closing_balance,
          actual_balance,
          reconciliation_status,
          reconciliation_discrepancy,
          reconciliation_notes,
          closed_at,
          closed_by,
          closed_by_name,
          reopened_at,
          reopened_by,
          reopened_by_name,
          reopen_reason,
          snapshot_data,
          created_at,
          updated_at
        `
        )
        .eq('organization_id', organizationId)
        .eq('status', 'closed')
        .lte('period_start', transactionDate)
        .gte('period_end', transactionDate)
        .maybeSingle();

      if (error || !data) return null;
      return mapRawToPeriodClosingItem(data as unknown as RawPeriodClosingRow);
    } catch {
      return null;
    }
  },

  /**
   * Fetch all period closings for an organization
   */
  async getPeriodClosings(
    organizationId: string,
    termId?: string
  ): Promise<FinancePeriodClosingItem[]> {
    if (!isSupabaseConfigured || !organizationId) return [];

    let query = (supabase.from('finance_period_closings') as any)
      .select(
        `
        id,
        organization_id,
        term_id,
        period_type,
        period_name,
        period_start,
        period_end,
        status,
        opening_balance,
        total_income,
        total_expense,
        closing_balance,
        actual_balance,
        reconciliation_status,
        reconciliation_discrepancy,
        reconciliation_notes,
        closed_at,
        closed_by,
        closed_by_name,
        reopened_at,
        reopened_by,
        reopened_by_name,
        reopen_reason,
        snapshot_data,
        created_at,
        updated_at,
        term:terms (
          id,
          name,
          status
        )
      `
      )
      .eq('organization_id', organizationId)
      .order('period_end', { ascending: false });

    if (termId && termId !== 'all') {
      query = query.eq('term_id', termId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Không thể tải danh sách kỳ tài chính');

    return ((data || []) as unknown as RawPeriodClosingRow[]).map(mapRawToPeriodClosingItem);
  },

  /**
   * Fetch single period closing by ID
   */
  async getPeriodClosingById(
    id: string,
    organizationId?: string
  ): Promise<FinancePeriodClosingItem | null> {
    if (!isSupabaseConfigured || !id) return null;

    let query = (supabase.from('finance_period_closings') as any)
      .select(
        `
        id,
        organization_id,
        term_id,
        period_type,
        period_name,
        period_start,
        period_end,
        status,
        opening_balance,
        total_income,
        total_expense,
        closing_balance,
        actual_balance,
        reconciliation_status,
        reconciliation_discrepancy,
        reconciliation_notes,
        closed_at,
        closed_by,
        closed_by_name,
        reopened_at,
        reopened_by,
        reopened_by_name,
        reopen_reason,
        snapshot_data,
        created_at,
        updated_at,
        term:terms (
          id,
          name,
          status
        )
      `
      )
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message || 'Không tìm thấy kỳ tài chính');
    if (!data) return null;

    return mapRawToPeriodClosingItem(data as unknown as RawPeriodClosingRow);
  },

  /**
   * Calculate reconciliation stats for closing a period
   */
  async calculatePeriodReconciliationStats(
    organizationId: string,
    termId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<{
    openingBalance: number;
    totalIncome: number;
    totalExpense: number;
    closingBalance: number;
    transactionCount: number;
    transactions: FinanceTransactionListItem[];
  }> {
    if (!isSupabaseConfigured || !organizationId) {
      return {
        openingBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        closingBalance: 0,
        transactionCount: 0,
        transactions: [],
      };
    }

    // 1. Calculate opening balance: Sum of all posted/approved transactions strictly BEFORE periodStart in this term
    const { data: priorRows } = await (supabase.from('finance_transactions') as any)
      .select('amount, transaction_type, status')
      .eq('organization_id', organizationId)
      .eq('term_id', termId)
      .lt('transaction_date', periodStart)
      .in('status', ['posted', 'approved']);

    let openingBalance = 0;
    for (const r of (priorRows || []) as any[]) {
      const amt = Number(r.amount) || 0;
      if (r.transaction_type === 'income') {
        openingBalance += amt;
      } else {
        openingBalance -= amt;
      }
    }

    // 2. Fetch transactions within the period [periodStart, periodEnd]
    const { transactions, totalCount } = await this.getTransactions(organizationId, {
      termId,
      startDate: periodStart,
      endDate: periodEnd,
      pageSize: 1000,
    });

    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
      if (tx.status === 'posted' || tx.status === 'approved') {
        if (tx.transactionType === 'income') {
          totalIncome += tx.amount;
        } else {
          totalExpense += tx.amount;
        }
      }
    }

    const closingBalance = openingBalance + totalIncome - totalExpense;

    return {
      openingBalance,
      totalIncome,
      totalExpense,
      closingBalance,
      transactionCount: totalCount,
      transactions,
    };
  },

  /**
   * Create a new period closing and link transactions to it
   */
  async createPeriodClosing(payload: DbPeriodClosingInsert): Promise<FinancePeriodClosingItem> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình');

    const { data, error } = await (supabase.from('finance_period_closings') as any)
      .insert(payload as never)
      .select(
        `
        id,
        organization_id,
        term_id,
        period_type,
        period_name,
        period_start,
        period_end,
        status,
        opening_balance,
        total_income,
        total_expense,
        closing_balance,
        actual_balance,
        reconciliation_status,
        reconciliation_discrepancy,
        reconciliation_notes,
        closed_at,
        closed_by,
        closed_by_name,
        reopened_at,
        reopened_by,
        reopened_by_name,
        reopen_reason,
        snapshot_data,
        created_at,
        updated_at,
        term:terms (
          id,
          name,
          status
        )
      `
      )
      .single();

    if (error) throw new Error(error.message || 'Không thể tạo bản ghi chốt kỳ tài chính');

    const createdPeriod = mapRawToPeriodClosingItem(data as unknown as RawPeriodClosingRow);

    // Link all transactions in date range to this period_closing_id
    await (supabase.from('finance_transactions') as any)
      .update({ period_closing_id: createdPeriod.id })
      .eq('organization_id', payload.organization_id)
      .eq('term_id', payload.term_id)
      .gte('transaction_date', payload.period_start)
      .lte('transaction_date', payload.period_end);

    return createdPeriod;
  },

  /**
   * Reopen a closed period
   */
  async reopenPeriodClosing(
    periodId: string,
    organizationId: string,
    reopenedByUserId: string,
    reopenedByName: string,
    reopenReason: string
  ): Promise<FinancePeriodClosingItem> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình');

    const { data, error } = await (supabase.from('finance_period_closings') as any)
      .update({
        status: 'reopened',
        reopened_at: new Date().toISOString(),
        reopened_by: reopenedByUserId,
        reopened_by_name: reopenedByName,
        reopen_reason: reopenReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', periodId)
      .eq('organization_id', organizationId)
      .select(
        `
        id,
        organization_id,
        term_id,
        period_type,
        period_name,
        period_start,
        period_end,
        status,
        opening_balance,
        total_income,
        total_expense,
        closing_balance,
        actual_balance,
        reconciliation_status,
        reconciliation_discrepancy,
        reconciliation_notes,
        closed_at,
        closed_by,
        closed_by_name,
        reopened_at,
        reopened_by,
        reopened_by_name,
        reopen_reason,
        snapshot_data,
        created_at,
        updated_at,
        term:terms (
          id,
          name,
          status
        )
      `
      )
      .single();

    if (error) throw new Error(error.message || 'Không thể mở lại kỳ tài chính');
    return mapRawToPeriodClosingItem(data as unknown as RawPeriodClosingRow);
  },

  // ==================== SELECTOR OPTIONS ====================

  /**
   * Fetch terms for dropdown selection
   */
  async getTerms(organizationId: string): Promise<FinanceTermOption[]> {
    if (!isSupabaseConfigured || !organizationId) return [];

    const { data, error } = await supabase
      .from('terms')
      .select('id, name, is_current, status')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: false });

    if (error) throw new Error(error.message || 'Không thể tải danh sách nhiệm kỳ');

    interface TermRow {
      id: string;
      name: string;
      is_current: boolean;
      status: string;
    }

    return ((data || []) as unknown as TermRow[]).map((t) => ({
      id: t.id,
      name: t.name,
      isCurrent: t.is_current,
      status: t.status,
    }));
  },

  /**
   * Fetch activities for dropdown selection / linking
   */
  async getActivities(organizationId: string, termId?: string): Promise<FinanceActivityOption[]> {
    if (!isSupabaseConfigured || !organizationId) return [];

    let query = supabase
      .from('activities')
      .select('id, title, term_id, code, status')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: false });

    if (termId && termId !== 'all') {
      query = query.eq('term_id', termId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Không thể tải danh sách hoạt động');

    interface ActRow {
      id: string;
      title: string;
      term_id: string;
      code: string | null;
      status: string;
    }

    return ((data || []) as unknown as ActRow[]).map((a) => ({
      id: a.id,
      title: a.title,
      termId: a.term_id,
      code: a.code,
      status: a.status,
    }));
  },
};
