import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Instagram, Twitter, Linkedin, Facebook, Youtube, Image, Video, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateSocialPost, useSocialPlatforms, useHashtags, useSocialPosts } from '@/hooks/useSocialMediaCommitteeData';

interface PostNowSocialTabProps {
  workspaceId: string;
}

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500', bgColor: 'bg-pink-500/10', charLimit: 2200 },
  { id: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'text-sky-500', bgColor: 'bg-sky-500/10', charLimit: 280 },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', bgColor: 'bg-blue-600/10', charLimit: 3000 },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500', bgColor: 'bg-blue-500/10', charLimit: 63206 },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500', bgColor: 'bg-red-500/10', charLimit: 5000 },
];

const POST_TYPES = [
  { id: 'image', label: 'Image', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'text', label: 'Text', icon: FileText },
];

export function PostNowSocialTab({ workspaceId }: PostNowSocialTabProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('image');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);

  // Queries
  const { data: connectedPlatforms = [] } = useSocialPlatforms(workspaceId);
  const { data: hashtags = [] } = useHashtags(workspaceId);
  const { data: recentPosts = [] } = useSocialPosts(workspaceId, { status: 'published' });

  // Mutations
  const createPost = useCreateSocialPost(workspaceId);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const toggleHashtag = (tag: string) => {
    setSelectedHashtags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const getCharacterStatus = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return null;
    
    const totalLength = content.length + selectedHashtags.map(t => `#${t} `).join('').length;
    const remaining = platform.charLimit - totalLength;
    
    if (remaining < 0) {
      return { status: 'over', remaining, color: 'text-destructive' };
    } else if (remaining < 50) {
      return { status: 'warning', remaining, color: 'text-amber-500' };
    }
    return { status: 'ok', remaining, color: 'text-muted-foreground' };
  };

  const handlePublish = async () => {
    if (!title.trim() || selectedPlatforms.length === 0) {
      toast.error('Please add a title and select at least one platform');
      return;
    }

    // Create a post for each selected platform
    const promises = selectedPlatforms.map(platform => 
      createPost.mutateAsync({
        title,
        content,
        platform,
        post_type: postType,
        hashtags: selectedHashtags,
        status: 'published',
        published_at: new Date().toISOString(),
      })
    );

    try {
      await Promise.all(promises);
      toast.success(`Post published to ${selectedPlatforms.length} platform(s)!`);
      
      // Reset form
      setTitle('');
      setContent('');
      setSelectedPlatforms([]);
      setSelectedHashtags([]);
    } catch (error) {
      // Error toast is handled by mutation
    }
  };

  const isFormValid = title.trim() && selectedPlatforms.length > 0 && 
    selectedPlatforms.every(p => {
      const status = getCharacterStatus(p);
      return status?.status !== 'over';
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Post Now</h2>
        <p className="text-muted-foreground">Create and publish content instantly</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Composer */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compose Post</CardTitle>
              <CardDescription>Write your content and select platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <Label>Post Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your post a title..."
                />
              </div>

              {/* Content */}
              <div>
                <Label>Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What would you like to share?"
                  rows={6}
                  className="resize-none"
                />
              </div>

              {/* Post Type */}
              <div>
                <Label>Post Type</Label>
                <div className="flex gap-2 mt-2">
                  {POST_TYPES.map((type) => (
                    <Button
                      key={type.id}
                      variant={postType === type.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPostType(type.id)}
                      className="gap-2"
                    >
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <Label>Select Platforms</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {PLATFORMS.map((platform) => {
                    const isSelected = selectedPlatforms.includes(platform.id);
                    const isConnected = connectedPlatforms.some(p => p.platform === platform.id);
                    const charStatus = isSelected ? getCharacterStatus(platform.id) : null;
                    
                    return (
                      <button
                        key={platform.id}
                        onClick={() => togglePlatform(platform.id)}
                        disabled={!isConnected && connectedPlatforms.length > 0}
                        className={`relative flex items-center gap-2 p-3 rounded-lg border transition-all ${
                          isSelected 
                            ? `border-primary ${platform.bgColor}` 
                            : 'border-border hover:border-muted-foreground/50'
                        } ${!isConnected && connectedPlatforms.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <platform.icon className={`h-5 w-5 ${platform.color}`} />
                        <span className="text-sm font-medium">{platform.label}</span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                        )}
                        {charStatus?.status === 'over' && (
                          <AlertCircle className="h-4 w-4 text-destructive ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Character limits for selected platforms */}
              {selectedPlatforms.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                  {selectedPlatforms.map((platformId) => {
                    const platform = PLATFORMS.find(p => p.id === platformId);
                    const charStatus = getCharacterStatus(platformId);
                    if (!platform || !charStatus) return null;
                    
                    return (
                      <Badge 
                        key={platformId} 
                        variant="outline" 
                        className={`gap-1 ${charStatus.color}`}
                      >
                        <platform.icon className="h-3 w-3" />
                        {charStatus.remaining} chars left
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Hashtags */}
              {hashtags.length > 0 && (
                <div>
                  <Label>Quick Hashtags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {hashtags.slice(0, 10).map((tag) => (
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
                  {selectedHashtags.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Selected: {selectedHashtags.map(t => `#${t}`).join(' ')}
                    </p>
                  )}
                </div>
              )}

              {/* Publish Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={handlePublish}
                  disabled={!isFormValid || createPost.isPending}
                  className="gap-2 min-w-[150px]"
                >
                  <Send className="h-4 w-4" />
                  {createPost.isPending ? 'Publishing...' : 'Publish Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-muted/30 min-h-[200px]">
                {title || content ? (
                  <div className="space-y-2">
                    {title && <p className="font-semibold">{title}</p>}
                    {content && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>}
                    {selectedHashtags.length > 0 && (
                      <p className="text-sm text-primary">
                        {selectedHashtags.map(t => `#${t}`).join(' ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Your post preview will appear here
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {recentPosts.slice(0, 5).length > 0 ? (
                <div className="space-y-3">
                  {recentPosts.slice(0, 5).map((post) => {
                    const platform = PLATFORMS.find(p => p.id === post.platform);
                    const Icon = platform?.icon || Instagram;
                    
                    return (
                      <div key={post.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50">
                        <Icon className={`h-4 w-4 mt-0.5 ${platform?.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{post.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>❤️ {post.engagement_likes}</span>
                            <span>💬 {post.engagement_comments}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent posts
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
