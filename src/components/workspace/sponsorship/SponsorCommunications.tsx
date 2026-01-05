import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Phone, Calendar, MoreHorizontal, Reply, ArrowUpRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Communication {
  id: string;
  sponsor: string;
  type: 'email' | 'call' | 'meeting';
  subject: string;
  date: string;
  status: 'sent' | 'received' | 'scheduled';
  preview?: string;
}

const mockCommunications: Communication[] = [
  {
    id: '1',
    sponsor: 'TechCorp Global',
    type: 'email',
    subject: 'Sponsorship Package Details',
    date: '2026-01-05T10:30:00',
    status: 'sent',
    preview: 'Thank you for your interest in our Platinum sponsorship...',
  },
  {
    id: '2',
    sponsor: 'Innovation Labs',
    type: 'call',
    subject: 'Follow-up on proposal',
    date: '2026-01-04T14:00:00',
    status: 'received',
  },
  {
    id: '3',
    sponsor: 'Digital Solutions',
    type: 'meeting',
    subject: 'Contract Negotiation',
    date: '2026-01-08T11:00:00',
    status: 'scheduled',
  },
  {
    id: '4',
    sponsor: 'Cloud Systems',
    type: 'email',
    subject: 'Deliverables Confirmation',
    date: '2026-01-03T09:15:00',
    status: 'received',
    preview: 'We confirm the following deliverables for our Silver package...',
  },
  {
    id: '5',
    sponsor: 'TechCorp Global',
    type: 'meeting',
    subject: 'Booth Setup Discussion',
    date: '2026-01-10T15:00:00',
    status: 'scheduled',
  },
];

const typeConfig = {
  email: { icon: Mail, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  call: { icon: Phone, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  meeting: { icon: Calendar, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
};

const statusColors = {
  sent: 'text-blue-500 bg-blue-500/10',
  received: 'text-emerald-500 bg-emerald-500/10',
  scheduled: 'text-amber-500 bg-amber-500/10',
};

export function SponsorCommunications() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Recent Communications
          </CardTitle>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {mockCommunications.map((comm) => {
              const config = typeConfig[comm.type];
              const TypeIcon = config.icon;
              
              return (
                <div
                  key={comm.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className={`p-2 rounded-lg ${config.bgColor} mt-0.5`}>
                    <TypeIcon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-foreground truncate">{comm.subject}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(comm.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{comm.sponsor}</span>
                      <Badge variant="outline" className={`text-xs border-0 ${statusColors[comm.status]}`}>
                        {comm.status.charAt(0).toUpperCase() + comm.status.slice(1)}
                      </Badge>
                    </div>
                    {comm.preview && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                        {comm.preview}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Reply className="h-4 w-4 mr-2" />
                        Reply
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Open
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
