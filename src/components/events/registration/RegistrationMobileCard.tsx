/**
 * RegistrationMobileCard
 * Mobile-optimized card view for registration entries
 * Replaces table row on small screens for better touch interaction
 */

import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  UserCheck,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import type { Registration, RegistrationStatus } from '@/hooks/useEventRegistrations';

const STATUS_CONFIG: Record<RegistrationStatus | 'CHECKED_IN', { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  WAITLISTED: { label: 'Waitlisted', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Users },
  CHECKED_IN: { label: 'Checked In', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: UserCheck },
};

interface RegistrationMobileCardProps {
  registration: Registration;
  isSelected: boolean;
  onSelect: () => void;
  onStatusChange: (status: RegistrationStatus) => void;
  canManage: boolean;
  isUpdating: boolean;
}

export const RegistrationMobileCard: React.FC<RegistrationMobileCardProps> = ({
  registration,
  isSelected,
  onSelect,
  onStatusChange,
  canManage,
  isUpdating,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const statusConfig = STATUS_CONFIG[registration.status];
  const StatusIcon = statusConfig.icon;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="p-4 border-b border-border bg-card">
        {/* Header Row */}
        <div className="flex items-start gap-3">
          {canManage && (
            <div className="pt-1">
              <Checkbox 
                checked={isSelected}
                onCheckedChange={onSelect}
                aria-label={`Select ${registration.user?.fullName || 'registration'}`}
              />
            </div>
          )}
          
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={registration.user?.avatarUrl || undefined} />
            <AvatarFallback className="text-lg">
              {registration.user?.fullName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">
                  {registration.user?.fullName || 'Unknown User'}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {registration.user?.email || 'No email'}
                </p>
              </div>
              
              <Badge className={`${statusConfig.color} border-0 gap-1 flex-shrink-0`}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
            
            {/* Quick Info */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{registration.ticketTierName || 'General'}</span>
              <span>•</span>
              <span className="font-medium text-foreground">
                {registration.totalAmount > 0 
                  ? `$${registration.totalAmount.toFixed(2)}`
                  : 'Free'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Expand/Collapse Toggle */}
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-3 h-9 text-muted-foreground"
            aria-label={isExpanded ? 'Show less' : 'Show more'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Less details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                More details
              </>
            )}
          </Button>
        </CollapsibleTrigger>
        
        {/* Expanded Content */}
        <CollapsibleContent className="mt-3 pt-3 border-t border-border">
          <div className="space-y-3">
            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-medium">{registration.quantity}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Registered</p>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(registration.registeredAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            {/* Actions */}
            {canManage && (
              <div className="flex gap-2 pt-2">
                {registration.status !== 'CONFIRMED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange('CONFIRMED')}
                    disabled={isUpdating}
                    className="flex-1 min-h-[44px]"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Approve
                  </Button>
                )}
                
                {registration.status !== 'CANCELLED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange('CANCELLED')}
                    disabled={isUpdating}
                    className="flex-1 min-h-[44px] text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      disabled={isUpdating}
                      className="min-h-[44px] min-w-[44px]"
                      aria-label="More actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {registration.status === 'WAITLISTED' && (
                      <DropdownMenuItem onClick={() => onStatusChange('CONFIRMED')}>
                        <UserCheck className="h-4 w-4 mr-2 text-purple-600" />
                        Move to Confirmed
                      </DropdownMenuItem>
                    )}
                    {registration.status === 'PENDING' && (
                      <DropdownMenuItem onClick={() => onStatusChange('WAITLISTED')}>
                        <Users className="h-4 w-4 mr-2 text-blue-600" />
                        Add to Waitlist
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      View Full Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default RegistrationMobileCard;
