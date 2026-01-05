import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Hash, Users, Bell, Settings, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Channel {
  id: string;
  name: string;
  type: 'slack' | 'discord' | 'teams' | 'whatsapp';
  members: number;
  unread: number;
  lastActivity: string;
}

const mockChannels: Channel[] = [
  { id: '1', name: 'general-announcements', type: 'slack', members: 156, unread: 0, lastActivity: '2h ago' },
  { id: '2', name: 'speaker-coordination', type: 'slack', members: 24, unread: 5, lastActivity: '15m ago' },
  { id: '3', name: 'volunteer-updates', type: 'discord', members: 89, unread: 12, lastActivity: '30m ago' },
  { id: '4', name: 'press-media', type: 'slack', members: 18, unread: 2, lastActivity: '1h ago' },
  { id: '5', name: 'sponsors-vip', type: 'teams', members: 32, unread: 0, lastActivity: '3h ago' },
  { id: '6', name: 'emergency-alerts', type: 'whatsapp', members: 12, unread: 0, lastActivity: '1d ago' },
];

const typeConfig = {
  slack: { color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  discord: { color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
  teams: { color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  whatsapp: { color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
};

export function MessagingChannels() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messaging Channels
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-2">
            {mockChannels.map((channel) => {
              const config = typeConfig[channel.type];
              
              return (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Hash className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground">{channel.name}</p>
                        {channel.unread > 0 && (
                          <Badge className="h-5 px-1.5 text-xs bg-primary text-primary-foreground">
                            {channel.unread}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Users className="h-3 w-3" />
                        <span>{channel.members} members</span>
                        <span>•</span>
                        <span>{channel.lastActivity}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <Button variant="outline" size="sm" className="w-full mt-3">
          <Bell className="h-4 w-4 mr-2" />
          Manage Notifications
        </Button>
      </CardContent>
    </Card>
  );
}
