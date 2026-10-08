import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Check
} from '@/lib/icons';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { TimePickerBar } from './time-picker';
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
    } else {
      const fallback = viewDate.hour(parseInt(hour, 10)).minute(parseInt(minute, 10));
      onChange?.(fallback.format('YYYY-MM-DDTHH:mm'));
    }
  };

  const handleQuickSelectToday = () => {
    const today = dayjs();
    setViewDate(today);
    handleSelectDay(today);
  };

  const handleQuickSelectNow = () => {
    const now = dayjs();
    setViewDate(now);
    setSelectedHour(now.format('HH'));
    setSelectedMinute(now.format('mm'));
    let finalDate = now;
    finalDate = finalDate.hour(now.hour()).minute(now.minute());
    onChange?.(finalDate.format('YYYY-MM-DDTHH:mm'));
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
            'flex h-10 w-full items-center justify-between rounded-xl border border-hairline bg-cloud px-3.5 py-2 text-xs text-left transition-all hover:bg-white hover:border-[#d4e4fa] focus:outline-none focus:ring-1 focus:ring-signal-blue focus:bg-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 group',
            displayLabel ? 'text-ink-navy font-medium' : 'text-mist-gray',
            open && 'ring-1 ring-signal-blue border-signal-blue bg-white shadow-xs',
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
                className="p-1 rounded-md text-mist-gray hover:text-ink-navy hover:bg-pebble transition-colors"
                title="Xóa ngày"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <CalendarIcon className="w-4 h-4 text-mist-gray group-hover:text-signal-blue transition-colors" />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-4 bg-white border border-hairline rounded-3xl shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
      >
        <div className="w-[280px] space-y-3.5">
          {/* Header Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-ink-navy">
                {MONTH_NAMES[viewDate.month()]}
              </span>
              <span className="text-xs font-semibold text-slate-gray">
                {viewDate.year()}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewDate((prev) => prev.subtract(1, 'month'))}
                className="p-1.5 rounded-xl hover:bg-cloud text-slate-gray transition-colors cursor-pointer"
                title="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewDate((prev) => prev.add(1, 'month'))}
                className="p-1.5 rounded-xl hover:bg-cloud text-slate-gray transition-colors cursor-pointer"
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
                  idx === 5 || idx === 6 ? 'text-amber-600' : 'text-mist-gray'
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
                      ? 'bg-signal-blue text-white font-bold shadow-xs hover:bg-[#005be0]'
                      : item.isToday
                      ? 'border border-signal-blue text-signal-blue font-bold bg-[#e6f0ff] hover:bg-[#d8e8fc]'
                      : item.isCurrentMonth
                      ? 'text-slate-gray hover:bg-cloud hover:text-ink-navy'
                      : 'text-mist-gray hover:bg-cloud',
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
            <TimePickerBar
              selectedHour={selectedHour}
              selectedMinute={selectedMinute}
              onTimeChange={handleTimeChange}
            />
          )}

          {/* Bottom Actions */}
          <div className="pt-2.5 border-t border-hairline flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleQuickSelectToday}
                className="text-[11px] font-semibold text-signal-blue hover:text-[#005be0] hover:underline cursor-pointer"
              >
                Hôm nay
              </button>
              {showTime && (
                <>
                  <span className="text-hairline">|</span>
                  <button
                    type="button"
                    onClick={handleQuickSelectNow}
                    className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
                  >
                    Bây giờ
                  </button>
                </>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-7 px-3 text-[11px] font-semibold rounded-lg bg-ink-navy text-white hover:bg-[#07243d]"
            >
              Xong
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
