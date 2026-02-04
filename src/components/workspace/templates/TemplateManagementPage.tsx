import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  ENHANCED_WORKSPACE_TEMPLATES, 
  EnhancedWorkspaceTemplate, 
  getTemplateCategories 
} from '@/lib/workspaceTemplates';
import { 
  MagnifyingGlassIcon,
  FolderIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { TemplatePreviewModal } from '../TemplatePreviewModal';

interface TemplateManagementPageProps {
  onSelectTemplate?: (template: EnhancedWorkspaceTemplate) => void;
  title?: string;
  description?: string;
}

export function TemplateManagementPage({
  onSelectTemplate,
  title = 'Template Library',
  description = 'Browse and manage workspace templates for your events',
}: TemplateManagementPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<EnhancedWorkspaceTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'SIMPLE' | 'MODERATE' | 'COMPLEX'>('all');

  const categories = ['all', ...getTemplateCategories()];

  // Filter templates
  const filteredTemplates = ENHANCED_WORKSPACE_TEMPLATES.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesComplexity = activeTab === 'all' || template.complexity === activeTab;
    
    return matchesSearch && matchesCategory && matchesComplexity;
  });

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

  const templateCounts = {
    all: ENHANCED_WORKSPACE_TEMPLATES.length,
    SIMPLE: ENHANCED_WORKSPACE_TEMPLATES.filter(t => t.complexity === 'SIMPLE').length,
    MODERATE: ENHANCED_WORKSPACE_TEMPLATES.filter(t => t.complexity === 'MODERATE').length,
    COMPLEX: ENHANCED_WORKSPACE_TEMPLATES.filter(t => t.complexity === 'COMPLEX').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className="self-start">
          {filteredTemplates.length} templates
        </Badge>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-muted-foreground" />
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize text-xs"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Complexity Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
              {templateCounts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="SIMPLE">
            Simple
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
              {templateCounts.SIMPLE}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="MODERATE">
            Moderate
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
              {templateCounts.MODERATE}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="COMPLEX">
            Complex
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
              {templateCounts.COMPLEX}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredTemplates.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No templates found matching your criteria</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setActiveTab('all');
                }}
              >
                Clear Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const Icon = template.icon;
                const deptCount = template.structure.departments.length;
                const committeeCount = template.structure.departments.reduce(
                  (acc, d) => acc + d.committees.length, 0
                );
                const taskCount = template.structure.tasks.length;
                const milestoneCount = template.structure.milestones.length;

                return (
                  <Card 
                    key={template.id} 
                    className="group hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge 
                                variant="outline" 
                                className={cn("text-[10px] px-1.5", getComplexityColor(template.complexity))}
                              >
                                {template.complexity}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={cn("text-[10px] px-1.5 capitalize", getCategoryColor(template.category))}
                              >
                                {template.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>

                      {/* Stats */}
                      {template.id !== 'blank' && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <FolderIcon className="h-3.5 w-3.5" />
                            <span>{deptCount} depts</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <UsersIcon className="h-3.5 w-3.5" />
                            <span>{committeeCount} committees</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <ClipboardDocumentListIcon className="h-3.5 w-3.5" />
                            <span>{taskCount} tasks</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <CalendarDaysIcon className="h-3.5 w-3.5" />
                            <span>{milestoneCount} milestones</span>
                          </div>
                        </div>
                      )}

                      {/* Size Range */}
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {template.eventSizeRange.min.toLocaleString()}-{template.eventSizeRange.max.toLocaleString()} attendees
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {template.suggestedTeamSize.min}-{template.suggestedTeamSize.max} team
                        </Badge>
                      </div>

                      {/* Departments Preview */}
                      {template.id !== 'blank' && template.structure.departments.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Departments</p>
                          <div className="flex flex-wrap gap-1">
                            {template.structure.departments.slice(0, 4).map((dept) => (
                              <Badge key={dept.id} variant="outline" className="text-[10px] px-1.5">
                                {dept.name}
                              </Badge>
                            ))}
                            {template.structure.departments.length > 4 && (
                              <Badge variant="outline" className="text-[10px] px-1.5">
                                +{template.structure.departments.length - 4}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        {onSelectTemplate && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => onSelectTemplate(template)}
                          >
                            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                            Use
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          open={!!previewTemplate}
          onOpenChange={(open) => !open && setPreviewTemplate(null)}
          onApplyTemplate={(template) => {
            if (onSelectTemplate) {
              onSelectTemplate(template);
            }
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
}