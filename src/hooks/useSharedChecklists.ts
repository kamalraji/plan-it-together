import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { getTemplatesForCategory, getDefaultTemplates, type ChecklistTemplate } from '@/lib/sharedChecklistTemplates';

type EventCategory = Database['public']['Enums']['event_category'];

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completed_at?: string | null;
  completed_by?: string | null;
}

interface SharedChecklist {
  id: string;
  title: string;
  description: string | null;
  phase: 'pre_event' | 'during_event' | 'post_event';
  items: ChecklistItem[];
  workspace_id: string;
  workspace_name?: string;
  event_id: string;
  is_shared: boolean;
  due_date: string | null;
  created_at: string;
}

interface UseSharedChecklistsOptions {
  eventId: string | null;
  workspaceId: string;
}

export function useSharedChecklists({ eventId, workspaceId }: UseSharedChecklistsOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch event details to get category
  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from('events')
        .select('id, name, category')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Fetch shared checklists for the event
  const { data: sharedChecklists = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['shared-checklists', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      try {
        const { data, error } = await supabase
          .from('workspace_checklists')
          .select(`
            id,
            title,
            description,
            phase,
            items,
            workspace_id,
            event_id,
            is_shared,
            due_date,
            created_at,
            workspaces!inner(name)
          `)
          .eq('event_id', eventId)
          .eq('is_shared', true)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return (data || []).map((checklist: any) => ({
          ...checklist,
          workspace_name: checklist.workspaces?.name,
          items: Array.isArray(checklist.items) ? checklist.items : [],
        })) as SharedChecklist[];
      } catch (error) {
        console.error('Failed to fetch shared checklists:', error);
        return [];
      }
    },
    enabled: !!eventId,
    retry: 1,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Get template suggestions based on event category
  const categoryTemplates = event?.category 
    ? getTemplatesForCategory(event.category as EventCategory)
    : getDefaultTemplates();

  // Create shared checklist mutation
  const createSharedChecklist = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      phase: 'pre_event' | 'during_event' | 'post_event';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      items: { title: string; description?: string }[];
      dueDate?: string;
    }) => {
      if (!eventId) throw new Error('Event ID is required');
      
      const checklistItems = data.items.map((item, index) => ({
        id: crypto.randomUUID(),
        title: item.title,
        description: item.description || '',
        completed: false,
        completed_at: null,
        completed_by: null,
        order: index,
      }));

      const { data: result, error } = await supabase
        .from('workspace_checklists')
        .insert({
          title: data.title,
          description: data.description || null,
          phase: data.phase,
          items: checklistItems,
          workspace_id: workspaceId,
          event_id: eventId,
          is_shared: true,
          due_date: data.dueDate || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-checklists', eventId] });
      toast({
        title: 'Shared checklist created',
        description: 'The checklist is now visible to all workspaces in this event.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating checklist',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create checklist from template
  const createFromTemplate = useMutation({
    mutationFn: async (template: ChecklistTemplate) => {
      if (!eventId) throw new Error('Event ID is required');
      
      const checklistItems = template.items.map((item, index) => ({
        id: crypto.randomUUID(),
        title: item.title,
        description: item.description || '',
        completed: false,
        completed_at: null,
        completed_by: null,
        order: index,
      }));

      const { data: result, error } = await supabase
        .from('workspace_checklists')
        .insert({
          title: template.title,
          description: template.description,
          phase: template.phase,
          items: checklistItems,
          workspace_id: workspaceId,
          event_id: eventId,
          is_shared: true,
          due_date: null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-checklists', eventId] });
      toast({
        title: 'Template added',
        description: 'The checklist template has been added as a shared checklist.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error adding template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle item completion
  const toggleSharedItem = useMutation({
    mutationFn: async ({ checklistId, itemId }: { checklistId: string; itemId: string }) => {
      // First fetch the current checklist
      const { data: checklist, error: fetchError } = await supabase
        .from('workspace_checklists')
        .select('items')
        .eq('id', checklistId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const items = Array.isArray(checklist.items) ? checklist.items : [];
      const updatedItems = items.map((item: any) => {
        if (item.id === itemId) {
          return {
            ...item,
            completed: !item.completed,
            completed_at: !item.completed ? new Date().toISOString() : null,
          };
        }
        return item;
      });

      const { error: updateError } = await supabase
        .from('workspace_checklists')
        .update({ items: updatedItems })
        .eq('id', checklistId);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-checklists', eventId] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating item',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Calculate overall progress
  const calculateProgress = (checklists: SharedChecklist[]) => {
    const allItems = checklists.flatMap(c => c.items);
    if (allItems.length === 0) return 0;
    const completedItems = allItems.filter(item => item.completed).length;
    return Math.round((completedItems / allItems.length) * 100);
  };

  return {
    sharedChecklists,
    isLoading,
    isError,
    refetch,
    event,
    categoryTemplates,
    createSharedChecklist,
    createFromTemplate,
    toggleSharedItem,
    overallProgress: calculateProgress(sharedChecklists),
  };
}
