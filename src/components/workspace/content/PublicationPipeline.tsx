import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { 
  GitBranch, 
  FileEdit, 
  Eye, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  GripVertical,
  Send,
  Loader2
} from 'lucide-react';
import { 
  usePublicationPipeline, 
  useUpdatePipelineStage,
  PipelineItem,
  PipelineStage 
} from '@/hooks/usePublicationPipeline';

interface PublicationPipelineProps {
  workspaceId: string;
}

const stages: { 
  id: PipelineStage; 
  label: string; 
  icon: React.ElementType; 
  color: string;
  bgColor: string;
}[] = [
  { id: 'draft', label: 'Draft', icon: FileEdit, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  { id: 'review', label: 'Review', icon: Eye, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { id: 'approved', label: 'Approved', icon: CheckCircle2, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 'scheduled', label: 'Scheduled', icon: Clock, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { id: 'published', label: 'Published', icon: Send, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
];

const typeConfig: Record<string, { color: string; label: string }> = {
  article: { color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', label: 'Article' },
  presentation: { color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400', label: 'Presentation' },
  video: { color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', label: 'Video' },
  document: { color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', label: 'Document' },
};

const priorityConfig: Record<string, string> = {
  low: 'border-muted-foreground/30',
  medium: 'border-amber-500/50',
  high: 'border-red-500/50',
};

export function PublicationPipeline({ workspaceId }: PublicationPipelineProps) {
  const { data: items = [], isLoading } = usePublicationPipeline(workspaceId);
  const updateStage = useUpdatePipelineStage(workspaceId);
  const [draggedItem, setDraggedItem] = useState<PipelineItem | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const getItemsByStage = (stageId: PipelineStage) => 
    items.filter(item => item.status === stageId);

  const handleDragStart = (item: PipelineItem) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    if (draggedItem && dragOverStage && draggedItem.status !== dragOverStage) {
      updateStage.mutate({ itemId: draggedItem.id, stage: dragOverStage });
    }
    setDraggedItem(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  if (isLoading) {
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
            {stages.map((stage) => (
              <div key={stage.id} className="min-w-[180px] flex-shrink-0">
                <Skeleton className="h-10 w-full mb-2 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="h-5 w-5 text-primary" />
            Publication Pipeline
          </CardTitle>
          <div className="flex items-center gap-2">
            {updateStage.isPending && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Badge variant="secondary" className="text-xs">
              {items.length} items
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {stages.map((stage, index) => {
            const stageItems = getItemsByStage(stage.id);
            const isDropTarget = dragOverStage === stage.id && draggedItem?.status !== stage.id;
            
            return (
              <div key={stage.id} className="flex items-start gap-2">
                <div 
                  className="min-w-[180px] flex-shrink-0"
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDragEnd}
                >
                  {/* Stage Header */}
                  <div className={`flex items-center gap-2 mb-2 p-2 rounded-lg ${stage.bgColor} transition-colors ${
                    isDropTarget ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}>
                    <stage.icon className={`h-4 w-4 ${stage.color}`} />
                    <span className="text-sm font-medium">{stage.label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {stageItems.length}
                    </Badge>
                  </div>
                  
                  {/* Stage Items */}
                  <div className={`space-y-2 min-h-[100px] p-1 rounded-lg transition-colors ${
                    isDropTarget ? 'bg-primary/5' : ''
                  }`}>
                    {stageItems.map((item) => {
                      const type = typeConfig[item.type] || typeConfig.article;
                      
                      return (
                        <motion.div
                          key={item.id}
                          draggable
                          onDragStart={() => handleDragStart(item)}
                          onDragEnd={handleDragEnd}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-2 rounded-lg border bg-card hover:bg-muted/30 transition-all cursor-grab active:cursor-grabbing ${
                            priorityConfig[item.priority]
                          } ${draggedItem?.id === item.id ? 'opacity-50 scale-95' : ''}`}
                        >
                          <div className="flex items-start gap-1.5">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.title}</p>
                              <div className="flex items-center justify-between mt-1.5">
                                <Badge className={`${type.color} text-[10px] px-1.5 py-0`}>
                                  {type.label}
                                </Badge>
                                {item.author_name && (
                                  <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">
                                    {item.author_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    
                    {stageItems.length === 0 && (
                      <div className={`flex items-center justify-center h-[60px] border border-dashed rounded-lg text-xs text-muted-foreground transition-colors ${
                        isDropTarget ? 'border-primary bg-primary/5' : 'border-border/50'
                      }`}>
                        {isDropTarget ? 'Drop here' : 'No items'}
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
