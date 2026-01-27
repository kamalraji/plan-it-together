import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface TechCheckItem {
  id: string;
  sectionId: string;
  label: string;
  description: string | null;
  checked: boolean;
  assigneeId: string | null;
  assigneeName: string | null;
  checkedAt: Date | null;
  checkedByName: string | null;
  notes: string | null;
  orderIndex: number;
}

export interface TechCheckSection {
  id: string;
  title: string;
  icon: string | null;
  orderIndex: number;
  items: TechCheckItem[];
}

export interface TechCheckStats {
  totalItems: number;
  completedItems: number;
  progress: number;
}

interface CreateSectionInput {
  title: string;
  icon?: string;
}

interface CreateItemInput {
  sectionId: string;
  label: string;
  description?: string;
  assigneeId?: string;
}

interface UpdateItemInput {
  id: string;
  label?: string;
  description?: string;
  assigneeId?: string | null;
  notes?: string;
}

export function useTechCheck(workspaceId: string, eventId?: string) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Fetch sections with items
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['tech-check', workspaceId],
    queryFn: async () => {
      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('workspace_tech_check_sections')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('order_index', { ascending: true });

      if (sectionsError) throw sectionsError;
      if (!sectionsData?.length) return [];

      // Fetch items for all sections
      const { data: itemsData, error: itemsError } = await supabase
        .from('workspace_tech_check_items')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('order_index', { ascending: true });

      if (itemsError) throw itemsError;

      // Fetch assignee and checker names
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

      // Map sections with items
      return sectionsData.map(section => ({
        id: section.id,
        title: section.title,
        icon: section.icon,
        orderIndex: section.order_index,
        items: (itemsData || [])
          .filter(item => item.section_id === section.id)
          .map(item => ({
            id: item.id,
            sectionId: item.section_id,
            label: item.label,
            description: item.description,
            checked: item.checked,
            assigneeId: item.assignee_id,
            assigneeName: item.assignee_id ? userProfiles[item.assignee_id] || null : null,
            checkedAt: item.checked_at ? new Date(item.checked_at) : null,
            checkedByName: item.checked_by ? userProfiles[item.checked_by] || null : null,
            notes: item.notes,
            orderIndex: item.order_index,
          }))
      })) as TechCheckSection[];
    },
    enabled: !!workspaceId,
  });

  // Calculate stats
  const stats: TechCheckStats = {
    totalItems: sections.reduce((acc, s) => acc + s.items.length, 0),
    completedItems: sections.reduce((acc, s) => acc + s.items.filter(i => i.checked).length, 0),
    progress: 0,
  };
  stats.progress = stats.totalItems > 0 
    ? Math.round((stats.completedItems / stats.totalItems) * 100) 
    : 0;

  // Real-time subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`tech-check-${workspaceId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'workspace_tech_check_items', filter: `workspace_id=eq.${workspaceId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tech-check', workspaceId] });
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'workspace_tech_check_sections', filter: `workspace_id=eq.${workspaceId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tech-check', workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  // Create section
  const createSection = useMutation({
    mutationFn: async (input: CreateSectionInput) => {
      const maxOrder = sections.length > 0 
        ? Math.max(...sections.map(s => s.orderIndex)) + 1 
        : 0;

      const { data, error } = await supabase
        .from('workspace_tech_check_sections')
        .insert({
          workspace_id: workspaceId,
          event_id: eventId || null,
          title: input.title,
          icon: input.icon || 'Settings',
          order_index: maxOrder,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-check', workspaceId] });
      toast.success('Section created');
    },
    onError: (error) => {
      toast.error('Failed to create section');
      console.error(error);
    },
  });

  // Delete section
  const deleteSection = useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase
        .from('workspace_tech_check_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-check', workspaceId] });
      toast.success('Section deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete section');
      console.error(error);
    },
  });

  // Create item
  const createItem = useMutation({
    mutationFn: async (input: CreateItemInput) => {
      const section = sections.find(s => s.id === input.sectionId);
      const maxOrder = section && section.items.length > 0
        ? Math.max(...section.items.map(i => i.orderIndex)) + 1
        : 0;

      const { data, error } = await supabase
        .from('workspace_tech_check_items')
        .insert({
          section_id: input.sectionId,
          workspace_id: workspaceId,
          label: input.label,
          description: input.description || null,
          assignee_id: input.assigneeId || null,
          order_index: maxOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-check', workspaceId] });
      toast.success('Item added');
    },
    onError: (error) => {
      toast.error('Failed to add item');
      console.error(error);
    },
  });

  // Update item
  const updateItem = useMutation({
    mutationFn: async (input: UpdateItemInput) => {
      const updateData: Record<string, unknown> = {};
      if (input.label !== undefined) updateData.label = input.label;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.assigneeId !== undefined) updateData.assignee_id = input.assigneeId;
      if (input.notes !== undefined) updateData.notes = input.notes;

      const { error } = await supabase
        .from('workspace_tech_check_items')
        .update(updateData)
        .eq('id', input.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-check', workspaceId] });
    },
    onError: (error) => {
      toast.error('Failed to update item');
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
      queryClient.invalidateQueries({ queryKey: ['tech-check', workspaceId] });
      toast.success('Item deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete item');
      console.error(error);
    },
  });

  // Toggle item checked state
  const toggleItem = async (itemId: string, notes?: string) => {
    const item = sections.flatMap(s => s.items).find(i => i.id === itemId);
    if (!item) return;

    const newChecked = !item.checked;
    
    const { error } = await supabase
      .from('workspace_tech_check_items')
      .update({
        checked: newChecked,
        checked_at: newChecked ? new Date().toISOString() : null,
        checked_by: newChecked ? userId : null,
        notes: notes !== undefined ? notes : item.notes,
      })
      .eq('id', itemId);

    if (error) {
      toast.error('Failed to update item');
      console.error(error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['tech-check', workspaceId] });
    }
  };

  // Assign item to user
  const assignItem = async (itemId: string, userId: string | null) => {
    const { error } = await supabase
      .from('workspace_tech_check_items')
      .update({ assignee_id: userId })
      .eq('id', itemId);

    if (error) {
      toast.error('Failed to assign item');
      console.error(error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['tech-check', workspaceId] });
      toast.success('Item assigned');
    }
  };

  // Reset all items
  const resetAllItems = async () => {
    const { error } = await supabase
      .from('workspace_tech_check_items')
      .update({
        checked: false,
        checked_at: null,
        checked_by: null,
        notes: null,
      })
      .eq('workspace_id', workspaceId);

    if (error) {
      toast.error('Failed to reset items');
      console.error(error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['tech-check', workspaceId] });
      toast.success('All items reset');
    }
  };

  // Create default template sections
  const createDefaultTemplate = async () => {
    const defaultSections = [
      { title: 'Audio Systems', icon: 'Volume2', items: ['Test main speakers', 'Check all wireless mic batteries', 'Verify mixer levels', 'Test backup audio system'] },
      { title: 'Visual Systems', icon: 'Monitor', items: ['Projector alignment check', 'LED wall calibration', 'Screen test patterns', 'Laptop connectivity test'] },
      { title: 'Network & Streaming', icon: 'Wifi', items: ['WiFi speed test', 'Streaming encoder test', 'Backup internet connection'] },
      { title: 'Lighting', icon: 'Lightbulb', items: ['Stage lighting preset test', 'House lights control', 'Emergency lighting check'] },
    ];

    for (let i = 0; i < defaultSections.length; i++) {
      const section = defaultSections[i];
      const { data: sectionData, error: sectionError } = await supabase
        .from('workspace_tech_check_sections')
        .insert({
          workspace_id: workspaceId,
          event_id: eventId || null,
          title: section.title,
          icon: section.icon,
          order_index: i,
          created_by: userId,
        })
        .select()
        .single();

      if (sectionError) {
        console.error('Failed to create section:', sectionError);
        continue;
      }

      for (let j = 0; j < section.items.length; j++) {
        await supabase
          .from('workspace_tech_check_items')
          .insert({
            section_id: sectionData.id,
            workspace_id: workspaceId,
            label: section.items[j],
            order_index: j,
          });
      }
    }

    queryClient.invalidateQueries({ queryKey: ['tech-check', workspaceId] });
    toast.success('Default checklist created');
  };

  return {
    sections,
    stats,
    isLoading,
    createSection,
    deleteSection,
    createItem,
    updateItem,
    deleteItem,
    toggleItem,
    assignItem,
    resetAllItems,
    createDefaultTemplate,
  };
}
