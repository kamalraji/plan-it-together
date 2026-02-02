import { useMutation, useQueryClient, QueryKey, MutationFunction } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface OptimisticMutationOptions<TData, TVariables> {
  /** Query key to update optimistically */
  queryKey: QueryKey;
  /** Function to perform the actual mutation */
  mutationFn: MutationFunction<TData, TVariables>;
  /** Function to optimistically update the cache. Return the previous data for rollback. */
  optimisticUpdate: (variables: TVariables, previousData: TData[] | undefined) => TData[];
  /** Success message to show */
  successMessage?: string;
  /** Error message prefix */
  errorMessage?: string;
  /** Called on success after cache invalidation */
  onSuccess?: (data: TData, variables: TVariables) => void;
}

/**
 * A hook that wraps useMutation with optimistic update support.
 * Immediately updates the UI, then rolls back if the mutation fails.
 */
export function useOptimisticMutation<TData, TVariables>({
  queryKey,
  mutationFn,
  optimisticUpdate,
  successMessage,
  errorMessage = 'Operation failed',
  onSuccess,
}: OptimisticMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData[]>(queryKey);

      // Optimistically update to the new value
      if (previousData !== undefined) {
        const newData = optimisticUpdate(variables, previousData);
        queryClient.setQueryData(queryKey, newData);
      }

      // Return a context object with the snapshot
      return { previousData };
    },
    onError: (error: Error, _variables: TVariables, context: { previousData?: TData[] } | undefined) => {
      // Roll back to the previous value on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast({
        title: errorMessage,
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
    onSuccess: (data: TData, variables: TVariables) => {
      if (successMessage) {
        toast({ title: successMessage });
      }
      onSuccess?.(data, variables);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Helper to create optimistic update functions for common operations
 */
export const optimisticHelpers = {
  /** Update an item in a list by ID */
  updateInList: <T extends { id: string }>(
    list: T[] | undefined,
    id: string,
    updates: Partial<T>
  ): T[] => {
    if (!list) return [];
    return list.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
  },

  /** Remove an item from a list by ID */
  removeFromList: <T extends { id: string }>(
    list: T[] | undefined,
    id: string
  ): T[] => {
    if (!list) return [];
    return list.filter((item) => item.id !== id);
  },

  /** Add an item to the beginning of a list */
  prependToList: <T>(list: T[] | undefined, item: T): T[] => {
    return [item, ...(list || [])];
  },

  /** Add an item to the end of a list */
  appendToList: <T>(list: T[] | undefined, item: T): T[] => {
    return [...(list || []), item];
  },
};
