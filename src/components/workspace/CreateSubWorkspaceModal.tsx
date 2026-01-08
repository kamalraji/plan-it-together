import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { WorkspaceType } from '@/types';
import {
  getResponsibleRoleForWorkspace,
  WORKSPACE_DEPARTMENTS,
  DEPARTMENT_COMMITTEES,
} from '@/lib/workspaceHierarchy';
import { 
  Building2, 
  Users, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateSubWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentWorkspaceId: string;
  eventId: string;
}

interface SelectedItem {
  id: string;
  name: string;
  type: 'department' | 'committee';
  departmentId?: string;
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

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Fetch parent workspace (used for context)
  useQuery({
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

  // Fetch existing sub-workspaces to prevent duplicates
  const { data: existingWorkspaces } = useQuery({
    queryKey: ['existing-sub-workspaces', eventId, parentWorkspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, workspace_type, department_id')
        .eq('event_id', eventId)
        .eq('parent_workspace_id', parentWorkspaceId);

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!parentWorkspaceId && !!eventId,
  });

  // Build sets of already-created items for quick lookup
  const existingDepartmentIds = new Set(
    existingWorkspaces
      ?.filter(w => w.workspace_type === WorkspaceType.DEPARTMENT && w.department_id)
      .map(w => w.department_id) || []
  );

  const existingCommitteeNames = new Set(
    existingWorkspaces
      ?.filter(w => w.workspace_type === WorkspaceType.COMMITTEE)
      .map(w => w.name.toLowerCase()) || []
  );

  const toggleDeptExpanded = (deptId: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      if (next.has(deptId)) {
        next.delete(deptId);
      } else {
        next.add(deptId);
      }
      return next;
    });
  };

  const toggleSelection = (item: SelectedItem) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id && i.type === item.type);
      if (exists) {
        return prev.filter(i => !(i.id === item.id && i.type === item.type));
      }
      return [...prev, item];
    });
  };

  const isSelected = (id: string, type: 'department' | 'committee') => {
    return selectedItems.some(i => i.id === id && i.type === type);
  };

  // Check if item already exists
  const isDeptCreated = (deptId: string) => existingDepartmentIds.has(deptId);
  const isCommCreated = (commName: string) => existingCommitteeNames.has(commName.toLowerCase());

  const selectAllCommitteesInDept = (deptId: string) => {
    const committees = DEPARTMENT_COMMITTEES[deptId] || [];
    // Only consider non-created committees
    const availableComms = committees.filter(c => !isCommCreated(c.name));
    const allSelected = availableComms.every(c => isSelected(c.id, 'committee'));
    
    if (allSelected) {
      // Deselect all
      setSelectedItems(prev => prev.filter(i => !(i.type === 'committee' && i.departmentId === deptId)));
    } else {
      // Select all missing (that aren't already created)
      const newItems = availableComms
        .filter(c => !isSelected(c.id, 'committee'))
        .map(c => ({ id: c.id, name: c.name, type: 'committee' as const, departmentId: deptId }));
      setSelectedItems(prev => [...prev, ...newItems]);
    }
  };

  const createSubWorkspacesMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be authenticated');
      if (selectedItems.length === 0) throw new Error('Select at least one item');

      const createdWorkspaces: { id: string; name: string }[] = [];

      // Split selected items into departments and committees
      const selectedDeptItems = selectedItems.filter(i => i.type === 'department');
      const selectedCommItems = selectedItems.filter(i => i.type === 'committee');

      // Build a map of department IDs to their workspace IDs
      const departmentWorkspaceMap = new Map<string, string>();

      // First, fetch existing department workspaces for this event
      const { data: existingDepts } = await supabase
        .from('workspaces')
        .select('id, department_id')
        .eq('event_id', eventId)
        .eq('workspace_type', 'DEPARTMENT');

      existingDepts?.forEach(dept => {
        if (dept.department_id) {
          departmentWorkspaceMap.set(dept.department_id, dept.id);
        }
      });

      // Step 1: Create departments first (they are children of root)
      for (const item of selectedDeptItems) {
        const { data: workspace, error: wsError } = await supabase
          .from('workspaces')
          .insert({
            name: item.name,
            event_id: eventId,
            parent_workspace_id: parentWorkspaceId, // Root as parent
            organizer_id: user.id,
            status: 'ACTIVE',
            workspace_type: WorkspaceType.DEPARTMENT,
            department_id: item.id,
          })
          .select('id, name')
          .single();

        if (wsError) throw wsError;

        // Track the new department workspace ID
        departmentWorkspaceMap.set(item.id, workspace.id);

        const responsibleRole = getResponsibleRoleForWorkspace(
          WorkspaceType.DEPARTMENT,
          item.id,
          undefined
        );

        if (responsibleRole) {
          await supabase
            .from('workspace_team_members')
            .insert({
              workspace_id: workspace.id,
              user_id: user.id,
              role: responsibleRole,
              status: 'active',
            });
        }

        createdWorkspaces.push(workspace);
      }

      // Step 2: Create committees (they are children of their department workspace)
      for (const item of selectedCommItems) {
        const departmentId = item.departmentId;
        if (!departmentId) {
          throw new Error(`Committee "${item.name}" is missing a department reference`);
        }

        // Get the department workspace ID (either existing or just created)
        const departmentWorkspaceId = departmentWorkspaceMap.get(departmentId);
        if (!departmentWorkspaceId) {
          throw new Error(`Department workspace for "${item.name}" not found. Please create the department first.`);
        }

        const { data: workspace, error: wsError } = await supabase
          .from('workspaces')
          .insert({
            name: item.name,
            event_id: eventId,
            parent_workspace_id: departmentWorkspaceId, // Department as parent (NOT root!)
            organizer_id: user.id,
            status: 'ACTIVE',
            workspace_type: WorkspaceType.COMMITTEE,
            department_id: departmentId,
          })
          .select('id, name')
          .single();

        if (wsError) throw wsError;

        const responsibleRole = getResponsibleRoleForWorkspace(
          WorkspaceType.COMMITTEE,
          departmentId,
          item.id
        );

        if (responsibleRole) {
          await supabase
            .from('workspace_team_members')
            .insert({
              workspace_id: workspace.id,
              user_id: user.id,
              role: responsibleRole,
              status: 'active',
            });
        }

        createdWorkspaces.push(workspace);
      }

      return createdWorkspaces;
    },
    onSuccess: (data) => {
      const count = data.length;
      toast({
        title: `${count} workspace${count > 1 ? 's' : ''} created`,
        description: count === 1 
          ? `"${data[0].name}" has been created.`
          : `Created: ${data.map(w => w.name).join(', ')}`,
      });
      queryClient.invalidateQueries({ queryKey: ['event-workspaces', eventId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-hierarchy', eventId] });
      queryClient.invalidateQueries({ queryKey: ['user-workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', parentWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-team-members'] });
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
    setSelectedItems([]);
    setExpandedDepts(new Set());
    setShowConfirmation(false);
  };

  useEffect(() => {
    if (open) resetForm();
  }, [open, parentWorkspaceId]);

  // Validation: Check if any committees are missing their parent department
  const getOrphanedCommittees = () => {
    const selectedDeptIds = new Set(selectedItems.filter(i => i.type === 'department').map(i => i.id));
    return selectedItems.filter(item => {
      if (item.type !== 'committee' || !item.departmentId) return false;
      // Check if department exists in DB or is selected for creation
      const deptExistsInDb = existingDepartmentIds.has(item.departmentId);
      const deptIsSelected = selectedDeptIds.has(item.departmentId);
      return !deptExistsInDb && !deptIsSelected;
    });
  };

  const orphanedCommittees = getOrphanedCommittees();
  const hasValidationError = orphanedCommittees.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasValidationError) return;
    createSubWorkspacesMutation.mutate();
  };

  const handleProceedToConfirmation = () => {
    if (hasValidationError) return;
    setShowConfirmation(true);
  };

  const isValid = selectedItems.length > 0;

  const selectedDepts = selectedItems.filter(i => i.type === 'department');
  const selectedComms = selectedItems.filter(i => i.type === 'committee');

  // Build hierarchy preview data
  const buildHierarchyPreview = () => {
    const hierarchy: { deptId: string; deptName: string; isNew: boolean; committees: { name: string; isNew: boolean }[] }[] = [];
    
    // Get unique department IDs from selected items
    const relevantDeptIds = new Set<string>();
    selectedDepts.forEach(d => relevantDeptIds.add(d.id));
    selectedComms.forEach(c => c.departmentId && relevantDeptIds.add(c.departmentId));
    
    relevantDeptIds.forEach(deptId => {
      const dept = WORKSPACE_DEPARTMENTS.find(d => d.id === deptId);
      if (!dept) return;
      
      const isDeptSelected = selectedDepts.some(d => d.id === deptId);
      
      const committees = selectedComms
        .filter(c => c.departmentId === deptId)
        .map(c => ({
          name: c.name,
          isNew: true,
        }));
      
      hierarchy.push({
        deptId,
        deptName: dept.name,
        isNew: isDeptSelected,
        committees,
      });
    });
    
    return hierarchy;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-border/50 bg-card gap-0">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 bg-gradient-to-b from-primary/10 to-transparent">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Create Sub-Workspaces
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground">
                  Select departments & committees • Multi-select enabled
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-0">
          {!showConfirmation ? (
            <>
              {/* Tree View */}
              <div className="px-3 py-3">
                <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                  {WORKSPACE_DEPARTMENTS.map((dept) => {
                    const committees = DEPARTMENT_COMMITTEES[dept.id] || [];
                    const isExpanded = expandedDepts.has(dept.id);
                    const isDeptSelected = isSelected(dept.id, 'department');
                    const deptAlreadyCreated = isDeptCreated(dept.id);
                    const selectedCommCount = committees.filter(c => isSelected(c.id, 'committee')).length;
                    const createdCommCount = committees.filter(c => isCommCreated(c.name)).length;

                    return (
                      <div key={dept.id} className="space-y-0.5">
                        {/* Department Row */}
                        <div className="flex items-center gap-1">
                          {/* Expand/Collapse */}
                          <button
                            type="button"
                            onClick={() => toggleDeptExpanded(dept.id)}
                            className="p-1 rounded hover:bg-accent/50 text-muted-foreground"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* Checkbox + Label */}
                          <button
                            type="button"
                            onClick={() => !deptAlreadyCreated && toggleSelection({ id: dept.id, name: dept.name, type: 'department' })}
                            disabled={deptAlreadyCreated}
                            className={cn(
                              "flex-1 flex items-center gap-2 p-2 rounded-md text-left transition-all",
                              deptAlreadyCreated 
                                ? "opacity-50 cursor-not-allowed" 
                                : "hover:bg-accent/30",
                              isDeptSelected && !deptAlreadyCreated && "bg-blue-500/10"
                            )}
                          >
                            {deptAlreadyCreated ? (
                              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            ) : (
                              <div className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors",
                                "border-[1.5px]",
                                isDeptSelected 
                                  ? "border-blue-500 bg-blue-500" 
                                  : "border-muted-foreground/40"
                              )}>
                                {isDeptSelected && <Check className="h-2.5 w-2.5 text-white" />}
                              </div>
                            )}
                            <Building2 className={cn("h-3.5 w-3.5", deptAlreadyCreated ? "text-green-500" : "text-blue-500")} />
                            <span className={cn("text-xs font-medium flex-1", deptAlreadyCreated ? "text-muted-foreground" : "text-foreground")}>
                              {dept.name}
                            </span>
                            {deptAlreadyCreated ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-600">
                                Created
                              </span>
                            ) : selectedCommCount > 0 ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600">
                                {selectedCommCount} comm
                              </span>
                            ) : createdCommCount > 0 ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600">
                                {createdCommCount}/{committees.length}
                              </span>
                            ) : null}
                          </button>
                        </div>

                        {/* Committees (Nested) */}
                        {isExpanded && committees.length > 0 && (
                          <div className="ml-6 pl-2 border-l border-border/50 space-y-0.5">
                            {/* Select All - only show if there are available committees */}
                            {committees.some(c => !isCommCreated(c.name)) && (
                              <button
                                type="button"
                                onClick={() => selectAllCommitteesInDept(dept.id)}
                                className="w-full text-left px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded transition-colors"
                              >
                                {committees.filter(c => !isCommCreated(c.name)).every(c => isSelected(c.id, 'committee')) 
                                  ? 'Deselect all' 
                                  : 'Select available'}
                              </button>
                            )}

                            {committees.map((comm) => {
                              const isCommSelected = isSelected(comm.id, 'committee');
                              const commAlreadyCreated = isCommCreated(comm.name);
                              
                              return (
                                <button
                                  key={comm.id}
                                  type="button"
                                  onClick={() => !commAlreadyCreated && toggleSelection({ 
                                    id: comm.id, 
                                    name: comm.name, 
                                    type: 'committee',
                                    departmentId: dept.id 
                                  })}
                                  disabled={commAlreadyCreated}
                                  className={cn(
                                    "w-full flex items-center gap-2 p-2 rounded-md text-left transition-all",
                                    commAlreadyCreated 
                                      ? "opacity-50 cursor-not-allowed"
                                      : "hover:bg-accent/30",
                                    isCommSelected && !commAlreadyCreated && "bg-amber-500/10"
                                  )}
                                >
                                  {commAlreadyCreated ? (
                                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                  ) : (
                                    <div className={cn(
                                      "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded transition-colors",
                                      "border-[1.5px]",
                                      isCommSelected 
                                        ? "border-amber-500 bg-amber-500" 
                                        : "border-muted-foreground/40"
                                    )}>
                                      {isCommSelected && <Check className="h-2 w-2 text-white" />}
                                    </div>
                                  )}
                                  <Users className={cn("h-3 w-3", commAlreadyCreated ? "text-green-500" : "text-amber-500")} />
                                  <span className={cn("text-[11px] flex-1", commAlreadyCreated ? "text-muted-foreground" : "text-foreground")}>
                                    {comm.name}
                                  </span>
                                  {commAlreadyCreated && (
                                    <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/20 text-green-600">
                                      Created
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Validation Warning */}
              {hasValidationError && (
                <div className="mx-3 mb-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-destructive">Missing Parent Department</p>
                      <p className="text-[11px] text-muted-foreground">
                        The following committees need their department created first:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {orphanedCommittees.map(c => {
                          const dept = WORKSPACE_DEPARTMENTS.find(d => d.id === c.departmentId);
                          return (
                            <span key={c.id} className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">
                              {c.name} → {dept?.name || 'Unknown'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selection Summary */}
              {selectedItems.length > 0 && !hasValidationError && (
                <div className="px-4 pb-2">
                  <div className="flex flex-wrap gap-1">
                    {selectedItems.slice(0, 8).map((item) => (
                      <span
                        key={`${item.type}-${item.id}`}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                          item.type === 'department'
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-amber-500/10 text-amber-600"
                        )}
                      >
                        {item.type === 'department' ? <Building2 className="h-2.5 w-2.5" /> : <Users className="h-2.5 w-2.5" />}
                        {item.name}
                      </span>
                    ))}
                    {selectedItems.length > 8 && (
                      <span className="text-[10px] text-muted-foreground px-2 py-0.5">
                        +{selectedItems.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 px-4 pb-4 pt-2 border-t border-border/30">
                <div className="flex-1 text-[10px] text-muted-foreground">
                  {selectedDepts.length > 0 && <span className="text-blue-500">{selectedDepts.length} dept</span>}
                  {selectedDepts.length > 0 && selectedComms.length > 0 && <span> • </span>}
                  {selectedComms.length > 0 && <span className="text-amber-500">{selectedComms.length} comm</span>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-8 text-xs px-3"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!isValid || hasValidationError}
                  onClick={handleProceedToConfirmation}
                  className="h-8 text-xs gap-1 px-4"
                >
                  Review
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Confirmation Step - Hierarchy Preview */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">Hierarchy Preview</span>
                </div>
                
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {/* Root indicator */}
                  <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20">
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-primary/10">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground">Root Workspace</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary ml-auto">L1</span>
                  </div>

                  {/* Departments and Committees */}
                  {buildHierarchyPreview().map((dept) => (
                    <div key={dept.deptId} className="ml-4 space-y-1">
                      {/* Department */}
                      <div className={cn(
                        "flex items-center gap-2 p-2 rounded-md border-l-2",
                        dept.isNew 
                          ? "bg-blue-500/5 border-blue-500" 
                          : "bg-green-500/5 border-green-500"
                      )}>
                        <Building2 className={cn("h-3.5 w-3.5", dept.isNew ? "text-blue-500" : "text-green-500")} />
                        <span className="text-xs font-medium text-foreground flex-1">{dept.deptName}</span>
                        {dept.isNew ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600">New • L2</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-600">Exists • L2</span>
                        )}
                      </div>

                      {/* Committees under this department */}
                      {dept.committees.map((comm, idx) => (
                        <div 
                          key={`${dept.deptId}-${idx}`} 
                          className="ml-4 flex items-center gap-2 p-2 rounded-md bg-amber-500/5 border-l-2 border-amber-500"
                        >
                          <Users className="h-3 w-3 text-amber-500" />
                          <span className="text-[11px] text-foreground flex-1">{comm.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600">New • L3</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-3 p-2 rounded-md bg-muted/50 text-[11px] text-muted-foreground">
                  Creating <span className="font-medium text-foreground">{selectedItems.length}</span> workspace{selectedItems.length > 1 ? 's' : ''}
                  {selectedDepts.length > 0 && <span> ({selectedDepts.length} department{selectedDepts.length > 1 ? 's' : ''})</span>}
                  {selectedComms.length > 0 && <span> ({selectedComms.length} committee{selectedComms.length > 1 ? 's' : ''})</span>}
                </div>
              </div>

              {/* Confirmation Actions */}
              <div className="flex items-center gap-2 px-4 pb-4 pt-2 border-t border-border/30">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmation(false)}
                  disabled={createSubWorkspacesMutation.isPending}
                  className="h-8 text-xs gap-1 px-3"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back
                </Button>
                <div className="flex-1" />
                <Button
                  type="submit"
                  size="sm"
                  disabled={createSubWorkspacesMutation.isPending}
                  className="h-8 text-xs gap-1 px-4"
                >
                  {createSubWorkspacesMutation.isPending ? (
                    <div className="h-3 w-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="h-3 w-3" />
                      Confirm & Create
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
