import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Edit, Eye, Clock, CheckCircle2, Plus, MoreVertical, Trash2, Loader2, Send } from 'lucide-react';
import { 
  useBlogArticles, 
  useCreateBlogArticle, 
  useUpdateBlogArticle, 
  useDeleteBlogArticle,
  useBlogArticleStats,
  type ArticleStatus,
  type BlogArticle,
} from '@/hooks/useBlogArticles';
import { format } from 'date-fns';

interface BlogArticleTrackerProps {
  workspaceId: string;
}

export function BlogArticleTracker({ workspaceId }: BlogArticleTrackerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  
  const { data: articles, isLoading } = useBlogArticles(workspaceId);
  const { publishedCount, totalViews } = useBlogArticleStats(workspaceId);
  const createArticle = useCreateBlogArticle(workspaceId);
  const updateArticle = useUpdateBlogArticle(workspaceId);
  const deleteArticle = useDeleteBlogArticle(workspaceId);

  const [newArticle, setNewArticle] = useState({
    title: '',
    author_name: '',
    description: '',
    target_word_count: 1000,
  });

  const [editForm, setEditForm] = useState({
    title: '',
    author_name: '',
    description: '',
    word_count: 0,
    target_word_count: 1000,
    status: 'draft' as ArticleStatus,
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      draft: { color: 'bg-muted text-muted-foreground', icon: <Edit className="h-3 w-3" />, label: 'Draft' },
      review: { color: 'bg-amber-500/10 text-amber-600', icon: <Eye className="h-3 w-3" />, label: 'In Review' },
      scheduled: { color: 'bg-blue-500/10 text-blue-600', icon: <Clock className="h-3 w-3" />, label: 'Scheduled' },
      published: { color: 'bg-emerald-500/10 text-emerald-600', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Published' },
    };
    return configs[status] || configs.draft;
  };

  const handleCreate = async () => {
    if (!newArticle.title.trim()) return;
    
    await createArticle.mutateAsync({
      title: newArticle.title,
      author_name: newArticle.author_name || undefined,
      description: newArticle.description || undefined,
      target_word_count: newArticle.target_word_count,
    });
    
    setNewArticle({ title: '', author_name: '', description: '', target_word_count: 1000 });
    setIsCreateOpen(false);
  };

  const handleEdit = (article: BlogArticle) => {
    setSelectedArticle(article);
    setEditForm({
      title: article.title,
      author_name: article.author_name || '',
      description: article.description || '',
      word_count: article.word_count,
      target_word_count: article.target_word_count,
      status: article.status,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedArticle) return;
    
    await updateArticle.mutateAsync({
      articleId: selectedArticle.id,
      updates: {
        title: editForm.title,
        author_name: editForm.author_name || undefined,
        description: editForm.description || undefined,
        word_count: editForm.word_count,
        target_word_count: editForm.target_word_count,
        status: editForm.status,
      },
    });
    
    setIsEditOpen(false);
    setSelectedArticle(null);
  };

  const handleStatusChange = async (articleId: string, newStatus: ArticleStatus) => {
    await updateArticle.mutateAsync({
      articleId,
      updates: { status: newStatus },
    });
  };

  const handleDelete = async (articleId: string) => {
    await deleteArticle.mutateAsync(articleId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Blog & Articles
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {publishedCount} published • {totalViews} total views
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-3 w-3 mr-1" />
                New Article
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Article</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    placeholder="Enter article title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={newArticle.author_name}
                    onChange={(e) => setNewArticle({ ...newArticle, author_name: e.target.value })}
                    placeholder="Author name..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newArticle.description}
                    onChange={(e) => setNewArticle({ ...newArticle, description: e.target.value })}
                    placeholder="Brief description..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_words">Target Word Count</Label>
                  <Input
                    id="target_words"
                    type="number"
                    value={newArticle.target_word_count}
                    onChange={(e) => setNewArticle({ ...newArticle, target_word_count: parseInt(e.target.value) || 1000 })}
                    min={100}
                    step={100}
                  />
                </div>
                <Button 
                  onClick={handleCreate} 
                  disabled={!newArticle.title.trim() || createArticle.isPending}
                  className="w-full"
                >
                  {createArticle.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Article
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!articles?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No articles yet</p>
            <p className="text-xs">Create your first article to get started</p>
          </div>
        ) : (
          articles.map((article) => {
            const statusConfig = getStatusConfig(article.status);
            const progress = article.target_word_count > 0 
              ? (article.word_count / article.target_word_count) * 100 
              : 0;

            return (
              <div
                key={article.id}
                className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{article.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {article.author_name ? `by ${article.author_name}` : 'No author assigned'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${statusConfig.color} text-xs shrink-0`}>
                      <span className="mr-1">{statusConfig.icon}</span>
                      {statusConfig.label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(article)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(article.id, 'review')}
                          disabled={article.status === 'review'}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Submit for Review
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(article.id, 'published')}
                          disabled={article.status === 'published'}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(article.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-1">
                  <Progress value={Math.min(progress, 100)} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {article.word_count}/{article.target_word_count} words
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {article.scheduled_publish_date && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(article.scheduled_publish_date), 'MMM d, yyyy')}
                    </span>
                  )}
                  {article.published_at && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Published {format(new Date(article.published_at), 'MMM d, yyyy')}
                    </span>
                  )}
                  {article.view_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.view_count} views
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-author">Author</Label>
              <Input
                id="edit-author"
                value={editForm.author_name}
                onChange={(e) => setEditForm({ ...editForm, author_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-word-count">Current Word Count</Label>
                <Input
                  id="edit-word-count"
                  type="number"
                  value={editForm.word_count}
                  onChange={(e) => setEditForm({ ...editForm, word_count: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-target-words">Target Word Count</Label>
                <Input
                  id="edit-target-words"
                  type="number"
                  value={editForm.target_word_count}
                  onChange={(e) => setEditForm({ ...editForm, target_word_count: parseInt(e.target.value) || 1000 })}
                  min={100}
                  step={100}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={editForm.status} 
                onValueChange={(value) => setEditForm({ ...editForm, status: value as ArticleStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleUpdate} 
              disabled={!editForm.title.trim() || updateArticle.isPending}
              className="w-full"
            >
              {updateArticle.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
