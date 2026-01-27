import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAssignPageResponsibility, usePageBuildingResponsibilities } from '@/hooks/usePageBuildingResponsibilities';
import { Paintbrush, Building2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AssignPageBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  rootWorkspaceId: string;
}

const RESPONSIBILITY_TYPES = [
  { value: 'LANDING_PAGE', label: 'Landing Page', description: 'Main event landing page' },
  { value: 'REGISTRATION_PAGE', label: 'Registration Page', description: 'Event registration form page' },
  { value: 'SCHEDULE_PAGE', label: 'Schedule Page', description: 'Event schedule/agenda page' },
  { value: 'SPEAKERS_PAGE', label: 'Speakers Page', description: 'Speaker showcase page' },
];

export function AssignPageBuilderDialog({
  open,
  onOpenChange,
  eventId,
  rootWorkspaceId,
}: AssignPageBuilderDialogProps) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [responsibilityType, setResponsibilityType] = useState<string>('LANDING_PAGE');
  const [notes, setNotes] = useState('');

  const { mutate: assignResponsibility, isPending } = useAssignPageResponsibility();
  const { data: existingResponsibilities } = usePageBuildingResponsibilities(eventId);

  // Fetch child workspaces (departments and committees)
  const { data: childWorkspaces, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ['child-workspaces-for-page-builder', rootWorkspaceId],
    queryFn: async () => {
      // Get all workspaces in the hierarchy under root
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, workspace_type, parent_workspace_id')
        .eq('event_id', eventId)
        .neq('id', rootWorkspaceId)
        .in('workspace_type', ['DEPARTMENT', 'COMMITTEE'])
        .order('name');

      if (error) throw error;

      // Filter to content/marketing related workspaces
      return (data || []).filter(ws => {
        const name = ws.name.toLowerCase();
        return (
          name.includes('content') ||
          name.includes('marketing') ||
          name.includes('social') ||
          name.includes('media') ||
          name.includes('communication') ||
          name.includes('design') ||
          name.includes('creative')
        );
      });
    },
    enabled: open && !!eventId,
  });

  // Check if selected responsibility type is already assigned
  const existingAssignment = existingResponsibilities?.find(
    r => r.responsibilityType === responsibilityType
  );

  const handleSubmit = () => {
    if (!selectedWorkspaceId) return;

    assignResponsibility(
      {
        eventId,
        workspaceId: selectedWorkspaceId,
        responsibilityType,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedWorkspaceId('');
          setNotes('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-primary" />
            Assign Page Builder Responsibility
          </DialogTitle>
          <DialogDescription>
            Assign a workspace to manage and edit event pages. Only content, marketing, and related committees are shown.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Responsibility Type */}
          <div className="space-y-2">
            <Label>Page Type</Label>
            <Select value={responsibilityType} onValueChange={setResponsibilityType}>
              <SelectTrigger>
                <SelectValue placeholder="Select page type" />
              </SelectTrigger>
              <SelectContent>
                {RESPONSIBILITY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Existing Assignment Warning */}
          {existingAssignment && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-600">Already Assigned</p>
                <p className="text-muted-foreground">
                  This page type is currently assigned to <strong>{existingAssignment.workspaceName}</strong>.
                  Assigning to a new workspace will revoke the existing assignment.
                </p>
              </div>
            </div>
          )}

          {/* Target Workspace */}
          <div className="space-y-2">
            <Label>Assign to Workspace</Label>
            {isLoadingWorkspaces ? (
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            ) : childWorkspaces && childWorkspaces.length > 0 ? (
              <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a workspace" />
                </SelectTrigger>
                <SelectContent>
                  {childWorkspaces.map(ws => (
                    <SelectItem key={ws.id} value={ws.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{ws.name}</span>
                        <Badge variant="outline" className="text-[10px] ml-1">
                          {ws.workspace_type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                No eligible workspaces found. Create a Content, Marketing, or similar committee first.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any instructions or context for the assigned workspace..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedWorkspaceId || isPending}
          >
            {isPending ? 'Assigning...' : 'Assign Responsibility'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
