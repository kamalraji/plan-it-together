import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Workspace, WorkspaceType } from '../../types';
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
  ChevronRight,
  Settings2,
  ClipboardCheck,
  Layers
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
  | 'role-management'
  | 'event-settings'
  | 'approvals'
  | 'workspace-management';
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
      | 'approvals'
      | 'event-settings'
      | 'workspace-management'
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
  activeTab,
  onTabChange,
}: WorkspaceNavigationProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Show event-settings tab for ALL workspaces with an event
  const showEventSettingsTab = useMemo(() => {
    return !!workspace.eventId;
  }, [workspace.eventId]);

  // Handle tab change while preserving hierarchical URL params
  const handleTabChange = (tabId: TabId) => {
    // Update URL param
    const newParams = new URLSearchParams(searchParams);
    if (tabId === 'overview') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tabId);
    }
    // Remove task-specific params when switching tabs
    newParams.delete('taskId');
    setSearchParams(newParams, { replace: true });
    
    // Call parent handler
    onTabChange(tabId);
  };

  const baseTabs: Tab[] = [
    { id: 'overview', name: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />, group: 'core' },
    { id: 'tasks', name: 'Tasks', icon: <ClipboardList className="w-4 h-4" />, group: 'core' },
    { id: 'team', name: 'Team', icon: <Users className="w-4 h-4" />, group: 'core' },
    { id: 'communication', name: 'Communication', icon: <MessageSquare className="w-4 h-4" />, group: 'core' },
    { id: 'approvals', name: 'Approvals', icon: <ClipboardCheck className="w-4 h-4" />, group: 'core' },
    { id: 'event-settings', name: 'Event Settings', icon: <Settings2 className="w-4 h-4" />, group: 'core' },
    { id: 'workspace-management', name: 'Workspace Control', icon: <Layers className="w-4 h-4" />, group: 'management' },
    { id: 'marketplace', name: 'Marketplace', icon: <ShoppingBag className="w-4 h-4" />, group: 'management' },
    { id: 'templates', name: 'Templates', icon: <FileText className="w-4 h-4" />, group: 'management' },
    { id: 'role-management', name: 'Actions & Roles', icon: <UserCog className="w-4 h-4" />, group: 'core' },
    { id: 'analytics', name: 'Analytics', icon: <BarChart3 className="w-4 h-4" />, group: 'analysis' },
    { id: 'reports', name: 'Reports', icon: <Download className="w-4 h-4" />, group: 'analysis' },
    { id: 'audit', name: 'Audit Log', icon: <Clock className="w-4 h-4" />, group: 'analysis' },
  ];

  // Filter tabs based on workspace type
  const tabs = useMemo(() => {
    return baseTabs.filter(tab => {
      if (tab.id === 'event-settings') {
        return showEventSettingsTab;
      }
      // Hide approvals for TEAM workspaces
      if (tab.id === 'approvals') {
        return workspace.workspaceType !== WorkspaceType.TEAM;
      }
      // Only show workspace-management for ROOT workspaces
      if (tab.id === 'workspace-management') {
        return workspace.workspaceType === WorkspaceType.ROOT;
      }
      return true;
    });
  }, [showEventSettingsTab, workspace.workspaceType]);

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

        {/* Tab Navigation - Desktop: horizontal, Mobile: grouped */}
        <div className="border-b border-border">
          {/* Desktop horizontal tabs */}
          <nav className="hidden md:flex -mb-px overflow-x-auto space-x-1 px-1 py-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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
                            onClick={() => handleTabChange(tab.id)}
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
