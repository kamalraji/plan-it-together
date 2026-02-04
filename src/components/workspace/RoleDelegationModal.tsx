import { useState } from 'react';
import { UserPlus, Shield, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { TeamMember, WorkspaceRole } from '@/types';
import { getWorkspaceRoleLabel, getWorkspaceRoleLevel, WorkspaceHierarchyLevel } from '@/lib/workspaceHierarchy';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RoleDelegationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  responsibleRole: WorkspaceRole;
  currentHolder?: TeamMember;
  teamMembers: TeamMember[];
  currentUserId?: string;
  onDelegated?: () => void;
}

export function RoleDelegationModal({
  open,
  onOpenChange,
  workspaceName,
  responsibleRole,
  currentHolder,
  teamMembers,
  currentUserId,
  onDelegated,
}: RoleDelegationModalProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDelegating, setIsDelegating] = useState(false);

  const isCurrentUserHolder = currentHolder?.userId === currentUserId;

  // Filter eligible members (exclude current holder)
  const eligibleMembers = teamMembers.filter(
    (m) => m.userId !== currentHolder?.userId && m.status === 'active'
  );

  const handleDelegate = async () => {
    if (!selectedMember) return;

    setIsDelegating(true);
    try {
      // Update the selected member to have the responsible role
      const { error: updateNewError } = await supabase
        .from('workspace_team_members')
        .update({ role: responsibleRole })
        .eq('id', selectedMember.id);

      if (updateNewError) throw updateNewError;

      // If there's a current holder, demote them to a lower role
      if (currentHolder) {
        const currentLevel = getWorkspaceRoleLevel(responsibleRole);
        let demotedRole: WorkspaceRole;

        // Demote to coordinator level role based on department
        switch (currentLevel) {
          case WorkspaceHierarchyLevel.OWNER:
            demotedRole = WorkspaceRole.OPERATIONS_MANAGER;
            break;
          case WorkspaceHierarchyLevel.MANAGER:
            demotedRole = WorkspaceRole.EVENT_LEAD;
            break;
          case WorkspaceHierarchyLevel.LEAD:
            demotedRole = WorkspaceRole.EVENT_COORDINATOR;
            break;
          default:
            demotedRole = WorkspaceRole.VOLUNTEER_COORDINATOR;
        }

        const { error: demoteError } = await supabase
          .from('workspace_team_members')
          .update({ role: demotedRole })
          .eq('id', currentHolder.id);

        if (demoteError) {
          // Previous holder demotion failed - continue with delegation
        }
      }

      toast.success(`Role delegated to ${selectedMember.user.name}`);
      onDelegated?.();
      onOpenChange(false);
      setSelectedMember(null);
    } catch {
      toast.error('Failed to delegate role');
    } finally {
      setIsDelegating(false);
      setShowConfirmation(false);
    }
  };

  const getLevelBadgeStyle = (level: WorkspaceHierarchyLevel): string => {
    switch (level) {
      case WorkspaceHierarchyLevel.OWNER:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case WorkspaceHierarchyLevel.MANAGER:
        return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300';
      case WorkspaceHierarchyLevel.LEAD:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case WorkspaceHierarchyLevel.COORDINATOR:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    }
  };

  const roleLevel = getWorkspaceRoleLevel(responsibleRole);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Delegate Role
            </DialogTitle>
            <DialogDescription>
              Transfer the <strong>{getWorkspaceRoleLabel(responsibleRole)}</strong> responsibility for{' '}
              <strong>{workspaceName}</strong> to another team member.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Holder */}
            {currentHolder && (
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Current Holder</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {currentHolder.user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{currentHolder.user.name}</p>
                    <p className="text-xs text-muted-foreground">{currentHolder.user.email}</p>
                  </div>
                  <Badge className={cn('text-xs', getLevelBadgeStyle(roleLevel))}>
                    <Shield className="h-3 w-3 mr-1" />
                    {getWorkspaceRoleLabel(currentHolder.role)}
                  </Badge>
                </div>
              </div>
            )}

            {/* Permission Warning */}
            {isCurrentUserHolder && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  You are delegating your own role. You will lose the privileges associated with this role.
                </p>
              </div>
            )}

            {/* Eligible Members */}
            <div>
              <p className="text-sm font-medium mb-2">Select New Holder</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {eligibleMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No eligible team members available
                  </p>
                ) : (
                  eligibleMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                        selectedMember?.id === member.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                          {member.user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {getWorkspaceRoleLabel(member.role)}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => setShowConfirmation(true)}
              disabled={!selectedMember}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Delegate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Delegation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delegate the{' '}
              <strong>{getWorkspaceRoleLabel(responsibleRole)}</strong> role to{' '}
              <strong>{selectedMember?.user.name}</strong>?
              {currentHolder && (
                <>
                  <br /><br />
                  <strong>{currentHolder.user.name}</strong> will be reassigned to a different role.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDelegating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelegate} disabled={isDelegating}>
              {isDelegating ? 'Delegating...' : 'Confirm Delegation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
