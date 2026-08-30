import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type {
  Activity,
  ActivityParticipant,
  ActivityCategory,
  ActivityStatus,
  RegistrationStatus,
  AttendanceStatus,
  Member,
  Term,
} from '@/types';
import type {
  ActivityFilterParams,
  ParticipantFilterParams,
  ActivityListItem,
  ActivityDetail,
  ActivityParticipantItem,
} from '@/features/activities/types/activity.types';

import { mapMemberFromDb, type DbMember, type DbTerm } from './member.repository';

export function getRoleVietnameseLabel(role?: string | null): string {
  switch (role) {
    case 'leader':
    case 'lead':
      return 'Trưởng Đơn vị';
    case 'deputy':
    case 'vice_lead':
      return 'Phó Đơn vị';
    case 'admin':
      return 'Quản trị viên';
    case 'treasurer':
      return 'Thủ quỹ';
    case 'secretary':
      return 'Thư ký / Ủy viên';
    case 'board':
      return 'Ủy viên BCH';
    case 'member':
      return 'Hội viên';
    default:
      return 'Ban Chấp Hành';
  }
}

export type DbActivity = Database['public']['Tables']['activities']['Row'];
export type DbActivityInsert = Database['public']['Tables']['activities']['Insert'];
export type DbActivityUpdate = Database['public']['Tables']['activities']['Update'];
export type DbParticipant = Database['public']['Tables']['activity_participants']['Row'];
export type DbParticipantInsert = Database['public']['Tables']['activity_participants']['Insert'];
export type DbParticipantUpdate = Database['public']['Tables']['activity_participants']['Update'];

export interface ActivitiesListResponse {
  data: ActivityListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ActivityParticipantsStats {
  total: number;
  registered: number;
  confirmed: number;
  waitlist: number;
  cancelled: number;
  present: number;
  absent: number;
  excused: number;
  unmarked: number;
  participationRate: number;
}

export interface ActivityParticipantsResponse {
  data: ActivityParticipantItem[];
  totalCount: number;
  stats: ActivityParticipantsStats;
}

export function mapActivityFromDb(row: DbActivity): Activity {
  return {
    id: row.id,
    organizationId: row.organization_id,
    termId: row.term_id,
    code: row.code,
    title: row.title,
    description: row.description,
    category: row.category as ActivityCategory,
    status: row.status as ActivityStatus,
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    targetMembers: row.target_members ?? 0,
    bannerUrl: row.banner_url,
    leadMemberId: row.lead_member_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapParticipantFromDb(
  row: DbParticipant & { member?: DbMember | null }
): ActivityParticipant {
  return {
    id: row.id,
    activityId: row.activity_id,
    memberId: row.member_id,
    registrationStatus: row.registration_status as RegistrationStatus,
    registeredAt: row.registered_at,
    attendanceStatus: row.attendance_status as AttendanceStatus,
    attendedAt: row.attended_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    member: row.member
      ? {
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
        }
      : undefined,
  };
}

export const activityRepository = {
  /**
   * List activities for an organization with server-side filtering, sorting, pagination, and participant counts
   */
  async listActivities(
    organizationId: string,
    params: ActivityFilterParams = {}
  ): Promise<ActivitiesListResponse> {
    if (!isSupabaseConfigured || !organizationId) {
      return { data: [], totalCount: 0, page: 1, pageSize: 12, totalPages: 0 };
    }

    const {
      search = '',
      status = 'all',
      category = 'all',
      termId = 'all',
      startDateFrom,
      startDateTo,
      page = 1,
      pageSize = 12,
      sortBy = 'start_date',
      sortOrder = 'desc',
    } = params;

    let query = supabase
      .from('activities')
      .select(
        `
        id,
        organization_id,
        term_id,
        code,
        title,
        description,
        category,
        status,
        location,
        start_date,
        end_date,
        target_members,
        banner_url,
        lead_member_id,
        created_by,
        created_at,
        updated_at,
        term:terms (
          id,
          name,
          is_current
        ),
        creator:profiles!activities_created_by_fkey (
          id,
          full_name,
          email,
          avatar_url
        ),
        participants:activity_participants (
          id,
          registration_status,
          attendance_status
        )
      `,
        { count: 'exact' }
      )
      .eq('organization_id', organizationId);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (termId && termId !== 'all') {
      query = query.eq('term_id', termId);
    }
    if (startDateFrom) {
      query = query.gte('start_date', startDateFrom);
    }
    if (startDateTo) {
      query = query.lte('start_date', startDateTo);
    }

    if (search && search.trim()) {
      const keyword = search.trim();
      query = query.or(
        `title.ilike.%${keyword}%,code.ilike.%${keyword}%,location.ilike.%${keyword}%`
      );
    }

    // Sort order
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    const totalCount = count || 0;

    interface RawActivityRow {
      id: string;
      organization_id: string;
      term_id: string;
      code: string | null;
      title: string;
      description: string | null;
      category: ActivityListItem['category'];
      status: ActivityListItem['status'];
      location: string | null;
      start_date: string;
      end_date: string;
      target_members: number | null;
      banner_url: string | null;
      lead_member_id: string | null;
      created_by: string | null;
      created_at: string;
      updated_at: string;
      term:
        | { id: string; name: string; is_current: boolean }
        | { id: string; name: string; is_current: boolean }[]
        | null;
      creator:
        | { id: string; full_name: string; email: string; avatar_url: string | null }
        | { id: string; full_name: string; email: string; avatar_url: string | null }[]
        | null;
      participants:
        | { id: string; registration_status: string; attendance_status: string }[]
        | null;
    }

    const rows = (data || []) as unknown as RawActivityRow[];

    // Extract unique lead_member_ids for batch query (scoped strictly by organization_id)
    const leadMemberIds = Array.from(
      new Set(
        rows
          .map((r) => r.lead_member_id)
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      )
    );

    const leadMemberMap = new Map<
      string,
      {
        id: string;
        fullName: string;
        studentId: string | null;
        position: string | null;
        email: string | null;
        phone: string | null;
      }
    >();

    if (leadMemberIds.length > 0) {
      // 1. Check members table by ID
      const { data: leadMembersData, error: leadMembersError } = await supabase
        .from('members')
        .select('id, user_id, full_name, student_id, position, email, phone')
        .eq('organization_id', organizationId)
        .in('id', leadMemberIds);

      if (leadMembersError) {
        console.warn('[activityRepository.listActivities] Error batch fetching lead members:', leadMembersError);
      } else if (leadMembersData) {
        leadMembersData.forEach((m: {
          id: string;
          user_id?: string | null;
          full_name: string;
          student_id: string | null;
          position: string | null;
          email: string | null;
          phone: string | null;
        }) => {
          leadMemberMap.set(m.id, {
            id: m.id,
            fullName: m.full_name,
            studentId: m.student_id,
            position: m.position,
            email: m.email,
            phone: m.phone,
          });
          if (m.user_id) {
            leadMemberMap.set(m.user_id, {
              id: m.id,
              fullName: m.full_name,
              studentId: m.student_id,
              position: m.position,
              email: m.email,
              phone: m.phone,
            });
          }
        });
      }

      // 2. Check profiles and organization_memberships for remaining unmapped IDs
      const missingIds = leadMemberIds.filter((id) => !leadMemberMap.has(id));
      if (missingIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, student_id, email, phone')
          .in('id', missingIds);

        const { data: orgMems } = await supabase
          .from('organization_memberships')
          .select('user_id, role')
          .eq('organization_id', organizationId)
          .in('user_id', missingIds);

        const roleMap = new Map<string, string>();
        (orgMems || []).forEach((om: { user_id: string; role: string }) => {
          roleMap.set(om.user_id, om.role);
        });

        (profilesData || []).forEach((p: {
          id: string;
          full_name: string;
          student_id: string | null;
          email: string | null;
          phone: string | null;
        }) => {
          const rawRole = roleMap.get(p.id);
          const roleLabel = rawRole ? getRoleVietnameseLabel(rawRole) : 'Ban Chấp Hành';
          leadMemberMap.set(p.id, {
            id: p.id,
            fullName: p.full_name,
            studentId: p.student_id,
            position: roleLabel,
            email: p.email,
            phone: p.phone,
          });
        });
      }
    }

    // 3. Batch fetch activity_form_responses count for all activities
    const activityIds = rows.map((r) => r.id);
    const formResponsesCountMap = new Map<string, number>();

    if (activityIds.length > 0) {
      try {
        const { data: frData } = await supabase
          .from('activity_form_responses')
          .select('activity_id')
          .in('activity_id', activityIds);

        if (frData) {
          frData.forEach((fr: { activity_id: string }) => {
            if (fr.activity_id) {
              formResponsesCountMap.set(
                fr.activity_id,
                (formResponsesCountMap.get(fr.activity_id) || 0) + 1
              );
            }
          });
        }
      } catch (frErr) {
        console.warn('[activityRepository.listActivities] Error fetching form responses count:', frErr);
      }
    }

    const formattedData: ActivityListItem[] = rows.map((row) => {
      const termData = Array.isArray(row.term) ? row.term[0] : row.term;
      const creatorData = Array.isArray(row.creator) ? row.creator[0] : row.creator;
      const leadMemberData = row.lead_member_id ? leadMemberMap.get(row.lead_member_id) || null : null;
      const rawParticipants = row.participants || [];
      const extraFrCount = formResponsesCountMap.get(row.id) || 0;
      const totalParticipants = Math.max(rawParticipants.length, extraFrCount);
      const registeredParticipants = Math.max(
        rawParticipants.filter((p) => p.registration_status === 'registered').length,
        extraFrCount
      );

      const participantStats = {
        total: totalParticipants,
        registered: registeredParticipants,
        confirmed: rawParticipants.filter((p) => p.registration_status === 'confirmed').length,
        present: rawParticipants.filter((p) => p.attendance_status === 'present').length,
        absent: rawParticipants.filter((p) => p.attendance_status === 'absent').length,
      };

      return {
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
        targetMembers: row.target_members || 0,
        bannerUrl: row.banner_url,
        leadMemberId: row.lead_member_id,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        term: termData
          ? {
              id: termData.id,
              name: termData.name,
              isCurrent: termData.is_current,
            }
          : null,
        leadMember: leadMemberData,
        creator: creatorData
          ? {
              id: creatorData.id,
              fullName: creatorData.full_name,
              email: creatorData.email,
              avatarUrl: creatorData.avatar_url,
            }
          : null,
        participantStats,
      };
    });

    return {
      data: formattedData,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  },

  /**
   * Get single activity detail by ID with term, lead_member, creator, and participant breakdown
   */
  async getById(id: string, organizationId?: string): Promise<ActivityDetail | null> {
    if (!isSupabaseConfigured || !id) return null;

    let query = supabase
      .from('activities')
      .select(
        `
        id,
        organization_id,
        term_id,
        plan_id,
        code,
        title,
        description,
        category,
        status,
        location,
        start_date,
        end_date,
        target_members,
        banner_url,
        lead_member_id,
        created_by,
        created_at,
        updated_at,
        term:terms (
          id,
          name,
          is_current
        ),
        plan:plans (
          id,
          name,
          code,
          description
        ),
        creator:profiles!activities_created_by_fkey (
          id,
          full_name,
          email,
          avatar_url
        ),
        participants:activity_participants (
          id,
          registration_status,
          attendance_status
        )
      `
      )
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return null;

    interface RawDetailRow {
      id: string;
      organization_id: string;
      term_id: string;
      plan_id: string | null;
      code: string | null;
      title: string;
      description: string | null;
      category: ActivityDetail['category'];
      status: ActivityDetail['status'];
      location: string | null;
      start_date: string;
      end_date: string;
      target_members: number | null;
      banner_url: string | null;
      lead_member_id: string | null;
      created_by: string | null;
      created_at: string;
      updated_at: string;
      term:
        | { id: string; name: string; is_current: boolean }
        | { id: string; name: string; is_current: boolean }[]
        | null;
      plan:
        | { id: string; name: string; code?: string | null; description?: string | null }
        | { id: string; name: string; code?: string | null; description?: string | null }[]
        | null;
      creator:
        | { id: string; full_name: string; email: string; avatar_url: string | null }
        | { id: string; full_name: string; email: string; avatar_url: string | null }[]
        | null;
      participants:
        | { id: string; registration_status: string; attendance_status: string }[]
        | null;
    }

    const row = data as unknown as RawDetailRow;
    const termData = Array.isArray(row.term) ? row.term[0] : row.term;
    const planData = Array.isArray(row.plan) ? row.plan[0] : row.plan;
    const creatorData = Array.isArray(row.creator) ? row.creator[0] : row.creator;
    const rawParticipants = row.participants || [];

    // Safely query lead member if lead_member_id exists, isolated by organization_id
    let leadMemberData: {
      id: string;
      fullName: string;
      studentId: string | null;
      position: string | null;
      email: string | null;
      phone: string | null;
    } | null = null;

    if (row.lead_member_id) {
      // 1. Try members table by ID or user_id
      const { data: memberData, error: memberErr } = await supabase
        .from('members')
        .select('id, user_id, full_name, student_id, position, email, phone')
        .eq('organization_id', row.organization_id)
        .or(`id.eq.${row.lead_member_id},user_id.eq.${row.lead_member_id}`)
        .maybeSingle();

      if (memberErr) {
        console.warn('[activityRepository.getById] Error fetching lead member:', memberErr);
      } else if (memberData) {
        const m = memberData as {
          id: string;
          full_name: string;
          student_id: string | null;
          position: string | null;
          email: string | null;
          phone: string | null;
        };
        leadMemberData = {
          id: m.id,
          fullName: m.full_name,
          studentId: m.student_id,
          position: m.position,
          email: m.email,
          phone: m.phone,
        };
      } else {
        // 2. Fallback to profiles and organization_memberships
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, student_id, email, phone')
          .eq('id', row.lead_member_id)
          .maybeSingle();

        if (profileData) {
          const prof = profileData as any;
          const { data: orgMem } = await supabase
            .from('organization_memberships')
            .select('role')
            .eq('organization_id', row.organization_id)
            .eq('user_id', row.lead_member_id)
            .maybeSingle();

          const mem = orgMem as any;
          const roleLabel = mem?.role ? getRoleVietnameseLabel(mem.role) : 'Ban Chấp Hành';
          leadMemberData = {
            id: prof.id,
            fullName: prof.full_name,
            studentId: prof.student_id,
            position: roleLabel,
            email: prof.email,
            phone: prof.phone,
          };
        }
      }
    }

    // Also count form responses for this activity
    let extraFormResponsesCount = 0;
    if (isSupabaseConfigured) {
      try {
        const { count: frCount } = await supabase
          .from('activity_form_responses')
          .select('*', { count: 'exact', head: true })
          .eq('activity_id', row.id);
        extraFormResponsesCount = frCount || 0;
      } catch {
        // ignore
      }
    }

    const totalParticipantsCount = Math.max(rawParticipants.length, extraFormResponsesCount);

    const participantStats = {
      total: totalParticipantsCount,
      registered: Math.max(rawParticipants.filter((p) => p.registration_status === 'registered').length, extraFormResponsesCount),
      confirmed: rawParticipants.filter((p) => p.registration_status === 'confirmed').length,
      present: rawParticipants.filter((p) => p.attendance_status === 'present').length,
      absent: rawParticipants.filter((p) => p.attendance_status === 'absent').length,
    };

    return {
      id: row.id,
      organizationId: row.organization_id,
      termId: row.term_id,
      planId: row.plan_id,
      plan: planData
        ? {
            id: planData.id,
            name: planData.name,
            code: planData.code,
            description: planData.description,
          }
        : null,
      code: row.code,
      title: row.title,
      description: row.description,
      category: row.category,
      status: row.status,
      location: row.location,
      startDate: row.start_date,
      endDate: row.end_date,
      targetMembers: row.target_members || 0,
      bannerUrl: row.banner_url,
      leadMemberId: row.lead_member_id,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      term: termData
        ? {
            id: termData.id,
            name: termData.name,
            isCurrent: termData.is_current,
          }
        : null,
      leadMember: leadMemberData,
      creator: creatorData
        ? {
            id: creatorData.id,
            fullName: creatorData.full_name,
            email: creatorData.email,
            avatarUrl: creatorData.avatar_url,
          }
        : null,
      participantStats,
    };
  },

  /**
   * Find activity by code within an organization (for duplicate check)
   */
  async findByCode(organizationId: string, code: string): Promise<Activity | null> {
    if (!isSupabaseConfigured || !organizationId || !code) return null;
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('code', code.trim())
      .maybeSingle();

    if (error) throw error;
    return data ? mapActivityFromDb(data as DbActivity) : null;
  },

  /**
   * Create an activity record
   */
  async create(payload: DbActivityInsert): Promise<Activity> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { data, error } = await supabase
      .from('activities')
      .insert(payload as never)
      .select()
      .single();

    if (error) throw error;
    return mapActivityFromDb(data as DbActivity);
  },

  /**
   * Update an activity record
   */
  async update(id: string, payload: DbActivityUpdate): Promise<Activity> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { data, error } = await supabase
      .from('activities')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapActivityFromDb(data as DbActivity);
  },

  /**
   * Delete an activity record
   */
  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * List participants for an activity with member details and status counts
   */
  async getParticipants(
    activityId: string,
    params: ParticipantFilterParams = {}
  ): Promise<ActivityParticipantsResponse> {
    if (!isSupabaseConfigured || !activityId) {
      return {
        data: [],
        totalCount: 0,
        stats: {
          total: 0,
          registered: 0,
          confirmed: 0,
          waitlist: 0,
          cancelled: 0,
          present: 0,
          absent: 0,
          excused: 0,
          unmarked: 0,
          participationRate: 0,
        },
      };
    }

    const { search = '', registrationStatus = 'all', attendanceStatus = 'all' } = params;

    let query = supabase
      .from('activity_participants')
      .select(
        `
        id,
        activity_id,
        member_id,
        registration_status,
        registered_at,
        attendance_status,
        attended_at,
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
      `
      )
      .eq('activity_id', activityId)
      .order('registered_at', { ascending: false });

    if (registrationStatus && registrationStatus !== 'all') {
      query = query.eq('registration_status', registrationStatus);
    }
    if (attendanceStatus && attendanceStatus !== 'all') {
      query = query.eq('attendance_status', attendanceStatus);
    }

    const { data, error } = await query;
    if (error) throw error;

    interface RawParticipantRow {
      id: string;
      activity_id: string;
      member_id: string;
      registration_status: ActivityParticipantItem['registrationStatus'];
      registered_at: string;
      attendance_status: ActivityParticipantItem['attendanceStatus'];
      attended_at: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
      member:
        | {
            id: string;
            organization_id: string;
            user_id: string | null;
            student_id: string;
            full_name: string;
            email: string | null;
            phone: string | null;
            class_name: string | null;
            major: string | null;
            cohort: string | null;
            position: string | null;
            status: Member['status'];
            joined_date: string | null;
            notes: string | null;
            created_at: string;
            updated_at: string;
          }
        | {
            id: string;
            organization_id: string;
            user_id: string | null;
            student_id: string;
            full_name: string;
            email: string | null;
            phone: string | null;
            class_name: string | null;
            major: string | null;
            cohort: string | null;
            position: string | null;
            status: Member['status'];
            joined_date: string | null;
            notes: string | null;
            created_at: string;
            updated_at: string;
          }[]
        | null;
    }

    const rows = (data || []) as unknown as RawParticipantRow[];

    let formatted: ActivityParticipantItem[] = rows
      .filter((r) => r.member !== null)
      .map((r) => {
        const m = Array.isArray(r.member) ? r.member[0] : r.member!;
        return {
          id: r.id,
          activityId: r.activity_id,
          memberId: r.member_id,
          registrationStatus: r.registration_status,
          registeredAt: r.registered_at,
          attendanceStatus: r.attendance_status,
          attendedAt: r.attended_at,
          notes: r.notes,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          member: {
            id: m.id,
            organizationId: m.organization_id,
            userId: m.user_id,
            studentId: m.student_id,
            fullName: m.full_name,
            email: m.email,
            phone: m.phone,
            className: m.class_name,
            major: m.major,
            cohort: m.cohort,
            position: m.position,
            status: m.status,
            joinedDate: m.joined_date,
            notes: m.notes,
            createdAt: m.created_at,
            updatedAt: m.updated_at,
          },
        };
      });

    // Also fetch all Google Form / Google Sheet responses for this activity to include external registrants
    let formResponsesRows: any[] = [];
    if (isSupabaseConfigured) {
      try {
        const { data: frData } = await supabase
          .from('activity_form_responses')
          .select('*')
          .eq('activity_id', activityId);
        formResponsesRows = frData || [];
      } catch (err) {
        console.warn('Error fetching form responses in getParticipants:', err);
      }
    } else {
      const stored = localStorage.getItem(`chihoi_form_responses_${activityId}`);
      if (stored) {
        try {
          formResponsesRows = JSON.parse(stored);
        } catch {
          // ignore
        }
      }
    }

    const existingMemberIds = new Set(formatted.map((p) => p.memberId));
    const existingStudentIds = new Set(
      formatted.map((p) => p.member?.studentId?.trim().toUpperCase()).filter(Boolean)
    );

    for (const fr of formResponsesRows) {
      const sId = (fr.student_id || fr.studentId || '').trim().toUpperCase();
      const mId = fr.matched_member_id || fr.matchedMemberId;
      
      // Skip if already in participants list
      if (mId && existingMemberIds.has(mId)) continue;
      if (sId && existingStudentIds.has(sId)) continue;

      const fName = fr.full_name || fr.fullName || fr.parsed_full_name || 'Người tham gia';
      const cName = fr.class_name || fr.className || fr.parsed_class_name || null;
      const email = fr.respondent_email || fr.respondentEmail || null;
      const phone = fr.phone_number || fr.phoneNumber || fr.parsed_phone || null;
      const subAt = fr.submitted_at || fr.submittedAt || fr.created_at || new Date().toISOString();
      const guestKey = `resp_${fr.id || fr.google_response_id || fr.googleResponseId || Math.random()}`;

      // Parse attendance from notes if recorded
      let attendanceStatus: ActivityParticipantItem['attendanceStatus'] = 'unmarked';
      if (fr.notes) {
        if (/\[attendance:present\]/i.test(fr.notes)) attendanceStatus = 'present';
        else if (/\[attendance:absent\]/i.test(fr.notes)) attendanceStatus = 'absent';
      }

      formatted.push({
        id: guestKey,
        activityId,
        memberId: guestKey,
        registrationStatus: 'registered',
        registeredAt: subAt,
        attendanceStatus,
        attendedAt: attendanceStatus === 'present' ? fr.updated_at || subAt : null,
        notes: fr.notes || 'Đăng ký qua Google Forms / Google Sheet',
        createdAt: subAt,
        updatedAt: subAt,
        member: {
          id: guestKey,
          organizationId: fr.organization_id || fr.organizationId || '',
          userId: null,
          studentId: sId || null,
          fullName: fName,
          email,
          phone,
          className: cName,
          major: null,
          cohort: null,
          position: 'Sinh viên ngoài / Khách mời',
          status: 'active',
          joinedDate: null,
          notes: fr.notes || null,
          createdAt: subAt,
          updatedAt: subAt,
        },
      });
    }

    const totalCount = formatted.length;
    const presentCount = formatted.filter((p) => p.attendanceStatus === 'present').length;
    const participationRate = totalCount > 0 ? Number(((presentCount / totalCount) * 100).toFixed(1)) : 0;

    const stats: ActivityParticipantsStats = {
      total: totalCount,
      registered: formatted.filter((p) => p.registrationStatus === 'registered').length,
      confirmed: formatted.filter((p) => p.registrationStatus === 'confirmed').length,
      waitlist: formatted.filter((p) => p.registrationStatus === 'waitlist').length,
      cancelled: formatted.filter((p) => p.registrationStatus === 'cancelled').length,
      present: presentCount,
      absent: formatted.filter((p) => p.attendanceStatus === 'absent').length,
      excused: formatted.filter((p) => p.attendanceStatus === 'excused').length,
      unmarked: formatted.filter((p) => p.attendanceStatus === 'unmarked').length,
      participationRate,
    };

    if (search && search.trim()) {
      const keyword = search.trim().toLowerCase();
      formatted = formatted.filter(
        (p) =>
          p.member.fullName.toLowerCase().includes(keyword) ||
          (p.member.studentId && p.member.studentId.toLowerCase().includes(keyword)) ||
          (p.member.className && p.member.className.toLowerCase().includes(keyword)) ||
          (p.member.email && p.member.email.toLowerCase().includes(keyword))
      );
    }

    return {
      data: formatted,
      totalCount: formatted.length,
      stats,
    };
  },

  /**
   * Get single participant by ID (supports both activity_participants UUID and activity_form_responses resp_ prefix)
   */
  async getParticipantById(id: string): Promise<ActivityParticipant | null> {
    if (!isSupabaseConfigured || !id) return null;

    if (id.startsWith('resp_')) {
      const rawRespId = id.replace('resp_', '');
      const { data: frData } = await supabase
        .from('activity_form_responses')
        .select('*')
        .eq('id', rawRespId)
        .maybeSingle();

      if (frData) {
        const fr = frData as any;
        const sId = fr.parsed_student_id || fr.student_id || fr.studentId || null;
        const fName = fr.parsed_full_name || fr.full_name || fr.fullName || fr.respondent_email || 'Khách đăng ký';
        const phone = fr.parsed_phone || fr.phone_number || fr.phoneNumber || null;
        const cName = fr.parsed_class_name || fr.class_name || fr.className || null;
        const email = fr.respondent_email || fr.respondentEmail || null;

        let attendanceStatus: AttendanceStatus = 'unmarked';
        if (fr.notes) {
          if (/\[attendance:present\]/i.test(fr.notes)) attendanceStatus = 'present';
          else if (/\[attendance:absent\]/i.test(fr.notes)) attendanceStatus = 'absent';
        }

        return {
          id,
          activityId: fr.activity_id,
          memberId: fr.matched_member_id || id,
          registrationStatus: 'registered',
          registeredAt: fr.submitted_at || new Date().toISOString(),
          attendanceStatus,
          attendedAt: attendanceStatus === 'present' ? fr.updated_at || fr.submitted_at : null,
          notes: fr.notes || null,
          createdAt: fr.created_at || new Date().toISOString(),
          updatedAt: fr.updated_at || new Date().toISOString(),
          member: {
            id: fr.matched_member_id || id,
            organizationId: fr.organization_id || '',
            userId: null,
            studentId: sId,
            fullName: fName,
            email,
            phone,
            className: cName,
            major: null,
            cohort: null,
            position: 'Khách đăng ký',
            status: 'active',
            joinedDate: null,
            notes: null,
            createdAt: fr.created_at || new Date().toISOString(),
            updatedAt: fr.updated_at || new Date().toISOString(),
          },
        };
      }
      return null;
    }

    const { data, error } = await supabase
      .from('activity_participants')
      .select('*, member:members (*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data
      ? mapParticipantFromDb(data as unknown as DbParticipant & { member?: DbMember | null })
      : null;
  },

  /**
   * Check if a member is already enrolled in an activity
   */
  async getParticipantByActivityAndMember(
    activityId: string,
    memberId: string
  ): Promise<ActivityParticipant | null> {
    if (!isSupabaseConfigured || !activityId || !memberId) return null;
    const { data, error } = await supabase
      .from('activity_participants')
      .select('*, member:members (*)')
      .eq('activity_id', activityId)
      .eq('member_id', memberId)
      .maybeSingle();

    if (error) throw error;
    return data
      ? mapParticipantFromDb(data as unknown as DbParticipant & { member?: DbMember | null })
      : null;
  },

  /**
   * Add a single participant
   */
  async addParticipant(payload: DbParticipantInsert): Promise<ActivityParticipant> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { data, error } = await supabase
      .from('activity_participants')
      .insert(payload as never)
      .select('*, member:members (*)')
      .single();

    if (error) throw error;
    return mapParticipantFromDb(data as unknown as DbParticipant & { member?: DbMember | null });
  },

  /**
   * Update participant registration or attendance (isolated update, never pollutes members directory)
   */
  async updateParticipant(id: string, payload: DbParticipantUpdate): Promise<ActivityParticipant> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    if (id.startsWith('resp_')) {
      const rawRespId = id.replace('resp_', '');
      const { data: frData, error: frErr } = await supabase
        .from('activity_form_responses')
        .select('*')
        .eq('id', rawRespId)
        .maybeSingle();

      if (frErr || !frData) {
        throw new Error('Không tìm thấy thông tin đăng ký biểu mẫu tương ứng');
      }

      const fr = frData as any;
      let currentNotes = fr.notes || '';
      // Strip previous attendance markers
      currentNotes = currentNotes.replace(/\[attendance:(present|absent)\]/gi, '').trim();

      if (payload.attendance_status === 'present') {
        currentNotes = currentNotes ? `${currentNotes} [attendance:present]` : '[attendance:present]';
      } else if (payload.attendance_status === 'absent') {
        currentNotes = currentNotes ? `${currentNotes} [attendance:absent]` : '[attendance:absent]';
      }

      if (payload.notes) {
        currentNotes = currentNotes ? `${currentNotes} - ${payload.notes}` : payload.notes;
      }

      const { data: updatedResp, error: upErr } = await supabase
        .from('activity_form_responses')
        .update({
          notes: currentNotes || null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', rawRespId)
        .select()
        .single();

      if (upErr) throw upErr;

      const updated = updatedResp as any;
      const sId = updated.parsed_student_id || updated.student_id || null;
      const fName = updated.parsed_full_name || updated.full_name || updated.respondent_email || 'Người tham gia';

      return {
        id,
        activityId: updated.activity_id,
        memberId: updated.matched_member_id || id,
        registrationStatus: (payload.registration_status as RegistrationStatus) || 'registered',
        registeredAt: updated.submitted_at || new Date().toISOString(),
        attendanceStatus: (payload.attendance_status as AttendanceStatus) || 'unmarked',
        attendedAt: payload.attendance_status === 'present' ? new Date().toISOString() : null,
        notes: currentNotes,
        createdAt: updated.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        member: {
          id: updated.matched_member_id || id,
          organizationId: updated.organization_id || '',
          userId: null,
          studentId: sId,
          fullName: fName,
          email: updated.respondent_email,
          phone: updated.parsed_phone || updated.phone_number || null,
          className: updated.parsed_class_name || updated.class_name || null,
          major: null,
          cohort: null,
          position: 'Sinh viên ngoài / Khách mời',
          status: 'active',
          joinedDate: null,
          notes: currentNotes,
          createdAt: updated.created_at || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    }

    const { data, error } = await supabase
      .from('activity_participants')
      .update(payload as never)
      .eq('id', id)
      .select('*, member:members (*)')
      .single();

    if (error) throw error;
    return mapParticipantFromDb(data as unknown as DbParticipant & { member?: DbMember | null });
  },

  /**
   * Remove a participant from activity (supports both activity_participants and resp_ form responses)
   */
  async removeParticipant(id: string): Promise<void> {
    if (!isSupabaseConfigured || !id) return;

    if (id.startsWith('resp_')) {
      const rawRespId = id.replace('resp_', '');
      const { error } = await supabase
        .from('activity_form_responses')
        .delete()
        .eq('id', rawRespId);

      if (error) throw error;
      return;
    }

    const { error } = await supabase
      .from('activity_participants')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Bulk add multiple participants to an activity
   */
  async bulkAddParticipants(payloads: DbParticipantInsert[]): Promise<ActivityParticipant[]> {
    if (!isSupabaseConfigured || payloads.length === 0) return [];
    const { data, error } = await supabase
      .from('activity_participants')
      .insert(payloads as never)
      .select('*, member:members (*)');

    if (error) throw error;
    return ((data as unknown as (DbParticipant & { member?: DbMember | null })[]) || []).map(
      mapParticipantFromDb
    );
  },

  /**
   * Bulk update attendance status for a list of participant IDs
   */
  async bulkUpdateAttendance(
    participantIds: string[],
    attendanceStatus: AttendanceStatus,
    attendedAt?: string | null
  ): Promise<void> {
    if (!isSupabaseConfigured || participantIds.length === 0) return;

    const realIds = participantIds.filter((pId) => !pId.startsWith('resp_'));
    const respIds = participantIds.filter((pId) => pId.startsWith('resp_'));

    if (realIds.length > 0) {
      const { error } = await supabase
        .from('activity_participants')
        .update({
          attendance_status: attendanceStatus,
          attended_at:
            attendedAt !== undefined
              ? attendedAt
              : attendanceStatus === 'present'
              ? new Date().toISOString()
              : null,
        } as never)
        .in('id', realIds);

      if (error) throw error;
    }

    for (const rId of respIds) {
      try {
        await activityRepository.updateParticipant(rId, {
          attendance_status: attendanceStatus,
          attended_at: attendedAt,
        });
      } catch (err) {
        console.warn('Could not update attendance for form response ID:', rId, err);
      }
    }
  },

  /**
   * Get available chapter members who have not yet registered for this activity
   */
  async getAvailableMembers(
    organizationId: string,
    activityId: string,
    search?: string
  ): Promise<Member[]> {
    if (!isSupabaseConfigured || !organizationId || !activityId) return [];

    // 1. Query existing participant member IDs
    const { data: assignedData, error: assignedError } = await supabase
      .from('activity_participants')
      .select('member_id')
      .eq('activity_id', activityId);

    if (assignedError) throw assignedError;
    const assignedMemberIds = new Set((assignedData || []).map((p: { member_id: string }) => p.member_id));

    // 2. Query organization members
    let query = supabase
      .from('members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('full_name', { ascending: true })
      .limit(150);

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(
        `full_name.ilike.%${term}%,student_id.ilike.%${term}%,class_name.ilike.%${term}%`
      );
    }

    const { data: membersData, error: membersError } = await query;
    if (membersError) throw membersError;

    const allMembers = (membersData || []).map((m: DbMember) => ({
      id: m.id,
      organizationId: m.organization_id,
      userId: m.user_id,
      studentId: m.student_id,
      fullName: m.full_name,
      email: m.email,
      phone: m.phone,
      className: m.class_name,
      major: m.major,
      cohort: m.cohort,
      position: m.position,
      status: m.status as Member['status'],
      joinedDate: m.joined_date,
      notes: m.notes,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    return allMembers.filter((m) => !assignedMemberIds.has(m.id));
  },

  /**
   * Get terms for organization
   */
  async getTerms(organizationId: string): Promise<Term[]> {
    if (!isSupabaseConfigured || !organizationId) return [];
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return (data || []).map((t: DbTerm) => ({
      id: t.id,
      organizationId: t.organization_id,
      name: t.name,
      startDate: t.start_date,
      endDate: t.end_date,
      status: t.status as Term['status'],
      isCurrent: t.is_current,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
  },

  /**
   * Fetch candidate members for the activity lead person (BCH / Executive committee + Members roster)
   */
  async getLeadCandidates(organizationId: string): Promise<Member[]> {
    if (!isSupabaseConfigured || !organizationId) return [];

    // 1. Fetch active organization memberships with profile (Chi hội trưởng, Chi hội phó, Admin, Thủ quỹ, Thư ký, Ủy viên...)
    const { data: memberships, error: memError } = await supabase
      .from('organization_memberships')
      .select(
        `
        id,
        user_id,
        role,
        status,
        profile:profiles (
          id,
          full_name,
          email,
          avatar_url,
          student_id,
          phone
        )
      `
      )
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (memError) {
      console.warn('[activityRepository.getLeadCandidates] Error fetching organization memberships:', memError);
    }

    // 2. Fetch active members in members roster
    const { data: memberRoster, error: rosterError } = await supabase
      .from('members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('full_name', { ascending: true });

    if (rosterError) {
      console.warn('[activityRepository.getLeadCandidates] Error fetching members roster:', rosterError);
    }

    const rosterList = (memberRoster || []) as unknown as DbMember[];
    const candidates: Member[] = [];
    const seenUserIds = new Set<string>();
    const seenMemberIds = new Set<string>();

    // Maps for fast matching
    const memberByUserId = new Map<string, DbMember>();
    const memberByEmail = new Map<string, DbMember>();
    rosterList.forEach((m) => {
      if (m.user_id) memberByUserId.set(m.user_id, m);
      if (m.email) memberByEmail.set(m.email.toLowerCase().trim(), m);
    });

    interface MembershipWithProfile {
      id: string;
      user_id: string;
      role: string;
      status: string;
      profile: {
        id: string;
        full_name: string;
        email: string;
        avatar_url: string | null;
        student_id: string | null;
        phone: string | null;
      } | null;
    }

    const mList = (memberships || []) as unknown as MembershipWithProfile[];

    // Priority 1: Add BCH members first with accurate role label & valid members.id
    for (const m of mList) {
      if (!m.profile) continue;
      const uId = m.user_id || m.profile.id;
      seenUserIds.add(uId);

      const matchingMember =
        memberByUserId.get(uId) ||
        (m.profile.email ? memberByEmail.get(m.profile.email.toLowerCase().trim()) : undefined);

      const roleLabel = getRoleVietnameseLabel(m.role);

      if (matchingMember) {
        if (!seenMemberIds.has(matchingMember.id)) {
          seenMemberIds.add(matchingMember.id);
          candidates.push({
            ...mapMemberFromDb(matchingMember),
            position: roleLabel,
          });
        }
      } else {
        // Return pure candidate object for dropdown without touching members table
        candidates.push({
          id: uId,
          organizationId,
          userId: uId,
          studentId: m.profile.student_id,
          fullName: m.profile.full_name || m.profile.email || 'Ban Chấp Hành',
          email: m.profile.email,
          phone: m.profile.phone,
          className: null,
          major: null,
          cohort: null,
          position: roleLabel,
          status: 'active',
          joinedDate: new Date().toISOString().split('T')[0],
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Priority 2: Add members from roster who hold an Executive Board / BCH position
    const boardKeywords = [
      'trưởng', 'phó', 'chủ nhiệm', 'ủy viên', 'uy vien',
      'thủ quỹ', 'thu quy', 'thư ký', 'thu ky', 'bch', 'ban chấp hành',
      'ban chap hanh', 'quản trị', 'quan tri', 'leader', 'deputy', 'admin',
      'treasurer', 'secretary', 'board'
    ];

    rosterList.forEach((m) => {
      if (!seenMemberIds.has(m.id) && (!m.user_id || !seenUserIds.has(m.user_id))) {
        const p = (m.position || '').toLowerCase();
        const isBoardPosition = boardKeywords.some((kw) => p.includes(kw));
        if (isBoardPosition) {
          seenMemberIds.add(m.id);
          candidates.push(mapMemberFromDb(m));
        }
      }
    });

    return candidates;
  },
};
