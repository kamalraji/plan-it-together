import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbBarProps {
  customBreadcrumbs?: BreadcrumbItem[];
}

interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive?: boolean;
}

// Service name mapping
const serviceNames: Record<string, string> = {
  dashboard: 'Dashboard',
  events: 'Event Management',
  workspaces: 'Workspaces',
  marketplace: 'Marketplace',
  organizations: 'Organizations',
  analytics: 'Analytics',
  profile: 'Profile',
  support: 'Help & Support',
  admin: 'Administration',
};

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({
  customBreadcrumbs,
}) => {
  const location = useLocation();

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Dashboard home
    breadcrumbs.push({
      label: 'Dashboard',
      path: '/dashboard',
      isActive: false,
    });

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      // Skip base routing segments already represented in the first item
      if (segment === 'console' || segment === 'dashboard') return;

      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Get display name for the segment
      let label = serviceNames[segment] || segment;
      
      // Capitalize if not in service names
      if (!serviceNames[segment]) {
        label = segment.charAt(0).toUpperCase() + segment.slice(1);
      }

      breadcrumbs.push({
        label,
        path: isLast ? undefined : `/dashboard${currentPath}`,
        isActive: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="bg-card border-b border-border px-4 sm:px-6 lg:px-8 py-3">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground mx-2" />
              )}
              
              {breadcrumb.path ? (
                <Link
                  to={breadcrumb.path}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {index === 0 ? (
                    <div className="flex items-center space-x-1">
                      <HomeIcon className="h-4 w-4" />
                      <span>{breadcrumb.label}</span>
                    </div>
                  ) : (
                    breadcrumb.label
                  )}
                </Link>
              ) : (
                <span
                  className={`text-sm font-medium ${
                    breadcrumb.isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                  aria-current={breadcrumb.isActive ? 'page' : undefined}
                >
                  {breadcrumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};

export default BreadcrumbBar;