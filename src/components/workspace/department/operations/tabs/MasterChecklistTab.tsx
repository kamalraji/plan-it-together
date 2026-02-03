import { useState, useMemo } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, ClipboardCheck, User, Calendar, Loader2 } from 'lucide-react';
import { useMasterChecklist, useUpdateChecklist } from '@/hooks/useOperationsDepartmentData';
import { format } from 'date-fns';

interface MasterChecklistTabProps {
  workspace: Workspace;
}

export function MasterChecklistTab({ workspace }: MasterChecklistTabProps) {
  const { data: checklists, isLoading } = useMasterChecklist(workspace.id);
  const updateChecklist = useUpdateChecklist(workspace.id);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['all']));

  // Priority level is not in the schema, so we skip this helper
  // const getPriorityBadge = (priority: string | null) => { ... };

  // Group checklists by committee_type as category
  const groupedChecklists = useMemo(() => {
    if (!checklists) return {};
    return checklists.reduce((acc, item) => {
      const category = item.committee_type || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, typeof checklists>);
  }, [checklists]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleToggleComplete = (id: string, currentStatus: string | null) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    updateChecklist.mutate({
      id,
      delegation_status: newStatus,
    });
  };

  const totalItems = checklists?.length || 0;
  const completedItems = checklists?.filter(c => c.delegation_status === 'completed').length || 0;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Master Checklist</h2>
        <p className="text-muted-foreground">Comprehensive operations checklist</p>
      </div>

      {/* Progress Summary */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Overall Progress</h3>
              <p className="text-sm text-muted-foreground">{completedItems} of {totalItems} tasks completed</p>
            </div>
            <div className="text-3xl font-bold text-primary">{progressPercent}%</div>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </CardContent>
      </Card>

      {/* Checklist Sections */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Checklist Items</CardTitle>
          <CardDescription>Organized by category</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[450px] pr-4">
            {Object.keys(groupedChecklists).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupedChecklists).map(([category, items]) => {
                  const categoryCompleted = items.filter(i => i.delegation_status === 'completed').length;
                  const isExpanded = expandedSections.has(category) || expandedSections.has('all');

                  return (
                    <Collapsible key={category} open={isExpanded}>
                      <CollapsibleTrigger
                        onClick={() => toggleSection(category)}
                        className="w-full flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-semibold text-foreground">{category}</span>
                        </div>
                        <Badge variant="outline">
                          {categoryCompleted}/{items.length}
                        </Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="space-y-2 mt-2 pl-6">
                          {items.map((item) => {
                            const isCompleted = item.delegation_status === 'completed';
                            return (
                              <div
                                key={item.id}
                                className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${
                                  isCompleted ? 'bg-emerald-500/5' : 'bg-muted/30 hover:bg-muted/50'
                                }`}
                              >
                                <Checkbox
                                  checked={isCompleted}
                                  onCheckedChange={() => handleToggleComplete(item.id, item.delegation_status)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-medium ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                      {item.title}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2">
                                    {item.delegated_by && (
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        Delegated by: {item.delegated_by}
                                      </span>
                                    )}
                                    {item.due_date && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Due: {format(new Date(item.due_date), 'MMM d')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No checklist items found</p>
                <p className="text-sm">Create checklists in the Checklists tab to see them here</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
