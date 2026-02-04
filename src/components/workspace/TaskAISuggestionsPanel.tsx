import { useState } from 'react';
import { Sparkles, Plus, X, Clock, ChevronDown, ChevronUp, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { TaskSuggestion, useTaskAISuggestions } from '@/hooks/useTaskAISuggestions';
import { PRIORITY_CONFIG_EXTENDED, PHASE_CONFIG } from '@/lib/taskTemplates';

interface TaskAISuggestionsPanelProps {
  eventName?: string;
  eventCategory?: string;
  startDate?: string;
  endDate?: string;
  existingTasks: string[];
  workspaceType?: string;
  onAddTask: (suggestion: TaskSuggestion) => void;
}

export function TaskAISuggestionsPanel({
  eventName,
  eventCategory,
  startDate,
  endDate,
  existingTasks,
  workspaceType,
  onAddTask,
}: TaskAISuggestionsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    dismissSuggestion,
    hasSuggestions,
  } = useTaskAISuggestions({
    eventName,
    eventCategory,
    startDate,
    endDate,
    existingTasks,
    workspaceType,
  });

  const handleAddTask = (suggestion: TaskSuggestion, index: number) => {
    onAddTask(suggestion);
    dismissSuggestion(index);
  };

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_CONFIG_EXTENDED[priority as keyof typeof PRIORITY_CONFIG_EXTENDED] || PRIORITY_CONFIG_EXTENDED.MEDIUM;
  };

  const getPhaseConfig = (phase: string) => {
    return PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG] || PHASE_CONFIG.PRE_EVENT;
  };

  const canGenerate = eventName && eventCategory && startDate;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">AI Task Suggestions</h3>
              {hasSuggestions && (
                <Badge variant="secondary" className="ml-2">
                  {suggestions.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!hasSuggestions && !isLoading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchSuggestions();
                  }}
                  disabled={!canGenerate || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      Generate
                    </>
                  )}
                </Button>
              )}
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            {!canGenerate && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Event details required to generate suggestions.
              </p>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg mb-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchSuggestions}
                  className="ml-auto"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Generating suggestions...</span>
              </div>
            )}

            {!isLoading && hasSuggestions && (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => {
                  const priorityConfig = getPriorityConfig(suggestion.priority);
                  const phaseConfig = getPhaseConfig(suggestion.phase);

                  return (
                    <div
                      key={`${suggestion.title}-${index}`}
                      className="p-3 bg-background border border-border rounded-lg hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm truncate">
                            {suggestion.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {suggestion.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <Badge
                              variant="outline"
                              className={cn('text-xs', priorityConfig.color)}
                            >
                              {suggestion.priority}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn('text-xs', phaseConfig.color)}
                            >
                              {phaseConfig.label}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.category}
                            </Badge>
                            {suggestion.estimatedHours && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {suggestion.estimatedHours}h
                              </span>
                            )}
                          </div>
                          {suggestion.subtasks && suggestion.subtasks.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              + {suggestion.subtasks.length} subtasks
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleAddTask(suggestion, index)}
                          >
                            <Plus className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => dismissSuggestion(index)}
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchSuggestions}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn('h-4 w-4 mr-1', isLoading && 'animate-spin')} />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}

            {!isLoading && !hasSuggestions && canGenerate && !error && (
              <div className="text-center py-6">
                <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  Get AI-powered task suggestions based on your event
                </p>
                <Button onClick={fetchSuggestions} size="sm">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Generate Suggestions
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
