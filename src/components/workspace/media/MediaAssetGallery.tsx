import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FolderOpen, 
  Upload, 
  Image, 
  Video, 
  Download,
  Filter,
  Search,
  FileIcon
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MediaAsset {
  id: string;
  name: string;
  type: 'photo' | 'video' | 'raw' | 'document';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'processing' | 'ready' | 'delivered';
  url?: string;
}

interface MediaAssetGalleryProps {
  workspaceId?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getAssetType(mimeType: string | null, fileName: string | null): MediaAsset['type'] {
  const type = mimeType || '';
  const name = (fileName || '').toLowerCase();
  
  if (type.startsWith('image/') || name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'photo';
  if (type.startsWith('video/') || name.match(/\.(mp4|mov|avi|webm|mkv)$/)) return 'video';
  if (name.match(/\.(arw|nef|cr2|dng|raw)$/)) return 'raw';
  return 'document';
}

export function MediaAssetGallery({ workspaceId }: MediaAssetGalleryProps) {
  const [_showUpload, setShowUpload] = useState(false);

  // Fetch media assets from workspace_media_assets table
  const { data: dbAssets = [], isLoading } = useQuery({
    queryKey: ['media-assets', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('workspace_media_assets')
        .select('id, name, mime_type, file_size, file_url, status, created_at, uploader_name')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  // Transform DB assets to MediaAsset format
  const assets: MediaAsset[] = dbAssets.map(asset => ({
    id: asset.id,
    name: asset.name || 'Untitled',
    type: getAssetType(asset.mime_type, asset.name),
    size: formatFileSize(asset.file_size || 0),
    uploadedBy: asset.uploader_name || 'Unknown',
    uploadedAt: new Date(asset.created_at).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    status: (asset.status as MediaAsset['status']) || 'ready',
    url: asset.file_url || undefined,
  }));

  // Calculate storage usage from assets
  const totalBytes = dbAssets.reduce((sum, a) => sum + (a.file_size || 0), 0);
  const storageUsed = totalBytes / (1024 * 1024 * 1024); // Convert to GB
  const storageTotal = 10; // GB allocation
  const storagePercent = Math.min((storageUsed / storageTotal) * 100, 100);

  const getTypeIcon = (type: MediaAsset['type']) => {
    switch (type) {
      case 'photo':
      case 'raw':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileIcon className="h-4 w-4" />;
    }
  };

  const getStatusConfig = (status: MediaAsset['status']) => {
    switch (status) {
      case 'processing':
        return { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', label: 'Processing' };
      case 'ready':
        return { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Ready' };
      case 'delivered':
        return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Delivered' };
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen className="h-5 w-5 text-primary" />
            Media Assets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderOpen className="h-5 w-5 text-primary" />
          Media Assets
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost">
            <Filter className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Search className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowUpload(true)}>
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Storage Usage */}
        <div className="p-3 rounded-lg bg-muted/30 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Storage Used</span>
            <span className="font-medium">{storageUsed.toFixed(2)} GB / {storageTotal} GB</span>
          </div>
          <Progress value={storagePercent} className="h-2" />
        </div>

        {/* Asset List */}
        {assets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No media assets uploaded yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => setShowUpload(true)}
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload First Asset
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {assets.map((asset) => {
              const statusConfig = getStatusConfig(asset.status);

              return (
                <div 
                  key={asset.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-background">
                    {getTypeIcon(asset.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{asset.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{asset.size}</span>
                      <span>•</span>
                      <span>{asset.uploadedBy}</span>
                      <span>•</span>
                      <span>{asset.uploadedAt}</span>
                    </div>
                  </div>

                  <Badge className={statusConfig.color} variant="secondary">
                    {statusConfig.label}
                  </Badge>

                  {asset.status === 'ready' && asset.url && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                      onClick={() => window.open(asset.url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {assets.length > 0 && (
          <Button variant="ghost" className="w-full text-muted-foreground">
            View All Assets
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
