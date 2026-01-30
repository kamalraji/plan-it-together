import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/looseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  ImagePlus, 
  X, 
  GripVertical, 
  Star, 
  Loader2,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Form-level EventImage for gallery component
 * Uses camelCase for React conventions
 */
export interface EventImage {
  id?: string;
  url: string;
  caption: string;
  sortOrder: number;
  isPrimary: boolean;
}

/**
 * Database-level EventImage for Supabase operations
 */
export interface EventImageDB {
  id?: string;
  event_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  is_primary: boolean;
}

/**
 * Convert form-level EventImage to database format
 */
export const toEventImageDB = (image: EventImage, eventId: string): EventImageDB => ({
  id: image.id,
  event_id: eventId,
  image_url: image.url,
  caption: image.caption || null,
  sort_order: image.sortOrder,
  is_primary: image.isPrimary,
});

/**
 * Convert database EventImage to form format
 */
export const fromEventImageDB = (dbImage: EventImageDB): EventImage => ({
  id: dbImage.id,
  url: dbImage.image_url,
  caption: dbImage.caption || '',
  sortOrder: dbImage.sort_order,
  isPrimary: dbImage.is_primary,
});

interface EventImageGalleryProps {
  images: EventImage[];
  onChange: (images: EventImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export const EventImageGallery: React.FC<EventImageGalleryProps> = ({
  images,
  onChange,
  maxImages = 10,
  disabled = false,
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: 'Too many images',
        description: `Maximum ${maxImages} images allowed.`,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    const newImages: EventImage[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid file type',
            description: `${file.name} is not an image.`,
            variant: 'destructive',
          });
          continue;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'File too large',
            description: `${file.name} exceeds 5MB limit.`,
            variant: 'destructive',
          });
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `event-gallery/${fileName}`;

        // Upload to Supabase Storage
        const { error } = await supabase.storage
          .from('event-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${file.name}.`,
            variant: 'destructive',
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('event-images')
          .getPublicUrl(filePath);

        newImages.push({
          url: urlData.publicUrl,
          caption: '',
          sortOrder: images.length + newImages.length,
          isPrimary: images.length === 0 && newImages.length === 0,
        });
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
        toast({
          title: 'Images uploaded',
          description: `${newImages.length} image(s) added to gallery.`,
        });
      }
    } catch (_error) {
      toast({
        title: 'Upload failed',
        description: 'An error occurred while uploading images.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput);
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid image URL.',
        variant: 'destructive',
      });
      return;
    }

    if (images.length >= maxImages) {
      toast({
        title: 'Too many images',
        description: `Maximum ${maxImages} images allowed.`,
        variant: 'destructive',
      });
      return;
    }

    const newImage: EventImage = {
      url: urlInput.trim(),
      caption: '',
      sortOrder: images.length,
      isPrimary: images.length === 0,
    };

    onChange([...images, newImage]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // If removed image was primary, set first image as primary
    if (images[index].isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    // Recalculate sort orders
    newImages.forEach((img, i) => {
      img.sortOrder = i;
    });
    onChange(newImages);
  };

  const handleSetPrimary = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(newImages);
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], caption };
    onChange(newImages);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    // Update sort orders
    newImages.forEach((img, i) => {
      img.sortOrder = i;
    });

    onChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              draggable={!disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'relative group rounded-lg overflow-hidden border border-border/50 bg-muted/30 aspect-video',
                draggedIndex === index && 'opacity-50 ring-2 ring-primary',
                !disabled && 'cursor-grab active:cursor-grabbing'
              )}
            >
              <img
                src={image.url}
                alt={image.caption || `Event image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23999" font-size="12">No image</text></svg>';
                }}
              />
              
              {/* Overlay controls */}
              <div className={cn(
                'absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 transition-opacity',
                disabled ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
              )}>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={image.isPrimary ? 'default' : 'secondary'}
                    className="h-7 text-xs"
                    onClick={() => handleSetPrimary(index)}
                    title={image.isPrimary ? 'Primary image' : 'Set as primary'}
                  >
                    <Star className={cn('h-3 w-3 mr-1', image.isPrimary && 'fill-current')} />
                    {image.isPrimary ? 'Primary' : 'Set primary'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-7 w-7 p-0"
                    onClick={() => handleRemove(index)}
                    title="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Drag handle */}
              {!disabled && (
                <div className="absolute top-2 left-2 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4" />
                </div>
              )}

              {/* Primary badge */}
              {image.isPrimary && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Caption inputs */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Image Captions (optional)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {images.map((image, index) => (
              <div key={index} className="flex items-center gap-2">
                <img
                  src={image.url}
                  alt=""
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                />
                <Input
                  type="text"
                  placeholder={`Caption for image ${index + 1}`}
                  value={image.caption}
                  onChange={(e) => handleCaptionChange(index, e.target.value)}
                  disabled={disabled}
                  className="h-9 text-sm"
                  maxLength={200}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add image actions */}
      {images.length < maxImages && !disabled && (
        <div className="flex flex-wrap items-center gap-3">
          {/* File upload button */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              className="pointer-events-none"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </>
              )}
            </Button>
          </label>

          {/* URL input toggle */}
          {!showUrlInput ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowUrlInput(true)}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Add from URL
            </Button>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUrl();
                  }
                  if (e.key === 'Escape') {
                    setShowUrlInput(false);
                    setUrlInput('');
                  }
                }}
                className="h-9"
              />
              <Button type="button" size="sm" onClick={handleAddUrl}>
                <ImagePlus className="h-4 w-4 mr-1" />
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlInput('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !disabled && (
        <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center">
          <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Add event images</p>
          <p className="text-xs text-muted-foreground mb-4">
            Upload up to {maxImages} images to showcase your event
          </p>
          <div className="flex justify-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button type="button" variant="outline" size="sm" className="pointer-events-none">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowUrlInput(true)}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Paste URL
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {images.length}/{maxImages} images • Drag to reorder • First image is used as cover
      </p>
    </div>
  );
};

export default EventImageGallery;
