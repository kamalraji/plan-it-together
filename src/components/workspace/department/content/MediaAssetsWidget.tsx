import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Image, Video, FileAudio, Download, Eye } from 'lucide-react';

interface MediaCategory {
  type: 'photo' | 'video' | 'audio';
  count: number;
  size: string;
  recentCount: number;
}

const mediaCategories: MediaCategory[] = [
  { type: 'photo', count: 234, size: '2.4 GB', recentCount: 45 },
  { type: 'video', count: 18, size: '8.2 GB', recentCount: 3 },
  { type: 'audio', count: 12, size: '450 MB', recentCount: 2 },
];

const categoryConfig = {
  photo: { icon: Image, label: 'Photos', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  video: { icon: Video, label: 'Videos', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  audio: { icon: FileAudio, label: 'Audio', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
};

export function MediaAssetsWidget() {
  const totalAssets = mediaCategories.reduce((sum, cat) => sum + cat.count, 0);
  const recentAssets = mediaCategories.reduce((sum, cat) => sum + cat.recentCount, 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10">
              <Camera className="h-4 w-4 text-purple-500" />
            </div>
            Media Assets
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            +{recentAssets} today
          </Badge>
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
          {mediaCategories.map((category) => {
            const config = categoryConfig[category.type];
            const Icon = config.icon;

            return (
              <div
                key={category.type}
                className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{category.size}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{category.count}</p>
                  {category.recentCount > 0 && (
                    <p className="text-xs text-emerald-500">+{category.recentCount}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <button className="w-full px-3 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
          Open Media Gallery
        </button>
      </CardContent>
    </Card>
  );
}
