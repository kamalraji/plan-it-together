import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Workspace,
  WorkspaceStatus,
  WorkspaceTask,
  TeamMember,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  UserRole,
  WorkspaceRole,
  WorkspaceRoleScope,
} from '../../types';
import { WorkspaceHeader } from './WorkspaceHeader';
import { TaskSummaryCards } from './TaskSummaryCards';
import { TeamMemberRoster } from './TeamMemberRoster';
import { WorkspaceNavigation } from './WorkspaceNavigation';
import { WorkspaceHealthMetrics } from './WorkspaceHealthMetrics';
import { TeamManagement } from './TeamManagement';
import { WorkspaceCommunication } from './WorkspaceCommunication';
import { WorkspaceAnalyticsDashboard } from './WorkspaceAnalyticsDashboard';
import { WorkspaceReportExport } from './WorkspaceReportExport';
import { WorkspaceTemplateManagement } from './WorkspaceTemplateManagement';
import { EventMarketplaceIntegration } from '../marketplace';
import { WorkspaceCollaborationTimeline } from './WorkspaceCollaborationTimeline';
import { TaskManagementInterface } from './TaskManagementInterface';
import { WorkspaceAuditLog } from './WorkspaceAuditLog';
import { WorkspaceRoleAssignment } from './WorkspaceRoleAssignment';
import { WorkspaceRoleAnalytics } from './WorkspaceRoleAnalytics';
import { WorkspacePermissionsBanner } from './WorkspacePermissionsBanner';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface WorkspaceDashboardProps {
  workspaceId?: string;
}

export function WorkspaceDashboard({ workspaceId: propWorkspaceId }: WorkspaceDashboardProps) {
  const { workspaceId: paramWorkspaceId } = useParams<{ workspaceId: string }>();
  const workspaceId = (propWorkspaceId || paramWorkspaceId) as string | undefined;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskIdFromUrl = searchParams.get('taskId') || undefined;
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'tasks'
    | 'team'
    | 'communication'
    | 'analytics'
    | 'reports'
    | 'marketplace'
    | 'templates'
    | 'audit'
    | 'role-management'
  >(taskIdFromUrl ? 'tasks' : 'overview');
  const { user } = useAuth();

  // Workspace from Supabase
  const { data: workspace, isLoading, error } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, status, created_at, updated_at, event_id')
        .eq('id', workspaceId as string)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Workspace not found');

      const mapped = {
        id: data.id as string,
        eventId: data.event_id as string | undefined,
        name: data.name as string,
        status: data.status as WorkspaceStatus,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
        description: undefined,
        event: undefined,
        teamMembers: [],
        taskSummary: undefined,
        channels: [],
      };

      return mapped as unknown as Workspace;
    },
    enabled: !!workspaceId,
  });

  // User workspaces for switching (scoped to the same event when possible)
  const { data: userWorkspaces } = useQuery({
    queryKey: ['user-workspaces', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [] as Workspace[];

      const { data: current, error: currentError } = await supabase
        .from('workspaces')
        .select('event_id')
        .eq('id', workspaceId as string)
        .maybeSingle();

      if (currentError) throw currentError;

      const eventId = current?.event_id as string | undefined;

      let query = supabase
        .from('workspaces')
        .select('id, name, status, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped = (data || []).map((row: any) => ({
        id: row.id as string,
        eventId: eventId,
        name: row.name as string,
        status: row.status as WorkspaceStatus,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        description: undefined,
        event: undefined,
        teamMembers: [],
        taskSummary: undefined,
        channels: [],
      }));

      return mapped as unknown as Workspace[];
    },
  });

  const queryClient = useQueryClient();

  const { data: tasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['workspace-tasks', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('*')
        .eq('workspace_id', workspaceId as string)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        title: row.title,
        description: row.description || '',
        category: TaskCategory.LOGISTICS,
        priority: row.priority as TaskPriority,
        status: row.status as TaskStatus,
        progress: 0,
        dueDate: row.due_date || undefined,
        dependencies: [],
        tags: [],
        metadata: {},
      })) as unknown as WorkspaceTask[];
    },
    enabled: !!workspaceId,
  });

  // Mutations for task CRUD
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      const { data, error } = await supabase
        .from('workspace_tasks')
        .insert({
          workspace_id: workspaceId,
          title: 'New task',
          description: '',
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.NOT_STARTED,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .update({ status })
        .eq('id', taskId)
        .eq('workspace_id', workspaceId as string);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .delete()
        .eq('id', taskId)
        .eq('workspace_id', workspaceId as string);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
    },
  });

  const { data: teamMembers } = useQuery({
    queryKey: ['workspace-team-members', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('*')
        .eq('workspace_id', workspaceId as string)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        role: row.role,
        status: row.status,
        joinedAt: row.joined_at,
        leftAt: row.left_at || undefined,
        user: {
          id: row.user_id,
          name: 'Member',
          email: '',
        },
      })) as TeamMember[];
    },
    enabled: !!workspaceId,
  });

  const [activeRoleSpace, setActiveRoleSpace] = useState<WorkspaceRoleScope>('ALL');
  const roleSpaces: WorkspaceRoleScope[] = ['ALL', ...(teamMembers?.map((m) => m.role) || [])];

  const isGlobalWorkspaceManager =
    !!user && (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN);

  const currentMember = teamMembers?.find((member) => member.userId === user?.id);
  const managerWorkspaceRoles: WorkspaceRole[] = [
    WorkspaceRole.WORKSPACE_OWNER,
    WorkspaceRole.TEAM_LEAD,
    WorkspaceRole.EVENT_COORDINATOR,
  ];
  const isWorkspaceRoleManager = currentMember
    ? managerWorkspaceRoles.includes(currentMember.role as WorkspaceRole)
    : false;

  const canManageTasks = isGlobalWorkspaceManager || isWorkspaceRoleManager;

  const handleInviteTeamMember = () => {
    if (!workspaceId) return;
    navigate(`/workspaces/${workspaceId}/team/invite`);
  };

  const handleCreateTask = () => {
    if (!workspaceId || !canManageTasks) return;
    createTaskMutation.mutate();
  };

  const handleManageSettings = () => {
    if (!workspaceId || !isGlobalWorkspaceManager) return;
    navigate(`/workspaces/${workspaceId}/settings`);
  };

  const handleViewTasks = () => {
    setActiveTab('tasks');
  };

  const handleWorkspaceSwitch = (newWorkspaceId: string) => {
    navigate(`/workspaces/${newWorkspaceId}`);
  };

  const handleTaskStatusChange = (taskId: string, status: TaskStatus) => {
    if (!canManageTasks) return;
    updateTaskStatusMutation.mutate({ taskId, status });
  };

  const handleTaskDelete = (taskId: string) => {
    if (!canManageTasks) return;
    deleteTaskMutation.mutate(taskId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Workspace Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The workspace you're looking for doesn't exist or you don't have access to it.
          </p>
          <p className="text-xs text-muted-foreground mb-4">Status: {WorkspaceStatus.DISSOLVED}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <WorkspaceHeader
        workspace={workspace}
        onInviteTeamMember={isGlobalWorkspaceManager ? handleInviteTeamMember : undefined}
        onCreateTask={canManageTasks ? handleCreateTask : undefined}
        onManageSettings={isGlobalWorkspaceManager ? handleManageSettings : undefined}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-4">
        {/* Role-based sub workspace selector */}
        <div className="flex flex-wrap gap-2">
          {roleSpaces.map((roleSpace) => (
            <button
              key={roleSpace}
              onClick={() => setActiveRoleSpace(roleSpace)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeRoleSpace === roleSpace
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {roleSpace === 'ALL' ? 'All teams' : roleSpace.replace(/_/g, ' ').toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <WorkspaceNavigation
        workspace={workspace}
        userWorkspaces={userWorkspaces || []}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onWorkspaceSwitch={handleWorkspaceSwitch}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <WorkspacePermissionsBanner
          userRole={user?.role}
          workspaceRole={currentMember?.role as WorkspaceRole}
          hasGlobalAccess={isGlobalWorkspaceManager}
          hasWorkspaceManagerAccess={isWorkspaceRoleManager}
        />

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <TaskSummaryCards workspace={workspace} onViewTasks={handleViewTasks} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
              <div className="xl:col-span-2 space-y-8">
                <WorkspaceCollaborationTimeline workspace={workspace} />
              </div>
              <div className="space-y-8">
                <TeamMemberRoster workspace={workspace} showActions={false} maxMembers={6} />
                <WorkspaceHealthMetrics workspace={workspace} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <TaskManagementInterface
              tasks={tasks || []}
              teamMembers={teamMembers || []}
              roleScope={activeRoleSpace}
              onTaskEdit={(task) => {
                if (!canManageTasks) return;
                console.log('Edit task:', task);
              }}
              onTaskDelete={handleTaskDelete}
              onTaskStatusChange={handleTaskStatusChange}
              onCreateTask={handleCreateTask}
              isLoading={isTasksLoading}
              initialTaskId={taskIdFromUrl}
            />
          </div>
        )}

        {activeTab === 'marketplace' && workspace.event && (
          <EventMarketplaceIntegration eventId={workspace.event.id} eventName={workspace.event.name} />
        )}

        {activeTab === 'team' && <TeamManagement workspace={workspace} roleScope={activeRoleSpace} />}

        {activeTab === 'communication' && (
          <WorkspaceCommunication
            workspaceId={workspace.id}
            teamMembers={teamMembers}
            roleScope={activeRoleSpace}
          />
        )}

        {activeTab === 'analytics' && <WorkspaceAnalyticsDashboard workspace={workspace} />}

        {activeTab === 'reports' && <WorkspaceReportExport workspace={workspace} teamMembers={teamMembers} />}

        {activeTab === 'templates' && (
          <WorkspaceTemplateManagement
            workspaceId={workspace.id}
            mode="library"
            onTemplateApplied={(template) => console.log('Template applied:', template)}
            onTemplateCreated={(template) => console.log('Template created:', template)}
          />
        )}

        {activeTab === 'audit' && <WorkspaceAuditLog workspace={workspace} teamMembers={teamMembers} />}

        {activeTab === 'role-management' && (
          <div className="space-y-6">
            <WorkspaceRoleAssignment
              workspaceId={workspace.id}
              teamMembers={teamMembers || []}
              currentUserRole={currentMember?.role as WorkspaceRole}
              isGlobalManager={isGlobalWorkspaceManager}
            />
            <WorkspaceRoleAnalytics workspace={workspace} />
          </div>
        )}
      </div>
    </div>
  );
}
