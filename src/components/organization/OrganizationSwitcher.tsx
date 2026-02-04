import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyOrganizations } from '@/hooks/useOrganization';
import { useCurrentOrganization } from './OrganizationContext';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const OrganizationSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const currentOrg = useCurrentOrganization();
  const { data: myOrgs } = useMyOrganizations();

  if (!myOrgs || myOrgs.length <= 1) {
    return (
      <div className="px-4 py-2 text-sm font-medium text-foreground">
        {currentOrg?.name}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 hover:bg-accent rounded-md transition-colors">
        <span className="text-sm font-medium">{currentOrg?.name}</span>
        <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {myOrgs.map((org: any) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => navigate(`/${org.slug}/dashboard`)}
            className={org.id === currentOrg?.id ? 'bg-accent' : ''}
          >
            <div className="flex flex-col">
              <span className="font-medium">{org.name}</span>
              <span className="text-xs text-muted-foreground">{org.category}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
