import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, FileText, CheckCircle2, Clock, Send, Edit, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePressReleases, type PressRelease, type PressReleaseStatus, type PressReleaseType } from '@/hooks/usePressReleases';

interface PressReleaseTrackerProps {
  workspaceId?: string;
}

const statusConfig: Record<PressReleaseStatus, { icon: typeof Edit; color: string; bgColor: string; label: string }> = {
  draft: { icon: Edit, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Draft' },
  review: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'In Review' },
  approved: { icon: CheckCircle2, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Approved' },
  distributed: { icon: Send, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', label: 'Distributed' },
};

const typeLabels: Record<PressReleaseType, string> = {
  'press-release': 'Press Release',
  'media-kit': 'Media Kit',
  'fact-sheet': 'Fact Sheet',
  'statement': 'Statement',
};

export function PressReleaseTracker({ workspaceId }: PressReleaseTrackerProps) {
  const { data: releases = [], isLoading } = usePressReleases(workspaceId);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            Press & Media
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[280px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (releases.length === 0) {
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
        <CardContent className="flex flex-col items-center justify-center h-[280px] text-center">
          <Newspaper className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No press releases yet</p>
          <p className="text-sm text-muted-foreground/70">Create your first press release</p>
        </CardContent>
      </Card>
    );
  }

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
            {releases.map((release) => (
              <PressReleaseRow key={release.id} release={release} />
            ))}
          </div>
        </ScrollArea>
        <Button variant="outline" size="sm" className="w-full mt-3">
          View All Press Materials
        </Button>
      </CardContent>
    </Card>
  );
}

function PressReleaseRow({ release }: { release: PressRelease }) {
  const config = statusConfig[release.status];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-start justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer">
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
            {release.authorName && <span>by {release.authorName}</span>}
          </div>
        </div>
      </div>
      <Badge variant="outline" className={`text-xs ${config.bgColor} ${config.color} border-0 shrink-0`}>
        {config.label}
      </Badge>
    </div>
  );
}
