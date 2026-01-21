import * as React from "react";
import { format, isValid, setHours, setMinutes } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  value?: string; // ISO string or datetime-local format
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  showTimezone?: boolean;
  timezone?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  disabled = false,
  className,
  minDate,
  maxDate,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  // Parse the value to a Date object
  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  // Extract hours and minutes
  const hours = dateValue ? dateValue.getHours() : 12;
  const minutes = dateValue ? dateValue.getMinutes() : 0;

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Preserve existing time or use default
    const newDate = setMinutes(setHours(date, hours), minutes);
    onChange?.(formatForInput(newDate));
  };

  // Handle time changes
  const handleTimeChange = (type: 'hours' | 'minutes', val: string) => {
    const numVal = parseInt(val, 10);
    if (isNaN(numVal)) return;

    const baseDate = dateValue || new Date();
    let newDate: Date;
    
    if (type === 'hours') {
      newDate = setHours(baseDate, numVal);
    } else {
      newDate = setMinutes(baseDate, numVal);
    }
    
    onChange?.(formatForInput(newDate));
  };

  // Format date for datetime-local input
  const formatForInput = (date: Date): string => {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i.toString().padStart(2, '0'),
    label: i.toString().padStart(2, '0'),
  }));

  // Generate minute options (0, 15, 30, 45 for convenience, but allow any)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
    value: i.toString().padStart(2, '0'),
    label: i.toString().padStart(2, '0'),
  }));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-11",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {dateValue ? (
            <span className="truncate">
              {format(dateValue, "PPP")} at {format(dateValue, "HH:mm")}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Time</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Select
              value={hours.toString().padStart(2, '0')}
              onValueChange={(val) => handleTimeChange('hours', val)}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {hourOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-lg font-medium">:</span>
            <Select
              value={minutes.toString().padStart(2, '0')}
              onValueChange={(val) => handleTimeChange('minutes', val)}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {minuteOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleDateSelect}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          initialFocus
        />
        <div className="p-3 border-t border-border flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange?.('');
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Compact version for inline use
export function DateTimePickerInline({
  value,
  onChange,
  disabled = false,
  className,
}: DateTimePickerProps) {
  return (
    <Input
      type="datetime-local"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={cn("h-11", className)}
    />
  );
}
