import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Image as ImageIcon, 
  Video,
  Music,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Trash2,
  Loader2,
  ImageOff,
  Filter
} from 'lucide-react';
import { useMediaAssets, MediaAsset } from '@/hooks/useContentDepartmentData';
import { toast } from 'sonner';

interface GalleryReviewTabProps {
  workspaceId: string;
  onBack?: () => void;
}

function useUpdateAssetStatus(workspaceId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('workspace_media_assets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-media-assets', workspaceId] });
      toast.success('Asset status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });
}

function useDeleteAsset(workspaceId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_media_assets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-media-assets', workspaceId] });
      toast.success('Asset deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete asset: ' + error.message);
    },
  });
}

const typeIcons = {
  photo: ImageIcon,
  video: Video,
  audio: Music,
};

const statusConfig = {
  pending: { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Pending Review' },
  approved: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Approved' },
  rejected: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Rejected' },
  shot_list: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Shot List' },
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function GalleryReviewTab({ workspaceId, onBack }: GalleryReviewTabProps) {
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

  const { data: assets = [], isLoading } = useMediaAssets(workspaceId);
  const updateStatus = useUpdateAssetStatus(workspaceId);
  const deleteAsset = useDeleteAsset(workspaceId);

  // Filter out shot_list items for review
  const reviewableAssets = assets.filter(a => a.status !== 'shot_list');
  
  const getAssetsByStatus = (status: string) => {
    return reviewableAssets.filter(a => {
      const matchesStatus = a.status === status;
      const matchesType = !filterType || a.type === filterType;
      return matchesStatus && matchesType;
    });
  };

  const pendingAssets = getAssetsByStatus('pending');
  const approvedAssets = getAssetsByStatus('approved');
  const rejectedAssets = getAssetsByStatus('rejected');

  const handleApprove = (asset: MediaAsset) => {
    updateStatus.mutate({ id: asset.id, status: 'approved' });
    setSelectedAsset(null);
  };

  const handleReject = (asset: MediaAsset) => {
    updateStatus.mutate({ id: asset.id, status: 'rejected' });
    setSelectedAsset(null);
  };

  const handleDelete = (asset: MediaAsset) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      deleteAsset.mutate(asset.id);
      setSelectedAsset(null);
    }
  };

  const renderAssetCard = (asset: MediaAsset) => {
    const TypeIcon = typeIcons[asset.type] || ImageIcon;
    const status = statusConfig[asset.status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Card 
        key={asset.id} 
        className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
        onClick={() => setSelectedAsset(asset)}
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
          <Badge 
            variant="secondary" 
            className={`absolute top-2 right-2 ${status.bg} ${status.color}`}
          >
            {status.label}
          </Badge>
        </div>
        <CardContent className="p-3">
          <h4 className="font-medium text-sm truncate">{asset.name}</h4>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TypeIcon className="h-3 w-3" />
              {asset.type}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(asset.file_size)}
            </span>
          </div>
        </CardContent>
      </Card>
    );
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
              <ImageIcon className="h-6 w-6 text-fuchsia-500" />
              Gallery Review
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Review and approve media assets for publication
            </p>
          </div>
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={`${statusConfig.pending.bg}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${statusConfig.pending.color}`}>Pending</p>
                <p className="text-2xl font-bold">{pendingAssets.length}</p>
              </div>
              <Clock className={`h-8 w-8 ${statusConfig.pending.color} opacity-50`} />
            </div>
          </CardContent>
        </Card>
        <Card className={`${statusConfig.approved.bg}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${statusConfig.approved.color}`}>Approved</p>
                <p className="text-2xl font-bold">{approvedAssets.length}</p>
              </div>
              <CheckCircle className={`h-8 w-8 ${statusConfig.approved.color} opacity-50`} />
            </div>
          </CardContent>
        </Card>
        <Card className={`${statusConfig.rejected.bg}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${statusConfig.rejected.color}`}>Rejected</p>
                <p className="text-2xl font-bold">{rejectedAssets.length}</p>
              </div>
              <XCircle className={`h-8 w-8 ${statusConfig.rejected.color} opacity-50`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingAssets.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedAssets.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedAssets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingAssets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No pending assets</h3>
                <p className="text-sm text-muted-foreground">All assets have been reviewed</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pendingAssets.map(renderAssetCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approvedAssets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No approved assets</h3>
                <p className="text-sm text-muted-foreground">Approve assets from the pending tab</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {approvedAssets.map(renderAssetCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {rejectedAssets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No rejected assets</h3>
                <p className="text-sm text-muted-foreground">Rejected assets will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rejectedAssets.map(renderAssetCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedAsset?.name}</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {selectedAsset.file_url ? (
                  selectedAsset.type === 'video' ? (
                    <video 
                      src={selectedAsset.file_url} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  ) : selectedAsset.type === 'audio' ? (
                    <audio src={selectedAsset.file_url} controls className="w-full" />
                  ) : (
                    <img 
                      src={selectedAsset.file_url} 
                      alt={selectedAsset.name}
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <ImageOff className="h-16 w-16 text-muted-foreground" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedAsset.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Size</p>
                  <p className="font-medium">{formatFileSize(selectedAsset.file_size)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Uploaded By</p>
                  <p className="font-medium">{selectedAsset.uploader_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Uploaded</p>
                  <p className="font-medium">
                    {new Date(selectedAsset.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedAsset.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedAsset.description}</p>
                </div>
              )}

              {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedAsset.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  {selectedAsset.file_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedAsset.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(selectedAsset)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {selectedAsset.status !== 'rejected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(selectedAsset)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  )}
                  {selectedAsset.status !== 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(selectedAsset)}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
