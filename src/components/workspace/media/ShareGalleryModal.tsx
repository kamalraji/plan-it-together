import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Copy, Check, Link2, Mail, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface ShareGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function ShareGalleryModal({ open, onOpenChange, workspaceId }: ShareGalleryModalProps) {
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState({
    allowDownload: true,
    requirePassword: false,
    expiresIn: '7days',
  });

  // Generate a shareable link (in production this would create a record in DB)
  const shareableLink = `${window.location.origin}/gallery/${workspaceId}`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const sendViaEmail = () => {
    const subject = encodeURIComponent('Event Media Gallery');
    const body = encodeURIComponent(`Check out the event media gallery: ${shareableLink}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Gallery</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shareable Link */}
          <div className="space-y-2">
            <Label>Shareable Link</Label>
            <div className="flex gap-2">
              <Input
                value={shareableLink}
                readOnly
                className="bg-muted/30"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Downloads</Label>
                <p className="text-xs text-muted-foreground">
                  Viewers can download media files
                </p>
              </div>
              <Switch
                checked={settings.allowDownload}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allowDownload: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Password Protection</Label>
                <p className="text-xs text-muted-foreground">
                  Require password to access
                </p>
              </div>
              <Switch
                checked={settings.requirePassword}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, requirePassword: checked })
                }
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" className="gap-2" onClick={copyToClipboard}>
              <Link2 className="h-4 w-4" />
              Copy Link
            </Button>
            <Button variant="outline" className="gap-2" onClick={sendViaEmail}>
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button variant="outline" className="gap-2" disabled>
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
