import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface VenueChecklistItem {
  id: string;
  sectionId: string;
  task: string;
  location: string | null;
  completed: boolean;
  assigneeId: string | null;
  assigneeName: string | null;
  completedAt: Date | null;
  completedByName: string | null;
  notes: string | null;
  orderIndex: number;
}

export interface VenueChecklistStats {
  totalItems: number;
  completedItems: number;
  progress: number;
}

interface CreateItemInput {
  task: string;
  location?: string;
  assigneeId?: string;
}

interface UpdateItemInput {
  id: string;
  task?: string;
  location?: string;
  assigneeId?: string | null;
  notes?: string;
}

const VENUE_SETUP_SECTION_TITLE = 'Venue Setup';
const VENUE_SETUP_ICON = 'MapPin';

export function useVenueSetupChecklist(workspaceId: string, eventId?: string) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Fetch or create venue setup section, then fetch items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['venue-setup-checklist', workspaceId],
    queryFn: async () => {
      // First, find or create the Venue Setup section
      let { data: existingSection } = await supabase
        .from('workspace_tech_check_sections')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('title', VENUE_SETUP_SECTION_TITLE)
        .single();

      let currentSectionId: string;

      if (!existingSection) {
        // Create the venue setup section
        const { data: newSection, error: createError } = await supabase
          .from('workspace_tech_check_sections')
          .insert({
            workspace_id: workspaceId,
            event_id: eventId || null,
            title: VENUE_SETUP_SECTION_TITLE,
            icon: VENUE_SETUP_ICON,
            order_index: 100, // High index to appear at end
          })
          .select()
          .single();

        if (createError) throw createError;
        currentSectionId = newSection.id;
      } else {
        currentSectionId = existingSection.id;
      }

      setSectionId(currentSectionId);

      // Fetch items for this section
      const { data: itemsData, error: itemsError } = await supabase
        .from('workspace_tech_check_items')
        .select('*')
        .eq('section_id', currentSectionId)
        .order('order_index', { ascending: true });

      if (itemsError) throw itemsError;

      // Fetch user names for assignees and completers
      const userIds = new Set<string>();
      itemsData?.forEach(item => {
        if (item.assignee_id) userIds.add(item.assignee_id);
        if (item.checked_by) userIds.add(item.checked_by);
      });

      let userProfiles: Record<string, string> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', Array.from(userIds));
        
        profiles?.forEach(p => {
          userProfiles[p.id] = p.full_name || 'Unknown';
        });
      }

      return (itemsData || []).map(item => ({
        id: item.id,
        sectionId: item.section_id,
        task: item.label,
        location: item.description, // Using description field as location
        completed: item.checked,
        assigneeId: item.assignee_id,
        assigneeName: item.assignee_id ? userProfiles[item.assignee_id] || null : null,
        completedAt: item.checked_at ? new Date(item.checked_at) : null,
        completedByName: item.checked_by ? userProfiles[item.checked_by] || null : null,
        notes: item.notes,
        orderIndex: item.order_index,
      })) as VenueChecklistItem[];
    },
    enabled: !!workspaceId,
  });

  // Calculate stats
  const stats: VenueChecklistStats = {
    totalItems: items.length,
    completedItems: items.filter(i => i.completed).length,
    progress: 0,
  };
  stats.progress = stats.totalItems > 0 
    ? Math.round((stats.completedItems / stats.totalItems) * 100) 
    : 0;

  // Real-time subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`venue-setup-${workspaceId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'workspace_tech_check_items', filter: `workspace_id=eq.${workspaceId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['venue-setup-checklist', workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  // Create item
  const createItem = useMutation({
    mutationFn: async (input: CreateItemInput) => {
      if (!sectionId) throw new Error('Section not initialized');

      const maxOrder = items.length > 0
        ? Math.max(...items.map(i => i.orderIndex)) + 1
        : 0;

      const { data, error } = await supabase
        .from('workspace_tech_check_items')
        .insert({
          section_id: sectionId,
          workspace_id: workspaceId,
          label: input.task,
          description: input.location || null, // Using description as location
          assignee_id: input.assigneeId || null,
          order_index: maxOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-setup-checklist', workspaceId] });
      toast.success('Task added');
    },
    onError: (error) => {
      toast.error('Failed to add task');
      console.error(error);
    },
  });

  // Update item
  const updateItem = useMutation({
    mutationFn: async (input: UpdateItemInput) => {
      const updateData: Record<string, unknown> = {};
      if (input.task !== undefined) updateData.label = input.task;
      if (input.location !== undefined) updateData.description = input.location;
      if (input.assigneeId !== undefined) updateData.assignee_id = input.assigneeId;
      if (input.notes !== undefined) updateData.notes = input.notes;

      const { error } = await supabase
        .from('workspace_tech_check_items')
        .update(updateData)
        .eq('id', input.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-setup-checklist', workspaceId] });
    },
    onError: (error) => {
      toast.error('Failed to update task');
      console.error(error);
    },
  });

  // Delete item
  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('workspace_tech_check_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-setup-checklist', workspaceId] });
      toast.success('Task deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete task');
      console.error(error);
    },
  });

  // Toggle item completed state
  const toggleItem = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newCompleted = !item.completed;
    
    const { error } = await supabase
      .from('workspace_tech_check_items')
      .update({
        checked: newCompleted,
        checked_at: newCompleted ? new Date().toISOString() : null,
        checked_by: newCompleted ? userId : null,
      })
      .eq('id', itemId);

    if (error) {
      toast.error('Failed to update task');
      console.error(error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['venue-setup-checklist', workspaceId] });
    }
  };

  // Assign item to user
  const assignItem = async (itemId: string, assigneeId: string | null) => {
    const { error } = await supabase
      .from('workspace_tech_check_items')
      .update({ assignee_id: assigneeId })
      .eq('id', itemId);

    if (error) {
      toast.error('Failed to assign task');
      console.error(error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['venue-setup-checklist', workspaceId] });
      toast.success(assigneeId ? 'Task assigned' : 'Assignment removed');
    }
  };

  // Add note to item
  const addNote = async (itemId: string, note: string) => {
    const { error } = await supabase
      .from('workspace_tech_check_items')
      .update({ notes: note })
      .eq('id', itemId);

    if (error) {
      toast.error('Failed to add note');
      console.error(error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['venue-setup-checklist', workspaceId] });
      toast.success('Note saved');
    }
  };

  // Reset all items
  const resetAllItems = async () => {
    if (!sectionId) return;

    const { error } = await supabase
      .from('workspace_tech_check_items')
      .update({
        checked: false,
        checked_at: null,
        checked_by: null,
      })
      .eq('section_id', sectionId);

    if (error) {
      toast.error('Failed to reset tasks');
      console.error(error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['venue-setup-checklist', workspaceId] });
      toast.success('All tasks reset');
    }
  };

  // Create default venue setup items
  const createDefaultItems = async () => {
    if (!sectionId) {
      toast.error('Please wait for initialization');
      return;
    }

    const defaultItems = [
      { task: 'Test main projector and screen', location: 'Main Hall' },
      { task: 'Setup wireless microphone system', location: 'Stage' },
      { task: 'Configure live streaming equipment', location: 'AV Booth' },
      { task: 'Test backup power supply', location: 'All Areas' },
      { task: 'Setup registration tablets', location: 'Entrance' },
      { task: 'Configure speaker timer displays', location: 'Stage' },
      { task: 'Test video conferencing in breakout rooms', location: 'Rooms A-D' },
      { task: 'Install directional signage', location: 'Hallways' },
      { task: 'Check emergency exit lights', location: 'All Areas' },
      { task: 'Setup coat check area', location: 'Lobby' },
    ];

    for (let i = 0; i < defaultItems.length; i++) {
      await supabase
        .from('workspace_tech_check_items')
        .insert({
          section_id: sectionId,
          workspace_id: workspaceId,
          label: defaultItems[i].task,
          description: defaultItems[i].location,
          order_index: i,
        });
    }

    queryClient.invalidateQueries({ queryKey: ['venue-setup-checklist', workspaceId] });
    toast.success('Default checklist created');
  };

  return {
    items,
    stats,
    isLoading,
    sectionId,
    createItem,
    updateItem,
    deleteItem,
    toggleItem,
    assignItem,
    addNote,
    resetAllItems,
    createDefaultItems,
  };
}
