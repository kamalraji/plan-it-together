import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Edit3,
  Eye,
  Send,
  Loader2,
} from 'lucide-react';
import { useContentItems } from '@/hooks/useContentDepartmentData';

interface ContentPipelineOverviewProps {
  workspaceId?: string;
}

const statusConfig = {
  draft: { icon: Edit3, label: 'Draft', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  review: { icon: Eye, label: 'In Review', color: 'text-warning', bgColor: 'bg-warning/10' },
  in_review: { icon: Eye, label: 'In Review', color: 'text-warning', bgColor: 'bg-warning/10' },
  approved: { icon: CheckCircle, label: 'Approved', color: 'text-success', bgColor: 'bg-success/10' },
  published: { icon: Send, label: 'Published', color: 'text-info', bgColor: 'bg-info/10' },
};

const priorityConfig = {
  low: 'bg-slate-500/10 text-muted-foreground',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-destructive/10 text-destructive',
};

export function ContentPipelineOverview({ workspaceId }: ContentPipelineOverviewProps) {
  const { data: contentItems = [], isLoading } = useContentItems(workspaceId || '');

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center h-[350px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-info/10">
              <FileText className="h-4 w-4 text-info" />
            </div>
            Content Pipeline
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {contentItems.length} items
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          {contentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No content items yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contentItems.map((item) => {
                const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.draft;
                const StatusIcon = status.icon;
                const priority = item.priority as keyof typeof priorityConfig || 'medium';

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-border bg-card/50 hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          by {item.author_name || 'Unknown'}
                        </p>
                      </div>
                      <Badge variant="outline" className={priorityConfig[priority] || priorityConfig.medium}>
                        {priority}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${status.bgColor}`}>
                        <StatusIcon className={`h-3 w-3 ${status.color}`} />
                        <span className={`text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      {item.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(item.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
