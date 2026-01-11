import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  Trash2, 
  Edit, 
  Plus,
  Twitter,
  Instagram,
  Linkedin,
  Facebook,
  CalendarDays,
  List
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  useSocialPosts, 
  useCreateSocialPost,
  useUpdateSocialPost, 
  useDeleteSocialPost,
  SocialPost
} from '@/hooks/useMarketingCommitteeData';

interface SchedulePostMarketingTabProps {
  workspaceId: string;
}

const platformOptions = [
  { id: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'text-sky-500', maxChars: 280 },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500', maxChars: 2200 },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', maxChars: 3000 },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500', maxChars: 63206 },
];

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-amber-500/20 text-amber-600',
  published: 'bg-emerald-500/20 text-emerald-600',
  failed: 'bg-red-500/20 text-red-600',
};

export function SchedulePostMarketingTab({ workspaceId }: SchedulePostMarketingTabProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showComposer, setShowComposer] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');
  const [scheduledFor, setScheduledFor] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [hashtags, setHashtags] = useState('');

  const { data: posts = [], isLoading } = useSocialPosts(workspaceId);
  const createPost = useCreateSocialPost(workspaceId);
  const updatePost = useUpdateSocialPost(workspaceId);
  const deletePost = useDeleteSocialPost(workspaceId);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedPlatform('twitter');
    setScheduledFor('');
    setScheduledTime('09:00');
    setHashtags('');
    setEditingPost(null);
    setShowComposer(false);
  };

  const handleSubmit = () => {
    const scheduledDateTime = scheduledFor && scheduledTime 
      ? new Date(`${scheduledFor}T${scheduledTime}`).toISOString()
      : null;

    const hashtagArray = hashtags
      .split(/[,\s]+/)
      .map(h => h.startsWith('#') ? h : `#${h}`)
      .filter(h => h.length > 1);

    if (editingPost) {
      updatePost.mutate({
        id: editingPost.id,
        title,
        content,
        platform: selectedPlatform,
        scheduled_for: scheduledDateTime,
        hashtags: hashtagArray,
        status: scheduledDateTime ? 'scheduled' : 'draft',
      }, { onSuccess: resetForm });
    } else {
      createPost.mutate({
        title,
        content,
        platform: selectedPlatform,
        scheduled_for: scheduledDateTime,
        hashtags: hashtagArray,
        status: scheduledDateTime ? 'scheduled' : 'draft',
      }, { onSuccess: resetForm });
    }
  };

  const handleEdit = (post: SocialPost) => {
    setEditingPost(post);
    setTitle(post.title || '');
    setContent(post.content || '');
    setSelectedPlatform(post.platform || 'twitter');
    if (post.scheduled_for) {
      const date = new Date(post.scheduled_for);
      setScheduledFor(format(date, 'yyyy-MM-dd'));
      setScheduledTime(format(date, 'HH:mm'));
    }
    setHashtags((post.hashtags || []).join(' '));
    setShowComposer(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePost.mutate(id);
    }
  };

  const getCharLimit = () => {
    return platformOptions.find(p => p.id === selectedPlatform)?.maxChars || 280;
  };

  const scheduledPosts = posts.filter(p => p.status === 'scheduled');
  const draftPosts = posts.filter(p => p.status === 'draft');
  const publishedPosts = posts.filter(p => p.status === 'published');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schedule Posts</h2>
          <p className="text-muted-foreground">Create and schedule social media content</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => { resetForm(); setShowComposer(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Composer */}
      {showComposer && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</CardTitle>
            <CardDescription>Compose your social media content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title for internal reference"
              />
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <Label>Platform</Label>
              <div className="flex flex-wrap gap-2">
                {platformOptions.map(platform => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatform === platform.id;
                  return (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                        isSelected 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Icon className={cn('h-4 w-4', platform.color)} />
                      <span className="text-sm">{platform.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Content</Label>
                <span className={cn(
                  'text-xs',
                  content.length > getCharLimit() ? 'text-red-500' : 'text-muted-foreground'
                )}>
                  {content.length} / {getCharLimit()}
                </span>
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
              />
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <Label>Hashtags</Label>
              <Input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#marketing #event #conference"
              />
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!title || !content || createPost.isPending || updatePost.isPending}
              >
                {createPost.isPending || updatePost.isPending ? 'Saving...' : editingPost ? 'Update Post' : 'Schedule Post'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post Lists */}
      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList>
          <TabsTrigger value="scheduled">
            Scheduled ({scheduledPosts.length})
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts ({draftPosts.length})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({publishedPosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="mt-4">
          <PostList 
            posts={scheduledPosts} 
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage="No scheduled posts"
          />
        </TabsContent>

        <TabsContent value="drafts" className="mt-4">
          <PostList 
            posts={draftPosts} 
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage="No draft posts"
          />
        </TabsContent>

        <TabsContent value="published" className="mt-4">
          <PostList 
            posts={publishedPosts} 
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage="No published posts yet"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PostList({ 
  posts, 
  isLoading, 
  onEdit, 
  onDelete, 
  emptyMessage 
}: { 
  posts: SocialPost[]; 
  isLoading: boolean;
  onEdit: (post: SocialPost) => void;
  onDelete: (id: string) => void;
  emptyMessage: string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3">
        {posts.map(post => {
          const platformConfig = platformOptions.find(p => p.id === post.platform);
          const Icon = platformConfig?.icon || Twitter;
          
          return (
            <Card key={post.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn('h-4 w-4', platformConfig?.color || 'text-muted-foreground')} />
                      <span className="text-sm font-medium truncate">{post.title}</span>
                      <Badge className={statusColors[post.status || 'draft']}>
                        {post.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                    {post.scheduled_for && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(post.scheduled_for), 'MMM d, yyyy')}
                        <Clock className="h-3 w-3 ml-2" />
                        {format(new Date(post.scheduled_for), 'h:mm a')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(post)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(post.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
