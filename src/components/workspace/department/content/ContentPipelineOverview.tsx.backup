import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Edit3,
  Eye,
  Send
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: 'article' | 'presentation' | 'video' | 'document';
  status: 'draft' | 'review' | 'approved' | 'published';
  author: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

const mockContentPipeline: ContentItem[] = [
  {
    id: '1',
    title: 'Opening Ceremony Script',
    type: 'document',
    status: 'approved',
    author: 'Sarah Chen',
    dueDate: '2024-01-15',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Keynote Speaker Introduction',
    type: 'presentation',
    status: 'review',
    author: 'Mike Johnson',
    dueDate: '2024-01-16',
    priority: 'high',
  },
  {
    id: '3',
    title: 'Event Recap Blog Post',
    type: 'article',
    status: 'draft',
    author: 'Emily Davis',
    dueDate: '2024-01-20',
    priority: 'medium',
  },
  {
    id: '4',
    title: 'Promo Video Storyboard',
    type: 'video',
    status: 'review',
    author: 'Alex Wong',
    dueDate: '2024-01-18',
    priority: 'high',
  },
  {
    id: '5',
    title: 'Sponsor Acknowledgments',
    type: 'document',
    status: 'approved',
    author: 'James Lee',
    dueDate: '2024-01-14',
    priority: 'medium',
  },
];

const statusConfig = {
  draft: { icon: Edit3, label: 'Draft', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  review: { icon: Eye, label: 'In Review', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  approved: { icon: CheckCircle, label: 'Approved', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  published: { icon: Send, label: 'Published', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
};

const priorityConfig = {
  low: 'bg-slate-500/10 text-slate-500',
  medium: 'bg-amber-500/10 text-amber-500',
  high: 'bg-red-500/10 text-red-500',
};

export function ContentPipelineOverview() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            Content Pipeline
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {mockContentPipeline.length} items
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          <div className="space-y-3">
            {mockContentPipeline.map((item) => {
              const status = statusConfig[item.status];
              const StatusIcon = status.icon;

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
                        by {item.author}
                      </p>
                    </div>
                    <Badge variant="outline" className={priorityConfig[item.priority]}>
                      {item.priority}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${status.bgColor}`}>
                      <StatusIcon className={`h-3 w-3 ${status.color}`} />
                      <span className={`text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(item.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
