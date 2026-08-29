import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type {
  CollabActivity,
  CollabTask,
  CollabTransaction,
  CollabMemberOption,
  OrganizationRole,
} from '@/types';

export type DbCollabActivity = Database['public']['Tables']['collab_activities']['Row'];
export type DbCollabActivityInsert = Database['public']['Tables']['collab_activities']['Insert'];
export type DbCollabActivityUpdate = Database['public']['Tables']['collab_activities']['Update'];

export type DbCollabTask = Database['public']['Tables']['collab_tasks']['Row'];
export type DbCollabTaskInsert = Database['public']['Tables']['collab_tasks']['Insert'];
export type DbCollabTaskUpdate = Database['public']['Tables']['collab_tasks']['Update'];

export type DbCollabTransaction = Database['public']['Tables']['collab_transactions']['Row'];
export type DbCollabTransactionInsert = Database['public']['Tables']['collab_transactions']['Insert'];
export type DbCollabTransactionUpdate = Database['public']['Tables']['collab_transactions']['Update'];

// Strict list of valid columns in database table `collab_activities`
const VALID_COLLAB_ACTIVITY_COLUMNS = new Set([
  'id',
  'plan_id',
  'title',
  'description',
  'location',
  'start_date',
  'end_date',
  'status',
  'created_by',
  'created_at',
  'organization_id',
  'banner_url',
  'category',
  'code',
  'lead_organization_id',
]);

function sanitizeCollabActivityPayload<T extends Record<string, any>>(input: T): Partial<T> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (VALID_COLLAB_ACTIVITY_COLUMNS.has(key) && value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized as Partial<T>;
}

// Strict list of valid columns in database table `collab_tasks`
const VALID_COLLAB_TASK_COLUMNS = new Set([
  'id',
  'collab_activity_id',
  'title',
  'description',
  'assigned_to',
  'organization_id',
  'status',
  'priority',
  'due_date',
  'created_at',
]);

function sanitizeCollabTaskPayload<T extends Record<string, any>>(input: T): Partial<T> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (VALID_COLLAB_TASK_COLUMNS.has(key) && value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized as Partial<T>;
}

export const collabRepository = {
  // ==========================================
  // 1. COLLAB ACTIVITIES
  // ==========================================
  async listCollabActivities(planId: string): Promise<CollabActivity[]> {
    if (!isSupabaseConfigured || !planId) return [];

    try {
      const { data, error } = await supabase
        .from('collab_activities')
        .select(`
          *,
          lead_organization:organizations!lead_organization_id(
            id,
            name,
            code,
            logo_url
          ),
          tasks:collab_tasks(
            id,
            status
          )
        `)
        .eq('plan_id', planId)
        .order('start_date', { ascending: true });

      if (error) {
        console.warn('Error fetching with relations for collab_activities, falling back to basic query:', error.message);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('collab_activities')
          .select(`
            *,
            lead_organization:organizations!lead_organization_id(
              id,
              name,
              code,
              logo_url
            )
          `)
          .eq('plan_id', planId)
          .order('start_date', { ascending: true });

        if (fallbackError) {
          console.error('Error listing collab activities:', fallbackError);
          return [];
        }

        return (fallbackData || []).map((row: any) => ({
          id: row.id,
          planId: row.plan_id,
          leadOrganizationId: row.lead_organization_id,
          organizationId: row.organization_id,
          title: row.title,
          code: row.code,
          description: row.description,
          category: row.category,
          status: row.status,
          location: row.location,
          startDate: row.start_date,
          endDate: row.end_date,
          bannerUrl: row.banner_url,
          createdBy: row.created_by,
          createdAt: row.created_at,
          leadOrganization: row.lead_organization,
          tasksCount: 0,
          completedTasksCount: 0,
        }));
      }

      return (data || []).map((row: any) => {
        const tasks = Array.isArray(row.tasks) ? row.tasks : [];
        return {
          id: row.id,
          planId: row.plan_id,
          leadOrganizationId: row.lead_organization_id,
          organizationId: row.organization_id,
          title: row.title,
          code: row.code,
          description: row.description,
          category: row.category,
          status: row.status,
          location: row.location,
          startDate: row.start_date,
          endDate: row.end_date,
          bannerUrl: row.banner_url,
          createdBy: row.created_by,
          createdAt: row.created_at,
          leadOrganization: row.lead_organization,
          tasksCount: tasks.length,
          completedTasksCount: tasks.filter((t: any) => t.status === 'done' || t.status === 'completed').length,
        };
      });
    } catch (err) {
      console.error('Unexpected error listing collab activities:', err);
      return [];
    }
  },

  async getCollabActivityDetail(activityId: string): Promise<CollabActivity | null> {
    if (!isSupabaseConfigured || !activityId) return null;

    try {
      const { data, error } = await supabase
        .from('collab_activities')
        .select(`
          *,
          lead_organization:organizations!lead_organization_id(
            id,
            name,
            code,
            logo_url
          )
        `)
        .eq('id', activityId)
        .single();

      if (error) {
        console.error('Error fetching collab activity detail:', error);
        return null;
      }

      const row = data as any;
      return {
        id: row.id,
        planId: row.plan_id,
        leadOrganizationId: row.lead_organization_id,
        organizationId: row.organization_id,
        title: row.title,
        code: row.code,
        description: row.description,
        category: row.category,
        status: row.status,
        location: row.location,
        startDate: row.start_date,
        endDate: row.end_date,
        bannerUrl: row.banner_url,
        createdBy: row.created_by,
        createdAt: row.created_at,
        leadOrganization: row.lead_organization,
      };
    } catch (err) {
      console.error('Failed to get collab activity:', err);
      return null;
    }
  },

  async createCollabActivity(payload: DbCollabActivityInsert): Promise<CollabActivity> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const sanitizedPayload = sanitizeCollabActivityPayload(payload);

    const { data, error } = await supabase
      .from('collab_activities')
      .insert(sanitizedPayload as any)
      .select(`
        *,
        lead_organization:organizations!lead_organization_id(
          id,
          name,
          code,
          logo_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating collab activity:', error);
      throw error;
    }

    const row = data as any;
    return {
      id: row.id,
      planId: row.plan_id,
      leadOrganizationId: row.lead_organization_id,
      organizationId: row.organization_id,
      title: row.title,
      code: row.code,
      description: row.description,
      category: row.category,
      status: row.status,
      location: row.location,
      startDate: row.start_date,
      endDate: row.end_date,
      bannerUrl: row.banner_url,
      createdBy: row.created_by,
      createdAt: row.created_at,
      leadOrganization: row.lead_organization,
    };
  },

  async updateCollabActivity(id: string, payload: DbCollabActivityUpdate): Promise<CollabActivity> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const sanitizedPayload = sanitizeCollabActivityPayload(payload);

    const { error } = await supabase
      .from('collab_activities')
      .update(sanitizedPayload as never)
      .eq('id', id);

    if (error) throw error;

    const updated = await this.getCollabActivityDetail(id);
    if (!updated) throw new Error('Failed to fetch updated collab activity');
    return updated;
  },

  async deleteCollabActivity(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    // Delete associated tasks first
    await supabase.from('collab_tasks').delete().eq('collab_activity_id', id);

    const { error } = await supabase
      .from('collab_activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==========================================
  // 2. COLLAB TASKS
  // ==========================================
  async listCollabTasks(planId: string, collabActivityId?: string): Promise<CollabTask[]> {
    if (!isSupabaseConfigured || !planId) return [];

    try {
      let actIds: string[] = [];
      if (!collabActivityId) {
        // Since collab_tasks does not have plan_id column, query activities of this plan
        const { data: acts } = await supabase
          .from('collab_activities')
          .select('id')
          .eq('plan_id', planId);
        actIds = (acts || []).map((a: any) => a.id).filter(Boolean);
        if (actIds.length === 0) return [];
      }

      let query = supabase
        .from('collab_tasks')
        .select(`
          *,
          organization:organizations!collab_tasks_organization_id_fkey(
            id,
            name,
            code,
            logo_url
          ),
          assignee:profiles!collab_tasks_assigned_to_fkey(
            id,
            full_name,
            avatar_url,
            email
          ),
          collab_activity:collab_activities(
            id,
            title,
            code
          )
        `);

      if (collabActivityId) {
        query = query.eq('collab_activity_id', collabActivityId);
      } else {
        query = query.in('collab_activity_id', actIds);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.warn('Fallback select for collab_tasks:', error.message);
        let fallbackQuery = supabase
          .from('collab_tasks')
          .select(`
            *,
            organization:organizations!collab_tasks_organization_id_fkey(
              id,
              name,
              code,
              logo_url
            ),
            collab_activity:collab_activities(
              id,
              title,
              code
            )
          `);

        if (collabActivityId) {
          fallbackQuery = fallbackQuery.eq('collab_activity_id', collabActivityId);
        } else {
          fallbackQuery = fallbackQuery.in('collab_activity_id', actIds);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) {
          console.warn('Fallback select error, attempting plain select for collab_tasks:', fallbackError.message);
          let plainQuery = supabase.from('collab_tasks').select('*');
          if (collabActivityId) {
            plainQuery = plainQuery.eq('collab_activity_id', collabActivityId);
          } else {
            plainQuery = plainQuery.in('collab_activity_id', actIds);
          }
          const { data: plainData, error: plainError } = await plainQuery;
          if (plainError) {
            console.error('Failed plain select for collab_tasks:', plainError);
            return [];
          }
          return (plainData || []).map((row: any) => ({
            id: row.id,
            planId: planId,
            collabActivityId: row.collab_activity_id,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            dueDate: row.due_date,
            assignedTo: row.assigned_to,
            organizationId: row.organization_id,
            createdAt: row.created_at,
          }));
        }

        return (fallbackData || []).map((row: any) => ({
          id: row.id,
          planId: planId,
          collabActivityId: row.collab_activity_id,
          title: row.title,
          description: row.description,
          status: row.status,
          priority: row.priority,
          dueDate: row.due_date,
          assignedTo: row.assigned_to,
          organizationId: row.organization_id,
          createdAt: row.created_at,
          organization: row.organization,
          collabActivity: row.collab_activity,
        }));
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        planId: planId,
        collabActivityId: row.collab_activity_id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        dueDate: row.due_date,
        assignedTo: row.assigned_to,
        organizationId: row.organization_id,
        createdAt: row.created_at,
        assignee: row.assignee,
        organization: row.organization,
        collabActivity: row.collab_activity,
      }));
    } catch (err) {
      console.error('Error listing collab tasks:', err);
      return [];
    }
  },

  async createCollabTask(payload: DbCollabTaskInsert): Promise<CollabTask> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const sanitizedPayload = sanitizeCollabTaskPayload(payload);

    // Step 1: Exactly ONE single INSERT mutation to prevent any duplicate insertion
    const { data: insertedRow, error: insertError } = await supabase
      .from('collab_tasks')
      .insert(sanitizedPayload as any)
      .select('*')
      .single();

    if (insertError) throw insertError;
    if (!insertedRow) throw new Error('Failed to create task: No data returned from insert');

    const raw = insertedRow as any;
    const fallbackResult: CollabTask = {
      id: raw.id,
      collabActivityId: raw.collab_activity_id,
      title: raw.title,
      description: raw.description,
      status: raw.status,
      priority: raw.priority,
      dueDate: raw.due_date,
      assignedTo: raw.assigned_to,
      organizationId: raw.organization_id,
      createdAt: raw.created_at,
    };

    // Step 2: Enrich with joined relations via SELECT only (NO RETRYING INSERT)
    try {
      const { data: joinedData, error: joinError } = await supabase
        .from('collab_tasks')
        .select(`
          *,
          organization:organizations!collab_tasks_organization_id_fkey(
            id,
            name,
            code
          ),
          assignee:profiles!collab_tasks_assigned_to_fkey(
            id,
            full_name,
            avatar_url,
            email
          ),
          collab_activity:collab_activities(
            id,
            title,
            code,
            plan_id
          )
        `)
        .eq('id', raw.id)
        .single();

      if (!joinError && joinedData) {
        const row = joinedData as any;
        return {
          id: row.id,
          planId: row.collab_activity?.plan_id,
          collabActivityId: row.collab_activity_id,
          title: row.title,
          description: row.description,
          status: row.status,
          priority: row.priority,
          dueDate: row.due_date,
          assignedTo: row.assigned_to,
          organizationId: row.organization_id,
          createdAt: row.created_at,
          assignee: row.assignee,
          organization: row.organization,
          collabActivity: row.collab_activity,
        };
      }
    } catch (enrichErr) {
      console.warn('Enriching created task with relation joins failed, returning base created task:', enrichErr);
    }

    return fallbackResult;
  },

  async updateCollabTask(id: string, payload: DbCollabTaskUpdate): Promise<CollabTask> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const sanitizedPayload = sanitizeCollabTaskPayload(payload);

    try {
      const { data, error } = await supabase
        .from('collab_tasks')
        .update(sanitizedPayload as never)
        .eq('id', id)
        .select(`
          *,
          organization:organizations!collab_tasks_organization_id_fkey(
            id,
            name,
            code
          ),
          assignee:profiles!collab_tasks_assigned_to_fkey(
            id,
            full_name,
            avatar_url,
            email
          ),
          collab_activity:collab_activities(
            id,
            title,
            code,
            plan_id
          )
        `)
        .single();

      if (!error && data) {
        const row = data as any;
        return {
          id: row.id,
          planId: row.collab_activity?.plan_id,
          collabActivityId: row.collab_activity_id,
          title: row.title,
          description: row.description,
          status: row.status,
          priority: row.priority,
          dueDate: row.due_date,
          assignedTo: row.assigned_to,
          organizationId: row.organization_id,
          createdAt: row.created_at,
          assignee: row.assignee,
          organization: row.organization,
          collabActivity: row.collab_activity,
        };
      }
    } catch (err) {
      console.warn('Initial select join for updateCollabTask failed, falling back:', err);
    }

    const { data: rawData, error: rawError } = await supabase
      .from('collab_tasks')
      .update(sanitizedPayload as never)
      .eq('id', id)
      .select('*')
      .single();

    if (rawError) throw rawError;
    const row = rawData as any;
    return {
      id: row.id,
      collabActivityId: row.collab_activity_id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date,
      assignedTo: row.assigned_to,
      organizationId: row.organization_id,
      createdAt: row.created_at,
    };
  },

  async deleteCollabTask(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('collab_tasks').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // 3. COLLAB TRANSACTIONS (FINANCE & FUNDING)
  // ==========================================
  async listCollabTransactions(planId: string, collabActivityId?: string): Promise<CollabTransaction[]> {
    if (!isSupabaseConfigured || !planId) return [];

    try {
      let query = supabase
        .from('collab_transactions')
        .select(`
          *,
          organization:organizations(
            id,
            name,
            code,
            logo_url
          ),
          collab_activity:collab_activities(
            id,
            title,
            code
          )
        `)
        .eq('plan_id', planId);

      if (collabActivityId) {
        query = query.eq('collab_activity_id', collabActivityId);
      }

      query = query.order('transaction_date', { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.error('Failed to list collab transactions:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        planId: row.plan_id,
        collabActivityId: row.collab_activity_id,
        organizationId: row.organization_id,
        transactionType: row.transaction_type,
        amount: Number(row.amount) || 0,
        categoryName: row.category_name,
        description: row.description,
        transactionDate: row.transaction_date,
        receiptUrl: row.receipt_url,
        recordedBy: row.recorded_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        organization: row.organization,
        collabActivity: row.collab_activity,
      }));
    } catch (err) {
      console.error('Error listing collab transactions:', err);
      return [];
    }
  },

  async createCollabTransaction(payload: DbCollabTransactionInsert): Promise<CollabTransaction> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { data, error } = await supabase
      .from('collab_transactions')
      .insert(payload as any)
      .select(`
        *,
        organization:organizations(
          id,
          name,
          code
        ),
        collab_activity:collab_activities(
          id,
          title,
          code
        )
      `)
      .single();

    if (error) throw error;
    const row = data as any;
    return {
      id: row.id,
      planId: row.plan_id,
      collabActivityId: row.collab_activity_id,
      organizationId: row.organization_id,
      transactionType: row.transaction_type,
      amount: Number(row.amount) || 0,
      categoryName: row.category_name,
      description: row.description,
      transactionDate: row.transaction_date,
      receiptUrl: row.receipt_url,
      recordedBy: row.recorded_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      organization: row.organization,
      collabActivity: row.collab_activity,
    };
  },

  async updateCollabTransaction(id: string, payload: DbCollabTransactionUpdate): Promise<CollabTransaction> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { data, error } = await supabase
      .from('collab_transactions')
      .update(payload as never)
      .eq('id', id)
      .select(`
        *,
        organization:organizations(
          id,
          name,
          code
        ),
        collab_activity:collab_activities(
          id,
          title,
          code
        )
      `)
      .single();

    if (error) throw error;
    const row = data as any;
    return {
      id: row.id,
      planId: row.plan_id,
      collabActivityId: row.collab_activity_id,
      organizationId: row.organization_id,
      transactionType: row.transaction_type,
      amount: Number(row.amount) || 0,
      categoryName: row.category_name,
      description: row.description,
      transactionDate: row.transaction_date,
      receiptUrl: row.receipt_url,
      recordedBy: row.recorded_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      organization: row.organization,
      collabActivity: row.collab_activity,
    };
  },

  async deleteCollabTransaction(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('collab_transactions').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // 4. CROSS-ORGANIZATION PERSONNEL DIRECTORY
  // ==========================================
  /**
   * Fetches all personnel/members belonging to ANY organization participating in this plan
   * (Lead Organization + all invited Co-host Organizations)
   */
  async getCollabPlanPersonnel(planId: string): Promise<CollabMemberOption[]> {
    if (!isSupabaseConfigured || !planId) return [];

    try {
      // Step 1: Find the plan and all participated organization IDs
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('lead_organization_id')
        .eq('id', planId)
        .single();

      if (planError || !planData) return [];

      const leadOrgId = (planData as any)?.lead_organization_id;

      const { data: cohostData } = await supabase
        .from('plan_organizations')
        .select('organization_id')
        .eq('plan_id', planId);

      const allOrgIds = Array.from(
        new Set([
          leadOrgId,
          ...(cohostData || []).map((c: any) => c.organization_id),
        ].filter(Boolean) as string[])
      );

      if (allOrgIds.length === 0) return [];

      // Step 2: Query all memberships and joined profiles for these organizations
      const { data: membershipsData, error: memberError } = await supabase
        .from('organization_memberships')
        .select(`
          user_id,
          role,
          organization_id,
          organization:organizations(
            id,
            name,
            code,
            type,
            parent_id
          ),
          profile:profiles(
            id,
            full_name,
            avatar_url
          )
        `)
        .in('organization_id', allOrgIds)
        .eq('status', 'active');

      // Also query members directory for full details (student_id, class_name, cohort, phone, email, position)
      const { data: membersData } = await supabase
        .from('members')
        .select('*')
        .in('organization_id', allOrgIds)
        .eq('status', 'active');

      // Map member details by user_id and full_name + org
      const memberByUserId = new Map<string, any>();
      const memberByOrgAndName = new Map<string, any>();

      (membersData || []).forEach((m: any) => {
        if (m.user_id) memberByUserId.set(m.user_id, m);
        memberByOrgAndName.set(`${m.organization_id}__${m.full_name?.toLowerCase().trim()}`, m);
      });

      const results: CollabMemberOption[] = [];
      const seenKeys = new Set<string>();

      for (const m of (membershipsData as any[]) || []) {
        if (!m.user_id) continue;
        const profile = m.profile;
        const org = m.organization;
        const matchedMem = memberByUserId.get(m.user_id) || memberByOrgAndName.get(`${m.organization_id}__${profile?.full_name?.toLowerCase().trim()}`);

        const key = `${m.organization_id}__${m.user_id}`;
        seenKeys.add(key);

        results.push({
          userId: m.user_id,
          profileId: profile?.id || m.user_id,
          fullName: matchedMem?.full_name || profile?.full_name || 'Cán bộ BCH',
          studentId: matchedMem?.student_id || null,
          className: matchedMem?.class_name || null,
          cohort: matchedMem?.cohort || null,
          phone: matchedMem?.phone || null,
          email: matchedMem?.email || profile?.email || '',
          avatarUrl: profile?.avatar_url || null,
          organizationId: m.organization_id,
          organizationName: org?.name || 'Đơn vị',
          organizationCode: org?.code || 'ORG',
          organizationType: org?.type || 'chi_hoi',
          role: (m.role as OrganizationRole) || 'secretary',
          position: matchedMem?.position || (m.role === 'admin' ? 'Trưởng ban' : m.role === 'leader' ? 'Chi hội trưởng' : m.role === 'deputy' ? 'Chi hội phó' : 'Ủy viên BCH'),
        });
      }

      // Sort by organization name and then full name
      return results.sort((a, b) => {
        const orgCompare = a.organizationName.localeCompare(b.organizationName);
        if (orgCompare !== 0) return orgCompare;
        return a.fullName.localeCompare(b.fullName);
      });
    } catch (err) {
      console.error('Error getting collab plan personnel:', err);
      return [];
    }
  },

  // ==========================================
  // 5. COLLAB ACTIVITY PARTICIPANTS & ATTENDANCE
  // ==========================================
  /**
   * List participants for a collab activity (or aggregated for a whole plan)
   */
  async listCollabParticipants(activityId?: string, planId?: string): Promise<{
    data: any[];
    totalCount: number;
    stats: {
      total: number;
      present: number;
      absent: number;
      unmarked: number;
      participationRate: number;
    };
  }> {
    if (!isSupabaseConfigured || (!activityId && !planId)) {
      return {
        data: [],
        totalCount: 0,
        stats: { total: 0, present: 0, absent: 0, unmarked: 0, participationRate: 0 },
      };
    }

    try {
      // 1. If planId provided without activityId, gather all activity IDs of the plan
      let targetActivityIds: string[] = [];
      if (activityId) {
        targetActivityIds = [activityId];
      } else if (planId) {
        const { data: actRows } = await supabase
          .from('collab_activities')
          .select('id')
          .eq('plan_id', planId);
        targetActivityIds = (actRows || []).map((r: any) => r.id);
      }

      if (targetActivityIds.length === 0) {
        return {
          data: [],
          totalCount: 0,
          stats: { total: 0, present: 0, absent: 0, unmarked: 0, participationRate: 0 },
        };
      }

      // 2. Query activity_form_responses and activity_participants
      const { data: formResponses = [] } = await supabase
        .from('activity_form_responses')
        .select('*')
        .in('activity_id', targetActivityIds)
        .order('submitted_at', { ascending: false });

      const { data: participantsData = [] } = await supabase
        .from('activity_participants')
        .select('*, member:members (*)')
        .in('activity_id', targetActivityIds)
        .order('created_at', { ascending: false });

      // Build unified list
      const seenIds = new Set<string>();
      const list: any[] = [];

      // Add direct participants
      (participantsData || []).forEach((p: any) => {
        const mem = p.member || {};
        seenIds.add(p.id);
        if (p.member_id) seenIds.add(p.member_id);

        list.push({
          id: p.id,
          activityId: p.activity_id,
          memberId: p.member_id,
          registrationStatus: p.registration_status || 'registered',
          attendanceStatus: p.attendance_status || 'unmarked',
          attendedAt: p.attended_at,
          notes: p.notes,
          source: 'manual',
          member: {
            id: mem.id || p.member_id,
            fullName: mem.full_name || 'Người tham gia',
            studentId: mem.student_id || null,
            className: mem.class_name || null,
            cohort: mem.cohort || null,
            email: mem.email || null,
            phone: mem.phone || null,
            organizationId: mem.organization_id || '',
          },
        });
      });

      // Add form responses
      (formResponses || []).forEach((fr: any) => {
        const synthId = `resp_${fr.id}`;
        if (fr.matched_participant_id && seenIds.has(fr.matched_participant_id)) return;
        if (fr.matched_member_id && seenIds.has(fr.matched_member_id)) return;

        // Parse attendance status from notes if embedded
        let attendanceStatus = 'unmarked';
        if (fr.notes) {
          if (/\[attendance:present\]/i.test(fr.notes)) attendanceStatus = 'present';
          else if (/\[attendance:absent\]/i.test(fr.notes)) attendanceStatus = 'absent';
        }

        const sId = fr.parsed_student_id || fr.student_id || null;
        const fName = fr.parsed_full_name || fr.full_name || fr.respondent_email || 'Người đăng ký';
        const phone = fr.parsed_phone || fr.phone_number || null;
        const cName = fr.parsed_class_name || fr.class_name || null;

        list.push({
          id: synthId,
          activityId: fr.activity_id,
          memberId: fr.matched_member_id || synthId,
          registrationStatus: 'registered',
          attendanceStatus,
          attendedAt: attendanceStatus === 'present' ? fr.updated_at || fr.submitted_at : null,
          notes: fr.notes,
          source: 'google_form',
          member: {
            id: fr.matched_member_id || synthId,
            fullName: fName,
            studentId: sId,
            className: cName,
            cohort: null,
            email: fr.respondent_email,
            phone,
            organizationId: fr.organization_id || '',
          },
        });
      });

      const total = list.length;
      const present = list.filter((p) => p.attendanceStatus === 'present').length;
      const absent = list.filter((p) => p.attendanceStatus === 'absent').length;
      const unmarked = list.filter((p) => p.attendanceStatus === 'unmarked').length;
      const participationRate = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

      return {
        data: list,
        totalCount: total,
        stats: {
          total,
          present,
          absent,
          unmarked,
          participationRate,
        },
      };
    } catch (err) {
      console.error('Error listing collab participants:', err);
      return {
        data: [],
        totalCount: 0,
        stats: { total: 0, present: 0, absent: 0, unmarked: 0, participationRate: 0 },
      };
    }
  },

  /**
   * Add participant to collab activity
   */
  async addCollabParticipant(
    activityId: string,
    organizationId: string,
    data: {
      memberId?: string;
      fullName: string;
      studentId?: string;
      className?: string;
      cohort?: string;
      phone?: string;
      email?: string;
      notes?: string;
      attendanceStatus?: string;
    }
  ): Promise<any> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const noteSegments: string[] = [];
    if (data.cohort) noteSegments.push(`Khóa: ${data.cohort.trim()}`);
    if (data.notes) noteSegments.push(data.notes.trim());
    if (data.attendanceStatus === 'present') noteSegments.push('[attendance:present]');
    else if (data.attendanceStatus === 'absent') noteSegments.push('[attendance:absent]');

    const { data: newResp, error } = await supabase
      .from('activity_form_responses')
      .insert({
        activity_form_id: '00000000-0000-0000-0000-000000000000',
        activity_id: activityId,
        organization_id: organizationId,
        google_response_id: `collab_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        respondent_email: data.email?.trim() || null,
        submitted_at: new Date().toISOString(),
        raw_answers: {},
        parsed_student_id: data.studentId?.trim() || null,
        parsed_full_name: data.fullName?.trim() || 'Người tham gia',
        parsed_phone: data.phone?.trim() || null,
        parsed_class_name: data.className?.trim() || null,
        matched_member_id: data.memberId || null,
        match_status: data.memberId ? 'matched' : 'unmatched',
        notes: noteSegments.join(', ') || null,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return newResp;
  },

  /**
   * Update collab participant attendance status
   */
  async updateCollabParticipant(
    participantId: string,
    data: { attendanceStatus?: string; notes?: string }
  ): Promise<void> {
    if (!isSupabaseConfigured || !participantId) return;

    if (participantId.startsWith('resp_')) {
      const rawId = participantId.replace('resp_', '');
      const { data: existingData } = await supabase
        .from('activity_form_responses')
        .select('notes')
        .eq('id', rawId)
        .single();

      const existing = existingData as any;
      let currentNotes = existing?.notes || '';
      currentNotes = currentNotes.replace(/\[attendance:[a-z]+\]/gi, '').trim();

      if (data.attendanceStatus === 'present') {
        currentNotes = currentNotes ? `${currentNotes} [attendance:present]` : '[attendance:present]';
      } else if (data.attendanceStatus === 'absent') {
        currentNotes = currentNotes ? `${currentNotes} [attendance:absent]` : '[attendance:absent]';
      }

      await supabase
        .from('activity_form_responses')
        .update({ notes: currentNotes.trim() || null } as never)
        .eq('id', rawId);
      return;
    }

    // Direct UUID update on activity_participants
    const payload: any = {};
    if (data.attendanceStatus !== undefined) {
      payload.attendance_status = data.attendanceStatus;
      payload.attended_at = data.attendanceStatus === 'present' ? new Date().toISOString() : null;
    }
    if (data.notes !== undefined) {
      payload.notes = data.notes;
    }

    await supabase.from('activity_participants').update(payload as never).eq('id', participantId);
  },

  /**
   * Remove participant from collab activity
   */
  async removeCollabParticipant(participantId: string): Promise<void> {
    if (!isSupabaseConfigured || !participantId) return;

    if (participantId.startsWith('resp_')) {
      const rawId = participantId.replace('resp_', '');
      await supabase.from('activity_form_responses').delete().eq('id', rawId);
      return;
    }

    await supabase.from('activity_participants').delete().eq('id', participantId);
  },

  /**
   * Bulk update attendance for collab participants
   */
  async bulkUpdateCollabAttendance(
    participantIds: string[],
    status: string
  ): Promise<void> {
    if (!isSupabaseConfigured || participantIds.length === 0) return;

    const respIds = participantIds
      .filter((id) => id.startsWith('resp_'))
      .map((id) => id.replace('resp_', ''));
    const directIds = participantIds.filter((id) => !id.startsWith('resp_'));

    if (directIds.length > 0) {
      await supabase
        .from('activity_participants')
        .update({
          attendance_status: status,
          attended_at: status === 'present' ? new Date().toISOString() : null,
        } as never)
        .in('id', directIds);
    }

    if (respIds.length > 0) {
      for (const id of respIds) {
        await this.updateCollabParticipant(`resp_${id}`, { attendanceStatus: status });
      }
    }
  },
};
