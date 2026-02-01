import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Image, Video, File, Check, Loader2 } from 'lucide-react';
import { useUploadMediaAsset, useMediaAssets } from '@/hooks/useMediaCommitteeData';
import { format } from 'date-fns';

interface UploadMediaTabProps {
  workspaceId: string;
}

const CATEGORIES = [
  { value: 'opening', label: 'Opening Ceremony' },
  { value: 'keynote', label: 'Keynote' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'networking', label: 'Networking' },
  { value: 'candid', label: 'Candid' },
  { value: 'vip', label: 'VIP' },
  { value: 'b-roll', label: 'B-Roll' },
  { value: 'setup', label: 'Setup/Teardown' },
  { value: 'other', label: 'Other' },
];

const EVENT_SEGMENTS = [
  'Day 1 - Morning',
  'Day 1 - Afternoon',
  'Day 1 - Evening',
  'Day 2 - Morning',
  'Day 2 - Afternoon',
  'Day 2 - Evening',
  'Pre-Event',
  'Post-Event',
];

export function UploadMediaTab({ workspaceId }: UploadMediaTabProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<string>('');
  const [eventSegment, setEventSegment] = useState<string>('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedCount, setUploadedCount] = useState(0);

  const uploadMutation = useUploadMediaAsset(workspaceId);
  const { data: recentAssets = [], isLoading } = useMediaAssets(workspaceId);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploadedCount(0);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));
      
      try {
        await uploadMutation.mutateAsync({
          file,
          category,
          eventSegment,
          tags,
          description,
        });
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        setUploadedCount(prev => prev + 1);
      } catch {
        setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
      }
    }

    // Clear form after upload
    setTimeout(() => {
      setFiles([]);
      setUploadProgress({});
      setCategory('');
      setEventSegment('');
      setDescription('');
      setTags([]);
    }, 1500);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />;
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4 text-purple-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload Media</h2>
        <p className="text-muted-foreground">Upload photos and videos to the media library</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Drop Zone */}
          <Card>
            <CardContent className="pt-6">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">Drop files here or click to upload</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports images (JPG, PNG, WebP) and videos (MP4, MOV)
                </p>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </CardContent>
          </Card>

          {/* Selected Files */}
          {files.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Selected Files ({files.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                  >
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    {uploadProgress[file.name] !== undefined ? (
                      uploadProgress[file.name] === 100 ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : uploadProgress[file.name] === -1 ? (
                        <X className="h-4 w-4 text-destructive" />
                      ) : (
                        <Progress value={uploadProgress[file.name]} className="w-20 h-2" />
                      )
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Media Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Event Segment</Label>
                  <Select value={eventSegment} onValueChange={setEventSegment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select segment" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_SEGMENTS.map(seg => (
                        <SelectItem key={seg} value={seg}>
                          {seg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Optional description for these files..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button variant="outline" onClick={addTag}>Add</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploadMutation.isPending}
            className="w-full"
            size="lg"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading ({uploadedCount}/{files.length})...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
              </>
            )}
          </Button>
        </div>

        {/* Recent Uploads */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : recentAssets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No uploads yet
                </div>
              ) : (
                <div className="space-y-2">
                  {recentAssets.slice(0, 10).map(asset => (
                    <div
                      key={asset.id}
                      className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm"
                    >
                      {asset.type === 'image' ? (
                        <Image className="h-4 w-4 text-blue-500 shrink-0" />
                      ) : asset.type === 'video' ? (
                        <Video className="h-4 w-4 text-purple-500 shrink-0" />
                      ) : (
                        <File className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(asset.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {asset.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
