import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, FileText, Users, CheckSquare, Folder, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Workspace } from '@/types';

interface MobileWorkspaceSearchProps {
  workspace: Workspace;
  onResultClick?: (type: string, id: string) => void;
}

interface SearchResult {
  id: string;
  type: 'task' | 'member' | 'document' | 'child_workspace';
  title: string;
  subtitle?: string;
  icon: typeof FileText;
}

export function MobileWorkspaceSearch({ workspace, onResultClick }: MobileWorkspaceSearchProps) {
  const [query, setQuery] = useState('');

  // Fetch searchable data
  const { data: tasks } = useQuery({
    queryKey: ['workspace-tasks-search', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, title, status')
        .eq('workspace_id', workspace.id)
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30000,
  });

  const { data: childWorkspaces } = useQuery({
    queryKey: ['child-workspaces-search', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, workspace_type')
        .eq('parent_workspace_id', workspace.id)
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30000,
  });

  // Build search results
  const searchResults = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search tasks
    tasks?.forEach((task) => {
      if (task.title?.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: task.id,
          type: 'task',
          title: task.title,
          subtitle: task.status,
          icon: CheckSquare,
        });
      }
    });

    // Search team members
    workspace.teamMembers?.forEach((member) => {
      const name = member.user?.name || member.user?.email || '';
      if (name.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: member.userId,
          type: 'member',
          title: name,
          subtitle: member.role,
          icon: Users,
        });
      }
    });

    // Search child workspaces
    childWorkspaces?.forEach((ws) => {
      if (ws.name?.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: ws.id,
          type: 'child_workspace',
          title: ws.name,
          subtitle: ws.workspace_type ?? undefined,
          icon: Folder,
        });
      }
    });

    return results.slice(0, 20); // Limit to 20 results
  }, [query, tasks, workspace.teamMembers, childWorkspaces]);

  const recentSearches = ['tasks', 'meetings', 'budget', 'team'];

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search tasks, members, workspaces..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 h-12 text-base bg-card border-border"
          aria-label="Search workspace"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {query.trim() ? (
        <div className="space-y-2">
          {searchResults.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground px-1">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-1">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => onResultClick?.(result.type, result.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <result.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize px-2 py-1 bg-muted rounded">
                      {result.type.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No results found for "{query}"</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      ) : (
        /* Recent Searches / Suggestions */
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">Quick filters</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground hover:bg-muted/80 transition-colors capitalize"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">Browse by type</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setQuery('task:')}
                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
              >
                <CheckSquare className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Tasks</span>
              </button>
              <button
                onClick={() => setQuery('member:')}
                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
              >
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Members</span>
              </button>
              <button
                onClick={() => setQuery('workspace:')}
                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
              >
                <Folder className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Workspaces</span>
              </button>
              <button
                onClick={() => setQuery('doc:')}
                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
              >
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Documents</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
