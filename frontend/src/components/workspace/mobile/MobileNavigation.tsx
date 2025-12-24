import { 
  XMarkIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { Workspace } from '../../../types';

interface MobileNavigationProps {
  workspace: Workspace;
  userWorkspaces: Workspace[];
  activeTab: string;
  onTabChange: (tab: 'overview' | 'tasks' | 'team' | 'communication' | 'analytics') => void;
  onWorkspaceSwitch: (workspaceId: string) => void;
  onQuickAction: (action: string) => void;
  onClose: () => void;
}

export function MobileNavigation({
  workspace,
  userWorkspaces,
  activeTab,
  onTabChange,
  onWorkspaceSwitch,
  onQuickAction,
  onClose
}: MobileNavigationProps) {
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: HomeIcon },
    { id: 'tasks', label: 'Tasks', icon: ClipboardDocumentListIcon },
    { id: 'team', label: 'Team', icon: UserGroupIcon },
    { id: 'communication', label: 'Communication', icon: ChatBubbleLeftRightIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
  ];

  const quickActions = [
    { id: 'create-task', label: 'Create Task', icon: PlusIcon, color: 'text-indigo-600' },
    { id: 'invite-member', label: 'Invite Member', icon: UserPlusIcon, color: 'text-green-600' },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon, color: 'text-gray-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Current Workspace */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-sm">
                {workspace.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{workspace.name}</h3>
              <p className="text-sm text-gray-500 truncate">
                {workspace.event?.name || 'No event linked'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="py-2">
          <div className="px-4 py-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Workspace
            </h4>
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as any)}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  isActive ? 'bg-indigo-50 border-r-2 border-indigo-600' : ''
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
                <span className={`font-medium ${isActive ? 'text-indigo-600' : 'text-gray-900'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="py-2 border-t border-gray-200">
          <div className="px-4 py-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Quick Actions
            </h4>
          </div>
          {quickActions.map((action) => {
            const Icon = action.icon;
            
            return (
              <button
                key={action.id}
                onClick={() => onQuickAction(action.id)}
                className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <Icon className={`w-5 h-5 mr-3 ${action.color}`} />
                <span className="font-medium text-gray-900">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Other Workspaces */}
        {userWorkspaces.length > 1 && (
          <div className="py-2 border-t border-gray-200">
            <div className="px-4 py-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Other Workspaces
              </h4>
            </div>
            {userWorkspaces
              .filter(ws => ws.id !== workspace.id)
              .slice(0, 3)
              .map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => onWorkspaceSwitch(ws.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-xs">
                        {ws.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">{ws.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {ws.event?.name || 'No event'}
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            
            {userWorkspaces.filter(ws => ws.id !== workspace.id).length > 3 && (
              <button
                onClick={() => onQuickAction('view-all-workspaces')}
                className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-gray-50 transition-colors"
              >
                View all workspaces ({userWorkspaces.length - 1} total)
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <button
            onClick={() => onQuickAction('logout')}
            className="w-full flex items-center px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}