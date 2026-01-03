import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { Workspace, WorkspaceStatus } from '../../../types';
import { MobileTaskSummary } from './MobileTaskSummary';
import { MobileTeamOverview } from './MobileTeamOverview';
import { MobileWorkspaceHeader } from './MobileWorkspaceHeader';
import { MobileNavigation } from './MobileNavigation';
import { MobileFeaturesPanel } from './MobileFeaturesPanel';
import { supabase } from '@/integrations/supabase/client';

interface MobileWorkspaceDashboardProps {
  workspaceId?: string;
}

export function MobileWorkspaceDashboard({ workspaceId: propWorkspaceId }: MobileWorkspaceDashboardProps) {
  const { workspaceId: paramWorkspaceId } = useParams<{ workspaceId: string }>();
  const workspaceId = propWorkspaceId || paramWorkspaceId;
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'team' | 'communication' | 'analytics'>('overview');

  // Fetch workspace data from Supabase
  const { data: workspace, isLoading, error } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, status, created_at, updated_at, event_id, parent_workspace_id')
        .eq('id', workspaceId as string)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Workspace not found');

      return {
        id: data.id,
        eventId: data.event_id,
        name: data.name,
        status: data.status as WorkspaceStatus,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        description: undefined,
        event: undefined,
        teamMembers: [],
        taskSummary: undefined,
        channels: [],
        parentWorkspaceId: data.parent_workspace_id,
      } as unknown as Workspace;
    },
    enabled: !!workspaceId,
  });

  // Fetch user's workspaces for switching
  const { data: userWorkspaces } = useQuery({
    queryKey: ['user-workspaces-mobile', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [] as Workspace[];

      const { data: current } = await supabase
        .from('workspaces')
        .select('event_id')
        .eq('id', workspaceId as string)
        .maybeSingle();

      const eventId = current?.event_id;

      let query = supabase
        .from('workspaces')
        .select('id, name, status, created_at, updated_at, event_id, parent_workspace_id')
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        name: row.name,
        status: row.status as WorkspaceStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        description: undefined,
        event: undefined,
        teamMembers: [],
        taskSummary: undefined,
        channels: [],
        parentWorkspaceId: row.parent_workspace_id,
      })) as unknown as Workspace[];
    },
    enabled: !!workspaceId,
  });

  const handleQuickAction = (action: string) => {
    setIsMenuOpen(false);
    switch (action) {
      case 'create-task':
        navigate(`/workspaces/${workspaceId}/tasks/create`);
        break;
      case 'invite-member':
        navigate(`/workspaces/${workspaceId}/team/invite`);
        break;
      case 'view-tasks':
        setActiveTab('tasks');
        break;
      case 'view-team':
        setActiveTab('team');
        break;
      case 'view-communication':
        setActiveTab('communication');
        break;
      case 'view-analytics':
        setActiveTab('analytics');
        break;
      case 'settings':
        navigate(`/workspaces/${workspaceId}/settings`);
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-4">Workspace Not Found</h2>
          <p className="text-muted-foreground mb-4 text-sm">The workspace you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col overflow-y-auto">
      {/* Mobile Header */}
      <MobileWorkspaceHeader
        workspace={workspace}
        isMenuOpen={isMenuOpen}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
      />

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <MobileNavigation
          workspace={workspace}
          userWorkspaces={userWorkspaces || []}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsMenuOpen(false);
          }}
          onWorkspaceSwitch={(newWorkspaceId) => {
            navigate(`/workspaces/${newWorkspaceId}`);
            setIsMenuOpen(false);
          }}
          onQuickAction={handleQuickAction}
          onClose={() => setIsMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="w-full pt-16 pb-24 px-4 space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <section aria-label="Workspace overview" className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">Workspace overview</h2>
              <div className="grid grid-cols-1 gap-3">
                {/* Tasks Card */}
                <button
                  type="button"
                  onClick={() => handleQuickAction('view-tasks')}
                  className="w-full text-left rounded-2xl bg-card shadow-sm border border-border p-4 flex items-center justify-between active:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <ClipboardList className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Tasks</p>
                      <p className="text-xs text-muted-foreground">View and update all workspace tasks</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {workspace.taskSummary?.total ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">total</p>
                  </div>
                </button>

                {/* Team Card */}
                <button
                  type="button"
                  onClick={() => handleQuickAction('view-team')}
                  className="w-full text-left rounded-2xl bg-card shadow-sm border border-border p-4 flex items-center justify-between active:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Team</p>
                      <p className="text-xs text-muted-foreground">See who is in your workspace</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {workspace.teamMembers?.length ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">members</p>
                  </div>
                </button>

                {/* Communication Card */}
                <button
                  type="button"
                  onClick={() => handleQuickAction('view-communication')}
                  className="w-full text-left rounded-2xl bg-card shadow-sm border border-border p-4 flex items-center justify-between active:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Communication</p>
                      <p className="text-xs text-muted-foreground">Jump into workspace conversations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-primary">Open</p>
                  </div>
                </button>
              </div>
            </section>

            {/* Existing rich panels below the overview cards */}
            <MobileFeaturesPanel
              workspaceId={workspace.id}
              onLocationUpdate={(location) => {
                console.log('Location updated:', location);
              }}
              onPhotoCapture={(file) => {
                console.log('Photo captured:', file.name);
              }}
              onVoiceRecording={(audioBlob) => {
                console.log('Voice recording captured:', audioBlob.size, 'bytes');
              }}
            />

            <MobileTaskSummary
              workspace={workspace}
              onViewTasks={() => handleQuickAction('view-tasks')}
            />

            <MobileTeamOverview
              workspace={workspace}
              onViewTeam={() => handleQuickAction('view-team')}
            />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Tasks</h2>
            <p className="text-muted-foreground text-sm">Mobile task management interface will be implemented in the next component.</p>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Team</h2>
            <p className="text-muted-foreground text-sm">Mobile team management interface will be implemented in the next component.</p>
          </div>
        )}

        {activeTab === 'communication' && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Communication</h2>
            <p className="text-muted-foreground text-sm">Mobile communication interface will be implemented in the next component.</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Analytics</h2>
            <p className="text-muted-foreground text-sm">Mobile analytics interface will be implemented in the next component.</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 pb-safe">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${activeTab === 'overview'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs mt-1">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${activeTab === 'tasks'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs mt-1">Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${activeTab === 'team'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs mt-1">Team</span>
          </button>
          <button
            onClick={() => setActiveTab('communication')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${activeTab === 'communication'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs mt-1">Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${activeTab === 'analytics'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs mt-1">Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
}
