import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderOpen, Image, Video, FileText, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContentLibraryProps {
  workspaceId?: string;
}

export function ContentLibrary({ workspaceId }: ContentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch media assets for content library
  const { data: contentItems = [], isLoading } = useQuery({
    queryKey: ['content-library', workspaceId, searchQuery],
    queryFn: async () => {
      if (!workspaceId) return [];

      let query = supabase
        .from('workspace_media_assets')
        .select('id, name, mime_type, category, usage_count, created_at')
        .eq('workspace_id', workspaceId)
        .order('usage_count', { ascending: false })
        .limit(10);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  const getTypeFromMime = (mimeType: string | null): 'image' | 'video' | 'template' | 'graphic' => {
    if (!mimeType) return 'template';
    if (mimeType.startsWith('image/svg') || mimeType.includes('illustration')) return 'graphic';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'template';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
      case 'graphic':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'bg-pink-500/10 text-pink-500';
      case 'video':
        return 'bg-destructive/10 text-destructive';
      case 'graphic':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-info/10 text-info';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen className="h-5 w-5 text-primary" />
            Content Library
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-9 w-full" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen className="h-5 w-5 text-primary" />
            Content Library
          </CardTitle>
          <Button size="sm">
            <Plus className="h-3 w-3 mr-1" />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search content..." 
            className="pl-8 h-9" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {contentItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No content in library</p>
            <Button variant="outline" size="sm" className="mt-3">
              <Plus className="h-3 w-3 mr-1" />
              Add Content
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {contentItems.map((item) => {
              const type = getTypeFromMime(item.mime_type);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className={`p-2 rounded-lg ${getTypeColor(type)}`}>
                    {getTypeIcon(type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Used {item.usage_count || 0} times
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {item.category || 'Uncategorized'}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
        
        {contentItems.length > 0 && (
          <Button variant="ghost" className="w-full" size="sm">
            Browse All Assets
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
