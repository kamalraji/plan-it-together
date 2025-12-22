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

    // Always start with Console home
    breadcrumbs.push({
      label: 'Console',
      path: '/console',
      isActive: false,
    });

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      // Skip 'console' segment as it's already added
      if (segment === 'console') return;

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
        path: isLast ? undefined : `/console${currentPath}`,
        isActive: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
              )}
              
              {breadcrumb.path ? (
                <Link
                  to={breadcrumb.path}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
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
                      ? 'text-gray-900'
                      : 'text-gray-500'
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