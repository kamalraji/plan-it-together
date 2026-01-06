import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight, LayoutDashboard, Calendar, Store, BarChart3, Layers, Users } from 'lucide-react';

interface OrganizerBreadcrumbsProps {
  current: 'dashboard' | 'event-management' | 'marketplace' | 'analytics' | 'workspace' | 'team';
}

const breadcrumbConfig: Record<OrganizerBreadcrumbsProps['current'], { label: string; icon: React.ElementType }> = {
  'dashboard': { label: 'Dashboard', icon: LayoutDashboard },
  'event-management': { label: 'Events', icon: Calendar },
  'marketplace': { label: 'Marketplace', icon: Store },
  'analytics': { label: 'Analytics', icon: BarChart3 },
  'workspace': { label: 'Workspace', icon: Layers },
  'team': { label: 'Team', icon: Users },
};

/**
 * Shared breadcrumbs for organizer-scoped console views.
 */
export const OrganizerBreadcrumbs: React.FC<OrganizerBreadcrumbsProps> = ({ current }) => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const isGlobalDashboardContext = segments[0] === 'dashboard';

  const dashboardPath = isGlobalDashboardContext
    ? '/dashboard'
    : segments[0]
      ? `/${segments[0]}/dashboard`
      : '/dashboard';

  const CurrentIcon = breadcrumbConfig[current].icon;

  return (
    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <ol className="flex items-center gap-2 text-sm">
        {/* Home */}
        <li>
          <Link 
            to={dashboardPath}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </li>

        <li>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        </li>

        {/* Current Page */}
        <li>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium">
            <CurrentIcon className="h-4 w-4" />
            <span>{breadcrumbConfig[current].label}</span>
          </div>
        </li>
      </ol>
    </nav>
  );
};
