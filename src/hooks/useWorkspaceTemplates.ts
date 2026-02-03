import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// Match actual database schema
export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string | null;
  industry_type: string | null;
  event_type: string | null;
  complexity: string | null;
  event_size_min: number | null;
  event_size_max: number | null;
  effectiveness: number | null;
  usage_count: number | null;
  structure: Record<string, any>;
  metadata: Record<string, any> | null;
  is_public: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateTemplateInput {
  name: string;
  description: string;
  event_type: string;
  is_public: boolean;
  source_workspace_id?: string;
  structure?: Record<string, any>;
  metadata?: Record<string, any>;
}

export function useWorkspaceTemplates(options?: { publicOnly?: boolean }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['workspace-templates', options?.publicOnly, user?.id],
    queryFn: async (): Promise<WorkspaceTemplate[]> => {
      let query = supabase
        .from('workspace_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.publicOnly) {
        query = query.eq('is_public', true);
      } else if (user?.id) {
        // Get public templates and user's own templates
        query = query.or(`is_public.eq.true,created_by.eq.${user.id}`);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(template => ({
        ...template,
        structure: template.structure as Record<string, any> || {},
        metadata: template.metadata as Record<string, any> || null,
      }));
    },
  });
}

export function useWorkspaceTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-template', templateId],
    queryFn: async (): Promise<WorkspaceTemplate | null> => {
      if (!templateId) return null;

      const { data, error } = await supabase
        .from('workspace_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) return null;
      
      return {
        ...data,
        structure: data.structure as Record<string, any> || {},
        metadata: data.metadata as Record<string, any> || null,
      };
    },
    enabled: !!templateId,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Build the structure from source workspace if provided
      let structure: Record<string, any> = input.structure || {};
      let metadata: Record<string, any> = input.metadata || {};

      if (input.source_workspace_id && !input.structure) {
        // Fetch workspace structure
        const [teamRes, tasksRes, channelsRes, milestonesRes] = await Promise.all([
          supabase
            .from('workspace_team_members')
            .select('role')
            .eq('workspace_id', input.source_workspace_id),
          supabase
            .from('workspace_tasks')
            .select('title, description, status, priority')
            .eq('workspace_id', input.source_workspace_id),
          supabase
            .from('workspace_channels')
            .select('name, channel_type, description')
            .eq('workspace_id', input.source_workspace_id),
          supabase
            .from('workspace_milestones')
            .select('name, target_date, status')
            .eq('workspace_id', input.source_workspace_id),
        ]);

        structure = {
          roles: [...new Set(teamRes.data?.map(m => m.role) || [])],
          taskTemplates: tasksRes.data?.slice(0, 20) || [],
          channels: channelsRes.data || [],
          milestones: milestonesRes.data || [],
        };

        metadata = {
          ...metadata,
          source_workspace_id: input.source_workspace_id,
        };
      }

      const { data, error } = await supabase
        .from('workspace_templates')
        .insert({
          name: input.name,
          description: input.description,
          event_type: input.event_type,
          is_public: input.is_public,
          structure,
          metadata,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-templates'] });
      toast.success('Template created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create template: ' + error.message);
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkspaceTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-templates'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-template', data.id] });
      toast.success('Template updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update template: ' + error.message);
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('workspace_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-templates'] });
      toast.success('Template deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete template: ' + error.message);
    },
  });
}

export function useIncrementTemplateUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data: template } = await supabase
        .from('workspace_templates')
        .select('usage_count')
        .eq('id', templateId)
        .single();

      if (template) {
        await supabase
          .from('workspace_templates')
          .update({ usage_count: (template.usage_count || 0) + 1 })
          .eq('id', templateId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-templates'] });
    },
  });
}
