import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Package, UserPlus, AlertCircle, Rocket, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApprovalsSummaryCardsProps {
  budgetCount: number;
  resourceCount: number;
  accessCount: number;
  eventPublishCount?: number;
  taskApprovalCount?: number;
}

export function ApprovalsSummaryCards({
  budgetCount,
  resourceCount,
  accessCount,
  eventPublishCount,
  taskApprovalCount,
}: ApprovalsSummaryCardsProps) {
  const totalPending = budgetCount + resourceCount + accessCount + (eventPublishCount || 0) + (taskApprovalCount || 0);

  const cards = [
    {
      label: 'Total Pending',
      count: totalPending,
      icon: AlertCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      show: true,
    },
    {
      label: 'Task Approvals',
      count: taskApprovalCount || 0,
      icon: ClipboardCheck,
      color: 'text-violet-600',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20',
      show: taskApprovalCount !== undefined,
    },
    {
      label: 'Budget Requests',
      count: budgetCount,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      show: true,
    },
    {
      label: 'Resource Requests',
      count: resourceCount,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      show: true,
    },
    {
      label: 'Access Requests',
      count: accessCount,
      icon: UserPlus,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      show: true,
    },
    {
      label: 'Event Publish',
      count: eventPublishCount || 0,
      icon: Rocket,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      show: eventPublishCount !== undefined,
    },
  ];

  const visibleCards = cards.filter(c => c.show);

  return (
    <div className={cn(
      'grid gap-4',
      visibleCards.length >= 6 ? 'grid-cols-2 lg:grid-cols-6' :
      visibleCards.length === 5 ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-2 lg:grid-cols-4'
    )}>
      {visibleCards.map((card) => (
        <Card
          key={card.label}
          className={cn(
            'border',
            card.borderColor,
            'transition-all duration-200 hover:shadow-sm'
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', card.bgColor)}>
                <card.icon className={cn('h-4 w-4', card.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{card.count}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
