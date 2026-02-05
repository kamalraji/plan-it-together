import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Shield, 
  UserX, 
  Clock, 
  Ban, 
  AlertTriangle,
  History,
  Search,
  X,
  VolumeX
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface ModerationToolsPanelProps {
  workspaceId: string;
  channelId?: string;
}

type ModerationAction = 'mute' | 'timeout' | 'ban' | 'warn' | 'restrict';

interface ModerationRecord {
  id: string;
  channel_id: string;
  target_user_id: string;
  action: ModerationAction;
  duration_minutes: number | null;
  reason: string | null;
  moderator_id: string;
  expires_at: string | null;
  created_at: string;
  is_active: boolean;
  revoked_at: string | null;
  revoked_by: string | null;
}

const ACTION_CONFIGS: Record<ModerationAction, { icon: React.ReactNode; label: string; color: string }> = {
  mute: { icon: <VolumeX className="h-4 w-4" />, label: 'Mute', color: 'text-warning' },
  timeout: { icon: <Clock className="h-4 w-4" />, label: 'Timeout', color: 'text-orange-500' },
  ban: { icon: <Ban className="h-4 w-4" />, label: 'Ban', color: 'text-destructive' },
  warn: { icon: <AlertTriangle className="h-4 w-4" />, label: 'Warning', color: 'text-warning' },
  restrict: { icon: <UserX className="h-4 w-4" />, label: 'Restrict', color: 'text-primary' },
};

const DURATION_OPTIONS = [
  { value: '5', label: '5 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '60', label: '1 hour' },
  { value: '360', label: '6 hours' },
  { value: '1440', label: '24 hours' },
  { value: '10080', label: '7 days' },
  { value: '0', label: 'Permanent' },
];

export function ModerationToolsPanel({ workspaceId, channelId }: ModerationToolsPanelProps) {
  const queryClient = useQueryClient();
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ModerationAction>('mute');
  const [targetUserId, setTargetUserId] = useState('');
  const [duration, setDuration] = useState('60');
  const [reason, setReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch moderation actions
  const { data: moderationActions = [], isLoading } = useQuery({
    queryKey: ['moderation-actions', workspaceId, channelId],
    queryFn: async () => {
      let query = supabase
        .from('channel_moderation_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (channelId) {
        query = query.eq('channel_id', channelId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ModerationRecord[];
    },
    enabled: !!workspaceId,
  });

  // Apply moderation action
  const applyActionMutation = useMutation({
    mutationFn: async () => {
      if (!targetUserId.trim()) throw new Error('User ID is required');
      if (!channelId) throw new Error('Channel must be selected');

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const durationMins = parseInt(duration) || null;
      const expiresAt = durationMins 
        ? new Date(Date.now() + durationMins * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('channel_moderation_actions')
        .insert({
          channel_id: channelId,
          target_user_id: targetUserId.trim(),
          action: selectedAction,
          duration_minutes: durationMins,
          reason: reason.trim() || null,
          moderator_id: userData.user.id,
          expires_at: expiresAt,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Moderation action applied');
      setShowActionDialog(false);
      setTargetUserId('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['moderation-actions', workspaceId, channelId] });
    },
    onError: (error) => {
      toast.error(`Failed to apply action: ${error.message}`);
    },
  });

  // Revoke moderation action
  const revokeActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('channel_moderation_actions')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: userData.user.id,
        })
        .eq('id', actionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Action revoked');
      queryClient.invalidateQueries({ queryKey: ['moderation-actions', workspaceId, channelId] });
    },
    onError: (error) => {
      toast.error(`Failed to revoke: ${error.message}`);
    },
  });

  // Filter actions by search
  const filteredActions = moderationActions.filter(action => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      action.target_user_id.toLowerCase().includes(query) ||
      action.action.toLowerCase().includes(query) ||
      action.reason?.toLowerCase().includes(query)
    );
  });

  // Count active actions by type
  const actionCounts = moderationActions.reduce((acc, action) => {
    if (action.is_active) {
      acc[action.action] = (acc[action.action] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(ACTION_CONFIGS).map(([action, config]) => (
          <Card key={action} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
                {config.icon}
              </div>
              <div>
                <p className="text-2xl font-bold">{actionCounts[action] || 0}</p>
                <p className="text-xs text-muted-foreground">{config.label}s</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Panel */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Moderation Actions
              </CardTitle>
              <CardDescription>Manage user restrictions and bans</CardDescription>
            </div>
            <Button onClick={() => setShowActionDialog(true)} disabled={!channelId}>
              <UserX className="h-4 w-4 mr-2" />
              New Action
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user ID, action type, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Actions Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No moderation actions yet</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActions.map((action) => {
                    const config = ACTION_CONFIGS[action.action];
                    const isExpired = action.expires_at && new Date(action.expires_at) < new Date();
                    const isActive = action.is_active && !isExpired;

                    return (
                      <TableRow key={action.id}>
                        <TableCell>
                          <div className={`flex items-center gap-2 ${config.color}`}>
                            {config.icon}
                            <span className="font-medium">{config.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {action.target_user_id.substring(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                            {action.reason || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {action.duration_minutes 
                            ? `${action.duration_minutes} min`
                            : 'Permanent'
                          }
                        </TableCell>
                        <TableCell>
                          {isActive ? (
                            <Badge variant="destructive" className="text-xs">
                              Active
                            </Badge>
                          ) : action.revoked_at ? (
                            <Badge variant="outline" className="text-xs">
                              Revoked
                            </Badge>
                          ) : isExpired ? (
                            <Badge variant="secondary" className="text-xs">
                              Expired
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revokeActionMutation.mutate(action.id)}
                              disabled={revokeActionMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Apply Moderation Action
            </DialogTitle>
            <DialogDescription>
              Take action against a user who has violated community guidelines
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select value={selectedAction} onValueChange={(v) => setSelectedAction(v as ModerationAction)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTION_CONFIGS).map(([action, config]) => (
                    <SelectItem key={action} value={action}>
                      <div className={`flex items-center gap-2 ${config.color}`}>
                        {config.icon}
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-user">User ID</Label>
              <Input
                id="target-user"
                placeholder="Enter user UUID..."
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              />
            </div>

            {selectedAction !== 'warn' && (
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Describe the reason for this action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => applyActionMutation.mutate()}
              disabled={applyActionMutation.isPending || !targetUserId.trim()}
            >
              {applyActionMutation.isPending ? 'Applying...' : 'Apply Action'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
