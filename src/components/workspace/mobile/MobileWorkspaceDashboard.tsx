import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon,
  PlusIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Workspace } from '../../../types';
import { MobileTaskSummary } from './MobileTaskSummary';
import { MobileTeamOverview } from './MobileTeamOverview';
import { MobileWorkspaceHeader } from './MobileWorkspaceHeader';
import { MobileNavigation } from './MobileNavigation';
import { MobileFeaturesPanel } from './MobileFeaturesPanel';
import api from '../../../lib/api';

interface MobileWorkspaceDashboardProps {
  workspaceId?: string;
}

export function MobileWorkspaceDashboard({ workspaceId: propWorkspaceId }: MobileWorkspaceDashboardProps) {
  const { workspaceId: paramWorkspaceId } = useParams<{ workspaceId: string }>();
  const workspaceId = propWorkspaceId || paramWorkspaceId;
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'team' | 'communication' | 'analytics'>('overview');

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Workspace Not Found</h2>
          <p className="text-gray-600 mb-4 text-sm">The workspace you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col overflow-y-auto">
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
              <h2 className="text-base font-semibold text-gray-900">Workspace overview</h2>
              <div className="grid grid-cols-1 gap-4">
                {/* Tasks Card */}
                <button
                  type="button"
                  onClick={() => handleQuickAction('view-tasks')}
                  className="w-full text-left rounded-2xl bg-white shadow-sm border border-gray-200 p-4 flex items-center justify-between active:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
                      <PlusIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Tasks</p>
                      <p className="text-xs text-gray-500">View and update all workspace tasks</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {workspace.taskSummary?.total ?? 0}
                    </p>
                    <p className="text-xs text-gray-400">total</p>
                  </div>
                </button>

                {/* Team Card */}
                <button
                  type="button"
                  onClick={() => handleQuickAction('view-team')}
                  className="w-full text-left rounded-2xl bg-white shadow-sm border border-gray-200 p-4 flex items-center justify-between active:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                      <UserPlusIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Team</p>
                      <p className="text-xs text-gray-500">See who is in your workspace</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {workspace.teamMembers?.length ?? 0}
                    </p>
                    <p className="text-xs text-gray-400">members</p>
                  </div>
                </button>

                {/* Communication Card */}
                <button
                  type="button"
                  onClick={() => handleQuickAction('view-communication')}
                  className="w-full text-left rounded-2xl bg-white shadow-sm border border-gray-200 p-4 flex items-center justify-between active:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Communication</p>
                      <p className="text-xs text-gray-500">Jump into workspace conversations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-indigo-600">Open communication</p>
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
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
            <p className="text-gray-600 text-sm">Mobile task management interface will be implemented in the next component.</p>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Team</h2>
            <p className="text-gray-600 text-sm">Mobile team management interface will be implemented in the next component.</p>
          </div>
        )}

        {activeTab === 'communication' && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Communication</h2>
            <p className="text-gray-600 text-sm">Mobile communication interface will be implemented in the next component.</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h2>
            <p className="text-gray-600 text-sm">Mobile analytics interface will be implemented in the next component.</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg ${
              activeTab === 'overview' 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bars3Icon className="w-5 h-5" />
            <span className="text-xs mt-1">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg ${
              activeTab === 'tasks' 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PlusIcon className="w-5 h-5" />
            <span className="text-xs mt-1">Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg ${
              activeTab === 'team' 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserPlusIcon className="w-5 h-5" />
            <span className="text-xs mt-1">Team</span>
          </button>
          <button
            onClick={() => setActiveTab('communication')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg ${
              activeTab === 'communication' 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            <span className="text-xs mt-1">Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg ${
              activeTab === 'analytics' 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ChartBarIcon className="w-5 h-5" />
            <span className="text-xs mt-1">Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
}