import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type {
  AuditLogFilterParams,
  AuditLogItemWithActor,
  AuditLogListResult,
  AuditLogActor,
} from '@/features/audit-logs/types/audit-log.types';
import {
  formatAuditActionLabel,
  inferModuleFromAction,
  AUDIT_MODULE_CONFIG,
} from '@/features/audit-logs/utils/audit-log-formatter';

type DbAuditLog = Database['public']['Tables']['audit_logs']['Row'];
type DbAuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

export interface AuditLogItem {
  id: string;
  organizationId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

function mapAuditLogRow(row: any): AuditLogItemWithActor {
  const actorProfile = row.profiles as {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string | null;
    student_id?: string | null;
  } | null;

  const actor: AuditLogActor | null = actorProfile
    ? {
        id: actorProfile.id,
        fullName: actorProfile.full_name || 'Thành viên',
        email: actorProfile.email || '',
        avatarUrl: actorProfile.avatar_url,
        studentId: actorProfile.student_id,
      }
    : null;

  const action = row.action || '';
  const moduleName = inferModuleFromAction(action);
  const moduleLabel = AUDIT_MODULE_CONFIG[moduleName]?.label || 'Hệ thống';

  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    actor,
    action,
    actionLabel: formatAuditActionLabel(action),
    module: moduleName,
    moduleLabel,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at,
  };
}

export const auditLogRepository = {
  /**
   * List audit logs with pagination and filters
   */
  async list(organizationId: string, params: AuditLogFilterParams = {}): Promise<AuditLogListResult> {
    if (!isSupabaseConfigured || !organizationId) {
      return { data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };
    }

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 20));
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('audit_logs')
      .select(
        `
        id,
        organization_id,
        user_id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at,
        profiles:user_id (
          id,
          full_name,
          email,
          avatar_url,
          student_id
        )
      `,
        { count: 'exact' }
      )
      .eq('organization_id', organizationId);

    // Filter by module (e.g. action like 'member.%' or 'activity.%')
    if (params.module && params.module !== 'all') {
      query = query.ilike('action', `${params.module}.%`);
    }

    // Filter by specific action
    if (params.action && params.action !== 'all') {
      query = query.eq('action', params.action);
    }

    // Filter by user / actor
    if (params.userId && params.userId !== 'all') {
      query = query.eq('user_id', params.userId);
    }

    // Filter by Date Range
    if (params.dateFrom) {
      query = query.gte('created_at', `${params.dateFrom}T00:00:00.000Z`);
    }
    if (params.dateTo) {
      query = query.lte('created_at', `${params.dateTo}T23:59:59.999Z`);
    }

    // Search by text
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      query = query.or(
        `action.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%,entity_id.ilike.%${searchTerm}%`
      );
    }

    // Sort descending by creation date and apply pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to list audit logs:', error);
      throw error;
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: (data || []).map(mapAuditLogRow),
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  async getByOrganization(organizationId: string, limit = 50): Promise<AuditLogItem[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((row: DbAuditLog) => ({
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: row.created_at,
    }));
  },

  async log(payload: DbAuditLogInsert): Promise<void> {
    if (!isSupabaseConfigured) return;
    if (!payload.organization_id) {
      return;
    }

    const { error } = await supabase
      .from('audit_logs')
      .insert(payload as never);

    if (error) {
      console.warn('Failed to insert audit log:', error.message);
    }
  },
};
