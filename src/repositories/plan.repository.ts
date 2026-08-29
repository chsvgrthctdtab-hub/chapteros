import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { Plan, PlanOrganization, PlanStatus, Organization } from '@/types';

export type DbPlan = Database['public']['Tables']['plans']['Row'];
export type DbPlanInsert = Database['public']['Tables']['plans']['Insert'];
export type DbPlanUpdate = Database['public']['Tables']['plans']['Update'];

export type DbPlanOrganization = Database['public']['Tables']['plan_organizations']['Row'];
export type DbPlanOrganizationInsert = Database['public']['Tables']['plan_organizations']['Insert'];

export interface PlanFilterParams {
  search?: string;
  status?: PlanStatus | 'all';
  leadOrgId?: string;
}

export const planRepository = {
  /**
   * List plans that the given organization is participating in or leading, or all plans for user orgs
   */
  async listPlans(organizationIds: string[], params: PlanFilterParams = {}): Promise<Plan[]> {
    if (!isSupabaseConfigured || !organizationIds.length) {
      return [];
    }

    const { search, status } = params;

    // Step 1: Find all plan_ids that the user's organizations belong to OR lead
    const { data: cohostData, error: cohostError } = await supabase
      .from('plan_organizations')
      .select('plan_id')
      .in('organization_id', organizationIds);

    if (cohostError) throw cohostError;

    const participatedPlanIds = Array.from(
      new Set((cohostData as any[] || []).map((c: any) => c.plan_id).filter(Boolean))
    );

    // Also get plans where lead_organization_id is in organizationIds
    let query = supabase
      .from('plans')
      .select(`
        *,
        lead_organization:organizations!plans_lead_organization_id_fkey(
          id,
          name,
          code,
          type,
          parent_id,
          logo_url
        ),
        plan_organizations(
          id,
          plan_id,
          organization_id,
          role_in_plan,
          is_host,
          role_description,
          status,
          joined_at,
          created_at,
          updated_at,
          organization:organizations(
            id,
            name,
            code,
            type,
            parent_id,
            logo_url
          )
        ),
        activities(id)
      `);

    // Filter by either lead_organization_id IN (orgs) OR id IN (participatedPlanIds)
    if (participatedPlanIds.length > 0) {
      query = query.or(
        `lead_organization_id.in.(${organizationIds.join(',')}),id.in.(${participatedPlanIds.join(',')})`
      );
    } else {
      query = query.in('lead_organization_id', organizationIds);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search && search.trim()) {
      const keyword = search.trim();
      query = query.or(`name.ilike.%${keyword}%,code.ilike.%${keyword}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      leadOrganizationId: row.lead_organization_id,
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      leadOrganization: row.lead_organization
        ? {
            id: row.lead_organization.id,
            name: row.lead_organization.name,
            code: row.lead_organization.code,
            type: row.lead_organization.type || 'chi_hoi',
            parentId: row.lead_organization.parent_id || null,
            logoUrl: row.lead_organization.logo_url,
            createdAt: '',
            updatedAt: '',
          }
        : undefined,
      organizations: (row.plan_organizations || []).map((po: any) => ({
        id: po.id,
        planId: po.plan_id || row.id,
        organizationId: po.organization_id,
        roleInPlan: po.role_in_plan || (po.is_host ? 'host' : 'co_host'),
        isHost: Boolean(po.is_host),
        roleDescription: po.role_description,
        status: po.status || 'active',
        joinedAt: po.joined_at,
        createdAt: po.created_at,
        updatedAt: po.updated_at,
        organization: po.organization
          ? {
              id: po.organization.id,
              name: po.organization.name,
              code: po.organization.code,
              type: po.organization.type || 'chi_hoi',
              parentId: po.organization.parent_id || null,
              logoUrl: po.organization.logo_url,
              createdAt: '',
              updatedAt: '',
            }
          : undefined,
      })),
      activitiesCount: Array.isArray(row.activities) ? row.activities.length : 0,
    }));
  },

  /**
   * Get single plan detail with cohosts & host org
   */
  async getPlanDetail(planId: string): Promise<Plan | null> {
    if (!isSupabaseConfigured || !planId) return null;

    const { data, error } = await supabase
      .from('plans')
      .select(`
        *,
        lead_organization:organizations!plans_lead_organization_id_fkey(
          id,
          name,
          code,
          type,
          parent_id,
          logo_url
        ),
        plan_organizations(
          id,
          plan_id,
          organization_id,
          role_in_plan,
          is_host,
          role_description,
          status,
          joined_at,
          created_at,
          updated_at,
          organization:organizations(
            id,
            name,
            code,
            type,
            parent_id,
            logo_url
          )
        ),
        activities(id)
      `)
      .eq('id', planId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const row: any = data;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      leadOrganizationId: row.lead_organization_id,
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      leadOrganization: row.lead_organization
        ? {
            id: row.lead_organization.id,
            name: row.lead_organization.name,
            code: row.lead_organization.code,
            type: row.lead_organization.type || 'chi_hoi',
            parentId: row.lead_organization.parent_id || null,
            logoUrl: row.lead_organization.logo_url,
            createdAt: '',
            updatedAt: '',
          }
        : undefined,
      organizations: (row.plan_organizations || []).map((po: any) => ({
        id: po.id,
        planId: po.plan_id || row.id,
        organizationId: po.organization_id,
        roleInPlan: po.role_in_plan || (po.is_host ? 'host' : 'co_host'),
        isHost: Boolean(po.is_host),
        roleDescription: po.role_description,
        status: po.status || 'active',
        joinedAt: po.joined_at,
        createdAt: po.created_at,
        updatedAt: po.updated_at,
        organization: po.organization
          ? {
              id: po.organization.id,
              name: po.organization.name,
              code: po.organization.code,
              type: po.organization.type || 'chi_hoi',
              parentId: po.organization.parent_id || null,
              logoUrl: po.organization.logo_url,
              createdAt: '',
              updatedAt: '',
            }
          : undefined,
      })),
      activitiesCount: Array.isArray(row.activities) ? row.activities.length : 0,
    };
  },

  /**
   * Create a new plan using the secure RPC create_plan_secure with table insert fallback.
   * Note: DB trigger and RPC automatically handle inserting lead organization as host into plan_organizations.
   */
  async createPlan(payload: DbPlanInsert): Promise<Plan> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    let planId: string | undefined;

    try {
      const { data, error } = await supabase.rpc('create_plan_secure', {
        p_lead_org_id: payload.lead_organization_id,
        p_code: payload.code,
        p_name: payload.name,
        p_description: payload.description || null,
        p_start_date: payload.start_date || null,
        p_end_date: payload.end_date || null,
        p_status: payload.status || 'planning',
      } as never);

      if (!error && data) {
        planId =
          typeof data === 'string'
            ? data
            : (data as { id?: string; plan_id?: string })?.id ||
              (data as { id?: string; plan_id?: string })?.plan_id;
      } else if (error) {
        const isFuncMissing =
          error.code === 'PGRST202' ||
          error.message?.includes('Could not find the function') ||
          error.message?.includes('function public.create_plan_secure');
        if (!isFuncMissing) {
          console.error('Lỗi tạo kế hoạch RPC:', error);
          throw error;
        }
      }
    } catch (rpcErr: any) {
      const isFuncMissing =
        rpcErr?.code === 'PGRST202' ||
        rpcErr?.message?.includes('Could not find the function') ||
        rpcErr?.message?.includes('function public.create_plan_secure');
      if (!isFuncMissing) {
        throw rpcErr;
      }
    }

    // Resilient fallback: direct table insert if RPC is not present in schema cache
    if (!planId) {
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .insert(payload as never)
        .select()
        .single();

      if (planError) throw planError;
      const createdPlan = planData as DbPlan;
      planId = createdPlan.id;

      // Ensure host is recorded in plan_organizations
      await supabase.from('plan_organizations').upsert(
        {
          plan_id: planId,
          organization_id: payload.lead_organization_id,
          role_in_plan: 'host',
          is_host: true,
          status: 'active',
          role_description: 'Đơn vị chủ trì',
          joined_at: new Date().toISOString(),
        } as never,
        { onConflict: 'plan_id,organization_id' }
      );
    }

    if (planId && typeof planId === 'string') {
      const created = await this.getPlanDetail(planId);
      if (created) return created;
    }

    return {
      id: typeof planId === 'string' ? planId : '',
      code: payload.code,
      name: payload.name,
      description: payload.description || null,
      startDate: payload.start_date || null,
      endDate: payload.end_date || null,
      leadOrganizationId: payload.lead_organization_id,
      status: (payload.status as PlanStatus) || 'planning',
      createdBy: payload.created_by || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Update plan
   */
  async updatePlan(id: string, payload: DbPlanUpdate): Promise<Plan> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { error } = await supabase
      .from('plans')
      .update(payload as never)
      .eq('id', id);

    if (error) throw error;
    const updated = await this.getPlanDetail(id);
    if (!updated) throw new Error('Failed to fetch updated plan');
    return updated;
  },

  /**
   * Delete plan
   */
  async deletePlan(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Invite an organization to participate in a plan (status = pending)
   */
  async addCohost(
    planId: string,
    organizationId: string,
    roleDescription?: string,
    roleInPlan: 'co_host' | 'partner' | 'supporter' | 'observer' = 'co_host'
  ): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase.from('plan_organizations').insert({
      plan_id: planId,
      organization_id: organizationId,
      role_in_plan: roleInPlan,
      is_host: false,
      status: 'pending',
      role_description: roleDescription || 'Đơn vị đồng tổ chức',
    } as never);

    if (error) throw error;
  },

  /**
   * Accept an invitation to join a plan (status = active)
   */
  async acceptPlanInvitation(planId: string, organizationId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('plan_organizations')
      .update({
        status: 'active',
        joined_at: new Date().toISOString(),
      } as never)
      .eq('plan_id', planId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  },

  /**
   * Reject an invitation to join a plan (status = rejected)
   */
  async rejectPlanInvitation(planId: string, organizationId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('plan_organizations')
      .update({
        status: 'rejected',
      } as never)
      .eq('plan_id', planId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  },

  /**
   * Remove a co-host organization from plan (status = removed)
   */
  async removeCohost(planId: string, organizationId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('plan_organizations')
      .update({
        status: 'removed',
      } as never)
      .eq('plan_id', planId)
      .eq('organization_id', organizationId);

    if (error) throw error;
  },

  /**
   * Get activities belonging to a plan
   */
  async getPlanActivities(planId: string): Promise<any[]> {
    if (!isSupabaseConfigured || !planId) return [];

    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        organization:organizations(
          id,
          name,
          code
        ),
        term:terms(
          id,
          name
        ),
        lead_member:members(
          id,
          full_name,
          student_id
        ),
        participants:activity_participants(
          id,
          registration_status,
          attendance_status
        )
      `)
      .eq('plan_id', planId)
      .order('start_date', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      termId: row.term_id,
      planId: row.plan_id,
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
      organization: row.organization,
      term: row.term,
      leadMember: row.lead_member,
      participantStats: {
        total: (row.participants || []).length,
        registered: (row.participants || []).filter((p: any) => p.registration_status === 'registered').length,
        confirmed: (row.participants || []).filter((p: any) => p.registration_status === 'confirmed').length,
        present: (row.participants || []).filter((p: any) => p.attendance_status === 'present').length,
        absent: (row.participants || []).filter((p: any) => p.attendance_status === 'absent').length,
      },
    }));
  },
};
