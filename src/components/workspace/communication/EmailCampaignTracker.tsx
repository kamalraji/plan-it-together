import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, MousePointer, Users, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useEmailCampaigns, type EmailCampaign, type EmailCampaignStatus } from '@/hooks/useEmailCampaigns';

interface EmailCampaignTrackerProps {
  workspaceId?: string;
}

const statusColors: Record<EmailCampaignStatus, string> = {
  draft: 'text-muted-foreground bg-muted',
  scheduled: 'text-amber-500 bg-amber-500/10',
  sending: 'text-blue-500 bg-blue-500/10',
  sent: 'text-blue-500 bg-blue-500/10',
  completed: 'text-emerald-500 bg-emerald-500/10',
  failed: 'text-red-500 bg-red-500/10',
};

export function EmailCampaignTracker({ workspaceId }: EmailCampaignTrackerProps) {
  const { data: campaigns = [], isLoading } = useEmailCampaigns(workspaceId);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email Campaigns
            </CardTitle>
            <Badge variant="outline" className="text-sm">0 Campaigns</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[200px] text-center">
          <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No email campaigns yet</p>
          <p className="text-sm text-muted-foreground/70">Create your first email campaign</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Campaigns
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {campaigns.length} Campaigns
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="space-y-4 min-w-[600px]">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground pb-2 border-b border-border/50">
              <div className="col-span-4">Campaign</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-center">Recipients</div>
              <div className="col-span-4">Performance</div>
            </div>
            
            {/* Campaigns */}
            {campaigns.map((campaign) => (
              <EmailCampaignRow key={campaign.id} campaign={campaign} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function EmailCampaignRow({ campaign }: { campaign: EmailCampaign }) {
  const openRate = campaign.openedCount && campaign.sentCount 
    ? Math.round((campaign.openedCount / campaign.sentCount) * 100) 
    : 0;
  const clickRate = campaign.clickedCount && campaign.openedCount 
    ? Math.round((campaign.clickedCount / campaign.openedCount) * 100) 
    : 0;

  const statusLabel = campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1);
  const hasSent = campaign.status === 'sent' || campaign.status === 'completed';

  return (
    <div className="grid grid-cols-12 gap-4 items-center py-3 px-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
      <div className="col-span-4">
        <p className="font-medium text-sm text-foreground truncate">{campaign.name}</p>
        <p className="text-xs text-muted-foreground truncate">{campaign.subject}</p>
      </div>
      
      <div className="col-span-2 flex justify-center">
        <Badge variant="outline" className={`text-xs border-0 ${statusColors[campaign.status]}`}>
          {statusLabel}
        </Badge>
      </div>
      
      <div className="col-span-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{campaign.recipients.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="col-span-4">
        {hasSent ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-blue-500" />
              <Progress value={openRate} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground w-10">{openRate}%</span>
            </div>
            <div className="flex items-center gap-2">
              <MousePointer className="h-3.5 w-3.5 text-emerald-500" />
              <Progress value={clickRate} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground w-10">{clickRate}%</span>
            </div>
          </div>
        ) : campaign.scheduledFor ? (
          <p className="text-xs text-amber-500">
            Scheduled: {new Date(campaign.scheduledFor).toLocaleDateString()}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Not sent yet</p>
        )}
      </div>
    </div>
  );
}
