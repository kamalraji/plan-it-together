import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Globe, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (label?: string) => Promise<void>;
  eventSlug: string;
  isPublishing: boolean;
  hasPublishedVersion: boolean;
}

export const PublishDialog: React.FC<PublishDialogProps> = ({
  open,
  onOpenChange,
  onPublish,
  eventSlug,
  isPublishing,
  hasPublishedVersion,
}) => {
  const [versionLabel, setVersionLabel] = useState('');
  const [published, setPublished] = useState(false);

  const handlePublish = async () => {
    try {
      await onPublish(versionLabel || undefined);
      setPublished(true);
      setTimeout(() => {
        setPublished(false);
        setVersionLabel('');
        onOpenChange(false);
      }, 2000);
    } catch {
      // Error handled by parent
    }
  };

  const publicUrl = `${window.location.origin}/event/${eventSlug}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Publish Landing Page
          </DialogTitle>
          <DialogDescription>
            {hasPublishedVersion
              ? 'This will update the live event page with your latest changes.'
              : 'This will make your event page publicly accessible.'}
          </DialogDescription>
        </DialogHeader>

        {published ? (
          <div className="py-8 flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Published successfully!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your landing page is now live.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open(publicUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              View Live Page
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Public URL Preview */}
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Public URL</p>
                <p className="text-sm font-mono truncate">{publicUrl}</p>
              </div>

              {/* Version Label (optional) */}
              <div className="space-y-2">
                <Label htmlFor="version-label" className="text-sm">
                  Version Label (optional)
                </Label>
                <Input
                  id="version-label"
                  placeholder="e.g., Added sponsor section"
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground">
                  A label helps you identify this version later if you need to rollback.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing}
                className={cn(
                  'gap-2',
                  isPublishing && 'cursor-not-allowed'
                )}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" />
                    Publish Now
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
