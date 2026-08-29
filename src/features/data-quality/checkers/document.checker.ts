import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { DataQualityChecker, DataQualityIssue } from '../types';

interface RawDocRecord {
  id: string;
  title: string;
  category: string;
  access_level: string;
  source_type: string;
  term_id: string | null;
  activity_id: string | null;
  task_id: string | null;
  member_id: string | null;
  created_at: string;
}

export const documentQualityChecker: DataQualityChecker = {
  category: 'documents',
  name: 'Document Quality Checker',
  description: 'Kiểm tra tính toàn vẹn của siêu dữ liệu văn bản, hồ sơ lưu trữ và liên kết thực thể.',

  async check(organizationId: string): Promise<DataQualityIssue[]> {
    if (!isSupabaseConfigured || !organizationId) {
      return [];
    }

    const issues: DataQualityIssue[] = [];
    const nowIso = new Date().toISOString();

    // 1. Fetch all documents for this organization (single query)
    const { data: docsData, error: docsError } = await supabase
      .from('documents')
      .select('id, title, category, access_level, source_type, term_id, activity_id, task_id, member_id, created_at')
      .eq('organization_id', organizationId);

    if (docsError || !docsData) {
      console.error('[DocumentQualityChecker] Fetch documents error:', docsError);
      return [];
    }

    const docsRaw = docsData as unknown as RawDocRecord[];
    if (docsRaw.length === 0) {
      return [];
    }

    // 2. Fetch valid entity IDs for this organization in batch
    const termIdsWithDocs = Array.from(new Set(docsRaw.map((d) => d.term_id).filter(Boolean))) as string[];
    const activityIdsWithDocs = Array.from(new Set(docsRaw.map((d) => d.activity_id).filter(Boolean))) as string[];
    const taskIdsWithDocs = Array.from(new Set(docsRaw.map((d) => d.task_id).filter(Boolean))) as string[];

    const validTermIds = new Set<string>();
    const validActivityIds = new Set<string>();
    const validTaskIds = new Set<string>();

    if (termIdsWithDocs.length > 0) {
      const { data: terms } = await supabase
        .from('terms')
        .select('id')
        .eq('organization_id', organizationId)
        .in('id', termIdsWithDocs);
      if (terms) {
        (terms as Array<{ id: string }>).forEach((t) => validTermIds.add(t.id));
      }
    }

    if (activityIdsWithDocs.length > 0) {
      const { data: activities } = await supabase
        .from('activities')
        .select('id')
        .eq('organization_id', organizationId)
        .in('id', activityIdsWithDocs);
      if (activities) {
        (activities as Array<{ id: string }>).forEach((a) => validActivityIds.add(a.id));
      }
    }

    if (taskIdsWithDocs.length > 0) {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('organization_id', organizationId)
        .in('id', taskIdsWithDocs);
      if (tasks) {
        (tasks as Array<{ id: string }>).forEach((t) => validTaskIds.add(t.id));
      }
    }

    // Evaluate each document
    for (const doc of docsRaw) {
      // Check 1: Missing metadata (title, category)
      const trimmedTitle = doc.title?.trim();
      if (!trimmedTitle || !doc.category) {
        issues.push({
          id: `dq_documents_DOCUMENT_MISSING_METADATA_${doc.id}`,
          organizationId,
          category: 'documents',
          severity: 'info',
          code: 'DOCUMENT_MISSING_METADATA',
          title: 'Tài liệu thiếu thông tin phân loại',
          description: `Văn bản/Tài liệu ID "${doc.id}" chưa có tiêu đề đầy đủ hoặc thiếu danh mục phân loại.`,
          entityType: 'document',
          entityId: doc.id,
          entityName: doc.title || 'Tài liệu không tên',
          detectedAt: nowIso,
          actionLabel: 'Bổ sung thông tin',
          actionRoute: `/documents`,
          metadata: { documentId: doc.id },
        });
      }

      // Check 2: Broken entity reference
      let brokenRefReason = '';
      if (doc.term_id && !validTermIds.has(doc.term_id)) {
        brokenRefReason = 'Nhiệm kỳ liên kết không tồn tại';
      } else if (doc.activity_id && !validActivityIds.has(doc.activity_id)) {
        brokenRefReason = 'Hoạt động liên kết không tồn tại';
      } else if (doc.task_id && !validTaskIds.has(doc.task_id)) {
        brokenRefReason = 'Công việc liên kết không tồn tại';
      }

      if (brokenRefReason) {
        issues.push({
          id: `dq_documents_DOCUMENT_BROKEN_REFERENCE_${doc.id}`,
          organizationId,
          category: 'documents',
          severity: 'warning',
          code: 'DOCUMENT_BROKEN_REFERENCE',
          title: 'Liên kết thực thể của tài liệu không tồn tại',
          description: `Tài liệu "${doc.title}" liên kết đến đối tượng đã bị xóa hoặc không hợp lệ (${brokenRefReason}).`,
          entityType: 'document',
          entityId: doc.id,
          entityName: doc.title,
          detectedAt: nowIso,
          actionLabel: 'Cập nhật liên kết',
          actionRoute: `/documents`,
          metadata: { documentId: doc.id, brokenRefReason },
        });
      }
    }

    return issues;
  },
};
