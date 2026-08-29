import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { Member, TermMember, Term, MemberStatus, TermMemberStatus } from '@/types';
import type { MemberFilterParams, MemberListItem, MemberTermHistoryItem } from '@/features/members/types/member.types';

export type DbMember = Database['public']['Tables']['members']['Row'];
export type DbMemberInsert = Database['public']['Tables']['members']['Insert'];
export type DbMemberUpdate = Database['public']['Tables']['members']['Update'];
export type DbTermMember = Database['public']['Tables']['term_members']['Row'];
export type DbTermMemberInsert = Database['public']['Tables']['term_members']['Insert'];
export type DbTermMemberUpdate = Database['public']['Tables']['term_members']['Update'];
export type DbTerm = Database['public']['Tables']['terms']['Row'];

export function mapMemberFromDb(row: DbMember): Member {
  return {
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
    status: row.status as MemberStatus,
    joinedDate: row.joined_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTermFromDb(row: DbTerm): Term {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as Term['status'],
    isCurrent: row.is_current,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface MembersListResult {
  data: MemberListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const memberRepository = {
  /**
   * List members for an organization with searching, filtering, and pagination
   */
  async list(organizationId: string, params: MemberFilterParams = {}): Promise<MembersListResult> {
    if (!isSupabaseConfigured || !organizationId) {
      return { data: [], totalCount: 0, page: params.page || 1, pageSize: params.pageSize || 15, totalPages: 0 };
    }

    const {
      search = '',
      status = 'all',
      position = 'all',
      termId = 'all',
      page = 1,
      pageSize = 15,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;

    let query = supabase
      .from('members')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (position && position !== 'all') {
      query = query.ilike('position', `%${position}%`);
    }

    if (search.trim()) {
      const s = search.trim();
      query = query.or(`full_name.ilike.%${s}%,student_id.ilike.%${s}%,email.ilike.%${s}%,class_name.ilike.%${s}%`);
    }

    // If filtering by specific term, resolve member IDs first
    if (termId && termId !== 'all') {
      const { data: termMembersData } = await supabase
        .from('term_members')
        .select('member_id')
        .eq('term_id', termId);

      const memberIds = (termMembersData || []).map((tm: { member_id: string }) => tm.member_id);
      if (memberIds.length === 0) {
        return { data: [], totalCount: 0, page, pageSize, totalPages: 0 };
      }
      query = query.in('id', memberIds);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: membersData, count, error } = await query;
    if (error) throw error;

    const totalCount = count || 0;
    const rawMembers = (membersData || []) as DbMember[];
    const memberIds = rawMembers.map((m) => m.id);

    // Fetch active term assignment for the fetched member ids
    const termAssignmentsMap = new Map<
      string,
      {
        termId: string;
        termName: string;
        position: string;
        department: string | null;
        status: TermMemberStatus;
        isCurrentTerm: boolean;
      }
    >();

    if (memberIds.length > 0) {
      const { data: termMembersData } = await supabase
        .from('term_members')
        .select(`
          id,
          member_id,
          position,
          department,
          status,
          term:terms (
            id,
            name,
            is_current,
            start_date
          )
        `)
        .in('member_id', memberIds);

      if (termMembersData) {
        interface RawTM {
          id: string;
          member_id: string;
          position: string;
          department: string | null;
          status: string;
          term: {
            id: string;
            name: string;
            is_current: boolean;
            start_date: string;
          } | {
            id: string;
            name: string;
            is_current: boolean;
            start_date: string;
          }[] | null;
        }

        const rawTMList = termMembersData as unknown as RawTM[];
        for (const item of rawTMList) {
          const term = Array.isArray(item.term) ? item.term[0] : item.term;
          if (!term) continue;

          const existing = termAssignmentsMap.get(item.member_id);
          if (!existing || (!existing.isCurrentTerm && term.is_current)) {
            termAssignmentsMap.set(item.member_id, {
              termId: term.id,
              termName: term.name,
              position: item.position,
              department: item.department,
              status: item.status as TermMemberStatus,
              isCurrentTerm: term.is_current,
            });
          }
        }
      }
    }

    const formattedData: MemberListItem[] = rawMembers.map((m) => ({
      ...mapMemberFromDb(m),
      currentTermAssignment: termAssignmentsMap.get(m.id) || null,
    }));

    return {
      data: formattedData,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  },

  /**
   * Get member by ID (optionally verified by organizationId)
   */
  async getById(id: string, organizationId?: string): Promise<Member | null> {
    if (!isSupabaseConfigured) return null;
    let query = supabase
      .from('members')
      .select('*')
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data ? mapMemberFromDb(data as DbMember) : null;
  },

  /**
   * Check if a student ID already exists in this organization
   */
  async findByStudentId(organizationId: string, studentId: string): Promise<Member | null> {
    if (!isSupabaseConfigured || !studentId || !studentId.trim()) return null;
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('student_id', studentId.trim().toUpperCase())
      .maybeSingle();

    if (error) throw error;
    return data ? mapMemberFromDb(data as DbMember) : null;
  },

  /**
   * Create a new member record
   */
  async create(payload: DbMemberInsert): Promise<Member> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình');
    const normalizedPayload: DbMemberInsert = {
      ...payload,
      student_id: payload.student_id ? payload.student_id.trim().toUpperCase() : null,
    };
    const { data, error } = await supabase
      .from('members')
      .insert(normalizedPayload as never)
      .select()
      .single();

    if (error) throw error;
    return mapMemberFromDb(data as DbMember);
  },

  /**
   * Update member details
   */
  async update(id: string, payload: DbMemberUpdate): Promise<Member> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình');
    const normalizedPayload: DbMemberUpdate = {
      ...payload,
    };
    if (payload.student_id !== undefined) {
      normalizedPayload.student_id = payload.student_id ? payload.student_id.trim().toUpperCase() : null;
    }
    const { data, error } = await supabase
      .from('members')
      .update(normalizedPayload as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapMemberFromDb(data as DbMember);
  },

  /**
   * Update member status (e.g. active, alumni, inactive, transferred)
   */
  async updateStatus(id: string, status: MemberStatus): Promise<Member> {
    return this.update(id, { status });
  },

  /**
   * Delete a member record (cascades to term_members in DB)
   */
  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get all term assignment history for a specific member
   */
  async getTermHistory(memberId: string): Promise<MemberTermHistoryItem[]> {
    if (!isSupabaseConfigured || !memberId) return [];
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
        term:terms (
          id,
          name,
          start_date,
          end_date,
          status,
          is_current
        )
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    interface RawTermHistory {
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
      term: {
        id: string;
        name: string;
        start_date: string;
        end_date: string;
        status: string;
        is_current: boolean;
      } | {
        id: string;
        name: string;
        start_date: string;
        end_date: string;
        status: string;
        is_current: boolean;
      }[] | null;
    }

    const list = data as unknown as RawTermHistory[];
    return list
      .filter((item) => item.term !== null)
      .map((item) => {
        const t = Array.isArray(item.term) ? item.term[0] : item.term!;
        return {
          id: item.id,
          termId: item.term_id,
          memberId: item.member_id,
          position: item.position,
          department: item.department,
          status: item.status as TermMemberStatus,
          joinedDate: item.joined_date,
          notes: item.notes,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          term: {
            id: t.id,
            name: t.name,
            startDate: t.start_date,
            endDate: t.end_date,
            status: t.status as Term['status'],
            isCurrent: t.is_current,
          },
        };
      })
      .sort((a, b) => new Date(b.term.startDate).getTime() - new Date(a.term.startDate).getTime());
  },

  /**
   * Assign a member to a term
   */
  async assignToTerm(payload: DbTermMemberInsert): Promise<DbTermMember> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình');
    const { data, error } = await supabase
      .from('term_members')
      .insert(payload as never)
      .select()
      .single();

    if (error) throw error;
    return data as DbTermMember;
  },

  /**
   * Update a term membership assignment
   */
  async updateTermMember(id: string, payload: DbTermMemberUpdate): Promise<DbTermMember> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình');
    const { data, error } = await supabase
      .from('term_members')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DbTermMember;
  },

  /**
   * Remove member from a term
   */
  async removeTermMember(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('term_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Fetch all terms for an organization
   */
  async getTerms(organizationId: string): Promise<Term[]> {
    if (!isSupabaseConfigured || !organizationId) return [];
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: false });

    if (error) {
      console.warn('Could not fetch terms:', error.message);
      return [];
    }
    return (data || []).map((row) => mapTermFromDb(row as DbTerm));
  },
};
