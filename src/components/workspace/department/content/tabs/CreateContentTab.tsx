import { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  useContentItems, 
  useCreateContentItem, 
  useUpdateContentItemStatus,
  ContentItemStatus,
  ContentItemType,
  ContentItemPriority,
} from '@/hooks/useContentDepartmentData';
import { FileText, Plus, Clock, CheckCircle, Loader2, Edit2, FileCheck, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateContentTabProps {
  workspace: Workspace;
}

const CONTENT_TYPES: { value: ContentItemType; label: string }[] = [
  { value: 'article', label: 'Article' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' },
];

const PRIORITY_OPTIONS: { value: ContentItemPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-muted-foreground' },
  { value: 'medium', label: 'Medium', color: 'text-amber-500' },
  { value: 'high', label: 'High', color: 'text-red-500' },
];

const STATUS_OPTIONS: { value: ContentItemStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'draft', label: 'Draft', icon: <Edit2 className="h-3 w-3" />, color: 'bg-muted-foreground/30/10 text-muted-foreground border-gray-500/30' },
  { value: 'review', label: 'In Review', icon: <Clock className="h-3 w-3" />, color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  { value: 'approved', label: 'Approved', icon: <FileCheck className="h-3 w-3" />, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  { value: 'published', label: 'Published', icon: <CheckCircle className="h-3 w-3" />, color: 'bg-green-500/10 text-green-600 border-green-500/30' },
];

export function CreateContentTab({ workspace }: CreateContentTabProps) {
  const queryClient = useQueryClient();
  const { data: contentItems, isLoading } = useContentItems(workspace.id);
  const createContentMutation = useCreateContentItem(workspace.id);
  const updateStatusMutation = useUpdateContentItemStatus(workspace.id);
  
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ContentItemStatus | 'all'>('all');
  const [formData, setFormData] = useState({
    title: '',
    type: '' as ContentItemType | '',
    priority: 'medium' as ContentItemPriority,
    description: '',
    due_date: '',
    content_url: '',
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('workspace_content_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-items', workspace.id] });
      toast.success('Content item deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.type) return;

    createContentMutation.mutate({
      title: formData.title,
      type: formData.type as ContentItemType,
      priority: formData.priority,
      description: formData.description || null,
      due_date: formData.due_date || null,
      content_url: formData.content_url || null,
      status: 'draft',
      author_id: null,
      author_name: null,
    }, {
      onSuccess: () => {
        setFormData({ title: '', type: '', priority: 'medium', description: '', due_date: '', content_url: '' });
        setShowForm(false);
      },
    });
  };

  const handleStatusChange = (itemId: string, newStatus: ContentItemStatus) => {
    updateStatusMutation.mutate({ itemId, status: newStatus });
  };

  const getStatusBadge = (status: ContentItemStatus) => {
    const statusConfig = STATUS_OPTIONS.find(s => s.value === status);
    if (!statusConfig) return null;
    return (
      <Badge variant="outline" className={cn('gap-1', statusConfig.color)}>
        {statusConfig.icon}
        {statusConfig.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: ContentItemPriority) => {
    const config = PRIORITY_OPTIONS.find(p => p.value === priority);
    return (
      <Badge variant="outline" className={cn('text-xs', config?.color)}>
        {config?.label || priority}
      </Badge>
    );
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('all')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('draft')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-muted-foreground">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('review')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{stats.review}</div>
            <p className="text-xs text-muted-foreground">In Review</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('approved')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('published')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Content Form */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Create Content
            </CardTitle>
            <CardDescription>Add and manage content items for your department</CardDescription>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Content
            </Button>
          )}
        </CardHeader>

        {showForm && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Content title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Content Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as ContentItemType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as ContentItemPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_url">Content URL (optional)</Label>
                <Input
                  id="content_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.content_url}
                  onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
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

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createContentMutation.isPending}>
                  {createContentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Content
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Content List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Content Pipeline</CardTitle>
            <CardDescription>
              {statusFilter === 'all' ? 'All content items' : `Showing ${statusFilter} items`}
            </CardDescription>
          </div>
          {statusFilter !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')}>
              Clear Filter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content items found</p>
              <p className="text-sm">Click "New Content" to create your first item.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{item.title}</span>
                      {getStatusBadge(item.status)}
                      {getPriorityBadge(item.priority)}
                      <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {item.due_date && (
                        <span className={cn(
                          new Date(item.due_date) < new Date() && item.status !== 'published' && 'text-red-500'
                        )}>
                          Due: {format(new Date(item.due_date), 'MMM d, yyyy')}
                        </span>
                      )}
                      <span>Created: {format(new Date(item.created_at), 'MMM d')}</span>
                      {item.description && (
                        <span className="truncate max-w-[200px]">{item.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Select
                      value={item.status}
                      onValueChange={(value) => handleStatusChange(item.id, value as ContentItemStatus)}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {item.content_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(item.content_url!, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteContentMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
