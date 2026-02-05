import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon, CheckIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { WorkspaceRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MobileRoleEditorProps {
  memberId: string;
  currentRole: string;
  memberName: string;
  workspaceId: string;
  onClose: () => void;
}

const ROLE_OPTIONS = [
  { 
    value: WorkspaceRole.WORKSPACE_OWNER, 
    label: 'Owner', 
    description: 'Full control over workspace',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  { 
    value: WorkspaceRole.OPERATIONS_MANAGER, 
    label: 'Operations Manager', 
    description: 'Manage day-to-day operations',
    color: 'bg-violet-100 text-violet-800 border-violet-200'
  },
  { 
    value: WorkspaceRole.GROWTH_MANAGER, 
    label: 'Growth Manager', 
    description: 'Handle marketing and growth',
    color: 'bg-pink-100 text-pink-800 border-pink-200'
  },
  { 
    value: WorkspaceRole.CONTENT_MANAGER, 
    label: 'Content Manager', 
    description: 'Manage content and media',
    color: 'bg-info/20 text-blue-800 border-blue-200'
  },
  { 
    value: WorkspaceRole.TECH_FINANCE_MANAGER, 
    label: 'Tech & Finance', 
    description: 'Handle technical and financial matters',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  { 
    value: WorkspaceRole.VOLUNTEERS_MANAGER, 
    label: 'Volunteers Manager', 
    description: 'Coordinate volunteer activities',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  { 
    value: WorkspaceRole.EVENT_COORDINATOR, 
    label: 'Event Coordinator', 
    description: 'Coordinate event logistics',
    color: 'bg-primary/20 text-indigo-800 border-indigo-200'
  },
  { 
    value: WorkspaceRole.MARKETING_LEAD, 
    label: 'Marketing Lead', 
    description: 'Lead marketing initiatives',
    color: 'bg-rose-100 text-rose-800 border-rose-200'
  },
];

export function MobileRoleEditor({
  memberId,
  currentRole,
  memberName,
  workspaceId,
  onClose,
}: MobileRoleEditorProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      const { error } = await supabase
        .from('workspace_team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      // Log activity
      await supabase.from('workspace_activities').insert({
        workspace_id: workspaceId,
        type: 'team',
        title: 'Role updated',
        description: `${memberName}'s role was changed to ${newRole}`,
        metadata: { memberId, oldRole: currentRole, newRole },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-team-members', workspaceId] });
      toast({
        title: 'Role updated',
        description: `${memberName}'s role has been updated successfully.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update role',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (selectedRole !== currentRole) {
      updateRoleMutation.mutate(selectedRole);
    } else {
      onClose();
    }
  };

  const isOwnerRole = currentRole === WorkspaceRole.WORKSPACE_OWNER;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Edit Role</h3>
              <p className="text-xs text-muted-foreground">{memberName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:bg-muted rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              disabled={updateRoleMutation.isPending || isOwnerRole}
              className="p-2 text-primary hover:bg-primary/10 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
            >
              <CheckIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 pb-8">
          {isOwnerRole && (
            <div className="p-3 bg-warning/10 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Owner role cannot be changed. Transfer ownership from workspace settings.
              </p>
            </div>
          )}

          {ROLE_OPTIONS.map((role) => (
            <button
              key={role.value}
              onClick={() => !isOwnerRole && setSelectedRole(role.value)}
              disabled={isOwnerRole}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all min-h-[72px]",
                selectedRole === role.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-muted-foreground/30",
                isOwnerRole && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span
                    className={cn(
                      "inline-block px-2 py-1 text-xs font-medium rounded-md mb-2",
                      role.color
                    )}
                  >
                    {role.label}
                  </span>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
                {selectedRole === role.value && (
                  <CheckIcon className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
