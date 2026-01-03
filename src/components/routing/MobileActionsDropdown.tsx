import React from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import {
  SimpleDropdown,
  SimpleDropdownContent,
  SimpleDropdownItem,
  SimpleDropdownTrigger,
} from '@/components/ui/simple-dropdown';
import { PageAction } from './PageHeader';

interface MobileActionsDropdownProps {
  actions: PageAction[];
}

export const MobileActionsDropdown: React.FC<MobileActionsDropdownProps> = ({ actions }) => {
  if (actions.length === 0) return null;

  return (
    <SimpleDropdown>
      <SimpleDropdownTrigger className="sm:hidden flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background hover:bg-accent transition-colors">
        <EllipsisVerticalIcon className="h-5 w-5" />
        <span className="sr-only">Actions</span>
      </SimpleDropdownTrigger>
      <SimpleDropdownContent align="end" className="w-56">
        {actions.map((action, index) => (
          <SimpleDropdownItem
            key={index}
            onClick={action.action}
            disabled={action.disabled || action.loading}
            className="flex items-center gap-3 py-2.5 px-3"
          >
            {action.loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              action.icon && <action.icon className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">{action.label}</span>
          </SimpleDropdownItem>
        ))}
      </SimpleDropdownContent>
    </SimpleDropdown>
  );
};
