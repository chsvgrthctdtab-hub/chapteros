import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { auditLogService } from '@/services/audit-log.service';
import type { Database, Json } from '@/types/database.types';
import type { Activity } from '@/types';
import type {
  ActivityCalendarEvent,
  GoogleCalendarItem,
  CreateCalendarEventParams,
  UpdateCalendarEventParams,
  UnlinkCalendarEventParams,
  DeleteGoogleCalendarEventParams,
} from './google-calendar.types';
import {
  LOCAL_STORAGE_CALENDAR_EVENTS_PREFIX,
  LOCAL_STORAGE_CACHED_CALENDARS_PREFIX,
  APP_DEFAULT_TIMEZONE,
} from './google-calendar.constants';
import {
  mapActivityToGoogleCalendarEvent,
  buildGoogleCalendarTemplateUrl,
  validateActivityForCalendar,
} from './calendar-mappings';

type DbCalRow = Database['public']['Tables']['google_calendar_events']['Row'];
type DbCalInsert = Database['public']['Tables']['google_calendar_events']['Insert'];
type DbCalUpdate = Database['public']['Tables']['google_calendar_events']['Update'];

interface RawCalendarEventRow extends DbCalRow {
  activity?: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    location: string | null;
    status: string;
    category: string;
    code: string | null;
  } | null;
}

function mapRowToCalendarEvent(row: RawCalendarEventRow): ActivityCalendarEvent {
  const meta = (row.metadata as Record<string, unknown>) || {};
  return {
    id: row.id,
    organizationId: row.organization_id,
    activityId: row.activity_id,
    userId: row.user_id,
    googleCalendarId: row.google_calendar_id,
    googleCalendarSummary:
      (meta.calendarSummary as string) ||
      (row.google_calendar_id === 'primary' ? 'Lịch chính (Primary Calendar)' : row.google_calendar_id),
    googleEventId: row.google_event_id,
    eventUrl: row.event_url,
    status: (row.status as ActivityCalendarEvent['status']) || 'linked',
    lastSyncedAt: row.last_synced_at,
    lastSyncError: (meta.lastSyncError as string) || null,
    metadata: meta,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    activity: row.activity
      ? ({
          id: row.activity.id,
          title: row.activity.title,
          startDate: row.activity.start_date,
          endDate: row.activity.end_date,
          location: row.activity.location,
          status: row.activity.status,
          category: row.activity.category,
          code: row.activity.code,
        } as unknown as Activity)
      : null,
  };
}

export const googleCalendarService = {
  /**
   * Fetch list of available Google Calendars for the organization/user
   */
  async listUserCalendars(orgId?: string): Promise<GoogleCalendarItem[]> {
    const defaultCalendars: GoogleCalendarItem[] = [
      {
        id: 'primary',
        summary: 'Lịch chính (Tài khoản Google liên kết)',
        description: 'Lịch cá nhân mặc định của tài khoản Google',
        primary: true,
        timeZone: APP_DEFAULT_TIMEZONE,
        accessRole: 'owner',
        backgroundColor: '#4285F4',
      },
      {
        id: 'chihoi_events_cal',
        summary: 'Lịch Hoạt động & Sự kiện Chi hội',
        description: 'Lịch chuyên đề dành riêng cho toàn bộ chương trình và hoạt động Đoàn - Hội',
        primary: false,
        timeZone: APP_DEFAULT_TIMEZONE,
        accessRole: 'writer',
        backgroundColor: '#0F9D58',
      },
      {
        id: 'chihoi_bch_meetings',
        summary: 'Lịch Họp Ban Chấp Hành & Công tác',
        description: 'Lịch nội bộ dành cho các cuộc họp định kỳ và sinh hoạt chuyên môn BCH',
        primary: false,
        timeZone: APP_DEFAULT_TIMEZONE,
        accessRole: 'writer',
        backgroundColor: '#F4B400',
      },
    ];

    if (orgId) {
      const storageKey = `${LOCAL_STORAGE_CACHED_CALENDARS_PREFIX}${orgId}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    return defaultCalendars;
  },

  /**
   * Fetch calendar event integration record for a specific Activity
   */
  async getActivityCalendarEvent(activityId: string, orgId: string): Promise<ActivityCalendarEvent | null> {
    if (!activityId || !orgId) return null;

    if (!isSupabaseConfigured) {
      const storageKey = `${LOCAL_STORAGE_CALENDAR_EVENTS_PREFIX}${orgId}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          const list: ActivityCalendarEvent[] = JSON.parse(raw);
          const found = list.find((item) => item.activityId === activityId);
          return found || null;
        } catch {
          return null;
        }
      }
      return null;
    }

    try {
      // 1. Try google_calendar_events first
      const { data, error } = await supabase
        .from('google_calendar_events')
        .select(`
          id,
          organization_id,
          activity_id,
          user_id,
          google_calendar_id,
          google_event_id,
          event_url,
          status,
          last_synced_at,
          metadata,
          created_at,
          updated_at,
          activity:activities!activity_id(
            id,
            title,
            start_date,
            end_date,
            location,
            status,
            category,
            code
          )
        `)
        .eq('activity_id', activityId)
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!error && data) {
        return mapRowToCalendarEvent(data as unknown as RawCalendarEventRow);
      }

      // 2. Try activity_calendar_events fallback
      const { data: compatData, error: compatError } = await supabase
        .from('activity_calendar_events')
        .select(`
          id,
          organization_id,
          activity_id,
          user_id,
          google_calendar_id,
          google_event_id,
          event_url,
          status,
          last_synced_at,
          metadata,
          created_at,
          updated_at,
          activity:activities!activity_id(
            id,
            title,
            start_date,
            end_date,
            location,
            status,
            category,
            code
          )
        `)
        .eq('activity_id', activityId)
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!compatError && compatData) {
        return mapRowToCalendarEvent(compatData as unknown as RawCalendarEventRow);
      }

      // 3. Fallback to local storage
      const storageKey = `${LOCAL_STORAGE_CALENDAR_EVENTS_PREFIX}${orgId}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          const list: ActivityCalendarEvent[] = JSON.parse(raw);
          return list.find((item) => item.activityId === activityId) || null;
        } catch {
          return null;
        }
      }
      return null;
    } catch (err) {
      console.warn('[GoogleCalendar] Error fetching calendar event:', err);
      return null;
    }
  },

  /**
   * Create or project a Google Calendar event from an Activity
   * Idempotency guarantee: If an event is already linked, returns the existing record.
   */
  async createCalendarEvent(
    params: CreateCalendarEventParams,
    activity: Activity,
    appUrl?: string
  ): Promise<{ success: boolean; data?: ActivityCalendarEvent; error?: string }> {
    const { organizationId, activityId, calendarId, calendarSummary, userId } = params;

    // Multi-tenant check
    if (activity.organizationId && activity.organizationId !== organizationId) {
      return {
        success: false,
        error: 'Hoạt động không thuộc tổ chức hiện tại.',
      };
    }

    // 1. Validation
    const validation = validateActivityForCalendar(activity);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Không thể tạo liên kết lịch: ${validation.errors.join(' ')}`,
      };
    }

    // 2. Idempotency check: Don't duplicate if already linked
    const existing = await this.getActivityCalendarEvent(activityId, organizationId);
    if (existing && existing.googleEventId && existing.status !== 'unavailable') {
      return {
        success: true,
        data: existing,
      };
    }

    // 3. Build Google Calendar Deeplink / Template URL & Event Payload with strict timezone
    const eventPayload = mapActivityToGoogleCalendarEvent(activity, appUrl);
    const templateUrl = buildGoogleCalendarTemplateUrl(activity, appUrl);
    const generatedEventId = `g_evt_${activity.id.replace(/[^a-zA-Z0-9]/g, '')}`;

    const now = new Date().toISOString();
    const eventId = existing?.id || `cal_evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const calSummary = calendarSummary || (calendarId === 'primary' ? 'Lịch chính (Primary Calendar)' : calendarId);

    const newRecord: ActivityCalendarEvent = {
      id: eventId,
      organizationId,
      activityId,
      userId: userId || null,
      googleCalendarId: calendarId,
      googleCalendarSummary: calSummary,
      googleEventId: generatedEventId,
      eventUrl: templateUrl,
      status: 'linked',
      lastSyncedAt: now,
      lastSyncError: null,
      metadata: {
        lastPayload: eventPayload,
        calendarSummary: calSummary,
        timezone: APP_DEFAULT_TIMEZONE,
        templateUrl,
      },
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      activity,
    };

    // 4. Persist in local storage fallback
    const storageKey = `${LOCAL_STORAGE_CALENDAR_EVENTS_PREFIX}${organizationId}`;
    try {
      const raw = localStorage.getItem(storageKey);
      const list: ActivityCalendarEvent[] = raw ? JSON.parse(raw) : [];
      const index = list.findIndex((item) => item.activityId === activityId);
      if (index >= 0) {
        list[index] = newRecord;
      } else {
        list.push(newRecord);
      }
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch {
      // ignore
    }

    // 5. Persist in Supabase
    if (isSupabaseConfigured) {
      try {
        const payload: DbCalInsert = {
          id: newRecord.id,
          organization_id: organizationId,
          activity_id: activityId,
          user_id: userId || null,
          google_calendar_id: calendarId,
          google_event_id: generatedEventId,
          event_url: templateUrl,
          status: 'linked',
          last_synced_at: now,
          metadata: newRecord.metadata as Json,
          updated_at: now,
        };

        const { error } = await supabase
          .from('google_calendar_events')
          .upsert(payload as never, { onConflict: 'activity_id,google_calendar_id' });

        if (error) {
          console.warn('[GoogleCalendar] Error upserting to google_calendar_events:', error.message);
          // Also try activity_calendar_events table for backward compatibility
          await supabase
            .from('activity_calendar_events')
            .upsert(payload as never, { onConflict: 'activity_id' });
        }
      } catch (dbErr) {
        console.warn('[GoogleCalendar] Database upsert error for calendar events:', dbErr);
      }
    }

    // 6. Record Audit Log
    try {
      await auditLogService.logAction({
        organization_id: organizationId,
        user_id: userId || null,
        action: 'google_calendar.create',
        entity_type: 'activity_calendar_event',
        entity_id: newRecord.id,
        metadata: {
          activityId,
          activityTitle: activity.title,
          calendarId,
          templateUrl,
          timezone: APP_DEFAULT_TIMEZONE,
        } as Json,
      });
    } catch (auditErr) {
      console.warn('[GoogleCalendar] Could not write audit log for calendar creation:', auditErr);
    }

    return {
      success: true,
      data: newRecord,
    };
  },

  /**
   * Update an existing Google Calendar event when Activity details change
   */
  async updateCalendarEvent(
    params: UpdateCalendarEventParams,
    activity: Activity,
    appUrl?: string
  ): Promise<{ success: boolean; data?: ActivityCalendarEvent; error?: string }> {
    const { organizationId, activityId, calendarEventId, calendarId, userId } = params;

    // Multi-tenant check
    if (activity.organizationId && activity.organizationId !== organizationId) {
      return {
        success: false,
        error: 'Hoạt động không thuộc tổ chức hiện tại.',
      };
    }

    // 1. Validation
    const validation = validateActivityForCalendar(activity);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Không thể cập nhật liên kết lịch: ${validation.errors.join(' ')}`,
      };
    }

    // 2. Fetch existing event
    const existing = await this.getActivityCalendarEvent(activityId, organizationId);
    if (!existing) {
      return {
        success: false,
        error: 'Chưa có liên kết Google Calendar cho hoạt động này.',
      };
    }

    // 3. Rebuild Event Payload and Deeplink with updated info
    const eventPayload = mapActivityToGoogleCalendarEvent(activity, appUrl);
    const templateUrl = buildGoogleCalendarTemplateUrl(activity, appUrl);
    const targetCalId = calendarId || existing.googleCalendarId;

    const now = new Date().toISOString();
    const updatedRecord: ActivityCalendarEvent = {
      ...existing,
      googleCalendarId: targetCalId,
      eventUrl: templateUrl,
      status: 'linked',
      lastSyncedAt: now,
      lastSyncError: null,
      metadata: {
        ...existing.metadata,
        lastPayload: eventPayload,
        templateUrl,
        timezone: APP_DEFAULT_TIMEZONE,
      },
      updatedAt: now,
      activity,
    };

    // 4. Update local storage
    const storageKey = `${LOCAL_STORAGE_CALENDAR_EVENTS_PREFIX}${organizationId}`;
    try {
      const raw = localStorage.getItem(storageKey);
      const list: ActivityCalendarEvent[] = raw ? JSON.parse(raw) : [];
      const index = list.findIndex((item) => item.activityId === activityId);
      if (index >= 0) {
        list[index] = updatedRecord;
      } else {
        list.push(updatedRecord);
      }
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch {
      // ignore
    }

    // 5. Update Supabase
    if (isSupabaseConfigured) {
      try {
        const updatePayload: DbCalUpdate = {
          google_calendar_id: targetCalId,
          event_url: templateUrl,
          status: 'linked',
          last_synced_at: now,
          metadata: updatedRecord.metadata as Json,
          updated_at: now,
        };

        const { error } = await supabase
          .from('google_calendar_events')
          .update(updatePayload as never)
          .eq('id', calendarEventId)
          .eq('organization_id', organizationId);

        if (error) {
          console.warn('[GoogleCalendar] Error updating google_calendar_events:', error.message);
          await supabase
            .from('activity_calendar_events')
            .update(updatePayload as never)
            .eq('id', calendarEventId)
            .eq('organization_id', organizationId);
        }
      } catch (err) {
        console.warn('[GoogleCalendar] Database error updating calendar event:', err);
      }
    }

    // 6. Record Audit Log
    try {
      await auditLogService.logAction({
        organization_id: organizationId,
        user_id: userId || null,
        action: 'google_calendar.update',
        entity_type: 'activity_calendar_event',
        entity_id: calendarEventId,
        metadata: {
          activityId,
          activityTitle: activity.title,
          calendarId: targetCalId,
          templateUrl,
        } as Json,
      });
    } catch (auditErr) {
      console.warn('[GoogleCalendar] Could not write audit log for calendar update:', auditErr);
    }

    return {
      success: true,
      data: updatedRecord,
    };
  },

  /**
   * Unlink Google Calendar event from Chi Hội Manager
   * Policy: UNLINK ONLY (Do NOT delete event on Google Calendar, keep Activity completely intact)
   */
  async unlinkCalendarEvent(params: UnlinkCalendarEventParams): Promise<{ success: boolean; error?: string }> {
    const { calendarEventId, organizationId, activityId, userId } = params;

    // 1. Remove from local storage
    const storageKey = `${LOCAL_STORAGE_CALENDAR_EVENTS_PREFIX}${organizationId}`;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const list: ActivityCalendarEvent[] = JSON.parse(raw);
        const filtered = list.filter((item) => item.activityId !== activityId && item.id !== calendarEventId);
        localStorage.setItem(storageKey, JSON.stringify(filtered));
      }
    } catch {
      // ignore
    }

    // 2. Remove relationship record from Supabase
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('google_calendar_events')
          .delete()
          .eq('id', calendarEventId)
          .eq('organization_id', organizationId);

        if (error) {
          console.warn('[GoogleCalendar] Error unlinking google_calendar_events:', error.message);
          await supabase
            .from('activity_calendar_events')
            .delete()
            .eq('id', calendarEventId)
            .eq('organization_id', organizationId);
        }
      } catch (err) {
        console.warn('[GoogleCalendar] Database error unlinking calendar event:', err);
      }
    }

    // 3. Record Audit Log
    try {
      await auditLogService.logAction({
        organization_id: organizationId,
        user_id: userId || null,
        action: 'google_calendar.unlink',
        entity_type: 'activity_calendar_event',
        entity_id: calendarEventId,
        metadata: {
          activityId,
          timestamp: new Date().toISOString(),
        } as Json,
      });
    } catch (auditErr) {
      console.warn('[GoogleCalendar] Could not write audit log for calendar unlink:', auditErr);
    }

    return { success: true };
  },

  /**
   * Explicit action: Delete event mapping and unlink
   */
  async deleteGoogleCalendarEvent(params: DeleteGoogleCalendarEventParams): Promise<{ success: boolean; error?: string }> {
    const { calendarEventId, organizationId, activityId, userId } = params;

    // Perform unlink locally & in DB
    const res = await this.unlinkCalendarEvent({ calendarEventId, organizationId, activityId, userId });

    // Record delete audit log
    try {
      await auditLogService.logAction({
        organization_id: organizationId,
        user_id: userId || null,
        action: 'google_calendar.delete',
        entity_type: 'activity_calendar_event',
        entity_id: calendarEventId,
        metadata: {
          activityId,
          timestamp: new Date().toISOString(),
        } as Json,
      });
    } catch (auditErr) {
      console.warn('[GoogleCalendar] Could not write audit log for calendar delete:', auditErr);
    }

    return res;
  },

  /**
   * Mark event as unavailable
   */
  async markEventUnavailable(
    calendarEventId: string,
    organizationId: string,
    activityId: string
  ): Promise<ActivityCalendarEvent | null> {
    const existing = await this.getActivityCalendarEvent(activityId, organizationId);
    if (!existing) return null;

    const updated: ActivityCalendarEvent = {
      ...existing,
      status: 'unavailable',
      lastSyncError: 'Liên kết Google Calendar không khả dụng hoặc đã bị thay đổi.',
      updatedAt: new Date().toISOString(),
    };

    const storageKey = `${LOCAL_STORAGE_CALENDAR_EVENTS_PREFIX}${organizationId}`;
    try {
      const raw = localStorage.getItem(storageKey);
      const list: ActivityCalendarEvent[] = raw ? JSON.parse(raw) : [];
      const index = list.findIndex((item) => item.activityId === activityId);
      if (index >= 0) {
        list[index] = updated;
        localStorage.setItem(storageKey, JSON.stringify(list));
      }
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      try {
        const unavailablePayload: DbCalUpdate = {
          status: 'unavailable',
          metadata: {
            ...existing.metadata,
            lastSyncError: updated.lastSyncError,
          } as Json,
          updated_at: updated.updatedAt,
        };

        await supabase
          .from('google_calendar_events')
          .update(unavailablePayload as never)
          .eq('id', calendarEventId)
          .eq('organization_id', organizationId);
      } catch {
        // ignore
      }
    }

    return updated;
  },
};
