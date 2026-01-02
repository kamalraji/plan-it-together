import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useCurrentOrganization } from './OrganizationContext';
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  LayoutDashboard,
  CalendarDays,
  Briefcase,
  Store,
  LineChart,
  Users,
  ExternalLink,
  Building2,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrgMenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
  description: string;
}

const orgServices: OrgMenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: 'dashboard', description: 'Overview & metrics' },
  { title: 'Event Management', icon: CalendarDays, path: 'eventmanagement', description: 'Manage events' },
  { title: 'Workspace', icon: Briefcase, path: 'workspaces', description: 'Team collaboration' },
  { title: 'Marketplace', icon: Store, path: 'organizations', description: 'Products & services' },
  { title: 'Analytics', icon: LineChart, path: 'analytics', description: 'Performance insights' },
  { title: 'Team', icon: Users, path: 'team', description: 'Members & roles' },
];

export const OrganizationSidebar: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const organization = useCurrentOrganization();

  const base = `/${orgSlug ?? ''}`.replace(/\/$/, '');
  const currentPath = location.pathname;
  const isThittamHubOrg = orgSlug === 'thittam1hub';

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-border/40 bg-sidebar/95 backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/80"
    >
      <SidebarHeader className="border-b border-border/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {organization?.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="h-6 w-6 rounded object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-primary uppercase">
                  {organization?.name?.slice(0, 2) || orgSlug?.slice(0, 2) || 'OR'}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 animate-fade-in">
                <span className="text-sm font-semibold text-foreground truncate max-w-[140px]">
                  {organization?.name || orgSlug}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  Organization Console
                </span>
              </div>
            )}
          </div>
          <SidebarTrigger className="h-7 w-7 shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 space-y-2 overflow-y-auto">
        {/* Back to Organizer Home */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Back to Organizer Home"
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                    'hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <NavLink
                    to="/organizer/dashboard"
                    className="flex w-full items-center gap-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                      <Home className="h-4 w-4" />
                    </span>
                    {!isCollapsed && (
                      <span className="flex flex-col items-start animate-fade-in">
                        <span className="text-sm">Organizer Home</span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          All organizations
                        </span>
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Organization Services */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Services
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {orgServices.map((item) => {
                const to = `${base}/${item.path}`;
                const isActive = currentPath === to || currentPath.startsWith(`${to}/`);

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        'hover:bg-primary/10 hover:text-primary',
                        isActive && 'bg-primary/15 text-primary shadow-sm'
                      )}
                    >
                      <NavLink
                        to={to}
                        end={item.path === 'dashboard'}
                        className="flex w-full items-center gap-3"
                      >
                        <span
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200',
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'bg-muted/60 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </span>
                        {!isCollapsed && (
                          <span className="flex flex-col items-start animate-fade-in">
                            <span>{item.title}</span>
                            <span className="text-[10px] font-normal text-muted-foreground">
                              {item.description}
                            </span>
                          </span>
                        )}
                        {isActive && !isCollapsed && (
                          <span className="ml-auto h-6 w-1 rounded-full bg-primary animate-scale-in" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Public Page Link */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Public
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="View Public Page"
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted/70 hover:text-foreground"
                >
                  <a
                    href={`/${orgSlug ?? ''}`.replace(/\/$/, '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/20">
                      <ExternalLink className="h-4 w-4" />
                    </span>
                    {!isCollapsed && (
                      <span className="flex flex-col items-start animate-fade-in">
                        <span>View Public Page</span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          Opens in new tab
                        </span>
                      </span>
                    )}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only for thittam1hub */}
        {isThittamHubOrg && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath.startsWith('/dashboard/admin/users')}
                    tooltip="User Roles"
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                      'hover:bg-muted/70 hover:text-foreground',
                      currentPath.startsWith('/dashboard/admin/users') && 'bg-primary/15 text-primary font-medium'
                    )}
                  >
                    <NavLink
                      to="/dashboard/admin/users"
                      className="flex w-full items-center gap-3"
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200',
                          currentPath.startsWith('/dashboard/admin/users')
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                        )}
                      >
                        <Shield className="h-4 w-4" />
                      </span>
                      {!isCollapsed && (
                        <span className="flex flex-col items-start animate-fade-in">
                          <span>User Roles</span>
                          <span className="text-[10px] font-normal text-muted-foreground">
                            Manage platform access
                          </span>
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath.startsWith('/dashboard/admin/organizers')}
                    tooltip="Pending Organizers"
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                      'hover:bg-muted/70 hover:text-foreground',
                      currentPath.startsWith('/dashboard/admin/organizers') && 'bg-primary/15 text-primary font-medium'
                    )}
                  >
                    <NavLink
                      to="/dashboard/admin/organizers"
                      className="flex w-full items-center gap-3"
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200',
                          currentPath.startsWith('/dashboard/admin/organizers')
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                        )}
                      >
                        <Building2 className="h-4 w-4" />
                      </span>
                      {!isCollapsed && (
                        <span className="flex flex-col items-start animate-fade-in">
                          <span>Pending Organizers</span>
                          <span className="text-[10px] font-normal text-muted-foreground">
                            Review requests
                          </span>
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default OrganizationSidebar;
