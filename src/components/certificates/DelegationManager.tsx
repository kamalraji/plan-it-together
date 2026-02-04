import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCertificateDelegation, type DelegationPermissions } from '@/hooks/useCertificateDelegation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Edit2, Users, Palette, FileCheck, Zap, Send } from 'lucide-react';
import { toast } from 'sonner';

interface DelegationManagerProps {
  rootWorkspaceId: string;
  eventId: string;
}

export function DelegationManager({ rootWorkspaceId, eventId }: DelegationManagerProps) {
  const {
    delegations,
    isLoading,
    createDelegation,
    isCreating,
    updateDelegation,
    isUpdating,
    removeDelegation,
    isRemoving,
  } = useCertificateDelegation(rootWorkspaceId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDelegation, setEditingDelegation] = useState<string | null>(null);

  // Fetch child workspaces (L2 and L3) for delegation options
  const { data: childWorkspaces = [] } = useQuery({
    queryKey: ['child-workspaces', rootWorkspaceId, eventId],
    queryFn: async () => {
      // Get L2 (direct children) and L3 (grandchildren) workspaces
      const { data: l2, error: l2Error } = await supabase
        .from('workspaces')
        .select('id, name, slug, parent_workspace_id')
        .eq('event_id', eventId)
        .eq('parent_workspace_id', rootWorkspaceId);

      if (l2Error) throw l2Error;

      const l2Ids = (l2 ?? []).map(w => w.id);

      let l3: any[] = [];
      if (l2Ids.length > 0) {
        const { data: l3Data, error: l3Error } = await supabase
          .from('workspaces')
          .select('id, name, slug, parent_workspace_id')
          .eq('event_id', eventId)
          .in('parent_workspace_id', l2Ids);

        if (l3Error) throw l3Error;
        l3 = l3Data ?? [];
      }

      return [
        ...(l2 ?? []).map(w => ({ ...w, level: 'L2 - Department' })),
        ...l3.map(w => ({ ...w, level: 'L3 - Committee' })),
      ];
    },
    enabled: !!rootWorkspaceId && !!eventId,
  });

  // Filter out already delegated workspaces
  const availableWorkspaces = childWorkspaces.filter(
    w => !delegations.some(d => d.delegatedWorkspaceId === w.id)
  );

  const handleCreateDelegation = (workspaceId: string, permissions: DelegationPermissions, notes: string) => {
    createDelegation(
      { delegatedWorkspaceId: workspaceId, permissions, notes },
      {
        onSuccess: () => {
          toast.success('Delegation created successfully');
          setIsAddDialogOpen(false);
        },
        onError: (error) => toast.error(`Failed to create delegation: ${error.message}`),
      }
    );
  };

  const handleUpdateDelegation = (delegationId: string, permissions: DelegationPermissions, notes: string) => {
    updateDelegation(
      { delegationId, permissions, notes },
      {
        onSuccess: () => {
          toast.success('Delegation updated successfully');
          setEditingDelegation(null);
        },
        onError: (error) => toast.error(`Failed to update delegation: ${error.message}`),
      }
    );
  };

  const handleRemoveDelegation = (delegationId: string) => {
    if (!confirm('Are you sure you want to remove this delegation?')) return;

    removeDelegation(delegationId, {
      onSuccess: () => toast.success('Delegation removed'),
      onError: (error) => toast.error(`Failed to remove delegation: ${error.message}`),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Certificate Delegation</h3>
          <p className="text-sm text-muted-foreground">
            Delegate certificate permissions to departments and committees
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={availableWorkspaces.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Delegation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Delegation</DialogTitle>
              <DialogDescription>
                Select a workspace and grant certificate permissions
              </DialogDescription>
            </DialogHeader>
            <DelegationForm
              workspaces={availableWorkspaces}
              onSubmit={handleCreateDelegation}
              isSubmitting={isCreating}
            />
          </DialogContent>
        </Dialog>
      </div>

      {delegations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">No Delegations Yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              You haven't delegated certificate permissions to any workspace.
            </p>
            {availableWorkspaces.length > 0 && (
              <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Delegation
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {delegations.map((delegation) => (
            <Card key={delegation.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{delegation.delegatedWorkspaceName}</CardTitle>
                    <CardDescription>
                      Delegated on {new Date(delegation.delegatedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingDelegation(delegation.id)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDelegation(delegation.id)}
                      disabled={isRemoving}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {delegation.canDesignTemplates && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Palette className="h-3 w-3" />
                      Design Templates
                    </Badge>
                  )}
                  {delegation.canDefineCriteria && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <FileCheck className="h-3 w-3" />
                      Define Criteria
                    </Badge>
                  )}
                  {delegation.canGenerate && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Generate
                    </Badge>
                  )}
                  {delegation.canDistribute && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Send className="h-3 w-3" />
                      Distribute
                    </Badge>
                  )}
                </div>
                {delegation.notes && (
                  <p className="text-sm text-muted-foreground mt-3">{delegation.notes}</p>
                )}
              </CardContent>

              {/* Edit Dialog */}
              <Dialog
                open={editingDelegation === delegation.id}
                onOpenChange={(open) => !open && setEditingDelegation(null)}
              >
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Delegation</DialogTitle>
                    <DialogDescription>
                      Update permissions for {delegation.delegatedWorkspaceName}
                    </DialogDescription>
                  </DialogHeader>
                  <DelegationForm
                    initialPermissions={{
                      canDesignTemplates: delegation.canDesignTemplates,
                      canDefineCriteria: delegation.canDefineCriteria,
                      canGenerate: delegation.canGenerate,
                      canDistribute: delegation.canDistribute,
                    }}
                    initialNotes={delegation.notes}
                    onSubmit={(_, permissions, notes) =>
                      handleUpdateDelegation(delegation.id, permissions, notes)
                    }
                    isSubmitting={isUpdating}
                    isEdit
                  />
                </DialogContent>
              </Dialog>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Delegation Form Component
function DelegationForm({
  workspaces,
  initialPermissions,
  initialNotes,
  onSubmit,
  isSubmitting,
  isEdit = false,
}: {
  workspaces?: Array<{ id: string; name: string; level: string }>;
  initialPermissions?: DelegationPermissions;
  initialNotes?: string;
  onSubmit: (workspaceId: string, permissions: DelegationPermissions, notes: string) => void;
  isSubmitting: boolean;
  isEdit?: boolean;
}) {
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [permissions, setPermissions] = useState<DelegationPermissions>(
    initialPermissions ?? {
      canDesignTemplates: false,
      canDefineCriteria: false,
      canGenerate: false,
      canDistribute: false,
    }
  );
  const [notes, setNotes] = useState(initialNotes ?? '');

  const handleSubmit = () => {
    if (!isEdit && !selectedWorkspace) {
      toast.error('Please select a workspace');
      return;
    }

    const hasAtLeastOne = Object.values(permissions).some(Boolean);
    if (!hasAtLeastOne) {
      toast.error('Please grant at least one permission');
      return;
    }

    onSubmit(selectedWorkspace, permissions, notes);
  };

  return (
    <div className="space-y-4">
      {!isEdit && workspaces && (
        <div className="space-y-2">
          <Label>Select Workspace</Label>
          <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a workspace..." />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  <span className="flex items-center gap-2">
                    <span>{w.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {w.level}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-3">
        <Label>Permissions</Label>
        
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <Checkbox
              checked={permissions.canDesignTemplates}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, canDesignTemplates: !!checked })
              }
            />
            <div>
              <div className="flex items-center gap-2 font-medium">
                <Palette className="h-4 w-4 text-primary" />
                Design Templates
              </div>
              <p className="text-sm text-muted-foreground">
                Create and edit certificate templates, upload logos and signatures
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <Checkbox
              checked={permissions.canDefineCriteria}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, canDefineCriteria: !!checked })
              }
            />
            <div>
              <div className="flex items-center gap-2 font-medium">
                <FileCheck className="h-4 w-4 text-primary" />
                Define Criteria
              </div>
              <p className="text-sm text-muted-foreground">
                Set conditions for who receives each certificate type
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <Checkbox
              checked={permissions.canGenerate}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, canGenerate: !!checked })
              }
            />
            <div>
              <div className="flex items-center gap-2 font-medium">
                <Zap className="h-4 w-4 text-primary" />
                Generate Certificates
              </div>
              <p className="text-sm text-muted-foreground">
                Run batch certificate generation based on criteria
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <Checkbox
              checked={permissions.canDistribute}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, canDistribute: !!checked })
              }
            />
            <div>
              <div className="flex items-center gap-2 font-medium">
                <Send className="h-4 w-4 text-primary" />
                Distribute Certificates
              </div>
              <p className="text-sm text-muted-foreground">
                Send certificates to recipients and mark as distributed
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this delegation..."
          rows={2}
        />
      </div>

      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isEdit ? 'Update Delegation' : 'Create Delegation'}
      </Button>
    </div>
  );
}
