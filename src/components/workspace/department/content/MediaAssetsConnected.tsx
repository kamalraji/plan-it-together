import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Image, Video, FileAudio, Download, Eye, Upload } from 'lucide-react';
import { useMediaAssets } from '@/hooks/useContentDepartmentData';

const categoryConfig = {
  photo: { icon: Image, label: 'Photos', color: 'text-primary', bgColor: 'bg-primary/10' },
  video: { icon: Video, label: 'Videos', color: 'text-info', bgColor: 'bg-info/10' },
  audio: { icon: FileAudio, label: 'Audio', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

interface MediaAssetsConnectedProps {
  workspaceId: string;
  onUpload?: () => void;
}

export function MediaAssetsConnected({ workspaceId, onUpload }: MediaAssetsConnectedProps) {
  const { data: mediaAssets = [], isLoading } = useMediaAssets(workspaceId);

  // Group assets by type
  const assetsByType = mediaAssets.reduce((acc, asset) => {
    const type = asset.type as keyof typeof categoryConfig;
    if (!acc[type]) {
      acc[type] = { count: 0, size: 0, recent: 0 };
    }
    acc[type].count++;
    acc[type].size += asset.file_size || 0;
    // Check if uploaded in last 24 hours
    if (new Date(asset.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      acc[type].recent++;
    }
    return acc;
  }, {} as Record<string, { count: number; size: number; recent: number }>);

  const totalAssets = mediaAssets.length;
  const recentAssets = Object.values(assetsByType).reduce((sum, cat) => sum + cat.recent, 0);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Camera className="h-4 w-4 text-primary" />
            </div>
            Media Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Camera className="h-4 w-4 text-primary" />
            </div>
            Media Assets
          </CardTitle>
          {recentAssets > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{recentAssets} today
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Summary */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{totalAssets}</p>
              <p className="text-sm text-muted-foreground">Total Assets</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-background/50 hover:bg-background transition-colors">
                <Eye className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg bg-background/50 hover:bg-background transition-colors">
                <Download className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map((type) => {
            const config = categoryConfig[type];
            const Icon = config.icon;
            const data = assetsByType[type] || { count: 0, size: 0, recent: 0 };

            return (
              <div
                key={type}
                className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(data.size)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{data.count}</p>
                  {data.recent > 0 && (
                    <p className="text-xs text-emerald-500">+{data.recent}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upload Button */}
        {onUpload && (
          <Button 
            onClick={onUpload}
            className="w-full"
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Media
          </Button>
        )}

        {totalAssets === 0 && (
          <div className="text-center py-4">
            <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No media assets yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
