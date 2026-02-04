import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Hash } from 'lucide-react';
import { Platform, NotificationType, CreateIntegrationInput } from '@/hooks/useWorkspaceIntegrations';

interface AddIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onSubmit: (input: CreateIntegrationInput) => void;
  isLoading?: boolean;
}

const platforms: { id: Platform; name: string; icon: React.ReactNode; placeholder: string }[] = [
  {
    id: 'slack',
    name: 'Slack',
    icon: <Hash className="h-5 w-5" />,
    placeholder: 'https://hooks.slack.com/services/...',
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: <MessageSquare className="h-5 w-5" />,
    placeholder: 'https://discord.com/api/webhooks/...',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    icon: <MessageSquare className="h-5 w-5" />,
    placeholder: 'https://outlook.office.com/webhook/...',
  },
  {
    id: 'webhook',
    name: 'Custom Webhook',
    icon: <MessageSquare className="h-5 w-5" />,
    placeholder: 'https://your-api.com/webhook',
  },
];

const notificationTypes: { id: NotificationType; label: string; description: string }[] = [
  { id: 'broadcast', label: 'Broadcasts', description: 'Team-wide announcements' },
  { id: 'task_assignment', label: 'Task Assignments', description: 'When tasks are assigned' },
  { id: 'deadline_reminder', label: 'Deadline Reminders', description: 'Upcoming task deadlines' },
  { id: 'channel_message', label: 'Channel Messages', description: '@channel mentions' },
];

export function AddIntegrationModal({
  open,
  onOpenChange,
  workspaceId,
  onSubmit,
  isLoading,
}: AddIntegrationModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [name, setName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<NotificationType[]>(['broadcast', 'task_assignment']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform || !name || !webhookUrl) return;

    onSubmit({
      workspace_id: workspaceId,
      platform: selectedPlatform,
      name,
      webhook_url: webhookUrl,
      notification_types: selectedTypes,
    });

    // Reset form
    setSelectedPlatform(null);
    setName('');
    setWebhookUrl('');
    setSelectedTypes(['broadcast', 'task_assignment']);
  };

  const toggleNotificationType = (type: NotificationType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const selectedPlatformConfig = platforms.find((p) => p.id === selectedPlatform);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Integration</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Platform Selection */}
          <div className="space-y-3">
            <Label>Platform</Label>
            <div className="grid grid-cols-2 gap-2">
              {platforms.map((platform) => (
                <Button
                  key={platform.id}
                  type="button"
                  variant={selectedPlatform === platform.id ? 'default' : 'outline'}
                  className="justify-start gap-2 h-12"
                  onClick={() => setSelectedPlatform(platform.id)}
                >
                  {platform.icon}
                  {platform.name}
                </Button>
              ))}
            </div>
          </div>

          {selectedPlatform && (
            <>
              {/* Integration Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Integration Name</Label>
                <Input
                  id="name"
                  placeholder={`e.g., ${selectedPlatformConfig?.name} - General`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder={selectedPlatformConfig?.placeholder}
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {selectedPlatform === 'slack' && 'Create a webhook in your Slack workspace settings'}
                  {selectedPlatform === 'discord' && 'Create a webhook in your Discord channel settings'}
                  {selectedPlatform === 'teams' && 'Create an Incoming Webhook connector in your Teams channel'}
                  {selectedPlatform === 'webhook' && 'Enter your custom webhook endpoint URL'}
                </p>
              </div>

              {/* Notification Types */}
              <div className="space-y-3">
                <Label>Notification Types</Label>
                <div className="space-y-2">
                  {notificationTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50"
                    >
                      <Checkbox
                        id={type.id}
                        checked={selectedTypes.includes(type.id)}
                        onCheckedChange={() => toggleNotificationType(type.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={type.id} className="text-sm font-medium cursor-pointer">
                          {type.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedPlatform || !name || !webhookUrl || selectedTypes.length === 0 || isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Integration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
