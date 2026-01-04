import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { WorkspaceType } from '@/types';
import {
  MAX_WORKSPACE_DEPTH,
  getWorkspaceTypeLabel,
  getCreationOptions,
  canHaveChildren,
} from '@/lib/workspaceHierarchy';
import { AlertTriangle, Building2, Users, Layers } from 'lucide-react';

interface CreateSubWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentWorkspaceId: string;
  eventId: string;
}

export function CreateSubWorkspaceModal({
  open,
  onOpenChange,
  parentWorkspaceId,
  eventId,
}: CreateSubWorkspaceModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customName, setCustomName] = useState('');

  // Fetch parent workspace to get its type and department_id
  const { data: parentWorkspace } = useQuery({
    queryKey: ['workspace-parent', parentWorkspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, workspace_type, department_id, parent_workspace_id')
        .eq('id', parentWorkspaceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!parentWorkspaceId,
  });

  // Get parent workspace type with fallback for legacy data
  const parentType = useMemo(() => {
    if (!parentWorkspace) return undefined;
    if (parentWorkspace.workspace_type) {
      return parentWorkspace.workspace_type as WorkspaceType;
    }
    // Fallback: if no parent_workspace_id, it's ROOT
    return parentWorkspace.parent_workspace_id ? undefined : WorkspaceType.ROOT;
  }, [parentWorkspace]);

  // Get creation options based on parent type
  const creationInfo = useMemo(() => {
    return getCreationOptions(parentType, parentWorkspace?.department_id || undefined);
  }, [parentType, parentWorkspace?.department_id]);

  const nextType = creationInfo.nextType;
  const options = creationInfo.options;
  const allowCustomName = creationInfo.allowCustomName;

  // Check if creation is allowed
  const canCreate = nextType !== null && canHaveChildren(parentType);

  // Determine final name based on selection
  const getFinalName = (): string => {
    if (allowCustomName) {
      return customName;
    }
    if (options && selectedOption) {
      const option = options.find(o => o.id === selectedOption);
      return option?.name || '';
    }
    return '';
  };

  // Get department_id for the new workspace
  const getDepartmentId = (): string | null => {
    // If creating a DEPARTMENT, the department_id is the selected option
    if (nextType === WorkspaceType.DEPARTMENT) {
      return selectedOption || null;
    }
    // If creating COMMITTEE or TEAM, inherit from parent
    return parentWorkspace?.department_id || null;
  };

  const createSubWorkspaceMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be authenticated');
      if (!canCreate) throw new Error('Cannot create sub-workspace at this level');

      const name = getFinalName();
      if (!name.trim()) throw new Error('Name is required');

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: name.trim(),
          event_id: eventId,
          parent_workspace_id: parentWorkspaceId,
          organizer_id: user.id,
          status: 'ACTIVE',
          workspace_type: nextType,
          department_id: getDepartmentId(),
        })
        .select('id, name')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: `${getWorkspaceTypeLabel(nextType || undefined)} created`,
        description: `"${data.name}" has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['event-workspaces', eventId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-hierarchy', eventId] });
      queryClient.invalidateQueries({ queryKey: ['user-workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', parentWorkspaceId] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setSelectedOption('');
    setCustomName('');
  };

  // Reset form when modal opens/closes or parent changes
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, parentWorkspaceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSubWorkspaceMutation.mutate();
  };

  const isValid = allowCustomName ? customName.trim().length > 0 : selectedOption.length > 0;

  // Get the icon for the workspace type
  const getTypeIcon = () => {
    switch (nextType) {
      case WorkspaceType.DEPARTMENT:
        return <Building2 className="h-5 w-5 text-blue-500" />;
      case WorkspaceType.COMMITTEE:
        return <Users className="h-5 w-5 text-amber-500" />;
      case WorkspaceType.TEAM:
        return <Layers className="h-5 w-5 text-emerald-500" />;
      default:
        return <Layers className="h-5 w-5 text-primary" />;
    }
  };

  // Get description based on next type
  const getTypeDescription = (): string => {
    switch (nextType) {
      case WorkspaceType.DEPARTMENT:
        return 'Departments organize your workspace into functional areas like Operations, Growth, and Content.';
      case WorkspaceType.COMMITTEE:
        return `Committees are specialized teams within the ${parentWorkspace?.name || 'department'} that handle specific functions.`;
      case WorkspaceType.TEAM:
        return `Teams are small groups that execute specific tasks within the ${parentWorkspace?.name || 'committee'}.`;
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon()}
            {nextType ? `Create ${getWorkspaceTypeLabel(nextType)}` : 'Create Sub-Workspace'}
          </DialogTitle>
          <DialogDescription>
            {canCreate ? getTypeDescription() : 'This workspace cannot have sub-workspaces.'}
          </DialogDescription>
        </DialogHeader>

        {!canCreate ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Maximum Depth Reached</p>
              <p className="text-sm text-muted-foreground mt-1">
                Teams are the final level in the hierarchy. You cannot create
                sub-workspaces below level {MAX_WORKSPACE_DEPTH}.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hierarchy indicator */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-1">
                {/* Level indicators */}
                <div className={`w-3 h-3 rounded-full ${parentType === WorkspaceType.ROOT || !parentType ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                <div className={`w-3 h-3 rounded-full ${parentType === WorkspaceType.DEPARTMENT ? 'bg-blue-500' : nextType === WorkspaceType.DEPARTMENT ? 'ring-2 ring-blue-500 ring-offset-2' : 'bg-muted-foreground/30'}`} />
                <div className={`w-3 h-3 rounded-full ${parentType === WorkspaceType.COMMITTEE ? 'bg-amber-500' : nextType === WorkspaceType.COMMITTEE ? 'ring-2 ring-amber-500 ring-offset-2' : 'bg-muted-foreground/30'}`} />
                <div className={`w-3 h-3 rounded-full ${nextType === WorkspaceType.TEAM ? 'ring-2 ring-emerald-500 ring-offset-2' : 'bg-muted-foreground/30'}`} />
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                Creating under "{parentWorkspace?.name || 'Workspace'}"
              </span>
            </div>

            {/* Selection or Input based on type */}
            {allowCustomName ? (
              // Free-form team name input
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter team name..."
                  maxLength={100}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Choose a descriptive name for your team (e.g., "Stage Setup", "Vendor Management")
                </p>
              </div>
            ) : options && options.length > 0 ? (
              // Predefined options dropdown
              <div className="space-y-2">
                <Label htmlFor="option-select">
                  Select {getWorkspaceTypeLabel(nextType || undefined)}
                </Label>
                <Select value={selectedOption} onValueChange={setSelectedOption}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Choose a ${getWorkspaceTypeLabel(nextType || undefined).toLowerCase()}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex flex-col">
                          <span>{option.name}</span>
                          {option.description && (
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No options available for this level.
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createSubWorkspaceMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || createSubWorkspaceMutation.isPending}
              >
                {createSubWorkspaceMutation.isPending 
                  ? 'Creating...' 
                  : `Create ${getWorkspaceTypeLabel(nextType || undefined)}`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
