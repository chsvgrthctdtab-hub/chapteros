import { useQuery } from '@tanstack/react-query';
import { googleCalendarService } from './google-calendar.service';
import { CALENDAR_SYNC_INTERVAL_MS } from './google-calendar.constants';

export const googleCalendarKeys = {
  all: ['google-calendar'] as const,
  calendars: (orgId?: string) => [...googleCalendarKeys.all, 'calendars', orgId || ''] as const,
  activityEvent: (activityId?: string, orgId?: string) =>
    [...googleCalendarKeys.all, 'activity-event', activityId || '', orgId || ''] as const,
};

/**
 * Query to list available user/organization Google Calendars
 */
export function useUserCalendars(orgId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: googleCalendarKeys.calendars(orgId),
    queryFn: () => googleCalendarService.listUserCalendars(orgId),
    enabled,
    staleTime: CALENDAR_SYNC_INTERVAL_MS,
  });
}

/**
 * Query to fetch calendar event integration metadata for a specific Activity
 */
export function useActivityCalendarEvent(activityId?: string, orgId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: googleCalendarKeys.activityEvent(activityId, orgId),
    queryFn: () => googleCalendarService.getActivityCalendarEvent(activityId || '', orgId || ''),
    enabled: Boolean(activityId && orgId && enabled),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
