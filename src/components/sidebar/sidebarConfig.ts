import {
  Home,
  LayoutDashboard,
  CalendarDays,
  Briefcase,
  Store,
  LineChart,
  Users,
  ExternalLink,
  Shield,
  Building2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Shared menu item types
// ─────────────────────────────────────────────────────────────
export interface SidebarMenuItem {
  title: string;
  icon: LucideIcon;
  path: string;
  description?: string;
}

// ─────────────────────────────────────────────────────────────
// Organization service items (used in both sidebars)
// ─────────────────────────────────────────────────────────────
export const orgServices: SidebarMenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: 'dashboard', description: 'Overview & metrics' },
  { title: 'Event Management', icon: CalendarDays, path: 'eventmanagement', description: 'Manage events' },
  { title: 'Workspace', icon: Briefcase, path: 'workspaces', description: 'Team collaboration' },
  { title: 'Marketplace', icon: Store, path: 'organizations', description: 'Products & services' },
  { title: 'Analytics', icon: LineChart, path: 'analytics', description: 'Performance insights' },
  { title: 'Team', icon: Users, path: 'team', description: 'Members & roles' },
];

// ─────────────────────────────────────────────────────────────
// Admin items (only shown for specific orgs like thittam1hub)
// ─────────────────────────────────────────────────────────────
export const adminMenuItems: SidebarMenuItem[] = [
  { title: 'User Roles', icon: Shield, path: '/dashboard/admin/users', description: 'Manage platform access' },
  { title: 'Pending Organizers', icon: Building2, path: '/dashboard/admin/organizers', description: 'Review requests' },
];

// ─────────────────────────────────────────────────────────────
// Shared icons for easy access
// ─────────────────────────────────────────────────────────────
export const sidebarIcons = {
  Home,
  LayoutDashboard,
  CalendarDays,
  Briefcase,
  Store,
  LineChart,
  Users,
  ExternalLink,
  Shield,
  Building2,
};

// ─────────────────────────────────────────────────────────────
// Shared style constants for unified theming
// ─────────────────────────────────────────────────────────────
export const sidebarStyles = {
  // Base sidebar wrapper
  sidebar: 'border-r border-border/40 bg-sidebar',

  // Header
  header: 'border-b border-sidebar-border px-4 py-3',
  headerMobile: 'flex items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar px-4 py-3',

  // Section labels
  sectionLabel: 'px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70',

  // Menu item base
  menuItemBase: 'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
  menuItemHover: 'hover:bg-primary/10 hover:text-primary',
  menuItemActive: 'bg-primary/15 text-primary shadow-sm font-medium',

  // Icon container
  iconContainer: 'flex items-center justify-center rounded-lg transition-colors duration-200',
  iconContainerDefault: 'bg-muted/60 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary',
  iconContainerActive: 'bg-primary text-primary-foreground shadow-md',
  iconSize: 'h-9 w-9',
  iconSizeSmall: 'h-8 w-8',

  // Active indicator
  activeIndicator: 'ml-auto h-6 w-1 rounded-full bg-primary animate-scale-in',
  activeIndicatorDot: 'h-1.5 w-1.5 rounded-full bg-primary animate-scale-in',

  // Sub-menu
  subMenu: 'ml-4 mt-1 space-y-0.5 border-l border-border/40 pl-3',
  subMenuItem: 'group/subitem flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150',
  subMenuItemHover: 'hover:bg-muted/60 hover:text-foreground',
  subMenuItemActive: 'bg-primary/10 text-primary font-medium',

  // Text styles
  textLabel: 'text-sm font-semibold text-foreground truncate',
  textMeta: 'text-[10px] font-normal text-muted-foreground',
  textDescription: 'text-[10px] font-normal text-muted-foreground',
} as const;
