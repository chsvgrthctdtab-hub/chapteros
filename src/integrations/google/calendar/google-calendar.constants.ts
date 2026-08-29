/**
 * Chi Hội Manager - Google Calendar Integration Constants & Configuration
 */

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
];

/**
 * Standard Application Timezone for Vietnam / Chi Hội Union
 */
export const APP_DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const APP_DEFAULT_TIMEZONE_LABEL = 'Giờ Việt Nam (GMT+7)';

/**
 * Local storage keys for offline/preview persistence
 */
export const LOCAL_STORAGE_CALENDAR_EVENTS_PREFIX = 'chihoi_calendar_events_';
export const LOCAL_STORAGE_CACHED_CALENDARS_PREFIX = 'chihoi_user_calendars_';

/**
 * Google Calendar Web URL Base
 */
export const GOOGLE_CALENDAR_WEB_BASE = 'https://calendar.google.com/calendar/u/0/r/eventedit';

/**
 * Default event color / metadata flags
 */
export const CALENDAR_SYNC_INTERVAL_MS = 1000 * 60 * 10; // 10 mins stale time
