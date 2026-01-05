import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FolderOpen, 
  Upload, 
  Image, 
  Video, 
  Download,
  Filter,
  Search
} from 'lucide-react';

interface MediaAsset {
  id: string;
  name: string;
  type: 'photo' | 'video' | 'raw';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'processing' | 'ready' | 'delivered';
  thumbnail?: string;
}

interface MediaAssetGalleryProps {
  workspaceId?: string;
}

export function MediaAssetGallery(_props: MediaAssetGalleryProps) {
  const [assets] = useState<MediaAsset[]>([
    {
      id: '1',
      name: 'opening_ceremony_001.jpg',
      type: 'photo',
      size: '12.5 MB',
      uploadedBy: 'Arjun M.',
      uploadedAt: '10:45 AM',
      status: 'ready',
    },
    {
      id: '2',
      name: 'keynote_highlight.mp4',
      type: 'video',
      size: '256 MB',
      uploadedBy: 'Priya N.',
      uploadedAt: '12:30 PM',
      status: 'processing',
    },
    {
      id: '3',
      name: 'panel_discussion_raw.arw',
      type: 'raw',
      size: '45 MB',
      uploadedBy: 'Sneha P.',
      uploadedAt: '03:15 PM',
      status: 'ready',
    },
    {
      id: '4',
      name: 'drone_aerial_001.mp4',
      type: 'video',
      size: '512 MB',
      uploadedBy: 'Rahul S.',
      uploadedAt: '04:00 PM',
      status: 'delivered',
    },
  ]);

  const storageUsed = 2.4; // GB
  const storageTotal = 10; // GB
  const storagePercent = (storageUsed / storageTotal) * 100;

  const getTypeIcon = (type: MediaAsset['type']) => {
    switch (type) {
      case 'photo':
      case 'raw':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
    }
  };

  const getStatusConfig = (status: MediaAsset['status']) => {
    switch (status) {
      case 'processing':
        return { color: 'bg-amber-100 text-amber-800', label: 'Processing' };
      case 'ready':
        return { color: 'bg-green-100 text-green-800', label: 'Ready' };
      case 'delivered':
        return { color: 'bg-blue-100 text-blue-800', label: 'Delivered' };
    }
  };

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
          <Button size="sm" variant="outline" className="gap-1">
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
            <span className="font-medium">{storageUsed} GB / {storageTotal} GB</span>
          </div>
          <Progress value={storagePercent} className="h-2" />
        </div>

        {/* Asset List */}
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

                {asset.status === 'ready' && (
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <Button variant="ghost" className="w-full text-muted-foreground">
          View All Assets
        </Button>
      </CardContent>
    </Card>
  );
}
