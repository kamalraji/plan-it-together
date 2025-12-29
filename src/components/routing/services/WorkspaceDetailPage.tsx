import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '../PageHeader';
import { Workspace, WorkspaceStatus, TaskCategory, TaskPriority, TaskStatus, WorkspaceTask, WorkspaceRole, TeamMember } from '../../../types';
import { TaskManagementInterface } from '../../workspace/TaskManagementInterface';
import { TeamManagement } from '../../workspace/TeamManagement';
import { WorkspaceCommunication } from '../../workspace/WorkspaceCommunication';
import { WorkspaceAnalyticsDashboard } from '../../workspace/WorkspaceAnalyticsDashboard';
import { WorkspaceReportExport } from '../../workspace/WorkspaceReportExport';
import { EventMarketplaceIntegration } from '../../marketplace';
import { WorkspaceTemplateManagement } from '../../workspace/WorkspaceTemplateManagement';
import { supabase } from '@/integrations/supabase/client';

interface WorkspaceDetailPageProps {
  defaultTab?: string;
}

/**
 * WorkspaceDetailPage provides AWS-style resource detail interface for individual workspaces.
 * Features:
 * - Tabbed interface for different workspace aspects (overview, tasks, team, etc.)
 * - Workspace context switching and breadcrumb navigation
 * - Integration with existing workspace components
 * - Resource actions and management capabilities
 */
export const WorkspaceDetailPage: React.FC<WorkspaceDetailPageProps> = ({ defaultTab = 'overview' }) => {
  const { workspaceId, orgSlug } = useParams<{ workspaceId: string; orgSlug?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Fetch workspace data from Supabase
  const { data: workspace, isLoading, error } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select(
          `id, name, status, created_at, updated_at, event_id, events!inner(id, name, start_date, end_date, status)`
        )
        .eq('id', workspaceId as string)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Workspace not found');

      const mapped = {
        id: data.id as string,
        eventId: (data as any).event_id as string | undefined,
        name: data.name as string,
        status: data.status as WorkspaceStatus,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
        description: '',
        event: (data as any).events
          ? {
              id: (data as any).events.id as string,
              name: (data as any).events.name as string,
              startDate: (data as any).events.start_date as string,
              endDate: (data as any).events.end_date as string,
              status: (data as any).events.status as string,
            }
          : undefined,
        teamMembers: [],
        taskSummary: undefined,
        channels: [],
      } as Workspace;

      return mapped;
    },
    enabled: !!workspaceId,
  });

  // Fetch workspace tasks from Supabase
  const { data: tasks = [] } = useQuery({
    queryKey: ['workspace-tasks', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('*')
        .eq('workspace_id', workspaceId as string)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((row) => ({
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

  const queryClient = useQueryClient();

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

  // Fetch team members from Supabase
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['workspace-team-members', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('*')
        .eq('workspace_id', workspaceId as string)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        role: row.role as WorkspaceRole,
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

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      component: () => (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Workspace Information</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{workspace?.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    workspace?.status === WorkspaceStatus.ACTIVE
                      ? 'bg-green-100 text-green-800'
                      : workspace?.status === WorkspaceStatus.PROVISIONING
                      ? 'bg-yellow-100 text-yellow-800'
                      : workspace?.status === WorkspaceStatus.WINDING_DOWN
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {workspace?.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Associated Event</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {workspace?.event ? (
                    <Link
                      to={`/console/events/${workspace.event.id}`}
                      className="text-blue-600 hover:text-blue-500"
                    >
                      {workspace.event.name}
                    </Link>
                  ) : (
                    'No event associated'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {workspace?.createdAt
                    ? new Date(workspace.createdAt).toLocaleDateString()
                    : 'Unknown'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {workspace?.description || 'No description provided'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick Stats - collapsible on mobile for better spacing */}
          <div className="sm:hidden">
            <details className="bg-white rounded-lg border border-gray-200 p-4">
              <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700">
                Workspace stats
                <span className="text-xs text-gray-400">Tap to expand</span>
              </summary>
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">📋</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {workspace?.taskSummary?.total || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Team Members</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {workspace?.teamMembers?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">📈</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Progress</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(
                          ((workspace?.taskSummary?.completed || 0) /
                            Math.max(workspace?.taskSummary?.total || 1, 1)) *
                            100,
                        )}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* Desktop / tablet stats layout */}
          <div className="hidden sm:grid sm:grid-cols-3 sm:gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workspace?.taskSummary?.total || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workspace?.teamMembers?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📈</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(
                      ((workspace?.taskSummary?.completed || 0) /
                        Math.max(workspace?.taskSummary?.total || 1, 1)) *
                        100,
                    )}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      badge: workspace?.taskSummary?.total,
      component: () => (
        <TaskManagementInterface
          tasks={tasks || []}
          teamMembers={teamMembers || []}
          onTaskEdit={(task) => console.log('Edit task:', task)}
          onTaskDelete={(taskId) => deleteTaskMutation.mutate(taskId)}
          onTaskStatusChange={(taskId, status) => updateTaskStatusMutation.mutate({ taskId, status })}
          onCreateTask={() => createTaskMutation.mutate()}
        />
      ),
    },
    {
      id: 'team',
      label: 'Team',
      badge: workspace?.teamMembers?.length,
      component: () => workspace ? <TeamManagement workspace={workspace} /> : null,
    },
    {
      id: 'communication',
      label: 'Communication',
      component: () => workspaceId ? <WorkspaceCommunication workspaceId={workspaceId} /> : null,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      component: () => workspace ? <WorkspaceAnalyticsDashboard workspace={workspace} /> : null,
    },
    {
      id: 'reports',
      label: 'Reports',
      component: () => workspace ? <WorkspaceReportExport workspace={workspace} /> : null,
    },
    {
      id: 'marketplace',
      label: 'Marketplace',
      component: () => workspace?.event ? (
        <EventMarketplaceIntegration 
          eventId={workspace.event.id} 
          eventName={workspace.event.name}
        />
      ) : (
        <div className="text-center py-12">
          <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Event Associated</h3>
          <p className="mt-1 text-sm text-gray-500">
            This workspace needs to be associated with an event to access marketplace features.
          </p>
        </div>
      ),
    },
    {
      id: 'templates',
      label: 'Templates',
      component: () => workspaceId ? (
        <WorkspaceTemplateManagement
          workspaceId={workspaceId}
          mode="library"
          onTemplateApplied={(template) => console.log('Template applied:', template)}
          onTemplateCreated={(template) => console.log('Template created:', template)}
        />
      ) : null,
    },
  ];

  const resourceActions = [
    {
      label: 'Edit Workspace',
      action: () => navigate(`/console/workspaces/${workspaceId}/edit`),
      variant: 'secondary' as const,
    },
    {
      label: 'Invite Members',
      action: () => setActiveTab('team'),
      variant: 'secondary' as const,
    },
    {
      label: 'Settings',
      action: () => navigate(`/console/workspaces/${workspaceId}/settings`),
      variant: 'secondary' as const,
    },
  ];

  const baseWorkspacePath = orgSlug ? `/${orgSlug}/workspaces` : '/console/workspaces';
  const eventManagementBase = orgSlug ? `/${orgSlug}/eventmanagement` : '/dashboard/eventmanagement';

  const breadcrumbs = [
    ...(workspace?.event
      ? [
          { label: 'Events', href: eventManagementBase },
          { label: workspace.event.name, href: `${eventManagementBase}/${workspace.event.id}` },
        ]
      : []),
    { label: 'Workspaces', href: baseWorkspacePath },
    { label: workspace?.name || 'Loading...', href: `${baseWorkspacePath}/${workspaceId}` },
  ];

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Workspace Not Found</h2>
            <p className="text-gray-600 mb-4">
              The workspace you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link
              to="/console/workspaces"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Workspaces
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Mobile back navigation */}
        <button
          type="button"
          onClick={() => navigate(baseWorkspacePath)}
          className="mt-3 mb-3 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 sm:hidden"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to workspaces
        </button>

        {/* Page Header */}
        <PageHeader
          title={workspace.name}
          subtitle={workspace.description || 'Workspace details and management'}
          breadcrumbs={breadcrumbs}
          actions={resourceActions}
          tabs={tabs.map(tab => ({
            id: tab.id,
            label: tab.label,
            badge: tab.badge,
            current: activeTab === tab.id,
            onClick: () => setActiveTab(tab.id),
          }))}
        />

        {/* Linked event + status header */}
        {workspace.event && (
          <section className="mt-4 sm:mt-6 rounded-lg border border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Linked event</p>
              <Link
                to={`${eventManagementBase}/${workspace.event.id}`}
                className="mt-0.5 block text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {workspace.event.name}
              </Link>
              <p className="mt-0.5 text-xs text-gray-500">
                {workspace.event.startDate && workspace.event.endDate
                  ? `${new Date(workspace.event.startDate).toLocaleDateString()} – ${new Date(workspace.event.endDate).toLocaleDateString()}`
                  : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                Workspace status: {workspace.status}
              </span>
              {workspace.event.status && (
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  Event status: {workspace.event.status}
                </span>
              )}
              <Link
                to={`${eventManagementBase}/${workspace.event.id}`}
                className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Open event console
              </Link>
            </div>
          </section>
        )}

        {/* Tab Content */}
        <div className="mt-4 sm:mt-6">
          {tabs.find(tab => tab.id === activeTab)?.component()}
        </div>
      </div>

      {/* Mobile task create FAB for a single entry point */}
      {activeTab === 'tasks' && (
        <button
          type="button"
          onClick={() => createTaskMutation.mutate()}
          className="fixed bottom-20 right-4 sm:hidden inline-flex items-center px-4 py-3 rounded-full shadow-lg bg-indigo-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <span className="mr-2 text-xl leading-none">＋</span>
          <span className="text-sm font-medium">New Task</span>
        </button>
      )}
    </div>
  );
};

export default WorkspaceDetailPage;