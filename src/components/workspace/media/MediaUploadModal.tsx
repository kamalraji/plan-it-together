import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileImage, FileVideo, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MediaUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

interface FileToUpload {
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

export function MediaUploadModal({ open, onOpenChange, workspaceId }: MediaUploadModalProps) {
  const [files, setFiles] = useState<FileToUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: FileToUpload[] = selectedFiles.map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFiles = async () => {
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'done') continue;

      setFiles((prev) => {
        const newFiles = [...prev];
        newFiles[i].status = 'uploading';
        return newFiles;
      });

      const file = files[i].file;
      const fileName = `${workspaceId}/${Date.now()}-${file.name}`;

      try {
        const { error } = await supabase.storage
          .from('media-assets')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[i].status = 'done';
          newFiles[i].progress = 100;
          return newFiles;
        });
      } catch (err) {
        console.error('Upload error:', err);
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[i].status = 'error';
          return newFiles;
        });
      }
    }

    setIsUploading(false);
    toast.success('Media uploaded successfully');
  };

  const handleClose = () => {
    files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    setFiles([]);
    onOpenChange(false);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (file.type.startsWith('video/')) return <FileVideo className="h-5 w-5 text-purple-500" />;
    return <FileImage className="h-5 w-5 text-muted-foreground" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              'hover:border-primary/50 hover:bg-muted/30'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">
              Images, videos, and raw files supported
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.arw,.raw,.cr2,.nef"
              onChange={handleFilesSelected}
              className="hidden"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((f, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                >
                  <div className="flex-shrink-0">
                    {f.preview ? (
                      <img
                        src={f.preview}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      getFileIcon(f.file)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(f.file.size)}
                    </p>
                    {f.status === 'uploading' && (
                      <Progress value={f.progress} className="h-1 mt-1" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {f.status === 'done' && (
                      <span className="text-xs text-green-600">Uploaded</span>
                    )}
                    {f.status === 'error' && (
                      <span className="text-xs text-red-600">Failed</span>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => removeFile(index)}
                      disabled={f.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={uploadFiles}
              disabled={files.length === 0 || isUploading}
            >
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload {files.length > 0 && `(${files.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
