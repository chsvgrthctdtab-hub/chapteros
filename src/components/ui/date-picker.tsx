import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Check
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

export interface DatePickerProps {
  value?: string | null;
  onChange?: (dateString: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  showTime?: boolean;
  clearable?: boolean;
}

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export function DatePicker({
  value,
  onChange,
  placeholder = 'Chọn ngày...',
  className,
  disabled = false,
  minDate,
  maxDate,
  showTime = false,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  // Parsed current selected dayjs object
  const selectedDayjs = value ? dayjs(value) : null;

  // View state for navigating calendar months
  const [viewDate, setViewDate] = useState(() => (selectedDayjs && selectedDayjs.isValid() ? selectedDayjs : dayjs()));

  // Time state (if showTime is enabled)
  const [selectedHour, setSelectedHour] = useState(() => (selectedDayjs && selectedDayjs.isValid() ? selectedDayjs.format('HH') : '08'));
  const [selectedMinute, setSelectedMinute] = useState(() => (selectedDayjs && selectedDayjs.isValid() ? selectedDayjs.format('mm') : '00'));

  useEffect(() => {
    if (value) {
      const d = dayjs(value);
      if (d.isValid()) {
        setViewDate(d);
        setSelectedHour(d.format('HH'));
        setSelectedMinute(d.format('mm'));
      }
    }
  }, [value]);

  // Generate matrix of days for the current viewDate
  const calendarDays = React.useMemo(() => {
    const startOfMonth = viewDate.startOf('month');
    const endOfMonth = viewDate.endOf('month');
    
    // In dayjs, 0 = Sunday, 1 = Monday ... 6 = Saturday
    // We want Monday as day 0
    let startDayOfWeek = startOfMonth.day() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

    const days: {
      date: dayjs.Dayjs;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }[] = [];

    // Previous month padding days
    const prevMonth = viewDate.subtract(1, 'month');
    const daysInPrevMonth = prevMonth.daysInMonth();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonth.date(daysInPrevMonth - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: d.isSame(dayjs(), 'day'),
        isSelected: Boolean(selectedDayjs && d.isSame(selectedDayjs, 'day')),
        isDisabled: Boolean((minDate && d.isBefore(dayjs(minDate), 'day')) || (maxDate && d.isAfter(dayjs(maxDate), 'day'))),
      });
    }

    // Current month days
    const daysInMonth = viewDate.daysInMonth();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = viewDate.date(i);
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: d.isSame(dayjs(), 'day'),
        isSelected: Boolean(selectedDayjs && d.isSame(selectedDayjs, 'day')),
        isDisabled: Boolean((minDate && d.isBefore(dayjs(minDate), 'day')) || (maxDate && d.isAfter(dayjs(maxDate), 'day'))),
      });
    }

    // Next month padding days to fill 35 or 42 grid slots
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    const nextMonth = viewDate.add(1, 'month');
    for (let i = 1; i <= remaining; i++) {
      const d = nextMonth.date(i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: d.isSame(dayjs(), 'day'),
        isSelected: Boolean(selectedDayjs && d.isSame(selectedDayjs, 'day')),
        isDisabled: Boolean((minDate && d.isBefore(dayjs(minDate), 'day')) || (maxDate && d.isAfter(dayjs(maxDate), 'day'))),
      });
    }

    return days;
  }, [viewDate, selectedDayjs, minDate, maxDate]);

  const handleSelectDay = (d: dayjs.Dayjs) => {
    let finalDate = d;
    if (showTime) {
      finalDate = finalDate.hour(parseInt(selectedHour, 10)).minute(parseInt(selectedMinute, 10));
      const formatted = finalDate.format('YYYY-MM-DDTHH:mm');
      onChange?.(formatted);
    } else {
      const formatted = finalDate.format('YYYY-MM-DD');
      onChange?.(formatted);
      setOpen(false);
    }
  };

  const handleTimeChange = (hour: string, minute: string) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    if (selectedDayjs && selectedDayjs.isValid()) {
      const updated = selectedDayjs.hour(parseInt(hour, 10)).minute(parseInt(minute, 10));
      onChange?.(updated.format('YYYY-MM-DDTHH:mm'));
    }
  };

  const handleQuickSelectToday = () => {
    const today = dayjs();
    setViewDate(today);
    handleSelectDay(today);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
  };

  // Formatted display text on trigger button
  const displayLabel = React.useMemo(() => {
    if (!selectedDayjs || !selectedDayjs.isValid()) return '';
    return showTime
      ? selectedDayjs.format('DD/MM/YYYY HH:mm')
      : selectedDayjs.format('DD/MM/YYYY');
  }, [selectedDayjs, showTime]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-left transition-all hover:bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 group',
            displayLabel ? 'text-slate-900 font-medium' : 'text-slate-400',
            open && 'ring-1 ring-blue-500 border-blue-400 bg-white shadow-2xs',
            className
          )}
        >
          <span className="truncate">
            {displayLabel || placeholder}
          </span>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {clearable && displayLabel && !disabled && (
              <span
                role="button"
                onClick={handleClear}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                title="Xóa ngày"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <CalendarIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-4 bg-white border border-slate-200/90 rounded-3xl shadow-2xl z-50 animate-in fade-in-0 zoom-in-95"
      >
        <div className="w-[280px] space-y-3.5">
          {/* Header Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">
                {MONTH_NAMES[viewDate.month()]}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {viewDate.year()}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewDate((prev) => prev.subtract(1, 'month'))}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewDate((prev) => prev.add(1, 'month'))}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Tháng sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEK_DAYS.map((day, idx) => (
              <span
                key={day}
                className={cn(
                  'text-[10px] font-bold py-1',
                  idx === 5 || idx === 6 ? 'text-amber-600' : 'text-slate-400'
                )}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((item, idx) => {
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={item.isDisabled}
                  onClick={() => handleSelectDay(item.date)}
                  className={cn(
                    'h-8 w-8 mx-auto rounded-xl text-xs flex items-center justify-center font-medium transition-all cursor-pointer',
                    item.isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs hover:bg-blue-700'
                      : item.isToday
                      ? 'border border-blue-500 text-blue-600 font-bold bg-blue-50/50 hover:bg-blue-100/60'
                      : item.isCurrentMonth
                      ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-300 hover:bg-slate-50',
                    item.isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent'
                  )}
                >
                  {item.date.date()}
                </button>
              );
            })}
          </div>

          {/* Time Picker Bar (if showTime) */}
          {showTime && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Giờ:</span>
              </div>
              <div className="flex items-center gap-1">
                <select
                  value={selectedHour}
                  onChange={(e) => handleTimeChange(e.target.value, selectedMinute)}
                  className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-1 text-xs font-mono font-semibold"
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const val = i.toString().padStart(2, '0');
                    return <option key={val} value={val}>{val}</option>;
                  })}
                </select>
                <span className="font-bold text-slate-400">:</span>
                <select
                  value={selectedMinute}
                  onChange={(e) => handleTimeChange(selectedHour, e.target.value)}
                  className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-1 text-xs font-mono font-semibold"
                >
                  {Array.from({ length: 12 }).map((_, i) => {
                    const val = (i * 5).toString().padStart(2, '0');
                    return <option key={val} value={val}>{val}</option>;
                  })}
                </select>
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleQuickSelectToday}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              Hôm nay
            </button>
            <Button
              type="button"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-7 px-3 text-[11px] font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
            >
              Xong
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
