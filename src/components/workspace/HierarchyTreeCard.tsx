import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WorkspaceHierarchyTree } from './WorkspaceHierarchyTree';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface HierarchyTreeCardProps {
  eventId: string;
  currentWorkspaceId?: string;
  onWorkspaceSelect?: (workspaceId: string) => void;
  className?: string;
}

export function HierarchyTreeCard({
  eventId,
  currentWorkspaceId,
  onWorkspaceSelect,
  className,
}: HierarchyTreeCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className={cn('border-border/70 bg-card/80 shadow-sm', className)}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Squares2X2Icon className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-medium text-foreground">
            Workspace Hierarchy
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            4 Levels
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          <WorkspaceHierarchyTree
            eventId={eventId}
            currentWorkspaceId={currentWorkspaceId}
            onWorkspaceSelect={onWorkspaceSelect}
          />
        </CardContent>
      )}
    </Card>
  );
}
