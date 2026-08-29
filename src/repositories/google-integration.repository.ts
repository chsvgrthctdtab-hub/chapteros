import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { GoogleConnection, GoogleConnectionStatus, GoogleConnectionType } from '@/types';

type DbGoogleConn = Database['public']['Tables']['google_connections']['Row'];
type DbGoogleConnInsert = Database['public']['Tables']['google_connections']['Insert'];
type DbGoogleConnUpdate = Database['public']['Tables']['google_connections']['Update'];
type DbCalEvent = Database['public']['Tables']['google_calendar_events']['Row'];
type DbCalEventInsert = Database['public']['Tables']['google_calendar_events']['Insert'];
type DbForm = Database['public']['Tables']['activity_forms']['Row'];
type DbSheet = Database['public']['Tables']['google_sheet_connections']['Row'];

function mapGoogleConnectionFromDb(row: DbGoogleConn): GoogleConnection {
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    connectionType: row.connection_type as GoogleConnectionType,
    googleAccountId: row.google_account_id,
    googleEmail: row.google_email,
    googleName: row.google_name,
    googleAvatarUrl: row.google_avatar_url,
    status: row.status as GoogleConnectionStatus,
    grantedScopes: (row.granted_scopes as string[]) || [],
    tokenExpiresAt: row.token_expires_at,
    lastVerifiedAt: row.last_verified_at,
    errorMessage: row.error_message,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const googleIntegrationRepository = {
  // Google Connections
  async getUserConnection(userId: string): Promise<GoogleConnection | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('google_connections')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapGoogleConnectionFromDb(data) : null;
  },

  async getOrgConnection(orgId: string): Promise<GoogleConnection | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('google_connections')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapGoogleConnectionFromDb(data) : null;
  },

  async upsertConnection(payload: DbGoogleConnInsert): Promise<GoogleConnection> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const isUser = payload.connection_type === 'user';
    const onConflictTarget = isUser ? 'user_id,connection_type' : 'organization_id,connection_type';

    const { data, error } = await supabase
      .from('google_connections')
      .upsert(payload as never, {
        onConflict: onConflictTarget,
      })
      .select()
      .single();

    if (error) throw error;
    return mapGoogleConnectionFromDb(data as DbGoogleConn);
  },

  async deleteConnection(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('google_connections')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Calendar Events
  async getCalendarEvent(activityId: string, orgId: string): Promise<DbCalEvent | null> {
    if (!isSupabaseConfigured || !activityId || !orgId) return null;
    const { data, error } = await supabase
      .from('google_calendar_events')
      .select('*')
      .eq('activity_id', activityId)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) throw error;
    return (data as DbCalEvent) || null;
  },

  async saveCalendarEvent(payload: DbCalEventInsert): Promise<DbCalEvent> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { data, error } = await supabase
      .from('google_calendar_events')
      .upsert(payload as never, {
        onConflict: 'activity_id,google_calendar_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data as DbCalEvent;
  },

  async deleteCalendarEvent(id: string, orgId: string): Promise<void> {
    if (!isSupabaseConfigured || !id || !orgId) return;
    const { error } = await supabase
      .from('google_calendar_events')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) throw error;
  },

  // Google Forms
  async getActivityForms(activityId: string): Promise<DbForm[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('activity_forms')
      .select('*')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Google Sheets
  async getOrgSheets(orgId: string): Promise<DbSheet[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('google_sheet_connections')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
