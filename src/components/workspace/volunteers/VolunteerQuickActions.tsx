import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  Calendar, 
  Download, 
  MessageSquare, 
  UserPlus,
  Zap,
  Loader2,
  ScanLine,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AssignVolunteersModal } from './AssignVolunteersModal';
import { AddVolunteerModal } from './AddVolunteerModal';

interface VolunteerQuickActionsProps {
  workspaceId: string;
  eventId?: string | null;
  orgSlug?: string;
}

export function VolunteerQuickActions({ workspaceId, eventId, orgSlug }: VolunteerQuickActionsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAddVolunteerModalOpen, setIsAddVolunteerModalOpen] = useState(false);
  

  const handleOpenCheckIn = () => {
    if (!eventId || !orgSlug) {
      toast.error('Event check-in is not available for this workspace');
      return;
    }
    const checkInUrl = `/${orgSlug}/eventmanagement/${eventId}/check-in`;
    window.open(checkInUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendBrief = async () => {
    setLoadingAction('send_brief');
    try {
      // Get all active team members
      const { data: members, error } = await supabase
        .from('workspace_team_members')
        .select('user_id')
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE');

      if (error) throw error;

      // Create notifications for each member
      const notifications = members?.map(member => ({
        user_id: member.user_id,
        title: 'Volunteer Briefing',
        message: 'A new volunteer briefing has been shared. Please review before your shift.',
        type: 'workspace',
        category: 'workspace',
      })) || [];

      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);
        
        if (notifError) throw notifError;
      }

      toast.success(`Briefing sent to ${notifications.length} volunteers`);
    } catch {
      toast.error('Failed to send briefing');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportRoster = async () => {
    setLoadingAction('export_roster');
    try {
      const { data: members, error } = await supabase
        .from('workspace_team_members')
        .select('user_id, status, role, joined_at')
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      // Get user profiles
      const userIds = members?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Create CSV content
      const csvRows = [
        ['Name', 'Role', 'Status', 'Joined Date'].join(','),
        ...(members || []).map(m => {
          return [
            profileMap.get(m.user_id) || 'Unknown',
            m.role,
            m.status,
            new Date(m.joined_at).toLocaleDateString(),
          ].join(',');
        }),
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `volunteer-roster-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Roster exported successfully');
    } catch {
      toast.error('Failed to export roster');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSendReminder = async () => {
    setLoadingAction('send_reminder');
    try {
      // Get upcoming shift assignments
      const { data: assignments, error } = await supabase
        .from('volunteer_assignments')
        .select(`
          user_id,
          volunteer_shifts!inner (
            name,
            date,
            start_time,
            workspace_id
          )
        `)
        .eq('volunteer_shifts.workspace_id', workspaceId)
        .eq('status', 'CONFIRMED');

      if (error) throw error;

      const uniqueUserIds = [...new Set(assignments?.map(a => a.user_id) || [])];
      
      const notifications = uniqueUserIds.map(userId => ({
        user_id: userId,
        title: 'Shift Reminder',
        message: 'You have an upcoming volunteer shift. Please check your schedule.',
        type: 'workspace',
        category: 'workspace',
      }));

      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);
        
        if (notifError) throw notifError;
      }

      toast.success(`Reminder sent to ${notifications.length} volunteers`);
    } catch {
      toast.error('Failed to send reminder');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddVolunteers = () => {
    setIsAddVolunteerModalOpen(true);
  };

  const handleAssignShifts = () => {
    setIsAssignModalOpen(true);
  };

  const checkInAvailable = !!eventId && !!orgSlug;

  const actions = [
    {
      id: 'open_checkin',
      label: 'Event Check-In',
      description: checkInAvailable ? 'Open check-in scanner' : 'No event linked',
      icon: ScanLine,
      color: 'text-green-500',
      onClick: handleOpenCheckIn,
      disabled: !checkInAvailable,
      external: true,
    },
    {
      id: 'send_brief',
      label: 'Send Brief',
      description: 'Send briefing to all volunteers',
      icon: Send,
      color: 'text-blue-500',
      onClick: handleSendBrief,
    },
    {
      id: 'assign_shifts',
      label: 'Assign Shifts',
      description: 'Bulk assign volunteer shifts',
      icon: Calendar,
      color: 'text-emerald-500',
      onClick: handleAssignShifts,
    },
    {
      id: 'export_roster',
      label: 'Export Roster',
      description: 'Download volunteer list',
      icon: Download,
      color: 'text-purple-500',
      onClick: handleExportRoster,
    },
    {
      id: 'send_reminder',
      label: 'Send Reminder',
      description: 'Remind upcoming shifts',
      icon: MessageSquare,
      color: 'text-amber-500',
      onClick: handleSendReminder,
    },
    {
      id: 'add_volunteers',
      label: 'Add Volunteers',
      description: 'Invite new volunteers',
      icon: UserPlus,
      color: 'text-pink-500',
      onClick: handleAddVolunteers,
    },
  ];

  return (
    <>
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Zap className="h-4 w-4 text-pink-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className="h-auto flex-col items-start gap-1 p-3 text-left hover:bg-muted/50"
              onClick={action.onClick}
              disabled={loadingAction === action.id || action.disabled}
            >
              <div className="flex items-center gap-2">
                {loadingAction === action.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <action.icon className={`h-4 w-4 ${action.disabled ? 'text-muted-foreground' : action.color}`} />
                )}
                <span className="font-medium text-sm">{action.label}</span>
                {action.external && !action.disabled && (
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">{action.description}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
    
    <AssignVolunteersModal open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen} workspaceId={workspaceId} />
    <AddVolunteerModal open={isAddVolunteerModalOpen} onOpenChange={setIsAddVolunteerModalOpen} workspaceId={workspaceId} />
    </>
  );
}
