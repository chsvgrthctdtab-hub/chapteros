import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { DataQualityChecker, DataQualityIssue } from '../types';

interface RawTerm {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  is_current: boolean;
  organization_id: string;
}

interface RawTaskItem {
  id: string;
  term_id: string;
  status: string;
  title: string;
}

interface RawFinanceTx {
  id: string;
  term_id: string;
  status: string;
  amount: number;
  transaction_type: string;
}

export const termQualityChecker: DataQualityChecker = {
  category: 'terms',
  name: 'Term Quality Checker',
  description: 'Kiểm tra tính nhất quán của nhiệm kỳ, thiết lập nhiệm kỳ hiện tại và tiến độ đóng/bàn giao nhiệm kỳ.',

  async check(organizationId: string): Promise<DataQualityIssue[]> {
    if (!isSupabaseConfigured || !organizationId) {
      return [];
    }

    const issues: DataQualityIssue[] = [];
    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];

    // 1. Fetch all terms for this organization (single query)
    const { data: termsData, error: termsError } = await supabase
      .from('terms')
      .select('id, name, start_date, end_date, status, is_current, organization_id')
      .eq('organization_id', organizationId);

    if (termsError || !termsData) {
      console.error('[TermQualityChecker] Fetch terms error:', termsError);
      return [];
    }

    const termsRaw = termsData as unknown as RawTerm[];
    const currentTerms = termsRaw.filter((t) => t.is_current);

    // Check 1: No current term
    if (termsRaw.length > 0 && currentTerms.length === 0) {
      issues.push({
        id: `dq_terms_TERM_NO_CURRENT_TERM_${organizationId}`,
        organizationId,
        category: 'terms',
        severity: 'critical',
        code: 'TERM_NO_CURRENT_TERM',
        title: 'Chi hội chưa thiết lập Nhiệm kỳ hiện tại',
        description: 'Chưa có nhiệm kỳ nào được đánh dấu là "Nhiệm kỳ hiện tại" (is_current = true). Điều này gây cản trở phân công hội viên và ghi nhận hoạt động.',
        entityType: 'term',
        entityId: null,
        entityName: 'Tất cả nhiệm kỳ',
        detectedAt: now,
        actionLabel: 'Thiết lập nhiệm kỳ',
        actionRoute: `/terms`,
        metadata: { totalTerms: termsRaw.length },
      });
    }

    // Check 2: Multiple current terms
    if (currentTerms.length > 1) {
      issues.push({
        id: `dq_terms_TERM_MULTIPLE_CURRENT_${organizationId}`,
        organizationId,
        category: 'terms',
        severity: 'critical',
        code: 'TERM_MULTIPLE_CURRENT',
        title: 'Có nhiều hơn 1 Nhiệm kỳ hiện tại',
        description: `Chi hội đang có ${currentTerms.length} nhiệm kỳ cùng được bật trạng thái "Nhiệm kỳ hiện tại": ${currentTerms.map((t) => t.name).join(', ')}.`,
        entityType: 'term',
        entityId: currentTerms[0]?.id || null,
        entityName: currentTerms.map((t) => t.name).join(', '),
        detectedAt: now,
        actionLabel: 'Chuẩn hóa nhiệm kỳ',
        actionRoute: `/terms`,
        metadata: { currentTermIds: currentTerms.map((t) => t.id) },
      });
    }

    // Check 3: Term ended but not closed
    for (const term of termsRaw) {
      const isPastEndDate = term.end_date && term.end_date < todayStr;
      const isNotClosed = term.status !== 'completed' && term.status !== 'archived';

      if (isPastEndDate && isNotClosed) {
        issues.push({
          id: `dq_terms_TERM_ENDED_NOT_CLOSED_${term.id}`,
          organizationId,
          category: 'terms',
          severity: 'warning',
          code: 'TERM_ENDED_NOT_CLOSED',
          title: 'Nhiệm kỳ đã hết thời gian nhưng chưa đóng sổ',
          description: `Nhiệm kỳ "${term.name}" đã qua ngày kết thúc (${term.end_date}) nhưng vẫn ở trạng thái "${term.status}". Cần thực hiện quy trình đóng và bàn giao nhiệm kỳ.`,
          entityType: 'term',
          entityId: term.id,
          entityName: term.name,
          detectedAt: now,
          actionLabel: 'Đóng nhiệm kỳ',
          actionRoute: `/terms`,
          metadata: { termId: term.id, endDate: term.end_date, status: term.status },
        });
      }
    }

    // 2. Check open tasks in active/closing terms (single query for the org)
    if (termsRaw.length > 0) {
      const { data: openTasksData } = await supabase
        .from('tasks')
        .select('id, term_id, status, title')
        .eq('organization_id', organizationId)
        .not('status', 'in', '("completed","cancelled")');

      const openTasksRaw = (openTasksData || []) as unknown as RawTaskItem[];

      if (openTasksRaw.length > 0) {
        const tasksByTerm = new Map<string, number>();
        for (const task of openTasksRaw) {
          tasksByTerm.set(task.term_id, (tasksByTerm.get(task.term_id) || 0) + 1);
        }

        for (const term of termsRaw) {
          const count = tasksByTerm.get(term.id) || 0;
          if (count > 0 && (term.is_current || (term.end_date && term.end_date < todayStr))) {
            issues.push({
              id: `dq_terms_TERM_WITH_OPEN_TASKS_${term.id}`,
              organizationId,
              category: 'terms',
              severity: 'warning',
              code: 'TERM_WITH_OPEN_TASKS',
              title: `Nhiệm kỳ còn ${count} công việc chưa hoàn thành`,
              description: `Nhiệm kỳ "${term.name}" đang còn ${count} công việc tồn đọng chưa được nghiệm thu hoặc hủy.`,
              entityType: 'term',
              entityId: term.id,
              entityName: term.name,
              detectedAt: now,
              actionLabel: 'Xem công việc',
              actionRoute: `/tasks`,
              metadata: { termId: term.id, openTaskCount: count },
            });
          }
        }
      }

      // 3. Check unresolved finance transactions per term (single query for the org)
      const { data: pendingFinanceData } = await supabase
        .from('finance_transactions')
        .select('id, term_id, status, amount, transaction_type')
        .eq('organization_id', organizationId)
        .eq('status', 'pending_approval');

      const pendingFinanceRaw = (pendingFinanceData || []) as unknown as RawFinanceTx[];

      if (pendingFinanceRaw.length > 0) {
        const pendingByTerm = new Map<string, number>();
        for (const tx of pendingFinanceRaw) {
          pendingByTerm.set(tx.term_id, (pendingByTerm.get(tx.term_id) || 0) + 1);
        }

        for (const term of termsRaw) {
          const count = pendingByTerm.get(term.id) || 0;
          if (count > 0) {
            issues.push({
              id: `dq_terms_TERM_WITH_UNRESOLVED_FINANCE_${term.id}`,
              organizationId,
              category: 'terms',
              severity: 'critical',
              code: 'TERM_WITH_UNRESOLVED_FINANCE',
              title: `Nhiệm kỳ còn ${count} phiếu thu chi chưa duyệt`,
              description: `Nhiệm kỳ "${term.name}" có ${count} giao dịch tài chính ở trạng thái chờ phê duyệt.`,
              entityType: 'term',
              entityId: term.id,
              entityName: term.name,
              detectedAt: now,
              actionLabel: 'Duyệt thu chi',
              actionRoute: `/finance`,
              metadata: { termId: term.id, pendingCount: count },
            });
          }
        }
      }
    }

    return issues;
  },
};
