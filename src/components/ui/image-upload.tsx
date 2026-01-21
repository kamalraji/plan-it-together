import React, { useCallback, useState } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/looseClient';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
  aspectRatio?: 'square' | 'banner' | 'auto';
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Enter image URL or upload',
  className,
  bucket = 'event-images',
  folder,
  maxSizeMB = 5,
  aspectRatio = 'auto',
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const aspectClasses = {
    square: 'aspect-square',
    banner: 'aspect-[3/1]',
    auto: 'aspect-video',
  };

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a JPEG, PNG, WebP, or GIF image.',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        toast({
          title: 'File too large',
          description: `Maximum file size is ${maxSizeMB}MB.`,
          variant: 'destructive',
        });
        return;
      }

      setIsUploading(true);

      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        if (!userId) {
          toast({
            title: 'Authentication required',
            description: 'Please sign in to upload images.',
            variant: 'destructive',
          });
          return;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const fileName = `${timestamp}-${randomId}.${fileExt}`;
        const filePath = folder ? `${userId}/${folder}/${fileName}` : `${userId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

        onChange(urlData.publicUrl);
        toast({
          title: 'Image uploaded',
          description: 'Your image has been uploaded successfully.',
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Failed to upload image.',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [bucket, folder, maxSizeMB, onChange, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [disabled, isUploading, handleUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      // Reset input
      e.target.value = '';
    },
    [handleUpload]
  );

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* URL Input */}
      <div className="flex gap-2">
        <Input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          className="flex-1"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={disabled || isUploading}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors overflow-hidden',
          dragActive ? 'border-primary bg-primary/5' : 'border-border',
          disabled && 'opacity-50 cursor-not-allowed',
          !value && aspectClasses[aspectRatio]
        )}
      >
        {value ? (
          // Preview
          <div className={cn('relative', aspectClasses[aspectRatio])}>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '';
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  disabled={disabled || isUploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={disabled || isUploading}
                  asChild
                >
                  <span>
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Replace
                  </span>
                </Button>
              </label>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleClear}
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          // Empty state
          <label
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-6 cursor-pointer h-full',
              (disabled || isUploading) && 'cursor-not-allowed'
            )}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              disabled={disabled || isUploading}
              className="hidden"
            />
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-foreground">
                    Drop image here or click to upload
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPEG, PNG, WebP or GIF (max {maxSizeMB}MB)
                  </p>
                </div>
              </>
            )}
          </label>
        )}
      </div>
    </div>
  );
};
