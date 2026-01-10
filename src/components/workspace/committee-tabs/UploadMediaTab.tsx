import React, { useState } from 'react';
import { Workspace } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMediaAssets } from '@/hooks/useContentDepartmentData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Image, Video, Music, Loader2, Trash2, Filter, ExternalLink } from 'lucide-react';

interface UploadMediaTabProps {
  workspace: Workspace;
}

type MediaType = 'photo' | 'video' | 'audio';

const MEDIA_TYPES: { value: MediaType; label: string; icon: React.ElementType }[] = [
  { value: 'photo', label: 'Photo', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music },
];

export function UploadMediaTab({ workspace }: UploadMediaTabProps) {
  const queryClient = useQueryClient();
  const { data: mediaAssets, isLoading } = useMediaAssets(workspace.id);

  const [name, setName] = useState('');
  const [type, setType] = useState<MediaType>('photo');
  const [fileUrl, setFileUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all');

  const createMutation = useMutation({
    mutationFn: async (asset: {
      name: string;
      type: MediaType;
      file_url: string | null;
      description: string | null;
      tags: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('workspace_media_assets')
        .insert({
          workspace_id: workspace.id,
          name: asset.name,
          type: asset.type,
          file_url: asset.file_url,
          description: asset.description,
          tags: asset.tags,
          uploaded_by: user?.id,
          uploader_name: user?.email?.split('@')[0] || 'Unknown',
          status: 'uploaded',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-media-assets', workspace.id] });
      toast.success('Media asset added successfully');
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to add asset: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (assetId: string) => {
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
    onError: (error: any) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const resetForm = () => {
    setName('');
    setType('photo');
    setFileUrl('');
    setDescription('');
    setTags('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter an asset name');
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      type,
      file_url: fileUrl.trim() || null,
      description: description.trim() || null,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
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

  const getTypeIcon = (assetType: MediaType) => {
    const config = MEDIA_TYPES.find(t => t.value === assetType);
    return config?.icon || Image;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Assets</div>
          </CardContent>
        </Card>
        {MEDIA_TYPES.map(({ value, label, icon: Icon }) => (
          <Card key={value} className="bg-muted/30">
            <CardContent className="p-4 text-center">
              <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats[value === 'photo' ? 'photos' : value === 'video' ? 'videos' : 'audio']}</div>
              <div className="text-xs text-muted-foreground">{label}s</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Media
            </CardTitle>
            <CardDescription>Add new media assets to the library</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="asset-name">Asset Name *</Label>
                <Input
                  id="asset-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter asset name"
                />
              </div>

              <div className="space-y-2">
                <Label>Media Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as MediaType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIA_TYPES.map(({ value, label, icon: Icon }) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-url">File URL</Label>
                <Input
                  id="file-url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the asset..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="event, keynote, opening..."
                />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Add Asset
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Media Library */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Media Library
              </CardTitle>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as MediaType | 'all')}>
                <SelectTrigger className="w-28">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {MEDIA_TYPES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}s
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No media assets found
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredAssets.map((asset) => {
                    const TypeIcon = getTypeIcon(asset.type);

                    return (
                      <div
                        key={asset.id}
                        className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <TypeIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{asset.name}</h4>
                              <Badge variant="outline" className="text-xs capitalize">
                                {asset.type}
                              </Badge>
                            </div>
                            {asset.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                {asset.description}
                              </p>
                            )}
                            {asset.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {asset.tags.slice(0, 3).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {asset.tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{asset.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {asset.file_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(asset.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
