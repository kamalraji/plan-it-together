import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, Clock, Mail, Megaphone, Newspaper, Radio, 
  Send, Edit, Eye, RefreshCw
} from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay, addDays } from 'date-fns';
import { useAnnouncements, useEmailCampaigns, usePressReleases, useBroadcastMessages } from '@/hooks/useCommunicationCommitteeData';

interface ScheduleUpdateTabProps {
  workspaceId: string;
}

interface ScheduledItem {
  id: string;
  type: 'announcement' | 'email' | 'press-release' | 'broadcast';
  title: string;
  scheduledFor: string;
  status: string;
  content?: string;
}

const typeConfig = {
  announcement: { icon: Megaphone, color: 'text-pink-500', bgColor: 'bg-pink-500/10', label: 'Announcement' },
  email: { icon: Mail, color: 'text-info', bgColor: 'bg-info/10', label: 'Email Campaign' },
  'press-release': { icon: Newspaper, color: 'text-primary', bgColor: 'bg-primary/10', label: 'Press Release' },
  broadcast: { icon: Radio, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', label: 'Broadcast' },
};

const filterOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'email', label: 'Email Campaigns' },
  { value: 'press-release', label: 'Press Releases' },
  { value: 'broadcast', label: 'Broadcasts' },
];

const timeRangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Scheduled' },
];

export function ScheduleUpdateTab({ workspaceId }: ScheduleUpdateTabProps) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('all');

  const { data: announcements = [], isLoading: loadingAnnouncements } = useAnnouncements(workspaceId);
  const { data: emailCampaigns = [], isLoading: loadingEmails } = useEmailCampaigns(workspaceId);
  const { data: pressReleases = [], isLoading: loadingPress } = usePressReleases(workspaceId);
  const { data: broadcasts = [], isLoading: loadingBroadcasts } = useBroadcastMessages(workspaceId);

  const isLoading = loadingAnnouncements || loadingEmails || loadingPress || loadingBroadcasts;

  // Combine all scheduled items
  const allScheduledItems: ScheduledItem[] = [
    ...announcements
      .filter((a) => a.status === 'scheduled' && a.scheduled_for)
      .map((a) => ({
        id: a.id,
        type: 'announcement' as const,
        title: a.title,
        scheduledFor: a.scheduled_for as string,
        status: a.status,
        content: a.content,
      })),
    ...emailCampaigns
      .filter((e) => e.status === 'scheduled' && e.scheduled_for)
      .map((e) => ({
        id: e.id,
        type: 'email' as const,
        title: e.name,
        scheduledFor: e.scheduled_for!,
        status: e.status,
        content: e.subject,
      })),
    ...pressReleases
      .filter((p) => p.status === 'approved' && p.embargo_date)
      .map((p) => ({
        id: p.id,
        type: 'press-release' as const,
        title: p.title,
        scheduledFor: p.embargo_date!,
        status: p.status,
        content: p.content?.substring(0, 100),
      })),
    ...broadcasts
      .filter((b) => b.status === 'scheduled' && b.scheduled_for)
      .map((b) => ({
        id: b.id,
        type: 'broadcast' as const,
        title: b.title,
        scheduledFor: b.scheduled_for!,
        status: b.status,
        content: b.content,
      })),
  ];

  // Apply filters
  const filteredItems = allScheduledItems
    .filter((item) => {
      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      // Time range filter
      const scheduledDate = new Date(item.scheduledFor);
      const today = new Date();

      if (timeRange === 'today') {
        return isAfter(scheduledDate, startOfDay(today)) && isBefore(scheduledDate, endOfDay(today));
      }
      if (timeRange === 'week') {
        return isAfter(scheduledDate, startOfDay(today)) && isBefore(scheduledDate, addDays(today, 7));
      }
      if (timeRange === 'month') {
        return isAfter(scheduledDate, startOfDay(today)) && isBefore(scheduledDate, addDays(today, 30));
      }

      return true;
    })
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

  // Group by date
  const groupedByDate = filteredItems.reduce((acc, item) => {
    const dateKey = format(new Date(item.scheduledFor), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, ScheduledItem[]>);

  const totalScheduled = allScheduledItems.length;
  const todayCount = allScheduledItems.filter((item) => {
    const d = new Date(item.scheduledFor);
    const today = new Date();
    return isAfter(d, startOfDay(today)) && isBefore(d, endOfDay(today));
  }).length;
  const weekCount = allScheduledItems.filter((item) => {
    const d = new Date(item.scheduledFor);
    const today = new Date();
    return isAfter(d, startOfDay(today)) && isBefore(d, addDays(today, 7));
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Scheduled Communications
          </h2>
          <p className="text-muted-foreground mt-1">
            View and manage all scheduled communications in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalScheduled}</p>
                <p className="text-sm text-muted-foreground">Total Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Clock className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayCount}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Send className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekCount}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <RefreshCw className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredItems.length}</p>
                <p className="text-sm text-muted-foreground">Filtered Results</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : Object.keys(groupedByDate).length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No scheduled communications</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create announcements, emails, press releases, or broadcasts and schedule them
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {Object.entries(groupedByDate).map(([dateKey, items]) => {
                  const date = new Date(dateKey);
                  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                  return (
                    <div key={dateKey}>
                      {/* Date Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isToday ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {isToday ? 'Today' : format(date, 'EEEE, MMM d')}
                        </div>
                        <Badge variant="outline">{items.length} items</Badge>
                      </div>

                      {/* Items for this date */}
                      <div className="space-y-2 ml-4 border-l-2 border-border/50 pl-4">
                        {items.map((item) => {
                          const config = typeConfig[item.type];
                          const ItemIcon = config.icon;

                          return (
                            <div
                              key={`${item.type}-${item.id}`}
                              className="flex items-start justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`p-2 rounded-lg ${config.bgColor} mt-0.5`}>
                                  <ItemIcon className={`h-4 w-4 ${config.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-foreground">{item.title}</p>
                                    <Badge variant="outline" className={`text-xs ${config.color}`}>
                                      {config.label}
                                    </Badge>
                                  </div>
                                  {item.content && (
                                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                      {item.content}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(item.scheduledFor), 'h:mm a')}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-4">
                                <Button size="icon" variant="ghost">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
