import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, X, Check } from '@/lib/icons';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

export const HOURS_LIST = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
export const MINUTES_STEP5 = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

export const COMMON_TIME_PRESETS = [
  { label: '07:30', hour: '07', minute: '30' },
  { label: '08:00', hour: '08', minute: '00' },
  { label: '09:00', hour: '09', minute: '00' },
  { label: '13:30', hour: '13', minute: '30' },
  { label: '14:00', hour: '14', minute: '00' },
  { label: '19:00', hour: '19', minute: '00' },
];

interface TimeDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  title: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  columns?: number;
  allowCustomInput?: boolean;
  onSelectOption?: (val: string) => void;
}

export function TimeDropdown({
  value,
  onChange,
  options,
  title,
  isOpen,
  onOpen,
  onClose,
  columns = 6,
  allowCustomInput = false,
  onSelectOption,
}: TimeDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [customVal, setCustomVal] = useState('');

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSelect = (val: string) => {
    onChange(val);
    if (onSelectOption) {
      onSelectOption(val);
    } else {
      onClose();
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(customVal, 10);
    if (!isNaN(num) && num >= 0 && num <= 59) {
      const formatted = num.toString().padStart(2, '0');
      handleSelect(formatted);
      setCustomVal('');
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => (isOpen ? onClose() : onOpen())}
        className={cn(
          'h-7.5 px-2.5 rounded-xl border border-hairline bg-cloud text-xs font-bold text-ink-navy tabular-nums flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:bg-white hover:border-[#b8cce0] focus:outline-none focus:ring-2 focus:ring-signal-blue/20',
          isOpen && 'ring-2 ring-signal-blue/25 border-signal-blue bg-white'
        )}
        title={title}
      >
        <span>{value}</span>
        <ChevronDown
          className={cn(
            'w-3 h-3 text-slate-gray transition-transform duration-200',
            isOpen && 'rotate-180 text-signal-blue'
          )}
        />
      </button>

      {/* Floating Custom Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full mb-1.5 right-0 z-50 w-[240px] rounded-2xl border border-hairline bg-white p-2.5 shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-hairline text-slate-gray">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-navy">
              {title}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-mist-gray hover:text-ink-navy hover:bg-cloud transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Grid of numbers */}
          <div
            className={cn(
              'grid gap-1',
              columns === 6 && 'grid-cols-6',
              columns === 4 && 'grid-cols-4'
            )}
          >
            {options.map((opt) => {
              const isSelected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={cn(
                    'h-7 rounded-lg text-xs font-semibold tabular-nums flex items-center justify-center transition-all cursor-pointer',
                    isSelected
                      ? 'bg-signal-blue text-white font-bold shadow-xs hover:bg-[#005be0]'
                      : 'text-ink-navy hover:bg-[#f0f4f9] hover:text-signal-blue'
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Custom minute input if enabled */}
          {allowCustomInput && (
            <form onSubmit={handleApplyCustom} className="mt-2 pt-2 border-t border-hairline flex items-center justify-between gap-2 text-xs">
              <span className="text-[10px] text-slate-gray font-medium">Tùy chọn:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={customVal}
                  onChange={(e) => setCustomVal(e.target.value)}
                  placeholder="00-59"
                  className="w-14 h-6 px-1 text-center text-xs font-bold rounded-lg border border-hairline bg-cloud focus:outline-none focus:bg-white focus:ring-1 focus:ring-signal-blue tabular-nums"
                />
                <button
                  type="submit"
                  disabled={!customVal}
                  className="h-6 px-2 text-[10px] font-bold rounded-lg bg-signal-blue text-white disabled:opacity-40 hover:bg-[#005be0] transition-colors cursor-pointer"
                >
                  Gán
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export interface TimePickerBarProps {
  selectedHour: string;
  selectedMinute: string;
  onTimeChange: (hour: string, minute: string) => void;
  className?: string;
}

export function TimePickerBar({
  selectedHour,
  selectedMinute,
  onTimeChange,
  className,
}: TimePickerBarProps) {
  const [activeDropdown, setActiveDropdown] = useState<'hour' | 'minute' | null>(null);

  const handleHourSelect = (h: string) => {
    onTimeChange(h, selectedMinute);
    // Smoothly auto-advance to minute dropdown
    setActiveDropdown('minute');
  };

  const handleMinuteSelect = (m: string) => {
    onTimeChange(selectedHour, m);
    setActiveDropdown(null);
  };

  return (
    <div className={cn('pt-2.5 border-t border-hairline space-y-2', className)}>
      {/* Header and Hour : Minute controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-gray">
          <Clock className="w-3.5 h-3.5 text-signal-blue" />
          <span>Thời gian:</span>
        </div>

        <div className="flex items-center gap-1">
          <TimeDropdown
            value={selectedHour}
            onChange={(h) => onTimeChange(h, selectedMinute)}
            onSelectOption={handleHourSelect}
            options={HOURS_LIST}
            title="Giờ (00 - 23)"
            columns={6}
            isOpen={activeDropdown === 'hour'}
            onOpen={() => setActiveDropdown('hour')}
            onClose={() => setActiveDropdown(null)}
          />

          <span className="font-bold text-mist-gray text-xs">:</span>

          <TimeDropdown
            value={selectedMinute}
            onChange={(m) => onTimeChange(selectedHour, m)}
            onSelectOption={handleMinuteSelect}
            options={MINUTES_STEP5}
            title="Phút (00 - 55)"
            columns={4}
            allowCustomInput
            isOpen={activeDropdown === 'minute'}
            onOpen={() => setActiveDropdown('minute')}
            onClose={() => setActiveDropdown(null)}
          />
        </div>
      </div>

      {/* Quick Time Presets */}
      <div className="flex items-center gap-1 overflow-x-auto py-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <span className="text-[10px] text-mist-gray font-medium shrink-0">Gợi ý:</span>
        {COMMON_TIME_PRESETS.map((preset) => {
          const isSelected = selectedHour === preset.hour && selectedMinute === preset.minute;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onTimeChange(preset.hour, preset.minute);
                setActiveDropdown(null);
              }}
              className={cn(
                'px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all shrink-0 cursor-pointer',
                isSelected
                  ? 'bg-signal-blue text-white shadow-2xs font-bold'
                  : 'bg-cloud text-slate-gray hover:bg-pebble hover:text-ink-navy'
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface TimePickerProps {
  value?: string | null;
  onChange?: (timeString: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Chọn giờ...',
  className,
  disabled = false,
  clearable = true,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(() => (value && value.includes(':') ? value.split(':')[0] : '08'));
  const [minute, setMinute] = useState(() => (value && value.includes(':') ? value.split(':')[1] : '00'));

  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setHour(h);
      setMinute(m);
    }
  }, [value]);

  const handleTimeChange = (newHour: string, newMinute: string) => {
    setHour(newHour);
    setMinute(newMinute);
    onChange?.(`${newHour}:${newMinute}`);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-xl border border-hairline bg-cloud px-3.5 py-2 text-xs text-left transition-all hover:bg-white hover:border-[#d4e4fa] focus:outline-none focus:ring-1 focus:ring-signal-blue focus:bg-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 group',
            value ? 'text-ink-navy font-medium' : 'text-mist-gray',
            open && 'ring-1 ring-signal-blue border-signal-blue bg-white shadow-xs',
            className
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {clearable && value && !disabled && (
              <span
                role="button"
                onClick={handleClear}
                className="p-1 rounded-md text-mist-gray hover:text-ink-navy hover:bg-pebble transition-colors"
                title="Xóa giờ"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <Clock className="w-4 h-4 text-mist-gray group-hover:text-signal-blue transition-colors" />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[280px] p-4 bg-white border border-hairline rounded-3xl shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
      >
        <div className="space-y-3">
          <TimePickerBar
            selectedHour={hour}
            selectedMinute={minute}
            onTimeChange={handleTimeChange}
            className="pt-0 border-t-0"
          />

          <div className="pt-2 border-t border-hairline flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                const now = dayjs();
                handleTimeChange(now.format('HH'), now.format('mm'));
              }}
              className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
            >
              Hiện tại ({dayjs().format('HH:mm')})
            </button>
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

