import { useState } from 'react';
import { Search, Clock, Users, FileText, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIndustryTemplates } from '@/hooks/useIndustryTemplates';
import { IndustryType, INDUSTRY_CONFIG } from '@/lib/industryTemplateTypes';
import { IndustryTemplatePreview } from './IndustryTemplatePreview';
import { TemplateImportWizard } from './TemplateImportWizard';
import { IndustryTaskTemplate } from '@/lib/industryTemplateTypes';

interface IndustryTemplateBrowserProps {
  workspaceId: string;
  eventDate?: Date;
}

export function IndustryTemplateBrowser({ workspaceId, eventDate }: IndustryTemplateBrowserProps) {
  const {
    filteredTemplates,
    selectedIndustry,
    setSelectedIndustry,
    searchQuery,
    setSearchQuery,
  } = useIndustryTemplates(workspaceId);

  const [previewTemplate, setPreviewTemplate] = useState<IndustryTaskTemplate | null>(null);
  const [importTemplate, setImportTemplate] = useState<IndustryTaskTemplate | null>(null);

  const industries: (IndustryType | 'all')[] = ['all', 'corporate', 'social', 'educational', 'entertainment', 'sports', 'nonprofit'];

  const getIndustryLabel = (industry: IndustryType | 'all'): string => {
    if (industry === 'all') return 'All';
    return INDUSTRY_CONFIG[industry].label;
  };

  const getTotalHours = (template: IndustryTaskTemplate): number => {
    return template.tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={selectedIndustry} onValueChange={(v) => setSelectedIndustry(v as IndustryType | 'all')}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {industries.map((industry) => (
            <TabsTrigger
              key={industry}
              value={industry}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm"
            >
              {industry !== 'all' && <span className="mr-1.5">{INDUSTRY_CONFIG[industry as IndustryType].icon}</span>}
              {getIndustryLabel(industry)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="border border-border rounded-xl bg-card p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{template.name}</h3>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {INDUSTRY_CONFIG[template.industry].label}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium">{template.metadata.rating}</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {template.description}
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>{template.tasks.length} tasks</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{getTotalHours(template)}h</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{template.estimatedTeamSize.min}-{template.estimatedTeamSize.max}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setPreviewTemplate(template)}
              >
                Preview
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => setImportTemplate(template)}
              >
                Import
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {previewTemplate && (
        <IndustryTemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onImport={() => {
            setImportTemplate(previewTemplate);
            setPreviewTemplate(null);
          }}
        />
      )}

      {importTemplate && (
        <TemplateImportWizard
          template={importTemplate}
          workspaceId={workspaceId}
          eventDate={eventDate}
          onClose={() => setImportTemplate(null)}
        />
      )}
    </div>
  );
}
