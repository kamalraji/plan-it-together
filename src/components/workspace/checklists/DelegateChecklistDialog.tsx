import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Send, Building2, Users } from 'lucide-react';
import type { Checklist } from '@/hooks/useCommitteeDashboard';

interface DelegateChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklist: Checklist | null;
  sourceWorkspaceId: string;
  onDelegate: (data: {
    checklistId: string;
    targetWorkspaceId: string;
    dueDate: Date | null;
  }) => void;
}

interface ChildWorkspace {
  id: string;
  name: string;
  workspace_type: string;
  slug: string;
}

export function DelegateChecklistDialog({
  open,
  onOpenChange,
  checklist,
  sourceWorkspaceId,
  onDelegate,
}: DelegateChecklistDialogProps) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date | undefined>();

  // Fetch child workspaces (DEPARTMENT and COMMITTEE types)
  const { data: childWorkspaces = [], isLoading } = useQuery({
    queryKey: ['child-workspaces-for-delegation', sourceWorkspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, workspace_type, slug')
        .eq('parent_workspace_id', sourceWorkspaceId)
        .in('workspace_type', ['DEPARTMENT', 'COMMITTEE'])
        .order('name');
      if (error) throw error;
      return data as ChildWorkspace[];
    },
    enabled: open && !!sourceWorkspaceId,
  });

  const groupedWorkspaces = useMemo(() => {
    const departments = childWorkspaces.filter(w => w.workspace_type === 'DEPARTMENT');
    const committees = childWorkspaces.filter(w => w.workspace_type === 'COMMITTEE');
    return { departments, committees };
  }, [childWorkspaces]);

  const handleSubmit = () => {
    if (!checklist || !selectedWorkspaceId) return;
    onDelegate({
      checklistId: checklist.id,
      targetWorkspaceId: selectedWorkspaceId,
      dueDate: dueDate || null,
    });
    handleClose();
  };

  const handleClose = () => {
    setSelectedWorkspaceId('');
    setDueDate(undefined);
    onOpenChange(false);
  };

  const selectedWorkspace = childWorkspaces.find(w => w.id === selectedWorkspaceId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Delegate Checklist
          </DialogTitle>
          <DialogDescription>
            Assign this checklist to a department or committee workspace with an optional due date.
          </DialogDescription>
        </DialogHeader>

        {checklist && (
          <div className="space-y-4 py-4">
            {/* Checklist being delegated */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-sm font-medium">{checklist.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {checklist.items?.length || 0} items • {checklist.phase?.replace('_', '-')}
              </p>
            </div>

            {/* Target Workspace Selection */}
            <div className="space-y-2">
              <Label>Assign to Workspace</Label>
              {isLoading ? (
                <div className="h-10 bg-muted animate-pulse rounded-md" />
              ) : childWorkspaces.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No child workspaces available. Create departments or committees first.
                </p>
              ) : (
                <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workspace..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groupedWorkspaces.departments.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          <Building2 className="h-3 w-3" />
                          Departments
                        </div>
                        {groupedWorkspaces.departments.map(ws => (
                          <SelectItem key={ws.id} value={ws.id}>
                            {ws.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {groupedWorkspaces.committees.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Users className="h-3 w-3" />
                          Committees
                        </div>
                        {groupedWorkspaces.committees.map(ws => (
                          <SelectItem key={ws.id} value={ws.id}>
                            {ws.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
              {selectedWorkspace && (
                <Badge variant="secondary" className="text-xs">
                  {selectedWorkspace.workspace_type}
                </Badge>
              )}
            </div>

            {/* Due Date Selection */}
            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a due date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedWorkspaceId || !checklist}
          >
            <Send className="h-4 w-4 mr-2" />
            Delegate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
