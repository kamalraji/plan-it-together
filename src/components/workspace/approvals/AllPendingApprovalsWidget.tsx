import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Package, 
  UserPlus, 
  CheckSquare, 
  ChevronDown,
  ChevronRight,
  Clock,
  Bell,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAllPendingApprovals, ApprovalCategory } from '@/hooks/useAllPendingApprovals';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface AllPendingApprovalsWidgetProps {
  eventId: string;
  orgSlug?: string;
  className?: string;
}

const CATEGORY_CONFIG: Record<ApprovalCategory, { 
  icon: React.ElementType; 
  label: string; 
  bgClass: string; 
  textClass: string;
}> = {
  budget: { 
    icon: DollarSign, 
    label: 'Budget', 
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
  resource: { 
    icon: Package, 
    label: 'Resources', 
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-600 dark:text-blue-400',
  },
  access: { 
    icon: UserPlus, 
    label: 'Access', 
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
    textClass: 'text-purple-600 dark:text-purple-400',
  },
  task: { 
    icon: CheckSquare, 
    label: 'Tasks', 
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
};

export function AllPendingApprovalsWidget({ 
  eventId, 
  orgSlug,
  className,
}: AllPendingApprovalsWidgetProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const { approvals, byCategory, totalCount, isLoading } = useAllPendingApprovals();

  const handleViewAll = () => {
    const basePath = orgSlug ? `/${orgSlug}/workspaces` : '/workspaces';
    navigate(`${basePath}/${eventId}?tab=approvals`);
  };

  const handleApprovalClick = (workspaceId: string) => {
    const basePath = orgSlug ? `/${orgSlug}/workspaces` : '/workspaces';
    navigate(`${basePath}/${eventId}?workspaceId=${workspaceId}&tab=approvals`);
  };

  if (isLoading) {
    return (
      <Skeleton className="h-48 w-full rounded-xl" />
    );
  }

  // Don't render if no pending approvals
  if (totalCount === 0) {
    return null;
  }

  const displayApprovals = approvals.slice(0, 5);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("bg-card rounded-xl border border-border overflow-hidden", className)}>
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Pending Approvals
            </h3>
            <Badge 
              variant="secondary" 
              className="bg-primary/10 text-primary hover:bg-primary/20"
            >
              {totalCount}
            </Badge>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* Category Summary */}
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(byCategory) as [ApprovalCategory, number][]).map(([category, count]) => {
                const config = CATEGORY_CONFIG[category];
                const Icon = config.icon;
                
                return (
                  <div 
                    key={category}
                    className={cn(
                      "rounded-lg p-2 text-center",
                      config.bgClass
                    )}
                  >
                    <Icon className={cn("h-4 w-4 mx-auto mb-1", config.textClass)} />
                    <p className={cn("text-lg font-semibold", config.textClass)}>
                      {count}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {config.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Recent Approvals List */}
            {displayApprovals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Latest Pending
                </p>
                <div className="space-y-1">
                  {displayApprovals.map((approval) => {
                    const config = CATEGORY_CONFIG[approval.type];
                    const Icon = config.icon;
                    
                    return (
                      <button
                        key={approval.id}
                        onClick={() => handleApprovalClick(approval.workspaceId)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                      >
                        <div className={cn("p-1.5 rounded-md", config.bgClass)}>
                          <Icon className={cn("h-3 w-3", config.textClass)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {approval.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate">{approval.workspaceName}</span>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        {approval.priority === 'urgent' || approval.priority === 'high' ? (
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", PRIORITY_COLORS[approval.priority])}
                          >
                            {approval.priority}
                          </Badge>
                        ) : null}
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* View All Button */}
            <Button 
              variant="outline" 
              className="w-full" 
              size="sm"
              onClick={handleViewAll}
            >
              View All Approvals
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
