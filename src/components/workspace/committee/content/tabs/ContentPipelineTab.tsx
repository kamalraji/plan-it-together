import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { 
  GitBranch, 
  Plus, 
  Edit2, 
  
  Eye,
  CheckCircle,
  Clock,
  Upload,
  ArrowRight,
} from 'lucide-react';
import { 
  useContentItems, 
  useCreateContentItem,
  useUpdateContentStatus,
  ContentItem,
} from '@/hooks/useContentCommitteeData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ContentPipelineTabProps {
  workspaceId: string;
}

const PIPELINE_STAGES = [
  { id: 'draft', label: 'Draft', icon: Edit2, color: 'bg-slate-500' },
  { id: 'review', label: 'In Review', icon: Eye, color: 'bg-purple-500' },
  { id: 'approved', label: 'Approved', icon: CheckCircle, color: 'bg-emerald-500' },
  { id: 'scheduled', label: 'Scheduled', icon: Clock, color: 'bg-blue-500' },
  { id: 'published', label: 'Published', icon: Upload, color: 'bg-cyan-500' },
];

const CONTENT_TYPES = [
  { value: 'article', label: 'Article' },
  { value: 'blog', label: 'Blog Post' },
  { value: 'social_post', label: 'Social Post' },
  { value: 'email', label: 'Email' },
  { value: 'press_release', label: 'Press Release' },
  { value: 'announcement', label: 'Announcement' },
];

export function ContentPipelineTab({ workspaceId }: ContentPipelineTabProps) {
  const { data: contentItems = [], isLoading } = useContentItems(workspaceId);
  const createContent = useCreateContentItem();
  const updateStatus = useUpdateContentStatus();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content_type: 'article',
    description: '',
    category: '',
  });

  // Group items by status
  const itemsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = contentItems.filter((item) => item.status === stage.id);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  const handleCreateContent = () => {
    createContent.mutate({
      workspace_id: workspaceId,
      title: formData.title,
      content_type: formData.content_type,
      description: formData.description,
      category: formData.category,
      status: 'draft',
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        resetForm();
      },
    });
  };

  const handleMoveItem = (item: ContentItem) => {
    setSelectedItem(item);
    setNewStatus('');
    setMoveDialogOpen(true);
  };

  const handleConfirmMove = () => {
    if (!selectedItem || !newStatus) return;

    updateStatus.mutate({
      id: selectedItem.id,
      status: newStatus,
      workspaceId,
    }, {
      onSuccess: () => {
        setMoveDialogOpen(false);
        setSelectedItem(null);
      },
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content_type: 'article',
      description: '',
      category: '',
    });
  };

  const getNextStages = (currentStatus: string) => {
    const currentIndex = PIPELINE_STAGES.findIndex((s) => s.id === currentStatus);
    if (currentIndex === -1) return PIPELINE_STAGES;
    // Allow moving forward or back one stage
    return PIPELINE_STAGES.filter((_, index) => 
      index !== currentIndex && Math.abs(index - currentIndex) <= 2
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-rose-500" />
            Content Pipeline
          </h2>
          <p className="text-muted-foreground mt-1">
            Visualize and manage content through the publication workflow
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Content
        </Button>
      </div>

      {/* Pipeline Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PIPELINE_STAGES.map((stage) => {
            const StageIcon = stage.icon;
            const items = itemsByStage[stage.id] || [];

            return (
              <Card key={stage.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-1.5 rounded text-white', stage.color)}>
                        <StageIcon className="h-4 w-4" />
                      </div>
                      {stage.label}
                    </div>
                    <Badge variant="secondary">{items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2 pr-2">
                      {items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No items
                        </div>
                      ) : (
                        items.map((item) => (
                          <Card
                            key={item.id}
                            className="bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleMoveItem(item)}
                          >
                            <CardContent className="p-3">
                              <p className="font-medium text-sm line-clamp-2 mb-2">
                                {item.title}
                              </p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {item.content_type}
                                </Badge>
                                <span>{format(new Date(item.created_at), 'MMM d')}</span>
                              </div>
                              {item.author_name && (
                                <p className="text-xs text-muted-foreground mt-2 truncate">
                                  By {item.author_name}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-8">
            {PIPELINE_STAGES.map((stage, index) => {
              const StageIcon = stage.icon;
              const count = itemsByStage[stage.id]?.length || 0;
              return (
                <React.Fragment key={stage.id}>
                  <div className="flex items-center gap-2">
                    <div className={cn('p-2 rounded text-white', stage.color)}>
                      <StageIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{stage.label}</p>
                    </div>
                  </div>
                  {index < PIPELINE_STAGES.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create Content Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Content</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter content title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

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
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Marketing, News..."
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the content..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateContent}
              disabled={!formData.title || createContent.isPending}
            >
              {createContent.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Item Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Content</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-medium">{selectedItem?.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Current status: <Badge variant="outline">{selectedItem?.status}</Badge>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Move to</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedItem && getNextStages(selectedItem.status).map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      <div className="flex items-center gap-2">
                        <stage.icon className="h-4 w-4" />
                        {stage.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmMove}
              disabled={!newStatus || updateStatus.isPending}
            >
              {updateStatus.isPending ? 'Moving...' : 'Move'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
