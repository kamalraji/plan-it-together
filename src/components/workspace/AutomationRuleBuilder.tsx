import { useState } from 'react';
import { useAutomationRules } from '@/hooks/useAutomationRules';
import {
  AutomationTrigger,
  AutomationAction,
  TriggerConfig,
  ActionConfig,
  TRIGGER_INFO,
  ACTION_INFO,
} from '@/lib/automationTypes';
import { TaskStatus, TaskPriority } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface AutomationRuleBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

type Step = 'trigger' | 'action' | 'config' | 'review';

export function AutomationRuleBuilder({ open, onOpenChange, workspaceId }: AutomationRuleBuilderProps) {
  const { createRule, isCreating } = useAutomationRules(workspaceId);
  
  const [step, setStep] = useState<Step>('trigger');
  const [selectedTrigger, setSelectedTrigger] = useState<AutomationTrigger | null>(null);
  const [selectedAction, setSelectedAction] = useState<AutomationAction | null>(null);
  const [triggerConfig, setTriggerConfig] = useState<TriggerConfig>({});
  const [actionConfig, setActionConfig] = useState<ActionConfig>({});
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setStep('trigger');
    setSelectedTrigger(null);
    setSelectedAction(null);
    setTriggerConfig({});
    setActionConfig({});
    setName('');
    setDescription('');
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleCreate = () => {
    if (!selectedTrigger || !selectedAction || !name.trim()) return;
    
    createRule({
      name: name.trim(),
      description: description.trim() || undefined,
      triggerType: selectedTrigger,
      triggerConfig,
      actionType: selectedAction,
      actionConfig,
    });
    handleClose();
  };

  const steps: Step[] = ['trigger', 'action', 'config', 'review'];
  const currentIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case 'trigger': return !!selectedTrigger;
      case 'action': return !!selectedAction;
      case 'config': return true;
      case 'review': return !!name.trim();
    }
  };

  const nextStep = () => {
    const next = steps[currentIndex + 1];
    if (next) setStep(next);
  };

  const prevStep = () => {
    const prev = steps[currentIndex - 1];
    if (prev) setStep(prev);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Automation Rule</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-4">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  currentIndex >= i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {currentIndex > i ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-16 mx-2',
                    currentIndex > i ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {step === 'trigger' && (
            <div className="space-y-4">
              <h4 className="font-medium">When should this automation trigger?</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(TRIGGER_INFO) as AutomationTrigger[]).map(trigger => {
                  const info = TRIGGER_INFO[trigger];
                  return (
                    <button
                      key={trigger}
                      onClick={() => setSelectedTrigger(trigger)}
                      className={cn(
                        'p-4 rounded-lg border text-left transition-all hover:border-primary/50',
                        selectedTrigger === trigger
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border'
                      )}
                    >
                      <div className="font-medium text-sm">{info.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {info.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'action' && (
            <div className="space-y-4">
              <h4 className="font-medium">What action should be taken?</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(ACTION_INFO) as AutomationAction[]).map(action => {
                  const info = ACTION_INFO[action];
                  return (
                    <button
                      key={action}
                      onClick={() => setSelectedAction(action)}
                      className={cn(
                        'p-4 rounded-lg border text-left transition-all hover:border-primary/50',
                        selectedAction === action
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border'
                      )}
                    >
                      <div className="font-medium text-sm">{info.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {info.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'config' && (
            <div className="space-y-6">
              <h4 className="font-medium">Configure trigger & action</h4>
              
              {/* Trigger Configuration */}
              {selectedTrigger === 'DUE_DATE_APPROACHING' && (
                <div className="space-y-2">
                  <Label>Hours before due date</Label>
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    value={triggerConfig.hoursBeforeDue || 24}
                    onChange={(e) => setTriggerConfig({ ...triggerConfig, hoursBeforeDue: parseInt(e.target.value) })}
                  />
                </div>
              )}

              {selectedTrigger === 'STATUS_CHANGED' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>From Status (optional)</Label>
                    <Select
                      value={triggerConfig.fromStatus || ''}
                      onValueChange={(v) => setTriggerConfig({ ...triggerConfig, fromStatus: v as TaskStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TaskStatus).map(status => (
                          <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>To Status</Label>
                    <Select
                      value={triggerConfig.toStatus || ''}
                      onValueChange={(v) => setTriggerConfig({ ...triggerConfig, toStatus: v as TaskStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TaskStatus).map(status => (
                          <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Action Configuration */}
              {selectedAction === 'CHANGE_STATUS' && (
                <div className="space-y-2">
                  <Label>New Status</Label>
                  <Select
                    value={actionConfig.newStatus || ''}
                    onValueChange={(v) => setActionConfig({ ...actionConfig, newStatus: v as TaskStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskStatus).map(status => (
                        <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedAction === 'UPDATE_PRIORITY' && (
                <div className="space-y-2">
                  <Label>New Priority</Label>
                  <Select
                    value={actionConfig.newPriority || ''}
                    onValueChange={(v) => setActionConfig({ ...actionConfig, newPriority: v as TaskPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskPriority).map(priority => (
                        <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedAction === 'SEND_NOTIFICATION' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Notification Title</Label>
                    <Input
                      value={actionConfig.notificationTitle || ''}
                      onChange={(e) => setActionConfig({ ...actionConfig, notificationTitle: e.target.value })}
                      placeholder="Task requires attention"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notification Message</Label>
                    <Textarea
                      value={actionConfig.notificationMessage || ''}
                      onChange={(e) => setActionConfig({ ...actionConfig, notificationMessage: e.target.value })}
                      placeholder="Your task needs your attention..."
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="notifyAssignees"
                        checked={actionConfig.notifyAssignees ?? true}
                        onCheckedChange={(c) => setActionConfig({ ...actionConfig, notifyAssignees: !!c })}
                      />
                      <Label htmlFor="notifyAssignees" className="text-sm">Notify assignees</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="notifyCreator"
                        checked={actionConfig.notifyCreator ?? false}
                        onCheckedChange={(c) => setActionConfig({ ...actionConfig, notifyCreator: !!c })}
                      />
                      <Label htmlFor="notifyCreator" className="text-sm">Notify creator</Label>
                    </div>
                  </div>
                </div>
              )}

              {selectedAction === 'ADD_TAG' && (
                <div className="space-y-2">
                  <Label>Tag to Add</Label>
                  <Input
                    value={actionConfig.tag || ''}
                    onChange={(e) => setActionConfig({ ...actionConfig, tag: e.target.value })}
                    placeholder="urgent"
                  />
                </div>
              )}
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <h4 className="font-medium">Name your automation</h4>
              
              <div className="space-y-2">
                <Label>Rule Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Remind before due date"
                />
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this automation do?"
                  rows={2}
                />
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="text-sm font-medium mb-3">Rule Summary</div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-2 py-1 rounded bg-background border">
                    {selectedTrigger && TRIGGER_INFO[selectedTrigger].label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="px-2 py-1 rounded bg-background border">
                    {selectedAction && ACTION_INFO[selectedAction].label}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentIndex === 0 ? handleClose : prevStep}
          >
            {currentIndex === 0 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </>
            )}
          </Button>

          {step === 'review' ? (
            <Button onClick={handleCreate} disabled={!canProceed() || isCreating}>
              {isCreating ? 'Creating...' : 'Create Rule'}
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
