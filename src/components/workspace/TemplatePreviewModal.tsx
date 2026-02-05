import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  FolderIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChevronRightIcon,
  CheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  EnhancedWorkspaceTemplate,
  COMMITTEE_DEFINITIONS,
} from '@/lib/workspaceTemplates';

interface TemplatePreviewModalProps {
  template: EnhancedWorkspaceTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyTemplate: (template: EnhancedWorkspaceTemplate) => void;
  isApplying?: boolean;
}

export function TemplatePreviewModal({
  template,
  open,
  onOpenChange,
  onApplyTemplate,
  isApplying = false,
}: TemplatePreviewModalProps) {
  const [activeTab, setActiveTab] = useState('hierarchy');

  if (!template) return null;

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'SIMPLE':
        return 'bg-success/10 text-success border-success/20';
      case 'MODERATE':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'COMPLEX':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'MEDIUM':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'LOW':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const departmentCount = template.structure.departments.length;
  const committeeCount = template.structure.departments.reduce(
    (acc, d) => acc + d.committees.length,
    0
  );
  const taskCount = template.structure.tasks.length;
  const milestoneCount = template.structure.milestones.length;
  const roleCount = template.structure.roles.reduce((acc, r) => acc + r.count, 0);

  const Icon = template.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold text-foreground">
                {template.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {template.description}
              </DialogDescription>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className={cn('text-xs', getComplexityColor(template.complexity))}>
                  {template.complexity}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.eventSizeRange.min.toLocaleString()}-{template.eventSizeRange.max.toLocaleString()} attendees
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.suggestedTeamSize.min}-{template.suggestedTeamSize.max} team members
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-2 py-4 border-y border-border">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <FolderIcon className="h-4 w-4 text-info" />
            </div>
            <div className="text-lg font-semibold text-foreground">{departmentCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Departments</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <UsersIcon className="h-4 w-4 text-warning" />
            </div>
            <div className="text-lg font-semibold text-foreground">{committeeCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Committees</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <ClipboardDocumentListIcon className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-lg font-semibold text-foreground">{taskCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Tasks</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CalendarDaysIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-lg font-semibold text-foreground">{milestoneCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Milestones</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <SparklesIcon className="h-4 w-4 text-pink-500" />
            </div>
            <div className="text-lg font-semibold text-foreground">{roleCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Roles</div>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-5 w-full flex-shrink-0">
            <TabsTrigger value="hierarchy" className="text-xs">Hierarchy</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">Tasks</TabsTrigger>
            <TabsTrigger value="milestones" className="text-xs">Timeline</TabsTrigger>
            <TabsTrigger value="roles" className="text-xs">Roles</TabsTrigger>
            <TabsTrigger value="budget" className="text-xs">Budget</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Hierarchy Tab - Visual Tree */}
            <TabsContent value="hierarchy" className="mt-0 m-0">
              <div className="space-y-1 p-1">
                {/* Root Level */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                  <FolderIcon className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">Root Workspace</span>
                  <Badge variant="outline" className="ml-auto text-[10px] bg-primary/10 text-primary border-primary/20">
                    L1 ROOT
                  </Badge>
                </div>

                {/* Departments */}
                {template.structure.departments.map((dept) => (
                  <div key={dept.id} className="ml-4 space-y-1">
                    {/* Department */}
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-info/5 border border-info/20">
                      <div className="w-2.5 h-2.5 rounded-full bg-info flex-shrink-0" />
                      <ChevronRightIcon className="h-3 w-3 text-info" />
                      <FolderIcon className="h-4 w-4 text-info" />
                      <span className="text-sm font-medium text-foreground">{dept.name}</span>
                      <Badge variant="outline" className="ml-auto text-[10px] bg-info/10 text-info border-info/20">
                        L2 DEPT
                      </Badge>
                    </div>

                    {/* Committees under department */}
                    {dept.committees.map((committeeId) => {
                      const committee = COMMITTEE_DEFINITIONS[committeeId];
                      return (
                        <div key={committeeId} className="ml-6 flex items-center gap-2 p-2 rounded-lg bg-warning/5 border border-warning/20">
                          <div className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
                          <ChevronRightIcon className="h-3 w-3 text-warning" />
                          <UsersIcon className="h-4 w-4 text-warning" />
                          <span className="text-sm text-foreground">{committee?.name || committeeId}</span>
                          <Badge variant="outline" className="ml-auto text-[10px] bg-warning/10 text-warning border-warning/20">
                            L3 COMM
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {template.structure.departments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Blank template - no pre-built hierarchy</p>
                    <p className="text-xs mt-1">You'll start fresh and build your own structure</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="mt-0 m-0">
              <div className="space-y-2 p-1">
                {template.structure.tasks.length > 0 ? (
                  template.structure.tasks.map((task, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="mt-0.5">
                        <div className={cn(
                          'w-5 h-5 rounded-md flex items-center justify-center border',
                          task.status === 'DONE' ? 'bg-primary border-primary' : 'border-border'
                        )}>
                          {task.status === 'DONE' && <CheckIcon className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{task.title}</span>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getPriorityColor(task.priority))}>
                            {task.priority}
                          </Badge>
                          {task.targetLevel && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {task.targetLevel}
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                        )}
                        {task.estimatedHours && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Est. {task.estimatedHours}h
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No pre-built tasks</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Milestones Tab */}
            <TabsContent value="milestones" className="mt-0 m-0">
              <div className="relative p-1">
                {template.structure.milestones.length > 0 ? (
                  <div className="space-y-0">
                    {template.structure.milestones.map((milestone, idx) => (
                      <div key={idx} className="relative flex gap-4 pb-6 last:pb-0">
                        {/* Timeline connector */}
                        {idx < template.structure.milestones.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border" />
                        )}
                        {/* Milestone dot */}
                        <div className={cn(
                          'relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                          milestone.daysFromEventStart === 0
                            ? 'bg-primary text-primary-foreground'
                            : milestone.daysFromEventStart < 0
                            ? 'bg-info/20 text-info border-2 border-info'
                            : 'bg-emerald-500/20 text-emerald-600 border-2 border-emerald-500'
                        )}>
                          <CalendarDaysIcon className="h-3 w-3" />
                        </div>
                        {/* Milestone content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{milestone.name}</span>
                            <Badge variant="outline" className={cn(
                              'text-[10px]',
                              milestone.daysFromEventStart === 0
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : milestone.daysFromEventStart < 0
                                ? 'bg-info/10 text-info border-info/20'
                                : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            )}>
                              {milestone.daysFromEventStart === 0
                                ? 'Event Day'
                                : milestone.daysFromEventStart < 0
                                ? `${Math.abs(milestone.daysFromEventStart)} days before`
                                : `${milestone.daysFromEventStart} days after`}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No pre-built milestones</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Roles Tab */}
            <TabsContent value="roles" className="mt-0 m-0">
              <div className="space-y-2 p-1">
                {template.structure.roles.length > 0 ? (
                  template.structure.roles.map((role, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        role.level === 'MANAGER' ? 'bg-primary/10 text-primary' :
                        role.level === 'LEAD' ? 'bg-info/10 text-info' :
                        role.level === 'COORDINATOR' ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      )}>
                        <UsersIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">
                            {role.role.replace(/_/g, ' ')}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {role.level}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {role.count} {role.count === 1 ? 'position' : 'positions'}
                        </p>
                        {role.description && (
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No pre-defined roles</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Budget Tab */}
            <TabsContent value="budget" className="mt-0 m-0">
              <div className="space-y-2 p-1">
                {template.structure.budgetCategories.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {template.structure.budgetCategories.map((category, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <CurrencyDollarIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-foreground">{category}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No pre-defined budget categories</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="flex-shrink-0 border-t border-border pt-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onApplyTemplate(template)} disabled={isApplying}>
            {isApplying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                Applying...
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4 mr-2" />
                Apply Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
