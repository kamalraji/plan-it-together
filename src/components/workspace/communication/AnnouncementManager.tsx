import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, Clock, CheckCircle2, Send, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Announcement {
  id: string;
  title: string;
  channel: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledDate?: string;
  sentDate?: string;
  audience: string;
}

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Event Registration Now Open',
    channel: 'All Channels',
    status: 'sent',
    sentDate: '2026-01-03',
    audience: 'All Attendees',
  },
  {
    id: '2',
    title: 'Speaker Lineup Announcement',
    channel: 'Email + Social',
    status: 'scheduled',
    scheduledDate: '2026-01-08',
    audience: 'Registered Users',
  },
  {
    id: '3',
    title: 'Early Bird Deadline Reminder',
    channel: 'Email',
    status: 'scheduled',
    scheduledDate: '2026-01-10',
    audience: 'Non-registered',
  },
  {
    id: '4',
    title: 'Venue Details & Parking Info',
    channel: 'Email',
    status: 'draft',
    audience: 'Confirmed Attendees',
  },
  {
    id: '5',
    title: 'Sponsor Thank You Message',
    channel: 'Social Media',
    status: 'draft',
    audience: 'Public',
  },
];

const statusConfig = {
  draft: { icon: Edit, color: 'text-gray-500', bgColor: 'bg-gray-500/10', label: 'Draft' },
  scheduled: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Scheduled' },
  sent: { icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Sent' },
};

export function AnnouncementManager() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Announcements
          </CardTitle>
          <Button variant="outline" size="sm">
            <Send className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-3">
            {mockAnnouncements.map((announcement) => {
              const config = statusConfig[announcement.status];
              const StatusIcon = config.icon;
              
              return (
                <div
                  key={announcement.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${config.bgColor} mt-0.5`}>
                      <StatusIcon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{announcement.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{announcement.channel}</span>
                        <span>•</span>
                        <span>{announcement.audience}</span>
                      </div>
                      {announcement.scheduledDate && (
                        <p className="text-xs text-amber-500 mt-1">
                          Scheduled: {new Date(announcement.scheduledDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${config.bgColor} ${config.color} border-0`}>
                      {config.label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
