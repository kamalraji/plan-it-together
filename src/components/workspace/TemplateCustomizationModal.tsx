import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  EnhancedWorkspaceTemplate, 
  COMMITTEE_DEFINITIONS,
  cloneTemplateForCustomization
} from '@/lib/workspaceTemplates';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  FolderIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface TemplateCustomizationModalProps {
  template: EnhancedWorkspaceTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (customizedTemplate: EnhancedWorkspaceTemplate) => void;
  isApplying?: boolean;
}

export function TemplateCustomizationModal({
  template,
  open,
  onOpenChange,
  onApply,
  isApplying = false,
}: TemplateCustomizationModalProps) {
  // Track selected departments and committees
  const [selectedDepartments, setSelectedDepartments] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    template.structure.departments.forEach(d => {
      initial[d.id] = true;
    });
    return initial;
  });

  const [selectedCommittees, setSelectedCommittees] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    template.structure.departments.forEach(d => {
      d.committees.forEach(c => {
        initial[`${d.id}-${c}`] = true;
      });
    });
    return initial;
  });

  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    template.structure.departments.forEach(d => {
      initial[d.id] = true;
    });
    return initial;
  });

  // Calculate stats for preview
  const stats = useMemo(() => {
    let deptCount = 0;
    let committeeCount = 0;

    template.structure.departments.forEach(dept => {
      if (selectedDepartments[dept.id]) {
        deptCount++;
        dept.committees.forEach(c => {
          if (selectedCommittees[`${dept.id}-${c}`]) {
            committeeCount++;
          }
        });
      }
    });

    return {
      departments: deptCount,
      committees: committeeCount,
      tasks: template.structure.tasks.length,
      milestones: template.structure.milestones.length,
    };
  }, [selectedDepartments, selectedCommittees, template]);

  const toggleDepartment = (deptId: string) => {
    const newValue = !selectedDepartments[deptId];
    setSelectedDepartments(prev => ({ ...prev, [deptId]: newValue }));
    
    // Toggle all committees in this department
    const dept = template.structure.departments.find(d => d.id === deptId);
    if (dept) {
      const updates: Record<string, boolean> = {};
      dept.committees.forEach(c => {
        updates[`${deptId}-${c}`] = newValue;
      });
      setSelectedCommittees(prev => ({ ...prev, ...updates }));
    }
  };

  const toggleCommittee = (deptId: string, committeeId: string) => {
    const key = `${deptId}-${committeeId}`;
    setSelectedCommittees(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDeptExpand = (deptId: string) => {
    setExpandedDepts(prev => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  const handleApply = () => {
    // Clone template and filter based on selections
    const customized = cloneTemplateForCustomization(template);
    
    // Filter departments
    customized.structure.departments = customized.structure.departments
      .filter(d => selectedDepartments[d.id])
      .map(d => ({
        ...d,
        committees: d.committees.filter(c => selectedCommittees[`${d.id}-${c}`]),
      }))
      .filter(d => d.committees.length > 0);

    onApply(customized);
  };

  const selectAll = () => {
    const depts: Record<string, boolean> = {};
    const comms: Record<string, boolean> = {};
    template.structure.departments.forEach(d => {
      depts[d.id] = true;
      d.committees.forEach(c => {
        comms[`${d.id}-${c}`] = true;
      });
    });
    setSelectedDepartments(depts);
    setSelectedCommittees(comms);
  };

  const selectNone = () => {
    setSelectedDepartments({});
    setSelectedCommittees({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Customize Template
            <Badge variant="outline" className="ml-2">{template.name}</Badge>
          </DialogTitle>
          <DialogDescription>
            Select which departments and committees to include in your workspace
          </DialogDescription>
        </DialogHeader>

        {/* Stats Preview */}
        <div className="flex flex-wrap gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-1.5 text-sm">
            <FolderIcon className="h-4 w-4 text-primary" />
            <span className="font-medium">{stats.departments}</span>
            <span className="text-muted-foreground">Departments</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <UsersIcon className="h-4 w-4 text-primary" />
            <span className="font-medium">{stats.committees}</span>
            <span className="text-muted-foreground">Committees</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <ClipboardDocumentListIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{stats.tasks}</span>
            <span className="text-muted-foreground">Tasks</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{stats.milestones}</span>
            <span className="text-muted-foreground">Milestones</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={selectNone}>
            Deselect All
          </Button>
        </div>

        {/* Department/Committee Selection */}
        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-2">
            {template.structure.departments.map((dept) => {
              const isDeptSelected = selectedDepartments[dept.id];
              const selectedCommitteeCount = dept.committees.filter(
                c => selectedCommittees[`${dept.id}-${c}`]
              ).length;
              const isExpanded = expandedDepts[dept.id];

              return (
                <Collapsible 
                  key={dept.id} 
                  open={isExpanded}
                  onOpenChange={() => toggleDeptExpand(dept.id)}
                >
                  <div className={cn(
                    "rounded-lg border transition-colors",
                    isDeptSelected ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                  )}>
                    {/* Department Header */}
                    <div className="flex items-center gap-3 p-3">
                      <Checkbox
                        checked={isDeptSelected}
                        onCheckedChange={() => toggleDepartment(dept.id)}
                        className="h-5 w-5"
                      />
                      <CollapsibleTrigger className="flex-1 flex items-center gap-2 text-left">
                        {isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{dept.name}</div>
                          <div className="text-xs text-muted-foreground">{dept.description}</div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {selectedCommitteeCount}/{dept.committees.length} committees
                        </Badge>
                      </CollapsibleTrigger>
                    </div>

                    {/* Committees */}
                    <CollapsibleContent>
                      <div className="px-3 pb-3 pl-10 space-y-1.5">
                        {dept.committees.map((committeeId) => {
                          const committeeDef = COMMITTEE_DEFINITIONS[committeeId];
                          const key = `${dept.id}-${committeeId}`;
                          const isSelected = selectedCommittees[key];

                          return (
                            <label
                              key={committeeId}
                              className={cn(
                                "flex items-center gap-2.5 p-2 rounded-md cursor-pointer transition-colors",
                                isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                              )}
                            >
                              <Checkbox
                                checked={isSelected && isDeptSelected}
                                disabled={!isDeptSelected}
                                onCheckedChange={() => toggleCommittee(dept.id, committeeId)}
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium">
                                  {committeeDef?.name || committeeId}
                                </span>
                                {committeeDef?.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {committeeDef.description}
                                  </p>
                                )}
                              </div>
                              {isSelected && isDeptSelected && (
                                <CheckCircleIcon className="h-4 w-4 text-primary" />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={isApplying || stats.departments === 0}
          >
            {isApplying ? 'Applying...' : `Apply Template (${stats.departments} depts)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}