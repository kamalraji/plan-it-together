import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { OrganizationBreadcrumbs } from '@/components/organization/OrganizationBreadcrumbs';
import { cn } from '@/lib/utils';

interface WorkspaceListHeaderProps {
  organizationName?: string;
  orgSlug?: string;
  totalCount: number;
  canManageWorkspaces: boolean;
}

export const WorkspaceListHeader: React.FC<WorkspaceListHeaderProps> = ({
  organizationName,
  orgSlug,
  totalCount,
  canManageWorkspaces,
}) => {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <OrganizationBreadcrumbs
        items={[
          {
            label: organizationName ?? 'Organization',
            href: orgSlug ? `/${orgSlug}` : undefined,
          },
          {
            label: 'Workspaces',
            isCurrent: true,
          },
        ]}
        className="text-xs"
      />

      {/* Compact Hero Section */}
      <div className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-card/80 backdrop-blur-sm",
        "border border-border/50",
        "p-4"
      )}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              "bg-primary/10 border border-primary/20"
            )}>
              <Squares2X2Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Workspaces
              </h1>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{totalCount}</span> across all events
              </p>
            </div>
          </div>

          {canManageWorkspaces && (
            <Link to={`/${orgSlug}/workspaces/create`}>
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <PlusIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New Workspace</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
};
