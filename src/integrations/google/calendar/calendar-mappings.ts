import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import type { Activity } from '@/types';
import type { GoogleCalendarEventPayload, CalendarEventValidationResult } from './google-calendar.types';
import { APP_DEFAULT_TIMEZONE } from './google-calendar.constants';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Validates whether an Activity is ready to be projected to Google Calendar
 */
export function validateActivityForCalendar(activity: Partial<Activity> | null | undefined): CalendarEventValidationResult {
  const errors: string[] = [];
  if (!activity) {
    return {
      isValid: false,
      hasTitle: false,
      hasValidDates: false,
      isStartDateBeforeEnd: false,
      errors: ['Không tìm thấy thông tin hoạt động.'],
    };
  }

  const hasTitle = Boolean(activity.title && activity.title.trim().length > 0);
  if (!hasTitle) {
    errors.push('Hoạt động chưa có tiêu đề tên.');
  }

  const hasStartDate = Boolean(activity.startDate && dayjs(activity.startDate).isValid());
  const hasEndDate = Boolean(activity.endDate && dayjs(activity.endDate).isValid());
  const hasValidDates = hasStartDate && hasEndDate;

  if (!hasStartDate) {
    errors.push('Hoạt động chưa có thời gian bắt đầu hợp lệ.');
  }
  if (!hasEndDate) {
    errors.push('Hoạt động chưa có thời gian kết thúc hợp lệ.');
  }

  let isStartDateBeforeEnd = true;
  if (hasValidDates) {
    const start = dayjs(activity.startDate);
    const end = dayjs(activity.endDate);
    if (end.isBefore(start)) {
      isStartDateBeforeEnd = false;
      errors.push('Thời gian kết thúc không thể trước thời gian bắt đầu.');
    }
  }

  return {
    isValid: errors.length === 0,
    hasTitle,
    hasValidDates,
    isStartDateBeforeEnd,
    errors,
  };
}

/**
 * Checks if a given timestamp represents an all-day event or a timed event.
 * In Chi Hội Manager, if the string has no specific time (00:00:00 to 00:00:00 with date-only format)
 * or if start is at 00:00 and end is at 23:59 on the same/subsequent day, it can be treated as timed or all-day.
 * By default, ISO timestamps with hours/minutes will be projected as timed ISO strings in GMT+7.
 */
export function isAllDayEvent(startDateStr: string, endDateStr: string): boolean {
  // If date string contains 'T00:00:00' and end is 'T23:59:59' or identical date without time part
  if (!startDateStr || !endDateStr) return false;
  
  const start = dayjs(startDateStr);
  const end = dayjs(endDateStr);

  const startHour = start.hour();
  const startMinute = start.minute();
  const endHour = end.hour();
  const endMinute = end.minute();

  // If start is 00:00:00 and end is 23:59:00 or 00:00:00 next day
  if (startHour === 0 && startMinute === 0 && ((endHour === 23 && endMinute >= 50) || (endHour === 0 && endMinute === 0))) {
    return true;
  }

  return false;
}

/**
 * Maps an Activity model to a Google Calendar Event payload
 * Enforces Vietnam timezone (GMT+7) strictly so browser timezone does not drift event times.
 */
export function mapActivityToGoogleCalendarEvent(
  activity: Activity,
  appUrl?: string
): GoogleCalendarEventPayload {
  const isAllDay = isAllDayEvent(activity.startDate, activity.endDate);

  const startDayjs = dayjs(activity.startDate);
  const endDayjs = dayjs(activity.endDate);

  // Construct structured description
  const descriptionParts: string[] = [];

  if (activity.code) {
    descriptionParts.push(`📌 Mã hoạt động: ${activity.code}`);
  }
  if (activity.category) {
    descriptionParts.push(`🏷️ Mảng hoạt động: ${activity.category}`);
  }
  if (activity.location) {
    descriptionParts.push(`📍 Địa điểm: ${activity.location}`);
  }
  if (activity.description) {
    descriptionParts.push(`\n📝 Nội dung chi tiết:\n${activity.description.trim()}`);
  }

  descriptionParts.push(`\n------------------------------`);
  descriptionParts.push(`Được đồng bộ tự động từ ChapterOS (Nền tảng quản trị Chi hội sinh viên).`);
  if (appUrl) {
    descriptionParts.push(`🔗 Xem trên hệ thống: ${appUrl}`);
  }

  const payload: GoogleCalendarEventPayload = {
    summary: activity.title,
    description: descriptionParts.join('\n'),
    location: activity.location || undefined,
    start: {},
    end: {},
    reminders: {
      useDefault: true,
    },
  };

  if (isAllDay) {
    payload.start = {
      date: startDayjs.format('YYYY-MM-DD'),
    };
    // For all-day events in Google Calendar, end date is exclusive (add 1 day if start == end)
    const exclusiveEnd = endDayjs.isSame(startDayjs, 'day')
      ? endDayjs.add(1, 'day').format('YYYY-MM-DD')
      : endDayjs.format('YYYY-MM-DD');
    payload.end = {
      date: exclusiveEnd,
    };
  } else {
    // Timed event: explicitly normalize to ISO string with application timezone
    payload.start = {
      dateTime: startDayjs.toISOString(),
      timeZone: APP_DEFAULT_TIMEZONE,
    };
    payload.end = {
      dateTime: endDayjs.toISOString(),
      timeZone: APP_DEFAULT_TIMEZONE,
    };
  }

  return payload;
}

/**
 * Constructs the standard Google Calendar render template / Deeplink URL
 * format: https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...&location=...&ctz=Asia/Ho_Chi_Minh
 * Ensures timezone is strictly Asia/Ho_Chi_Minh and UTC conversion is mathematically accurate.
 */
export function buildGoogleCalendarTemplateUrl(
  activity: Activity,
  appUrl?: string
): string {
  const isAllDay = isAllDayEvent(activity.startDate, activity.endDate);
  const startDayjs = dayjs(activity.startDate);
  const endDayjs = dayjs(activity.endDate);

  let datesParam = '';
  if (isAllDay) {
    const startStr = startDayjs.format('YYYYMMDD');
    // For all-day events in Google Calendar render template, end date is exclusive
    const exclusiveEndStr = endDayjs.isSame(startDayjs, 'day')
      ? endDayjs.add(1, 'day').format('YYYYMMDD')
      : endDayjs.format('YYYYMMDD');
    datesParam = `${startStr}/${exclusiveEndStr}`;
  } else {
    // Format in UTC for precise cross-timezone rendering: YYYYMMDDTHHmmssZ
    const startUtcStr = startDayjs.utc().format('YYYYMMDDTHHmmss[Z]');
    const endUtcStr = endDayjs.utc().format('YYYYMMDDTHHmmss[Z]');
    datesParam = `${startUtcStr}/${endUtcStr}`;
  }

  // Construct structured description
  const descriptionParts: string[] = [];
  if (activity.code) {
    descriptionParts.push(`📌 Mã hoạt động: ${activity.code}`);
  }
  if (activity.category) {
    descriptionParts.push(`🏷️ Mảng hoạt động: ${activity.category}`);
  }
  if (activity.location) {
    descriptionParts.push(`📍 Địa điểm: ${activity.location}`);
  }
  if (activity.description) {
    descriptionParts.push(`\n📝 Nội dung chi tiết:\n${activity.description.trim()}`);
  }
  descriptionParts.push(`\n------------------------------`);
  descriptionParts.push(`Được đồng bộ từ ChapterOS (Nền tảng quản trị Chi hội sinh viên).`);
  if (appUrl) {
    descriptionParts.push(`🔗 Xem trên hệ thống: ${appUrl}`);
  }

  const searchParams = new URLSearchParams();
  searchParams.set('action', 'TEMPLATE');
  searchParams.set('text', activity.title);
  searchParams.set('dates', datesParam);
  searchParams.set('details', descriptionParts.join('\n'));
  if (activity.location) {
    searchParams.set('location', activity.location);
  }
  searchParams.set('ctz', APP_DEFAULT_TIMEZONE);

  return `https://calendar.google.com/calendar/render?${searchParams.toString()}`;
}

/**
 * Builds Google Calendar web view URL for an event ID or fallback to template URL
 */
export function buildGoogleCalendarEventUrl(
  googleEventId?: string | null,
  calendarId: string = 'primary'
): string {
  if (!googleEventId) {
    return 'https://calendar.google.com/calendar/r';
  }
  try {
    const cleanCalendarId = calendarId === 'primary' ? '' : calendarId;
    const rawEid = cleanCalendarId ? `${googleEventId} ${cleanCalendarId}` : googleEventId;
    const base64Eid = btoa(rawEid).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `https://calendar.google.com/calendar/r/eventedit/${base64Eid}`;
  } catch {
    return `https://calendar.google.com/calendar/r/eventedit/${googleEventId}`;
  }
}
