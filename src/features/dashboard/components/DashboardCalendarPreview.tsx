import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';
import dayjs from 'dayjs';
import type { UpcomingActivityItem } from '../types/dashboard.types';
import { formatDateTime, ACTIVITY_STATUS_META } from '../utils/formatters';

interface DashboardCalendarPreviewProps {
  activities: UpcomingActivityItem[];
}

export function DashboardCalendarPreview({ activities }: DashboardCalendarPreviewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(() => dayjs().format('YYYY-MM-DD'));

  const startOfMonth = currentMonth.startOf('month');
  const endOfMonth = currentMonth.endOf('month');
  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfWeek = startOfMonth.day(); // 0 is Sunday

  // Build grid of days
  const calendarDays: Array<{
    date: dayjs.Dayjs;
    dateString: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    hasActivities: boolean;
    activityCount: number;
  }> = [];

  // Previous month padding
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = startOfMonth.subtract(i + 1, 'day');
    calendarDays.push({
      date: d,
      dateString: d.format('YYYY-MM-DD'),
      dayNumber: d.date(),
      isCurrentMonth: false,
      isToday: d.isSame(dayjs(), 'day'),
      hasActivities: false,
      activityCount: 0,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = startOfMonth.date(i);
    const dateStr = d.format('YYYY-MM-DD');
    const dayActivities = activities.filter((a) => {
      const actDate = dayjs(a.startDate).format('YYYY-MM-DD');
      return actDate === dateStr;
    });

    calendarDays.push({
      date: d,
      dateString: dateStr,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: d.isSame(dayjs(), 'day'),
      hasActivities: dayActivities.length > 0,
      activityCount: dayActivities.length,
    });
  }

  // Next month padding to make 35 or 42 cells
  const remainingCells = 35 - calendarDays.length;
  if (remainingCells > 0) {
    for (let i = 1; i <= remainingCells; i++) {
      const d = endOfMonth.add(i, 'day');
      calendarDays.push({
        date: d,
        dateString: d.format('YYYY-MM-DD'),
        dayNumber: d.date(),
        isCurrentMonth: false,
        isToday: d.isSame(dayjs(), 'day'),
        hasActivities: false,
        activityCount: 0,
      });
    }
  }

  // Filter activities for selected date or whole month
  const selectedDateActivities = selectedDate
    ? activities.filter((a) => dayjs(a.startDate).format('YYYY-MM-DD') === selectedDate)
    : activities.filter((a) => dayjs(a.startDate).isSame(currentMonth, 'month'));

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <Card className="rounded-2xl border-hairline shadow-sm bg-white">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-hairline">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#e6f0ff] text-signal-blue flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-ink-navy leading-tight">
                Lịch sự kiện & Hoạt động
              </CardTitle>
              <p className="text-xs text-slate-gray mt-0.5">
                Lịch biểu trực quan các phong trào Chi hội
              </p>
            </div>
          </div>

          <Link to="/activities">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm font-semibold text-signal-blue hover:text-signal-blue/80 hover:bg-pebble h-8 px-2.5">
              <span>Mở rộng</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-3 space-y-3.5">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-ink-navy">
            Tháng {currentMonth.format('MM/YYYY')}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7 text-ink-navy border-hairline rounded-lg hover:bg-pebble"
              onClick={() => setCurrentMonth((prev) => prev.subtract(1, 'month'))}
              title="Tháng trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2 font-semibold text-ink-navy border-hairline rounded-lg hover:bg-pebble"
              onClick={() => {
                const now = dayjs();
                setCurrentMonth(now);
                setSelectedDate(now.format('YYYY-MM-DD'));
              }}
            >
              Hôm nay
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7 text-ink-navy border-hairline rounded-lg hover:bg-pebble"
              onClick={() => setCurrentMonth((prev) => prev.add(1, 'month'))}
              title="Tháng sau"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Mini Calendar Grid */}
        <div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-mist-gray mb-1">
            {dayNames.map((d) => (
              <div key={d} className="py-0.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarDays.map((cell) => {
              const isSelected = selectedDate === cell.dateString;

              return (
                <button
                  key={cell.dateString}
                  type="button"
                  onClick={() => setSelectedDate(cell.dateString)}
                  className={`relative py-1.5 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                    !cell.isCurrentMonth
                      ? 'text-mist-gray/60 hover:text-mist-gray'
                      : isSelected
                      ? 'bg-signal-blue text-white font-bold shadow-sm'
                      : cell.isToday
                      ? 'bg-pebble text-signal-blue font-bold border border-hairline'
                      : 'text-ink-navy hover:bg-pebble'
                  }`}
                >
                  <span className="tabular-nums">{cell.dayNumber}</span>
                  {cell.hasActivities && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? 'bg-white' : 'bg-signal-blue'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date or Month Activity List (Content-Driven, No Inner Scrollbar) */}
        <div className="pt-2.5 border-t border-hairline space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-gray font-medium">
            <span>
              {selectedDate
                ? `Hoạt động ngày ${dayjs(selectedDate).format('DD/MM/YYYY')}`
                : 'Hoạt động trong tháng'}
            </span>
            <span className="text-mist-gray tabular-nums">
              {selectedDateActivities.length} sự kiện
            </span>
          </div>

          {selectedDateActivities.length > 0 ? (
            <div className="space-y-1.5">
              {selectedDateActivities.slice(0, 3).map((act) => {
                const statusMeta = ACTIVITY_STATUS_META[act.status] || {
                  label: act.status,
                  colorClass: 'text-slate-gray',
                  bgClass: 'bg-pebble text-ink-navy border-hairline',
                };

                return (
                  <Link
                    key={act.id}
                    to={`/activities/${act.id}`}
                    className="block p-2 rounded-xl bg-pebble hover:bg-pebble/80 border border-hairline transition-all text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-ink-navy truncate">
                        {act.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0 px-2 rounded-full font-medium border shrink-0 ${statusMeta.bgClass}`}
                      >
                        {statusMeta.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-gray mt-0.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-mist-gray" />
                        <span className="tabular-nums">{formatDateTime(act.startDate)}</span>
                      </div>
                      {act.location && (
                        <div className="flex items-center gap-1 truncate max-w-[130px]">
                          <MapPin className="w-3.5 h-3.5 text-mist-gray shrink-0" />
                          <span className="truncate">{act.location}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}

              {selectedDateActivities.length > 3 && (
                <div className="text-center pt-0.5">
                  <Link
                    to="/activities"
                    className="text-xs font-medium text-signal-blue hover:underline inline-flex items-center gap-1"
                  >
                    Xem thêm {selectedDateActivities.length - 3} sự kiện
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="py-2.5 text-center text-xs text-mist-gray bg-pebble/50 rounded-xl border border-dashed border-hairline">
              Không có sự kiện nào trong ngày này
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
