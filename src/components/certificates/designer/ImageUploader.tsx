import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Upload, Link, Image, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Curated background patterns
const BACKGROUND_LIBRARY = [
  {
    id: 'elegant-gold',
    name: 'Elegant Gold Border',
    category: 'elegant',
    url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=200&q=60',
  },
  {
    id: 'modern-gradient',
    name: 'Modern Blue Gradient',
    category: 'modern',
    url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=200&q=60',
  },
  {
    id: 'corporate-clean',
    name: 'Corporate Clean',
    category: 'corporate',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200&q=60',
  },
  {
    id: 'creative-abstract',
    name: 'Creative Abstract',
    category: 'creative',
    url: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=200&q=60',
  },
  {
    id: 'academic-parchment',
    name: 'Academic Parchment',
    category: 'academic',
    url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=200&q=60',
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    category: 'modern',
    url: 'https://images.unsplash.com/photo-1533628635777-112b2239b1c7?w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1533628635777-112b2239b1c7?w=200&q=60',
  },
];

interface ImageUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageSelected: (url: string, isBackground?: boolean) => void;
  workspaceId: string;
}

export function ImageUploader({
  open,
  onOpenChange,
  onImageSelected,
  workspaceId,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [setAsBackground, setSetAsBackground] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${workspaceId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('certificate-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('certificate-assets')
        .getPublicUrl(data.path);

      onImageSelected(urlData.publicUrl, setAsBackground);
      onOpenChange(false);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [workspaceId, onImageSelected, onOpenChange, setAsBackground]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    
    onImageSelected(urlInput.trim(), setAsBackground);
    onOpenChange(false);
    setUrlInput('');
  };

  const handleLibrarySelect = (url: string) => {
    onImageSelected(url, true); // Background library items are always backgrounds
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Image</DialogTitle>
          <DialogDescription>
            Upload an image, enter a URL, or choose from the background library
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors duration-200
                ${dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
                }
              `}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drag and drop an image here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse (max 5MB)
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="setAsBackground"
                checked={setAsBackground}
                onChange={(e) => setSetAsBackground(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="setAsBackground" className="text-sm">
                Set as background image (full canvas)
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label>Image URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setPreviewUrl(e.target.value);
                  }}
                />
                <Button onClick={handleUrlSubmit}>
                  <Link className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            {previewUrl && (
              <div className="border rounded-lg p-2">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 w-full object-contain rounded"
                  onError={() => setPreviewUrl(null)}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="setAsBackgroundUrl"
                checked={setAsBackground}
                onChange={(e) => setSetAsBackground(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="setAsBackgroundUrl" className="text-sm">
                Set as background image
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="library">
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-2 gap-3 p-1">
                {BACKGROUND_LIBRARY.map((bg) => (
                  <button
                    key={bg.id}
                    className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                    onClick={() => handleLibrarySelect(bg.url)}
                  >
                    <img
                      src={bg.thumbnail}
                      alt={bg.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-center">
                        <Image className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-xs font-medium">{bg.name}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
