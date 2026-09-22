import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import type { ActivityListItem } from '../types/activity.types';
import { ACTIVITY_STATUSES } from '../types/activity.types';
import { cn } from '@/lib/utils';

interface ActivityCalendarViewProps {
  activities: ActivityListItem[];
}

export function ActivityCalendarView({ activities }: ActivityCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Day of week index for first day (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const startingDayIndex = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Group activities by date string "YYYY-MM-DD"
  const activitiesByDate: Record<string, ActivityListItem[]> = {};
  activities.forEach((act) => {
    try {
      const d = new Date(act.startDate);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!activitiesByDate[dateKey]) {
        activitiesByDate[dateKey] = [];
      }
      activitiesByDate[dateKey].push(act);
    } catch {
      // Ignore invalid date
    }
  });

  const monthNames = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ];

  const weekDayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Build 35 or 42 grid cells
  const gridCells: { dayNumber: number | null; dateKey: string | null; isToday: boolean }[] = [];

  // Empty leading cells
  for (let i = 0; i < startingDayIndex; i++) {
    gridCells.push({ dayNumber: null, dateKey: null, isToday: false });
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  for (let d = 1; d <= totalDays; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = isCurrentMonth && today.getDate() === d;
    gridCells.push({ dayNumber: d, dateKey, isToday });
  }

  // Fill trailing empty cells to reach multiple of 7
  while (gridCells.length % 7 !== 0) {
    gridCells.push({ dayNumber: null, dateKey: null, isToday: false });
  }

  return (
    <div className="bg-white rounded-2xl border border-hairline shadow-xs overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-hairline bg-cloud flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-signal-blue" />
          <h3 className="text-sm font-bold text-ink-navy">
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="calendar-today-btn"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold text-slate-gray bg-white hover:bg-pebble hover:text-ink-navy border border-hairline rounded-lg transition-colors cursor-pointer"
          >
            Hôm nay
          </button>
          <div className="flex items-center gap-0.5 bg-white border border-hairline rounded-lg p-0.5">
            <button
              type="button"
              id="calendar-prev-btn"
              onClick={handlePrevMonth}
              className="p-1 text-slate-gray hover:text-ink-navy hover:bg-pebble rounded-md transition-colors cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="calendar-next-btn"
              onClick={handleNextMonth}
              className="p-1 text-slate-gray hover:text-ink-navy hover:bg-pebble rounded-md transition-colors cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 border-b border-hairline bg-cloud text-[11px] font-bold text-slate-gray text-center py-2 uppercase tracking-wider">
        {weekDayNames.map((wd) => (
          <div key={wd}>{wd}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-hairline bg-cloud/40">
        {gridCells.map((cell, idx) => {
          if (!cell.dayNumber || !cell.dateKey) {
            return (
              <div key={idx} className="min-h-[100px] bg-cloud/30 p-1.5 opacity-40" />
            );
          }

          const dayActivities = activitiesByDate[cell.dateKey] || [];

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[100px] bg-white p-1.5 flex flex-col justify-between transition-colors hover:bg-cloud/60',
                cell.isToday && 'bg-[#e6f0ff]/20'
              )}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full tabular-nums',
                    cell.isToday
                      ? 'bg-signal-blue text-white shadow-xs'
                      : 'text-ink-navy'
                  )}
                >
                  {cell.dayNumber}
                </span>
                {dayActivities.length > 0 && (
                  <span className="text-[10px] text-mist-gray font-medium tabular-nums">
                    {dayActivities.length}
                  </span>
                )}
              </div>

              {/* Day Activities List */}
              <div className="space-y-1 flex-1 overflow-hidden">
                {dayActivities.slice(0, 3).map((act) => {
                  const statusCfg = ACTIVITY_STATUSES[act.status];
                  return (
                    <Link
                      key={act.id}
                      to={`/activities/${act.id}`}
                      id={`calendar-act-link-${act.id}`}
                      className={cn(
                        'block px-1.5 py-0.5 rounded-md text-[11px] font-semibold truncate transition-all border shadow-xs',
                        statusCfg?.colorClasses.bg || 'bg-pebble',
                        statusCfg?.colorClasses.text || 'text-ink-navy',
                        statusCfg?.colorClasses.border || 'border-hairline'
                      )}
                      title={`${act.title} (${statusCfg?.label || act.status})`}
                    >
                      {act.title}
                    </Link>
                  );
                })}

                {dayActivities.length > 3 && (
                  <span className="text-[10px] text-slate-gray font-semibold pl-1 block tabular-nums">
                    +{dayActivities.length - 3} khác
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
