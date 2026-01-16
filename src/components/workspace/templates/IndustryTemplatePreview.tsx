import { X, Clock, Calendar, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IndustryTaskTemplate, INDUSTRY_CONFIG, PHASE_CONFIG, TaskPriority } from '@/lib/industryTemplateTypes';

interface IndustryTemplatePreviewProps {
  template: IndustryTaskTemplate;
  onClose: () => void;
  onImport: () => void;
}

export function IndustryTemplatePreview({ template, onClose, onImport }: IndustryTemplatePreviewProps) {
  const phases = ['PRE_EVENT', 'DURING_EVENT', 'POST_EVENT'] as const;
  
  const tasksByPhase = phases.reduce((acc, phase) => {
    acc[phase] = template.tasks.filter(t => t.phase === phase);
    return acc;
  }, {} as Record<string, typeof template.tasks>);

  const getTotalHours = (): number => {
    return template.tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'bg-red-100 text-red-800';
      case TaskPriority.HIGH: return 'bg-orange-100 text-orange-800';
      case TaskPriority.MEDIUM: return 'bg-blue-100 text-blue-800';
      case TaskPriority.LOW: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{template.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-foreground">{template.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge style={{ backgroundColor: template.color + '20', color: template.color }}>
                  {INDUSTRY_CONFIG[template.industry].label}
                </Badge>
                <Badge variant="outline">{template.eventType}</Badge>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">{template.metadata.rating}</span>
                </div>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 p-6 border-b border-border bg-muted/30">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{template.tasks.length}</div>
            <div className="text-sm text-muted-foreground">Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{getTotalHours()}</div>
            <div className="text-sm text-muted-foreground">Est. Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{template.estimatedTeamSize.min}-{template.estimatedTeamSize.max}</div>
            <div className="text-sm text-muted-foreground">Team Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{template.eventSizeRange.min.toLocaleString()}+</div>
            <div className="text-sm text-muted-foreground">Event Size</div>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-4 border-b border-border">
          <p className="text-muted-foreground">{template.description}</p>
        </div>

        {/* Tasks by Phase */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {phases.map((phase) => (
              <div key={phase}>
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PHASE_CONFIG[phase].color }}
                  />
                  <h3 className="font-semibold text-foreground">
                    {PHASE_CONFIG[phase].label}
                  </h3>
                  <Badge variant="secondary" className="ml-2">
                    {tasksByPhase[phase].length} tasks
                  </Badge>
                </div>
                
                <div className="space-y-2 ml-5">
                  {tasksByPhase[phase].map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{task.title}</span>
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {task.description}
                        </p>
                        {task.subtasks.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {task.subtasks.length} subtasks
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{task.estimatedHours}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {task.daysFromEvent < 0 
                              ? `${Math.abs(task.daysFromEvent)}d before` 
                              : task.daysFromEvent > 0 
                                ? `${task.daysFromEvent}d after`
                                : 'Event day'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Last updated: {template.metadata.lastUpdated}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onImport}>
              Import Template
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
