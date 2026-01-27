import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image, Video, FileText, Upload, Search, Grid, List, Trash2, Eye, Copy, MoreVertical, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ContentLibrarySocialTabProps {
  workspaceId: string;
}

const CONTENT_TYPES = [
  { id: 'all', label: 'All Types', icon: Grid },
  { id: 'image', label: 'Images', icon: Image },
  { id: 'video', label: 'Videos', icon: Video },
  { id: 'text', label: 'Text Posts', icon: FileText },
];

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'brand', label: 'Brand' },
  { id: 'event', label: 'Event' },
  { id: 'campaign', label: 'Campaign' },
  { id: 'product', label: 'Product' },
  { id: 'promotional', label: 'Promotional' },
];

// Mock content library items (would be from a dedicated table in production)
const MOCK_ASSETS = [
  { id: '1', name: 'Brand Logo Light', type: 'image', category: 'brand', url: '/placeholder.svg', usedIn: 5, createdAt: new Date('2024-01-15') },
  { id: '2', name: 'Event Banner', type: 'image', category: 'event', url: '/placeholder.svg', usedIn: 3, createdAt: new Date('2024-01-20') },
  { id: '3', name: 'Product Showcase', type: 'video', category: 'product', url: '/placeholder.svg', usedIn: 2, createdAt: new Date('2024-01-25') },
  { id: '4', name: 'Campaign Graphics', type: 'image', category: 'campaign', url: '/placeholder.svg', usedIn: 8, createdAt: new Date('2024-02-01') },
  { id: '5', name: 'Promotional Template', type: 'image', category: 'promotional', url: '/placeholder.svg', usedIn: 12, createdAt: new Date('2024-02-05') },
  { id: '6', name: 'Brand Story', type: 'video', category: 'brand', url: '/placeholder.svg', usedIn: 1, createdAt: new Date('2024-02-10') },
];

export function ContentLibrarySocialTab(_props: ContentLibrarySocialTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter assets
  const filteredAssets = MOCK_ASSETS.filter(asset => {
    if (typeFilter !== 'all' && asset.type !== typeFilter) return false;
    if (categoryFilter !== 'all' && asset.category !== categoryFilter) return false;
    if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      default: return FileText;
    }
  };

  const handleCopyAsset = (assetName: string) => {
    toast.success(`${assetName} copied to clipboard`);
  };

  const stats = {
    total: MOCK_ASSETS.length,
    images: MOCK_ASSETS.filter(a => a.type === 'image').length,
    videos: MOCK_ASSETS.filter(a => a.type === 'video').length,
    totalUses: MOCK_ASSETS.reduce((sum, a) => sum + a.usedIn, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Library</h2>
          <p className="text-muted-foreground">Manage your media assets and content templates</p>
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Asset
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-500">{stats.images}</div>
            <p className="text-sm text-muted-foreground">Images</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-500">{stats.videos}</div>
            <p className="text-sm text-muted-foreground">Videos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-500">{stats.totalUses}</div>
            <p className="text-sm text-muted-foreground">Times Used</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="pl-9"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid/List */}
      {filteredAssets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No assets found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || typeFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload your first asset to get started'}
            </p>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Asset
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => {
            const TypeIcon = getTypeIcon(asset.type);
            
            return (
              <Card key={asset.id} className="group overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-muted relative">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="gap-1">
                      <TypeIcon className="h-3 w-3" />
                      {asset.type}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="secondary" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleCopyAsset(asset.name)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">{asset.name}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <Badge variant="outline" className="capitalize text-xs">{asset.category}</Badge>
                    <span>Used {asset.usedIn}x</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredAssets.map((asset) => {
                const TypeIcon = getTypeIcon(asset.type);
                
                return (
                  <div key={asset.id} className="flex items-center gap-4 p-4 hover:bg-muted/50">
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{asset.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TypeIcon className="h-3.5 w-3.5" />
                        <span className="capitalize">{asset.type}</span>
                        <span>•</span>
                        <Badge variant="outline" className="capitalize text-xs">{asset.category}</Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
                      <p>Used {asset.usedIn} times</p>
                      <p>{format(asset.createdAt, 'MMM d, yyyy')}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyAsset(asset.name)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
