import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, Clock, CheckCircle2, Send, MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  SimpleDropdown,
  SimpleDropdownTrigger,
  SimpleDropdownContent,
  SimpleDropdownItem,
} from '@/components/ui/simple-dropdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAnnouncements, type Announcement, type AnnouncementStatus } from '@/hooks/useAnnouncements';

interface AnnouncementManagerProps {
  workspaceId?: string;
}

const statusConfig: Record<AnnouncementStatus, { icon: typeof Edit; color: string; bgColor: string; label: string }> = {
  draft: { icon: Edit, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Draft' },
  scheduled: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Scheduled' },
  published: { icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Published' },
  archived: { icon: CheckCircle2, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Archived' },
};

export function AnnouncementManager({ workspaceId }: AnnouncementManagerProps) {
  const { data: announcements = [], isLoading } = useAnnouncements(workspaceId);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[320px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (announcements.length === 0) {
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
        <CardContent className="flex flex-col items-center justify-center h-[320px] text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No announcements yet</p>
          <p className="text-sm text-muted-foreground/70">Create your first announcement</p>
        </CardContent>
      </Card>
    );
  }

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
            {announcements.map((announcement) => (
              <AnnouncementRow key={announcement.id} announcement={announcement} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AnnouncementRow({ announcement }: { announcement: Announcement }) {
  const config = statusConfig[announcement.status];
  const StatusIcon = config.icon;

  const audienceLabel = announcement.audience.charAt(0).toUpperCase() + announcement.audience.slice(1);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`p-2 rounded-lg ${config.bgColor} mt-0.5`}>
          <StatusIcon className={`h-4 w-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{announcement.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{audienceLabel}</span>
            {announcement.createdByName && (
              <>
                <span>•</span>
                <span>by {announcement.createdByName}</span>
              </>
            )}
          </div>
          {announcement.scheduledFor && (
            <p className="text-xs text-amber-500 mt-1">
              Scheduled: {new Date(announcement.scheduledFor).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`text-xs ${config.bgColor} ${config.color} border-0`}>
          {config.label}
        </Badge>
        <SimpleDropdown>
          <SimpleDropdownTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent hover:text-accent-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </SimpleDropdownTrigger>
          <SimpleDropdownContent align="end">
            <SimpleDropdownItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </SimpleDropdownItem>
            <SimpleDropdownItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </SimpleDropdownItem>
          </SimpleDropdownContent>
        </SimpleDropdown>
      </div>
    </div>
  );
}
