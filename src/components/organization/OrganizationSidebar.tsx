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
  useSidebar,
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
  const { state } = useSidebar();

  const base = `/${orgSlug ?? ''}`.replace(/\/$/, '');
  const currentPath = location.pathname;

  return (
    <Sidebar collapsible="icon" className={state === 'collapsed' ? 'w-14' : 'w-60'}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {orgItems.map((item) => {
                const to = `${base}/${item.path}`;
                const isActive = currentPath === to;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        to={to}
                        end
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        activeClassName="text-primary font-semibold"
                      >
                        <item.icon className="h-4 w-4" />
                        {state === 'expanded' && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default OrganizationSidebar;
