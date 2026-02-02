import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  Hash, 
  TrendingUp, 
  Plus, 
  Copy, 
  Trash2,
  RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  useHashtags, 
  useAddHashtag, 
  useDeleteHashtag, 
  DEFAULT_HASHTAGS,
  type Hashtag 
} from '@/hooks/useSocialMediaData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface HashtagTrackerProps {
  workspaceId?: string;
}

export function HashtagTracker({ workspaceId }: HashtagTrackerProps) {
  const { data: hashtags, isLoading, error } = useHashtags(workspaceId);
  const addHashtag = useAddHashtag();
  const deleteHashtag = useDeleteHashtag();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  // Use default hashtags as fallback
  const displayHashtags: Hashtag[] = hashtags && hashtags.length > 0 
    ? hashtags 
    : DEFAULT_HASHTAGS.map((h, i) => ({
        ...h,
        id: `default-${i}`,
        workspace_id: workspaceId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'trending':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">Trending</Badge>;
      case 'declining':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">Declining</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Stable</Badge>;
    }
  };

  const copyAllHashtags = () => {
    const allTags = displayHashtags.map(h => h.tag).join(' ');
    navigator.clipboard.writeText(allTags);
    toast.success('Hashtags copied to clipboard');
  };

  const handleAddHashtag = () => {
    if (!newTag.trim() || !workspaceId) return;
    
    const formattedTag = newTag.startsWith('#') ? newTag : `#${newTag}`;
    
    addHashtag.mutate({
      workspace_id: workspaceId,
      tag: formattedTag,
      uses_count: 0,
      reach: 0,
      trend: 'stable',
      is_primary: isPrimary,
      last_updated_at: null,
    }, {
      onSuccess: () => {
        setNewTag('');
        setIsPrimary(false);
        setIsAddDialogOpen(false);
      }
    });
  };

  const handleDeleteHashtag = (id: string) => {
    if (!workspaceId) return;
    deleteHashtag.mutate({ id, workspaceId });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hash className="h-5 w-5 text-primary" />
            Hashtag Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hash className="h-5 w-5 text-primary" />
            Hashtag Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>Failed to load hashtags</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hash className="h-5 w-5 text-primary" />
            Hashtag Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyAllHashtags}>
              <Copy className="h-3 w-3 mr-1" />
              Copy All
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Hashtag</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="#YourHashtag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHashtag()}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={isPrimary} 
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      className="rounded border-border"
                    />
                    Mark as primary hashtag
                  </label>
                  <Button 
                    onClick={handleAddHashtag} 
                    disabled={!newTag.trim() || addHashtag.isPending}
                    className="w-full"
                  >
                    {addHashtag.isPending ? 'Adding...' : 'Add Hashtag'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayHashtags.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hashtags yet</p>
              <p className="text-xs">Add your first hashtag to start tracking</p>
            </div>
          ) : (
            displayHashtags.map((hashtag) => (
              <div
                key={hashtag.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    hashtag.is_primary ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Hash className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{hashtag.tag}</span>
                      {hashtag.is_primary && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(hashtag.uses_count)} uses • {formatNumber(hashtag.reach)} reach
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hashtag.trend === 'trending' && (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  )}
                  {getTrendBadge(hashtag.trend)}
                  {!hashtag.id.startsWith('default-') && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteHashtag(hashtag.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
