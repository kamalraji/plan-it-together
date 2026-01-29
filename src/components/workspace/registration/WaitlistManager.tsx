import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ListOrdered, 
  UserPlus,
  Mail,
  ChevronUp,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  useRegistrationWaitlist, 
  useEventIdFromWorkspace,
  useWaitlistMutations,
  WaitlistEntryData
} from '@/hooks/useRegistrationData';

interface WaitlistManagerProps {
  workspaceId: string;
}

export function WaitlistManager({ workspaceId }: WaitlistManagerProps) {
  const { data: eventId } = useEventIdFromWorkspace(workspaceId);
  const { data, isLoading } = useRegistrationWaitlist(eventId || null);
  
  const mutations = eventId ? useWaitlistMutations(eventId) : null;

  const waitlist = data?.entries || [];
  const availableSpots = data?.availableSpots || 0;

  const handlePromote = (entry: WaitlistEntryData) => {
    if (!mutations) return;
    mutations.promoteEntry.mutate({ entryId: entry.id, entry });
  };

  const handleRemove = (entryId: string) => {
    if (!mutations) return;
    mutations.removeEntry.mutate({ entryId });
  };

  const handleMoveUp = (entryId: string) => {
    if (!mutations) return;
    mutations.moveUp.mutate(entryId);
  };

  const handleMoveDown = (entryId: string) => {
    if (!mutations) return;
    mutations.moveDown.mutate(entryId);
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-44 mt-1" />
              </div>
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40 mt-1" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-7 w-7" />
                <Skeleton className="h-7 w-7" />
                <Skeleton className="h-7 w-7" />
                <Skeleton className="h-7 w-7" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getPriorityBadge = (priority: 'normal' | 'high' | 'vip') => {
    if (priority === 'high') {
      return (
        <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px]">
          Priority
        </Badge>
      );
    }
    if (priority === 'vip') {
      return (
        <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px]">
          VIP
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <ListOrdered className="w-5 h-5 text-violet-600" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg">Waitlist Manager</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {waitlist.length} in queue · {availableSpots} spots available
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            disabled={waitlist.length === 0 || availableSpots === 0 || !mutations}
            onClick={() => waitlist[0] && handlePromote(waitlist[0])}
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Promote Next</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {waitlist.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ListOrdered className="w-10 h-10 mx-auto mb-2 opacity-50" aria-hidden="true" />
            <p>Waitlist is empty</p>
            <p className="text-xs mt-1">New entries will appear here when registration is full</p>
          </div>
        ) : (
          <div role="list" aria-label="Waitlist entries">
            {waitlist.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                role="listitem"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary"
                    aria-label={`Position ${entry.position}`}
                  >
                    #{entry.position}
                  </div>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-muted">
                      {entry.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{entry.name}</p>
                      {getPriorityBadge(entry.priority)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{entry.ticketType}</span>
                      <span aria-hidden="true">·</span>
                      <span>Joined {formatDistanceToNow(entry.joinedAt, { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7" 
                    disabled={index === 0 || mutations?.moveUp.isPending}
                    onClick={() => handleMoveUp(entry.id)}
                    aria-label={`Move ${entry.name} up in queue`}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7" 
                    disabled={index === waitlist.length - 1 || mutations?.moveDown.isPending}
                    onClick={() => handleMoveDown(entry.id)}
                    aria-label={`Move ${entry.name} down in queue`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10"
                    disabled={availableSpots === 0 || mutations?.promoteEntry.isPending}
                    onClick={() => handlePromote(entry)}
                    aria-label={`Promote ${entry.name} to confirmed`}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    disabled={mutations?.removeEntry.isPending}
                    onClick={() => handleRemove(entry.id)}
                    aria-label={`Remove ${entry.name} from waitlist`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {availableSpots > 0 && waitlist.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <Button variant="outline" className="w-full gap-2">
              <Mail className="w-4 h-4" aria-hidden="true" />
              Send Invites to Top {Math.min(availableSpots, waitlist.length)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
