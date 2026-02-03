import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  UserPlus, 
  Shuffle, 
  Download, 
  Mail,
  BarChart,
  Trophy,
  Settings,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';

interface JudgeQuickActionsProps {
  workspaceId?: string;
  eventId?: string;
  onViewTasks?: () => void;
  onViewAnalytics?: () => void;
  onOpenSettings?: () => void;
}

export function JudgeQuickActions({
  workspaceId,
  eventId,
  onViewTasks,
  onViewAnalytics,
  onOpenSettings,
}: JudgeQuickActionsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [reminderMessage, setReminderMessage] = useState(
    'This is a friendly reminder to complete your judging assignments. Please review and score the submissions assigned to you.'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);

  // Fetch judges for reminder functionality
  const { data: judges } = useQuery({
    queryKey: ['workspace-judges', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('id, user_id, role, status')
        .eq('workspace_id', workspaceId)
        .in('role', ['JUDGE', 'LEAD_JUDGE']);
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  // Fetch submissions for auto-assign
  const { data: submissions } = useQuery({
    queryKey: ['workspace-submissions', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, title, status, assigned_to, category')
        .eq('workspace_id', workspaceId)
        .eq('category', 'submission');
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  // Invite judge mutation
  const inviteJudgeMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!workspaceId || !user) throw new Error('No workspace selected');
      
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        // Add existing user as judge
        const { error } = await supabase
          .from('workspace_team_members')
          .insert({
            workspace_id: workspaceId,
            user_id: existingUser.id,
            role: 'JUDGE',
            status: 'active',
          });
        if (error) throw error;
      } else {
        // Create invitation for new user
        const { error } = await supabase
          .from('workspace_invitations')
          .insert({
            workspace_id: workspaceId,
            email: email,
            role: 'JUDGE',
            status: 'pending',
            invited_by: user.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Judge invitation sent successfully');
      setInviteDialogOpen(false);
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['workspace-judges', workspaceId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to invite judge: ${error.message}`);
    },
  });

  // Auto-assign submissions to judges
  const handleAutoAssign = async () => {
    if (!workspaceId || !judges?.length || !submissions?.length) {
      toast.error('No judges or submissions available for assignment');
      return;
    }

    setIsAutoAssigning(true);
    try {
      const unassignedSubmissions = submissions.filter(s => !s.assigned_to);
      
      if (unassignedSubmissions.length === 0) {
        toast.info('All submissions are already assigned');
        setIsAutoAssigning(false);
        return;
      }

      // Round-robin assignment
      const assignments = unassignedSubmissions.map((submission, index) => ({
        id: submission.id,
        assigned_to: judges[index % judges.length].user_id,
      }));

      for (const assignment of assignments) {
        await supabase
          .from('workspace_tasks')
          .update({ assigned_to: assignment.assigned_to })
          .eq('id', assignment.id);
      }

      toast.success(`Auto-assigned ${assignments.length} submissions to ${judges.length} judges`);
      queryClient.invalidateQueries({ queryKey: ['workspace-submissions', workspaceId] });
    } catch (error) {
      toast.error('Failed to auto-assign submissions');
    } finally {
      setIsAutoAssigning(false);
    }
  };

  // Send reminders to judges
  const handleSendReminders = async () => {
    if (!judges?.length) {
      toast.error('No judges to send reminders to');
      return;
    }

    try {
      // Create notification for each judge
      for (const judge of judges) {
        await supabase.from('notifications').insert({
          user_id: judge.user_id,
          title: 'Judging Reminder',
          message: reminderMessage,
          type: 'task',
          category: 'workspace',
        });
      }

      toast.success(`Reminders sent to ${judges.length} judges`);
      setReminderDialogOpen(false);
    } catch (error) {
      toast.error('Failed to send reminders');
    }
  };

  // Export scores as CSV
  const handleExportScores = async () => {
    if (!workspaceId) {
      toast.error('No workspace selected');
      return;
    }

    setIsExporting(true);
    try {
      // Fetch all scores/evaluations for this workspace
      const { data: scores, error } = await supabase
        .from('workspace_tasks')
        .select('id, title, status, priority, assigned_to, description, category')
        .eq('workspace_id', workspaceId)
        .eq('category', 'submission');

      if (error) throw error;

      if (!scores?.length) {
        toast.info('No scores to export');
        setIsExporting(false);
        return;
      }

      // Generate CSV content
      const headers = ['Submission ID', 'Title', 'Status', 'Priority', 'Assigned To', 'Description'];
      const rows = scores.map(score => [
        score.id,
        score.title || '',
        score.status || '',
        score.priority || '',
        score.assigned_to || '',
        score.description || '',
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `judging-scores-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success('Scores exported successfully');
    } catch (error) {
      toast.error('Failed to export scores');
    } finally {
      setIsExporting(false);
    }
  };

  // Announce winners
  const handleAnnounceWinners = async () => {
    if (!workspaceId || !user) {
      toast.error('Missing workspace or user context');
      return;
    }

    try {
      // Create announcement broadcast
      const { error } = await supabase.from('workspace_broadcasts').insert({
        workspace_id: workspaceId,
        event_id: eventId || null,
        sender_id: user.id,
        title: '🏆 Winners Announced!',
        content: 'The judging process has been completed and winners have been selected. Check the results in the workspace.',
        priority: 'important',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Winner announcement published!');
      setWinnerDialogOpen(false);
    } catch (error) {
      toast.error('Failed to announce winners');
    }
  };

  const actions = [
    {
      label: 'Invite Judge',
      icon: UserPlus,
      variant: 'default' as const,
      onClick: () => setInviteDialogOpen(true),
    },
    {
      label: 'Auto-Assign',
      icon: isAutoAssigning ? Loader2 : Shuffle,
      variant: 'outline' as const,
      onClick: handleAutoAssign,
      disabled: isAutoAssigning,
      className: isAutoAssigning ? 'animate-pulse' : '',
    },
    {
      label: 'Send Reminders',
      icon: Mail,
      variant: 'outline' as const,
      onClick: () => setReminderDialogOpen(true),
    },
    {
      label: 'Export Scores',
      icon: isExporting ? Loader2 : Download,
      variant: 'outline' as const,
      onClick: handleExportScores,
      disabled: isExporting,
      className: isExporting ? 'animate-pulse' : '',
    },
    {
      label: 'View Analytics',
      icon: BarChart,
      variant: 'outline' as const,
      onClick: onViewAnalytics || onViewTasks,
    },
    {
      label: 'Announce Winners',
      icon: Trophy,
      variant: 'outline' as const,
      onClick: () => setWinnerDialogOpen(true),
    },
    {
      label: 'Rubric Settings',
      icon: Settings,
      variant: 'ghost' as const,
      onClick: onOpenSettings,
    },
  ];

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                size="sm"
                className={`justify-start gap-2 h-auto py-2.5 ${action.className || ''}`}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                <action.icon className={`h-4 w-4 ${action.disabled ? 'animate-spin' : ''}`} />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite Judge Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Judge</DialogTitle>
            <DialogDescription>
              Enter the email address of the person you want to invite as a judge.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="judge-email">Email Address</Label>
              <Input
                id="judge-email"
                type="email"
                placeholder="judge@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => inviteJudgeMutation.mutate(inviteEmail)}
              disabled={!inviteEmail || inviteJudgeMutation.isPending}
            >
              {inviteJudgeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminders Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Reminders</DialogTitle>
            <DialogDescription>
              Send a reminder notification to all judges ({judges?.length || 0} judges).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-message">Reminder Message</Label>
              <Textarea
                id="reminder-message"
                placeholder="Enter your reminder message..."
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendReminders} disabled={!reminderMessage}>
              Send to All Judges
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announce Winners Dialog */}
      <Dialog open={winnerDialogOpen} onOpenChange={setWinnerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Announce Winners</DialogTitle>
            <DialogDescription>
              This will publish a winner announcement to the workspace. Make sure all scores are finalized.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              A broadcast message will be sent to all workspace members announcing that winners have been selected.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWinnerDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAnnounceWinners}>
              <Trophy className="h-4 w-4 mr-2" />
              Announce Winners
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
