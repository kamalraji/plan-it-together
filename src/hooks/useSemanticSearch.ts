import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/common';

export type SearchResultType = 'task' | 'message' | 'member' | 'file';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title?: string;
  content?: string | null;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  status?: string;
  priority?: string;
  due_date?: string | null;
  channel_name?: string;
  channel_id?: string;
  sender_name?: string;
  created_at?: string;
  matchField?: string;
  role?: string;
}

interface SearchResponse {
  results: SearchResult[];
  grouped: Record<string, SearchResult[]>;
  query: string;
  total: number;
}

interface UseSemanticSearchOptions {
  workspaceId: string;
  types?: SearchResultType[];
  limit?: number;
  debounceMs?: number;
}

export function useSemanticSearch({
  workspaceId,
  types = ['task', 'message', 'member'],
  limit = 20,
  debounceMs = 300,
}: UseSemanticSearchOptions) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [groupedResults, setGroupedResults] = useState<Record<string, SearchResult[]>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, debounceMs);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      setGroupedResults({});
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('semantic-search', {
        body: {
          query: searchQuery,
          workspaceId,
          types: types.map(t => t === 'task' ? 'tasks' : t === 'message' ? 'messages' : t === 'member' ? 'members' : 'files'),
          limit,
        },
      });

      if (fnError) throw fnError;

      const response = data as SearchResponse;
      setResults(response.results);
      setGroupedResults(response.grouped);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
      
      // Fallback to local search for tasks
      try {
        const { data: tasks } = await supabase
          .from('workspace_tasks')
          .select('id, title, description, status, priority, due_date')
          .eq('workspace_id', workspaceId)
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(limit);

        if (tasks) {
          const localResults: SearchResult[] = tasks.map(t => ({
            id: t.id,
            type: 'task' as const,
            title: t.title,
            content: t.description,
            status: t.status,
            priority: t.priority,
            due_date: t.due_date,
          }));
          setResults(localResults);
          setGroupedResults({ tasks: localResults });
          setError(null);
        }
      } catch {
        // Keep the original error
      }
    } finally {
      setIsSearching(false);
    }
  }, [workspaceId, types, limit]);

  // Auto-search on debounced query change
  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  // Trigger search when debounced query changes
  useState(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    }
  });

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setGroupedResults({});
    setError(null);
  }, []);

  return {
    query,
    search,
    results,
    groupedResults,
    isSearching,
    error,
    clearSearch,
    performSearch,
  };
}
