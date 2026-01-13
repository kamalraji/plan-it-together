import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CertificateTemplateBranding {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  borderStyle?: string;
  layout?: 'classic' | 'modern' | 'minimal';
}

export interface CertificateTemplateContent {
  title?: string;
  subtitle?: string;
  bodyText?: string;
  footerText?: string;
  signatureName?: string;
  signatureTitle?: string;
}

export interface CertificateTemplate {
  id: string;
  workspace_id: string;
  event_id: string | null;
  name: string;
  type: 'COMPLETION' | 'MERIT' | 'APPRECIATION';
  background_url: string | null;
  logo_url: string | null;
  signature_url: string | null;
  branding: CertificateTemplateBranding;
  content: CertificateTemplateContent;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateTemplateInput {
  name: string;
  type: 'COMPLETION' | 'MERIT' | 'APPRECIATION';
  backgroundUrl?: string;
  logoUrl?: string;
  signatureUrl?: string;
  branding?: CertificateTemplateBranding;
  content?: CertificateTemplateContent;
  isDefault?: boolean;
}

export interface UpdateTemplateInput {
  name?: string;
  type?: 'COMPLETION' | 'MERIT' | 'APPRECIATION';
  backgroundUrl?: string;
  logoUrl?: string;
  signatureUrl?: string;
  branding?: CertificateTemplateBranding;
  content?: CertificateTemplateContent;
  isDefault?: boolean;
}

export function useCertificateTemplates(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  // List templates for workspace
  const templatesQuery = useQuery({
    queryKey: ['certificate-templates', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'listTemplates', workspaceId },
      });

      if (error) throw error;
      return (data?.data ?? []) as CertificateTemplate[];
    },
    enabled: !!workspaceId,
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: CreateTemplateInput) => {
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: {
          action: 'createTemplate',
          workspaceId,
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

  return {
    templates: templatesQuery.data ?? [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    refetch: templatesQuery.refetch,

    createTemplate: createTemplateMutation.mutate,
    isCreating: createTemplateMutation.isPending,

    updateTemplate: updateTemplateMutation.mutate,
    isUpdating: updateTemplateMutation.isPending,

    deleteTemplate: deleteTemplateMutation.mutate,
    isDeleting: deleteTemplateMutation.isPending,
  };
}
