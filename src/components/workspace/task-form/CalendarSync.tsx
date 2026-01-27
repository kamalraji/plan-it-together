import { Calendar, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CalendarSyncProps {
  title: string;
  description?: string;
  dueDate?: string;
  location?: string;
  disabled?: boolean;
}

/**
 * Generate ICS file content for calendar export
 */
function generateICSContent({
  title,
  description,
  dueDate,
  location,
}: CalendarSyncProps): string {
  const now = new Date();
  const uid = `task-${Date.now()}@lovable.app`;
  
  // Format dates for ICS (YYYYMMDDTHHMMSSZ)
  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const startDate = dueDate ? new Date(dueDate) : now;
  // Set end date 1 hour after start for a default duration
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lovable//Task Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description.replace(/\n/g, '\\n')}` : '',
    location ? `LOCATION:${location}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  return icsContent;
}

/**
 * Download ICS file
 */
function downloadICS(props: CalendarSyncProps) {
  const content = generateICSContent(props);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${props.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL
 */
function getGoogleCalendarUrl(props: CalendarSyncProps): string {
  const { title, description, dueDate, location } = props;
  
  const startDate = dueDate ? new Date(dueDate) : new Date();
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  
  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
  });

  if (description) params.set('details', description);
  if (location) params.set('location', location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL
 */
function getOutlookCalendarUrl(props: CalendarSyncProps): string {
  const { title, description, dueDate, location } = props;
  
  const startDate = dueDate ? new Date(dueDate) : new Date();
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
  });

  if (description) params.set('body', description);
  if (location) params.set('location', location);

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function CalendarSync(props: CalendarSyncProps) {
  const { title, dueDate, disabled } = props;

  if (!dueDate) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !title}
          className="h-7 gap-1.5 text-xs"
        >
          <Calendar className="h-3 w-3" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => window.open(getGoogleCalendarUrl(props), '_blank')}
          className="gap-2 text-xs"
        >
          <ExternalLink className="h-3 w-3" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(getOutlookCalendarUrl(props), '_blank')}
          className="gap-2 text-xs"
        >
          <ExternalLink className="h-3 w-3" />
          Outlook Calendar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadICS(props)}
          className="gap-2 text-xs"
        >
          <Download className="h-3 w-3" />
          Download .ics file
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
