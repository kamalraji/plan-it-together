import { useState, useEffect, useCallback } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSemanticSearch, SearchResult } from '@/hooks/useSemanticSearch';
import {
  CheckSquare,
  MessageSquare,
  User,
  Clock,
  Search,
  ArrowRight,
  FileText,
  Hash,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UnifiedSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onSelectResult?: (result: SearchResult) => void;
}

export function UnifiedSearchDialog({
  open,
  onOpenChange,
  workspaceId,
  onSelectResult,
}: UnifiedSearchDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const { results, groupedResults, isSearching, performSearch, clearSearch } = useSemanticSearch({
    workspaceId,
    types: ['task', 'message', 'member'],
    limit: 30,
  });

  // Perform search when input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.trim().length >= 2) {
        performSearch(inputValue);
      } else {
        clearSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, performSearch, clearSearch]);

  // Clear on close
  useEffect(() => {
    if (!open) {
      setInputValue('');
      clearSearch();
    }
  }, [open, clearSearch]);

  const handleSelect = useCallback((result: SearchResult) => {
    onSelectResult?.(result);
    onOpenChange(false);
  }, [onSelectResult, onOpenChange]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="h-4 w-4 text-primary" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-info" />;
      case 'member':
        return <User className="h-4 w-4 text-success" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const tasks = groupedResults.tasks || [];
  const messages = groupedResults.messages || [];
  const members = groupedResults.members || [];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center border-b px-3">
        <Search className="h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="Search tasks, messages, members..."
          value={inputValue}
          onValueChange={setInputValue}
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
        {isSearching && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>
      <CommandList className="max-h-[400px]">
        {inputValue.length < 2 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search...
          </div>
        ) : results.length === 0 && !isSearching ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          <>
            {/* Tasks */}
            {tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {tasks.slice(0, 5).map((task) => (
                  <CommandItem
                    key={`task-${task.id}`}
                    value={`task-${task.id}-${task.title}`}
                    onSelect={() => handleSelect(task)}
                    className="flex items-center gap-3 py-3"
                  >
                    {getResultIcon('task')}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      {task.content && (
                        <p className="text-xs text-muted-foreground truncate">
                          {task.content.slice(0, 80)}...
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {task.priority && (
                        <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                          {task.priority}
                        </Badge>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                ))}
                {tasks.length > 5 && (
                  <div className="px-4 py-2 text-xs text-muted-foreground">
                    +{tasks.length - 5} more tasks
                  </div>
                )}
              </CommandGroup>
            )}

            {tasks.length > 0 && messages.length > 0 && <CommandSeparator />}

            {/* Messages */}
            {messages.length > 0 && (
              <CommandGroup heading="Messages">
                {messages.slice(0, 5).map((msg) => (
                  <CommandItem
                    key={`message-${msg.id}`}
                    value={`message-${msg.id}-${msg.content}`}
                    onSelect={() => handleSelect(msg)}
                    className="flex items-center gap-3 py-3"
                  >
                    {getResultIcon('message')}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{msg.content?.slice(0, 100)}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{msg.sender_name}</span>
                        {msg.channel_name && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {msg.channel_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {msg.created_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(tasks.length > 0 || messages.length > 0) && members.length > 0 && <CommandSeparator />}

            {/* Members */}
            {members.length > 0 && (
              <CommandGroup heading="Members">
                {members.slice(0, 5).map((member) => (
                  <CommandItem
                    key={`member-${member.id}`}
                    value={`member-${member.id}-${member.full_name}`}
                    onSelect={() => handleSelect(member)}
                    className="flex items-center gap-3 py-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>
                        {member.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {member.role?.replace('_', ' ')}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
