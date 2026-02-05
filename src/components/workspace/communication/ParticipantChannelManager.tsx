import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Hash, 
  RefreshCw,
  Eye,
  EyeOff,
  Pencil,
  Lock
} from 'lucide-react';
import { useParticipantChannels, ChannelWithParticipantInfo } from '@/hooks/useParticipantChannels';
import { toast } from 'sonner';

interface ParticipantChannelManagerProps {
  eventId: string;
  workspaceId: string;
}

const typeColors: Record<string, string> = {
  announcement: 'bg-warning/10 text-warning',
  general: 'bg-primary/10 text-primary',
  private: 'bg-primary/10 text-primary',
  task: 'bg-emerald-500/10 text-emerald-600',
};

export function ParticipantChannelManager({ eventId, workspaceId }: ParticipantChannelManagerProps) {
  const [syncing, setSyncing] = useState(false);
  
  const {
    participantChannels,
    isLoading,
    isUpdating,
    toggleParticipantChannel,
    updateChannelPermissions,
    syncParticipants,
    refetch,
  } = useParticipantChannels(eventId, workspaceId);

  const handleToggleParticipantChannel = async (channel: ChannelWithParticipantInfo) => {
    try {
      await toggleParticipantChannel({
        channelId: channel.id,
        isParticipantChannel: !channel.is_participant_channel,
      });
      toast.success(
        channel.is_participant_channel 
          ? `"${channel.name}" is now hidden from participants`
          : `"${channel.name}" is now visible to participants`
      );
    } catch (error) {
      toast.error('Failed to update channel visibility');
    }
  };

  const handleToggleWritePermission = async (channel: ChannelWithParticipantInfo) => {
    const currentCanWrite = channel.participant_permissions?.can_write ?? true;
    try {
      await updateChannelPermissions({
        channelId: channel.id,
        permissions: {
          can_read: true,
          can_write: !currentCanWrite,
        },
      });
      toast.success(
        currentCanWrite 
          ? `"${channel.name}" is now read-only for participants`
          : `Participants can now post in "${channel.name}"`
      );
    } catch (error) {
      toast.error('Failed to update channel permissions');
    }
  };

  const handleSyncParticipants = async () => {
    setSyncing(true);
    try {
      const result = await syncParticipants();
      toast.success(
        `Synced ${result.synced} participant-channel memberships across ${result.channels} channels`
      );
      refetch();
    } catch (error) {
      toast.error('Failed to sync participants');
    } finally {
      setSyncing(false);
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
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Participant Channels
            </CardTitle>
            <CardDescription className="mt-1">
              Configure which channels are accessible to event participants
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSyncParticipants}
            disabled={syncing || isUpdating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync All Participants
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {participantChannels.length === 0 ? (
          <div className="text-center py-8">
            <Hash className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No participant channels configured
            </p>
            <p className="text-xs text-muted-foreground">
              Enable channels for participants by toggling them below or provision default channels.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {participantChannels.map((channel) => (
                <ChannelConfigCard
                  key={channel.id}
                  channel={channel}
                  isUpdating={isUpdating}
                  onToggleVisibility={() => handleToggleParticipantChannel(channel)}
                  onToggleWritePermission={() => handleToggleWritePermission(channel)}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        <Separator className="my-4" />

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {participantChannels.filter(c => c.is_participant_channel).length} of{' '}
            {participantChannels.length} channels visible to participants
          </span>
          <span>
            {participantChannels.reduce((acc, c) => acc + (c.participant_count || 0), 0)} total memberships
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface ChannelConfigCardProps {
  channel: ChannelWithParticipantInfo;
  isUpdating: boolean;
  onToggleVisibility: () => void;
  onToggleWritePermission: () => void;
}

function ChannelConfigCard({ 
  channel, 
  isUpdating, 
  onToggleVisibility, 
  onToggleWritePermission 
}: ChannelConfigCardProps) {
  const canWrite = channel.participant_permissions?.can_write ?? true;
  const typeColor = typeColors[channel.type] || typeColors.general;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${typeColor}`}>
          <Hash className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{channel.name}</p>
            <Badge variant="outline" className="text-xs">
              {channel.type}
            </Badge>
            {channel.auto_join_on_registration && (
              <Badge variant="secondary" className="text-xs">
                Auto-join
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {channel.description || 'No description'}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {channel.participant_count || 0} participants
            </span>
            {!canWrite && (
              <span className="flex items-center gap-1 text-warning">
                <Lock className="h-3 w-3" />
                Read-only
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Write Permission Toggle */}
        {channel.is_participant_channel && (
          <div className="flex items-center gap-2">
            <Label htmlFor={`write-${channel.id}`} className="text-xs text-muted-foreground cursor-pointer">
              {canWrite ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Label>
            <Switch
              id={`write-${channel.id}`}
              checked={canWrite}
              onCheckedChange={onToggleWritePermission}
              disabled={isUpdating}
              aria-label={canWrite ? 'Disable writing' : 'Enable writing'}
            />
          </div>
        )}

        {/* Visibility Toggle */}
        <div className="flex items-center gap-2">
          <Label htmlFor={`visible-${channel.id}`} className="text-xs text-muted-foreground cursor-pointer">
            {channel.is_participant_channel ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </Label>
          <Switch
            id={`visible-${channel.id}`}
            checked={channel.is_participant_channel}
            onCheckedChange={onToggleVisibility}
            disabled={isUpdating}
            aria-label={channel.is_participant_channel ? 'Hide from participants' : 'Show to participants'}
          />
        </div>
      </div>
    </div>
  );
}
