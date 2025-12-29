import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { LayoutDashboard, CalendarDays, LineChart, Users } from 'lucide-react';

const orgItems = [
  { title: 'Overview', icon: LayoutDashboard, path: 'dashboard' },
  { title: 'Events', icon: CalendarDays, path: 'eventmanagement' },
  { title: 'Analytics', icon: LineChart, path: 'analytics' },
  { title: 'Team', icon: Users, path: 'team' },
];

export const OrganizationSidebar: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const location = useLocation();

  const base = `/${orgSlug ?? ''}`.replace(/\/$/, '');
  const currentPath = location.pathname;
  const isThittamHubOrg = orgSlug === 'thittam1hub';

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {orgItems.map((item) => {
                const to = `${base}/${item.path}`;
                const isActive = currentPath === to || currentPath.startsWith(`${to}/`);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="data-[active=true]:bg-muted data-[active=true]:text-primary data-[active=true]:font-semibold hover:bg-muted/70 transition-colors"
                    >
                      <NavLink
                        to={to}
                        end
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        activeClassName="text-primary font-semibold"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isThittamHubOrg && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={currentPath.startsWith('/dashboard/admin/users')}>
                    <NavLink
                      to="/dashboard/admin/users"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      activeClassName="text-primary font-semibold"
                    >
                      <span className="h-4 w-4 inline-flex items-center justify-center rounded bg-primary/10 text-xs font-medium">
                        UR
                      </span>
                      <span>User Roles</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={currentPath.startsWith('/dashboard/admin/organizers')}>
                    <NavLink
                      to="/dashboard/admin/organizers"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      activeClassName="text-primary font-semibold"
                    >
                      <span className="h-4 w-4 inline-flex items-center justify-center rounded bg-primary/10 text-xs font-medium">
                        PO
                      </span>
                      <span>Pending Organizers</span>
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
