import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Bell, Shield, Palette, Users, Archive, Settings2 } from 'lucide-react';
import { MemberRoleManagement } from './settings/MemberRoleManagement';
import { WorkspaceRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { useWorkspacePermissions } from '@/hooks/useWorkspacePermissions';
import { useWorkspaceSettings } from '@/hooks/useWorkspaceSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsPageSkeleton } from '@/components/ui/page-skeletons';
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

type SettingsTab = 'general' | 'notifications' | 'permissions' | 'danger';

export function WorkspaceSettingsPage() {
  const params = useParams<{ 
    workspaceId?: string; 
    eventId?: string;
    rootSlug?: string;
    deptSlug?: string;
    committeeSlug?: string;
    teamSlug?: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get workspaceId from query params (hierarchical URLs) or route params (legacy)
  const workspaceId = searchParams.get('workspaceId') || params.workspaceId;
  const eventId = searchParams.get('eventId') || params.eventId;
  
  const { workspace, isLoading, teamMembers } = useWorkspaceData(workspaceId);
  const permissions = useWorkspacePermissions({ teamMembers, eventId: workspace?.eventId || eventId });
  const { settings, updateSetting } = useWorkspaceSettings(workspaceId);
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: workspace?.name || '',
    description: workspace?.description || '',
  });

  // Sync form data when workspace loads
  useEffect(() => {
    if (workspace) {
      setFormData({
        name: workspace.name,
        description: workspace.description || '',
      });
    }
  }, [workspace]);

  const handleSaveGeneral = async () => {
    if (!workspaceId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          name: formData.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workspaceId);

      if (error) throw error;
      toast.success('Workspace settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveWorkspace = async () => {
    if (!workspaceId) return;

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          status: 'ARCHIVED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', workspaceId);

      if (error) throw error;
      toast.success('Workspace archived');
      navigate(-1);
    } catch (error) {
      console.error('Failed to archive workspace:', error);
      toast.error('Failed to archive workspace');
    }
  };

  const handleRestoreWorkspace = async () => {
    if (!workspaceId) return;

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        })
        .eq('id', workspaceId);

      if (error) throw error;
      toast.success('Workspace restored');
    } catch (error) {
      console.error('Failed to restore workspace:', error);
      toast.error('Failed to restore workspace');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceId) return;

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) throw error;
      toast.success('Workspace deleted');
      navigate(-1);
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      toast.error('Failed to delete workspace');
    }
  };

  const isArchived = workspace?.status === 'ARCHIVED';

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Palette },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'permissions' as const, label: 'Permissions', icon: Shield },
    { id: 'danger' as const, label: 'Danger Zone', icon: Trash2 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto">
          <SettingsPageSkeleton />
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Workspace Not Found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!permissions.canManageSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have permission to manage workspace settings.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Workspace Settings</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{workspace.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar Tabs */}
          <nav className="lg:w-56 shrink-0">
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
                  <h2 className="text-lg font-semibold text-foreground mb-4">General Settings</h2>
                  
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
                    <h2 className="text-lg font-semibold text-foreground">Task Defaults</h2>
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
                    <h2 className="text-lg font-semibold text-foreground">Auto-Archive</h2>
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
                  <h2 className="text-lg font-semibold text-foreground mb-4">Workspace Info</h2>
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
                <h2 className="text-lg font-semibold text-foreground mb-4">Notification Preferences</h2>
                
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
                {/* Member Role Management */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold text-foreground">Team Member Roles</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage team member roles based on the 4-level hierarchy. Higher roles can change roles of members below them.
                  </p>
                  
                  <MemberRoleManagement
                    teamMembers={teamMembers || []}
                    currentUserRole={
                      teamMembers?.find(m => m.userId === permissions.user?.id)?.role as WorkspaceRole || null
                    }
                    currentUserId={permissions.user?.id}
                    workspaceId={workspaceId!}
                  />
                </div>

                {/* Permission Toggles */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Permission Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium text-foreground">Allow Member Invites</p>
                        <p className="text-sm text-muted-foreground">Let team leads invite new members</p>
                      </div>
                      <Switch 
                        checked={settings?.allow_member_invites ?? true}
                        onCheckedChange={(checked) => updateSetting('allow_member_invites', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium text-foreground">Task Creation</p>
                        <p className="text-sm text-muted-foreground">Allow all members to create tasks</p>
                      </div>
                      <Switch 
                        checked={settings?.allow_task_creation ?? true}
                        onCheckedChange={(checked) => updateSetting('allow_task_creation', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-foreground">Public Visibility</p>
                        <p className="text-sm text-muted-foreground">Make workspace visible to organization</p>
                      </div>
                      <Switch 
                        checked={settings?.public_visibility ?? false}
                        onCheckedChange={(checked) => updateSetting('public_visibility', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-6">
                {/* Status Indicator */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Workspace Status</h2>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        isArchived ? "bg-slate-400" : "bg-emerald-500"
                      )} />
                      <div>
                        <p className="font-medium text-foreground">
                          {isArchived ? 'Archived' : 'Active'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isArchived 
                            ? 'This workspace is archived and hidden from active lists'
                            : 'This workspace is active and visible to team members'
                          }
                        </p>
                      </div>
                    </div>
                    {isArchived && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleRestoreWorkspace}
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950"
                      >
                        <Archive className="h-4 w-4 mr-1.5" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>

                {/* Danger Actions */}
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
                  <h2 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    These actions are irreversible. Please proceed with caution.
                  </p>
                  
                  <div className="space-y-4">
                    {!isArchived && (
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                        <div>
                          <p className="font-medium text-foreground">Archive Workspace</p>
                          <p className="text-sm text-muted-foreground">
                            Archive this workspace and hide it from the list
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleArchiveWorkspace}
                        >
                          <Archive className="h-4 w-4 mr-1.5" />
                          Archive
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-card">
                      <div>
                        <p className="font-medium text-destructive">Delete Workspace</p>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete this workspace and all its data
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{workspace.name}"? This action cannot be undone. 
                              All tasks, team members, settings, and associated data will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteWorkspace}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Workspace
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
    </div>
  );
}
