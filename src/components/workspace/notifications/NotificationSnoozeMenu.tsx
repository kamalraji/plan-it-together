import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Clock, AlarmClockOff, CalendarClock } from 'lucide-react';
import { useNotificationSnooze, SnoozeDuration } from '@/hooks/useNotificationSnooze';
import { setHours, setMinutes } from 'date-fns';

interface NotificationSnoozeMenuProps {
  notificationId: string;
  notificationType: string;
  originalData?: Record<string, unknown>;
  onSnoozed?: () => void;
  variant?: 'icon' | 'button';
}

export function NotificationSnoozeMenu({
  notificationId,
  notificationType,
  originalData,
  onSnoozed,
  variant = 'icon',
}: NotificationSnoozeMenuProps) {
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const { snoozeNotification, isSnozing } = useNotificationSnooze();

  const handleSnooze = (duration: SnoozeDuration, customTime?: Date) => {
    snoozeNotification({
      notificationId,
      notificationType,
      duration,
      customTime,
      originalData,
    });
    setOpen(false);
    setShowCalendar(false);
    onSnoozed?.();
  };

  const handleCustomDate = (date: Date | undefined) => {
    if (date) {
      // Set to 9 AM on the selected date
      const snoozedUntil = setMinutes(setHours(date, 9), 0);
      handleSnooze('custom', snoozedUntil);
    }
  };

  const snoozeOptions = [
    { label: '15 minutes', duration: '15min' as SnoozeDuration, icon: Clock },
    { label: '1 hour', duration: '1hour' as SnoozeDuration, icon: Clock },
    { label: '4 hours', duration: '4hours' as SnoozeDuration, icon: Clock },
    { label: 'Tomorrow 9 AM', duration: 'tomorrow' as SnoozeDuration, icon: CalendarClock },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === 'icon' ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={isSnozing}
          >
            <AlarmClockOff className="h-4 w-4" />
            <span className="sr-only">Snooze notification</span>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled={isSnozing}>
            <AlarmClockOff className="h-4 w-4 mr-2" />
            Snooze
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        {showCalendar ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pick a date</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCalendar(false)}
              >
                Back
              </Button>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                handleCustomDate(date);
              }}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground px-2 py-1">
              Remind me...
            </p>
            {snoozeOptions.map((option) => (
              <Button
                key={option.duration}
                variant="ghost"
                className="w-full justify-start h-9 px-2"
                onClick={() => handleSnooze(option.duration)}
              >
                <option.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                {option.label}
              </Button>
            ))}
            <div className="border-t my-1" />
            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-2"
              onClick={() => setShowCalendar(true)}
            >
              <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
              Pick a date...
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
