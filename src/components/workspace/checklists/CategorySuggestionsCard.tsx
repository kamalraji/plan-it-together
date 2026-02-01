import { useState } from 'react';
import { Lightbulb, Plus, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ChecklistTemplate } from '@/lib/sharedChecklistTemplates';

interface CategorySuggestionsCardProps {
  templates: ChecklistTemplate[];
  eventCategory: string | null;
  onAddTemplate: (template: ChecklistTemplate) => void;
  isAdding: boolean;
  existingTitles: string[];
}

export function CategorySuggestionsCard({
  templates,
  eventCategory,
  onAddTemplate,
  isAdding,
  existingTitles,
}: CategorySuggestionsCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [addingTemplate, setAddingTemplate] = useState<string | null>(null);

  const formatCategory = (category: string | null) => {
    if (!category) return 'General';
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const phaseColors = {
    pre_event: 'bg-blue-500/10 text-blue-600',
    during_event: 'bg-amber-500/10 text-amber-600',
    post_event: 'bg-green-500/10 text-green-600',
  };

  const handleAdd = (template: ChecklistTemplate) => {
    setAddingTemplate(template.title);
    onAddTemplate(template);
  };

  // Filter out templates that already exist
  const availableTemplates = templates.filter(t => !existingTitles.includes(t.title));

  if (availableTemplates.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-amber-500/10 transition-colors rounded-t-xl">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Suggested for {formatCategory(eventCategory)} Events
                </h3>
                <p className="text-xs text-muted-foreground">
                  {availableTemplates.length} template{availableTemplates.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-3">
            {availableTemplates.map((template) => {
              const isTemplateAdding = isAdding && addingTemplate === template.title;
              const isAlreadyAdded = existingTitles.includes(template.title);

              return (
                <div
                  key={template.title}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{template.title}</span>
                      <Badge variant="secondary" className={cn('text-xs', phaseColors[template.phase])}>
                        {template.phase.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {template.items.length} items • {template.description}
                    </p>
                  </div>
                  
                  <Button
                    variant={isAlreadyAdded ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleAdd(template)}
                    disabled={isAdding || isAlreadyAdded}
                  >
                    {isTemplateAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isAlreadyAdded ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
