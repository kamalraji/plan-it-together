/**
 * Template Selection Section - Event Form
 * Allows users to select a workspace template during event creation
 */
import React, { useState } from 'react';
import { LayoutTemplate, ChevronRight, Star, Users, CheckCircle2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader, FormSectionWrapper } from '../SectionComponents';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export interface SelectedTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  eventSizeMin: number;
  eventSizeMax: number;
}

interface TemplateSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  stepNumber: number;
  selectedTemplate: SelectedTemplate | null;
  onTemplateSelect: (template: SelectedTemplate | null) => void;
  eventCategory?: string;
  eventCapacity?: number;
}

interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  industry_type: string | null;
  event_type: string | null;
  complexity: string | null;
  event_size_min: number | null;
  event_size_max: number | null;
  usage_count: number | null;
  effectiveness: number | null;
}

export const TemplateSection: React.FC<TemplateSectionProps> = ({
  isOpen,
  onToggle,
  stepNumber,
  selectedTemplate,
  onTemplateSelect,
  eventCategory,
  eventCapacity,
}) => {
  const [showAll, setShowAll] = useState(false);

  // Fetch templates from database
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['workspace-templates-for-event', eventCategory],
    queryFn: async () => {
      let query = supabase
        .from('workspace_templates')
        .select('id, name, description, industry_type, event_type, complexity, event_size_min, event_size_max, usage_count, effectiveness')
        .eq('is_public', true)
        .order('usage_count', { ascending: false });

      // Filter by event type if category is set
      if (eventCategory) {
        query = query.eq('event_type', eventCategory);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return (data || []) as TemplateData[];
    },
  });

  // Filter templates by capacity if provided
  const filteredTemplates = templates.filter((t) => {
    if (!eventCapacity) return true;
    const min = t.event_size_min || 0;
    const max = t.event_size_max || 9999;
    return eventCapacity >= min && eventCapacity <= max;
  });

  const displayedTemplates = showAll ? filteredTemplates : filteredTemplates.slice(0, 6);

  const getComplexityColor = (complexity: string | null) => {
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

  const handleTemplateClick = (template: TemplateData) => {
    if (selectedTemplate?.id === template.id) {
      onTemplateSelect(null);
    } else {
      onTemplateSelect({
        id: template.id,
        name: template.name,
        description: template.description || '',
        category: template.event_type || template.industry_type || 'General',
        complexity: template.complexity || 'MODERATE',
        eventSizeMin: template.event_size_min || 0,
        eventSizeMax: template.event_size_max || 9999,
      });
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
        <div className="relative">
          <SectionHeader
            title="Workspace Template"
            description={selectedTemplate ? `Selected: ${selectedTemplate.name}` : "Choose a pre-built structure for your event team"}
            icon={LayoutTemplate}
            isOpen={isOpen}
            stepNumber={stepNumber}
          />
          {selectedTemplate && !isOpen && (
            <Badge variant="secondary" className="absolute top-4 right-12 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Selected
            </Badge>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FormSectionWrapper>
          {/* Info Banner */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <LayoutTemplate className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Why use a template?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Templates provide a pre-configured workspace structure with roles, tasks, channels,
                  and milestones tailored for your event type. Save hours of setup time.
                </p>
              </div>
            </div>
          </div>

          {/* Skip Option */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30">
            <div>
              <p className="text-sm font-medium text-foreground">Start from scratch?</p>
              <p className="text-xs text-muted-foreground">You can skip template selection and configure your workspace manually.</p>
            </div>
            <Button
              variant={selectedTemplate === null ? "default" : "outline"}
              size="sm"
              onClick={() => onTemplateSelect(null)}
            >
              {selectedTemplate === null ? 'No template selected' : 'Clear selection'}
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Template Grid */}
          {!isLoading && displayedTemplates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedTemplates.map((template) => {
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateClick(template)}
                    className={cn(
                      'text-left p-4 rounded-xl border-2 transition-all hover:shadow-md',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border/50 bg-card hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{template.name}</h4>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {template.description || 'Pre-configured workspace template'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={getComplexityColor(template.complexity)}>
                        {template.complexity || 'Moderate'}
                      </Badge>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{template.event_size_min || 0}-{template.event_size_max || '∞'}</span>
                      </div>

                      {template.effectiveness && template.effectiveness > 0 && (
                        <div className="flex items-center gap-1 text-xs text-warning">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{template.effectiveness.toFixed(1)}</span>
                        </div>
                      )}

                      {template.usage_count && template.usage_count > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Used {template.usage_count}×
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && displayedTemplates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <LayoutTemplate className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No templates available</p>
              <p className="text-sm">Templates matching your event settings will appear here.</p>
            </div>
          )}

          {/* Show More Button */}
          {filteredTemplates.length > 6 && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show ${filteredTemplates.length - 6} More Templates`}
              <ChevronRight className={cn('h-4 w-4 ml-2 transition-transform', showAll && 'rotate-90')} />
            </Button>
          )}
        </FormSectionWrapper>
      </CollapsibleContent>
    </Collapsible>
  );
};
