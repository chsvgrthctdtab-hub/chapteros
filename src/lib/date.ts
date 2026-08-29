import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/vi';

// Configure dayjs with Vietnamese locale and plugins
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(isBetween);
dayjs.locale('vi');

/**
 * Format a date string or Date object to standard Vietnamese date (DD/MM/YYYY)
 */
export function formatDate(date: string | Date | null | undefined, fallback = '—'): string {
  if (!date) return fallback;
  const d = dayjs(date);
  return d.isValid() ? d.format('DD/MM/YYYY') : fallback;
}

/**
 * Format a date with time (HH:mm - DD/MM/YYYY)
 */
export function formatDateTime(date: string | Date | null | undefined, fallback = '—'): string {
  if (!date) return fallback;
  const d = dayjs(date);
  return d.isValid() ? d.format('HH:mm - DD/MM/YYYY') : fallback;
}

/**
 * Format date time for display in activity cards (e.g., "08:00, 15 Th08 2026")
 */
export function formatLongDateTime(date: string | Date | null | undefined, fallback = '—'): string {
  if (!date) return fallback;
  const d = dayjs(date);
  return d.isValid() ? d.format('HH:mm, DD/MM/YYYY') : fallback;
}

/**
 * Format time only (HH:mm)
 */
export function formatTime(date: string | Date | null | undefined, fallback = '—'): string {
  if (!date) return fallback;
  const d = dayjs(date);
  return d.isValid() ? d.format('HH:mm') : fallback;
}

/**
 * Relative time from now (e.g., "2 ngày trước", "trong 3 ngày tới")
 */
export function formatRelativeTime(date: string | Date | null | undefined, fallback = '—'): string {
  if (!date) return fallback;
  const d = dayjs(date);
  return d.isValid() ? d.fromNow() : fallback;
}

/**
 * Format date range nicely (e.g., "08:00 - 11:30, 15/08/2026" or "15/08 - 17/08/2026")
 */
export function formatDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  fallback = '—'
): string {
  if (!startDate || !endDate) return fallback;
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (!start.isValid() || !end.isValid()) return fallback;

  // Same day
  if (start.isSame(end, 'day')) {
    return `${start.format('HH:mm')} - ${end.format('HH:mm')}, ${start.format('DD/MM/YYYY')}`;
  }

  // Different days
  return `${start.format('HH:mm DD/MM/YYYY')} - ${end.format('HH:mm DD/MM/YYYY')}`;
}

/**
 * Convert ISO string or Date to format compatible with HTML <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
 */
export function toDateTimeLocalString(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = dayjs(date);
  return d.isValid() ? d.format('YYYY-MM-DDTHH:mm') : '';
}

/**
 * Convert datetime-local input string (YYYY-MM-DDTHH:mm) to ISO string with timezone for Supabase
 */
export function fromDateTimeLocalString(dateStr: string): string {
  if (!dateStr) return '';
  return dayjs(dateStr).toISOString();
}

/**
 * Check if a date is currently ongoing between start and end
 */
export function isActivityOngoing(startDate: string | Date, endDate: string | Date): boolean {
  const now = dayjs();
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  return now.isAfter(start) && now.isBefore(end);
}

/**
 * Check if a date has already ended
 */
export function isActivityPast(endDate: string | Date): boolean {
  return dayjs().isAfter(dayjs(endDate));
}

/**
 * Check if a date is upcoming in the future
 */
export function isActivityUpcoming(startDate: string | Date): boolean {
  return dayjs().isBefore(dayjs(startDate));
}

export { dayjs };
