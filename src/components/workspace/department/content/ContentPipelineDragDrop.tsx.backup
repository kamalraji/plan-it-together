import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Edit3,
  Eye,
  Send,
  GripVertical,
  Plus,
  Loader2
} from 'lucide-react';
import { 
  ContentItem, 
  ContentItemStatus, 
  useContentItems, 
  useUpdateContentItemStatus 
} from '@/hooks/useContentDepartmentData';

const statusColumns: { id: ContentItemStatus; label: string; icon: React.ElementType; color: string; bgColor: string }[] = [
  { id: 'draft', label: 'Draft', icon: Edit3, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  { id: 'review', label: 'In Review', icon: Eye, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { id: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { id: 'published', label: 'Published', icon: Send, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
];

const priorityConfig = {
  low: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
};

interface ContentPipelineDragDropProps {
  workspaceId: string;
  onCreateContent?: () => void;
}

export function ContentPipelineDragDrop({ workspaceId, onCreateContent }: ContentPipelineDragDropProps) {
  const { data: contentItems = [], isLoading } = useContentItems(workspaceId);
  const updateStatus = useUpdateContentItemStatus(workspaceId);
  const [draggedItem, setDraggedItem] = useState<ContentItem | null>(null);

  const getItemsByStatus = (status: ContentItemStatus) => {
    return contentItems.filter(item => item.status === status);
  };

  const handleDragEnd = (item: ContentItem, newStatus: ContentItemStatus) => {
    if (item.status !== newStatus) {
      updateStatus.mutate({ itemId: item.id, status: newStatus });
    }
    setDraggedItem(null);
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
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
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            Content Pipeline
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {contentItems.length} items
            </Badge>
            {onCreateContent && (
              <Button size="sm" variant="outline" onClick={onCreateContent}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map((column) => {
            const Icon = column.icon;
            const items = getItemsByStatus(column.id);

            return (
              <div
                key={column.id}
                className="flex flex-col"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedItem) {
                    handleDragEnd(draggedItem, column.id);
                  }
                }}
              >
                {/* Column Header */}
                <div className={`flex items-center gap-2 p-2 rounded-t-lg ${column.bgColor} border-b border-border`}>
                  <Icon className={`h-4 w-4 ${column.color}`} />
                  <span className={`text-sm font-medium ${column.color}`}>{column.label}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {items.length}
                  </Badge>
                </div>

                {/* Column Content */}
                <ScrollArea className="h-[280px] border border-t-0 border-border rounded-b-lg bg-accent/20">
                  <div className="p-2 space-y-2">
                    {items.length === 0 ? (
                      <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                        No items
                      </div>
                    ) : (
                      items.map((item) => (
                        <motion.div
                          key={item.id}
                          draggable
                          onDragStart={() => setDraggedItem(item)}
                          onDragEnd={() => setDraggedItem(null)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 rounded-lg border border-border bg-card cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                            draggedItem?.id === item.id ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-foreground truncate">
                                {item.title}
                              </h4>
                              {item.author_name && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  by {item.author_name}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-[10px] px-1.5 py-0 ${priorityConfig[item.priority]}`}
                                >
                                  {item.priority}
                                </Badge>
                                {item.due_date && (
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {new Date(item.due_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>

        {contentItems.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No content items yet</p>
            {onCreateContent && (
              <Button size="sm" onClick={onCreateContent}>
                <Plus className="h-4 w-4 mr-1" />
                Create First Content
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
