import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GitBranch, 
  FileEdit, 
  Eye, 
  Clock, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface PipelineItem {
  id: string;
  title: string;
  type: 'post' | 'article' | 'campaign';
  stage: 'draft' | 'review' | 'approved' | 'scheduled' | 'published';
  assignee?: string;
}

export function PublicationPipeline() {
  const stages = [
    { id: 'draft', label: 'Draft', icon: FileEdit, color: 'text-muted-foreground' },
    { id: 'review', label: 'Review', icon: Eye, color: 'text-amber-500' },
    { id: 'approved', label: 'Approved', icon: CheckCircle2, color: 'text-blue-500' },
    { id: 'scheduled', label: 'Scheduled', icon: Clock, color: 'text-purple-500' },
    { id: 'published', label: 'Published', icon: CheckCircle2, color: 'text-emerald-500' },
  ];

  const items: PipelineItem[] = [
    { id: '1', title: 'Event Teaser Video', type: 'post', stage: 'review', assignee: 'Sarah' },
    { id: '2', title: 'Speaker Announcement', type: 'post', stage: 'draft', assignee: 'Mike' },
    { id: '3', title: 'Registration Guide', type: 'article', stage: 'approved', assignee: 'Emily' },
    { id: '4', title: 'Week 1 Campaign', type: 'campaign', stage: 'scheduled', assignee: 'John' },
    { id: '5', title: 'Opening Day Post', type: 'post', stage: 'scheduled', assignee: 'Sarah' },
    { id: '6', title: 'Welcome Blog', type: 'article', stage: 'published', assignee: 'Emily' },
  ];

  const getItemsByStage = (stageId: string) => items.filter(item => item.stage === stageId);

  const getTypeBadge = (type: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      post: { color: 'bg-sky-500/10 text-sky-600', label: 'Post' },
      article: { color: 'bg-purple-500/10 text-purple-600', label: 'Article' },
      campaign: { color: 'bg-orange-500/10 text-orange-600', label: 'Campaign' },
    };
    return configs[type] || configs.post;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitBranch className="h-5 w-5 text-primary" />
          Publication Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {stages.map((stage, index) => {
            const stageItems = getItemsByStage(stage.id);
            
            return (
              <div key={stage.id} className="flex items-start gap-2">
                <div className="min-w-[180px] flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-muted/50">
                    <stage.icon className={`h-4 w-4 ${stage.color}`} />
                    <span className="text-sm font-medium">{stage.label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {stageItems.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 min-h-[100px]">
                    {stageItems.map((item) => {
                      const typeConfig = getTypeBadge(item.type);
                      
                      return (
                        <div
                          key={item.id}
                          className="p-2 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <p className="text-sm font-medium truncate mb-1">{item.title}</p>
                          <div className="flex items-center justify-between">
                            <Badge className={`${typeConfig.color} text-[10px]`}>
                              {typeConfig.label}
                            </Badge>
                            {item.assignee && (
                              <span className="text-[10px] text-muted-foreground">
                                {item.assignee}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {stageItems.length === 0 && (
                      <div className="flex items-center justify-center h-[60px] border border-dashed border-border/50 rounded-lg text-xs text-muted-foreground">
                        No items
                      </div>
                    )}
                  </div>
                </div>
                
                {index < stages.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-3 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
