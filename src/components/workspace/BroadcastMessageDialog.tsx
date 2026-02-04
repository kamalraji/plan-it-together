import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Megaphone, Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface BroadcastMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
}

export function BroadcastMessageDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
}: BroadcastMessageDialogProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [includeSubWorkspaces, setIncludeSubWorkspaces] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please enter both title and message');
      return;
    }

    setIsSending(true);
    try {
      // Insert broadcast announcement
      const { error } = await supabase.from('workspace_announcements').insert({
        workspace_id: workspaceId,
        title: title.trim(),
        content: message.trim(),
        is_pinned: false,
        include_sub_workspaces: includeSubWorkspaces,
      });

      if (error) throw error;

      toast.success('Broadcast message sent successfully!');
      setTitle('');
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to send broadcast:', error);
      toast.error('Failed to send broadcast message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Broadcast Message
          </DialogTitle>
          <DialogDescription>
            Send an announcement to all teams in {workspaceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="broadcast-title">Title</Label>
            <Input
              id="broadcast-title"
              placeholder="Announcement title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="broadcast-message">Message</Label>
            <Textarea
              id="broadcast-message"
              placeholder="Write your announcement message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-sub"
              checked={includeSubWorkspaces}
              onCheckedChange={(checked) => setIncludeSubWorkspaces(!!checked)}
            />
            <Label htmlFor="include-sub" className="text-sm font-normal cursor-pointer">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Include all sub-workspaces (departments, committees, teams)
              </span>
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              'Sending...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Broadcast
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
