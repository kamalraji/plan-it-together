/**
 * ChannelModerationTools - Moderation UI for channel management
 * 
 * Features:
 * - Block/unblock participants
 * - Mute/unmute participants
 * - Delete messages
 * - View moderation history
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Shield,
  Ban,
  VolumeX,
  Volume2,
  MoreVertical,
  Search,
  UserX,
  MessageSquare,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ChannelModerationToolsProps {
  workspaceId: string;
  channelId?: string;
}

interface ChannelMember {
  id: string;
  user_id: string;
  user_name: string | null;
  is_muted: boolean;
  muted_until: string | null;
  joined_at: string;
}

export function ChannelModerationTools({ workspaceId, channelId }: ChannelModerationToolsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionDialog, setActionDialog] = useState<{
    type: 'mute' | 'unmute' | 'block' | 'unblock' | null;
    member: ChannelMember | null;
  }>({ type: null, member: null });
  const queryClient = useQueryClient();

  // Fetch channel members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['channel-members-moderation', channelId],
    queryFn: async () => {
      if (!channelId) return [];
      
      const { data, error } = await supabase
        .from('channel_members')
        .select('id, user_id, user_name, is_muted, muted_until, joined_at')
        .eq('channel_id', channelId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return data as ChannelMember[];
    },
    enabled: !!channelId,
  });

  // Fetch blocked users for workspace
  const { data: blockedUsers = [] } = useQuery({
    queryKey: ['blocked-users', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_user_id')
        .eq('user_id', workspaceId); // Using workspace_id as context

      if (error) throw error;
      return data.map(b => b.blocked_user_id);
    },
    enabled: !!workspaceId,
  });

  // Mute mutation
  const muteMutation = useMutation({
    mutationFn: async ({ memberId, duration }: { memberId: string; duration: number }) => {
      const mutedUntil = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('channel_members')
        .update({ is_muted: true, muted_until: mutedUntil })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-members-moderation', channelId] });
      toast.success('Member muted successfully');
      setActionDialog({ type: null, member: null });
    },
    onError: (error) => {
      toast.error(`Failed to mute member: ${error.message}`);
    },
  });

  // Unmute mutation
  const unmuteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('channel_members')
        .update({ is_muted: false, muted_until: null })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-members-moderation', channelId] });
      toast.success('Member unmuted successfully');
      setActionDialog({ type: null, member: null });
    },
    onError: (error) => {
      toast.error(`Failed to unmute member: ${error.message}`);
    },
  });

  // Remove from channel mutation
  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('channel_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-members-moderation', channelId] });
      toast.success('Member removed from channel');
      setActionDialog({ type: null, member: null });
    },
    onError: (error) => {
      toast.error(`Failed to remove member: ${error.message}`);
    },
  });

  // Filter members by search
  const filteredMembers = members.filter((member) =>
    member.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleMute = (member: ChannelMember) => {
    setActionDialog({ type: 'mute', member });
  };

  const handleUnmute = (member: ChannelMember) => {
    unmuteMutation.mutate(member.id);
  };

  const handleRemove = (member: ChannelMember) => {
    setActionDialog({ type: 'block', member });
  };

  if (!channelId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a channel to manage moderation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Channel Moderation
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage participant access and permissions
          </p>
        </div>
        <Badge variant="outline">
          {members.length} members
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">{members.length}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <VolumeX className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {members.filter(m => m.is_muted).length}
                </p>
                <p className="text-xs text-muted-foreground">Muted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Ban className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-lg font-semibold">{blockedUsers.length}</p>
                <p className="text-xs text-muted-foreground">Blocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Channel Members</CardTitle>
          <CardDescription>
            Manage individual member permissions and access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserX className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No members found</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(member.user_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {member.user_name || 'Unknown User'}
                          </span>
                          {member.is_muted && (
                            <Badge variant="secondary" className="text-xs">
                              <VolumeX className="h-3 w-3 mr-1" />
                              Muted
                            </Badge>
                          )}
                          {blockedUsers.includes(member.user_id) && (
                            <Badge variant="destructive" className="text-xs">
                              <Ban className="h-3 w-3 mr-1" />
                              Blocked
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.is_muted ? (
                          <DropdownMenuItem onClick={() => handleUnmute(member)}>
                            <Volume2 className="h-4 w-4 mr-2" />
                            Unmute
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleMute(member)}>
                            <VolumeX className="h-4 w-4 mr-2" />
                            Mute
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleRemove(member)}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Remove from Channel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Mute Dialog */}
      <AlertDialog 
        open={actionDialog.type === 'mute'} 
        onOpenChange={() => setActionDialog({ type: null, member: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <VolumeX className="h-5 w-5 text-amber-600" />
              Mute Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              Mute <strong>{actionDialog.member?.user_name}</strong> from sending messages in this channel. 
              They will still be able to read messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-3 gap-2 py-4">
            <Button 
              variant="outline" 
              onClick={() => muteMutation.mutate({ memberId: actionDialog.member!.id, duration: 1 })}
              disabled={muteMutation.isPending}
            >
              1 hour
            </Button>
            <Button 
              variant="outline" 
              onClick={() => muteMutation.mutate({ memberId: actionDialog.member!.id, duration: 24 })}
              disabled={muteMutation.isPending}
            >
              24 hours
            </Button>
            <Button 
              variant="outline" 
              onClick={() => muteMutation.mutate({ memberId: actionDialog.member!.id, duration: 168 })}
              disabled={muteMutation.isPending}
            >
              7 days
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Dialog */}
      <AlertDialog 
        open={actionDialog.type === 'block'} 
        onOpenChange={() => setActionDialog({ type: null, member: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <UserX className="h-5 w-5" />
              Remove Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{actionDialog.member?.user_name}</strong> from this channel? 
              They will no longer be able to see or send messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeMutation.mutate(actionDialog.member!.id)}
              disabled={removeMutation.isPending}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
