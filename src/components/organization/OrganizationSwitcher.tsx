import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyMemberOrganizations } from '@/hooks/useOrganization';
import { useCurrentOrganization } from './OrganizationContext';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  SimpleDropdown,
  SimpleDropdownContent,
  SimpleDropdownItem,
  SimpleDropdownTrigger,
} from '@/components/ui/simple-dropdown';

export const OrganizationSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const currentOrg = useCurrentOrganization();
  const { data: myOrgs } = useMyMemberOrganizations();

  if (!currentOrg) {
    return null;
  }

  if (!myOrgs || myOrgs.length <= 1) {
    return (
      <div className="px-4 py-2 text-sm font-medium text-foreground">
        {currentOrg.name}
      </div>
    );
  }

  return (
    <SimpleDropdown>
      <SimpleDropdownTrigger className="flex items-center gap-2 px-4 py-2 hover:bg-accent rounded-md transition-colors">
        <span className="text-sm font-medium truncate max-w-[160px] sm:max-w-xs">
          {currentOrg.name}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
      </SimpleDropdownTrigger>
      <SimpleDropdownContent align="start" className="w-56">
        {myOrgs.map((org: any) => (
          <SimpleDropdownItem
            key={org.id}
            onClick={() => navigate(`/${org.slug}/dashboard`)}
            className={org.id === currentOrg.id ? 'bg-accent' : ''}
          >
            <div className="flex flex-col">
              <span className="font-medium truncate">{org.name}</span>
              <span className="text-xs text-muted-foreground truncate">{org.category}</span>
            </div>
          </SimpleDropdownItem>
        ))}
      </SimpleDropdownContent>
    </SimpleDropdown>
  );
};
