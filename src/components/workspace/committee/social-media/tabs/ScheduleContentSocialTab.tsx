import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, Plus, Edit2, Trash2, Instagram, Twitter, Linkedin, Facebook, Youtube } from 'lucide-react';
import { format } from 'date-fns';
import { useSocialPosts, useCreateSocialPost, useUpdateSocialPost, useDeleteSocialPost, useHashtags, SocialPost } from '@/hooks/useSocialMediaCommitteeData';

interface ScheduleContentSocialTabProps {
  workspaceId: string;
}

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'text-sky-500' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500' },
];

const POST_TYPES = [
  { id: 'image', label: 'Image Post' },
  { id: 'video', label: 'Video' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'text', label: 'Text Only' },
  { id: 'story', label: 'Story' },
  { id: 'reel', label: 'Reel/Short' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted-foreground/30/20 text-muted-foreground',
  scheduled: 'bg-blue-500/20 text-blue-600',
  published: 'bg-emerald-500/20 text-emerald-600',
  failed: 'bg-red-500/20 text-red-600',
};

export function ScheduleContentSocialTab({ workspaceId }: ScheduleContentSocialTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('');
  const [postType, setPostType] = useState('image');
  const [scheduledFor, setScheduledFor] = useState('');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);

  // Queries
  const { data: posts = [], isLoading } = useSocialPosts(workspaceId, statusFilter !== 'all' ? { status: statusFilter } : undefined);
  const { data: hashtags = [] } = useHashtags(workspaceId);

  // Mutations
  const createPost = useCreateSocialPost(workspaceId);
  const updatePost = useUpdateSocialPost(workspaceId);
  const deletePost = useDeleteSocialPost(workspaceId);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPlatform('');
    setPostType('image');
    setScheduledFor('');
    setSelectedHashtags([]);
    setEditingPost(null);
  };

  const openEditDialog = (post: SocialPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content || '');
    setPlatform(post.platform);
    setPostType(post.post_type);
    setScheduledFor(post.scheduled_for ? format(new Date(post.scheduled_for), "yyyy-MM-dd'T'HH:mm") : '');
    setSelectedHashtags(post.hashtags);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const postData = {
      title,
      content,
      platform,
      post_type: postType,
      scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      hashtags: selectedHashtags,
      status: scheduledFor ? 'scheduled' : 'draft',
    };

    if (editingPost) {
      updatePost.mutate({ id: editingPost.id, ...postData });
    } else {
      createPost.mutate(postData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePost.mutate(id);
    }
  };

  const getPlatformIcon = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return null;
    const Icon = platform.icon;
    return <Icon className={`h-4 w-4 ${platform.color}`} />;
  };

  const toggleHashtag = (tag: string) => {
    setSelectedHashtags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Schedule</h2>
          <p className="text-muted-foreground">Plan and schedule your social media content</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Post title or caption"
                />
              </div>

              <div>
                <Label>Content</Label>
                <Textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post content..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">{content.length} characters</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <p.icon className={`h-4 w-4 ${p.color}`} />
                            {p.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Post Type</Label>
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POST_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Schedule For</Label>
                <Input 
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty to save as draft</p>
              </div>

              {hashtags.length > 0 && (
                <div>
                  <Label>Hashtags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {hashtags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedHashtags.includes(tag.tag) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleHashtag(tag.tag)}
                      >
                        #{tag.tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!title || !platform}>
                  {editingPost ? 'Update Post' : 'Create Post'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'draft', 'scheduled', 'published', 'failed'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No posts yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first social media post to get started
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>Create Post</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(post.platform)}
                    <Badge variant="outline" className="capitalize text-xs">
                      {post.post_type}
                    </Badge>
                  </div>
                  <Badge className={STATUS_COLORS[post.status]}>
                    {post.status}
                  </Badge>
                </div>
                <CardTitle className="text-base line-clamp-2 mt-2">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {post.content && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {post.content}
                  </p>
                )}

                {post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.hashtags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                    ))}
                    {post.hashtags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">+{post.hashtags.length - 3}</Badge>
                    )}
                  </div>
                )}

                {post.scheduled_for && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Clock className="h-3 w-3" />
                    {format(new Date(post.scheduled_for), 'MMM d, yyyy h:mm a')}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(post)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  {post.status === 'published' && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>❤️ {post.engagement_likes}</span>
                      <span>💬 {post.engagement_comments}</span>
                      <span>🔄 {post.engagement_shares}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
