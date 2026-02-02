import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OutgoingSummaryCardsProps {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export function OutgoingSummaryCards({
  pendingCount,
  approvedCount,
  rejectedCount,
}: OutgoingSummaryCardsProps) {
  const cards = [
    {
      label: 'Pending',
      count: pendingCount,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      label: 'Approved',
      count: approvedCount,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: 'Rejected',
      count: rejectedCount,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
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
