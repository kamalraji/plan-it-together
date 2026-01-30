import { useState, useEffect } from 'react';
import { Save, Trash2, Bell, Shield, Palette, Settings2, Archive, Zap, Clock, RefreshCw, FileStack } from 'lucide-react';
import { MemberRoleManagement } from './settings/MemberRoleManagement';
import { Workspace, WorkspaceRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkspaceSettings } from '@/hooks/useWorkspaceSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AutomationRulesPanel } from './AutomationRulesPanel';
import { TimeLogsView } from './TimeLogsView';
import { WeeklyTimeReport } from './WeeklyTimeReport';
import { RecurringTasksPanel } from './RecurringTasksPanel';
import { IndustryTemplateBrowser } from './templates/IndustryTemplateBrowser';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SettingsTab = 'general' | 'notifications' | 'permissions' | 'automations' | 'time-tracking' | 'recurring' | 'templates' | 'danger';

interface WorkspaceSettingsContentProps {
  workspace: Workspace;
  teamMembers: any[];
  canManageSettings: boolean;
  currentUserRole?: WorkspaceRole;
}

export function WorkspaceSettingsContent({
  workspace,
  teamMembers,
  canManageSettings,
  currentUserRole,
}: WorkspaceSettingsContentProps) {
  const { settings, updateSetting } = useWorkspaceSettings(workspace.id);
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: workspace.name || '',
    description: workspace.description || '',
  });

  useEffect(() => {
    setFormData({
      name: workspace.name,
      description: workspace.description || '',
    });
  }, [workspace]);

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          name: formData.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workspace.id);

      if (error) throw error;
      toast.success('Workspace settings saved');
    } catch (_error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveWorkspace = async () => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          status: 'ARCHIVED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', workspace.id);

      if (error) throw error;
      toast.success('Workspace archived');
    } catch (_error) {
      toast.error('Failed to archive workspace');
    }
  };

  const handleRestoreWorkspace = async () => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        })
        .eq('id', workspace.id);

      if (error) throw error;
      toast.success('Workspace restored');
    } catch (_error) {
      toast.error('Failed to restore workspace');
    }
  };

  const handleDeleteWorkspace = async () => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspace.id);

      if (error) throw error;
      toast.success('Workspace deleted');
    } catch (_error) {
      toast.error('Failed to delete workspace');
    }
  };

  const isArchived = workspace.status === 'ARCHIVED';

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Palette },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'permissions' as const, label: 'Permissions', icon: Shield },
    { id: 'automations' as const, label: 'Automations', icon: Zap },
    { id: 'time-tracking' as const, label: 'Time Tracking', icon: Clock },
    { id: 'recurring' as const, label: 'Recurring Tasks', icon: RefreshCw },
    { id: 'templates' as const, label: 'Task Templates', icon: FileStack },
    { id: 'danger' as const, label: 'Danger Zone', icon: Trash2 },
  ];

  if (!canManageSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to manage workspace settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Workspace Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">{workspace.name}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar Tabs */}
        <nav className="lg:w-48 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">General Settings</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name">Workspace Name</Label>
                    <Input
                      id="workspace-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter workspace name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workspace-description">Description</Label>
                    <Textarea
                      id="workspace-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter workspace description"
                      rows={3}
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button onClick={handleSaveGeneral} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Task Defaults */}
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Task Defaults</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground">Default Task Priority</p>
                      <p className="text-sm text-muted-foreground">Set the default priority for new tasks</p>
                    </div>
                    <Select 
                      value={settings?.default_task_priority ?? 'medium'}
                      onValueChange={(value) => updateSetting('default_task_priority', value as 'low' | 'medium' | 'high' | 'urgent')}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Auto-Archive Settings */}
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Archive className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Auto-Archive</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground">Auto-archive after event</p>
                      <p className="text-sm text-muted-foreground">Automatically archive workspace when linked event ends</p>
                    </div>
                    <Switch 
                      checked={settings?.auto_archive_after_event ?? false}
                      onCheckedChange={(checked) => updateSetting('auto_archive_after_event', checked)}
                    />
                  </div>
                  
                  {settings?.auto_archive_after_event && (
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-foreground">Days after event completion</p>
                        <p className="text-sm text-muted-foreground">Number of days to wait before archiving</p>
                      </div>
                      <Select 
                        value={String(settings?.auto_archive_days_after ?? 7)}
                        onValueChange={(value) => updateSetting('auto_archive_days_after', parseInt(value))}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Workspace Info</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-medium text-foreground mt-0.5">{workspace.status}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Team Members</dt>
                    <dd className="font-medium text-foreground mt-0.5">{teamMembers?.length || 0} members</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Created</dt>
                    <dd className="font-medium text-foreground mt-0.5">
                      {new Date(workspace.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  {workspace.event && (
                    <div>
                      <dt className="text-muted-foreground">Linked Event</dt>
                      <dd className="font-medium text-foreground mt-0.5">{workspace.event.name}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">Task Updates</p>
                    <p className="text-sm text-muted-foreground">Receive notifications when tasks are updated</p>
                  </div>
                  <Switch 
                    checked={settings?.notify_task_updates ?? true}
                    onCheckedChange={(checked) => updateSetting('notify_task_updates', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">New Team Members</p>
                    <p className="text-sm text-muted-foreground">Get notified when new members join</p>
                  </div>
                  <Switch 
                    checked={settings?.notify_new_members ?? true}
                    onCheckedChange={(checked) => updateSetting('notify_new_members', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">Messages</p>
                    <p className="text-sm text-muted-foreground">Receive notifications for new messages</p>
                  </div>
                  <Switch 
                    checked={settings?.notify_messages ?? true}
                    onCheckedChange={(checked) => updateSetting('notify_messages', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-foreground">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">Get a weekly summary of workspace activity</p>
                  </div>
                  <Switch 
                    checked={settings?.notify_weekly_digest ?? false}
                    onCheckedChange={(checked) => updateSetting('notify_weekly_digest', checked)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Permission Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground">Allow Member Invites</p>
                      <p className="text-sm text-muted-foreground">Let team members invite others</p>
                    </div>
                    <Switch 
                      checked={settings?.allow_member_invites ?? false}
                      onCheckedChange={(checked) => updateSetting('allow_member_invites', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground">Allow Task Creation</p>
                      <p className="text-sm text-muted-foreground">Let all members create new tasks</p>
                    </div>
                    <Switch 
                      checked={settings?.allow_task_creation ?? true}
                      onCheckedChange={(checked) => updateSetting('allow_task_creation', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-foreground">Public Visibility</p>
                      <p className="text-sm text-muted-foreground">Make workspace visible to organization members</p>
                    </div>
                    <Switch 
                      checked={settings?.public_visibility ?? true}
                      onCheckedChange={(checked) => updateSetting('public_visibility', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Member Management */}
              <MemberRoleManagement
                workspaceId={workspace.id}
                teamMembers={teamMembers}
                currentUserRole={currentUserRole ?? null}
              />
            </div>
          )}

          {activeTab === 'automations' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <AutomationRulesPanel workspaceId={workspace.id} />
              </div>
            </div>
          )}

          {activeTab === 'time-tracking' && user && (
            <div className="space-y-6">
              <Tabs defaultValue="logs" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="logs">Time Logs</TabsTrigger>
                  <TabsTrigger value="reports">Weekly Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="logs">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <TimeLogsView 
                      workspaceId={workspace.id} 
                      userId={user.id} 
                      isManager={Boolean(currentUserRole && (currentUserRole.includes('LEAD') || currentUserRole.includes('MANAGER') || currentUserRole.includes('OWNER')))}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="reports">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <WeeklyTimeReport workspaceId={workspace.id} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeTab === 'recurring' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <RecurringTasksPanel workspaceId={workspace.id} />
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Task Templates Library</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Browse and import pre-built task templates for various event types. Templates include
                  tasks, subtasks, estimated hours, and dependencies.
                </p>
                <IndustryTemplateBrowser 
                  workspaceId={workspace.id} 
                  eventDate={workspace.event?.startDate ? new Date(workspace.event.startDate) : undefined}
                />
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
                <h3 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  These actions are irreversible. Please proceed with caution.
                </p>
                
                <div className="space-y-4">
                  {!isArchived ? (
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium text-foreground">Archive Workspace</p>
                        <p className="text-sm text-muted-foreground">Hide this workspace from active views</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Archive Workspace</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will hide the workspace from active views. You can restore it later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleArchiveWorkspace}>Archive</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium text-foreground">Restore Workspace</p>
                        <p className="text-sm text-muted-foreground">Bring this workspace back to active views</p>
                      </div>
                      <Button variant="outline" onClick={handleRestoreWorkspace}>
                        Restore
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-destructive">Delete Workspace</p>
                      <p className="text-sm text-muted-foreground">Permanently delete this workspace and all its data</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. All workspace data, tasks, and team members will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteWorkspace} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
