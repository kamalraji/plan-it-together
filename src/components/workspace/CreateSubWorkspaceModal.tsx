import { useState, useEffect } from 'react';
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
import {
  WORKSPACE_DEPARTMENTS,
  DEPARTMENT_COMMITTEES,
  MAX_WORKSPACE_DEPTH,
  calculateWorkspaceDepth,
} from '@/lib/workspaceHierarchy';
import { AlertTriangle, Layers, Building2, Users } from 'lucide-react';

interface CreateSubWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentWorkspaceId: string;
  eventId: string;
}

type SubWorkspaceType = 'department' | 'committee' | 'custom';

export function CreateSubWorkspaceModal({
  open,
  onOpenChange,
  parentWorkspaceId,
  eventId,
}: CreateSubWorkspaceModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [subWorkspaceType, setSubWorkspaceType] = useState<SubWorkspaceType>('department');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedCommittee, setSelectedCommittee] = useState<string>('');
  const [customName, setCustomName] = useState('');

  // Fetch all workspaces for the event to build parent chain map
  const { data: allWorkspaces } = useQuery({
    queryKey: ['event-workspaces', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, parent_workspace_id, name')
        .eq('event_id', eventId);

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!eventId,
  });

  // Build parent map and calculate current depth
  const workspaceParentMap = new Map<string, string | null>();
  allWorkspaces?.forEach((ws) => {
    workspaceParentMap.set(ws.id, ws.parent_workspace_id);
  });

  const currentDepth = calculateWorkspaceDepth(parentWorkspaceId, workspaceParentMap) - 1;
  const canCreateSub = currentDepth < MAX_WORKSPACE_DEPTH;
  const remainingLevels = MAX_WORKSPACE_DEPTH - currentDepth;

  // Get current workspace name for context
  const currentWorkspaceName = allWorkspaces?.find((ws) => ws.id === parentWorkspaceId)?.name || 'Current';

  // Get available committees based on selected department
  const availableCommittees = selectedDepartment
    ? DEPARTMENT_COMMITTEES[selectedDepartment] || []
    : [];

  // Reset committee when department changes
  useEffect(() => {
    setSelectedCommittee('');
  }, [selectedDepartment]);

  // Determine final name
  const getFinalName = (): string => {
    if (subWorkspaceType === 'department' && selectedDepartment) {
      const dept = WORKSPACE_DEPARTMENTS.find((d) => d.id === selectedDepartment);
      return dept?.name || '';
    }
    if (subWorkspaceType === 'committee' && selectedCommittee) {
      const committee = availableCommittees.find((c) => c.id === selectedCommittee);
      return committee?.name || '';
    }
    return customName;
  };

  const createSubWorkspaceMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be authenticated');
      if (!canCreateSub) throw new Error('Maximum nesting depth reached');

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
        })
        .select('id, name')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Sub-workspace created',
        description: `"${data.name}" has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['event-workspaces', eventId] });
      queryClient.invalidateQueries({ queryKey: ['user-workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', parentWorkspaceId] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create sub-workspace',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setSubWorkspaceType('department');
    setSelectedDepartment('');
    setSelectedCommittee('');
    setCustomName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSubWorkspaceMutation.mutate();
  };

  const isValid =
    (subWorkspaceType === 'department' && selectedDepartment) ||
    (subWorkspaceType === 'committee' && selectedCommittee) ||
    (subWorkspaceType === 'custom' && customName.trim());

  const getLevelLabel = (level: number): string => {
    switch (level) {
      case 1:
        return 'Root Workspace';
      case 2:
        return 'Department';
      case 3:
        return 'Committee';
      case 4:
        return 'Team';
      default:
        return 'Sub-workspace';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Create Sub-Workspace
          </DialogTitle>
          <DialogDescription>
            Create a nested workspace under "{currentWorkspaceName}".
            This will be at level {currentDepth + 1} ({getLevelLabel(currentDepth + 1)}).
          </DialogDescription>
        </DialogHeader>

        {!canCreateSub ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Maximum Depth Reached</p>
              <p className="text-sm text-muted-foreground mt-1">
                The 4-level hierarchy limit has been reached. You cannot create
                sub-workspaces beyond level {MAX_WORKSPACE_DEPTH}.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Depth indicator */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex -space-x-1">
                {Array.from({ length: currentDepth + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border-2 border-background ${
                      i === currentDepth ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {remainingLevels - 1} more level{remainingLevels - 1 !== 1 ? 's' : ''} available below this
              </span>
            </div>

            {/* Sub-workspace type selection */}
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSubWorkspaceType('department')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                    subWorkspaceType === 'department'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                  <span className="text-xs font-medium">Department</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubWorkspaceType('committee')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                    subWorkspaceType === 'committee'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="text-xs font-medium">Committee</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubWorkspaceType('custom')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                    subWorkspaceType === 'custom'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <Layers className="h-5 w-5" />
                  <span className="text-xs font-medium">Custom</span>
                </button>
              </div>
            </div>

            {/* Department selection */}
            {subWorkspaceType === 'department' && (
              <div className="space-y-2">
                <Label htmlFor="department">Select Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a department..." />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKSPACE_DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        <div className="flex flex-col">
                          <span>{dept.name}</span>
                          <span className="text-xs text-muted-foreground">{dept.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Committee selection */}
            {subWorkspaceType === 'committee' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dept-for-committee">Parent Department</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose department first..." />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKSPACE_DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedDepartment && (
                  <div className="space-y-2">
                    <Label htmlFor="committee">Select Committee</Label>
                    <Select value={selectedCommittee} onValueChange={setSelectedCommittee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a committee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCommittees.map((committee) => (
                          <SelectItem key={committee.id} value={committee.id}>
                            {committee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {/* Custom name */}
            {subWorkspaceType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom-name">Workspace Name</Label>
                <Input
                  id="custom-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter workspace name..."
                  maxLength={100}
                />
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
                {createSubWorkspaceMutation.isPending ? 'Creating...' : 'Create Sub-Workspace'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
