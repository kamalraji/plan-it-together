import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchResult } from '@/hooks/useSemanticSearch';
import {
  CheckSquare,
  MessageSquare,
  User,
  Clock,
  Hash,
  ArrowUpRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SearchResultsPanelProps {
  results: SearchResult[];
  groupedResults: Record<string, SearchResult[]>;
  query: string;
  isLoading?: boolean;
  onSelectResult?: (result: SearchResult) => void;
}

export function SearchResultsPanel({
  results,
  groupedResults,
  query,
  isLoading,
  onSelectResult,
}: SearchResultsPanelProps) {
  const tasks = groupedResults.tasks || [];
  const messages = groupedResults.messages || [];
  const members = groupedResults.members || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Searching...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground">
              No results found for "{query}"
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try different keywords or check your spelling
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Search Results
          </CardTitle>
          <Badge variant="secondary">{results.length} results</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Showing results for "{query}"
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({results.length})</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="messages">Messages ({messages.length})</TabsTrigger>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="all" className="space-y-2 mt-0">
              {results.map((result) => (
                <ResultItem key={`${result.type}-${result.id}`} result={result} onSelect={onSelectResult} />
              ))}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-2 mt-0">
              {tasks.map((task) => (
                <ResultItem key={`task-${task.id}`} result={task} onSelect={onSelectResult} />
              ))}
            </TabsContent>

            <TabsContent value="messages" className="space-y-2 mt-0">
              {messages.map((msg) => (
                <ResultItem key={`message-${msg.id}`} result={msg} onSelect={onSelectResult} />
              ))}
            </TabsContent>

            <TabsContent value="members" className="space-y-2 mt-0">
              {members.map((member) => (
                <ResultItem key={`member-${member.id}`} result={member} onSelect={onSelectResult} />
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ResultItem({
  result,
  onSelect,
}: {
  result: SearchResult;
  onSelect?: (result: SearchResult) => void;
}) {
  const getIcon = () => {
    switch (result.type) {
      case 'task':
        return <CheckSquare className="h-4 w-4 text-primary" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-info" />;
      case 'member':
        return <User className="h-4 w-4 text-success" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'DONE':
        return 'text-success bg-success/20';
      case 'IN_PROGRESS':
        return 'text-info bg-info/20';
      case 'BLOCKED':
        return 'text-destructive bg-destructive/20';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors group"
      onClick={() => onSelect?.(result)}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        {result.type === 'task' && (
          <>
            <p className="font-medium truncate">{result.title}</p>
            {result.content && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {result.content.slice(0, 100)}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {result.status && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(result.status)}`}>
                  {result.status.replace('_', ' ')}
                </span>
              )}
              {result.due_date && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(result.due_date), { addSuffix: true })}
                </span>
              )}
            </div>
          </>
        )}

        {result.type === 'message' && (
          <>
            <p className="text-sm">{result.content?.slice(0, 150)}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{result.sender_name}</span>
              {result.channel_name && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {result.channel_name}
                  </span>
                </>
              )}
              {result.created_at && (
                <>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}</span>
                </>
              )}
            </div>
          </>
        )}

        {result.type === 'member' && (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={result.avatar_url} />
              <AvatarFallback>{result.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{result.full_name}</p>
              <p className="text-sm text-muted-foreground">{result.email}</p>
            </div>
          </div>
        )}
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
