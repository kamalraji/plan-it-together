import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, FileText, CheckCircle2, Clock, Send, Edit } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PressRelease {
  id: string;
  title: string;
  type: 'press-release' | 'media-kit' | 'fact-sheet';
  status: 'draft' | 'review' | 'approved' | 'distributed';
  author: string;
  lastUpdated: string;
}

const mockPressReleases: PressRelease[] = [
  {
    id: '1',
    title: 'Tech Conference 2026 Announces Keynote Speakers',
    type: 'press-release',
    status: 'distributed',
    author: 'Sarah Johnson',
    lastUpdated: '2026-01-03',
  },
  {
    id: '2',
    title: 'Event Media Kit',
    type: 'media-kit',
    status: 'approved',
    author: 'Mike Chen',
    lastUpdated: '2026-01-04',
  },
  {
    id: '3',
    title: 'Conference Fact Sheet 2026',
    type: 'fact-sheet',
    status: 'approved',
    author: 'Emily Davis',
    lastUpdated: '2026-01-02',
  },
  {
    id: '4',
    title: 'Partnership Announcement - TechCorp',
    type: 'press-release',
    status: 'review',
    author: 'Sarah Johnson',
    lastUpdated: '2026-01-05',
  },
  {
    id: '5',
    title: 'Post-Event Success Story',
    type: 'press-release',
    status: 'draft',
    author: 'Alex Brown',
    lastUpdated: '2026-01-05',
  },
];

const statusConfig = {
  draft: { icon: Edit, color: 'text-muted-foreground', bgColor: 'bg-muted-foreground/30/10', label: 'Draft' },
  review: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'In Review' },
  approved: { icon: CheckCircle2, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Approved' },
  distributed: { icon: Send, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Distributed' },
};

const typeLabels = {
  'press-release': 'Press Release',
  'media-kit': 'Media Kit',
  'fact-sheet': 'Fact Sheet',
};

export function PressReleaseTracker() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            Press & Media
          </CardTitle>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            New Release
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-2">
            {mockPressReleases.map((release) => {
              const config = statusConfig[release.status];
              const StatusIcon = config.icon;
              
              return (
                <div
                  key={release.id}
                  className="flex items-start justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${config.bgColor} mt-0.5`}>
                      <StatusIcon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{release.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {typeLabels[release.type]}
                        </Badge>
                        <span>by {release.author}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${config.bgColor} ${config.color} border-0 shrink-0`}>
                    {config.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <Button variant="outline" size="sm" className="w-full mt-3">
          View All Press Materials
        </Button>
      </CardContent>
    </Card>
  );
}
