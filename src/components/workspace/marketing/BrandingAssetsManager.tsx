import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Palette, Upload, Download, Eye, FileImage, FileType, FileVideo, Loader2 } from 'lucide-react';
import { useBrandingAssets, BrandingAsset } from '@/hooks/useMarketingData';

interface BrandingAssetsManagerProps {
  workspaceId: string;
}

const typeIcons: Record<BrandingAsset['asset_type'], typeof FileImage> = {
  logo: FileImage,
  banner: FileImage,
  template: FileType,
  video: FileVideo,
  guideline: FileType,
  other: FileType,
};

const typeColors: Record<BrandingAsset['asset_type'], string> = {
  logo: 'bg-pink-100 text-pink-700',
  banner: 'bg-blue-100 text-blue-700',
  template: 'bg-emerald-100 text-emerald-700',
  video: 'bg-purple-100 text-purple-700',
  guideline: 'bg-amber-100 text-amber-700',
  other: 'bg-muted text-foreground',
};

export function BrandingAssetsManager({ workspaceId }: BrandingAssetsManagerProps) {
  const { assets, isLoading, incrementDownload } = useBrandingAssets(workspaceId);

  const handleDownload = (asset: BrandingAsset) => {
    incrementDownload.mutate(asset.id);
    if (asset.file_url) {
      window.open(asset.file_url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg font-semibold">Branding Assets</CardTitle>
        </div>
        <Button size="sm" variant="outline" className="gap-1">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No branding assets uploaded yet
          </p>
        ) : (
          assets.map((asset) => {
            const Icon = typeIcons[asset.asset_type];
            
            return (
              <div
                key={asset.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${typeColors[asset.asset_type]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{asset.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {asset.format && (
                        <span className="text-xs text-muted-foreground">{asset.format}</span>
                      )}
                      {asset.format && asset.file_size && (
                        <span className="text-muted-foreground">•</span>
                      )}
                      {asset.file_size && (
                        <span className="text-xs text-muted-foreground">{asset.file_size}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {asset.downloads} downloads
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8"
                    onClick={() => handleDownload(asset)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}