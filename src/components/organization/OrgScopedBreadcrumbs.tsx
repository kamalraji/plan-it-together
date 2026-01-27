import React, { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Home, Settings, Users, BarChart3, Calendar, Store } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useCurrentOrganization } from './OrganizationContext';

interface BreadcrumbSegment {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

const routeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  dashboard: { label: 'Dashboard', icon: <Home className="h-3 w-3" /> },
  settings: { label: 'Settings', icon: <Settings className="h-3 w-3" /> },
  team: { label: 'Team', icon: <Users className="h-3 w-3" /> },
  analytics: { label: 'Analytics', icon: <BarChart3 className="h-3 w-3" /> },
  eventmanagement: { label: 'Events', icon: <Calendar className="h-3 w-3" /> },
  marketplace: { label: 'Marketplace', icon: <Store className="h-3 w-3" /> },
  story: { label: 'Story', icon: null },
};

export const OrgScopedBreadcrumbs: React.FC<{ className?: string }> = ({ className }) => {
  const location = useLocation();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const organization = useCurrentOrganization();

  const breadcrumbs = useMemo((): BreadcrumbSegment[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // Remove orgSlug from segments
    const relevantSegments = pathSegments.slice(1);
    
    const crumbs: BreadcrumbSegment[] = [
      {
        label: organization?.name || 'Organization',
        href: `/${orgSlug}/dashboard`,
        icon: <Home className="h-3 w-3" />,
      },
    ];

    let currentPath = `/${orgSlug}`;
    
    relevantSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === relevantSegments.length - 1;
      
      // Skip UUID-like segments in the middle but keep them for path
      if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return;
      }
      
      const config = routeConfig[segment];
      
      if (config) {
        crumbs.push({
          label: config.label,
          href: isLast ? undefined : currentPath,
          icon: config.icon,
        });
      } else {
        // Capitalize and format unknown segments
        const formattedLabel = segment
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        
        crumbs.push({
          label: formattedLabel,
          href: isLast ? undefined : currentPath,
        });
      }
    });

    return crumbs;
  }, [location.pathname, orgSlug, organization?.name]);

  if (breadcrumbs.length <= 1) return null;

  return (
    <Breadcrumb aria-label="Page navigation" className={className}>
      <BreadcrumbList className="gap-1 text-xs font-medium text-muted-foreground">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <React.Fragment key={`${crumb.label}-${index}`}>
              {index > 0 && (
                <BreadcrumbSeparator className="mx-0.5 text-muted-foreground/50">
                  <ChevronRight className="h-3 w-3" />
                </BreadcrumbSeparator>
              )}

              <BreadcrumbItem>
                {crumb.href && !isLast ? (
                  <BreadcrumbLink asChild>
                    <Link
                      to={crumb.href}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-muted/60 hover:text-foreground"
                    >
                      {crumb.icon}
                      <span>{crumb.label}</span>
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                    {crumb.icon}
                    <span>{crumb.label}</span>
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default OrgScopedBreadcrumbs;
