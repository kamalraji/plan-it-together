import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Share2, 
  Image, 
  Video, 
  Package, 
  Link2, 
  Copy, 
  Check,
  Filter,
  Search,
  FileArchive,
  
  Clock
} from 'lucide-react';
import { 
  useApprovedAssets, 
  useMarkAssetsExported,
  MediaAsset,
  GalleryReview
} from '@/hooks/useMediaCommitteeData';
import { toast } from 'sonner';

interface ExportAssetsTabProps {
  workspaceId: string;
}

interface AssetWithReview extends MediaAsset {
  review?: GalleryReview;
}

export function ExportAssetsTab({ workspaceId }: ExportAssetsTabProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterUsageRights, setFilterUsageRights] = useState<string>('all');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'original' | 'web' | 'social'>('original');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const { data: approvedAssets = [], isLoading } = useApprovedAssets(workspaceId);
  const markExportedMutation = useMarkAssetsExported(workspaceId);

  const filteredAssets = approvedAssets.filter((asset: AssetWithReview) => {
    if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterCategory !== 'all' && asset.category !== filterCategory) return false;
    if (filterUsageRights !== 'all' && asset.review?.usage_rights !== filterUsageRights) return false;
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
      setSelectedAssets(filteredAssets.map((a: AssetWithReview) => a.id));
    }
  };

  const handleExport = async () => {
    if (selectedAssets.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);

    // Simulate export progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setExportProgress(i);
    }

    // Mark assets as exported
    await markExportedMutation.mutateAsync(selectedAssets);

    // Generate fake download link (in real app, this would be from an edge function)
    const fakeLink = `https://storage.example.com/exports/${workspaceId}/${Date.now()}.zip`;
    setGeneratedLink(fakeLink);
    setIsExporting(false);
  };

  const handleCreateShareLink = async () => {
    // In a real implementation, this would create a shareable gallery link
    const shareLink = `${window.location.origin}/gallery/${workspaceId}/${Date.now()}`;
    setGeneratedLink(shareLink);
    toast.success('Share link created');
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast.success('Link copied to clipboard');
    }
  };

  const downloadAsset = (asset: AssetWithReview) => {
    // Create a download link
    const link = document.createElement('a');
    link.href = asset.file_url;
    link.download = asset.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getUsageRightsBadge = (rights?: string) => {
    switch (rights) {
      case 'all':
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">All Uses</Badge>;
      case 'press':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Press</Badge>;
      case 'social':
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">Social</Badge>;
      default:
        return <Badge variant="outline">Internal</Badge>;
    }
  };

  const categories = [...new Set(approvedAssets.map((a: AssetWithReview) => a.category).filter(Boolean))];

  const stats = {
    total: approvedAssets.length,
    exported: approvedAssets.filter((a: AssetWithReview) => a.is_exported).length,
    images: approvedAssets.filter((a: AssetWithReview) => a.type === 'image').length,
    videos: approvedAssets.filter((a: AssetWithReview) => a.type === 'video').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Export Assets</h2>
          <p className="text-muted-foreground">Download and share approved media</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Create Share Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Shareable Gallery</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Create a public link to share selected assets with stakeholders.
                </p>
                <div className="space-y-2">
                  <Label>Include assets</Label>
                  <Select defaultValue="selected">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selected">Selected ({selectedAssets.length})</SelectItem>
                      <SelectItem value="all-approved">All Approved ({approvedAssets.length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Link expiration</Label>
                  <Select defaultValue="7days">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="7days">7 days</SelectItem>
                      <SelectItem value="30days">30 days</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {generatedLink ? (
                  <div className="flex gap-2">
                    <Input value={generatedLink} readOnly className="flex-1" />
                    <Button onClick={copyLink}>
                      {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" onClick={handleCreateShareLink}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Generate Link
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={selectedAssets.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export ({selectedAssets.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Assets</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {!isExporting && !generatedLink ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Export {selectedAssets.length} selected assets as a ZIP archive.
                    </p>
                    <div className="space-y-2">
                      <Label>Export Format</Label>
                      <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as typeof exportFormat)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original">Original Quality</SelectItem>
                          <SelectItem value="web">Web Optimized (smaller size)</SelectItem>
                          <SelectItem value="social">Social Media (1080px max)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={handleExport}>
                      <Package className="h-4 w-4 mr-2" />
                      Create Export Package
                    </Button>
                  </>
                ) : isExporting ? (
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-center">
                      <FileArchive className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                    <p className="text-center text-sm">Creating export package...</p>
                    <Progress value={exportProgress} />
                    <p className="text-center text-xs text-muted-foreground">{exportProgress}%</p>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-center text-green-500">
                      <Check className="h-12 w-12" />
                    </div>
                    <p className="text-center font-medium">Export Ready!</p>
                    <div className="flex gap-2">
                      <Input value={generatedLink || ''} readOnly className="flex-1" />
                      <Button onClick={copyLink}>
                        {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button className="w-full" asChild>
                      <a href={generatedLink || '#'} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download ZIP
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => { setGeneratedLink(null); setExportDialogOpen(false); setSelectedAssets([]); }}
                    >
                      Done
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Approved Assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.exported}</div>
            <p className="text-sm text-muted-foreground">Previously Exported</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.images}</span>
            </div>
            <p className="text-sm text-muted-foreground">Images</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{stats.videos}</span>
            </div>
            <p className="text-sm text-muted-foreground">Videos</p>
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
        </div>

        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat as string}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterUsageRights} onValueChange={setFilterUsageRights}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Usage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rights</SelectItem>
              <SelectItem value="all">All Uses</SelectItem>
              <SelectItem value="press">Press</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Asset Grid */}
      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading assets...</CardContent></Card>
      ) : filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">No approved assets to export</p>
            <p className="text-sm text-muted-foreground">Review and approve assets in Gallery Review first</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAssets.map((asset: AssetWithReview) => (
            <Card 
              key={asset.id} 
              className={`cursor-pointer hover:shadow-md transition-all ${
                selectedAssets.includes(asset.id) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => toggleSelectAsset(asset.id)}
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
                  {asset.is_exported && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Exported
                    </Badge>
                  )}
                </div>
                {asset.type === 'image' ? (
                  <img
                    src={asset.file_url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium truncate">{asset.name}</p>
                <div className="flex items-center justify-between">
                  {getUsageRightsBadge(asset.review?.usage_rights)}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 w-7 p-0"
                    onClick={(e) => { e.stopPropagation(); downloadAsset(asset); }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
