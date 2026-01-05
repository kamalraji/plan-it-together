import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  PlusIcon, 
  TrashIcon, 
  FolderIcon, 
  UsersIcon,
  UserGroupIcon,
  ChevronRightIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { 
  DEPARTMENT_DEFINITIONS, 
  COMMITTEE_DEFINITIONS, 
  DepartmentId, 
  CommitteeId,
  EnhancedWorkspaceTemplate,
  DepartmentConfig,
} from '@/lib/workspaceTemplates';

interface CustomTemplateBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (template: EnhancedWorkspaceTemplate) => void;
}

interface CustomDepartment {
  id: DepartmentId;
  name: string;
  description: string;
  committees: CommitteeId[];
  customTeams: string[];
}

export function CustomTemplateBuilder({ open, onOpenChange, onApply }: CustomTemplateBuilderProps) {
  const [step, setStep] = useState<'departments' | 'committees' | 'teams' | 'review'>('departments');
  const [selectedDepartments, setSelectedDepartments] = useState<CustomDepartment[]>([]);
  const [expandedDept, setExpandedDept] = useState<string | undefined>();

  const departmentList = Object.entries(DEPARTMENT_DEFINITIONS) as [DepartmentId, typeof DEPARTMENT_DEFINITIONS[DepartmentId]][];
  
  const getCommitteesForDepartment = (deptId: DepartmentId) => {
    return Object.entries(COMMITTEE_DEFINITIONS)
      .filter(([_, def]) => def.department === deptId)
      .map(([id, def]) => ({ id: id as CommitteeId, ...def }));
  };

  const toggleDepartment = (deptId: DepartmentId) => {
    const exists = selectedDepartments.find(d => d.id === deptId);
    if (exists) {
      setSelectedDepartments(prev => prev.filter(d => d.id !== deptId));
    } else {
      const deptDef = DEPARTMENT_DEFINITIONS[deptId];
      setSelectedDepartments(prev => [...prev, {
        id: deptId,
        name: deptDef.name,
        description: deptDef.description,
        committees: [],
        customTeams: [],
      }]);
    }
  };

  const toggleCommittee = (deptId: DepartmentId, committeeId: CommitteeId) => {
    setSelectedDepartments(prev => prev.map(dept => {
      if (dept.id !== deptId) return dept;
      const hasCommittee = dept.committees.includes(committeeId);
      return {
        ...dept,
        committees: hasCommittee 
          ? dept.committees.filter(c => c !== committeeId)
          : [...dept.committees, committeeId],
      };
    }));
  };

  const addCustomTeam = (deptId: DepartmentId, teamName: string) => {
    if (!teamName.trim()) return;
    setSelectedDepartments(prev => prev.map(dept => {
      if (dept.id !== deptId) return dept;
      if (dept.customTeams.includes(teamName.trim())) return dept;
      return {
        ...dept,
        customTeams: [...dept.customTeams, teamName.trim()],
      };
    }));
  };

  const removeCustomTeam = (deptId: DepartmentId, teamName: string) => {
    setSelectedDepartments(prev => prev.map(dept => {
      if (dept.id !== deptId) return dept;
      return {
        ...dept,
        customTeams: dept.customTeams.filter(t => t !== teamName),
      };
    }));
  };

  const buildTemplate = (): EnhancedWorkspaceTemplate => {
    const departments: DepartmentConfig[] = selectedDepartments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      committees: dept.committees,
    }));

    const totalCommittees = selectedDepartments.reduce((acc, d) => acc + d.committees.length, 0);
    
    let complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' = 'SIMPLE';
    if (departments.length >= 4 || totalCommittees >= 8) {
      complexity = 'COMPLEX';
    } else if (departments.length >= 2 || totalCommittees >= 4) {
      complexity = 'MODERATE';
    }

    return {
      id: 'custom-' + Date.now(),
      name: 'Custom Workspace',
      description: `Custom template with ${departments.length} departments and ${totalCommittees} committees`,
      icon: Squares2X2Icon,
      complexity,
      category: 'business',
      eventSizeRange: { min: 1, max: 10000 },
      suggestedTeamSize: { min: 1, max: 100 },
      structure: {
        departments,
        roles: [],
        tasks: [],
        milestones: [],
        budgetCategories: [],
      },
    };
  };

  const handleApply = () => {
    const template = buildTemplate();
    onApply(template);
    onOpenChange(false);
    // Reset state
    setStep('departments');
    setSelectedDepartments([]);
  };

  const steps = [
    { id: 'departments', label: 'Departments', number: 1 },
    { id: 'committees', label: 'Committees', number: 2 },
    { id: 'teams', label: 'Teams', number: 3 },
    { id: 'review', label: 'Review', number: 4 },
  ];

  const canProceed = () => {
    if (step === 'departments') return selectedDepartments.length > 0;
    if (step === 'committees') return selectedDepartments.some(d => d.committees.length > 0);
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Build Custom Template</DialogTitle>
          
          {/* Stepper */}
          <div className="flex items-center justify-between mt-4 px-2">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      step === s.id
                        ? "bg-primary text-primary-foreground"
                        : steps.findIndex(x => x.id === step) > idx
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {s.number}
                  </div>
                  <span className="text-[10px] mt-1 text-muted-foreground">{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRightIcon className="h-4 w-4 mx-2 text-muted-foreground/50" />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="py-4 space-y-4">
            {/* Step 1: Select Departments */}
            {step === 'departments' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Select the departments you need for your event organization.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {departmentList.map(([id, dept]) => {
                    const isSelected = selectedDepartments.some(d => d.id === id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleDepartment(id)}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0",
                          isSelected ? "bg-primary/10" : "bg-muted"
                        )}>
                          <FolderIcon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium">{dept.name}</h4>
                          <p className="text-xs text-muted-foreground">{dept.description}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {getCommitteesForDepartment(id).map(c => (
                              <Badge key={c.id} variant="secondary" className="text-[10px] px-1.5">
                                {c.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Checkbox checked={isSelected} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Select Committees */}
            {step === 'committees' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Select committees for each department.
                </p>
                <Accordion type="single" collapsible value={expandedDept} onValueChange={setExpandedDept}>
                  {selectedDepartments.map(dept => {
                    const availableCommittees = getCommitteesForDepartment(dept.id);
                    return (
                      <AccordionItem key={dept.id} value={dept.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <FolderIcon className="h-4 w-4 text-primary" />
                            <span className="font-medium">{dept.name}</span>
                            <Badge variant="outline" className="text-[10px] ml-2">
                              {dept.committees.length}/{availableCommittees.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pl-6">
                            {availableCommittees.map(committee => {
                              const isSelected = dept.committees.includes(committee.id);
                              return (
                                <button
                                  key={committee.id}
                                  type="button"
                                  onClick={() => toggleCommittee(dept.id, committee.id)}
                                  className={cn(
                                    "flex items-center gap-3 w-full p-2.5 rounded-lg border text-left transition-all",
                                    isSelected
                                      ? "border-primary/50 bg-primary/5"
                                      : "border-border hover:border-primary/30"
                                  )}
                                >
                                  <UsersIcon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{committee.name}</p>
                                    <p className="text-xs text-muted-foreground">{committee.description}</p>
                                  </div>
                                  <Checkbox checked={isSelected} />
                                </button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            )}

            {/* Step 3: Add Teams (Optional) */}
            {step === 'teams' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Optionally add custom teams under each department. Teams are the lowest level in the hierarchy.
                </p>
                <Accordion type="single" collapsible value={expandedDept} onValueChange={setExpandedDept}>
                  {selectedDepartments.map(dept => (
                    <AccordionItem key={dept.id} value={dept.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <FolderIcon className="h-4 w-4 text-primary" />
                          <span className="font-medium">{dept.name}</span>
                          {dept.customTeams.length > 0 && (
                            <Badge variant="secondary" className="text-[10px] ml-2">
                              {dept.customTeams.length} teams
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pl-6">
                          {/* Existing teams */}
                          {dept.customTeams.map(team => (
                            <div key={team} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                              <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm flex-1">{team}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => removeCustomTeam(dept.id, team)}
                              >
                                <TrashIcon className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          
                          {/* Add new team */}
                          <TeamInput onAdd={(name) => addCustomTeam(dept.id, name)} />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 'review' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Review your custom workspace structure before applying.
                </p>
                
                <div className="space-y-3">
                  {selectedDepartments.map(dept => (
                    <div key={dept.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{dept.name}</span>
                        <Badge variant="outline" className="text-[10px]">L2 Department</Badge>
                      </div>
                      
                      {dept.committees.length > 0 && (
                        <div className="pl-4 space-y-1.5">
                          <p className="text-xs text-muted-foreground font-medium">Committees (L3):</p>
                          <div className="flex flex-wrap gap-1.5">
                            {dept.committees.map(cId => {
                              const c = COMMITTEE_DEFINITIONS[cId];
                              return (
                                <Badge key={cId} variant="secondary" className="text-xs">
                                  {c?.name || cId}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {dept.customTeams.length > 0 && (
                        <div className="pl-4 space-y-1.5">
                          <p className="text-xs text-muted-foreground font-medium">Teams (L4):</p>
                          <div className="flex flex-wrap gap-1.5">
                            {dept.customTeams.map(team => (
                              <Badge key={team} variant="outline" className="text-xs">
                                {team}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Summary</p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span>{selectedDepartments.length} Departments</span>
                    <span>•</span>
                    <span>{selectedDepartments.reduce((acc, d) => acc + d.committees.length, 0)} Committees</span>
                    <span>•</span>
                    <span>{selectedDepartments.reduce((acc, d) => acc + d.customTeams.length, 0)} Teams</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (step === 'departments') {
                  onOpenChange(false);
                } else if (step === 'committees') {
                  setStep('departments');
                } else if (step === 'teams') {
                  setStep('committees');
                } else {
                  setStep('teams');
                }
              }}
            >
              {step === 'departments' ? 'Cancel' : 'Back'}
            </Button>
            
            {step !== 'review' ? (
              <Button
                type="button"
                onClick={() => {
                  if (step === 'departments') setStep('committees');
                  else if (step === 'committees') setStep('teams');
                  else setStep('review');
                }}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleApply}>
                Apply Template
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeamInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Enter team name..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        className="h-8 text-sm"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8"
        onClick={handleAdd}
        disabled={!value.trim()}
      >
        <PlusIcon className="h-3.5 w-3.5 mr-1" />
        Add
      </Button>
    </div>
  );
}
