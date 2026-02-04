import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowRight, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface Proposal {
  id: string;
  company: string;
  tier: string;
  value: number;
  stage: 'draft' | 'sent' | 'negotiation' | 'closed-won' | 'closed-lost';
  daysInStage: number;
}

const mockProposals: Proposal[] = [
  { id: '1', company: 'Enterprise Solutions', tier: 'Platinum', value: 75000, stage: 'negotiation', daysInStage: 3 },
  { id: '2', company: 'StartupHub', tier: 'Gold', value: 25000, stage: 'sent', daysInStage: 5 },
  { id: '3', company: 'Tech Ventures', tier: 'Silver', value: 15000, stage: 'draft', daysInStage: 1 },
  { id: '4', company: 'Global Media', tier: 'Gold', value: 30000, stage: 'negotiation', daysInStage: 7 },
  { id: '5', company: 'Fintech Corp', tier: 'Platinum', value: 50000, stage: 'closed-won', daysInStage: 0 },
  { id: '6', company: 'Local Business Co', tier: 'Bronze', value: 5000, stage: 'closed-lost', daysInStage: 0 },
  { id: '7', company: 'Digital Agency', tier: 'Silver', value: 12000, stage: 'sent', daysInStage: 2 },
];

const stages = [
  { key: 'draft', label: 'Draft', icon: FileText, color: 'text-muted-foreground', bgColor: 'bg-muted-foreground/30/10' },
  { key: 'sent', label: 'Sent', icon: Send, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { key: 'negotiation', label: 'Negotiation', icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { key: 'closed-won', label: 'Won', icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { key: 'closed-lost', label: 'Lost', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
];

export function ProposalPipeline() {
  const getProposalsByStage = (stage: string) => 
    mockProposals.filter(p => p.stage === stage);

  const getStageValue = (stage: string) =>
    getProposalsByStage(stage).reduce((sum, p) => sum + p.value, 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Proposal Pipeline
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            Total: ${mockProposals.reduce((sum, p) => sum + p.value, 0).toLocaleString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 min-w-[900px]">
            {stages.map((stage, index) => {
              const proposals = getProposalsByStage(stage.key);
              const stageValue = getStageValue(stage.key);
              const StageIcon = stage.icon;
              
              return (
                <div key={stage.key} className="flex items-start gap-2">
                  <div className="flex-1 min-w-[170px]">
                    <div className={`p-3 rounded-lg ${stage.bgColor} mb-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <StageIcon className={`h-4 w-4 ${stage.color}`} />
                        <span className={`font-medium text-sm ${stage.color}`}>{stage.label}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{proposals.length} proposals</span>
                        <span className="font-medium">${stageValue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {proposals.map((proposal) => (
                        <div
                          key={proposal.id}
                          className="p-2.5 rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        >
                          <p className="font-medium text-sm text-foreground truncate">{proposal.company}</p>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="outline" className="text-xs">
                              {proposal.tier}
                            </Badge>
                            <span className="text-xs font-medium text-muted-foreground">
                              ${proposal.value.toLocaleString()}
                            </span>
                          </div>
                          {proposal.daysInStage > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {proposal.daysInStage}d in stage
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {index < stages.length - 1 && (
                    <div className="pt-10">
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
