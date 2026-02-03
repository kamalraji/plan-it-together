import { useState, useEffect } from 'react';
import { Clock, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecentSearch {
  query: string;
  timestamp: number;
}

interface RecentSearchesProps {
  workspaceId: string;
  onSelectSearch: (query: string) => void;
  maxItems?: number;
}

const STORAGE_KEY = 'workspace-recent-searches';

export function useRecentSearches(workspaceId: string) {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}-${workspaceId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as RecentSearch[];
        // Filter out old searches (older than 7 days)
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        setRecentSearches(parsed.filter(s => s.timestamp > weekAgo));
      } catch {
        setRecentSearches([]);
      }
    }
  }, [workspaceId]);

  // Save to localStorage
  const saveSearch = (query: string) => {
    if (!query.trim() || query.length < 2) return;

    setRecentSearches(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(s => s.query.toLowerCase() !== query.toLowerCase());
      const updated = [{ query, timestamp: Date.now() }, ...filtered].slice(0, 10);
      localStorage.setItem(`${STORAGE_KEY}-${workspaceId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const removeSearch = (query: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s.query !== query);
      localStorage.setItem(`${STORAGE_KEY}-${workspaceId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const clearAll = () => {
    setRecentSearches([]);
    localStorage.removeItem(`${STORAGE_KEY}-${workspaceId}`);
  };

  return { recentSearches, saveSearch, removeSearch, clearAll };
}

export function RecentSearches({
  workspaceId,
  onSelectSearch,
  maxItems = 5,
}: RecentSearchesProps) {
  const { recentSearches, removeSearch, clearAll } = useRecentSearches(workspaceId);

  if (recentSearches.length === 0) {
    return (
      <div className="py-8 text-center">
        <Search className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No recent searches</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Your search history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Recent Searches
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-6 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      </div>
      <div className="space-y-1">
        {recentSearches.slice(0, maxItems).map((search) => (
          <div
            key={search.query}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 group cursor-pointer"
            onClick={() => onSelectSearch(search.query)}
          >
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="flex-1 text-sm truncate">{search.query}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                removeSearch(search.query);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
