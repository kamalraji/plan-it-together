import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Workspace, WorkspaceStatus } from '../../types';
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
import api from '../../lib/api';

interface WorkspaceDashboardProps {
  workspaceId?: string;
}

export function WorkspaceDashboard({ workspaceId: propWorkspaceId }: WorkspaceDashboardProps) {
  const { workspaceId: paramWorkspaceId } = useParams<{ workspaceId: string }>();
  const workspaceId = propWorkspaceId || paramWorkspaceId;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'team' | 'communication' | 'analytics' | 'reports' | 'marketplace' | 'templates'>('overview');

  // Fetch workspace data
  const { data: workspace, isLoading, error } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}`);
      return response.data.workspace as Workspace;
    },
    enabled: !!workspaceId,
  });

  // Fetch user's workspaces for switching
  const { data: userWorkspaces } = useQuery({
    queryKey: ['user-workspaces'],
    queryFn: async () => {
      const response = await api.get('/workspaces/my-workspaces');
      return response.data.workspaces as Workspace[];
    },
  });

  const handleInviteTeamMember = () => {
    navigate(`/workspaces/${workspaceId}/team/invite`);
  };

  const handleCreateTask = () => {
    navigate(`/workspaces/${workspaceId}/tasks/create`);
  };

  const handleManageSettings = () => {
    navigate(`/workspaces/${workspaceId}/settings`);
  };

  const handleViewTasks = () => {
    setActiveTab('tasks');
  };

  const handleWorkspaceSwitch = (newWorkspaceId: string) => {
    navigate(`/workspaces/${newWorkspaceId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Workspace Not Found</h2>
          <p className="text-gray-600 mb-4">The workspace you're looking for doesn't exist or you don't have access to it.</p>
          <p className="text-gray-500 mb-4 text-sm">Status: {WorkspaceStatus.DISSOLVED}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Workspace Header */}
      <WorkspaceHeader
        workspace={workspace}
        onInviteTeamMember={handleInviteTeamMember}
        onCreateTask={handleCreateTask}
        onManageSettings={handleManageSettings}
      />

      {/* Workspace Navigation */}
      <WorkspaceNavigation
        workspace={workspace}
        userWorkspaces={userWorkspaces || []}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onWorkspaceSwitch={handleWorkspaceSwitch}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Task Summary */}
            <TaskSummaryCards workspace={workspace} onViewTasks={handleViewTasks} />

            {/* Team Overview and Health Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TeamMemberRoster
                workspace={workspace}
                showActions={false}
                maxMembers={6}
              />
              <WorkspaceHealthMetrics workspace={workspace} />
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Task Management</h2>
            <p className="text-gray-600">Task management interface will be implemented in a separate task.</p>
          </div>
        )}

        {activeTab === 'marketplace' && workspace.event && (
          <EventMarketplaceIntegration
            eventId={workspace.event.id}
            eventName={workspace.event.name}
          />
        )}

        {activeTab === 'team' && (
          <TeamManagement workspace={workspace} />
        )}

        {activeTab === 'communication' && (
          <WorkspaceCommunication workspaceId={workspace.id} />
        )}

        {activeTab === 'analytics' && (
          <WorkspaceAnalyticsDashboard workspace={workspace} />
        )}

        {activeTab === 'reports' && (
          <WorkspaceReportExport workspace={workspace} />
        )}

        {activeTab === 'templates' && (
          <WorkspaceTemplateManagement
            workspaceId={workspace.id}
            mode="library"
            onTemplateApplied={(template) => {
              console.log('Template applied:', template);
              // Optionally refresh workspace data
            }}
            onTemplateCreated={(template) => {
              console.log('Template created:', template);
              // Optionally show success message
            }}
          />
        )}
      </div>
    </div>
  );
}