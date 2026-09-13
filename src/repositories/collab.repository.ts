import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type {
  CollabActivity,
  CollabTask,
  CollabTransaction,
  CollabMemberOption,
  CollabParticipant,
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
  'external_assignee',
  'external_contact',
  'phase',
  'due_time',
  'organization_id',
  'status',
  'priority',
  'due_date',
  'created_at',
  'category',
  'deliverable',
  'external_organization',
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
            dueTime: row.due_time,
            phase: row.phase,
            assignedTo: row.assigned_to,
            externalAssignee: row.external_assignee,
            externalContact: row.external_contact,
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
          dueTime: row.due_time,
          phase: row.phase,
          category: row.category || null,
          deliverable: row.deliverable || null,
          assignedTo: row.assigned_to,
          externalAssignee: row.external_assignee,
          externalOrganization: row.external_organization || null,
          externalContact: row.external_contact,
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
        dueTime: row.due_time,
        phase: row.phase,
        category: row.category || null,
        deliverable: row.deliverable || null,
        assignedTo: row.assigned_to,
        externalAssignee: row.external_assignee,
        externalOrganization: row.external_organization || null,
        externalContact: row.external_contact,
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
    let { data: insertedRow, error: insertError } = await supabase
      .from('collab_tasks')
      .insert(sanitizedPayload as any)
      .select('*')
      .single();

    // Fallback: If database table has not been migrated yet (missing due_time, phase, etc.)
    if (insertError && (insertError.message?.includes('schema cache') || insertError.message?.includes('column') || insertError.code === 'PGRST204')) {
      console.warn('collab_tasks table is missing new columns, falling back to base columns:', insertError.message);
      const basePayload = { ...sanitizedPayload };
      delete (basePayload as any).due_time;
      delete (basePayload as any).phase;
      delete (basePayload as any).category;
      delete (basePayload as any).deliverable;
      delete (basePayload as any).external_assignee;
      delete (basePayload as any).external_organization;
      delete (basePayload as any).external_contact;

      const retry = await supabase
        .from('collab_tasks')
        .insert(basePayload as any)
        .select('*')
        .single();
      insertedRow = retry.data;
      insertError = retry.error;
    }

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
      dueTime: raw.due_time,
      phase: raw.phase,
      category: raw.category || null,
      deliverable: raw.deliverable || null,
      assignedTo: raw.assigned_to,
      externalAssignee: raw.external_assignee,
      externalOrganization: raw.external_organization || null,
      externalContact: raw.external_contact,
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
          dueTime: row.due_time,
          phase: row.phase,
          category: row.category || null,
          deliverable: row.deliverable || null,
          assignedTo: row.assigned_to,
          externalAssignee: row.external_assignee,
          externalOrganization: row.external_organization || null,
          externalContact: row.external_contact,
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
          dueTime: row.due_time,
          phase: row.phase,
          category: row.category || null,
          deliverable: row.deliverable || null,
          assignedTo: row.assigned_to,
          externalAssignee: row.external_assignee,
          externalOrganization: row.external_organization || null,
          externalContact: row.external_contact,
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

    let effectivePayload = sanitizedPayload;
    let { data: rawData, error: rawError } = await supabase
      .from('collab_tasks')
      .update(effectivePayload as never)
      .eq('id', id)
      .select('*')
      .single();

    if (rawError && (rawError.message?.includes('schema cache') || rawError.message?.includes('column') || rawError.code === 'PGRST204')) {
      console.warn('collab_tasks update failed due to missing columns, retrying with base columns:', rawError.message);
      const basePayload = { ...sanitizedPayload };
      delete (basePayload as any).due_time;
      delete (basePayload as any).phase;
      delete (basePayload as any).category;
      delete (basePayload as any).deliverable;
      delete (basePayload as any).external_assignee;
      delete (basePayload as any).external_organization;
      delete (basePayload as any).external_contact;

      const retry = await supabase
        .from('collab_tasks')
        .update(basePayload as never)
        .eq('id', id)
        .select('*')
        .single();
      rawData = retry.data;
      rawError = retry.error;
    }

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
      dueTime: row.due_time,
      phase: row.phase,
      assignedTo: row.assigned_to,
      externalAssignee: row.external_assignee,
      externalContact: row.external_contact,
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
  // 5. COLLAB PARTICIPANTS & ATTENDANCE
  // ==========================================
  /**
   * List participants for a collab activity (or aggregated for a whole plan)
   */
  async listCollabParticipants(activityId?: string, planId?: string): Promise<{
    data: CollabParticipant[];
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
      // 1. Primary: Query dedicated collab_participants table
      let query = supabase
        .from('collab_participants')
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
        .order('created_at', { ascending: false });

      if (activityId) {
        query = query.eq('collab_activity_id', activityId);
      } else if (planId) {
        query = query.eq('plan_id', planId);
      }

      const { data: rows, error } = await query;

      // Defensive fallback if collab_participants table has not been created yet in DB
      if (error) {
        console.warn('collab_participants table error, checking fallback:', error.message);
        return {
          data: [],
          totalCount: 0,
          stats: { total: 0, present: 0, absent: 0, unmarked: 0, participationRate: 0 },
        };
      }

      const list: CollabParticipant[] = (rows || []).map((row: any) => ({
        id: row.id,
        planId: row.plan_id,
        collabActivityId: row.collab_activity_id || null,
        organizationId: row.organization_id || null,
        externalOrganization: row.external_organization || null,
        memberId: row.member_id || null,
        fullName: row.full_name || 'Người tham gia',
        studentId: row.student_id || null,
        className: row.class_name || null,
        cohort: row.cohort || null,
        phone: row.phone || null,
        email: row.email || null,
        roleTitle: row.role_title || 'Tình nguyện viên',
        attendanceStatus: (row.attendance_status as 'unmarked' | 'present' | 'absent') || 'unmarked',
        attendedAt: row.attended_at || null,
        notes: row.notes || null,
        source: (row.source as 'manual' | 'import' | 'google_form' | 'system') || 'manual',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        organization: row.organization || null,
        collabActivity: row.collab_activity || null,
      }));

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
   * Add a single participant to a collab plan / activity
   */
  async addCollabParticipant(
    planId: string,
    activityId: string | undefined,
    data: {
      organizationId?: string | null;
      externalOrganization?: string | null;
      memberId?: string | null;
      fullName: string;
      studentId?: string | null;
      className?: string | null;
      cohort?: string | null;
      phone?: string | null;
      email?: string | null;
      roleTitle?: string | null;
      attendanceStatus?: 'unmarked' | 'present' | 'absent';
      notes?: string | null;
      source?: 'manual' | 'import' | 'google_form' | 'system';
    }
  ): Promise<CollabParticipant> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const payload = {
      plan_id: planId,
      collab_activity_id: activityId || null,
      organization_id: data.organizationId || null,
      external_organization: data.externalOrganization || null,
      member_id: data.memberId || null,
      full_name: data.fullName.trim(),
      student_id: data.studentId?.trim() || null,
      class_name: data.className?.trim() || null,
      cohort: data.cohort?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      role_title: data.roleTitle?.trim() || 'Tình nguyện viên',
      attendance_status: data.attendanceStatus || 'unmarked',
      attended_at: data.attendanceStatus === 'present' ? new Date().toISOString() : null,
      notes: data.notes?.trim() || null,
      source: data.source || 'manual',
    };

    const { data: insertedRow, error } = await supabase
      .from('collab_participants')
      .insert(payload as never)
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
    if (!insertedRow) throw new Error('Không thể tạo người tham gia: không có dữ liệu trả về');

    const row = insertedRow as any;
    return {
      id: row.id,
      planId: row.plan_id,
      collabActivityId: row.collab_activity_id || null,
      organizationId: row.organization_id || null,
      externalOrganization: row.external_organization || null,
      memberId: row.member_id || null,
      fullName: row.full_name,
      studentId: row.student_id || null,
      className: row.class_name || null,
      cohort: row.cohort || null,
      phone: row.phone || null,
      email: row.email || null,
      roleTitle: row.role_title || 'Tình nguyện viên',
      attendanceStatus: row.attendance_status || 'unmarked',
      attendedAt: row.attended_at || null,
      notes: row.notes || null,
      source: row.source || 'manual',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      organization: row.organization || null,
      collabActivity: row.collab_activity || null,
    };
  },

  /**
   * Bulk add participants to collab plan / activity (used by Google Sheet import)
   */
  async bulkAddCollabParticipants(
    planId: string,
    activityId: string | undefined,
    participants: Array<{
      fullName: string;
      studentId?: string | null;
      className?: string | null;
      cohort?: string | null;
      phone?: string | null;
      email?: string | null;
      roleTitle?: string | null;
      organizationId?: string | null;
      externalOrganization?: string | null;
      memberId?: string | null;
      notes?: string | null;
    }>
  ): Promise<number> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    if (participants.length === 0) return 0;

    const payloadList = participants.map((p) => ({
      plan_id: planId,
      collab_activity_id: activityId || null,
      organization_id: p.organizationId || null,
      external_organization: p.externalOrganization || null,
      member_id: p.memberId || null,
      full_name: p.fullName.trim(),
      student_id: p.studentId?.trim() || null,
      class_name: p.className?.trim() || null,
      cohort: p.cohort?.trim() || null,
      phone: p.phone?.trim() || null,
      email: p.email?.trim() || null,
      role_title: p.roleTitle?.trim() || 'Tình nguyện viên',
      attendance_status: 'unmarked',
      notes: p.notes?.trim() || null,
      source: 'import',
    }));

    // Chunk insertions into batches of 50 to avoid network payload limits
    const CHUNK_SIZE = 50;
    let insertedCount = 0;

    for (let i = 0; i < payloadList.length; i += CHUNK_SIZE) {
      const chunk = payloadList.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from('collab_participants')
        .insert(chunk as never)
        .select('id');

      if (error) throw error;
      insertedCount += data?.length || chunk.length;
    }

    return insertedCount;
  },

  /**
   * Update collab participant attendance status & details
   */
  async updateCollabParticipant(
    participantId: string,
    data: {
      attendanceStatus?: 'unmarked' | 'present' | 'absent';
      notes?: string;
      roleTitle?: string;
      collabActivityId?: string | null;
    }
  ): Promise<void> {
    if (!isSupabaseConfigured || !participantId) return;

    const payload: any = {};
    if (data.attendanceStatus !== undefined) {
      payload.attendance_status = data.attendanceStatus;
      payload.attended_at = data.attendanceStatus === 'present' ? new Date().toISOString() : null;
    }
    if (data.notes !== undefined) {
      payload.notes = data.notes;
    }
    if (data.roleTitle !== undefined) {
      payload.role_title = data.roleTitle;
    }
    if (data.collabActivityId !== undefined) {
      payload.collab_activity_id = data.collabActivityId;
    }

    const { error } = await supabase
      .from('collab_participants')
      .update(payload as never)
      .eq('id', participantId);

    if (error) throw error;
  },

  /**
   * Remove participant from collab activity or plan
   */
  async removeCollabParticipant(participantId: string): Promise<void> {
    if (!isSupabaseConfigured || !participantId) return;
    const { error } = await supabase.from('collab_participants').delete().eq('id', participantId);
    if (error) throw error;
  },

  /**
   * Bulk update attendance for collab participants
   */
  async bulkUpdateCollabAttendance(
    participantIds: string[],
    status: 'unmarked' | 'present' | 'absent'
  ): Promise<void> {
    if (!isSupabaseConfigured || participantIds.length === 0) return;

    const { error } = await supabase
      .from('collab_participants')
      .update({
        attendance_status: status,
        attended_at: status === 'present' ? new Date().toISOString() : null,
      } as never)
      .in('id', participantIds);

    if (error) throw error;
  },
};
