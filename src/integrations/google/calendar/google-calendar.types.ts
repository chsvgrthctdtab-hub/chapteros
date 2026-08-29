import type { Activity } from '@/types';

export type ActivityCalendarSyncStatus =
  | 'not_linked'
  | 'linked'
  | 'syncing'
  | 'synced'
  | 'error'
  | 'unavailable';

export interface ActivityCalendarEvent {
  id: string;
  organizationId: string;
  activityId: string;
  userId?: string | null;
  googleCalendarId: string;
  googleCalendarSummary?: string | null;
  googleEventId: string;
  eventUrl?: string | null;
  status: ActivityCalendarSyncStatus;
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // Hydrated activity reference
  activity?: Activity | null;
}

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  timeZone?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
}

export interface GoogleCalendarEventPayload {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string; // ISO 8601 string for timed events (e.g. 2026-08-20T08:00:00+07:00)
    date?: string;     // YYYY-MM-DD for all-day events
    timeZone?: string; // e.g. "Asia/Ho_Chi_Minh"
  };
  end: {
    dateTime?: string; // ISO 8601 string for timed events
    date?: string;     // YYYY-MM-DD for all-day events
    timeZone?: string; // e.g. "Asia/Ho_Chi_Minh"
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  source?: {
    title: string;
    url: string;
  };
}

export interface CreateCalendarEventParams {
  organizationId: string;
  activityId: string;
  calendarId: string;
  calendarSummary?: string;
  userId?: string;
}

export interface UpdateCalendarEventParams {
  organizationId: string;
  activityId: string;
  calendarEventId: string;
  calendarId?: string;
  userId?: string;
}

export interface UnlinkCalendarEventParams {
  calendarEventId: string;
  organizationId: string;
  activityId: string;
  userId?: string;
}

export interface DeleteGoogleCalendarEventParams {
  calendarEventId: string;
  organizationId: string;
  activityId: string;
  calendarId: string;
  googleEventId: string;
  userId?: string;
}

export interface CalendarEventValidationResult {
  isValid: boolean;
  hasTitle: boolean;
  hasValidDates: boolean;
  isStartDateBeforeEnd: boolean;
  errors: string[];
}
