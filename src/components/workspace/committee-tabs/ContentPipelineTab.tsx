import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Loader2,
  ArrowLeft,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  ContentItem, 
  ContentItemStatus, 
  useContentItems, 
  useUpdateContentItemStatus 
} from '@/hooks/useContentDepartmentData';
import { Workspace } from '@/types';

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

interface ContentPipelineTabProps {
  workspace: Workspace;
  onBack?: () => void;
}

export function ContentPipelineTab({ workspace, onBack }: ContentPipelineTabProps) {
  const { data: contentItems = [], isLoading } = useContentItems(workspace.id);
  const updateStatus = useUpdateContentItemStatus(workspace.id);
  const [draggedItem, setDraggedItem] = useState<ContentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);

  const filteredItems = contentItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = !filterPriority || item.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const getItemsByStatus = (status: ContentItemStatus) => {
    return filteredItems.filter(item => item.status === status);
  };

  const handleDragEnd = (item: ContentItem, newStatus: ContentItemStatus) => {
    if (item.status !== newStatus) {
      updateStatus.mutate({ itemId: item.id, status: newStatus });
    }
    setDraggedItem(null);
  };

  const getStageStats = () => {
    return statusColumns.map(column => ({
      ...column,
      count: contentItems.filter(item => item.status === column.id).length,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-500" />
              Content Pipeline
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Drag and drop content items between stages to update their status
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {contentItems.length} total items
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {getStageStats().map(stage => {
          const Icon = stage.icon;
          return (
            <Card key={stage.id} className={`${stage.bgColor} border-none`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${stage.color}`}>{stage.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stage.count}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stage.color} opacity-50`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1">
            {['low', 'medium', 'high'].map(priority => (
              <Button
                key={priority}
                size="sm"
                variant={filterPriority === priority ? 'default' : 'outline'}
                onClick={() => setFilterPriority(filterPriority === priority ? null : priority)}
                className="capitalize"
              >
                {priority}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline Board */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <GripVertical className="h-4 w-4 text-blue-500" />
            </div>
            Drag & Drop Pipeline
          </CardTitle>
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
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                  }}
                  onDrop={(e) => {
                    e.currentTarget.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                    if (draggedItem) {
                      handleDragEnd(draggedItem, column.id);
                    }
                  }}
                >
                  {/* Column Header */}
                  <div className={`flex items-center gap-2 p-3 rounded-t-lg ${column.bgColor} border-b border-border`}>
                    <Icon className={`h-4 w-4 ${column.color}`} />
                    <span className={`text-sm font-medium ${column.color}`}>{column.label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {items.length}
                    </Badge>
                  </div>

                  {/* Column Content */}
                  <ScrollArea className="h-[400px] border border-t-0 border-border rounded-b-lg bg-accent/20">
                    <div className="p-3 space-y-3">
                      {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                          <Icon className={`h-8 w-8 ${column.color} opacity-30 mb-2`} />
                          <p className="text-xs text-muted-foreground">
                            Drop items here
                          </p>
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
                            className={`p-3 rounded-lg border border-border bg-card cursor-grab active:cursor-grabbing hover:shadow-lg transition-all ${
                              draggedItem?.id === item.id ? 'opacity-50 scale-95' : ''
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
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[10px] px-1.5 py-0 ${priorityConfig[item.priority]}`}
                                  >
                                    {item.priority}
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {item.type}
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
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No content items yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first content item to start managing your pipeline
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Content
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
