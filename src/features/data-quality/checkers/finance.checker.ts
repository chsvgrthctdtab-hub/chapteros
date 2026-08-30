import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { DataQualityChecker, DataQualityIssue } from '../types';

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

interface RawTxRecord {
  id: string;
  organization_id: string;
  term_id: string;
  transaction_type: string;
  amount: number;
  description: string;
  transaction_date: string;
  status: string;
  receipt_url: string | null;
  period_closing_id: string | null;
  created_at: string;
}

interface RawClosingRecord {
  id: string;
  organization_id: string;
  term_id: string;
  period_name: string;
  period_start: string;
  period_end: string;
  status: string;
  closing_balance: number;
  actual_balance: number;
  reconciliation_status: string;
  reconciliation_discrepancy: number;
  reopen_reason: string | null;
  closed_at: string | null;
}

interface RawTermLookup {
  id: string;
  name: string;
  status: string;
  closed_at: string | null;
}

export const financeQualityChecker: DataQualityChecker = {
  category: 'finance',
  name: 'Finance Quality Checker',
  description: 'Kiểm tra tính cân bằng quỹ, phiếu chờ phê duyệt, chứng từ thu chi, đối soát và tính toàn vẹn của kỳ chốt sổ.',

  async check(organizationId: string): Promise<DataQualityIssue[]> {
    if (!isSupabaseConfigured || !organizationId) {
      return [];
    }

    const issues: DataQualityIssue[] = [];
    const nowIso = new Date().toISOString();

    // 1. Fetch all finance transactions for this organization (single query)
    const { data: txsData, error: txsError } = await supabase
      .from('finance_transactions')
      .select('id, organization_id, term_id, transaction_type, amount, description, transaction_date, status, receipt_url, period_closing_id, created_at')
      .eq('organization_id', organizationId);

    if (txsError || !txsData) {
      console.error('[FinanceQualityChecker] Fetch transactions error:', txsError);
      return [];
    }

    const txsRaw = txsData as unknown as RawTxRecord[];

    // 2. Fetch all period closings for this organization
    const { data: closingsData, error: closingsError } = await supabase
      .from('finance_period_closings')
      .select('id, organization_id, term_id, period_name, period_start, period_end, status, closing_balance, actual_balance, reconciliation_status, reconciliation_discrepancy, reopen_reason, closed_at')
      .eq('organization_id', organizationId);

    if (closingsError) {
      console.error('[FinanceQualityChecker] Fetch closings error:', closingsError);
    }

    const closings = (closingsData || []) as unknown as RawClosingRecord[];

    // 3. Fetch terms for this organization
    const { data: termsData } = await supabase
      .from('terms')
      .select('id, name, status, closed_at')
      .eq('organization_id', organizationId);

    const termsMap = new Map<string, RawTermLookup>();
    if (termsData) {
      const termsList = termsData as unknown as RawTermLookup[];
      for (const t of termsList) {
        termsMap.set(t.id, t);
      }
    }

    // Evaluate Cumulative Balance (approved + posted)
    let totalIncome = 0;
    let totalExpense = 0;
    let pendingApprovalCount = 0;
    let rejectedCount = 0;

    for (const tx of txsRaw) {
      const isCountable = tx.status === 'posted' || tx.status === 'approved';
      if (isCountable) {
        if (tx.transaction_type === 'income') {
          totalIncome += Number(tx.amount || 0);
        } else if (tx.transaction_type === 'expense') {
          totalExpense += Number(tx.amount || 0);
        }
      }

      if (tx.status === 'pending_approval') {
        pendingApprovalCount++;
      } else if (tx.status === 'rejected') {
        rejectedCount++;
      }

      // Check: Missing evidence for significant expenses (>= 200.000 VND)
      if (
        tx.transaction_type === 'expense' &&
        Number(tx.amount || 0) >= 200000 &&
        !tx.receipt_url &&
        tx.status !== 'rejected' &&
        tx.status !== 'draft'
      ) {
        issues.push({
          id: `dq_finance_FINANCE_MISSING_EVIDENCE_${tx.id}`,
          organizationId,
          category: 'finance',
          severity: 'warning',
          code: 'FINANCE_MISSING_EVIDENCE',
          title: 'Phiếu chi chưa đính kèm hóa đơn / chứng từ',
          description: `Phiếu chi "${tx.description}" (${formatVND(Number(tx.amount))}) chưa có ảnh hóa đơn hoặc chứng từ đính kèm.`,
          entityType: 'finance',
          entityId: tx.id,
          entityName: tx.description,
          detectedAt: nowIso,
          actionLabel: 'Bổ sung chứng từ',
          actionRoute: `/finance`,
          metadata: { transactionId: tx.id, amount: tx.amount, date: tx.transaction_date },
        });
      }

      // Check: Closed term transaction mutation
      const linkedTerm = termsMap.get(tx.term_id);
      if (linkedTerm && (linkedTerm.status === 'completed' || linkedTerm.status === 'archived')) {
        if (linkedTerm.closed_at && tx.created_at > linkedTerm.closed_at) {
          issues.push({
            id: `dq_finance_FINANCE_CLOSED_TERM_TRANSACTION_${tx.id}`,
            organizationId,
            category: 'finance',
            severity: 'critical',
            code: 'FINANCE_CLOSED_TERM_TRANSACTION',
            title: 'Giao dịch phát sinh trong nhiệm kỳ đã đóng sổ',
            description: `Giao dịch "${tx.description}" (${formatVND(Number(tx.amount))}) được tạo sau khi nhiệm kỳ "${linkedTerm.name}" đã hoàn tất khóa sổ.`,
            entityType: 'finance',
            entityId: tx.id,
            entityName: tx.description,
            detectedAt: nowIso,
            actionLabel: 'Kiểm tra giao dịch',
            actionRoute: `/finance`,
            metadata: { transactionId: tx.id, termName: linkedTerm.name },
          });
        }
      }
    }

    const netBalance = totalIncome - totalExpense;

    // Check 1: Negative balance
    if (netBalance < 0) {
      issues.push({
        id: `dq_finance_FINANCE_NEGATIVE_BALANCE_${organizationId}`,
        organizationId,
        category: 'finance',
        severity: 'critical',
        code: 'FINANCE_NEGATIVE_BALANCE',
        title: 'Quỹ Đơn vị đang bị âm số dư',
        description: `Tổng số dư khả dụng hiện tại của Đơn vị đang âm: ${formatVND(netBalance)} (Tổng thu: ${formatVND(totalIncome)}, Tổng chi: ${formatVND(totalExpense)}).`,
        entityType: 'finance',
        entityId: null,
        entityName: 'Sổ quỹ Đơn vị',
        detectedAt: nowIso,
        actionLabel: 'Xem sổ quỹ',
        actionRoute: `/finance`,
        metadata: { netBalance, totalIncome, totalExpense },
      });
    }

    // Check 2: Pending approvals (Aggregate issue)
    if (pendingApprovalCount > 0) {
      issues.push({
        id: `dq_finance_FINANCE_PENDING_APPROVAL_${organizationId}`,
        organizationId,
        category: 'finance',
        severity: 'warning',
        code: 'FINANCE_PENDING_APPROVAL',
        title: `Có ${pendingApprovalCount} phiếu thu chi đang chờ phê duyệt`,
        description: `Chi hội có ${pendingApprovalCount} giao dịch tài chính vượt hạn mức hoặc đang chờ Ban chủ nhiệm duyệt.`,
        entityType: 'finance',
        entityId: null,
        entityName: 'Giao dịch chờ duyệt',
        detectedAt: nowIso,
        actionLabel: 'Duyệt thu chi',
        actionRoute: `/finance`,
        metadata: { pendingApprovalCount },
      });
    }

    // Check 3: Rejected transactions awaiting cleanup
    if (rejectedCount > 0) {
      issues.push({
        id: `dq_finance_FINANCE_REJECTED_TRANSACTION_${organizationId}`,
        organizationId,
        category: 'finance',
        severity: 'info',
        code: 'FINANCE_REJECTED_TRANSACTION',
        title: `Có ${rejectedCount} phiếu thu chi bị từ chối`,
        description: `Chi hội có ${rejectedCount} phiếu thu chi bị từ chối phê duyệt cần được thủ quỹ điều chỉnh hoặc xóa bỏ.`,
        entityType: 'finance',
        entityId: null,
        entityName: 'Phiếu thu chi từ chối',
        detectedAt: nowIso,
        actionLabel: 'Xem chi tiết',
        actionRoute: `/finance`,
        metadata: { rejectedCount },
      });
    }

    // Check 4: Period Closings Reconciliation Checks
    for (const closing of closings) {
      // Mismatch reconciliation
      if (
        closing.status === 'closed' &&
        closing.reconciliation_status === 'mismatch' &&
        Math.abs(Number(closing.reconciliation_discrepancy || 0)) > 0
      ) {
        issues.push({
          id: `dq_finance_FINANCE_RECONCILIATION_MISMATCH_${closing.id}`,
          organizationId,
          category: 'finance',
          severity: 'critical',
          code: 'FINANCE_RECONCILIATION_MISMATCH',
          title: `Chênh lệch số dư chưa giải trình: ${closing.period_name}`,
          description: `Kỳ chốt sổ "${closing.period_name}" có chênh lệch đối soát thực tế và sổ sách là ${formatVND(Number(closing.reconciliation_discrepancy))} nhưng chưa có giải trình hợp lệ.`,
          entityType: 'finance',
          entityId: closing.id,
          entityName: closing.period_name,
          detectedAt: nowIso,
          actionLabel: 'Xem biên bản đối soát',
          actionRoute: `/finance`,
          metadata: { closingId: closing.id, discrepancy: closing.reconciliation_discrepancy },
        });
      }

      // Check: Closed period mutations (transactions within closed period date range that were created after closing)
      if (closing.status === 'closed' && closing.closed_at) {
        const mutationsInClosedPeriod = txsRaw.filter((tx) => {
          if (!tx.transaction_date) return false;
          const isInDateRange = tx.transaction_date >= closing.period_start && tx.transaction_date <= closing.period_end;
          const isCreatedAfterClosed = tx.created_at > closing.closed_at!;
          const isMissingClosingId = !tx.period_closing_id;
          return isInDateRange && (isCreatedAfterClosed || isMissingClosingId);
        });

        if (mutationsInClosedPeriod.length > 0) {
          issues.push({
            id: `dq_finance_FINANCE_CLOSED_PERIOD_MUTATION_${closing.id}`,
            organizationId,
            category: 'finance',
            severity: 'critical',
            code: 'FINANCE_CLOSED_PERIOD_MUTATION',
            title: `Phát hiện ${mutationsInClosedPeriod.length} giao dịch lọt vào kỳ đã chốt sổ`,
            description: `Có ${mutationsInClosedPeriod.length} giao dịch thuộc khoảng thời gian của kỳ chốt sổ "${closing.period_name}" (${closing.period_start} đến ${closing.period_end}) nhưng không nằm trong biên bản khóa sổ hoặc phát sinh sau ngày đóng.`,
            entityType: 'finance',
            entityId: closing.id,
            entityName: closing.period_name,
            detectedAt: nowIso,
            actionLabel: 'Xem kỳ chốt sổ',
            actionRoute: `/finance`,
            metadata: { closingId: closing.id, mutationCount: mutationsInClosedPeriod.length },
          });
        }
      }
    }

    return issues;
  },
};
