import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { DataQualityChecker, DataQualityIssue } from '../types';

interface RawMember {
  id: string;
  organization_id: string;
  student_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
}

interface RawCurrentTerm {
  id: string;
  name: string;
  is_current: boolean;
}

export const memberQualityChecker: DataQualityChecker = {
  category: 'members',
  name: 'Member Quality Checker',
  description: 'Kiểm tra tính toàn vẹn, trùng lặp và tính liên kết nhiệm kỳ của hồ sơ hội viên.',

  async check(organizationId: string): Promise<DataQualityIssue[]> {
    if (!isSupabaseConfigured || !organizationId) {
      return [];
    }

    const issues: DataQualityIssue[] = [];
    const now = new Date().toISOString();

    // 1. Fetch all members in this organization (single query, no N+1)
    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .select('id, organization_id, student_id, full_name, email, phone, status, created_at')
      .eq('organization_id', organizationId);

    if (membersError || !membersData) {
      console.error('[MemberQualityChecker] Fetch members error:', membersError);
      return [];
    }

    const membersRaw = membersData as unknown as RawMember[];

    // 2. Fetch current active term of the organization
    const { data: currentTermData } = await supabase
      .from('terms')
      .select('id, name, is_current')
      .eq('organization_id', organizationId)
      .eq('is_current', true)
      .maybeSingle();

    const currentTermRaw = (currentTermData || null) as unknown as RawCurrentTerm | null;
    const currentTermId = currentTermRaw?.id;

    // 3. Fetch term_members assignments for this organization's terms
    const { data: termMembersData } = await supabase
      .from('term_members')
      .select(`
        member_id,
        term_id,
        status,
        term:terms!inner (
          organization_id
        )
      `)
      .eq('term.organization_id', organizationId);

    const termMembersList = (termMembersData || []) as unknown as Array<{
      member_id: string;
      term_id: string;
      status: string;
    }>;

    // Group term assignments by member_id
    const memberTermSet = new Set<string>();
    const memberCurrentTermSet = new Set<string>();

    for (const tm of termMembersList) {
      memberTermSet.add(tm.member_id);
      if (currentTermId && tm.term_id === currentTermId) {
        memberCurrentTermSet.add(tm.member_id);
      }
    }

    // Track for duplicate detection
    const studentIdMap = new Map<string, Array<{ id: string; name: string }>>();
    const emailMap = new Map<string, Array<{ id: string; name: string }>>();

    for (const m of membersRaw) {
      const trimmedStudentId = m.student_id?.trim().toLowerCase();
      const trimmedEmail = m.email?.trim().toLowerCase();
      const trimmedPhone = m.phone?.trim();

      // Check 1: Missing Student ID
      if (!trimmedStudentId) {
        issues.push({
          id: `dq_members_MEMBER_MISSING_STUDENT_ID_${m.id}`,
          organizationId,
          category: 'members',
          severity: 'critical',
          code: 'MEMBER_MISSING_STUDENT_ID',
          title: 'Hội viên thiếu MSSV',
          description: `Hội viên "${m.full_name}" chưa được cập nhật Mã số sinh viên.`,
          entityType: 'member',
          entityId: m.id,
          entityName: m.full_name,
          detectedAt: now,
          actionLabel: 'Cập nhật MSSV',
          actionRoute: `/members`,
          metadata: { memberId: m.id, fullName: m.full_name },
        });
      } else {
        // Collect for duplicate check
        const existingList = studentIdMap.get(trimmedStudentId) || [];
        existingList.push({ id: m.id, name: m.full_name });
        studentIdMap.set(trimmedStudentId, existingList);
      }

      // Check 2: Missing Email
      if (!trimmedEmail) {
        issues.push({
          id: `dq_members_MEMBER_MISSING_EMAIL_${m.id}`,
          organizationId,
          category: 'members',
          severity: 'warning',
          code: 'MEMBER_MISSING_EMAIL',
          title: 'Hội viên thiếu Email',
          description: `Hội viên "${m.full_name}" chưa có địa chỉ email liên lạc.`,
          entityType: 'member',
          entityId: m.id,
          entityName: m.full_name,
          detectedAt: now,
          actionLabel: 'Cập nhật Email',
          actionRoute: `/members`,
          metadata: { memberId: m.id, fullName: m.full_name },
        });
      } else {
        // Collect for duplicate check
        const existingEmails = emailMap.get(trimmedEmail) || [];
        existingEmails.push({ id: m.id, name: m.full_name });
        emailMap.set(trimmedEmail, existingEmails);
      }

      // Check 3: Missing Phone
      if (!trimmedPhone) {
        issues.push({
          id: `dq_members_MEMBER_MISSING_PHONE_${m.id}`,
          organizationId,
          category: 'members',
          severity: 'info',
          code: 'MEMBER_MISSING_PHONE',
          title: 'Hội viên thiếu Số điện thoại',
          description: `Hội viên "${m.full_name}" chưa có số điện thoại.`,
          entityType: 'member',
          entityId: m.id,
          entityName: m.full_name,
          detectedAt: now,
          actionLabel: 'Cập nhật SĐT',
          actionRoute: `/members`,
          metadata: { memberId: m.id, fullName: m.full_name },
        });
      }

      // Check 4: Active member not assigned to any term
      if (m.status === 'active' && !memberTermSet.has(m.id)) {
        issues.push({
          id: `dq_members_MEMBER_NOT_ASSIGNED_TO_TERM_${m.id}`,
          organizationId,
          category: 'members',
          severity: 'warning',
          code: 'MEMBER_NOT_ASSIGNED_TO_TERM',
          title: 'Hội viên chưa được phân công vào nhiệm kỳ',
          description: `Hội viên đang hoạt động "${m.full_name}" chưa được gán vào bất kỳ nhiệm kỳ nào.`,
          entityType: 'member',
          entityId: m.id,
          entityName: m.full_name,
          detectedAt: now,
          actionLabel: 'Phân công nhiệm kỳ',
          actionRoute: `/members`,
          metadata: { memberId: m.id, fullName: m.full_name },
        });
      }

      // Check 5: Active member not in current active term
      if (
        m.status === 'active' &&
        currentTermId &&
        memberTermSet.has(m.id) &&
        !memberCurrentTermSet.has(m.id)
      ) {
        issues.push({
          id: `dq_members_MEMBER_NOT_IN_CURRENT_TERM_${m.id}`,
          organizationId,
          category: 'members',
          severity: 'info',
          code: 'MEMBER_NOT_IN_CURRENT_TERM',
          title: 'Hội viên chưa có trong nhiệm kỳ hiện tại',
          description: `Hội viên "${m.full_name}" đang hoạt động nhưng chưa có trong danh sách nhiệm kỳ hiện tại (${currentTermRaw?.name || 'Nhiệm kỳ hiện tại'}).`,
          entityType: 'member',
          entityId: m.id,
          entityName: m.full_name,
          detectedAt: now,
          actionLabel: 'Thêm vào nhiệm kỳ',
          actionRoute: `/terms`,
          metadata: { memberId: m.id, fullName: m.full_name, currentTermId },
        });
      }
    }

    // Check 6: Duplicate Student ID
    for (const [studentId, duplicates] of studentIdMap.entries()) {
      if (duplicates.length > 1) {
        for (const dup of duplicates) {
          const otherNames = duplicates
            .filter((d) => d.id !== dup.id)
            .map((d) => d.name)
            .join(', ');
          issues.push({
            id: `dq_members_MEMBER_DUPLICATE_STUDENT_ID_${dup.id}`,
            organizationId,
            category: 'members',
            severity: 'critical',
            code: 'MEMBER_DUPLICATE_STUDENT_ID',
            title: 'Trùng lặp Mã số sinh viên',
            description: `MSSV "${studentId.toUpperCase()}" của "${dup.name}" trùng lặp với: ${otherNames}.`,
            entityType: 'member',
            entityId: dup.id,
            entityName: dup.name,
            detectedAt: now,
            actionLabel: 'Kiểm tra trùng lặp',
            actionRoute: `/members`,
            metadata: { studentId, duplicatesCount: duplicates.length },
          });
        }
      }
    }

    // Check 7: Duplicate Email
    for (const [email, duplicates] of emailMap.entries()) {
      if (duplicates.length > 1) {
        for (const dup of duplicates) {
          const otherNames = duplicates
            .filter((d) => d.id !== dup.id)
            .map((d) => d.name)
            .join(', ');
          issues.push({
            id: `dq_members_MEMBER_DUPLICATE_EMAIL_${dup.id}`,
            organizationId,
            category: 'members',
            severity: 'warning',
            code: 'MEMBER_DUPLICATE_EMAIL',
            title: 'Trùng lặp Email hội viên',
            description: `Email "${email}" của "${dup.name}" trùng lặp với: ${otherNames}.`,
            entityType: 'member',
            entityId: dup.id,
            entityName: dup.name,
            detectedAt: now,
            actionLabel: 'Kiểm tra Email',
            actionRoute: `/members`,
            metadata: { email, duplicatesCount: duplicates.length },
          });
        }
      }
    }

    return issues;
  },
};
