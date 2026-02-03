import { useState } from 'react';
import { useZapierWebhooks } from '@/hooks/useExternalIntegrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Zap, Plus, Trash2, Play, ExternalLink, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ZapierWebhooksPanelProps {
  workspaceId: string;
}

const triggerEvents = [
  { value: 'task_created', label: 'Task Created' },
  { value: 'task_completed', label: 'Task Completed' },
  { value: 'task_updated', label: 'Task Updated' },
  { value: 'member_joined', label: 'Member Joined' },
  { value: 'message_sent', label: 'Message Sent' },
  { value: 'document_created', label: 'Document Created' },
  { value: 'custom', label: 'Custom Trigger' },
];

export function ZapierWebhooksPanel({ workspaceId }: ZapierWebhooksPanelProps) {
  const { webhooks, isLoading, createWebhook, triggerWebhook, deleteWebhook } =
    useZapierWebhooks(workspaceId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [webhookName, setWebhookName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('');

  const handleAddWebhook = async () => {
    if (!webhookName || !webhookUrl || !triggerEvent) return;

    await createWebhook(webhookName, webhookUrl, triggerEvent);
    setAddDialogOpen(false);
    setWebhookName('');
    setWebhookUrl('');
    setTriggerEvent('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Zap className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle>Zapier Webhooks</CardTitle>
              <CardDescription>
                Trigger Zapier workflows from workspace events
              </CardDescription>
            </div>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Zapier Webhook</DialogTitle>
                <DialogDescription>
                  Create a Zap in Zapier first, then add the webhook URL here
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g., Notify Slack on task complete"
                    value={webhookName}
                    onChange={(e) => setWebhookName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get this from your Zapier trigger step
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Trigger Event</Label>
                  <Select value={triggerEvent} onValueChange={setTriggerEvent}>
                    <SelectTrigger>
                      <SelectValue placeholder="When should this trigger?" />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerEvents.map((event) => (
                        <SelectItem key={event.value} value={event.value}>
                          {event.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddWebhook}
                  disabled={!webhookName || !webhookUrl || !triggerEvent}
                >
                  Add Webhook
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No webhooks configured yet</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setAddDialogOpen(true)}
            >
              Add your first webhook
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Last Triggered</TableHead>
                <TableHead>Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell className="font-medium">{webhook.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {triggerEvents.find((e) => e.value === webhook.trigger_event)?.label ||
                        webhook.trigger_event}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {webhook.last_triggered_at ? (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(webhook.last_triggered_at), {
                          addSuffix: true,
                        })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>{webhook.trigger_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => triggerWebhook(webhook)}
                        title="Test webhook"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(webhook.webhook_url, '_blank')}
                        title="Open in Zapier"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteWebhook(webhook.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
