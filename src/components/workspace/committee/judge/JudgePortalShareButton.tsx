import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Share2,
  Copy,
  ExternalLink,
  Mail,
  CheckCircle2,
  Link as LinkIcon,
} from 'lucide-react';

interface JudgePortalShareButtonProps {
  workspaceId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function JudgePortalShareButton({
  variant = 'outline',
  size = 'default',
  showLabel = true,
}: JudgePortalShareButtonProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const portalUrl = `${window.location.origin}/${orgSlug}/judge-portal`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenPortal = () => {
    window.open(portalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent('Judge Portal Access');
    const body = encodeURIComponent(
      `You have been invited to access the Judge Portal.\n\nPlease use the following link to access your scoring dashboard:\n\n${portalUrl}\n\nMake sure you are logged in with your registered email address.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size}>
            <Share2 className="h-4 w-4" />
            {showLabel && <span className="ml-2">Share Portal</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenPortal}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEmailShare}>
            <Mail className="h-4 w-4 mr-2" />
            Share via Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowDialog(true)}>
            <LinkIcon className="h-4 w-4 mr-2" />
            View Full URL
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Judge Portal Link
            </DialogTitle>
            <DialogDescription>
              Share this link with judges to access their scoring dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={portalUrl}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                Requires login
              </Badge>
              <Badge variant="outline" className="text-xs">
                Judge access only
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleOpenPortal}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Portal
              </Button>
              <Button
                variant="default"
                onClick={handleEmailShare}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Navigation button to go to the portal
export function JudgePortalNavigateButton({
  variant = 'default',
  size = 'default',
  showLabel = true,
}: JudgePortalShareButtonProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const portalUrl = `/${orgSlug}/judge-portal`;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => window.open(portalUrl, '_blank', 'noopener,noreferrer')}
    >
      <ExternalLink className="h-4 w-4" />
      {showLabel && <span className="ml-2">Open Judge Portal</span>}
    </Button>
  );
}
