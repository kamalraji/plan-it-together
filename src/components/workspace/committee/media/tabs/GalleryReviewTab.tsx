import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Image, 
  Video, 
  Grid3X3, 
  List, 
  Check, 
  X, 
  Star, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  RotateCcw
} from 'lucide-react';
import { 
  useAssetsWithReviews, 
  useCreateGalleryReview, 
  useBulkReviewAssets,
  MediaAsset,
  GalleryReview
} from '@/hooks/useMediaCommitteeData';
import { format } from 'date-fns';

interface GalleryReviewTabProps {
  workspaceId: string;
}

export function GalleryReviewTab({ workspaceId }: GalleryReviewTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [previewAsset, setPreviewAsset] = useState<(MediaAsset & { review?: GalleryReview }) | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [usageRights, setUsageRights] = useState<GalleryReview['usage_rights']>('internal');

  const { data: assets = [], isLoading } = useAssetsWithReviews(workspaceId);
  const reviewMutation = useCreateGalleryReview(workspaceId);
  const bulkReviewMutation = useBulkReviewAssets(workspaceId);

  const filteredAssets = assets.filter(asset => {
    if (filterStatus !== 'all') {
      const status = asset.review?.status || 'pending';
      if (status !== filterStatus) return false;
    }
    if (filterType !== 'all' && asset.type !== filterType) return false;
    return true;
  });

  const toggleSelectAsset = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  const selectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map(a => a.id));
    }
  };

  const handleBulkAction = async (status: GalleryReview['status']) => {
    if (selectedAssets.length === 0) return;
    await bulkReviewMutation.mutateAsync({ assetIds: selectedAssets, status, usageRights });
    setSelectedAssets([]);
  };

  const handleReview = async (assetId: string, status: GalleryReview['status']) => {
    await reviewMutation.mutateAsync({
      assetId,
      status,
      rating: rating || undefined,
      feedback: feedback || undefined,
      usageRights,
    });
    setFeedback('');
    setRating(0);
    
    // Move to next asset
    const currentIndex = filteredAssets.findIndex(a => a.id === assetId);
    if (currentIndex < filteredAssets.length - 1) {
      setPreviewAsset(filteredAssets[currentIndex + 1]);
    } else {
      setPreviewAsset(null);
    }
  };

  const navigatePreview = (direction: 'prev' | 'next') => {
    if (!previewAsset) return;
    const currentIndex = filteredAssets.findIndex(a => a.id === previewAsset.id);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < filteredAssets.length) {
      setPreviewAsset(filteredAssets[newIndex]);
      setFeedback('');
      setRating(0);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-200">Rejected</Badge>;
      case 'revision_requested':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Revision</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const stats = {
    total: assets.length,
    pending: assets.filter(a => !a.review || a.review.status === 'pending').length,
    approved: assets.filter(a => a.review?.status === 'approved').length,
    rejected: assets.filter(a => a.review?.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gallery Review</h2>
          <p className="text-muted-foreground">Review and approve media assets</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
            <TabsList>
              <TabsTrigger value="grid"><Grid3X3 className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="list"><List className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 items-center">
          <Checkbox
            checked={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0}
            onCheckedChange={selectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedAssets.length > 0 ? `${selectedAssets.length} selected` : 'Select all'}
          </span>
          
          {selectedAssets.length > 0 && (
            <div className="flex gap-2 ml-4">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-green-600"
                onClick={() => handleBulkAction('approved')}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-600"
                onClick={() => handleBulkAction('rejected')}
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="revision_requested">Revision</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Gallery */}
      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading assets...</CardContent></Card>
      ) : filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">No assets to review</p>
            <p className="text-sm text-muted-foreground">Upload media to start reviewing</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => (
            <Card 
              key={asset.id} 
              className={`cursor-pointer hover:shadow-md transition-all ${
                selectedAssets.includes(asset.id) ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="relative aspect-square bg-muted rounded-t-lg overflow-hidden">
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedAssets.includes(asset.id)}
                    onCheckedChange={() => toggleSelectAsset(asset.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="absolute top-2 right-2 z-10">
                  {getStatusBadge(asset.review?.status)}
                </div>
                {asset.type === 'image' ? (
                  <img
                    src={asset.file_url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                    onClick={() => setPreviewAsset(asset)}
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center bg-muted"
                    onClick={() => setPreviewAsset(asset)}
                  >
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{asset.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(asset.created_at), 'MMM d, h:mm a')}
                </p>
                {asset.review?.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= asset.review!.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAssets.map((asset) => (
            <Card 
              key={asset.id} 
              className={`cursor-pointer hover:shadow-md transition-all ${
                selectedAssets.includes(asset.id) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setPreviewAsset(asset)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <Checkbox
                  checked={selectedAssets.includes(asset.id)}
                  onCheckedChange={() => toggleSelectAsset(asset.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="w-16 h-16 bg-muted rounded overflow-hidden shrink-0">
                  {asset.type === 'image' ? (
                    <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{asset.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{asset.type}</span>
                    <span>•</span>
                    <span>{format(new Date(asset.created_at), 'MMM d, h:mm a')}</span>
                    {asset.category && (
                      <>
                        <span>•</span>
                        <Badge variant="secondary">{asset.category}</Badge>
                      </>
                    )}
                  </div>
                </div>
                {getStatusBadge(asset.review?.status)}
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="text-green-600" onClick={(e) => { e.stopPropagation(); handleReview(asset.id, 'approved'); }}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={(e) => { e.stopPropagation(); handleReview(asset.id, 'rejected'); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span>{previewAsset?.name}</span>
              {previewAsset && getStatusBadge(previewAsset.review?.status)}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex gap-4 overflow-hidden">
            {/* Preview Area */}
            <div className="flex-1 relative bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 z-10"
                onClick={() => navigatePreview('prev')}
                disabled={filteredAssets.findIndex(a => a.id === previewAsset?.id) === 0}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              {previewAsset?.type === 'image' ? (
                <img
                  src={previewAsset.file_url}
                  alt={previewAsset.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : previewAsset?.type === 'video' ? (
                <video
                  src={previewAsset.file_url}
                  controls
                  className="max-w-full max-h-full"
                />
              ) : null}

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 z-10"
                onClick={() => navigatePreview('next')}
                disabled={filteredAssets.findIndex(a => a.id === previewAsset?.id) === filteredAssets.length - 1}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            {/* Review Panel */}
            <div className="w-72 space-y-4 overflow-y-auto">
              <div>
                <h4 className="font-medium mb-2">Rating</h4>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Usage Rights</h4>
                <Select value={usageRights} onValueChange={(v) => setUsageRights(v as typeof usageRights)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal Only</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="press">Press</SelectItem>
                    <SelectItem value="all">All Uses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h4 className="font-medium mb-2">Feedback</h4>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add feedback or notes..."
                  rows={4}
                />
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => previewAsset && handleReview(previewAsset.id, 'approved')}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  variant="outline"
                  className="w-full text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                  onClick={() => previewAsset && handleReview(previewAsset.id, 'revision_requested')}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Request Revision
                </Button>
                <Button 
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => previewAsset && handleReview(previewAsset.id, 'rejected')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Use ← → to navigate • A to approve • R to reject
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
