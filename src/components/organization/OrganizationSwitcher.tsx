import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMyMemberOrganizations } from '@/hooks/useOrganization';
import { useCurrentOrganization } from './OrganizationContext';
import { ChevronDownIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import {
  SimpleDropdown,
  SimpleDropdownContent,
  SimpleDropdownItem,
  SimpleDropdownTrigger,
} from '@/components/ui/simple-dropdown';
import { cn } from '@/lib/utils';

interface OrganizationSwitcherProps {
  /** Compact mode for sidebar usage */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

export const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
  compact = false,
  className,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentOrg = useCurrentOrganization();
  const { data: myOrgs, isLoading } = useMyMemberOrganizations();

  // Get current service path to preserve when switching orgs
  const getCurrentServicePath = () => {
    const pathParts = location.pathname.split('/');
    // If we're in an org-scoped route like /orgSlug/dashboard, get the service part
    if (pathParts.length >= 3) {
      return pathParts.slice(2).join('/') || 'dashboard';
    }
    return 'dashboard';
  };

  const handleOrgSwitch = (orgSlug: string) => {
    const servicePath = getCurrentServicePath();
    navigate(`/${orgSlug}/${servicePath}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2", className)}>
        <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
        {!compact && <div className="h-4 w-24 rounded bg-muted animate-pulse" />}
      </div>
    );
  }

  // No current org - show create prompt
  if (!currentOrg) {
    return (
      <button
        onClick={() => navigate('/organizations/create')}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm text-muted-foreground",
          className
        )}
      >
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <PlusIcon className="h-4 w-4 text-primary" />
        </div>
        {!compact && <span>Create Organization</span>}
      </button>
    );
  }

  // Single org - show static display
  if (!myOrgs || myOrgs.length <= 1) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2", className)}>
        <OrgAvatar org={currentOrg} />
        {!compact && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{currentOrg.name}</p>
            <p className="text-xs text-muted-foreground truncate">{formatCategory(currentOrg.category)}</p>
          </div>
        )}
      </div>
    );
  }

  // Multiple orgs - show dropdown
  return (
    <SimpleDropdown>
      <SimpleDropdownTrigger
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors w-full",
          className
        )}
      >
        <OrgAvatar org={currentOrg} />
        {!compact && (
          <>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-medium truncate">{currentOrg.name}</p>
              <p className="text-xs text-muted-foreground truncate">{formatCategory(currentOrg.category)}</p>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          </>
        )}
        {compact && <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />}
      </SimpleDropdownTrigger>

      <SimpleDropdownContent align="start" className="w-72">
        {/* Header */}
        <div className="px-2 py-1.5 border-b border-border mb-1">
          <p className="text-xs font-medium text-muted-foreground">Switch Organization</p>
        </div>

        {/* Organization list */}
        <div className="max-h-64 overflow-y-auto">
          {myOrgs.map((org: any) => {
            const isActive = org.id === currentOrg.id;
            return (
              <SimpleDropdownItem
                key={org.id}
                onClick={() => handleOrgSwitch(org.slug)}
                className={cn(
                  "flex items-center gap-3 py-2",
                  isActive && "bg-accent"
                )}
              >
                <OrgAvatar org={org} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{org.name}</span>
                    {org.role && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {org.role}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground truncate block">
                    {formatCategory(org.category)}
                  </span>
                </div>
                {isActive && (
                  <CheckIcon className="h-4 w-4 text-primary shrink-0" />
                )}
              </SimpleDropdownItem>
            );
          })}
        </div>

        {/* Create new org action */}
        <div className="border-t border-border mt-1 pt-1">
          <SimpleDropdownItem
            onClick={() => navigate('/organizations/create')}
            className="flex items-center gap-3 py-2 text-muted-foreground hover:text-foreground"
          >
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
              <PlusIcon className="h-4 w-4" />
            </div>
            <span className="text-sm">Create new organization</span>
          </SimpleDropdownItem>
        </div>
      </SimpleDropdownContent>
    </SimpleDropdown>
  );
};

// Helper component for org avatar
const OrgAvatar: React.FC<{ org: any; size?: 'sm' | 'md' }> = ({ org, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  
  if (org.logo_url) {
    return (
      <img
        src={org.logo_url}
        alt={org.name}
        className={cn("rounded-lg object-cover shrink-0", sizeClasses)}
      />
    );
  }

  // Fallback to initials
  const initials = org.name
    ?.split(' ')
    .map((word: string) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'ORG';

  return (
    <div
      className={cn(
        "rounded-lg bg-primary/10 flex items-center justify-center font-semibold text-primary shrink-0",
        sizeClasses
      )}
    >
      {initials}
    </div>
  );
};

// Helper to format category
const formatCategory = (category?: string): string => {
  if (!category) return 'Organization';
  
  const categoryMap: Record<string, string> = {
    COLLEGE: 'College',
    COMPANY: 'Company',
    INDUSTRY: 'Industry',
    NON_PROFIT: 'Non-Profit',
  };
  
  return categoryMap[category] || category;
};
