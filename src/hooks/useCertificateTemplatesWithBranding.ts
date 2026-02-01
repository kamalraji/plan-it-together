/**
 * Certificate Templates with Event Branding
 * Extended hook that auto-inherits event branding colors/logo
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  CertificateTemplate, 
  CertificateTemplateBranding,
  CreateTemplateInput,
  UpdateTemplateInput,
} from './useCertificateTemplates';
import { eventQueryKeys } from '@/lib/query-keys/events';

interface EventBranding {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  fontFamily?: string;
}

interface UseCertificateTemplatesWithBrandingOptions {
  workspaceId: string | undefined;
  eventId?: string;
  autoInheritBranding?: boolean;
}

/**
 * Extended certificate templates hook that can auto-inherit event branding
 */
export function useCertificateTemplatesWithBranding({
  workspaceId,
  eventId,
  autoInheritBranding = true,
}: UseCertificateTemplatesWithBrandingOptions) {
  const queryClient = useQueryClient();

  // Fetch event branding if eventId provided
  const eventBrandingQuery = useQuery({
    queryKey: eventQueryKeys.branding(eventId || ''),
    queryFn: async () => {
      if (!eventId) return null;

      const { data, error } = await supabase
        .from('events')
        .select('branding')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      
      const branding = data?.branding as Record<string, unknown> | null;
      return {
        primaryColor: branding?.primaryColor as string | undefined,
        secondaryColor: branding?.secondaryColor as string | undefined,
        accentColor: branding?.accentColor as string | undefined,
        logoUrl: branding?.logoUrl as string | undefined,
        fontFamily: branding?.fontFamily as string | undefined,
      } as EventBranding;
    },
    enabled: !!eventId && autoInheritBranding,
  });

  // List templates for workspace
  const templatesQuery = useQuery({
    queryKey: ['certificate-templates', workspaceId, eventId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'listTemplates', workspaceId, eventId },
      });

      if (error) throw error;
      return (data?.data ?? []) as CertificateTemplate[];
    },
    enabled: !!workspaceId,
  });

  // Create template with auto-inherited branding
  const createTemplateMutation = useMutation({
    mutationFn: async (template: CreateTemplateInput) => {
      const eventBranding = eventBrandingQuery.data;
      
      // Merge event branding into template branding
      const enhancedBranding: CertificateTemplateBranding = {
        ...template.branding,
      };

      if (autoInheritBranding && eventBranding) {
        if (!enhancedBranding.primaryColor && eventBranding.primaryColor) {
          enhancedBranding.primaryColor = eventBranding.primaryColor;
        }
        if (!enhancedBranding.secondaryColor && eventBranding.secondaryColor) {
          enhancedBranding.secondaryColor = eventBranding.secondaryColor;
        }
        if (!enhancedBranding.fontFamily && eventBranding.fontFamily) {
          enhancedBranding.fontFamily = eventBranding.fontFamily;
        }
      }

      const enhancedTemplate = {
        ...template,
        branding: enhancedBranding,
        logoUrl: template.logoUrl || (autoInheritBranding ? eventBranding?.logoUrl : undefined),
      };

      const { data, error } = await supabase.functions.invoke('certificates', {
        body: {
          action: 'createTemplate',
          workspaceId,
          eventId,
          template: enhancedTemplate,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates', workspaceId] });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ templateId, template }: { templateId: string; template: UpdateTemplateInput }) => {
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: {
          action: 'updateTemplate',
          workspaceId,
          templateId,
          template,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates', workspaceId] });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: {
          action: 'deleteTemplate',
          workspaceId,
          templateId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates', workspaceId] });
    },
  });

  // Sync branding from event to template
  const syncBrandingFromEvent = async (templateId: string) => {
    const eventBranding = eventBrandingQuery.data;
    if (!eventBranding) return;

    await updateTemplateMutation.mutateAsync({
      templateId,
      template: {
        logoUrl: eventBranding.logoUrl,
        branding: {
          primaryColor: eventBranding.primaryColor,
          secondaryColor: eventBranding.secondaryColor,
          fontFamily: eventBranding.fontFamily,
        },
      },
    });
  };

  return {
    templates: templatesQuery.data ?? [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    refetch: templatesQuery.refetch,

    eventBranding: eventBrandingQuery.data,
    isLoadingBranding: eventBrandingQuery.isLoading,

    createTemplate: createTemplateMutation.mutate,
    isCreating: createTemplateMutation.isPending,

    updateTemplate: updateTemplateMutation.mutate,
    isUpdating: updateTemplateMutation.isPending,

    deleteTemplate: deleteTemplateMutation.mutate,
    isDeleting: deleteTemplateMutation.isPending,

    syncBrandingFromEvent,
  };
}
