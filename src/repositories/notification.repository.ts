import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type DbNotification = Database['public']['Tables']['notifications']['Row'];

export const notificationRepository = {
  /**
   * Fetch all notification keys that this user has marked as read in this organization
   */
  async getReadKeys(organizationId: string, userId: string): Promise<Set<string>> {
    if (!isSupabaseConfigured || !organizationId || !userId) {
      return new Set();
    }

    try {
      const { data, error } = await (supabase.from('user_notification_reads' as any) as any)
        .select('notification_key')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_read', true);

      if (error) {
        console.warn('Failed to fetch notification reads from DB, using fallback:', error.message);
        return new Set();
      }

      return new Set((data || []).map((r: { notification_key: string }) => r.notification_key));
    } catch (err) {
      console.warn('Notification read table not accessible, fallback to in-memory/local:', err);
      return new Set();
    }
  },

  /**
   * Mark a single notification key as read
   */
  async markAsRead(organizationId: string, userId: string, notificationKey: string): Promise<void> {
    if (!isSupabaseConfigured || !organizationId || !userId || !notificationKey) {
      return;
    }

    try {
      const { error } = await (supabase.from('user_notification_reads' as any) as any)
        .upsert(
          {
            organization_id: organizationId,
            user_id: userId,
            notification_key: notificationKey,
            is_read: true,
            read_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,organization_id,notification_key' }
        );

      if (error) {
        console.warn('Could not persist markAsRead:', error.message);
      }
    } catch (err) {
      console.warn('Exception in markAsRead:', err);
    }
  },

  /**
   * Mark multiple notification keys as read
   */
  async markAllAsRead(
    organizationId: string,
    userId: string,
    notificationKeys: string[]
  ): Promise<void> {
    if (!isSupabaseConfigured || !organizationId || !userId || notificationKeys.length === 0) {
      return;
    }

    try {
      const records = notificationKeys.map((key) => ({
        organization_id: organizationId,
        user_id: userId,
        notification_key: key,
        is_read: true,
        read_at: new Date().toISOString(),
      }));

      const { error } = await (supabase.from('user_notification_reads' as any) as any)
        .upsert(records, { onConflict: 'user_id,organization_id,notification_key' });

      if (error) {
        console.warn('Could not persist markAllAsRead:', error.message);
      }
    } catch (err) {
      console.warn('Exception in markAllAsRead:', err);
    }
  },

  /**
   * Fetch explicit system/board notifications
   */
  async getExplicitNotifications(
    organizationId: string,
    userId?: string
  ): Promise<DbNotification[]> {
    if (!isSupabaseConfigured || !organizationId) {
      return [];
    }

    try {
      let query = (supabase.from('notifications' as any) as any)
        .select('*')
        .eq('organization_id', organizationId);

      if (userId) {
        query = query.or(`user_id.is.null,user_id.eq.${userId}`);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('Explicit notifications table error:', error.message);
        return [];
      }

      return (data || []) as DbNotification[];
    } catch (err) {
      console.warn('Could not query notifications table:', err);
      return [];
    }
  },

  /**
   * Create an explicit notification in DB
   */
  async createNotification(payload: {
    organization_id: string;
    user_id?: string | null;
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'danger' | 'success';
    category?: 'task' | 'activity' | 'finance' | 'document' | 'integration' | 'system' | 'general';
    link?: string | null;
    entity_type?: string | null;
    entity_id?: string | null;
    metadata?: Record<string, any>;
  }): Promise<void> {
    if (!isSupabaseConfigured || !payload.organization_id) return;

    try {
      const { error } = await (supabase.from('notifications' as any) as any).insert({
        organization_id: payload.organization_id,
        user_id: payload.user_id || null,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'info',
        category: payload.category || 'general',
        link: payload.link || null,
        entity_type: payload.entity_type || null,
        entity_id: payload.entity_id || null,
        metadata: payload.metadata || {},
      });

      if (error) {
        console.warn('Could not insert explicit notification:', error.message);
      }
    } catch (err) {
      console.warn('Exception in createNotification:', err);
    }
  },
};
