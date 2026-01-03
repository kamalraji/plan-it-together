import React from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { PageAction } from './PageHeader';

interface MobileActionsDropdownProps {
  actions: PageAction[];
}

export const MobileActionsDropdown: React.FC<MobileActionsDropdownProps> = ({ actions }) => {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="sm:hidden h-9 w-9 border-border"
        >
          <EllipsisVerticalIcon className="h-5 w-5" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg z-50">
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.action}
            disabled={action.disabled || action.loading}
            className="flex items-center gap-3 cursor-pointer py-2.5 px-3"
          >
            {action.loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              action.icon && <action.icon className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">{action.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
