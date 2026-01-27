import { useState } from 'react';
import { X, Check, Calendar, User, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { IndustryTaskTemplate, PHASE_CONFIG } from '@/lib/industryTemplateTypes';
import { useIndustryTemplates } from '@/hooks/useIndustryTemplates';
import { cn } from '@/lib/utils';

interface TemplateImportWizardProps {
  template: IndustryTaskTemplate;
  workspaceId: string;
  eventDate?: Date;
  onClose: () => void;
}

export function TemplateImportWizard({ template, workspaceId, eventDate, onClose }: TemplateImportWizardProps) {
  const { importTemplate, isImporting } = useIndustryTemplates(workspaceId);
  
  const [step, setStep] = useState(1);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(template.tasks.map(t => t.id));
  const [adjustDates, setAdjustDates] = useState(true);
  const [selectedEventDate, setSelectedEventDate] = useState<Date | undefined>(eventDate);
  const [assignToCurrentUser, setAssignToCurrentUser] = useState(false);

  const phases = ['PRE_EVENT', 'DURING_EVENT', 'POST_EVENT'] as const;

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const togglePhase = (phase: string) => {
    const phaseTasks = template.tasks.filter(t => t.phase === phase);
    const phaseTaskIds = phaseTasks.map(t => t.id);
    const allSelected = phaseTaskIds.every(id => selectedTaskIds.includes(id));
    
    if (allSelected) {
      setSelectedTaskIds(prev => prev.filter(id => !phaseTaskIds.includes(id)));
    } else {
      setSelectedTaskIds(prev => [...new Set([...prev, ...phaseTaskIds])]);
    }
  };

  const selectAll = () => setSelectedTaskIds(template.tasks.map(t => t.id));
  const selectNone = () => setSelectedTaskIds([]);

  const handleImport = () => {
    importTemplate({
      templateId: template.id,
      options: {
        adjustDates,
        eventDate: selectedEventDate,
        assignToCurrentUser,
        selectedTaskIds,
      },
    }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const getSelectedCount = () => selectedTaskIds.length;
  const getTotalHours = () => {
    return template.tasks
      .filter(t => selectedTaskIds.includes(t.id))
      .reduce((sum, t) => sum + t.estimatedHours, 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Import {template.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Step {step} of 3: {step === 1 ? 'Select Tasks' : step === 2 ? 'Configure Options' : 'Review & Import'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isImporting}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-muted/30">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                s < step ? 'bg-primary text-primary-foreground' :
                s === step ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              )}>
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div className={cn(
                  'w-12 h-0.5 mx-2',
                  s < step ? 'bg-primary' : 'bg-muted'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {getSelectedCount()} of {template.tasks.length} tasks selected
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
                  <Button variant="ghost" size="sm" onClick={selectNone}>Clear</Button>
                </div>
              </div>

              {phases.map((phase) => {
                const phaseTasks = template.tasks.filter(t => t.phase === phase);
                const selectedInPhase = phaseTasks.filter(t => selectedTaskIds.includes(t.id)).length;
                const allSelected = selectedInPhase === phaseTasks.length;

                return (
                  <div key={phase} className="space-y-2">
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg -mx-2"
                      onClick={() => togglePhase(phase)}
                    >
                      <Checkbox checked={allSelected} />
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: PHASE_CONFIG[phase].color }}
                      />
                      <span className="font-medium text-foreground">{PHASE_CONFIG[phase].label}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {selectedInPhase}/{phaseTasks.length}
                      </Badge>
                    </div>

                    <div className="ml-8 space-y-1">
                      {phaseTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleTask(task.id)}
                        >
                          <Checkbox checked={selectedTaskIds.includes(task.id)} />
                          <span className="text-sm text-foreground flex-1">{task.title}</span>
                          <span className="text-xs text-muted-foreground">{task.estimatedHours}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Adjust due dates based on event</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically calculate task due dates relative to your event date
                    </p>
                  </div>
                  <Switch checked={adjustDates} onCheckedChange={setAdjustDates} />
                </div>

                {adjustDates && (
                  <div className="pt-4 border-t border-border">
                    <Label className="text-sm mb-2 block">Event Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <Calendar className="h-4 w-4 mr-2" />
                          {selectedEventDate ? format(selectedEventDate, 'PPP') : 'Select event date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarPicker
                          mode="single"
                          selected={selectedEventDate}
                          onSelect={setSelectedEventDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Assign all tasks to me</Label>
                  <p className="text-sm text-muted-foreground">
                    Set yourself as the assignee for all imported tasks
                  </p>
                </div>
                <Switch checked={assignToCurrentUser} onCheckedChange={setAssignToCurrentUser} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <span className="text-4xl">{template.icon}</span>
                <h3 className="text-lg font-semibold text-foreground mt-3">{template.name}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 text-center">
                  <div className="text-2xl font-bold text-foreground">{getSelectedCount()}</div>
                  <div className="text-sm text-muted-foreground">Tasks to import</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 text-center">
                  <div className="text-2xl font-bold text-foreground">{getTotalHours()}</div>
                  <div className="text-sm text-muted-foreground">Estimated hours</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Date adjustment:</span>
                  <span className="text-foreground">
                    {adjustDates && selectedEventDate 
                      ? `Based on ${format(selectedEventDate, 'PPP')}`
                      : 'No date adjustment'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Assignment:</span>
                  <span className="text-foreground">
                    {assignToCurrentUser ? 'Assign to me' : 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <Button 
            variant="outline" 
            onClick={() => step > 1 ? setStep(step - 1) : onClose}
            disabled={isImporting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={step === 1 && selectedTaskIds.length === 0}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Import {getSelectedCount()} Tasks
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
