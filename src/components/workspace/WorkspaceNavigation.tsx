import { useState } from 'react';
import { Workspace, WorkspaceStatus } from '../../types';
import { Breadcrumb } from '../common/Breadcrumb';

interface WorkspaceNavigationProps {
  workspace: Workspace;
  userWorkspaces: Workspace[];
  activeTab: 'overview' | 'tasks' | 'team' | 'communication' | 'analytics' | 'reports' | 'marketplace' | 'templates';
  onTabChange: (tab: 'overview' | 'tasks' | 'team' | 'communication' | 'analytics' | 'reports' | 'marketplace' | 'templates') => void;
  onWorkspaceSwitch: (workspaceId: string) => void;
}

export function WorkspaceNavigation({
  workspace,
  userWorkspaces,
  activeTab,
  onTabChange,
  onWorkspaceSwitch
}: WorkspaceNavigationProps) {
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);

  const tabs = [
    {
      id: 'overview' as const,
      name: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      )
    },
    {
      id: 'tasks' as const,
      name: 'Tasks',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      id: 'marketplace' as const,
      name: 'Marketplace',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 'team' as const,
      name: 'Team',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.196M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'communication' as const,
      name: 'Communication',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      id: 'analytics' as const,
      name: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'templates' as const,
      name: 'Templates',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'reports' as const,
      name: 'Reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  const getStatusColor = (status: WorkspaceStatus) => {
    switch (status) {
      case WorkspaceStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case WorkspaceStatus.PROVISIONING:
        return 'bg-yellow-100 text-yellow-800';
      case WorkspaceStatus.WINDING_DOWN:
        return 'bg-orange-100 text-orange-800';
      case WorkspaceStatus.DISSOLVED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Breadcrumb Navigation */}
          <div className="py-4">
            <Breadcrumb
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: workspace.event?.name || 'Event', href: workspace.event ? `/events/${workspace.event.id}` : undefined },
                { label: 'Workspace', current: true }
              ]}
            />
          </div>

          {/* Workspace Switcher */}
          {userWorkspaces.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowWorkspaceSwitcher(!showWorkspaceSwitcher)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span>Switch Workspace</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showWorkspaceSwitcher && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Your Workspaces
                    </div>
                    {userWorkspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => {
                          onWorkspaceSwitch(ws.id);
                          setShowWorkspaceSwitcher(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${
                          ws.id === workspace.id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {ws.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {ws.event?.name}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ws.status)}`}>
                            {ws.status.replace('_', ' ')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}