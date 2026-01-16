import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { 
  ApprovalPolicyFormData, 
  ApprovalLevel,
} from '@/lib/taskApprovalTypes';
import { WorkspaceRole, TaskCategory, TaskPriority } from '@/types';
import { WorkspaceHierarchyLevel } from '@/lib/workspaceHierarchy';
import { useTaskApprovalPolicies } from '@/hooks/useTaskApprovalPolicies';
import { cn } from '@/lib/utils';

interface ApprovalPolicyBuilderProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPolicy?: ApprovalPolicyFormData & { id?: string };
}

const STEPS = [
  { id: 'basics', title: 'Basic Info' },
  { id: 'criteria', title: 'Matching Criteria' },
  { id: 'chain', title: 'Approval Chain' },
  { id: 'options', title: 'Options' },
];

// Use enum values for type safety
const CATEGORIES: TaskCategory[] = [
  TaskCategory.LOGISTICS, 
  TaskCategory.MARKETING, 
  TaskCategory.TECHNICAL, 
  TaskCategory.FINANCE, 
  TaskCategory.GENERAL,
  TaskCategory.OPERATIONS,
  TaskCategory.CONTENT,
  TaskCategory.DESIGN,
];

const PRIORITIES: TaskPriority[] = [
  TaskPriority.LOW, 
  TaskPriority.MEDIUM, 
  TaskPriority.HIGH, 
  TaskPriority.URGENT,
];

const ROLES: WorkspaceRole[] = [
  WorkspaceRole.WORKSPACE_OWNER, 
  WorkspaceRole.OPERATIONS_MANAGER, 
  WorkspaceRole.EVENT_LEAD, 
  WorkspaceRole.IT_COORDINATOR,
];

export function ApprovalPolicyBuilder({
  workspaceId,
  open,
  onOpenChange,
  editingPolicy,
}: ApprovalPolicyBuilderProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<ApprovalPolicyFormData>(
    editingPolicy || getDefaultFormData()
  );

  const { createPolicy, updatePolicy, isCreating, isUpdating } = useTaskApprovalPolicies(workspaceId);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (editingPolicy?.id) {
      await updatePolicy({ id: editingPolicy.id, updates: formData });
    } else {
      await createPolicy(formData);
    }
    onOpenChange(false);
    setStep(0);
    setFormData(getDefaultFormData());
  };

  const updateForm = (updates: Partial<ApprovalPolicyFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const addApprovalLevel = () => {
    const newLevel: ApprovalLevel = {
      level: formData.approvalChain.length + 1,
      approverType: 'HIERARCHY',
      hierarchyLevel: WorkspaceHierarchyLevel.MANAGER,
      anyoneAtLevel: true,
    };
    updateForm({ approvalChain: [...formData.approvalChain, newLevel] });
  };

  const removeApprovalLevel = (index: number) => {
    const newChain = formData.approvalChain
      .filter((_, i) => i !== index)
      .map((level, i) => ({ ...level, level: i + 1 }));
    updateForm({ approvalChain: newChain });
  };

  const updateApprovalLevel = (index: number, updates: Partial<ApprovalLevel>) => {
    const newChain = formData.approvalChain.map((level, i) =>
      i === index ? { ...level, ...updates } : level
    );
    updateForm({ approvalChain: newChain });
  };

  const toggleArrayItem = <T extends string>(
    arr: T[] | undefined,
    item: T,
    key: keyof ApprovalPolicyFormData
  ) => {
    const current = arr || [];
    const newArr = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updateForm({ [key]: newArr.length > 0 ? newArr : undefined });
  };

  const isLastStep = step === STEPS.length - 1;
  const canProceed = step === 0 ? formData.name.trim().length > 0 : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingPolicy?.id ? 'Edit' : 'Create'} Approval Policy
          </DialogTitle>
          <DialogDescription>
            Configure when tasks require approval and who can approve them
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                  i === step
                    ? 'bg-primary text-primary-foreground'
                    : i < step
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {i + 1}
              </div>
              <span
                className={cn(
                  'ml-2 text-sm hidden sm:block',
                  i === step ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {s.title}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-4 pr-4">
            {/* Step 1: Basic Info */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Policy Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    placeholder="e.g., High Priority Task Approval"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    placeholder="Describe when this policy applies..."
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Matching Criteria */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <Label>Default Policy</Label>
                    <p className="text-xs text-muted-foreground">
                      Apply to all tasks regardless of criteria
                    </p>
                  </div>
                  <Switch
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => updateForm({ isDefault: checked })}
                  />
                </div>

                {!formData.isDefault && (
                  <>
                    <div>
                      <Label className="mb-2 block">Categories</Label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                          <Badge
                            key={cat}
                            variant={formData.appliesToCategories?.includes(cat) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => toggleArrayItem<TaskCategory>(formData.appliesToCategories, cat, 'appliesToCategories')}
                          >
                            {cat.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">Priorities</Label>
                      <div className="flex flex-wrap gap-2">
                        {PRIORITIES.map((pri) => (
                          <Badge
                            key={pri}
                            variant={formData.appliesToPriorities?.includes(pri) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => toggleArrayItem<TaskPriority>(formData.appliesToPriorities, pri, 'appliesToPriorities')}
                          >
                            {pri}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="minHours">Minimum Estimated Hours</Label>
                      <Input
                        id="minHours"
                        type="number"
                        value={formData.minEstimatedHours || ''}
                        onChange={(e) => updateForm({ 
                          minEstimatedHours: e.target.value ? Number(e.target.value) : undefined 
                        })}
                        placeholder="e.g., 4"
                        className="mt-1.5 w-32"
                        min={0}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Tasks with estimated hours at or above this require approval
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Approval Chain */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Define the approval chain. Tasks will go through each level in order.
                </p>

                {formData.approvalChain.map((level, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {level.level}
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-xs">Approver Type</Label>
                        <Select
                          value={level.approverType}
                          onValueChange={(value: 'ROLE' | 'USER' | 'HIERARCHY') => 
                            updateApprovalLevel(index, { approverType: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HIERARCHY">By Hierarchy Level</SelectItem>
                            <SelectItem value="ROLE">By Specific Role</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {level.approverType === 'HIERARCHY' && (
                        <div>
                          <Label className="text-xs">Minimum Level</Label>
                          <Select
                            value={String(level.hierarchyLevel || WorkspaceHierarchyLevel.MANAGER)}
                            onValueChange={(value) => 
                              updateApprovalLevel(index, { hierarchyLevel: Number(value) })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={String(WorkspaceHierarchyLevel.OWNER)}>Owner</SelectItem>
                              <SelectItem value={String(WorkspaceHierarchyLevel.MANAGER)}>Manager</SelectItem>
                              <SelectItem value={String(WorkspaceHierarchyLevel.LEAD)}>Lead</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {level.approverType === 'ROLE' && (
                        <div>
                          <Label className="text-xs">Required Role</Label>
                          <Select
                            value={level.requiredRole}
                            onValueChange={(value: WorkspaceRole) => 
                              updateApprovalLevel(index, { requiredRole: value })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role.replace(/_/g, ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeApprovalLevel(index)}
                      disabled={formData.approvalChain.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addApprovalLevel}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Approval Level
                </Button>
              </div>
            )}

            {/* Step 4: Options */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <Label>Require All Levels</Label>
                    <p className="text-xs text-muted-foreground">
                      Task must be approved at every level in sequence
                    </p>
                  </div>
                  <Switch
                    checked={formData.requireAllLevels}
                    onCheckedChange={(checked) => updateForm({ requireAllLevels: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <Label>Allow Self-Approval</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow the requester to also be an approver
                    </p>
                  </div>
                  <Switch
                    checked={formData.allowSelfApproval}
                    onCheckedChange={(checked) => updateForm({ allowSelfApproval: checked })}
                  />
                </div>

                <div>
                  <Label htmlFor="autoApprove">Auto-Approve After (hours)</Label>
                  <Input
                    id="autoApprove"
                    type="number"
                    value={formData.autoApproveAfterHours || ''}
                    onChange={(e) => updateForm({ 
                      autoApproveAfterHours: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    placeholder="Leave empty to disable"
                    className="mt-1.5 w-40"
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically approve if no action taken within this time
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <Label>Enable Policy</Label>
                    <p className="text-xs text-muted-foreground">
                      Policy will be active immediately after creation
                    </p>
                  </div>
                  <Switch
                    checked={formData.isEnabled}
                    onCheckedChange={(checked) => updateForm({ isEnabled: checked })}
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          {step > 0 && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          
          {!isLastStep ? (
            <Button onClick={handleNext} disabled={!canProceed}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? 'Saving...' : editingPolicy?.id ? 'Update Policy' : 'Create Policy'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getDefaultFormData(): ApprovalPolicyFormData {
  return {
    name: '',
    description: '',
    isDefault: false,
    approvalChain: [
      {
        level: 1,
        approverType: 'HIERARCHY',
        hierarchyLevel: WorkspaceHierarchyLevel.MANAGER,
        anyoneAtLevel: true,
      },
    ],
    requireAllLevels: true,
    allowSelfApproval: false,
    isEnabled: true,
  };
}
