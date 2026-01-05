import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Image, Video, FileText, Upload, Search, FolderOpen } from 'lucide-react';

interface MediaAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  size: string;
  uploadedAt: string;
  usedIn: number;
}

export function MediaAssetsLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const assets: MediaAsset[] = [
    { id: '1', name: 'Event Banner 2024.png', type: 'image', size: '2.4 MB', uploadedAt: '2 days ago', usedIn: 5 },
    { id: '2', name: 'Speaker Promo.mp4', type: 'video', size: '45 MB', uploadedAt: '3 days ago', usedIn: 2 },
    { id: '3', name: 'Press Kit.pdf', type: 'document', size: '8.1 MB', uploadedAt: '1 week ago', usedIn: 3 },
    { id: '4', name: 'Social Template.png', type: 'image', size: '1.2 MB', uploadedAt: '1 week ago', usedIn: 12 },
    { id: '5', name: 'Highlight Reel.mp4', type: 'video', size: '120 MB', uploadedAt: '2 weeks ago', usedIn: 1 },
    { id: '6', name: 'Brand Guidelines.pdf', type: 'document', size: '5.6 MB', uploadedAt: '3 weeks ago', usedIn: 8 },
  ];

  const getTypeIcon = (type: string) => {
    if (type === 'image') return <Image className="h-4 w-4 text-purple-500" />;
    if (type === 'video') return <Video className="h-4 w-4 text-red-500" />;
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  const getTypeColor = (type: string) => {
    if (type === 'image') return 'bg-purple-500/10 text-purple-500';
    if (type === 'video') return 'bg-red-500/10 text-red-500';
    return 'bg-blue-500/10 text-blue-500';
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType ? asset.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  const typeFilters = [
    { type: 'image', label: 'Images', count: assets.filter(a => a.type === 'image').length },
    { type: 'video', label: 'Videos', count: assets.filter(a => a.type === 'video').length },
    { type: 'document', label: 'Documents', count: assets.filter(a => a.type === 'document').length },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen className="h-5 w-5 text-primary" />
            Media Library
          </CardTitle>
          <Button size="sm">
            <Upload className="h-3 w-3 mr-1" />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="flex gap-1">
            {typeFilters.map((filter) => (
              <Button
                key={filter.type}
                variant={selectedType === filter.type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === filter.type ? null : filter.type)}
                className="text-xs"
              >
                {filter.label} ({filter.count})
              </Button>
            ))}
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className={`p-2 rounded-lg ${getTypeColor(asset.type)}`}>
                {getTypeIcon(asset.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{asset.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{asset.size}</span>
                  <span>•</span>
                  <span>{asset.uploadedAt}</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">
                {asset.usedIn} uses
              </Badge>
            </div>
          ))}
        </div>

        {filteredAssets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No assets found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
