import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type WorkspaceRubricInsert = Database['public']['Tables']['workspace_rubrics']['Insert'];

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  weight: number;
}

export interface ScoringRubric {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  criteria: RubricCriterion[];
  isActive: boolean;
  maxTotalScore: number | null;
  createdAt: string | null;
  createdBy: string | null;
}

export interface RubricFormData {
  name: string;
  description?: string;
  category?: string;
  criteria: RubricCriterion[];
  isActive?: boolean;
}

export function useScoringRubrics(workspaceId: string) {
  const queryClient = useQueryClient();

  // Fetch all rubrics for workspace
  const rubricsQuery = useQuery({
    queryKey: ['scoring-rubrics', workspaceId],
    queryFn: async (): Promise<ScoringRubric[]> => {
      const { data, error } = await supabase
        .from('workspace_rubrics')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(rubric => ({
        id: rubric.id,
        name: rubric.name,
        description: rubric.description,
        category: rubric.category,
        criteria: parseCriteria(rubric.criteria),
        isActive: rubric.is_active ?? true,
        maxTotalScore: rubric.max_total_score,
        createdAt: rubric.created_at,
        createdBy: rubric.created_by,
      }));
    },
    enabled: !!workspaceId,
  });

  // Get active rubrics only
  const activeRubrics = rubricsQuery.data?.filter(r => r.isActive) || [];

  // Create rubric
  const createRubric = useMutation({
    mutationFn: async (data: RubricFormData) => {
      const totalWeight = data.criteria.reduce((sum, c) => sum + c.weight, 0);
      const maxScore = data.criteria.reduce((sum, c) => sum + c.maxScore, 0);

      if (totalWeight !== 100) {
        throw new Error('Criteria weights must sum to 100%');
      }

      const insertData: WorkspaceRubricInsert = {
        workspace_id: workspaceId,
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        criteria: JSON.parse(JSON.stringify(data.criteria)),
        is_active: data.isActive ?? true,
        max_total_score: maxScore,
      };

      const { error } = await supabase
        .from('workspace_rubrics')
        .insert([insertData]);

      if (error) throw error;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['scoring-rubrics', workspaceId] });
      const previous = queryClient.getQueryData<ScoringRubric[]>(['scoring-rubrics', workspaceId]);

      const optimisticRubric: ScoringRubric = {
        id: `temp-${Date.now()}`,
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        criteria: data.criteria,
        isActive: data.isActive ?? true,
        maxTotalScore: data.criteria.reduce((sum, c) => sum + c.maxScore, 0),
        createdAt: new Date().toISOString(),
        createdBy: null,
      };

      queryClient.setQueryData<ScoringRubric[]>(['scoring-rubrics', workspaceId], old => 
        [optimisticRubric, ...(old || [])]
      );

      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['scoring-rubrics', workspaceId], context.previous);
      }
      toast.error(error instanceof Error ? error.message : 'Failed to create rubric');
    },
    onSuccess: () => {
      toast.success('Rubric created successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-rubrics', workspaceId] });
    },
  });

  // Update rubric
  const updateRubric = useMutation({
    mutationFn: async ({ rubricId, data }: { rubricId: string; data: Partial<RubricFormData> }) => {
      const updateData: Record<string, unknown> = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;
      if (data.criteria !== undefined) {
        updateData.criteria = data.criteria;
        updateData.max_total_score = data.criteria.reduce((sum, c) => sum + c.maxScore, 0);
      }

      const { error } = await supabase
        .from('workspace_rubrics')
        .update(updateData)
        .eq('id', rubricId);

      if (error) throw error;
    },
    onMutate: async ({ rubricId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['scoring-rubrics', workspaceId] });
      const previous = queryClient.getQueryData<ScoringRubric[]>(['scoring-rubrics', workspaceId]);

      queryClient.setQueryData<ScoringRubric[]>(['scoring-rubrics', workspaceId], old => 
        (old || []).map(rubric => 
          rubric.id === rubricId
            ? {
                ...rubric,
                ...(data.name !== undefined && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.category !== undefined && { category: data.category }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                ...(data.criteria !== undefined && { 
                  criteria: data.criteria,
                  maxTotalScore: data.criteria.reduce((sum, c) => sum + c.maxScore, 0),
                }),
              }
            : rubric
        )
      );

      return { previous };
    },
    onError: (_error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['scoring-rubrics', workspaceId], context.previous);
      }
      toast.error('Failed to update rubric');
    },
    onSuccess: () => {
      toast.success('Rubric updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-rubrics', workspaceId] });
    },
  });

  // Delete rubric
  const deleteRubric = useMutation({
    mutationFn: async (rubricId: string) => {
      const { error } = await supabase
        .from('workspace_rubrics')
        .delete()
        .eq('id', rubricId);

      if (error) throw error;
    },
    onMutate: async (rubricId) => {
      await queryClient.cancelQueries({ queryKey: ['scoring-rubrics', workspaceId] });
      const previous = queryClient.getQueryData<ScoringRubric[]>(['scoring-rubrics', workspaceId]);

      queryClient.setQueryData<ScoringRubric[]>(['scoring-rubrics', workspaceId], old => 
        (old || []).filter(rubric => rubric.id !== rubricId)
      );

      return { previous };
    },
    onError: (_error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['scoring-rubrics', workspaceId], context.previous);
      }
      toast.error('Failed to delete rubric');
    },
    onSuccess: () => {
      toast.success('Rubric deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-rubrics', workspaceId] });
    },
  });

  // Toggle rubric active status
  const toggleActive = useMutation({
    mutationFn: async ({ rubricId, isActive }: { rubricId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('workspace_rubrics')
        .update({ is_active: isActive })
        .eq('id', rubricId);

      if (error) throw error;
    },
    onMutate: async ({ rubricId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['scoring-rubrics', workspaceId] });
      const previous = queryClient.getQueryData<ScoringRubric[]>(['scoring-rubrics', workspaceId]);

      queryClient.setQueryData<ScoringRubric[]>(['scoring-rubrics', workspaceId], old => 
        (old || []).map(rubric => 
          rubric.id === rubricId ? { ...rubric, isActive } : rubric
        )
      );

      return { previous };
    },
    onError: (_error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['scoring-rubrics', workspaceId], context.previous);
      }
      toast.error('Failed to update rubric status');
    },
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'Rubric activated' : 'Rubric deactivated');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-rubrics', workspaceId] });
    },
  });

  // Duplicate rubric
  const duplicateRubric = useMutation({
    mutationFn: async (rubricId: string) => {
      const rubric = rubricsQuery.data?.find(r => r.id === rubricId);
      if (!rubric) throw new Error('Rubric not found');

      const insertData: WorkspaceRubricInsert = {
        workspace_id: workspaceId,
        name: `${rubric.name} (Copy)`,
        description: rubric.description,
        category: rubric.category,
        criteria: JSON.parse(JSON.stringify(rubric.criteria)),
        is_active: false,
        max_total_score: rubric.maxTotalScore,
      };

      const { error } = await supabase
        .from('workspace_rubrics')
        .insert([insertData]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Rubric duplicated');
      queryClient.invalidateQueries({ queryKey: ['scoring-rubrics', workspaceId] });
    },
    onError: (_error) => {
      toast.error('Failed to duplicate rubric');
    },
  });

  return {
    rubrics: rubricsQuery.data || [],
    activeRubrics,
    isLoading: rubricsQuery.isLoading,
    createRubric,
    updateRubric,
    deleteRubric,
    toggleActive,
    duplicateRubric,
  };
}

// Helper to parse criteria from JSON
function parseCriteria(criteria: unknown): RubricCriterion[] {
  if (!criteria || !Array.isArray(criteria)) return [];
  
  return criteria.map((c: unknown, index) => {
    const criterion = c as Record<string, unknown>;
    return {
      id: (criterion.id as string) || `criterion-${index}`,
      name: (criterion.name as string) || 'Unnamed Criterion',
      description: (criterion.description as string) || '',
      maxScore: (criterion.maxScore as number) || (criterion.max_score as number) || 10,
      weight: (criterion.weight as number) || 0,
    };
  });
}
