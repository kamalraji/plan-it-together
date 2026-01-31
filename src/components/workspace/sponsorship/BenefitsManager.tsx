import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Check, X, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBenefitsMatrix } from '@/hooks/useSponsorBenefits';

interface BenefitsManagerProps {
  workspaceId: string;
}

const tiers = [
  { key: 'platinum', label: 'Platinum', color: 'bg-slate-600' },
  { key: 'gold', label: 'Gold', color: 'bg-amber-500' },
  { key: 'silver', label: 'Silver', color: 'bg-muted-foreground/30' },
  { key: 'bronze', label: 'Bronze', color: 'bg-orange-500' },
];

export function BenefitsManager({ workspaceId }: BenefitsManagerProps) {
  const { matrix, isLoading } = useBenefitsMatrix(workspaceId);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Benefits Matrix
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {matrix.length} Benefits
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {matrix.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No benefits defined yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[320px]">
            <div className="min-w-[400px]">
              {/* Header */}
              <div className="flex items-center gap-2 pb-3 border-b border-border/50 mb-3 sticky top-0 bg-card z-10">
                <div className="flex-1 text-sm font-medium text-muted-foreground">Benefit</div>
                {tiers.map((tier) => (
                  <div
                    key={tier.key}
                    className={`w-16 text-center text-xs font-medium text-white py-1 px-2 rounded ${tier.color}`}
                  >
                    {tier.label}
                  </div>
                ))}
              </div>
              
              {/* Benefits List */}
              <div className="space-y-2">
                {matrix.map((benefit) => (
                  <div
                    key={benefit.id}
                    className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 text-sm text-foreground">{benefit.benefit}</div>
                    {tiers.map((tier) => {
                      const hasAccess = benefit[tier.key as keyof typeof benefit] as boolean;
                      return (
                        <div key={tier.key} className="w-16 flex justify-center">
                          {hasAccess ? (
                            <div className="p-1 rounded-full bg-emerald-500/10">
                              <Check className="h-4 w-4 text-emerald-500" />
                            </div>
                          ) : (
                            <div className="p-1 rounded-full bg-muted">
                              <X className="h-4 w-4 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
