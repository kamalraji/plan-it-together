import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Hash, 
  ChevronDown, 
  ChevronRight, 
  Megaphone, 
  Lock, 
  Users,
  Plus,
  Settings
} from 'lucide-react';
import { WorkspaceChannel } from '@/hooks/useWorkspaceChannels';

interface ChannelCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number | null;
  is_collapsed: boolean | null;
}

interface ChannelCategoryManagerProps {
  workspaceId: string;
  channels: WorkspaceChannel[];
  categories: ChannelCategory[];
  onChannelSelect?: (channel: WorkspaceChannel) => void;
}

const typeIcons = {
  announcement: Megaphone,
  general: Hash,
  private: Lock,
  task: Hash,
};

const typeColors = {
  announcement: 'text-amber-500 bg-amber-500/10',
  general: 'text-primary bg-primary/10',
  private: 'text-purple-500 bg-purple-500/10',
  task: 'text-emerald-500 bg-emerald-500/10',
};

export function ChannelCategoryManager({
  channels,
  categories,
  onChannelSelect,
}: ChannelCategoryManagerProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Group channels by category
  const channelsByCategory = new Map<string | null, WorkspaceChannel[]>();
  
  // Initialize categories
  categories.forEach(cat => {
    channelsByCategory.set(cat.id, []);
  });
  channelsByCategory.set(null, []); // Uncategorized
  
  // Distribute channels
  channels.forEach(channel => {
    const categoryId = (channel as unknown as { category_id?: string }).category_id || null;
    const existing = channelsByCategory.get(categoryId) || [];
    channelsByCategory.set(categoryId, [...existing, channel]);
  });

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const renderChannel = (channel: WorkspaceChannel) => {
    const Icon = typeIcons[channel.type as keyof typeof typeIcons] || Hash;
    const colorClass = typeColors[channel.type as keyof typeof typeColors] || typeColors.general;
    const isParticipant = (channel as unknown as { is_participant_channel?: boolean }).is_participant_channel;

    return (
      <div
        key={channel.id}
        onClick={() => onChannelSelect?.(channel)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 cursor-pointer group transition-colors"
      >
        <div className={`p-1 rounded ${colorClass}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm flex-1 truncate">{channel.name}</span>
        {isParticipant && (
          <Users className="h-3 w-3 text-muted-foreground" />
        )}
        {channel.is_private && (
          <Lock className="h-3 w-3 text-muted-foreground" />
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            // Open channel settings
          }}
        >
          <Settings className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  const uncategorizedChannels = channelsByCategory.get(null) || [];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Channels</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Categorized channels */}
        {categories.map(category => {
          const categoryChannels = channelsByCategory.get(category.id) || [];
          const isCollapsed = collapsedCategories.has(category.id);

          return (
            <Collapsible
              key={category.id}
              open={!isCollapsed}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left hover:text-foreground transition-colors">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {category.name}
                </span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {categoryChannels.length}
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 ml-4 space-y-0.5">
                {categoryChannels.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 pl-2">No channels</p>
                ) : (
                  categoryChannels.map(renderChannel)
                )}
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Uncategorized channels */}
        {uncategorizedChannels.length > 0 && (
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left hover:text-foreground transition-colors">
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Other
              </span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {uncategorizedChannels.length}
              </Badge>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 ml-4 space-y-0.5">
              {uncategorizedChannels.map(renderChannel)}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Empty state */}
        {channels.length === 0 && (
          <div className="text-center py-8">
            <Hash className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No channels yet</p>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Channel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
