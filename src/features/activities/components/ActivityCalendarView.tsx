import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
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
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="calendar-today-btn"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-md p-0.5">
            <button
              type="button"
              id="calendar-prev-btn"
              onClick={handlePrevMonth}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="calendar-next-btn"
              onClick={handleNextMonth}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-bold text-slate-500 text-center py-2">
        {weekDayNames.map((wd) => (
          <div key={wd}>{wd}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100/30">
        {gridCells.map((cell, idx) => {
          if (!cell.dayNumber || !cell.dateKey) {
            return (
              <div key={idx} className="min-h-[100px] bg-slate-50/40 p-1.5 opacity-40" />
            );
          }

          const dayActivities = activitiesByDate[cell.dateKey] || [];

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[100px] bg-white p-1.5 flex flex-col justify-between transition-colors hover:bg-slate-50/50',
                cell.isToday && 'bg-emerald-50/30'
              )}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full',
                    cell.isToday
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-700'
                  )}
                >
                  {cell.dayNumber}
                </span>
                {dayActivities.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-medium">
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
                        'block px-1.5 py-0.5 rounded text-[11px] font-semibold truncate transition-all border shadow-2xs',
                        statusCfg?.colorClasses.bg || 'bg-slate-100',
                        statusCfg?.colorClasses.text || 'text-slate-800',
                        statusCfg?.colorClasses.border || 'border-slate-200'
                      )}
                      title={`${act.title} (${statusCfg?.label || act.status})`}
                    >
                      {act.title}
                    </Link>
                  );
                })}

                {dayActivities.length > 3 && (
                  <span className="text-[10px] text-slate-500 font-semibold pl-1 block">
                    +{dayActivities.length - 3} more
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
