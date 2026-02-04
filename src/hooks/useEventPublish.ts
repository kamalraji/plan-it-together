import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { EventStatus } from '@/types';
import { toast } from 'sonner';
import type { 
  EventSettingsReadiness, 
  PublishRequirements,
  ChecklistCategory,
} from '@/types/eventPublishReadiness';
import { DEFAULT_PUBLISH_REQUIREMENTS } from '@/types/eventPublishReadiness';

export type PublishPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface EventPublishRequest {
  id: string;
  eventId: string;
  workspaceId: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerId: string | null;
  reviewNotes: string | null;
  priority: PublishPriority;
  checklistSnapshot: Record<string, any> | null;
  requestedAt: string;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'pass' | 'warning' | 'fail';
  required: boolean;
  category?: ChecklistCategory;
  settingsTab?: string;
}

export interface PublishChecklist {
  items: ChecklistItem[];
  canPublish: boolean;
  hasIssues: boolean;
  hasWarnings: boolean;
  requiresAcknowledgment: boolean;
  warningCount: number;
  failCount: number;
  settingsReadiness?: EventSettingsReadiness;
  completionPercentage?: number;
  publishRequirements?: PublishRequirements;
}

export function useEventPublish(eventId: string) {
  const queryClient = useQueryClient();

  // Fetch ROOT workspace for this event
  const rootWorkspaceQuery = useQuery({
    queryKey: ['event-root-workspace', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, settings')
        .eq('event_id', eventId)
        .eq('workspace_type', 'ROOT')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Fetch current event status with branding and landing page data
  const eventQuery = useQuery({
    queryKey: ['event-status', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, status, description, start_date, end_date, mode, visibility, capacity, branding, landing_page_data, landing_page_slug')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Fetch ticket tiers for this event
  const ticketTiersQuery = useQuery({
    queryKey: ['event-ticket-tiers', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_tiers')
        .select('id')
        .eq('event_id', eventId)
        .limit(1);

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  // Fetch promo codes for this event
  const promoCodesQuery = useQuery({
    queryKey: ['event-promo-codes', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('id, is_active')
        .eq('event_id', eventId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  // Fetch any existing publish request
  const publishRequestQuery = useQuery({
    queryKey: ['event-publish-request', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_publish_requests')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        eventId: data.event_id,
        workspaceId: data.workspace_id,
        requestedBy: data.requested_by,
        status: data.status as 'pending' | 'approved' | 'rejected',
        reviewerId: data.reviewer_id,
        reviewNotes: data.review_notes,
        priority: (data.priority || 'medium') as PublishPriority,
        checklistSnapshot: data.checklist_snapshot as Record<string, any> | null,
        requestedAt: data.requested_at,
        reviewedAt: data.reviewed_at,
        createdAt: data.created_at,
      } as EventPublishRequest;
    },
    enabled: !!eventId,
  });

  // Get publish requirements from workspace settings
  const getPublishRequirements = (): PublishRequirements => {
    const workspaceSettings = rootWorkspaceQuery.data?.settings as { publishRequirements?: PublishRequirements } | null;
    return workspaceSettings?.publishRequirements || DEFAULT_PUBLISH_REQUIREMENTS;
  };

  // Calculate Event Space settings readiness
  const getSettingsReadiness = (): EventSettingsReadiness => {
    const event = eventQuery.data;
    const branding = event?.branding as Record<string, any> | null;
    const landingPageData = event?.landing_page_data as Record<string, any> | null;
    const ticketTiers = ticketTiersQuery.data || [];
    const promoCodes = promoCodesQuery.data || [];

    return {
      landingPage: {
        configured: !!landingPageData?.html || !!landingPageData?.css,
        hasContent: !!(landingPageData?.html && landingPageData.html.length > 100),
        hasSlug: !!event?.landing_page_slug,
      },
      ticketing: {
        configured: !!branding?.ticketing,
        registrationType: branding?.ticketing?.registrationType || null,
        isFree: branding?.ticketing?.isFree ?? true,
        hasTicketTiers: ticketTiers.length > 0,
      },
      seo: {
        configured: !!branding?.seo,
        hasMetaDescription: !!branding?.seo?.metaDescription,
        hasSlug: !!event?.landing_page_slug,
        hasOgImage: !!branding?.seo?.ogImage,
      },
      accessibility: {
        configured: !!branding?.accessibility,
        hasLanguage: !!branding?.accessibility?.language,
        featuresCount: branding?.accessibility?.features?.length || 0,
      },
      promoCodes: {
        hasActiveCodes: promoCodes.some((p: { is_active: boolean }) => p.is_active),
        codeCount: promoCodes.length,
      },
    };
  };

  // Generate pre-publish checklist
  const generateChecklist = (): PublishChecklist => {
    const event = eventQuery.data;
    const rootWorkspace = rootWorkspaceQuery.data;
    const items: ChecklistItem[] = [];
    const publishRequirements = getPublishRequirements();
    const settingsReadiness = getSettingsReadiness();

    // === BASIC INFORMATION CATEGORY ===
    
    // Basic info check
    items.push({
      id: 'basic-info',
      label: 'Basic Information',
      description: 'Event name and description are configured',
      status: event?.name && event?.description ? 'pass' : 'fail',
      required: true,
      category: 'basic',
    });

    // Dates check
    items.push({
      id: 'dates',
      label: 'Event Dates',
      description: 'Start and end dates are set',
      status: event?.start_date && event?.end_date ? 'pass' : 'fail',
      required: true,
      category: 'basic',
    });

    // Future date check
    const startDate = event?.start_date ? new Date(event.start_date) : null;
    const isPastEvent = startDate && startDate < new Date();
    items.push({
      id: 'future-date',
      label: 'Event Date Valid',
      description: 'Event start date is in the future',
      status: isPastEvent ? 'warning' : 'pass',
      required: false,
      category: 'basic',
    });

    // ROOT workspace check
    items.push({
      id: 'root-workspace',
      label: 'ROOT Workspace',
      description: 'A ROOT workspace exists for the event',
      status: rootWorkspace ? 'pass' : 'fail',
      required: true,
      category: 'basic',
    });

    // Visibility check
    items.push({
      id: 'visibility',
      label: 'Event Visibility',
      description: 'Event visibility is configured',
      status: event?.visibility ? 'pass' : 'warning',
      required: false,
      category: 'basic',
    });

    // === EVENT SPACE SETTINGS CATEGORY ===
    
    // Landing Page check
    const landingPageConfigured = settingsReadiness.landingPage.configured && settingsReadiness.landingPage.hasContent;
    items.push({
      id: 'landing-page',
      label: 'Landing Page',
      description: landingPageConfigured 
        ? 'Landing page is configured with content' 
        : 'Configure your event landing page',
      status: landingPageConfigured ? 'pass' : (publishRequirements.requireLandingPage ? 'fail' : 'warning'),
      required: publishRequirements.requireLandingPage,
      category: 'event-space',
      settingsTab: 'landing-page',
    });

    // Ticketing/Registration check
    const ticketingConfigured = settingsReadiness.ticketing.configured;
    items.push({
      id: 'ticketing',
      label: 'Ticketing & Registration',
      description: ticketingConfigured 
        ? `${settingsReadiness.ticketing.isFree ? 'Free event' : 'Paid event'}, ${settingsReadiness.ticketing.registrationType || 'open'} registration`
        : 'Configure registration settings',
      status: ticketingConfigured ? 'pass' : (publishRequirements.requireTicketingConfig ? 'fail' : 'warning'),
      required: publishRequirements.requireTicketingConfig,
      category: 'event-space',
      settingsTab: 'ticketing',
    });

    // SEO check
    const seoConfigured = settingsReadiness.seo.configured && settingsReadiness.seo.hasMetaDescription;
    items.push({
      id: 'seo',
      label: 'SEO Settings',
      description: seoConfigured 
        ? 'Meta description and SEO configured'
        : 'Configure SEO for better discoverability',
      status: seoConfigured ? 'pass' : (publishRequirements.requireSEO ? 'fail' : 'warning'),
      required: publishRequirements.requireSEO,
      category: 'event-space',
      settingsTab: 'seo',
    });

    // Accessibility check
    const accessibilityConfigured = settingsReadiness.accessibility.configured && settingsReadiness.accessibility.hasLanguage;
    items.push({
      id: 'accessibility',
      label: 'Accessibility',
      description: accessibilityConfigured 
        ? `Language set, ${settingsReadiness.accessibility.featuresCount} feature${settingsReadiness.accessibility.featuresCount !== 1 ? 's' : ''} enabled`
        : 'Configure accessibility settings',
      status: accessibilityConfigured ? 'pass' : (publishRequirements.requireAccessibility ? 'fail' : 'warning'),
      required: publishRequirements.requireAccessibility,
      category: 'event-space',
      settingsTab: 'accessibility',
    });

    // Promo codes (always optional, informational)
    if (settingsReadiness.promoCodes.codeCount > 0) {
      items.push({
        id: 'promo-codes',
        label: 'Promo Codes',
        description: `${settingsReadiness.promoCodes.codeCount} code${settingsReadiness.promoCodes.codeCount !== 1 ? 's' : ''} configured, ${settingsReadiness.promoCodes.hasActiveCodes ? 'active' : 'none active'}`,
        status: settingsReadiness.promoCodes.hasActiveCodes ? 'pass' : 'warning',
        required: false,
        category: 'event-space',
        settingsTab: 'promo-codes',
      });
    }

    const failCount = items.filter(i => i.status === 'fail').length;
    const warningCount = items.filter(i => i.status === 'warning').length;
    const passCount = items.filter(i => i.status === 'pass').length;
    // Always allow publishing - show warnings but don't block
    const canPublish = true;
    const hasIssues = failCount > 0;
    const hasWarnings = warningCount > 0;
    const requiresAcknowledgment = hasIssues || hasWarnings;
    const completionPercentage = Math.round((passCount / items.length) * 100);

    return { 
      items, 
      canPublish, 
      hasIssues,
      hasWarnings,
      requiresAcknowledgment,
      warningCount, 
      failCount, 
      settingsReadiness,
      completionPercentage,
      publishRequirements,
    };
  };

  // Direct publish mutation (no approval required)
  const publishMutation = useMutation({
    mutationFn: async () => {
      // 1. Update event status
      const { error } = await supabase
        .from('events')
        .update({ status: 'PUBLISHED' })
        .eq('id', eventId);

      if (error) throw error;

      // 2. Auto-provision workspaces via edge function
      const { data: { user } } = await supabase.auth.getUser();
      const event = eventQuery.data;
      
      if (user && event) {
        try {
          await supabase.functions.invoke('workspace-provision', {
            body: {
              eventId,
              organizationId: event.organization_id || '',
              requestedBy: user.id,
              skipExisting: true,
            },
          });
        } catch (provisionError) {
          // Log but don't fail the publish if workspace provisioning fails
          console.warn('Workspace auto-provisioning failed:', provisionError);
        }
      }
    },
    onSuccess: () => {
      toast.success('Event published successfully!');
      queryClient.invalidateQueries({ queryKey: ['event-status', eventId] });
      queryClient.invalidateQueries({ queryKey: ['organizer-event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-root-workspace', eventId] });
    },
    onError: (error) => {
      toast.error(`Failed to publish event: ${error.message}`);
    },
  });

  // Request approval mutation
  const requestApprovalMutation = useMutation({
    mutationFn: async ({ priority, notes }: { priority: PublishPriority; notes?: string }) => {
      const rootWorkspace = rootWorkspaceQuery.data;
      if (!rootWorkspace) throw new Error('No ROOT workspace found for this event');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const checklist = generateChecklist();

      const { error } = await supabase
        .from('event_publish_requests')
        .insert({
          event_id: eventId,
          workspace_id: rootWorkspace.id,
          requested_by: user.id,
          priority,
          checklist_snapshot: {
            items: checklist.items,
            canPublish: checklist.canPublish,
            notes,
          },
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Approval request submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['event-publish-request', eventId] });
    },
    onError: (error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });

  // Cancel pending request
  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('event_publish_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Request cancelled');
      queryClient.invalidateQueries({ queryKey: ['event-publish-request', eventId] });
    },
    onError: (error) => {
      toast.error(`Failed to cancel request: ${error.message}`);
    },
  });

  // Unpublish mutation
  const unpublishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('events')
        .update({ status: 'DRAFT' })
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Event unpublished');
      queryClient.invalidateQueries({ queryKey: ['event-status', eventId] });
      queryClient.invalidateQueries({ queryKey: ['organizer-event', eventId] });
    },
    onError: (error) => {
      toast.error(`Failed to unpublish: ${error.message}`);
    },
  });

  // Change status mutation
  const changeStatusMutation = useMutation({
    mutationFn: async ({ newStatus, reason }: { newStatus: EventStatus; reason?: string }) => {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId);

      if (error) throw error;

      // Add manual history entry if needed (trigger handles automatic logging)
      if (reason) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('event_status_history').insert({
          event_id: eventId,
          previous_status: eventQuery.data?.status || 'DRAFT',
          new_status: newStatus,
          changed_by: user?.id,
          reason,
        });
      }
    },
    onSuccess: (_, { newStatus }) => {
      toast.success(`Event status changed to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['event-status', eventId] });
      queryClient.invalidateQueries({ queryKey: ['organizer-event', eventId] });
    },
    onError: (error) => {
      toast.error(`Failed to change status: ${error.message}`);
    },
  });

  const rootWorkspace = rootWorkspaceQuery.data;
  const settings = rootWorkspace?.settings as { requireEventPublishApproval?: boolean } | null;
  const requiresApproval = settings?.requireEventPublishApproval === true;

  return {
    event: eventQuery.data,
    rootWorkspace,
    publishRequest: publishRequestQuery.data,
    requiresApproval,
    checklist: generateChecklist(),
    isLoading: eventQuery.isLoading || rootWorkspaceQuery.isLoading || publishRequestQuery.isLoading,
    publishEvent: publishMutation.mutateAsync,
    requestApproval: requestApprovalMutation.mutateAsync,
    cancelRequest: cancelRequestMutation.mutateAsync,
    unpublishEvent: unpublishMutation.mutateAsync,
    changeStatus: changeStatusMutation.mutateAsync,
    isPublishing: publishMutation.isPending,
    isRequestingApproval: requestApprovalMutation.isPending,
  };
}
