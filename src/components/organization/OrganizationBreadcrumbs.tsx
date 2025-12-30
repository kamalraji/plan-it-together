import React from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface OrganizationBreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
  icon?: React.ReactNode;
}

interface OrganizationBreadcrumbsProps {
  items: OrganizationBreadcrumbItem[];
  className?: string;
}

export const OrganizationBreadcrumbs: React.FC<OrganizationBreadcrumbsProps> = ({
  items,
  className,
}) => {
  if (!items.length) return null;

  return (
    <Breadcrumb
      aria-label="Organization breadcrumbs"
      className={className}
    >
      <BreadcrumbList className="gap-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              {index > 0 && (
                <BreadcrumbSeparator className="mx-0.5 text-muted-foreground/60 sm:mx-1" />
              )}

              <BreadcrumbItem>
                {item.href && !isLast ? (
                  <BreadcrumbLink asChild>
                    <Link
                      to={item.href}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-primary sm:text-xs"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-1 text-[11px] font-semibold text-foreground sm:text-xs">
                    {item.icon}
                    <span>{item.label}</span>
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

export default OrganizationBreadcrumbs;
