import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Download, 
  Image as ImageIcon,
  Video,
  Music,
  ArrowLeft,
  CheckCircle,
  Package,
  FileArchive,
  Loader2,
  Filter,
  FileDown
} from 'lucide-react';
import { useMediaAssets } from '@/hooks/useContentDepartmentData';
import { toast } from 'sonner';

interface AssetExportTabProps {
  workspaceId: string;
  onBack?: () => void;
}

const typeIcons = {
  photo: ImageIcon,
  video: Video,
  audio: Music,
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function AssetExportTab({ workspaceId, onBack }: AssetExportTabProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'zip' | 'individual'>('individual');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const { data: assets = [], isLoading } = useMediaAssets(workspaceId);
  
  // Only show approved assets for export
  const approvedAssets = assets.filter(a => a.status === 'approved');
  const filteredAssets = filterType 
    ? approvedAssets.filter(a => a.type === filterType)
    : approvedAssets;

  const selectedAssets = approvedAssets.filter(a => selectedIds.has(a.id));
  const totalSelectedSize = selectedAssets.reduce((sum, a) => sum + (a.file_size || 0), 0);

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredAssets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssets.map(a => a.id)));
    }
  };

  const selectByType = (type: string) => {
    const typeAssets = approvedAssets.filter(a => a.type === type);
    setSelectedIds(new Set(typeAssets.map(a => a.id)));
  };

  const handleExport = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one asset to export');
      return;
    }

    setIsExporting(true);

    try {
      if (exportFormat === 'individual') {
        // Download assets individually
        for (const asset of selectedAssets) {
          if (asset.file_url) {
            const link = document.createElement('a');
            link.href = asset.file_url;
            link.download = asset.name;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            await new Promise(resolve => setTimeout(resolve, 500)); // Stagger downloads
          }
        }
        toast.success(`Started downloading ${selectedAssets.length} files`);
      } else {
        // For ZIP export, we'd need a backend endpoint
        // For now, show a message
        toast.info('ZIP export requires backend implementation. Downloading individually instead.');
        for (const asset of selectedAssets) {
          if (asset.file_url) {
            window.open(asset.file_url, '_blank');
          }
        }
      }
    } catch (error) {
      toast.error('Failed to export assets');
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  };

  const generateManifest = () => {
    const manifest = {
      exportDate: new Date().toISOString(),
      totalAssets: selectedAssets.length,
      totalSize: formatFileSize(totalSelectedSize),
      assets: selectedAssets.map(a => ({
        name: a.name,
        type: a.type,
        size: formatFileSize(a.file_size),
        url: a.file_url,
        tags: a.tags,
        uploadedBy: a.uploader_name,
        uploadedAt: a.created_at,
      })),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asset-manifest-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Manifest downloaded');
  };

  const stats = {
    total: approvedAssets.length,
    photos: approvedAssets.filter(a => a.type === 'photo').length,
    videos: approvedAssets.filter(a => a.type === 'video').length,
    audio: approvedAssets.filter(a => a.type === 'audio').length,
    totalSize: approvedAssets.reduce((sum, a) => sum + (a.file_size || 0), 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileDown className="h-6 w-6 text-emerald-500" />
              Asset Export
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Export approved media assets for distribution
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={generateManifest}
            disabled={selectedIds.size === 0}
          >
            <FileArchive className="h-4 w-4 mr-2" />
            Download Manifest
          </Button>
          <Button 
            onClick={() => setShowExportDialog(true)}
            disabled={selectedIds.size === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export ({selectedIds.size})
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => selectByType('photo')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Photos</p>
                <p className="text-2xl font-bold">{stats.photos}</p>
              </div>
              <ImageIcon className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => selectByType('video')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Videos</p>
                <p className="text-2xl font-bold">{stats.videos}</p>
              </div>
              <Video className="h-8 w-8 text-fuchsia-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => selectByType('audio')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Audio</p>
                <p className="text-2xl font-bold">{stats.audio}</p>
              </div>
              <Music className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
              </div>
              <Package className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selection Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={selectedIds.size === filteredAssets.length && filteredAssets.length > 0}
            onCheckedChange={selectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} of {filteredAssets.length} selected
            {selectedIds.size > 0 && ` (${formatFileSize(totalSelectedSize)})`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1">
            {['photo', 'video', 'audio'].map(type => (
              <Button
                key={type}
                size="sm"
                variant={filterType === type ? 'default' : 'outline'}
                onClick={() => setFilterType(filterType === type ? null : type)}
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Asset Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approved Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No approved assets</h3>
                <p className="text-sm text-muted-foreground">
                  {filterType ? 'Try clearing the filter' : 'Approve assets in Gallery Review first'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAssets.map((asset) => {
                  const TypeIcon = typeIcons[asset.type] || ImageIcon;
                  const isSelected = selectedIds.has(asset.id);

                  return (
                    <Card 
                      key={asset.id}
                      className={`overflow-hidden cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/50'
                      }`}
                      onClick={() => toggleSelection(asset.id)}
                    >
                      <div className="aspect-video bg-muted relative flex items-center justify-center">
                        {asset.thumbnail_url || asset.file_url ? (
                          <img 
                            src={asset.thumbnail_url || asset.file_url || ''} 
                            alt={asset.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <TypeIcon className="h-12 w-12 text-muted-foreground" />
                        )}
                        <div className={`absolute top-2 left-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                        <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                          {asset.type}
                        </Badge>
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm truncate">{asset.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatFileSize(asset.file_size)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Assets</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                You are about to export {selectedIds.size} assets ({formatFileSize(totalSelectedSize)})
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Export Format</label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'zip' | 'individual')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual Files</SelectItem>
                  <SelectItem value="zip">ZIP Archive (opens in new tabs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Selected Assets</h4>
              <ScrollArea className="h-[150px]">
                <div className="space-y-1">
                  {selectedAssets.map(asset => (
                    <div key={asset.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{asset.name}</span>
                      <span className="text-muted-foreground">{formatFileSize(asset.file_size)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
