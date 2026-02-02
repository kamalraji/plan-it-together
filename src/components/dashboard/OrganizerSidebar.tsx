import React from 'react';
import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useMyMemberOrganizations } from '@/hooks/useOrganization';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Home,
  LayoutDashboard,
  CalendarDays,
  Briefcase,
  Store,
  LineChart,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrgMenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
  description?: string;
}

const orgSubItems: OrgMenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: 'dashboard', description: 'Overview & metrics' },
  { title: 'Event Management', icon: CalendarDays, path: 'eventmanagement', description: 'Manage events' },
  { title: 'Workspace', icon: Briefcase, path: 'workspaces', description: 'Team collaboration' },
  { title: 'Marketplace', icon: Store, path: 'organizations', description: 'Products & services' },
  { title: 'Analytics', icon: LineChart, path: 'analytics', description: 'Performance insights' },
];

export const OrganizerSidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const { data: memberOrganizations, isLoading } = useMyMemberOrganizations();

  const isOrganizerDashboardActive = currentPath === '/organizer/dashboard';

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-border/40 bg-sidebar/95 backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/80"
    >
      <SidebarHeader className="border-b border-border/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            {!isCollapsed && (
              <span className="text-sm font-semibold text-foreground animate-fade-in">
                Organizer Console
              </span>
            )}
          </div>
          <SidebarTrigger className="h-7 w-7" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 space-y-2 overflow-y-auto">
        {/* Organizer Dashboard CTA */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isOrganizerDashboardActive}
                  tooltip="Organizer Dashboard"
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    'hover:bg-primary/10 hover:text-primary',
                    isOrganizerDashboardActive && 'bg-primary/15 text-primary shadow-sm'
                  )}
                >
                  <NavLink
                    to="/organizer/dashboard"
                    className="flex w-full items-center gap-3"
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200',
                        isOrganizerDashboardActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted/60 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                      )}
                    >
                      <Home className="h-4 w-4" />
                    </span>
                    {!isCollapsed && (
                      <span className="flex flex-col items-start animate-fade-in">
                        <span>Organizer Home</span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          All organizations overview
                        </span>
                      </span>
                    )}
                    {isOrganizerDashboardActive && !isCollapsed && (
                      <span className="ml-auto h-6 w-1 rounded-full bg-primary animate-scale-in" />
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Organizations List */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Your Organizations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : !memberOrganizations || memberOrganizations.length === 0 ? (
              <div className="px-3 py-4 text-xs text-muted-foreground">
                No organizations yet
              </div>
            ) : (
              <SidebarMenu className="space-y-1">
                {memberOrganizations.map((org: any) => {
                  const orgBasePath = `/${org.slug}`;
                  const isOrgActive = currentPath.startsWith(orgBasePath);
                  const isDefaultOpen = isOrgActive;

                  return (
                    <Collapsible
                      key={org.id}
                      defaultOpen={isDefaultOpen}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={org.name}
                            className={cn(
                              'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                              'hover:bg-muted/70',
                              isOrgActive && 'bg-muted/50 font-medium'
                            )}
                          >
                            <span
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold uppercase transition-colors duration-200',
                                isOrgActive
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                              )}
                            >
                              {org.name?.slice(0, 2) || 'OR'}
                            </span>
                            {!isCollapsed && (
                              <>
                                <span className="flex flex-1 flex-col items-start overflow-hidden animate-fade-in">
                                  <span className="truncate max-w-[140px]">{org.name}</span>
                                  {org.role && (
                                    <span className="text-[10px] font-normal text-muted-foreground">
                                      {org.role}
                                    </span>
                                  )}
                                </span>
                                <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
                          <SidebarMenuSub className="ml-4 mt-1 space-y-0.5 border-l border-border/40 pl-3">
                            {orgSubItems.map((item) => {
                              const itemPath = `${orgBasePath}/${item.path}`;
                              const isItemActive =
                                currentPath === itemPath ||
                                currentPath.startsWith(`${itemPath}/`);

                              return (
                                <SidebarMenuSubItem key={item.path}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isItemActive}
                                    className={cn(
                                      'group/subitem flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150',
                                      'hover:bg-muted/60 hover:text-foreground',
                                      isItemActive && 'bg-primary/10 text-primary font-medium'
                                    )}
                                  >
                                    <NavLink
                                      to={itemPath}
                                      className="flex w-full items-center gap-2.5"
                                    >
                                      <item.icon
                                        className={cn(
                                          'h-3.5 w-3.5 transition-colors',
                                          isItemActive
                                            ? 'text-primary'
                                            : 'text-muted-foreground group-hover/subitem:text-foreground'
                                        )}
                                      />
                                      <span className="flex-1">{item.title}</span>
                                      {isItemActive && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-scale-in" />
                                      )}
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default OrganizerSidebar;
