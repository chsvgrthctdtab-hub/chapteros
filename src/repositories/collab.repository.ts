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
      const { data: membershipsData } = await supabase
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

      // Fetch organizations details map
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name, code, type, parent_id')
        .in('id', allOrgIds);

      const orgMap = new Map<string, any>();
      (orgsData || []).forEach((o: any) => orgMap.set(o.id, o));

      // Also query members directory for full details (student_id, class_name, cohort, phone, email, position)
      const { data: membersData } = await supabase
        .from('members')
        .select('*')
        .in('organization_id', allOrgIds)
        .eq('status', 'active');

      // Query tasks in this plan to find anyone actively assigned tasks
      const { data: planTasks } = await supabase
        .from('collab_tasks')
        .select('assigned_to')
        .eq('plan_id', planId);

      const assignedUserIds = new Set(
        (planTasks || []).map((t: any) => t.assigned_to).filter(Boolean)
      );

      // Query collab activities in this plan to find activity leads
      const { data: planActivities } = await supabase
        .from('collab_activities')
        .select('created_by')
        .eq('plan_id', planId);

      const activityLeadUserIds = new Set(
        (planActivities || []).map((a: any) => a.created_by).filter(Boolean)
      );

      // Query collab participants with designated BTC roles
      const { data: btcParticipants } = await supabase
        .from('collab_participants')
        .select('member_id, role_title')
        .eq('plan_id', planId);

      const btcParticipantMemberIds = new Set(
        (btcParticipants || []).map((p: any) => p.member_id).filter(Boolean)
      );

      const boardKeywords = [
        'trưởng', 'phó', 'chủ nhiệm', 'ủy viên', 'uy vien',
        'thủ quỹ', 'thu quy', 'thư ký', 'thu ky', 'bch', 'ban chấp hành',
        'ban chap hanh', 'quản trị', 'quan tri', 'leader', 'deputy', 'admin',
        'treasurer', 'secretary', 'board', 'bí thư', 'bi thu', 'chỉ huy',
        'điều phối', 'phụ trách', 'btc', 'ban tổ chức', 'cán bộ'
      ];

      const isBoardPosition = (position?: string | null): boolean => {
        if (!position) return false;
        const p = position.toLowerCase().trim();
        if (p === 'hội viên' || p === 'member' || p === 'sinh viên' || p === 'tình nguyện viên') {
          return false;
        }
        return boardKeywords.some((kw) => p.includes(kw));
      };

      const isLeadershipRole = (role?: string | null): boolean => {
        if (!role) return false;
        return ['admin', 'leader', 'deputy', 'treasurer', 'secretary'].includes(role.toLowerCase());
      };

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
        const org = m.organization || orgMap.get(m.organization_id);
        const matchedMem = memberByUserId.get(m.user_id) || memberByOrgAndName.get(`${m.organization_id}__${profile?.full_name?.toLowerCase().trim()}`);

        const isLeadership = isLeadershipRole(m.role);
        const matchedMemIsBCH = matchedMem ? isBoardPosition(matchedMem.position) : false;
        const isAssigned = assignedUserIds.has(m.user_id) || activityLeadUserIds.has(m.user_id) || (matchedMem && btcParticipantMemberIds.has(matchedMem.id));

        // CRITICAL FILTER: ONLY include if they have a leadership role in the organization,
        // hold a BCH position, or are actively assigned tasks/activities in this plan.
        // DO NOT push ordinary chapter members into Ban Tổ Chức!
        if (!isLeadership && !matchedMemIsBCH && !isAssigned) {
          continue;
        }

        const key = `${m.organization_id}__${m.user_id}`;
        seenKeys.add(key);

        let finalPosition = matchedMem?.position;
        if (!finalPosition || finalPosition.toLowerCase().trim() === 'hội viên') {
          if (m.role === 'admin') finalPosition = 'Ban Quản trị';
          else if (m.role === 'leader') finalPosition = 'Chi hội trưởng';
          else if (m.role === 'deputy') finalPosition = 'Chi hội phó';
          else if (m.role === 'treasurer') finalPosition = 'Thủ quỹ';
          else if (m.role === 'secretary') finalPosition = 'Ủy viên BCH';
          else if (assignedUserIds.has(m.user_id)) finalPosition = 'Phụ trách công việc';
          else if (activityLeadUserIds.has(m.user_id)) finalPosition = 'Trưởng Ban tổ chức hoạt động';
          else finalPosition = 'Thành viên Ban tổ chức';
        }

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
          position: finalPosition,
        });
      }

      // Also include members from roster who are in BCH or assigned to this plan
      for (const mem of (membersData as any[]) || []) {
        const uId = mem.user_id || mem.id;
        const key = `${mem.organization_id}__${uId}`;
        const keyByMemberId = `${mem.organization_id}__${mem.id}`;
        if (seenKeys.has(key) || seenKeys.has(keyByMemberId)) continue;

        const isBCH = isBoardPosition(mem.position);
        const isAssigned = (mem.user_id && assignedUserIds.has(mem.user_id)) || btcParticipantMemberIds.has(mem.id);

        // CRITICAL FILTER: ONLY include members who hold a BCH position or are assigned tasks/roles in this plan!
        // Plain members ('Hội viên') must NEVER be included in Ban Tổ Chức!
        if (!isBCH && !isAssigned) {
          continue;
        }

        seenKeys.add(key);
        seenKeys.add(keyByMemberId);

        const org = orgMap.get(mem.organization_id);

        results.push({
          userId: uId,
          profileId: uId,
          fullName: mem.full_name || 'Cán bộ BCH',
          studentId: mem.student_id || null,
          className: mem.class_name || null,
          cohort: mem.cohort || null,
          phone: mem.phone || null,
          email: mem.email || '',
          avatarUrl: null,
          organizationId: mem.organization_id,
          organizationName: org?.name || 'Đơn vị',
          organizationCode: org?.code || 'ORG',
          organizationType: org?.type || 'chi_hoi',
          role: 'secretary' as OrganizationRole,
          position: mem.position || (isAssigned ? 'Cán bộ phụ trách' : 'Ủy viên Ban Chấp Hành'),
        });
      }

      // Sort by organization name, then BCH first, then full name
      return results.sort((a, b) => {
        const orgCompare = a.organizationName.localeCompare(b.organizationName, 'vi');
        if (orgCompare !== 0) return orgCompare;

        const aIsBoard = boardKeywords.some((kw) => (a.position || '').toLowerCase().includes(kw)) || a.role === 'leader' || a.role === 'deputy' || a.role === 'treasurer' || a.role === 'secretary' || a.role === 'admin';
        const bIsBoard = boardKeywords.some((kw) => (b.position || '').toLowerCase().includes(kw)) || b.role === 'leader' || b.role === 'deputy' || b.role === 'treasurer' || b.role === 'secretary' || b.role === 'admin';

        if (aIsBoard && !bIsBoard) return -1;
        if (!aIsBoard && bIsBoard) return 1;

        return a.fullName.localeCompare(b.fullName, 'vi');
      });
    } catch (err) {
      console.error('Error getting collab plan personnel:', err);
      return [];
    }
  },

  // ==========================================
  // 5. COLLAB PARTICIPANTS & ATTENDANCE (WITH LOCALSTORAGE FALLBACK)
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
    if (!activityId && !planId) {
      return {
        data: [],
        totalCount: 0,
        stats: { total: 0, present: 0, absent: 0, unmarked: 0, participationRate: 0 },
      };
    }

    try {
      if (isSupabaseConfigured) {
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

        // If no error, parse and return Supabase data
        if (!error && rows) {
          const list: CollabParticipant[] = rows.map((row: any) => ({
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
            stats: { total, present, absent, unmarked, participationRate },
          };
        }
      }
    } catch (err) {
      console.warn('collab_participants remote query fallback to local cache:', err);
    }

    // Seamless fallback to LocalStorage if table doesn't exist yet on remote DB
    try {
      const raw = localStorage.getItem('chapteros_collab_participants_fallback');
      const allLocal: CollabParticipant[] = raw ? JSON.parse(raw) : [];
      const list = allLocal.filter((p) => {
        if (activityId) return p.collabActivityId === activityId;
        if (planId) return p.planId === planId;
        return false;
      });

      const total = list.length;
      const present = list.filter((p) => p.attendanceStatus === 'present').length;
      const absent = list.filter((p) => p.attendanceStatus === 'absent').length;
      const unmarked = list.filter((p) => p.attendanceStatus === 'unmarked').length;
      const participationRate = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

      return {
        data: list,
        totalCount: total,
        stats: { total, present, absent, unmarked, participationRate },
      };
    } catch {
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

    if (isSupabaseConfigured) {
      try {
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

        if (!error && insertedRow) {
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
        }
      } catch (e) {
        console.warn('Supabase addCollabParticipant error, falling back to local store:', e);
      }
    }

    // Local fallback
    const fallbackItem: CollabParticipant = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'p_' + Date.now()),
      planId,
      collabActivityId: activityId || null,
      organizationId: data.organizationId || null,
      externalOrganization: data.externalOrganization || null,
      memberId: data.memberId || null,
      fullName: data.fullName.trim(),
      studentId: data.studentId?.trim() || null,
      className: data.className?.trim() || null,
      cohort: data.cohort?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      roleTitle: data.roleTitle?.trim() || 'Tình nguyện viên',
      attendanceStatus: data.attendanceStatus || 'unmarked',
      attendedAt: data.attendanceStatus === 'present' ? new Date().toISOString() : null,
      notes: data.notes?.trim() || null,
      source: data.source || 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem('chapteros_collab_participants_fallback');
      const list: CollabParticipant[] = raw ? JSON.parse(raw) : [];
      list.unshift(fallbackItem);
      localStorage.setItem('chapteros_collab_participants_fallback', JSON.stringify(list));
    } catch (err) {
      console.warn('Failed to save to localStorage fallback:', err);
    }

    return fallbackItem;
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

    if (isSupabaseConfigured) {
      try {
        const CHUNK_SIZE = 50;
        let insertedCount = 0;
        let hasError = false;

        for (let i = 0; i < payloadList.length; i += CHUNK_SIZE) {
          const chunk = payloadList.slice(i, i + CHUNK_SIZE);
          const { data, error } = await supabase
            .from('collab_participants')
            .insert(chunk as never)
            .select('id');

          if (error) {
            hasError = true;
            break;
          }
          insertedCount += data?.length || chunk.length;
        }

        if (!hasError && insertedCount > 0) {
          return insertedCount;
        }
      } catch (e) {
        console.warn('Supabase bulkAddCollabParticipants error, falling back to local store:', e);
      }
    }

    // LocalStorage fallback
    try {
      const raw = localStorage.getItem('chapteros_collab_participants_fallback');
      const list: CollabParticipant[] = raw ? JSON.parse(raw) : [];
      const now = new Date().toISOString();

      const newItems: CollabParticipant[] = participants.map((p, idx) => ({
        id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `p_${Date.now()}_${idx}`),
        planId,
        collabActivityId: activityId || null,
        organizationId: p.organizationId || null,
        externalOrganization: p.externalOrganization || null,
        memberId: p.memberId || null,
        fullName: p.fullName.trim(),
        studentId: p.studentId?.trim() || null,
        className: p.className?.trim() || null,
        cohort: p.cohort?.trim() || null,
        phone: p.phone?.trim() || null,
        email: p.email?.trim() || null,
        roleTitle: p.roleTitle?.trim() || 'Tình nguyện viên',
        attendanceStatus: 'unmarked',
        attendedAt: null,
        notes: p.notes?.trim() || null,
        source: 'import',
        createdAt: now,
        updatedAt: now,
      }));

      list.unshift(...newItems);
      localStorage.setItem('chapteros_collab_participants_fallback', JSON.stringify(list));
      return newItems.length;
    } catch {
      return 0;
    }
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
    if (!participantId) return;

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

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('collab_participants')
          .update(payload as never)
          .eq('id', participantId);

        if (!error) return;
      } catch (e) {
        console.warn('Supabase updateCollabParticipant fallback:', e);
      }
    }

    // Local fallback update
    try {
      const raw = localStorage.getItem('chapteros_collab_participants_fallback');
      if (raw) {
        const list: CollabParticipant[] = JSON.parse(raw);
        const updated = list.map((p) => {
          if (p.id !== participantId) return p;
          return {
            ...p,
            attendanceStatus: data.attendanceStatus !== undefined ? data.attendanceStatus : p.attendanceStatus,
            attendedAt: data.attendanceStatus === 'present' ? new Date().toISOString() : data.attendanceStatus === 'unmarked' || data.attendanceStatus === 'absent' ? null : p.attendedAt,
            notes: data.notes !== undefined ? data.notes : p.notes,
            roleTitle: data.roleTitle !== undefined ? data.roleTitle : p.roleTitle,
            collabActivityId: data.collabActivityId !== undefined ? data.collabActivityId : p.collabActivityId,
            updatedAt: new Date().toISOString(),
          };
        });
        localStorage.setItem('chapteros_collab_participants_fallback', JSON.stringify(updated));
      }
    } catch (err) {
      console.warn('Local update participant failed:', err);
    }
  },

  /**
   * Remove participant from collab activity or plan
   */
  async removeCollabParticipant(participantId: string): Promise<void> {
    if (!participantId) return;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('collab_participants').delete().eq('id', participantId);
        if (!error) return;
      } catch (e) {
        console.warn('Supabase removeCollabParticipant fallback:', e);
      }
    }

    // Local fallback remove
    try {
      const raw = localStorage.getItem('chapteros_collab_participants_fallback');
      if (raw) {
        const list: CollabParticipant[] = JSON.parse(raw);
        const filtered = list.filter((p) => p.id !== participantId);
        localStorage.setItem('chapteros_collab_participants_fallback', JSON.stringify(filtered));
      }
    } catch (err) {
      console.warn('Local remove participant failed:', err);
    }
  },

  /**
   * Bulk update attendance for collab participants
   */
  async bulkUpdateCollabAttendance(
    participantIds: string[],
    status: 'unmarked' | 'present' | 'absent'
  ): Promise<void> {
    if (participantIds.length === 0) return;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('collab_participants')
          .update({
            attendance_status: status,
            attended_at: status === 'present' ? new Date().toISOString() : null,
          } as never)
          .in('id', participantIds);

        if (!error) return;
      } catch (e) {
        console.warn('Supabase bulkUpdateCollabAttendance fallback:', e);
      }
    }

    // Local fallback
    try {
      const raw = localStorage.getItem('chapteros_collab_participants_fallback');
      if (raw) {
        const list: CollabParticipant[] = JSON.parse(raw);
        const idSet = new Set(participantIds);
        const updated = list.map((p) => {
          if (!idSet.has(p.id)) return p;
          return {
            ...p,
            attendanceStatus: status,
            attendedAt: status === 'present' ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
          };
        });
        localStorage.setItem('chapteros_collab_participants_fallback', JSON.stringify(updated));
      }
    } catch (err) {
      console.warn('Local bulk update attendance failed:', err);
    }
  },
};
