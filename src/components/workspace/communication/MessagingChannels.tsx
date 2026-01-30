import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Hash, Users, Settings, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWorkspaceChannels, WorkspaceChannel } from '@/hooks/useWorkspaceChannels';
import { formatDistanceToNow } from 'date-fns';

interface MessagingChannelsProps {
  workspaceId: string;
  onChannelSelect?: (channel: WorkspaceChannel) => void;
}

const typeConfig: Record<string, { color: string; bgColor: string }> = {
  general: { color: 'text-primary', bgColor: 'bg-primary/10' },
  announcement: { color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  private: { color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  task: { color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
};

export function MessagingChannels({ workspaceId, onChannelSelect }: MessagingChannelsProps) {
  const { channels, isLoading, createChannel } = useWorkspaceChannels(workspaceId);

  const handleCreateChannel = () => {
    const name = prompt('Enter channel name:');
    if (name) {
      createChannel({ workspaceId, name, type: 'general' });
    }
  };

  const formatLastActivity = (dateString: string | null) => {
    if (!dateString) return 'No activity';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'No activity';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messaging Channels
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCreateChannel} aria-label="Create new channel">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Channel settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {channels.length === 0 ? (
          <div className="text-center py-8">
            <Hash className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No channels yet</p>
            <Button variant="outline" size="sm" onClick={handleCreateChannel}>
              <Plus className="h-4 w-4 mr-2" />
              Create Channel
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-2">
              {channels.map((channel) => {
                const config = typeConfig[channel.type || 'general'] || typeConfig.general;
                
                return (
                  <div
                    key={channel.id}
                    onClick={() => onChannelSelect?.(channel)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Hash className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground">{channel.name}</p>
                          {channel.is_private && (
                            <Badge variant="outline" className="text-xs">
                              Private
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Users className="h-3 w-3" />
                          <span>{channel.type || 'general'}</span>
                          <span>•</span>
                          <span>{formatLastActivity(channel.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
