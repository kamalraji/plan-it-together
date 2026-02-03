import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Image, Video, FileText, Upload, Search, FolderOpen, Trash2, HardDrive } from 'lucide-react';
import { useMediaAssets, useMediaStats, useUploadMediaAsset, useDeleteMediaAsset, formatFileSize, MediaAsset } from '@/hooks/useMediaAssetsLibrary';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MediaAssetsLibraryProps {
  workspaceId: string;
}

export function MediaAssetsLibrary({ workspaceId }: MediaAssetsLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<MediaAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: assets = [], isLoading } = useMediaAssets(workspaceId);
  const { data: stats } = useMediaStats(workspaceId);
  const uploadMutation = useUploadMediaAsset(workspaceId);
  const deleteMutation = useDeleteMediaAsset(workspaceId);

  const getTypeIcon = (type: string) => {
    if (type === 'image' || type === 'photo') return <Image className="h-4 w-4" />;
    if (type === 'video') return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    if (type === 'image' || type === 'photo') return 'bg-purple-500/10 text-purple-500';
    if (type === 'video') return 'bg-red-500/10 text-red-500';
    return 'bg-blue-500/10 text-blue-500';
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType ? asset.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  const typeFilters = [
    { type: 'image', label: 'Images', count: stats?.imageCount || 0 },
    { type: 'video', label: 'Videos', count: stats?.videoCount || 0 },
    { type: 'document', label: 'Docs', count: stats?.documentCount || 0 },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    e.target.value = '';
  };

  const handleDelete = () => {
    if (deleteAsset) {
      deleteMutation.mutate(deleteAsset);
      setDeleteAsset(null);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-9 w-full" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderOpen className="h-5 w-5 text-primary" />
              Media Library
            </CardTitle>
            <Button 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <Upload className="h-3 w-3 mr-1" />
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*,application/pdf,audio/*"
              onChange={handleFileSelect}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Storage Stats */}
          {stats && (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{stats.totalAssets} files</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatFileSize(stats.totalSize)} total
              </div>
            </div>
          )}

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
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group"
              >
                <div className={`p-2 rounded-lg ${getTypeColor(asset.type)}`}>
                  {getTypeIcon(asset.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{asset.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(asset.file_size)}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(asset.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {asset.usage_count} uses
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDeleteAsset(asset)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredAssets.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {assets.length === 0 ? 'No assets yet. Upload your first file!' : 'No assets found'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteAsset} onOpenChange={() => setDeleteAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteAsset?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
