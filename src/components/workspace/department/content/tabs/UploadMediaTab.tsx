import { useState, useRef } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMediaAssets } from '@/hooks/useContentDepartmentData';
import { Upload, Image, Video, Music, Loader2, Plus, Trash2, ExternalLink, X, FileIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface UploadMediaTabProps {
  workspace: Workspace;
}

const MEDIA_TYPES = [
  { value: 'photo', label: 'Photo', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music },
];

export function UploadMediaTab({ workspace }: UploadMediaTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: mediaAssets, isLoading } = useMediaAssets(workspace.id);
  
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'photo' | 'video' | 'audio'>('all');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: '' as 'photo' | 'video' | 'audio' | '',
    description: '',
    tags: '',
  });

  // Upload file to Supabase Storage
  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${workspace.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('vendor-portfolios')
      .upload(fileName, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('vendor-portfolios')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  };

  // Create media asset mutation
  const createAssetMutation = useMutation({
    mutationFn: async () => {
      let fileUrl: string | null = null;
      
      if (selectedFile) {
        setUploading(true);
        fileUrl = await uploadFile(selectedFile);
      }
      
      const { error } = await supabase
        .from('workspace_media_assets')
        .insert([{
          workspace_id: workspace.id,
          name: formData.name,
          type: formData.type,
          description: formData.description || null,
          file_url: fileUrl,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          uploaded_by: user?.id,
          uploader_name: user?.email?.split('@')[0] || 'Unknown',
          status: 'pending',
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-media-assets', workspace.id] });
      setFormData({ name: '', type: '', description: '', tags: '' });
      setSelectedFile(null);
      setShowForm(false);
      toast.success('Media asset uploaded');
    },
    onError: (error: Error) => {
      toast.error('Failed to upload: ' + error.message);
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const asset = mediaAssets?.find(a => a.id === assetId);
      
      // Delete file from storage if exists
      if (asset?.file_url) {
        const path = asset.file_url.split('/').pop();
        if (path) {
          await supabase.storage.from('vendor-portfolios').remove([`${workspace.id}/${path}`]);
        }
      }
      
      const { error } = await supabase
        .from('workspace_media_assets')
        .delete()
        .eq('id', assetId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-media-assets', workspace.id] });
      toast.success('Media asset deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: file.name.split('.')[0] }));
      }
      // Auto-detect type
      if (!formData.type) {
        if (file.type.startsWith('image/')) {
          setFormData(prev => ({ ...prev, type: 'photo' }));
        } else if (file.type.startsWith('video/')) {
          setFormData(prev => ({ ...prev, type: 'video' }));
        } else if (file.type.startsWith('audio/')) {
          setFormData(prev => ({ ...prev, type: 'audio' }));
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type) return;
    createAssetMutation.mutate();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <FileIcon className="h-4 w-4" />;
    }
  };

  const filteredAssets = mediaAssets?.filter(asset =>
    typeFilter === 'all' || asset.type === typeFilter
  ) || [];

  const stats = {
    total: mediaAssets?.length || 0,
    photos: mediaAssets?.filter(a => a.type === 'photo').length || 0,
    videos: mediaAssets?.filter(a => a.type === 'video').length || 0,
    audio: mediaAssets?.filter(a => a.type === 'audio').length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setTypeFilter('all')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Assets</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setTypeFilter('photo')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.photos}</span>
            </div>
            <p className="text-xs text-muted-foreground">Photos</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setTypeFilter('video')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{stats.videos}</span>
            </div>
            <p className="text-xs text-muted-foreground">Videos</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setTypeFilter('audio')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.audio}</span>
            </div>
            <p className="text-xs text-muted-foreground">Audio</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-500" />
              Upload Media
            </CardTitle>
            <CardDescription>Add photos, videos, and audio to your media library</CardDescription>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload New
            </Button>
          )}
        </CardHeader>

        {showForm && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File Upload Area */}
              <div className="space-y-2">
                <Label>File</Label>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    selectedFile ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileIcon className="h-6 w-6 text-primary" />
                      <span className="font-medium">{selectedFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Images, videos, or audio files
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Asset name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDIA_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="event, marketing, social"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the media..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setSelectedFile(null); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading || createAssetMutation.isPending}>
                  {(uploading || createAssetMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Upload Media
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Media Gallery */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Media Library</CardTitle>
            <CardDescription>
              {typeFilter === 'all' ? 'All media assets' : `Showing ${typeFilter} assets`}
            </CardDescription>
          </div>
          {typeFilter !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setTypeFilter('all')}>
              Clear Filter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {filteredAssets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No media assets found</p>
              <p className="text-sm">Click "Upload New" to add your first media file.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail/Preview */}
                  <div className="aspect-video bg-muted flex items-center justify-center relative">
                    {asset.file_url && asset.type === 'photo' ? (
                      <img
                        src={asset.file_url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground">
                        {getTypeIcon(asset.type)}
                      </div>
                    )}
                    <Badge
                      className="absolute top-2 right-2"
                      variant={asset.status === 'approved' ? 'default' : 'secondary'}
                    >
                      {asset.status}
                    </Badge>
                  </div>
                  
                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium truncate">{asset.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {getTypeIcon(asset.type)}
                          <span className="capitalize">{asset.type}</span>
                          <span>•</span>
                          <span>{format(new Date(asset.created_at), 'MMM d')}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {asset.file_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(asset.file_url!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteAssetMutation.mutate(asset.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {asset.tags && asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {asset.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {asset.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{asset.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
