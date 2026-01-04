import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Milestone {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  due_date: string | null;
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface Checklist {
  id: string;
  workspace_id: string;
  title: string;
  committee_type: string | null;
  items: ChecklistItem[];
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export function useMilestones(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const milestonesQuery = useQuery({
    queryKey: ['workspace-milestones', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_milestones')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Milestone[];
    },
    enabled: !!workspaceId,
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async (milestone: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('workspace_milestones')
        .insert(milestone)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-milestones', workspaceId] });
      toast({ title: 'Milestone created' });
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Milestone> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-milestones', workspaceId] });
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_milestones')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-milestones', workspaceId] });
      toast({ title: 'Milestone removed' });
    },
  });

  return {
    milestones: milestonesQuery.data ?? [],
    isLoading: milestonesQuery.isLoading,
    createMilestone: createMilestoneMutation.mutate,
    updateMilestone: updateMilestoneMutation.mutate,
    deleteMilestone: deleteMilestoneMutation.mutate,
  };
}

export function useGoals(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const goalsQuery = useQuery({
    queryKey: ['workspace-goals', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_goals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!workspaceId,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('workspace_goals')
        .insert(goal)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-goals', workspaceId] });
      toast({ title: 'Goal created' });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-goals', workspaceId] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-goals', workspaceId] });
      toast({ title: 'Goal removed' });
    },
  });

  return {
    goals: goalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    createGoal: createGoalMutation.mutate,
    updateGoal: updateGoalMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,
  };
}

export function useChecklists(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const checklistsQuery = useQuery({
    queryKey: ['workspace-checklists', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_checklists')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(c => ({
        ...c,
        items: (Array.isArray(c.items) ? c.items : []) as unknown as ChecklistItem[],
      })) as Checklist[];
    },
    enabled: !!workspaceId,
  });

  const createChecklistMutation = useMutation({
    mutationFn: async (checklist: Omit<Checklist, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('workspace_checklists')
        .insert({
          ...checklist,
          items: JSON.stringify(checklist.items),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-checklists', workspaceId] });
      toast({ title: 'Checklist created' });
    },
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async ({ id, items, ...updates }: Partial<Checklist> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_checklists')
        .update({
          ...updates,
          ...(items ? { items: JSON.stringify(items) } : {}),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-checklists', workspaceId] });
    },
  });

  const toggleItemMutation = useMutation({
    mutationFn: async ({
      checklistId,
      itemId,
      completed,
      userId,
    }: {
      checklistId: string;
      itemId: string;
      completed: boolean;
      userId: string;
    }) => {
      const checklist = checklistsQuery.data?.find(c => c.id === checklistId);
      if (!checklist) throw new Error('Checklist not found');

      const updatedItems = checklist.items.map(item =>
        item.id === itemId
          ? {
              ...item,
              completed,
              completedAt: completed ? new Date().toISOString() : undefined,
              completedBy: completed ? userId : undefined,
            }
          : item
      );

      const { data, error } = await supabase
        .from('workspace_checklists')
        .update({ items: JSON.stringify(updatedItems) })
        .eq('id', checklistId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-checklists', workspaceId] });
    },
  });

  return {
    checklists: checklistsQuery.data ?? [],
    isLoading: checklistsQuery.isLoading,
    createChecklist: createChecklistMutation.mutate,
    updateChecklist: updateChecklistMutation.mutate,
    toggleItem: toggleItemMutation.mutate,
  };
}

// Pre-built checklist templates for different committee types
export const COMMITTEE_CHECKLIST_TEMPLATES: Record<string, { title: string; items: string[] }[]> = {
  catering: [
    {
      title: 'Vendor Setup',
      items: [
        'Finalize menu with vendors',
        'Confirm dietary restrictions handled',
        'Schedule delivery times',
        'Arrange serving equipment',
        'Confirm head count',
      ],
    },
    {
      title: 'Day-of Preparation',
      items: [
        'Setup buffet stations',
        'Check food temperature',
        'Arrange refreshment stations',
        'Prepare waste disposal',
        'Brief serving staff',
      ],
    },
  ],
  marketing: [
    {
      title: 'Pre-Event Marketing',
      items: [
        'Design promotional materials',
        'Schedule social media posts',
        'Send email invitations',
        'Create event landing page',
        'Prepare press release',
      ],
    },
    {
      title: 'Event Coverage',
      items: [
        'Arrange photographer/videographer',
        'Setup live streaming',
        'Prepare social media templates',
        'Coordinate speaker interviews',
        'Collect attendee testimonials',
      ],
    },
  ],
  logistics: [
    {
      title: 'Venue Preparation',
      items: [
        'Confirm venue booking',
        'Arrange seating layout',
        'Setup AV equipment',
        'Test sound system',
        'Prepare signage',
      ],
    },
    {
      title: 'Transport & Materials',
      items: [
        'Arrange transport for equipment',
        'Prepare registration desk',
        'Print name badges',
        'Setup check-in system',
        'Coordinate parking',
      ],
    },
  ],
  event: [
    {
      title: 'Event Coordination',
      items: [
        'Finalize event schedule',
        'Brief all committee leads',
        'Prepare backup plans',
        'Setup communication channels',
        'Confirm VIP arrangements',
      ],
    },
  ],
  facility: [
    {
      title: 'Facility Management',
      items: [
        'Inspect venue condition',
        'Confirm cleaning schedule',
        'Check emergency exits',
        'Verify fire safety equipment',
        'Setup first aid station',
      ],
    },
  ],
};
