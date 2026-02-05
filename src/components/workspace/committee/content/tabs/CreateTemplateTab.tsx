import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layers, Plus, Copy, Trash2, FileText, BarChart3 } from 'lucide-react';
import { useContentTemplates, useCreateTemplate, useDeleteTemplate, useUseTemplate, ContentTemplate } from '@/hooks/useContentCommitteeData';

interface CreateTemplateTabProps {
  workspaceId: string;
}

const CONTENT_TYPES = [
  { value: 'article', label: 'Article' },
  { value: 'blog', label: 'Blog Post' },
  { value: 'social_post', label: 'Social Media Post' },
  { value: 'email', label: 'Email Newsletter' },
  { value: 'press_release', label: 'Press Release' },
  { value: 'announcement', label: 'Announcement' },
];

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'news', label: 'News' },
  { value: 'events', label: 'Events' },
  { value: 'updates', label: 'Updates' },
  { value: 'internal', label: 'Internal' },
];

export function CreateTemplateTab({ workspaceId }: CreateTemplateTabProps) {
  const { data: templates = [], isLoading } = useContentTemplates(workspaceId);
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const useTemplate = useUseTemplate();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [newContentTitle, setNewContentTitle] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    content_type: 'article',
    sample_content: '',
  });

  const handleCreateTemplate = () => {
    createTemplate.mutate({
      workspace_id: workspaceId,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      content_type: formData.content_type,
      sample_content: formData.sample_content,
      template_structure: {},
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        resetForm();
      },
    });
  };

  const handleDeleteTemplate = (template: ContentTemplate) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      deleteTemplate.mutate({ id: template.id, workspaceId });
    }
  };

  const handleOpenUseDialog = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    setNewContentTitle('');
    setUseDialogOpen(true);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate || !newContentTitle) return;

    useTemplate.mutate({
      templateId: selectedTemplate.id,
      workspaceId,
      title: newContentTitle,
    }, {
      onSuccess: () => {
        setUseDialogOpen(false);
        setSelectedTemplate(null);
        setNewContentTitle('');
      },
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'general',
      content_type: 'article',
      sample_content: '',
    });
  };

  const getContentTypeLabel = (type: string) => {
    return CONTENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-info" />
            Content Templates
          </h2>
          <p className="text-muted-foreground mt-1">
            Create reusable templates for consistent content creation
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first template to streamline content creation
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">{getContentTypeLabel(template.content_type)}</Badge>
                      <Badge variant="secondary">{getCategoryLabel(template.category)}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 mb-4">
                  {template.description || 'No description'}
                </CardDescription>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <BarChart3 className="h-4 w-4" />
                  <span>Used {template.usage_count} times</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenUseDialog(template)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Use
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Weekly Newsletter"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this template is for..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(value) => setFormData({ ...formData, content_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sample">Sample Content / Structure</Label>
                <Textarea
                  id="sample"
                  placeholder="Provide sample content or structure guidelines..."
                  value={formData.sample_content}
                  onChange={(e) => setFormData({ ...formData, sample_content: e.target.value })}
                  rows={6}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!formData.name || createTemplate.isPending}
            >
              {createTemplate.isPending ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Use Template Dialog */}
      <Dialog open={useDialogOpen} onOpenChange={setUseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create from Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">{selectedTemplate?.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedTemplate?.description || 'No description'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content-title">Content Title *</Label>
              <Input
                id="content-title"
                placeholder="Enter title for the new content..."
                value={newContentTitle}
                onChange={(e) => setNewContentTitle(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUseTemplate}
              disabled={!newContentTitle || useTemplate.isPending}
            >
              {useTemplate.isPending ? 'Creating...' : 'Create Content'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
