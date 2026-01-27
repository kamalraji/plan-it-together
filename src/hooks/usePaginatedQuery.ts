import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

interface UsePaginatedQueryOptions<T> {
  queryKey: readonly unknown[];
  queryFn: (range: { from: number; to: number }) => Promise<{ data: T[]; count: number }>;
  pageSize?: number;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
}

/**
 * Reusable hook for paginated Supabase queries
 * Uses range-based pagination for efficient data fetching
 */
export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  pageSize = 20,
  enabled = true,
  staleTime,
  gcTime,
}: UsePaginatedQueryOptions<T>): PaginatedResult<T> {
  const [page, setPage] = useState(0);

  const query = useQuery({
    queryKey: [...queryKey, 'page', page, 'size', pageSize],
    queryFn: () =>
      queryFn({
        from: page * pageSize,
        to: (page + 1) * pageSize - 1,
      }),
    enabled,
    staleTime,
    gcTime,
  });

  const totalCount = query.data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(0, Math.min(newPage, totalPages - 1)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setPage((p) => Math.max(0, p - 1));
  }, []);

  return {
    data: query.data?.data ?? [],
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: (page + 1) * pageSize < totalCount,
    hasPreviousPage: page > 0,
    goToPage,
    nextPage,
    previousPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
