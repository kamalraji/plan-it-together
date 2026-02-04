import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Palette, Upload, Download, Eye, FileImage, FileType, FileVideo } from 'lucide-react';

interface BrandAsset {
  id: string;
  name: string;
  type: 'logo' | 'banner' | 'template' | 'video' | 'guideline';
  format: string;
  size: string;
  lastUpdated: string;
  downloads: number;
}

const mockAssets: BrandAsset[] = [
  {
    id: '1',
    name: 'Event Logo - Primary',
    type: 'logo',
    format: 'SVG, PNG',
    size: '2.4 MB',
    lastUpdated: '2025-01-02',
    downloads: 45,
  },
  {
    id: '2',
    name: 'Social Media Banner Pack',
    type: 'banner',
    format: 'PSD, PNG',
    size: '15.8 MB',
    lastUpdated: '2025-01-04',
    downloads: 32,
  },
  {
    id: '3',
    name: 'Email Template - Announcement',
    type: 'template',
    format: 'HTML',
    size: '156 KB',
    lastUpdated: '2025-01-03',
    downloads: 18,
  },
  {
    id: '4',
    name: 'Promo Video - 30s Teaser',
    type: 'video',
    format: 'MP4',
    size: '42.5 MB',
    lastUpdated: '2024-12-28',
    downloads: 12,
  },
  {
    id: '5',
    name: 'Brand Guidelines 2025',
    type: 'guideline',
    format: 'PDF',
    size: '8.2 MB',
    lastUpdated: '2024-12-20',
    downloads: 28,
  },
];

const typeIcons: Record<BrandAsset['type'], typeof FileImage> = {
  logo: FileImage,
  banner: FileImage,
  template: FileType,
  video: FileVideo,
  guideline: FileType,
};

const typeColors: Record<BrandAsset['type'], string> = {
  logo: 'bg-pink-100 text-pink-700',
  banner: 'bg-blue-100 text-blue-700',
  template: 'bg-emerald-100 text-emerald-700',
  video: 'bg-purple-100 text-purple-700',
  guideline: 'bg-amber-100 text-amber-700',
};

export function BrandingAssetsManager() {
  const [assets] = useState<BrandAsset[]>(mockAssets);

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
        {assets.map((asset) => {
          const Icon = typeIcons[asset.type];
          
          return (
            <div
              key={asset.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${typeColors[asset.type]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{asset.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{asset.format}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{asset.size}</span>
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
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
