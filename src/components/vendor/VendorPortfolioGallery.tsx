import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Upload, 
  Trash2, 
  ImagePlus, 
  Loader2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface VendorPortfolioGalleryProps {
  vendorId: string;
}

interface PortfolioImage {
  url: string;
  name: string;
}

const VendorPortfolioGallery: React.FC<VendorPortfolioGalleryProps> = ({ vendorId }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Fetch existing portfolio images
  const { data: images, isLoading } = useQuery({
    queryKey: ['vendor-portfolio', vendorId],
    queryFn: async () => {
      try {
        const { data: files, error } = await supabase.storage
          .from('vendor-portfolios')
          .list(`${vendorId}/gallery`, {
            limit: 50,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        // If the folder doesn't exist or is empty, return empty array
        if (error) {
          console.error('Storage list error:', error);
          // Return empty array instead of throwing for common errors
          if (error.message?.includes('not found') || error.message?.includes('empty')) {
            return [];
          }
          throw error;
        }

        const imageFiles = files?.filter(f => 
          f.name && f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
        ) || [];

        return imageFiles.map(file => ({
          url: supabase.storage
            .from('vendor-portfolios')
            .getPublicUrl(`${vendorId}/gallery/${file.name}`).data.publicUrl,
          name: file.name
        })) as PortfolioImage[];
      } catch (err) {
        console.error('Portfolio fetch error:', err);
        // Return empty array for any error - don't block the UI
        return [];
      }
    },
    enabled: !!vendorId,
    retry: false, // Don't retry on error
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileName: string) => {
      const { error } = await supabase.storage
        .from('vendor-portfolios')
        .remove([`${vendorId}/gallery/${fileName}`]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-portfolio', vendorId] });
      toast.success('Image deleted');
    },
    onError: () => {
      toast.error('Failed to delete image');
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error } = await supabase.storage
          .from('vendor-portfolios')
          .upload(`${vendorId}/gallery/${fileName}`, file);

        if (error) throw error;

        setUploadProgress(((i + 1) / validFiles.length) * 100);
      }

      queryClient.invalidateQueries({ queryKey: ['vendor-portfolio', vendorId] });
      toast.success(`${validFiles.length} image(s) uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload images');
      console.error(error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = (fileName: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      deleteMutation.mutate(fileName);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Portfolio Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Portfolio Gallery</CardTitle>
              <CardDescription>
                Showcase your best work to attract potential clients
              </CardDescription>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading {Math.round(uploadProgress)}%
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Add Images
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {images && images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.name}
                  className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <img
                    src={image.url}
                    alt="Portfolio"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9"
                      onClick={() => setPreviewImage(image.url)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-9 w-9"
                      onClick={() => handleDelete(image.name)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No images yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload images showcasing your work to attract more clients
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            Supported formats: JPG, PNG, GIF, WebP. Max file size: 10MB per image.
          </p>
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VendorPortfolioGallery;
