import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Check, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SponsorBenefit {
  id: string;
  benefit: string;
  platinum: boolean;
  gold: boolean;
  silver: boolean;
  bronze: boolean;
}

const mockBenefits: SponsorBenefit[] = [
  { id: '1', benefit: 'Logo on main stage', platinum: true, gold: true, silver: false, bronze: false },
  { id: '2', benefit: 'Speaking opportunity', platinum: true, gold: true, silver: false, bronze: false },
  { id: '3', benefit: 'Exhibition booth', platinum: true, gold: true, silver: true, bronze: false },
  { id: '4', benefit: 'Social media mentions', platinum: true, gold: true, silver: true, bronze: true },
  { id: '5', benefit: 'Logo on website', platinum: true, gold: true, silver: true, bronze: true },
  { id: '6', benefit: 'VIP passes (10)', platinum: true, gold: false, silver: false, bronze: false },
  { id: '7', benefit: 'VIP passes (5)', platinum: false, gold: true, silver: false, bronze: false },
  { id: '8', benefit: 'VIP passes (2)', platinum: false, gold: false, silver: true, bronze: false },
  { id: '9', benefit: 'Attendee list access', platinum: true, gold: true, silver: false, bronze: false },
  { id: '10', benefit: 'Newsletter feature', platinum: true, gold: true, silver: true, bronze: false },
];

const tiers = [
  { key: 'platinum', label: 'Platinum', color: 'bg-slate-600' },
  { key: 'gold', label: 'Gold', color: 'bg-amber-500' },
  { key: 'silver', label: 'Silver', color: 'bg-muted-foreground/20' },
  { key: 'bronze', label: 'Bronze', color: 'bg-orange-500' },
];

export function BenefitsManager() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Benefits Matrix
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {mockBenefits.length} Benefits
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
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
              {mockBenefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 text-sm text-foreground">{benefit.benefit}</div>
                  {tiers.map((tier) => {
                    const hasAccess = benefit[tier.key as keyof SponsorBenefit] as boolean;
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
      </CardContent>
    </Card>
  );
}
