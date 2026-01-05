import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckIcon, UsersIcon, ClipboardDocumentListIcon, CalendarDaysIcon, FolderIcon, EyeIcon } from '@heroicons/react/24/outline';
import { ENHANCED_WORKSPACE_TEMPLATES, EnhancedWorkspaceTemplate, COMMITTEE_DEFINITIONS } from '@/lib/workspaceTemplates';
import { TemplatePreviewModal } from './TemplatePreviewModal';

interface WorkspaceTemplateSelectorProps {
  selectedTemplate: EnhancedWorkspaceTemplate;
  onSelectTemplate: (template: EnhancedWorkspaceTemplate) => void;
  onApplyTemplate?: (template: EnhancedWorkspaceTemplate) => void;
  isApplying?: boolean;
}

export function WorkspaceTemplateSelector({
  selectedTemplate,
  onSelectTemplate,
  onApplyTemplate,
  isApplying = false,
}: WorkspaceTemplateSelectorProps) {
  const [activeTab, setActiveTab] = useState<'SIMPLE' | 'MODERATE' | 'COMPLEX'>('SIMPLE');
  const [previewTemplate, setPreviewTemplate] = useState<EnhancedWorkspaceTemplate | null>(null);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'SIMPLE':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'MODERATE':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'COMPLEX':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'social':
        return 'bg-blue-500/10 text-blue-600';
      case 'business':
        return 'bg-purple-500/10 text-purple-600';
      case 'education':
        return 'bg-emerald-500/10 text-emerald-600';
      case 'competition':
        return 'bg-orange-500/10 text-orange-600';
      case 'celebration':
        return 'bg-pink-500/10 text-pink-600';
      case 'entertainment':
        return 'bg-cyan-500/10 text-cyan-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const templatesByComplexity = {
    SIMPLE: ENHANCED_WORKSPACE_TEMPLATES.filter(t => t.complexity === 'SIMPLE'),
    MODERATE: ENHANCED_WORKSPACE_TEMPLATES.filter(t => t.complexity === 'MODERATE'),
    COMPLEX: ENHANCED_WORKSPACE_TEMPLATES.filter(t => t.complexity === 'COMPLEX'),
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="SIMPLE" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Simple</span>
            <span className="sm:hidden">Simple</span>
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
              {templatesByComplexity.SIMPLE.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="MODERATE" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Moderate</span>
            <span className="sm:hidden">Moderate</span>
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
              {templatesByComplexity.MODERATE.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="COMPLEX" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Complex</span>
            <span className="sm:hidden">Complex</span>
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
              {templatesByComplexity.COMPLEX.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {(['SIMPLE', 'MODERATE', 'COMPLEX'] as const).map((complexity) => (
          <TabsContent key={complexity} value={complexity} className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templatesByComplexity[complexity].map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplate.id === template.id;
                const departmentCount = template.structure.departments.length;
                const committeeCount = template.structure.departments.reduce(
                  (acc, d) => acc + d.committees.length,
                  0
                );
                const taskCount = template.structure.tasks.length;
                const milestoneCount = template.structure.milestones.length;

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onSelectTemplate(template)}
                    className={cn(
                      "relative text-left p-4 rounded-xl border-2 transition-all",
                      "hover:border-primary/50 hover:bg-primary/5",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border/70 bg-card/50"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckIcon className="h-5 w-5 text-primary" />
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0",
                          isSelected ? "bg-primary/10" : "bg-muted"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-sm font-medium text-foreground">
                            {template.name}
                          </h4>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] px-1.5 py-0", getCategoryColor(template.category))}
                          >
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {template.description}
                        </p>

                        {template.id !== 'blank' && (
                          <>
                            {/* Stats row */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <FolderIcon className="h-3 w-3" />
                                {departmentCount} dept
                              </span>
                              <span className="flex items-center gap-1">
                                <UsersIcon className="h-3 w-3" />
                                {committeeCount} committees
                              </span>
                              <span className="flex items-center gap-1">
                                <ClipboardDocumentListIcon className="h-3 w-3" />
                                {taskCount} tasks
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarDaysIcon className="h-3 w-3" />
                                {milestoneCount} milestones
                              </span>
                            </div>

                            {/* Event size badge */}
                            <div className="flex items-center gap-2 text-[10px]">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {template.eventSizeRange.min.toLocaleString()}-{template.eventSizeRange.max.toLocaleString()} attendees
                              </Badge>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {template.suggestedTeamSize.min}-{template.suggestedTeamSize.max} team
                              </Badge>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Template Preview Summary with View Full Details button */}
      {selectedTemplate.id !== 'blank' && (
        <div className="rounded-lg border border-border/70 bg-muted/30 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">What You'll Get</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", getComplexityColor(selectedTemplate.complexity))}>
                {selectedTemplate.complexity}
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  setPreviewTemplate(selectedTemplate);
                }}
              >
                <EyeIcon className="h-3.5 w-3.5 mr-1" />
                Full Preview
              </Button>
            </div>
          </div>

          {/* Departments & Committees */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Departments & Committees</p>
            <div className="space-y-2">
              {selectedTemplate.structure.departments.map((dept) => (
                <div key={dept.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FolderIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-foreground">{dept.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-5">
                    {dept.committees.map((committeeId) => {
                      const committee = COMMITTEE_DEFINITIONS[committeeId];
                      return (
                        <Badge key={committeeId} variant="secondary" className="text-[10px] px-1.5">
                          {committee?.name || committeeId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Roles */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Team Roles</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedTemplate.structure.roles.map((role, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {role.role.replace(/_/g, ' ')} ({role.count})
                </Badge>
              ))}
            </div>
          </div>

          {/* Sample Tasks */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Sample Tasks ({selectedTemplate.structure.tasks.length} total)
            </p>
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {selectedTemplate.structure.tasks.slice(0, 5).map((task, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0 flex-shrink-0",
                      task.priority === 'HIGH'
                        ? 'bg-red-500/10 text-red-600 border-red-500/20'
                        : task.priority === 'MEDIUM'
                        ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                        : 'bg-green-500/10 text-green-600 border-green-500/20'
                    )}
                  >
                    {task.priority}
                  </Badge>
                  <span className="text-foreground truncate">{task.title}</span>
                </div>
              ))}
              {selectedTemplate.structure.tasks.length > 5 && (
                <p className="text-[10px] text-muted-foreground italic">
                  +{selectedTemplate.structure.tasks.length - 5} more tasks...
                </p>
              )}
            </div>
          </div>

          {/* Milestones */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Key Milestones</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedTemplate.structure.milestones.map((milestone, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] px-1.5">
                  {milestone.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        onApplyTemplate={(template) => {
          if (onApplyTemplate) {
            onApplyTemplate(template);
          }
          setPreviewTemplate(null);
        }}
        isApplying={isApplying}
      />
    </div>
  );
}
