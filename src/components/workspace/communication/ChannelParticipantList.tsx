import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Search, 
  UserMinus, 
  UserPlus,
  ArrowLeft,
  Mail,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ChannelParticipantListProps {
  channelId: string;
  channelName: string;
  eventId: string;
  onBack?: () => void;
}

interface Participant {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  joined_at: string;
  is_active: boolean;
  permissions: {
    can_read: boolean;
    can_write: boolean;
  };
}

export function ChannelParticipantList({ 
  channelId, 
  channelName, 
  eventId, 
  onBack 
}: ChannelParticipantListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch participants for this channel
  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['channel-participants', channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('participant_channels')
        .select(`
          id,
          user_id,
          joined_at,
          is_active,
          permissions
        `)
        .eq('channel_id', channelId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles
      const userIds = data?.map(p => p.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data?.map(p => {
        const profile = profileMap.get(p.user_id);
        const permissions = p.permissions as { can_read?: boolean; can_write?: boolean } | null;
        return {
          id: p.id,
          user_id: p.user_id,
          user_name: profile?.full_name || null,
          user_email: profile?.email || null,
          joined_at: p.joined_at,
          is_active: p.is_active,
          permissions: {
            can_read: permissions?.can_read ?? true,
            can_write: permissions?.can_write ?? true,
          },
        };
      }) as Participant[] || [];
    },
  });

  // Fetch eligible users to add (confirmed registrations not in channel)
  const { data: eligibleUsers = [] } = useQuery({
    queryKey: ['eligible-channel-users', channelId, eventId],
    queryFn: async () => {
      // Get confirmed registrations
      const { data: registrations } = await supabase
        .from('registrations')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'CONFIRMED');

      const regUserIds = registrations?.map(r => r.user_id) || [];
      if (regUserIds.length === 0) return [];

      // Get current channel participants
      const { data: currentParticipants } = await supabase
        .from('participant_channels')
        .select('user_id')
        .eq('channel_id', channelId)
        .eq('is_active', true);

      const currentUserIds = new Set(currentParticipants?.map(p => p.user_id) || []);
      const eligibleUserIds = regUserIds.filter(id => !currentUserIds.has(id));

      if (eligibleUserIds.length === 0) return [];

      // Get profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', eligibleUserIds);

      return profiles || [];
    },
  });

  // Remove participant mutation
  const removeMutation = useMutation({
    mutationFn: async (participantId: string) => {
      const { error } = await supabase
        .from('participant_channels')
        .update({ is_active: false, left_at: new Date().toISOString() })
        .eq('id', participantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-participants', channelId] });
      queryClient.invalidateQueries({ queryKey: ['eligible-channel-users', channelId, eventId] });
      toast.success('Participant removed from channel');
    },
    onError: () => {
      toast.error('Failed to remove participant');
    },
  });

  // Add participant mutation
  const addMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Get registration
      const { data: reg } = await supabase
        .from('registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('status', 'CONFIRMED')
        .single();

      if (!reg) throw new Error('No confirmed registration found');

      // Get user name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      // Add to channel_members
      await supabase
        .from('channel_members')
        .upsert({
          channel_id: channelId,
          user_id: userId,
          user_name: profile?.full_name || null,
        }, { onConflict: 'channel_id,user_id' });

      // Add to participant_channels
      const { error } = await supabase
        .from('participant_channels')
        .upsert({
          registration_id: reg.id,
          channel_id: channelId,
          user_id: userId,
          event_id: eventId,
          permissions: { can_read: true, can_write: true },
          is_active: true,
          left_at: null,
        }, { onConflict: 'registration_id,channel_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-participants', channelId] });
      queryClient.invalidateQueries({ queryKey: ['eligible-channel-users', channelId, eventId] });
      toast.success('Participant added to channel');
    },
    onError: () => {
      toast.error('Failed to add participant');
    },
  });

  // Filter participants by search
  const filteredParticipants = participants.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.user_name?.toLowerCase().includes(query) ||
      p.user_email?.toLowerCase().includes(query)
    );
  });

  // Filter eligible users by search
  const filteredEligible = eligibleUsers.filter(u => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              #{channelName} Participants
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {participants.length} participant{participants.length !== 1 ? 's' : ''} in this channel
            </p>
          </div>
        </div>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Participants */}
        <div>
          <h4 className="text-sm font-medium mb-2">Current Participants</h4>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filteredParticipants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {searchQuery ? 'No participants match your search' : 'No participants in this channel'}
            </p>
          ) : (
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {filteredParticipants.map((participant) => (
                  <ParticipantRow
                    key={participant.id}
                    participant={participant}
                    onRemove={() => removeMutation.mutate(participant.id)}
                    isRemoving={removeMutation.isPending}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Add Participants */}
        {eligibleUsers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Add Participants</h4>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {filteredEligible.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-muted">
                          {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addMutation.mutate(user.id)}
                      disabled={addMutation.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ParticipantRowProps {
  participant: Participant;
  onRemove: () => void;
  isRemoving: boolean;
}

function ParticipantRow({ participant, onRemove, isRemoving }: ParticipantRowProps) {
  const initials = participant.user_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/30 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{participant.user_name || 'Unknown'}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {participant.user_email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {participant.user_email}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined {formatDistanceToNow(new Date(participant.joined_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!participant.permissions.can_write && (
          <Badge variant="outline" className="text-xs">Read-only</Badge>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
          disabled={isRemoving}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <UserMinus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
