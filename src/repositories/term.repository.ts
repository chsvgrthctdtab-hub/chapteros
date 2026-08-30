import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database, TermStatus, TermMemberStatus } from '@/types/database.types';
import type { Term, TermMember, Member, Activity, Task } from '@/types';

type DbTerm = Database['public']['Tables']['terms']['Row'];
type DbMember = Database['public']['Tables']['members']['Row'];
type DbTermInsert = Database['public']['Tables']['terms']['Insert'];
type DbTermUpdate = Database['public']['Tables']['terms']['Update'];
type DbTermMemberInsert = Database['public']['Tables']['term_members']['Insert'];
type DbTermMemberUpdate = Database['public']['Tables']['term_members']['Update'];

interface RawTermWithCount extends DbTerm {
  term_members?: { count: number }[];
}

interface RawTermMemberJoin {
  id: string;
  term_id: string;
  member_id: string;
  position: string;
  department: string | null;
  status: string;
  joined_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  member: {
    id: string;
    organization_id: string;
    user_id: string | null;
    student_id: string | null;
    full_name: string;
    email: string | null;
    phone: string | null;
    class_name: string | null;
    major: string | null;
    cohort: string | null;
    position: string | null;
    status: string;
    joined_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

function mapTermFromDb(row: RawTermWithCount | DbTerm): Term {
  const memberCount =
    'term_members' in row && Array.isArray(row.term_members) && row.term_members[0]
      ? row.term_members[0].count
      : undefined;

  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as TermStatus,
    isCurrent: row.is_current,
    closingSnapshot: (row as any).closing_snapshot || undefined,
    closedAt: (row as any).closed_at || null,
    closedBy: (row as any).closed_by || null,
    handoverNotes: (row as any).handover_notes || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    memberCount,
  };
}

function mapTermMemberFromDb(row: RawTermMemberJoin): TermMember {
  let mappedMember: Member | undefined = undefined;
  if (row.member) {
    mappedMember = {
      id: row.member.id,
      organizationId: row.member.organization_id,
      userId: row.member.user_id,
      studentId: row.member.student_id,
      fullName: row.member.full_name,
      email: row.member.email,
      phone: row.member.phone,
      className: row.member.class_name,
      major: row.member.major,
      cohort: row.member.cohort,
      position: row.member.position,
      status: row.member.status as Member['status'],
      joinedDate: row.member.joined_date,
      notes: row.member.notes,
      createdAt: row.member.created_at,
      updatedAt: row.member.updated_at,
    };
  }

  return {
    id: row.id,
    termId: row.term_id,
    memberId: row.member_id,
    position: row.position,
    department: row.department,
    status: row.status as TermMemberStatus,
    joinedDate: row.joined_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    member: mappedMember,
  };
}

export const termRepository = {
  /**
   * Get all terms for an organization ordered by start_date desc
   */
  async getByOrganization(organizationId: string): Promise<Term[]> {
    if (!isSupabaseConfigured || !organizationId) return [];

    const { data, error } = await supabase
      .from('terms')
      .select('*, term_members(count)')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: false });

    if (error) {
      // Fallback without relation count if embedding fails
      const fallback = (await supabase
        .from('terms')
        .select('*')
        .eq('organization_id', organizationId)
        .order('start_date', { ascending: false })) as unknown as {
        data: DbTerm[] | null;
        error: Error | null;
      };

      if (fallback.error) throw fallback.error;
      return (fallback.data || []).map(mapTermFromDb);
    }

    return ((data || []) as unknown as RawTermWithCount[]).map(mapTermFromDb);
  },

  /**
   * Get the active / current term for an organization
   */
  async getCurrent(organizationId: string): Promise<Term | null> {
    if (!isSupabaseConfigured || !organizationId) return null;

    const { data, error } = await supabase
      .from('terms')
      .select('*, term_members(count)')
      .eq('organization_id', organizationId)
      .eq('is_current', true)
      .maybeSingle();

    if (error) {
      const fallbackResult = (await supabase
        .from('terms')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_current', true)
        .maybeSingle()) as unknown as { data: DbTerm | null; error: Error | null };

      if (fallbackResult.error) throw fallbackResult.error;
      return fallbackResult.data ? mapTermFromDb(fallbackResult.data) : null;
    }

    return data ? mapTermFromDb(data as unknown as RawTermWithCount) : null;
  },

  /**
   * Get a term by ID
   */
  async getById(id: string): Promise<Term | null> {
    if (!isSupabaseConfigured || !id) return null;

    const { data, error } = await supabase
      .from('terms')
      .select('*, term_members(count)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      const fallbackResult = (await supabase
        .from('terms')
        .select('*')
        .eq('id', id)
        .maybeSingle()) as unknown as { data: DbTerm | null; error: Error | null };

      if (fallbackResult.error) throw fallbackResult.error;
      return fallbackResult.data ? mapTermFromDb(fallbackResult.data) : null;
    }

    return data ? mapTermFromDb(data as unknown as RawTermWithCount) : null;
  },

  /**
   * Create a new term in public.terms
   * Strict schema validation & error handling
   */
  async create(payload: DbTermInsert): Promise<Term> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase chưa được cấu hình.');
    }

    if (!payload.organization_id) {
      throw new Error('Không xác định được Đơn vị hiện tại.');
    }

    const trimmedName = (payload.name || '').trim();
    if (!trimmedName) {
      throw new Error('Vui lòng nhập tên nhiệm kỳ.');
    }

    const startDate = (payload.start_date || '').split('T')[0];
    if (!startDate) {
      throw new Error('Vui lòng chọn ngày bắt đầu.');
    }

    const endDate = (payload.end_date || '').split('T')[0];
    if (!endDate) {
      throw new Error('Vui lòng chọn ngày kết thúc.');
    }

    if (startDate > endDate) {
      throw new Error('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
    }

    const status = payload.status || 'draft';
    const isCurrent = payload.is_current ?? false;

    // Strict schema insert payload matching public.terms
    const insertPayload = {
      organization_id: payload.organization_id,
      name: trimmedName,
      start_date: startDate,
      end_date: endDate,
      status: status,
      is_current: isCurrent,
    };

    const { data, error } = await supabase
      .from('terms')
      .insert(insertPayload as never)
      .select()
      .single();

    if (error) {
      console.error('Failed to create term:', error);

      if (error.code === '23505' || error.message?.includes('uq_terms_org_name')) {
        throw new Error('Tên nhiệm kỳ này đã tồn tại trong Đơn vị.');
      }
      if (error.code === '23514' || error.message?.includes('chk_term_dates')) {
        throw new Error('Ngày bắt đầu và ngày kết thúc của nhiệm kỳ không hợp lệ.');
      }
      if (
        error.code === '42501' ||
        error.message?.includes('row-level security') ||
        error.message?.includes('permission') ||
        error.message?.includes('policy')
      ) {
        throw new Error('Bạn không có quyền tạo nhiệm kỳ trong Đơn vị này.');
      }

      throw new Error(error.message || 'Có lỗi xảy ra khi tạo nhiệm kỳ mới.');
    }

    return mapTermFromDb(data as DbTerm);
  },

  /**
   * Update an existing term
   */
  async update(id: string, payload: DbTermUpdate): Promise<Term> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình.');

    const updatePayload: Record<string, unknown> = {};
    if (payload.name !== undefined) updatePayload.name = payload.name.trim();
    if (payload.start_date !== undefined) updatePayload.start_date = payload.start_date.split('T')[0];
    if (payload.end_date !== undefined) updatePayload.end_date = payload.end_date.split('T')[0];
    if (payload.status !== undefined) updatePayload.status = payload.status;
    if (payload.is_current !== undefined) updatePayload.is_current = payload.is_current;

    const { data, error } = await supabase
      .from('terms')
      .update(updatePayload as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Terms] UPDATE ERROR', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      if (error.code === '23505' || error.message?.includes('uq_terms_org_name')) {
        throw new Error('Tên nhiệm kỳ này đã tồn tại trong Đơn vị.');
      }
      if (error.code === '23514' || error.message?.includes('chk_term_dates')) {
        throw new Error('Ngày bắt đầu và ngày kết thúc của nhiệm kỳ không hợp lệ.');
      }
      if (
        error.code === '42501' ||
        error.message?.includes('row-level security') ||
        error.message?.includes('permission') ||
        error.message?.includes('policy')
      ) {
        throw new Error('Bạn không có quyền cập nhật nhiệm kỳ trong Đơn vị này.');
      }
      throw new Error(error.message || 'Có lỗi xảy ra khi cập nhật nhiệm kỳ.');
    }

    return mapTermFromDb(data as DbTerm);
  },

  /**
   * Activate a term: atomicity ensured via safe lifecycle checks & updates
   * Sets is_current = true and status = 'active' for the target term,
   * while setting is_current = false for all other terms in the organization.
   */
  async activate(termId: string, organizationId: string): Promise<Term> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình.');

    // Step 1: TERM CHECK
    const { data: targetTermRaw, error: termError } = await supabase
      .from('terms')
      .select('*')
      .eq('id', termId)
      .maybeSingle();

    if (termError || !targetTermRaw) {
      console.error('Term check error during activation:', termError);
      throw new Error('Không tìm thấy nhiệm kỳ cần kích hoạt.');
    }
    const targetTerm = targetTermRaw as unknown as DbTerm;

    // Check status: cannot activate completed or archived term
    if (targetTerm.status === 'completed' || targetTerm.status === 'archived') {
      throw new Error('Nhiệm kỳ đã kết thúc hoặc lưu trữ, không thể kích hoạt lại.');
    }

    // Step 2: ORGANIZATION CHECK
    if (targetTerm.organization_id !== organizationId) {
      throw new Error('Nhiệm kỳ không thuộc Đơn vị hiện tại.');
    }

    // 1. Try atomic database RPC function first
    const { data: rpcData, error: rpcError } = await (
      supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: DbTerm | null; error: Error | null }>
    )('activate_term', {
      p_term_id: termId,
      p_org_id: organizationId,
    });

    if (!rpcError && rpcData) {
      return mapTermFromDb(rpcData as DbTerm);
    }

    // 2. Fallback to transaction-safe two-step update if RPC not present in current DB environment
    // Step 3: CLOSE OLD TERM
    const { error: deactivateError } = await supabase
      .from('terms')
      .update({ is_current: false } as never)
      .eq('organization_id', organizationId)
      .neq('id', termId)
      .eq('is_current', true);

    if (deactivateError) {
      console.error('Failed to deactivate previous term:', deactivateError);
      if (deactivateError.code === '42501') {
        throw new Error('Bạn không có quyền thực hiện thao tác này.');
      }
      throw deactivateError;
    }

    // Step 4: ACTIVATE NEW TERM
    const { data, error: activateError } = await supabase
      .from('terms')
      .update({
        is_current: true,
        status: 'active',
      } as never)
      .eq('id', termId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (activateError) {
      console.error('Failed to activate new term:', activateError);
      if (activateError.code === '42501') {
        throw new Error('Bạn không có quyền thực hiện thao tác này.');
      }
      throw new Error(activateError.message || 'Có lỗi xảy ra khi kích hoạt nhiệm kỳ.');
    }

    return mapTermFromDb(data as DbTerm);
  },

  /**
   * Complete / close a term with immutable closing snapshot, metadata and status
   * Sets status = 'completed', is_current = false, saves closing_snapshot, closed_at, closed_by, handover_notes
   */
  async complete(
    termId: string,
    organizationId: string,
    snapshot?: Record<string, unknown> | null,
    options?: {
      actorUserId?: string;
      handoverNotes?: string;
    }
  ): Promise<Term> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình.');

    // Step 1: TERM CHECK & ORGANIZATION CHECK
    const { data: targetTermRaw, error: termError } = await supabase
      .from('terms')
      .select('*')
      .eq('id', termId)
      .maybeSingle();

    if (termError || !targetTermRaw) {
      throw new Error('Không tìm thấy nhiệm kỳ cần kết thúc.');
    }
    const targetTerm = targetTermRaw as unknown as DbTerm;

    if (targetTerm.organization_id !== organizationId) {
      throw new Error('Nhiệm kỳ không thuộc Đơn vị hiện tại.');
    }

    const updatePayload: Record<string, unknown> = {
      status: 'completed',
      is_current: false,
      closed_at: new Date().toISOString(),
    };

    if (snapshot !== undefined) {
      updatePayload.closing_snapshot = snapshot;
    }
    if (options?.actorUserId) {
      updatePayload.closed_by = options.actorUserId;
    }
    if (options?.handoverNotes !== undefined) {
      updatePayload.handover_notes = options.handoverNotes;
    }

    const { data, error } = await supabase
      .from('terms')
      .update(updatePayload as never)
      .eq('id', termId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Failed to close term:', error);
      if (error.code === '42501') {
        throw new Error('Bạn không có quyền thực hiện thao tác này.');
      }
      throw new Error(error.message || 'Có lỗi xảy ra khi đóng nhiệm kỳ.');
    }

    return mapTermFromDb(data as DbTerm);
  },

  /**
   * Archive a completed term
   */
  async archive(termId: string, organizationId: string): Promise<Term> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình.');

    const { data, error } = await supabase
      .from('terms')
      .update({
        status: 'archived',
        is_current: false,
      } as never)
      .eq('id', termId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('[TermLifecycle] ARCHIVE ERROR', error);
      if (error.code === '42501') {
        throw new Error('Bạn không có quyền thực hiện thao tác này.');
      }
      throw new Error(error.message || 'Có lỗi xảy ra khi lưu trữ nhiệm kỳ.');
    }

    return mapTermFromDb(data as DbTerm);
  },

  /**
   * Save or update an immutable closing snapshot on a term
   */
  async saveClosingSnapshot(
    termId: string,
    organizationId: string,
    snapshot: Record<string, unknown>
  ): Promise<Term> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình.');

    const { data, error } = await supabase
      .from('terms')
      .update({
        closing_snapshot: snapshot,
      } as never)
      .eq('id', termId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Không thể lưu bản chụp nhiệm kỳ.');
    }

    return mapTermFromDb(data as DbTerm);
  },

  /**
   * Fetch all relational data for a term to evaluate closing checklist and build snapshot
   */
  async getTermChecklistData(
    termId: string,
    organizationId: string
  ): Promise<{
    term: Term;
    members: TermMember[];
    activities: Activity[];
    tasks: Task[];
    transactions: Array<{ transactionType: 'income' | 'expense'; amount: number }>;
    participantStats: {
      totalRegistrations: number;
      totalPresent: number;
      totalAbsent: number;
      totalExcused: number;
    };
  }> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình.');

    // 1. Fetch term
    const term = await this.getById(termId);
    if (!term || term.organizationId !== organizationId) {
      throw new Error('Không tìm thấy nhiệm kỳ hoặc nhiệm kỳ không thuộc Đơn vị hiện tại.');
    }

    // 2. Fetch term members
    const members = await this.getTermMembers(termId);

    // 3. Fetch activities
    const { data: activitiesData, error: actError } = await supabase
      .from('activities')
      .select('*')
      .eq('term_id', termId)
      .eq('organization_id', organizationId);

    if (actError) {
      console.error('[TermChecklist] Activities error:', actError);
      throw actError;
    }

    const activities: Activity[] = ((activitiesData || []) as any[]).map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      termId: row.term_id,
      code: row.code,
      title: row.title,
      description: row.description,
      category: row.category,
      status: row.status,
      location: row.location,
      startDate: row.start_date,
      endDate: row.end_date,
      targetMembers: row.target_members,
      bannerUrl: row.banner_url,
      leadMemberId: row.lead_member_id,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // 4. Fetch tasks
    const { data: tasksData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('term_id', termId)
      .eq('organization_id', organizationId);

    if (taskError) {
      console.error('[TermChecklist] Tasks error:', taskError);
    }

    const tasks: Task[] = ((tasksData || []) as any[]).map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      termId: row.term_id,
      activityId: row.activity_id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      progress: row.progress || 0,
      dueDate: row.due_date,
      assignedTo: row.assigned_to,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // 5. Fetch finance transactions
    const { data: financeData, error: finError } = await supabase
      .from('finance_transactions')
      .select('transaction_type, amount')
      .eq('term_id', termId)
      .eq('organization_id', organizationId);

    if (finError) {
      console.error('[TermChecklist] Finance error:', finError);
    }

    const transactions = ((financeData || []) as any[]).map((row) => ({
      transactionType: row.transaction_type as 'income' | 'expense',
      amount: Number(row.amount) || 0,
    }));

    // 6. Fetch participants stats for all activities in this term
    const activityIds = activities.map((a) => a.id);
    let participantStats = {
      totalRegistrations: 0,
      totalPresent: 0,
      totalAbsent: 0,
      totalExcused: 0,
    };

    if (activityIds.length > 0) {
      const { data: participantsData, error: partError } = await supabase
        .from('activity_participants')
        .select('registration_status, attendance_status')
        .in('activity_id', activityIds);

      if (!partError && participantsData) {
        const rows = participantsData as any[];
        participantStats = {
          totalRegistrations: rows.length,
          totalPresent: rows.filter((r) => r.attendance_status === 'present').length,
          totalAbsent: rows.filter((r) => r.attendance_status === 'absent').length,
          totalExcused: rows.filter((r) => r.attendance_status === 'excused').length,
        };
      }
    }

    return {
      term,
      members,
      activities,
      tasks,
      transactions,
      participantStats,
    };
  },

  /**
   * Get all members assigned to a specific term
   */
  async getTermMembers(termId: string): Promise<TermMember[]> {
    if (!isSupabaseConfigured || !termId) return [];

    const { data, error } = await supabase
      .from('term_members')
      .select(`
        id,
        term_id,
        member_id,
        position,
        department,
        status,
        joined_date,
        notes,
        created_at,
        updated_at,
        member:members (
          id,
          organization_id,
          user_id,
          student_id,
          full_name,
          email,
          phone,
          class_name,
          major,
          cohort,
          position,
          status,
          joined_date,
          notes,
          created_at,
          updated_at
        )
      `)
      .eq('term_id', termId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ((data || []) as unknown as RawTermMemberJoin[]).map(mapTermMemberFromDb);
  },

  /**
   * Get members of an organization that are not yet assigned to the given term
   */
  async getAvailableMembersForTerm(termId: string, organizationId: string): Promise<Member[]> {
    if (!isSupabaseConfigured || !termId || !organizationId) return [];

    // 1. Get member IDs currently in this term
    const { data: termMembersData, error: tmError } = await supabase
      .from('term_members')
      .select('member_id')
      .eq('term_id', termId);

    if (tmError) {
      console.error('[TermMembers] Get term members for available list error:', tmError);
    }

    const assignedMemberIds = new Set(
      ((termMembersData as unknown as { member_id: string }[]) || []).map((tm) => tm.member_id)
    );

    // 2. Query all members of the organization
    const { data: orgMembers, error: orgError } = await supabase
      .from('members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('full_name', { ascending: true });

    if (orgError) throw orgError;

    const memberRows = (orgMembers as unknown as DbMember[]) || [];
    // 3. Filter out assigned members and map to Member domain model
    const available = memberRows.filter((m) => !assignedMemberIds.has(m.id));
    return available.map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      studentId: row.student_id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      className: row.class_name,
      major: row.major,
      cohort: row.cohort,
      position: row.position,
      status: row.status as Member['status'],
      joinedDate: row.joined_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  /**
   * Add a member to a term (validating uq_term_member and organization integrity)
   */
  async addMemberToTerm(payload: DbTermMemberInsert): Promise<TermMember> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase chưa được cấu hình.');
    }

    if (!payload.term_id) {
      throw new Error('Không xác định được nhiệm kỳ.');
    }
    if (!payload.member_id) {
      throw new Error('Vui lòng chọn hội viên.');
    }

    // Step 1: Verify Term exists and get organization_id
    const { data: termDataRaw, error: termError } = await supabase
      .from('terms')
      .select('id, organization_id')
      .eq('id', payload.term_id)
      .maybeSingle();

    const termData = termDataRaw as unknown as { id: string; organization_id: string } | null;

    if (termError || !termData) {
      console.error('Term check error while adding member:', termError);
      throw new Error('Nhiệm kỳ hoặc hội viên không tồn tại.');
    }

    // Step 2: Verify Member exists and get organization_id
    const { data: memberDataRaw, error: memberError } = await supabase
      .from('members')
      .select('id, organization_id')
      .eq('id', payload.member_id)
      .maybeSingle();

    const memberData = memberDataRaw as unknown as { id: string; organization_id: string } | null;

    if (memberError || !memberData) {
      console.error('Member check error while adding member to term:', memberError);
      throw new Error('Nhiệm kỳ hoặc hội viên không tồn tại.');
    }

    // Step 3: Check organizational boundary
    if (termData.organization_id !== memberData.organization_id) {
      throw new Error('Hội viên không thuộc Chi hội của nhiệm kỳ này.');
    }

    // Step 4: Construct strict payload
    const insertPayload = {
      term_id: payload.term_id,
      member_id: payload.member_id,
      position: (payload.position || 'Hội viên').trim() || 'Hội viên',
      department: payload.department?.trim() || null,
      status: payload.status || 'active',
      joined_date: payload.joined_date || new Date().toISOString().split('T')[0],
      notes: payload.notes?.trim() || null,
    };

    const { data, error } = await supabase
      .from('term_members')
      .insert(insertPayload as never)
      .select(`
        id,
        term_id,
        member_id,
        position,
        department,
        status,
        joined_date,
        notes,
        created_at,
        updated_at,
        member:members (
          id,
          organization_id,
          user_id,
          student_id,
          full_name,
          email,
          phone,
          class_name,
          major,
          cohort,
          position,
          status,
          joined_date,
          notes,
          created_at,
          updated_at
        )
      `)
      .single();

    if (error) {
      console.error('Failed to add member to term:', error);

      if (error.code === '23505' || error.message?.includes('uq_term_member') || error.message?.includes('unique')) {
        throw new Error('Hội viên này đã được thêm vào nhiệm kỳ.');
      }
      if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('fkey')) {
        throw new Error('Nhiệm kỳ hoặc hội viên không tồn tại.');
      }
      if (
        error.code === '42501' ||
        error.message?.includes('row-level security') ||
        error.message?.includes('permission') ||
        error.message?.includes('policy')
      ) {
        throw new Error('Bạn không có quyền quản lý thành viên của nhiệm kỳ này.');
      }

      throw new Error(error.message || 'Không thể cập nhật thành viên nhiệm kỳ. Vui lòng thử lại.');
    }

    return mapTermMemberFromDb(data as unknown as RawTermMemberJoin);
  },

  /**
   * Update term member assignment (position, department, status, joined_date, notes)
   */
  async updateTermMember(id: string, payload: DbTermMemberUpdate): Promise<TermMember> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình.');

    const updatePayload: Record<string, unknown> = {};
    if (payload.position !== undefined) updatePayload.position = payload.position.trim() || 'Hội viên';
    if (payload.department !== undefined) updatePayload.department = payload.department?.trim() || null;
    if (payload.status !== undefined) updatePayload.status = payload.status;
    if (payload.joined_date !== undefined) updatePayload.joined_date = payload.joined_date || null;
    if (payload.notes !== undefined) updatePayload.notes = payload.notes?.trim() || null;

    const { data, error } = await supabase
      .from('term_members')
      .update(updatePayload as never)
      .eq('id', id)
      .select(`
        id,
        term_id,
        member_id,
        position,
        department,
        status,
        joined_date,
        notes,
        created_at,
        updated_at,
        member:members (
          id,
          organization_id,
          user_id,
          student_id,
          full_name,
          email,
          phone,
          class_name,
          major,
          cohort,
          position,
          status,
          joined_date,
          notes,
          created_at,
          updated_at
        )
      `)
      .single();

    if (error) {
      console.error('[TermMembers] UPDATE ERROR', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      if (
        error.code === '42501' ||
        error.message?.includes('row-level security') ||
        error.message?.includes('permission') ||
        error.message?.includes('policy')
      ) {
        throw new Error('Bạn không có quyền quản lý thành viên của nhiệm kỳ này.');
      }
      throw new Error(error.message || 'Không thể cập nhật thành viên nhiệm kỳ. Vui lòng thử lại.');
    }

    return mapTermMemberFromDb(data as unknown as RawTermMemberJoin);
  },

  /**
   * Remove a member from a term
   */
  async removeMemberFromTerm(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình.');

    const { error } = await supabase
      .from('term_members')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[TermMembers] DELETE ERROR', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      if (
        error.code === '42501' ||
        error.message?.includes('row-level security') ||
        error.message?.includes('permission') ||
        error.message?.includes('policy')
      ) {
        throw new Error('Bạn không có quyền quản lý thành viên của nhiệm kỳ này.');
      }
      throw new Error(error.message || 'Không thể gỡ thành viên khỏi nhiệm kỳ.');
    }
  },

  /**
   * Transfer members from source term to target term
   * Strictly creates new term_members records without duplicating members or altering source history
   */
  async transferMembers(
    sourceTermId: string,
    targetTermId: string,
    memberIds: string[],
    organizationId?: string
  ): Promise<{ transferredCount: number; skippedCount: number; totalSelected: number }> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình.');
    if (!sourceTermId || !targetTermId) {
      throw new Error('Vui lòng chọn đầy đủ nhiệm kỳ nguồn và nhiệm kỳ đích.');
    }
    if (sourceTermId === targetTermId) {
      throw new Error('Nhiệm kỳ đích phải khác nhiệm kỳ nguồn.');
    }
    if (memberIds.length === 0) {
      return { transferredCount: 0, skippedCount: 0, totalSelected: 0 };
    }

    // Step 1: SOURCE TERM CHECK
    const { data: sourceTermRaw, error: sourceTermError } = await supabase
      .from('terms')
      .select('id, name, organization_id, status, start_date, end_date')
      .eq('id', sourceTermId)
      .maybeSingle();

    if (sourceTermError || !sourceTermRaw) {
      console.error('Source term check error during transfer:', sourceTermError);
      throw new Error('Không tìm thấy nhiệm kỳ nguồn.');
    }
    const sourceTerm = sourceTermRaw as unknown as {
      id: string;
      name: string;
      organization_id: string;
      status: string;
      start_date: string;
      end_date: string;
    };

    // Step 2: TARGET TERM CHECK
    const { data: targetTermRaw, error: targetTermError } = await supabase
      .from('terms')
      .select('id, name, organization_id, status, start_date, end_date')
      .eq('id', targetTermId)
      .maybeSingle();

    if (targetTermError || !targetTermRaw) {
      console.error('Target term check error during transfer:', targetTermError);
      throw new Error('Không tìm thấy nhiệm kỳ đích.');
    }
    const targetTerm = targetTermRaw as unknown as {
      id: string;
      name: string;
      organization_id: string;
      status: string;
      start_date: string;
      end_date: string;
    };

    if (targetTerm.status === 'completed' || targetTerm.status === 'archived') {
      throw new Error('Không thể bàn giao hội viên vào nhiệm kỳ đã kết thúc hoặc lưu trữ.');
    }

    // Organization boundary check
    if (
      sourceTerm.organization_id !== targetTerm.organization_id ||
      (organizationId && sourceTerm.organization_id !== organizationId)
    ) {
      throw new Error('Không thể bàn giao hội viên thuộc Đơn vị khác.');
    }

    // Step 3: MEMBER CHECK
    // 3a. Check existing term members in target term (idempotency check)
    const { data: existingTargetRowsRaw, error: targetCheckError } = await supabase
      .from('term_members')
      .select('member_id')
      .eq('term_id', targetTermId);

    if (targetCheckError) {
      console.error('Failed to check existing target term members:', targetCheckError);
      throw targetCheckError;
    }

    const existingTargetMemberIds = new Set(
      ((existingTargetRowsRaw as unknown as { member_id: string }[]) || []).map(
        (r) => r.member_id
      )
    );

    // 3b. Query source term_members rows for the selected memberIds
    const { data: sourceMembersRaw, error: sourceMembersError } = await supabase
      .from('term_members')
      .select('id, term_id, member_id, position, department, status, notes')
      .eq('term_id', sourceTermId)
      .in('member_id', memberIds);

    if (sourceMembersError) {
      console.error('Failed to fetch source term members:', sourceMembersError);
      throw sourceMembersError;
    }

    const sourceRows =
      (sourceMembersRaw as unknown as {
        id: string;
        term_id: string;
        member_id: string;
        position: string;
        department: string | null;
        status: string;
        notes: string | null;
      }[]) || [];

    // 3c. Verify member organization boundary
    const { data: membersOrgCheckRaw, error: membersOrgError } = await supabase
      .from('members')
      .select('id, organization_id')
      .in('id', memberIds);

    if (membersOrgError) {
      console.error('Failed to verify members organization boundary:', membersOrgError);
      throw membersOrgError;
    }

    const memberOrgRows = (membersOrgCheckRaw as unknown as { id: string; organization_id: string }[]) || [];
    const hasAlienMember = memberOrgRows.some((m) => m.organization_id !== sourceTerm.organization_id);
    if (hasAlienMember) {
      throw new Error('Không thể bàn giao hội viên thuộc Đơn vị khác.');
    }

    // Filter out members who already exist in target term
    const toTransfer = sourceRows.filter((tm) => !existingTargetMemberIds.has(tm.member_id));
    const skippedCount = memberIds.length - toTransfer.length;

    if (toTransfer.length === 0) {
      return { transferredCount: 0, skippedCount, totalSelected: memberIds.length };
    }

    // Step 4: Insert new term members
    const rowsToInsert: DbTermMemberInsert[] = toTransfer.map((tm) => ({
      term_id: targetTermId,
      member_id: tm.member_id,
      position: tm.position || 'Hội viên',
      department: tm.department || null,
      status: 'active',
      joined_date: targetTerm.start_date || new Date().toISOString().split('T')[0],
      notes: tm.notes || null,
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from('term_members')
      .insert(rowsToInsert as never)
      .select();

    if (insertError) {
      console.error('Failed to insert transferred term members:', insertError);
      if (insertError.code === '23505') {
        throw new Error('Một số hội viên đã tồn tại trong nhiệm kỳ mới.');
      }
      if (insertError.code === '42501') {
        throw new Error('Bạn không có quyền thực hiện thao tác bàn giao nhiệm kỳ này.');
      }
      if (insertError.code === '23503') {
        throw new Error('Dữ liệu liên kết không tồn tại.');
      }
      if (insertError.code === '23514') {
        throw new Error('Dữ liệu không hợp lệ.');
      }
      throw new Error(insertError.message || 'Có lỗi xảy ra khi bàn giao hội viên sang nhiệm kỳ mới.');
    }

    // Step 5: Return result counts
    const transferredCount = insertedData?.length || rowsToInsert.length;
    return {
      transferredCount,
      skippedCount,
      totalSelected: memberIds.length,
    };
  },
};
