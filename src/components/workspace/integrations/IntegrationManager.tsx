import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, MoreVertical, Trash2, Send, Link2, Hash, MessageSquare } from 'lucide-react';
import { useWorkspaceIntegrations, WorkspaceIntegration, Platform } from '@/hooks/useWorkspaceIntegrations';
import { AddIntegrationModal } from './AddIntegrationModal';

interface IntegrationManagerProps {
  workspaceId: string;
}

const platformIcons: Record<Platform, React.ReactNode> = {
  slack: <Hash className="h-4 w-4" />,
  discord: <MessageSquare className="h-4 w-4" />,
  teams: <MessageSquare className="h-4 w-4" />,
  webhook: <Link2 className="h-4 w-4" />,
};

const platformColors: Record<Platform, string> = {
  slack: 'bg-purple-500/10 text-purple-500',
  discord: 'bg-indigo-500/10 text-indigo-500',
  teams: 'bg-blue-500/10 text-blue-500',
  webhook: 'bg-muted-foreground/30/10 text-muted-foreground',
};

const platformNames: Record<Platform, string> = {
  slack: 'Slack',
  discord: 'Discord',
  teams: 'Teams',
  webhook: 'Webhook',
};

export function IntegrationManager({ workspaceId }: IntegrationManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<WorkspaceIntegration | null>(null);

  const {
    integrations,
    isLoading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
  } = useWorkspaceIntegrations(workspaceId);

  const handleToggleActive = (integration: WorkspaceIntegration) => {
    updateIntegration.mutate({
      id: integration.id,
      is_active: !integration.is_active,
    });
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteIntegration.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              External Integrations
            </CardTitle>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Integration
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center py-8">
              <Link2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">No integrations configured</p>
              <Button variant="outline" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Integration
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${platformColors[integration.platform]}`}>
                      {platformIcons[integration.platform]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{integration.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {platformNames[integration.platform]}
                        </Badge>
                        {!integration.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {integration.notification_types.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={integration.is_active}
                      onCheckedChange={() => handleToggleActive(integration)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => testIntegration.mutate(integration)}
                          disabled={testIntegration.isPending}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Test
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteConfirm(integration)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddIntegrationModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        workspaceId={workspaceId}
        onSubmit={(input) => {
          createIntegration.mutate(input, {
            onSuccess: () => setShowAddModal(false),
          });
        }}
        isLoading={createIntegration.isPending}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
