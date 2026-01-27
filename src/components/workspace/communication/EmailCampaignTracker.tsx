import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, MousePointer, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
  recipients: number;
  sent?: number;
  opened?: number;
  clicked?: number;
  scheduledDate?: string;
}

const mockCampaigns: EmailCampaign[] = [
  {
    id: '1',
    name: 'Registration Confirmation',
    subject: 'Welcome! Your Registration is Confirmed',
    status: 'completed',
    recipients: 450,
    sent: 450,
    opened: 385,
    clicked: 210,
  },
  {
    id: '2',
    name: 'Event Reminder - 1 Week',
    subject: "Don't Forget: Event Starts Next Week!",
    status: 'scheduled',
    recipients: 520,
    scheduledDate: '2026-01-08',
  },
  {
    id: '3',
    name: 'Speaker Announcement',
    subject: 'Meet Our Amazing Speakers',
    status: 'sent',
    recipients: 480,
    sent: 478,
    opened: 312,
    clicked: 145,
  },
  {
    id: '4',
    name: 'Post-Event Survey',
    subject: 'Share Your Feedback',
    status: 'draft',
    recipients: 0,
  },
];

const statusColors = {
  draft: 'text-muted-foreground bg-muted-foreground/30/10',
  scheduled: 'text-amber-500 bg-amber-500/10',
  sent: 'text-blue-500 bg-blue-500/10',
  completed: 'text-emerald-500 bg-emerald-500/10',
};

export function EmailCampaignTracker() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Campaigns
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {mockCampaigns.length} Campaigns
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
            {mockCampaigns.map((campaign) => {
              const openRate = campaign.opened && campaign.sent 
                ? Math.round((campaign.opened / campaign.sent) * 100) 
                : 0;
              const clickRate = campaign.clicked && campaign.opened 
                ? Math.round((campaign.clicked / campaign.opened) * 100) 
                : 0;
              
              return (
                <div
                  key={campaign.id}
                  className="grid grid-cols-12 gap-4 items-center py-3 px-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="col-span-4">
                    <p className="font-medium text-sm text-foreground truncate">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{campaign.subject}</p>
                  </div>
                  
                  <div className="col-span-2 flex justify-center">
                    <Badge variant="outline" className={`text-xs border-0 ${statusColors[campaign.status]}`}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="col-span-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{campaign.recipients.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-4">
                    {campaign.status === 'completed' || campaign.status === 'sent' ? (
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
                    ) : campaign.scheduledDate ? (
                      <p className="text-xs text-amber-500">
                        Scheduled: {new Date(campaign.scheduledDate).toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not sent yet</p>
                    )}
                  </div>
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
