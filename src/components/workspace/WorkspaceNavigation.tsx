import { useState } from 'react';
import { Workspace, WorkspaceStatus } from '../../types';
import { 
  LayoutDashboard, 
  ClipboardList, 
  ShoppingBag, 
  Users, 
  MessageSquare, 
  BarChart3, 
  FileText, 
  Download, 
  Clock, 
  UserCog,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface WorkspaceNavigationProps {
  workspace: Workspace;
  userWorkspaces: Workspace[];
  activeTab:
  | 'overview'
  | 'tasks'
  | 'team'
  | 'communication'
  | 'analytics'
  | 'reports'
  | 'marketplace'
  | 'templates'
  | 'audit'
  | 'role-management';
  onTabChange: (
    tab:
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
  ) => void;
  onWorkspaceSwitch: (workspaceId: string) => void;
}

type TabId = WorkspaceNavigationProps['activeTab'];

interface Tab {
  id: TabId;
  name: string;
  icon: React.ReactNode;
  group: 'core' | 'management' | 'analysis';
}

const tabGroups = {
  core: { label: 'Core', order: 1 },
  management: { label: 'Management', order: 2 },
  analysis: { label: 'Analysis', order: 3 },
};

export function WorkspaceNavigation({
  workspace,
  userWorkspaces,
  activeTab,
  onTabChange,
  onWorkspaceSwitch,
}: WorkspaceNavigationProps) {
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const tabs: Tab[] = [
    { id: 'overview', name: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />, group: 'core' },
    { id: 'tasks', name: 'Tasks', icon: <ClipboardList className="w-4 h-4" />, group: 'core' },
    { id: 'team', name: 'Team', icon: <Users className="w-4 h-4" />, group: 'core' },
    { id: 'communication', name: 'Communication', icon: <MessageSquare className="w-4 h-4" />, group: 'core' },
    { id: 'marketplace', name: 'Marketplace', icon: <ShoppingBag className="w-4 h-4" />, group: 'management' },
    { id: 'templates', name: 'Templates', icon: <FileText className="w-4 h-4" />, group: 'management' },
    { id: 'role-management', name: 'Roles', icon: <UserCog className="w-4 h-4" />, group: 'management' },
    { id: 'analytics', name: 'Analytics', icon: <BarChart3 className="w-4 h-4" />, group: 'analysis' },
    { id: 'reports', name: 'Reports', icon: <Download className="w-4 h-4" />, group: 'analysis' },
    { id: 'audit', name: 'Audit Log', icon: <Clock className="w-4 h-4" />, group: 'analysis' },
  ];

  const getStatusColor = (status: WorkspaceStatus) => {
    switch (status) {
      case WorkspaceStatus.ACTIVE:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case WorkspaceStatus.PROVISIONING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case WorkspaceStatus.WINDING_DOWN:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case WorkspaceStatus.DISSOLVED:
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Group tabs by category
  const groupedTabs = tabs.reduce((acc, tab) => {
    if (!acc[tab.group]) acc[tab.group] = [];
    acc[tab.group].push(tab);
    return acc;
  }, {} as Record<string, Tab[]>);

  // Check if active tab is in a group
  const activeTabGroup = tabs.find(t => t.id === activeTab)?.group;

  return (
    <div className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end py-2 sm:py-3">
          {/* Workspace Switcher */}
          {userWorkspaces.length > 1 && (
            <div className="relative self-start sm:self-auto">
              <button
                onClick={() => setShowWorkspaceSwitcher(!showWorkspaceSwitcher)}
                className="flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                <span className="hidden sm:inline">Switch Workspace</span>
                <span className="inline sm:hidden">Switch</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showWorkspaceSwitcher && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-card rounded-md shadow-lg ring-1 ring-border z-50">
                  <div className="py-1 max-h-80 overflow-y-auto">
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Your Workspaces
                    </div>
                    {userWorkspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => {
                          onWorkspaceSwitch(ws.id);
                          setShowWorkspaceSwitcher(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-muted ${ws.id === workspace.id ? 'bg-primary/10 border-r-2 border-primary' : ''
                          }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{ws.name}</p>
                            {!!ws.event?.name && (
                              <p className="text-xs text-muted-foreground truncate">{ws.event?.name}</p>
                            )}
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              ws.status,
                            )}`}
                          >
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

        {/* Tab Navigation - Desktop: horizontal, Mobile: grouped */}
        <div className="border-b border-border">
          {/* Desktop horizontal tabs */}
          <nav className="hidden md:flex -mb-px overflow-x-auto space-x-1 px-1 py-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex shrink-0 items-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                {tab.icon}
                <span className="whitespace-nowrap">{tab.name}</span>
              </button>
            ))}
          </nav>

          {/* Mobile grouped tabs */}
          <div className="md:hidden py-2 space-y-1">
            {Object.entries(tabGroups)
              .sort((a, b) => a[1].order - b[1].order)
              .map(([groupKey, groupInfo]) => {
                const groupTabs = groupedTabs[groupKey] || [];
                const isCollapsed = collapsedGroups[groupKey] && activeTabGroup !== groupKey;
                const hasActiveTab = groupTabs.some(t => t.id === activeTab);

                return (
                  <div key={groupKey} className="border-b border-border/50 last:border-b-0 pb-1">
                    <button
                      onClick={() => toggleGroup(groupKey)}
                      className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide"
                    >
                      <span className="flex items-center gap-1">
                        {groupInfo.label}
                        {hasActiveTab && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </span>
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {!isCollapsed && (
                      <div className="flex flex-wrap gap-1 px-1 py-1">
                        {groupTabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg font-medium text-xs transition-colors ${activeTab === tab.id
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground bg-muted/50 hover:text-foreground hover:bg-muted'
                              }`}
                          >
                            {tab.icon}
                            <span className="whitespace-nowrap">{tab.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
