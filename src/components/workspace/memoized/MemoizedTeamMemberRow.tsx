import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Mail, Phone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TeamMemberRowProps {
  id: string;
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  status: string;
  workspaceName?: string;
  onEdit?: () => void;
  onRemove?: () => void;
  onContact?: () => void;
  className?: string;
}

const roleConfig = {
  LEAD: { color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Lead' },
  CO_LEAD: { color: 'text-indigo-500', bg: 'bg-indigo-500/10', label: 'Co-Lead' },
  MEMBER: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Member' },
  VIEWER: { color: 'text-muted-foreground', bg: 'bg-muted', label: 'Viewer' },
} as const;

const statusConfig = {
  ACTIVE: { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Active' },
  INVITED: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Invited' },
  INACTIVE: { color: 'text-muted-foreground', bg: 'bg-muted', label: 'Inactive' },
} as const;

function TeamMemberRowComponent({
  fullName,
  email,
  avatarUrl,
  role,
  status,
  workspaceName,
  onEdit,
  onRemove,
  onContact,
  className,
}: TeamMemberRowProps) {
  const roleStyle = roleConfig[role as keyof typeof roleConfig] || roleConfig.MEMBER;
  const statusStyle = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-accent/5 transition-colors',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatarUrl} alt={fullName} />
          <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{fullName}</span>
            <Badge className={cn('text-[10px]', roleStyle.bg, roleStyle.color)} variant="secondary">
              {roleStyle.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {email && (
              <span className="flex items-center gap-1 truncate max-w-[180px]">
                <Mail className="h-3 w-3 flex-shrink-0" />
                {email}
              </span>
            )}
            {workspaceName && (
              <span className="truncate max-w-[120px]">• {workspaceName}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge className={cn('text-[10px]', statusStyle.bg, statusStyle.color)} variant="secondary">
          {statusStyle.label}
        </Badge>

        {(onEdit || onRemove || onContact) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onContact && (
                <DropdownMenuItem onClick={onContact}>
                  <Phone className="h-4 w-4 mr-2" />
                  Contact
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  Edit Role
                </DropdownMenuItem>
              )}
              {onRemove && (
                <DropdownMenuItem onClick={onRemove} className="text-destructive">
                  Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

/**
 * Memoized TeamMemberRow component for use in lists
 * Only re-renders when props change
 */
export const MemoizedTeamMemberRow = memo(TeamMemberRowComponent, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.fullName === nextProps.fullName &&
    prevProps.role === nextProps.role &&
    prevProps.status === nextProps.status &&
    prevProps.avatarUrl === nextProps.avatarUrl &&
    prevProps.workspaceName === nextProps.workspaceName
  );
});

MemoizedTeamMemberRow.displayName = 'MemoizedTeamMemberRow';

export default MemoizedTeamMemberRow;
