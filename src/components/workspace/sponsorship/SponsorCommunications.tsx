import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Phone, Calendar, MoreHorizontal, Reply, ArrowUpRight, Loader2 } from 'lucide-react';
import {
  SimpleDropdown,
  SimpleDropdownTrigger,
  SimpleDropdownContent,
  SimpleDropdownItem,
} from '@/components/ui/simple-dropdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSponsorCommunications } from '@/hooks/useSponsorCommunications';

interface SponsorCommunicationsProps {
  workspaceId: string;
}

const typeConfig = {
  email: { icon: Mail, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  call: { icon: Phone, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  meeting: { icon: Calendar, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  other: { icon: MessageSquare, color: 'text-muted-foreground', bgColor: 'bg-muted/50' },
};

const statusColors = {
  sent: 'text-blue-500 bg-blue-500/10',
  received: 'text-emerald-500 bg-emerald-500/10',
  scheduled: 'text-amber-500 bg-amber-500/10',
  completed: 'text-muted-foreground bg-muted/50',
};

export function SponsorCommunications({ workspaceId }: SponsorCommunicationsProps) {
  const { data: communications = [], isLoading } = useSponsorCommunications(workspaceId, 10);

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
            <MessageSquare className="h-5 w-5 text-primary" />
            Recent Communications
          </CardTitle>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {communications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No communications logged yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {communications.map((comm) => {
                const config = typeConfig[comm.type] || typeConfig.other;
                const TypeIcon = config.icon;
                const dateToShow = comm.sentAt || comm.createdAt;
                
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
                          {formatDate(dateToShow)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{comm.sponsorName}</span>
                        <Badge variant="outline" className={`text-xs border-0 ${statusColors[comm.status] || ''}`}>
                          {comm.status.charAt(0).toUpperCase() + comm.status.slice(1)}
                        </Badge>
                      </div>
                      {comm.content && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                          {comm.content}
                        </p>
                      )}
                    </div>
                    <SimpleDropdown>
                      <SimpleDropdownTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 shrink-0 hover:bg-accent hover:text-accent-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </SimpleDropdownTrigger>
                      <SimpleDropdownContent align="end">
                        <SimpleDropdownItem>
                          <Reply className="h-4 w-4 mr-2" />
                          Reply
                        </SimpleDropdownItem>
                        <SimpleDropdownItem>
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          Open
                        </SimpleDropdownItem>
                      </SimpleDropdownContent>
                    </SimpleDropdown>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
