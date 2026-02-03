import { useState } from 'react';
import { useExternalIntegrations } from '@/hooks/useExternalIntegrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Calendar,
  Github,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ExternalIntegration } from '@/hooks/useExternalIntegrations';

interface IntegrationsHubProps {
  workspaceId: string;
}

const integrationConfigs = {
  google_calendar: {
    name: 'Google Calendar',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Sync task deadlines with Google Calendar',
  },
  github: {
    name: 'GitHub',
    icon: Github,
    color: 'text-gray-900 dark:text-gray-100',
    bgColor: 'bg-gray-500/10',
    description: 'Link tasks to GitHub issues and PRs',
  },
  jira: {
    name: 'Jira',
    icon: () => (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 11.513H0l5.786-5.714 5.785 5.714zm5.714-5.714L11.57 0 5.785 5.786l5.714 5.714 5.786-5.701zm-5.714 17.2l5.714-5.713-5.714-5.714L5.857 17.286l5.714 5.713z" />
      </svg>
    ),
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    description: 'Sync with Jira issues and projects',
  },
  zapier: {
    name: 'Zapier',
    icon: Zap,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    description: 'Connect to 5,000+ apps via webhooks',
  },
};

export function IntegrationsHub({ workspaceId }: IntegrationsHubProps) {
  const {
    integrations,
    isLoading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
  } = useExternalIntegrations(workspaceId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ExternalIntegration['integration_type'] | ''>('');
  const [integrationName, setIntegrationName] = useState('');

  const handleAddIntegration = async () => {
    if (!selectedType || !integrationName) return;
    
    await createIntegration(selectedType, integrationName);
    setAddDialogOpen(false);
    setSelectedType('');
    setIntegrationName('');
  };

  const handleToggleActive = async (integration: ExternalIntegration) => {
    await updateIntegration(integration.id, { is_active: !integration.is_active });
  };

  const availableTypes = Object.entries(integrationConfigs).filter(
    ([type]) => !integrations.some((i) => i.integration_type === type)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">External Integrations</h2>
          <p className="text-muted-foreground">
            Connect your workspace to external services
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={availableTypes.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Integration</DialogTitle>
              <DialogDescription>
                Connect a new external service to your workspace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Integration Type</Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select integration" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map(([type, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <Icon className={cn('h-4 w-4', config.color)} />
                            {config.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Connection Name</Label>
                <Input
                  placeholder="e.g., Work Calendar, Main Repo"
                  value={integrationName}
                  onChange={(e) => setIntegrationName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddIntegration} disabled={!selectedType || !integrationName}>
                Add Integration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Available Integrations Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : integrations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="font-medium mb-1">No integrations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect external services to automate your workflow
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Integration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => {
            const config = integrationConfigs[integration.integration_type];
            const Icon = config.icon;

            return (
              <Card key={integration.id} className={cn(!integration.is_active && 'opacity-60')}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={cn('p-2 rounded-lg', config.bgColor)}>
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>
                    <Switch
                      checked={integration.is_active}
                      onCheckedChange={() => handleToggleActive(integration)}
                    />
                  </div>
                  <CardTitle className="text-lg">{integration.name}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    {integration.sync_status === 'success' ? (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-200">
                        <CheckCircle className="h-3 w-3" />
                        Connected
                      </Badge>
                    ) : integration.sync_status === 'error' ? (
                      <Badge variant="outline" className="gap-1 text-red-600 border-red-200">
                        <XCircle className="h-3 w-3" />
                        Error
                      </Badge>
                    ) : integration.sync_status === 'syncing' ? (
                      <Badge variant="outline" className="gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Syncing
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Settings className="h-3 w-3" />
                        Idle
                      </Badge>
                    )}
                  </div>
                  {integration.last_sync_at && (
                    <p className="text-xs text-muted-foreground">
                      Last synced{' '}
                      {formatDistanceToNow(new Date(integration.last_sync_at), {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteIntegration(integration.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
