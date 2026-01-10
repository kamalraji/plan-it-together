import React, { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContentItems, useCreateContentItem, useUpdateContentItemStatus, ContentItemStatus, ContentItemType, ContentItemPriority } from '@/hooks/useContentDepartmentData';
import { FileText, Plus, Clock, CheckCircle, Eye, Send, Loader2, Filter, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface CreateContentTabProps {
  workspace: Workspace;
}

const CONTENT_TYPES: { value: ContentItemType; label: string }[] = [
  { value: 'article', label: 'Article' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' },
];

const PRIORITY_LEVELS: { value: ContentItemPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' },
];

const STATUS_CONFIG: Record<ContentItemStatus, { label: string; icon: React.ElementType; color: string }> = {
  draft: { label: 'Draft', icon: FileText, color: 'bg-slate-100 text-slate-700' },
  review: { label: 'In Review', icon: Eye, color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  published: { label: 'Published', icon: Send, color: 'bg-purple-100 text-purple-700' },
};

export function CreateContentTab({ workspace }: CreateContentTabProps) {
  const queryClient = useQueryClient();
  const { data: contentItems, isLoading } = useContentItems(workspace.id);
  const createMutation = useCreateContentItem(workspace.id);
  const updateStatusMutation = useUpdateContentItemStatus(workspace.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ContentItemType>('article');
  const [priority, setPriority] = useState<ContentItemPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentItemStatus | 'all'>('all');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || null,
      type,
      priority,
      status: 'draft',
      due_date: dueDate || null,
      content_url: contentUrl.trim() || null,
      author_id: user?.id || null,
      author_name: user?.email?.split('@')[0] || null,
    }, {
      onSuccess: () => {
        setTitle('');
        setDescription('');
        setType('article');
        setPriority('medium');
        setDueDate('');
        setContentUrl('');
      },
    });
  };

  const handleDelete = async (itemId: string) => {
    const { error } = await supabase
      .from('workspace_content_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error('Failed to delete: ' + error.message);
    } else {
      toast.success('Content item deleted');
      queryClient.invalidateQueries({ queryKey: ['content-items', workspace.id] });
    }
  };

  const filteredItems = contentItems?.filter(item => 
    statusFilter === 'all' || item.status === statusFilter
  ) || [];

  const stats = {
    total: contentItems?.length || 0,
    draft: contentItems?.filter(i => i.status === 'draft').length || 0,
    review: contentItems?.filter(i => i.status === 'review').length || 0,
    approved: contentItems?.filter(i => i.status === 'approved').length || 0,
    published: contentItems?.filter(i => i.status === 'published').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </CardContent>
        </Card>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <Card key={status} className="bg-muted/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats[status as ContentItemStatus]}</div>
              <div className="text-xs text-muted-foreground">{config.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create Content
            </CardTitle>
            <CardDescription>Add new content to the pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter content title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as ContentItemType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as ContentItemPriority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_LEVELS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-url">Content URL</Label>
                <Input
                  id="content-url"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the content..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Content
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Content List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Content Pipeline
              </CardTitle>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ContentItemStatus | 'all')}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No content items found
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredItems.map((item) => {
                    const statusConfig = STATUS_CONFIG[item.status];
                    const StatusIcon = statusConfig.icon;
                    const priorityConfig = PRIORITY_LEVELS.find(p => p.value === item.priority);

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{item.title}</h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                {item.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs capitalize">
                                {item.type}
                              </Badge>
                              <Badge className={`text-xs ${statusConfig.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              {priorityConfig && (
                                <Badge className={`text-xs ${priorityConfig.color}`}>
                                  {priorityConfig.label}
                                </Badge>
                              )}
                              {item.due_date && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(item.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Select
                              value={item.status}
                              onValueChange={(v) => updateStatusMutation.mutate({ itemId: item.id, status: v as ContentItemStatus })}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                                  <SelectItem key={value} value={value}>
                                    {config.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
