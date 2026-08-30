import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  financeRepository,
  type FinanceListResponse,
  type DbTransactionInsert,
  type DbTransactionUpdate,
  type DbCategoryInsert,
  type DbCategoryUpdate,
  type DbPeriodClosingInsert,
} from '@/repositories/finance.repository';
import { termRepository } from '@/repositories/term.repository';
import { activityRepository } from '@/repositories/activity.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { notificationRepository } from '@/repositories/notification.repository';
import { validateFinanceTermLock } from '@/features/terms/utils/term-workflow';
import { canApproveFinance, canCloseFinancePeriod, type OrganizationRole } from '@/types/roles';
import type { FinanceCategory, FinanceType, TransactionStatus } from '@/types';
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
import type {
  TransactionFormData,
  CategoryFormData,
} from '@/features/finance/schemas/finance.schema';

async function getAuthenticatedUserId(actorUserId?: string | null): Promise<string | null> {
  if (actorUserId) return actorUserId;
  if (!isSupabaseConfigured) return null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

export const financeService = {
  // ==================== ORGANIZATION APPROVAL THRESHOLD ====================

  /**
   * Get approval threshold amount for organization
   */
  async getApprovalThreshold(organizationId: string): Promise<number> {
    if (!organizationId) return 2000000;
    return financeRepository.getApprovalThreshold(organizationId);
  },

  /**
   * Update approval threshold amount (Admin/Leader only)
   */
  async updateApprovalThreshold(
    organizationId: string,
    threshold: number,
    actorUserId?: string | null,
    actorRole?: OrganizationRole | null
  ): Promise<number> {
    if (!organizationId) throw new Error('Thiếu mã Chi hội');
    if (actorRole && !canApproveFinance(actorRole)) {
      throw new Error('Chỉ Quản trị viên hoặc Chi hội trưởng mới có quyền cấu hình hạn mức duyệt tài chính');
    }

    const clean = Math.max(0, Number(threshold) || 0);
    const updated = await financeRepository.updateApprovalThreshold(organizationId, clean);
    const userId = await getAuthenticatedUserId(actorUserId);

    await auditLogRepository.log({
      organization_id: organizationId,
      user_id: userId,
      action: 'finance.update_threshold',
      entity_type: 'organization',
      entity_id: organizationId,
      metadata: {
        new_threshold: updated,
      },
    });

    return updated;
  },

  // ==================== CATEGORIES ====================

  /**
   * List finance categories for an organization
   */
  async listCategories(
    organizationId: string,
    type?: FinanceType | 'all'
  ): Promise<FinanceCategoryOption[]> {
    if (!organizationId) return [];
    const categories = await financeRepository.getCategories(organizationId, type);
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      description: c.description,
      isSystem: c.isSystem,
    }));
  },

  /**
   * Get category by ID with tenant verification
   */
  async getCategoryById(
    id: string,
    organizationId: string
  ): Promise<FinanceCategory | null> {
    if (!id || !organizationId) return null;
    return financeRepository.getCategoryById(id, organizationId);
  },

  /**
   * Create a new category with cross-tenant uniqueness validation and audit logging
   */
  async createCategory(
    organizationId: string,
    data: CategoryFormData,
    actorUserId?: string | null
  ): Promise<FinanceCategory> {
    if (!organizationId) {
      throw new Error('Thiếu mã Chi hội (organizationId)');
    }

    const trimmedName = data.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('Tên danh mục phải có ít nhất 2 ký tự');
    }

    if (data.type !== 'income' && data.type !== 'expense') {
      throw new Error('Loại danh mục không hợp lệ (phải là Thu hoặc Chi)');
    }

    // Check duplicate category name with same type in this org
    const existing = await financeRepository.getCategoryByName(
      organizationId,
      trimmedName,
      data.type
    );
    if (existing) {
      throw new Error(`Danh mục "${trimmedName}" thuộc loại ${data.type === 'income' ? 'Thu' : 'Chi'} đã tồn tại trong Đơn vị`);
    }

    const payload: DbCategoryInsert = {
      organization_id: organizationId,
      name: trimmedName,
      type: data.type,
      description: data.description?.trim() || null,
      is_system: false,
    };

    const category = await financeRepository.createCategory(payload);
    const userId = await getAuthenticatedUserId(actorUserId);

    await auditLogRepository.log({
      organization_id: organizationId,
      user_id: userId,
      action: 'finance.create_category',
      entity_type: 'finance_category',
      entity_id: category.id,
      metadata: {
        name: category.name,
        type: category.type,
        description: category.description,
      },
    });

    return category;
  },

  /**
   * Update a custom category with validation and audit logging
   */
  async updateCategory(
    id: string,
    organizationId: string,
    data: Partial<CategoryFormData>,
    actorUserId?: string | null
  ): Promise<FinanceCategory> {
    if (!id || !organizationId) {
      throw new Error('Thiếu thông tin danh mục hoặc Chi hội');
    }

    const existing = await financeRepository.getCategoryById(id, organizationId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Danh mục không tồn tại hoặc bạn không có quyền cập nhật');
    }

    const payload: DbCategoryUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed || trimmed.length < 2) {
        throw new Error('Tên danh mục phải có ít nhất 2 ký tự');
      }
      payload.name = trimmed;
    }

    if (data.type !== undefined) {
      if (data.type !== 'income' && data.type !== 'expense') {
        throw new Error('Loại danh mục không hợp lệ');
      }
      payload.type = data.type;
    }

    if (data.description !== undefined) {
      payload.description = data.description?.trim() || null;
    }

    const updated = await financeRepository.updateCategory(id, payload, organizationId);
    const userId = await getAuthenticatedUserId(actorUserId);

    await auditLogRepository.log({
      organization_id: organizationId,
      user_id: userId,
      action: 'finance.update_category',
      entity_type: 'finance_category',
      entity_id: updated.id,
      metadata: {
        old: { name: existing.name, type: existing.type },
        new: { name: updated.name, type: updated.type },
      },
    });

    return updated;
  },

  /**
   * Delete category
   */
  async deleteCategory(
    id: string,
    organizationId: string,
    actorUserId?: string | null
  ): Promise<void> {
    if (!id || !organizationId) {
      throw new Error('Thiếu thông tin danh mục hoặc Chi hội');
    }

    const existing = await financeRepository.getCategoryById(id, organizationId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Danh mục không tồn tại hoặc bạn không có quyền thao tác');
    }

    await financeRepository.deleteCategory(id, organizationId);
    const userId = await getAuthenticatedUserId(actorUserId);

    await auditLogRepository.log({
      organization_id: organizationId,
      user_id: userId,
      action: 'finance.delete_category',
      entity_type: 'finance_category',
      entity_id: id,
      metadata: {
        name: existing.name,
        type: existing.type,
      },
    });
  },

  // ==================== TRANSACTIONS ====================

  /**
   * List paginated and filtered transactions
   */
  async listTransactions(
    organizationId: string,
    params: FinanceFilterParams = {}
  ): Promise<FinanceListResponse> {
    if (!organizationId) {
      return {
        transactions: [],
        totalCount: 0,
        page: 1,
        pageSize: params.pageSize || 15,
        totalPages: 0,
      };
    }
    return financeRepository.getTransactions(organizationId, params);
  },

  /**
   * Get single transaction by ID
   */
  async getTransactionById(
    id: string,
    organizationId: string
  ): Promise<FinanceTransactionListItem | null> {
    if (!id || !organizationId) return null;
    return financeRepository.getTransactionById(id, organizationId);
  },

  /**
   * Create transaction with approval threshold logic, term lock & periodic closing lock enforcement
   */
  async createTransaction(
    organizationId: string,
    data: TransactionFormData,
    actorUserId?: string | null
  ): Promise<FinanceTransactionListItem> {
    if (!organizationId) {
      throw new Error('Thiếu mã Chi hội (organizationId)');
    }

    // 1. Validate Amount
    const cleanAmount = Math.abs(Number(data.amount));
    if (!cleanAmount || cleanAmount <= 0) {
      throw new Error('Số tiền giao dịch phải lớn hơn 0 ₫');
    }

    // 2. Validate Type
    if (data.transactionType !== 'income' && data.transactionType !== 'expense') {
      throw new Error('Loại giao dịch phải là Thu (income) hoặc Chi (expense)');
    }

    // 3. Validate Description
    const trimmedDesc = data.description?.trim();
    if (!trimmedDesc || trimmedDesc.length < 3) {
      throw new Error('Nội dung giao dịch phải có ít nhất 3 ký tự');
    }

    // 4. Validate Transaction Date
    if (!data.transactionDate) {
      throw new Error('Vui lòng chọn ngày phát sinh giao dịch');
    }

    // 5. Periodic Closing Lock Guard: Check if transaction date is inside a closed period
    const closedPeriod = await financeRepository.checkDateInClosedPeriod(
      organizationId,
      data.transactionDate
    );
    if (closedPeriod) {
      throw new Error(
        `Không thể ghi nhận giao dịch: Ngày ${data.transactionDate} thuộc kỳ tài chính đã chốt sổ "${closedPeriod.periodName}" (${closedPeriod.periodStart} đến ${closedPeriod.periodEnd}). Vui lòng mở lại kỳ tài chính để thực hiện.`
      );
    }

    // 6. Term Lock Guard: Term belongs to organizationId and is not completed/archived
    if (!data.termId) {
      throw new Error('Vui lòng chọn nhiệm kỳ ghi nhận giao dịch');
    }
    const term = await termRepository.getById(data.termId);
    if (!term || term.organizationId !== organizationId) {
      throw new Error('Nhiệm kỳ đã chọn không thuộc Đơn vị hiện tại hoặc không hợp lệ');
    }
    validateFinanceTermLock(term.status, 'tạo giao dịch mới');

    // 7. Category Validation: Category belongs to organizationId AND matches transactionType
    if (!data.categoryId) {
      throw new Error('Vui lòng chọn danh mục thu / chi');
    }
    const category = await financeRepository.getCategoryById(data.categoryId, organizationId);
    if (!category || category.organizationId !== organizationId) {
      throw new Error('Danh mục thu chi đã chọn không thuộc Đơn vị hiện tại');
    }
    if (category.type !== data.transactionType) {
      throw new Error(
        `Loại danh mục (${category.type === 'income' ? 'Thu' : 'Chi'}) không khớp với loại giao dịch (${data.transactionType === 'income' ? 'Thu' : 'Chi'})`
      );
    }

    // 8. Activity Validation (if linked)
    if (data.activityId) {
      const activity = await activityRepository.getById(data.activityId);
      if (!activity || activity.organizationId !== organizationId) {
        throw new Error('Hoạt động đã chọn không thuộc Đơn vị hiện tại');
      }
    }

    // 9. Evaluate Approval Workflow Threshold
    const threshold = await financeRepository.getApprovalThreshold(organizationId);
    const requiresApproval = cleanAmount > threshold;
    const initialStatus: TransactionStatus = requiresApproval ? 'pending_approval' : 'posted';

    const userId = await getAuthenticatedUserId(actorUserId);

    const payload: DbTransactionInsert = {
      organization_id: organizationId,
      term_id: data.termId,
      category_id: data.categoryId,
      activity_id: data.activityId || null,
      transaction_type: data.transactionType,
      amount: cleanAmount,
      description: trimmedDesc,
      transaction_date: data.transactionDate,
      status: initialStatus,
      receipt_url: data.receiptUrl?.trim() || null,
      recorded_by: userId || null,
    };

    const transaction = await financeRepository.createTransaction(payload);

    // 10. Notifications & Audit Logs
    if (requiresApproval) {
      // Send notification to executive board
      await notificationRepository.createNotification({
        organization_id: organizationId,
        title: 'Yêu cầu phê duyệt giao dịch tài chính',
        message: `Giao dịch ${data.transactionType === 'income' ? 'Thu' : 'Chi'} "${trimmedDesc}" (${formatVND(cleanAmount)}) vượt hạn mức ${formatVND(threshold)} và đang chờ phê duyệt.`,
        type: 'warning',
        category: 'finance',
        link: '/finance?tab=transactions&status=pending_approval',
        entity_type: 'finance_transaction',
        entity_id: transaction.id,
      });

      await auditLogRepository.log({
        organization_id: organizationId,
        user_id: userId,
        action: 'finance.transaction_submitted',
        entity_type: 'finance_transaction',
        entity_id: transaction.id,
        metadata: {
          amount: transaction.amount,
          transaction_type: transaction.transactionType,
          description: transaction.description,
          threshold,
          status: 'pending_approval',
        },
      });
    } else {
      await auditLogRepository.log({
        organization_id: organizationId,
        user_id: userId,
        action: 'finance.create_transaction',
        entity_type: 'finance_transaction',
        entity_id: transaction.id,
        metadata: {
          amount: transaction.amount,
          transaction_type: transaction.transactionType,
          description: transaction.description,
          status: 'posted',
        },
      });
    }

    return transaction;
  },

  /**
   * Update transaction with validations and period lock checks
   */
  async updateTransaction(
    transactionId: string,
    organizationId: string,
    data: Partial<TransactionFormData>,
    actorUserId?: string | null
  ): Promise<FinanceTransactionListItem> {
    if (!transactionId || !organizationId) {
      throw new Error('Thiếu mã giao dịch hoặc thông tin Chi hội');
    }

    const existing = await financeRepository.getTransactionById(transactionId, organizationId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Giao dịch không tồn tại hoặc bạn không có quyền cập nhật');
    }

    // 1. Period lock guard on existing transaction date
    const existingClosedPeriod = await financeRepository.checkDateInClosedPeriod(
      organizationId,
      existing.transactionDate
    );
    if (existingClosedPeriod) {
      throw new Error(
        `Không thể sửa giao dịch: Giao dịch nằm trong kỳ tài chính đã chốt "${existingClosedPeriod.periodName}". Vui lòng mở lại kỳ tài chính để thao tác.`
      );
    }

    // 2. Period lock guard on new target transaction date (if changed)
    if (data.transactionDate && data.transactionDate !== existing.transactionDate) {
      const targetClosedPeriod = await financeRepository.checkDateInClosedPeriod(
        organizationId,
        data.transactionDate
      );
      if (targetClosedPeriod) {
        throw new Error(
          `Không thể dời giao dịch đến ngày ${data.transactionDate}: Ngày này nằm trong kỳ tài chính đã chốt "${targetClosedPeriod.periodName}".`
        );
      }
    }

    // 3. Term lock guard on existing term
    if (existing.termId) {
      const existingTerm = await termRepository.getById(existing.termId);
      validateFinanceTermLock(existingTerm?.status, 'chỉnh sửa giao dịch trong nhiệm kỳ đã khóa');
    }

    const payload: DbTransactionUpdate = {
      updated_at: new Date().toISOString(),
    };

    const targetType = data.transactionType || existing.transactionType;
    const targetCategoryId = data.categoryId || existing.categoryId;

    // Validate amount & approval threshold readjustment if modified
    if (data.amount !== undefined) {
      const cleanAmount = Math.abs(Number(data.amount));
      if (!cleanAmount || cleanAmount <= 0) {
        throw new Error('Số tiền giao dịch phải lớn hơn 0 ₫');
      }
      payload.amount = cleanAmount;

      const threshold = await financeRepository.getApprovalThreshold(organizationId);
      if (cleanAmount > threshold && existing.status !== 'approved') {
        payload.status = 'pending_approval';
      }
    }

    // Validate type
    if (data.transactionType !== undefined) {
      if (data.transactionType !== 'income' && data.transactionType !== 'expense') {
        throw new Error('Loại giao dịch không hợp lệ');
      }
      payload.transaction_type = data.transactionType;
    }

    // Validate description
    if (data.description !== undefined) {
      const trimmed = data.description.trim();
      if (!trimmed || trimmed.length < 3) {
        throw new Error('Nội dung giao dịch phải có ít nhất 3 ký tự');
      }
      payload.description = trimmed;
    }

    // Validate date
    if (data.transactionDate !== undefined) {
      if (!data.transactionDate) {
        throw new Error('Vui lòng chọn ngày phát sinh giao dịch');
      }
      payload.transaction_date = data.transactionDate;
    }

    if (data.receiptUrl !== undefined) {
      payload.receipt_url = data.receiptUrl?.trim() || null;
    }

    // Validate Term change
    if (data.termId !== undefined && data.termId !== existing.termId) {
      const term = await termRepository.getById(data.termId);
      if (!term || term.organizationId !== organizationId) {
        throw new Error('Nhiệm kỳ đã chọn không thuộc Đơn vị hiện tại');
      }
      validateFinanceTermLock(term.status, 'chuyển giao dịch vào nhiệm kỳ đã khóa');
      payload.term_id = data.termId;
    }

    // Validate Category change
    if (data.categoryId !== undefined || data.transactionType !== undefined) {
      const category = await financeRepository.getCategoryById(targetCategoryId, organizationId);
      if (!category || category.organizationId !== organizationId) {
        throw new Error('Danh mục thu chi đã chọn không thuộc Đơn vị hiện tại');
      }
      if (category.type !== targetType) {
        throw new Error(
          `Loại danh mục (${category.type === 'income' ? 'Thu' : 'Chi'}) không khớp với loại giao dịch (${targetType === 'income' ? 'Thu' : 'Chi'})`
        );
      }
      payload.category_id = targetCategoryId;
    }

    // Validate Activity change
    if (data.activityId !== undefined) {
      if (data.activityId) {
        const activity = await activityRepository.getById(data.activityId);
        if (!activity || activity.organizationId !== organizationId) {
          throw new Error('Hoạt động đã chọn không thuộc Đơn vị hiện tại');
        }
        payload.activity_id = data.activityId;
      } else {
        payload.activity_id = null;
      }
    }

    const updated = await financeRepository.updateTransaction(
      transactionId,
      payload,
      organizationId
    );
    const userId = await getAuthenticatedUserId(actorUserId);

    await auditLogRepository.log({
      organization_id: organizationId,
      user_id: userId,
      action: 'finance.update_transaction',
      entity_type: 'finance_transaction',
      entity_id: updated.id,
      metadata: {
        updatedFields: Object.keys(data),
      },
    });

    return updated;
  },

  /**
   * Approve transaction (Admin or Leader only, Self-approval blocked)
   */
  async approveTransaction(
    transactionId: string,
    organizationId: string,
    actorUserId: string,
    actorRole?: OrganizationRole | null
  ): Promise<FinanceTransactionListItem> {
    if (!transactionId || !organizationId || !actorUserId) {
      throw new Error('Thiếu thông tin phê duyệt giao dịch');
    }

    if (actorRole && !canApproveFinance(actorRole)) {
      throw new Error('Chỉ Quản trị viên hoặc Chi hội trưởng mới có quyền phê duyệt giao dịch tài chính');
    }

    const existing = await financeRepository.getTransactionById(transactionId, organizationId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Giao dịch không tồn tại trong Đơn vị');
    }

    if (existing.status === 'approved' || existing.status === 'posted') {
      throw new Error('Giao dịch này đã được phê duyệt / ghi sổ trước đó');
    }

    // Self-approval check: Creator cannot approve their own high-value transaction
    if (existing.recordedBy && existing.recordedBy === actorUserId) {
      throw new Error(
        'Quy định kiểm soát nội bộ: Người lập giao dịch không thể tự phê duyệt giao dịch của chính mình. Cần thành viên Ban lãnh đạo khác phê duyệt.'
      );
    }

    // Validate term lock
    if (existing.termId) {
      const term = await termRepository.getById(existing.termId);
      validateFinanceTermLock(term?.status, 'phê duyệt giao dịch');
    }

    // Validate period lock
    const closedPeriod = await financeRepository.checkDateInClosedPeriod(
      organizationId,
      existing.transactionDate
    );
    if (closedPeriod) {
      throw new Error(
        `Không thể phê duyệt: Giao dịch nằm trong kỳ tài chính đã chốt "${closedPeriod.periodName}".`
      );
    }

    const approved = await financeRepository.approveTransaction(
      transactionId,
      organizationId,
      actorUserId
    );

    // Send notification to the recorder
    if (existing.recordedBy && existing.recordedBy !== actorUserId) {
      await notificationRepository.createNotification({
        organization_id: organizationId,
        user_id: existing.recordedBy,
        title: 'Giao dịch tài chính đã được phê duyệt',
        message: `Giao dịch "${existing.description}" (${formatVND(existing.amount)}) đã được phê duyệt thành công.`,
        type: 'success',
        category: 'finance',
        link: '/finance?tab=transactions',
        entity_type: 'finance_transaction',
        entity_id: transactionId,
      });
    }

    await auditLogRepository.log({
      organization_id: organizationId,
      user_id: actorUserId,
      action: 'finance.transaction_approved',
      entity_type: 'finance_transaction',
      entity_id: transactionId,
      metadata: {
        amount: existing.amount,
        transaction_type: existing.transactionType,
        description: existing.description,
        recorded_by: existing.recordedBy,
      },
    });

    return approved;
  },

  /**
   * Reject transaction with mandatory rejection reason (Admin or Leader only)
   */
  async rejectTransaction(
    transactionId: string,
    organizationId: string,
    rejectionReason: string,
    actorUserId: string,
    actorRole?: OrganizationRole | null
  ): Promise<FinanceTransactionListItem> {
    if (!transactionId || !organizationId || !actorUserId) {
      throw new Error('Thiếu thông tin từ chối giao dịch');
    }

    const trimmedReason = rejectionReason?.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      throw new Error('Vui lòng nhập lý do từ chối cụ thể (tối thiểu 3 ký tự)');
    }

    if (actorRole && !canApproveFinance(actorRole)) {
      throw new Error('Chỉ Quản trị viên hoặc Chi hội trưởng mới có quyền từ chối giao dịch tài chính');
    }

    const existing = await financeRepository.getTransactionById(transactionId, organizationId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Giao dịch không tồn tại trong Đơn vị');
    }

    const rejected = await financeRepository.rejectTransaction(
      transactionId,
      organizationId,
      actorUserId,
      trimmedReason
    );

    // Send notification to the recorder
    if (existing.recordedBy) {
      await notificationRepository.createNotification({
        organization_id: organizationId,
        user_id: existing.recordedBy,
        title: 'Giao dịch tài chính bị từ chối',
        message: `Giao dịch "${existing.description}" (${formatVND(existing.amount)}) đã bị từ chối. Lý do: ${trimmedReason}`,
        type: 'danger',
        category: 'finance',
        link: '/finance?tab=transactions&status=rejected',
        entity_type: 'finance_transaction',
        entity_id: transactionId,
      });
    }

    await auditLogRepository.log({
      organization_id: organizationId,
      user_id: actorUserId,
      action: 'finance.transaction_rejected',
      entity_type: 'finance_transaction',
      entity_id: transactionId,
      metadata: {
        amount: existing.amount,
        description: existing.description,
        rejection_reason: trimmedReason,
        recorded_by: existing.recordedBy,
      },
    });

    return rejected;
  },

  /**
   * Delete / Void a transaction with audit logging and period lock check
   */
  async deleteTransaction(
    transactionId: string,
    organizationId: string,
    activityId?: string | null,
    actorUserId?: string | null
  ): Promise<void> {
    if (!transactionId || !organizationId) {
      throw new Error('Thiếu mã giao dịch hoặc thông tin Chi hội');
    }

    const existing = await financeRepository.getTransactionById(transactionId, organizationId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Giao dịch không tồn tại hoặc bạn không có quyền xóa');
    }

    // Periodic closing lock check
    const closedPeriod = await financeRepository.checkDateInClosedPeriod(
      organizationId,
      existing.transactionDate
    );
    if (closedPeriod) {
      throw new Error(
        `Không thể xóa giao dịch: Giao dịch nằm trong kỳ tài chính đã chốt "${closedPeriod.periodName}". Vui lòng mở lại kỳ tài chính để thao tác.`
      );
    }

    // Term lock check
    if (existing.termId) {
      const existingTerm = await termRepository.getById(existing.termId);
      validateFinanceTermLock(existingTerm?.status, 'xóa giao dịch trong nhiệm kỳ đã khóa');
    }

    await financeRepository.deleteTransaction(transactionId, organizationId);
    const userId = await getAuthenticatedUserId(actorUserId);

    await auditLogRepository.log({
      organization_id: organizationId,
      user_id: userId,
      action: 'finance.delete_transaction',
      entity_type: 'finance_transaction',
      entity_id: transactionId,
      metadata: {
        amount: existing.amount,
        transaction_type: existing.transactionType,
        description: existing.description,
        activity_id: activityId || existing.activityId,
      },
    });
  },

  // ==================== PERIOD CLOSING & RECONCILIATION ====================

  /**
   * Get all period closings for organization
   */
  async listPeriodClosings(
    organizationId: string,
    termId?: string
  ): Promise<FinancePeriodClosingItem[]> {
    if (!organizationId) return [];
    return financeRepository.getPeriodClosings(organizationId, termId);
  },

  /**
   * Get single period closing
   */
  async getPeriodClosingById(
    id: string,
    organizationId: string
  ): Promise<FinancePeriodClosingItem | null> {
    if (!id || !organizationId) return null;
    return financeRepository.getPeriodClosingById(id, organizationId);
  },

  /**
   * Calculate reconciliation figures for a proposed closing window
   */
  async calculatePeriodReconciliation(
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

    return financeRepository.calculatePeriodReconciliationStats(
      organizationId,
      termId,
      periodStart,
      periodEnd
    );
  },

  /**
   * Close a financial period with reconciliation validation and immutable lock
   */
  async closePeriod(
    organizationId: string,
    input: CreatePeriodClosingInput,
    actorUserId: string,
    actorUserName: string,
    actorRole?: OrganizationRole | null
  ): Promise<FinancePeriodClosingItem> {
    if (!organizationId || !actorUserId) {
      throw new Error('Thiếu thông tin người chốt kỳ');
    }

    if (actorRole && !canCloseFinancePeriod(actorRole)) {
      throw new Error('Chỉ Quản trị viên hoặc Chi hội trưởng mới có quyền chốt kỳ tài chính');
    }

    const {
      termId,
      periodType,
      periodName,
      periodStart,
      periodEnd,
      actualBalance,
      reconciliationNotes,
      overrideReason,
    } = input;

    if (!termId || !periodName?.trim() || !periodStart || !periodEnd) {
      throw new Error('Vui lòng điền đầy đủ thông tin kỳ tài chính (tên kỳ, ngày bắt đầu, ngày kết thúc)');
    }

    if (periodStart > periodEnd) {
      throw new Error('Ngày bắt đầu kỳ không được lớn hơn ngày kết thúc');
    }

    // Validate Term is not archived
    const term = await termRepository.getById(termId);
    if (!term || term.organizationId !== organizationId) {
      throw new Error('Nhiệm kỳ không tồn tại hoặc không hợp lệ');
    }

    // Calculate exact mathematical balance
    const stats = await financeRepository.calculatePeriodReconciliationStats(
      organizationId,
      termId,
      periodStart,
      periodEnd
    );

    const calcClosingBalance = stats.closingBalance;
    const discrepancy = actualBalance - calcClosingBalance;
    const isMatched = Math.abs(discrepancy) < 0.01;

    let recStatus: 'balanced' | 'mismatch' | 'override' = 'balanced';
    if (!isMatched) {
      if (overrideReason?.trim()) {
        recStatus = 'override';
      } else {
        recStatus = 'mismatch';
        throw new Error(
          `Số dư thực tế (${formatVND(actualBalance)}) lệch ${formatVND(Math.abs(discrepancy))} so với sổ sách (${formatVND(calcClosingBalance)}). Vui lòng nhập lý do giải trình chênh lệch để tiếp tục chốt sổ.`
        );
      }
    }

    const payload: DbPeriodClosingInsert = {
      organization_id: organizationId,
      term_id: termId,
      period_type: periodType,
      period_name: periodName.trim(),
      period_start: periodStart,
      period_end: periodEnd,
      status: 'closed',
      opening_balance: stats.openingBalance,
      total_income: stats.totalIncome,
      total_expense: stats.totalExpense,
      closing_balance: calcClosingBalance,
      actual_balance: actualBalance,
      reconciliation_status: recStatus,
      reconciliation_discrepancy: discrepancy,
      reconciliation_notes: reconciliationNotes?.trim() || (overrideReason?.trim() ?? null),
      closed_at: new Date().toISOString(),
      closed_by: actorUserId,
      closed_by_name: actorUserName || 'Ban Lãnh Đạo',
      snapshot_data: {
        transactionCount: stats.transactionCount,
        stats,
        closedAt: new Date().toISOString(),
      } as any,
    };

    const createdPeriod = await financeRepository.createPeriodClosing(payload);

    // Send notification to organization members
    await notificationRepository.createNotification({
      organization_id: organizationId,
      title: 'Đã chốt sổ kỳ tài chính',
      message: `Kỳ tài chính "${periodName}" (${periodStart} đến ${periodEnd}) đã được chốt sổ bởi ${actorUserName}. Số dư: ${formatVND(calcClosingBalance)}.`,
      type: 'info',
      category: 'finance',
      link: '/finance?tab=period_closings',
      entity_type: 'finance_period_closing',
      entity_id: createdPeriod.id,
    });

    await auditLogRepository.log({
      organization_id: organizationId,
      user_id: actorUserId,
      action: 'finance.period_closed',
      entity_type: 'finance_period_closing',
      entity_id: createdPeriod.id,
      metadata: {
        period_name: periodName,
        period_start: periodStart,
        period_end: periodEnd,
        closing_balance: calcClosingBalance,
        actual_balance: actualBalance,
        reconciliation_status: recStatus,
        discrepancy,
      },
    });

    if (recStatus === 'override') {
      await auditLogRepository.log({
        organization_id: organizationId,
        user_id: actorUserId,
        action: 'finance.reconciliation_override',
        entity_type: 'finance_period_closing',
        entity_id: createdPeriod.id,
        metadata: {
          override_reason: overrideReason,
          discrepancy,
        },
      });
    }

    return createdPeriod;
  },

  /**
   * Reopen a closed period (Admin / Leader only, Requires reason & creates audit log)
   */
  async reopenPeriod(
    input: ReopenPeriodInput,
    actorUserId: string,
    actorUserName: string,
    actorRole?: OrganizationRole | null
  ): Promise<FinancePeriodClosingItem> {
    const { periodId, organizationId, reopenReason } = input;

    if (!periodId || !organizationId || !actorUserId) {
      throw new Error('Thiếu thông tin mở lại kỳ tài chính');
    }

    const trimmedReason = reopenReason?.trim();
    if (!trimmedReason || trimmedReason.length < 5) {
      throw new Error('Vui lòng nhập lý do mở lại kỳ tài chính rõ ràng (tối thiểu 5 ký tự)');
    }

    if (actorRole && !canCloseFinancePeriod(actorRole)) {
      throw new Error('Chỉ Quản trị viên hoặc Chi hội trưởng mới có quyền mở lại kỳ tài chính đã chốt');
    }

    const period = await financeRepository.getPeriodClosingById(periodId, organizationId);
    if (!period || period.organizationId !== organizationId) {
      throw new Error('Kỳ tài chính không tồn tại');
    }

    if (period.status === 'reopened') {
      throw new Error('Kỳ tài chính này hiện đang ở trạng thái đã mở lại');
    }

    const reopened = await financeRepository.reopenPeriodClosing(
      periodId,
      organizationId,
      actorUserId,
      actorUserName || 'Ban Lãnh Đạo',
      trimmedReason
    );

    // Notify organization
    await notificationRepository.createNotification({
      organization_id: organizationId,
      title: 'Mở lại kỳ tài chính đã chốt',
      message: `Kỳ tài chính "${period.periodName}" đã được mở lại bởi ${actorUserName}. Lý do: ${trimmedReason}`,
      type: 'warning',
      category: 'finance',
      link: '/finance?tab=period_closings',
      entity_type: 'finance_period_closing',
      entity_id: periodId,
    });

    await auditLogRepository.log({
      organization_id: organizationId,
      user_id: actorUserId,
      action: 'finance.period_reopened',
      entity_type: 'finance_period_closing',
      entity_id: periodId,
      metadata: {
        period_name: period.periodName,
        reopen_reason: trimmedReason,
      },
    });

    return reopened;
  },

  // ==================== SUMMARY & STATS ====================

  /**
   * Get dynamic financial summary stats
   */
  async getFinanceSummary(
    organizationId: string,
    filters: Partial<FinanceFilterParams> = {}
  ): Promise<FinanceSummaryStats> {
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
    return financeRepository.getSummary(organizationId, filters);
  },

  /**
   * Get transactions and balance for a specific activity
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
    if (!organizationId || !activityId) {
      return { transactions: [], totalIncome: 0, totalExpense: 0, balance: 0 };
    }
    return financeRepository.getActivityFinance(organizationId, activityId);
  },

  /**
   * Get terms for finance selector
   */
  async getFinanceTerms(organizationId: string): Promise<FinanceTermOption[]> {
    if (!organizationId) return [];
    return financeRepository.getTerms(organizationId);
  },

  /**
   * Get activities for finance selector
   */
  async getFinanceActivities(
    organizationId: string,
    termId?: string
  ): Promise<FinanceActivityOption[]> {
    if (!organizationId) return [];
    return financeRepository.getActivities(organizationId, termId);
  },
};
