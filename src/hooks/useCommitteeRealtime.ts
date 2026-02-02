/**
 * Committee-Specific Real-Time Hooks
 * Provides targeted real-time subscriptions for each committee dashboard
 */
import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseCommitteeRealtimeOptions {
  workspaceId: string;
  enabled?: boolean;
}

/**
 * Base hook for committee real-time subscriptions
 */
function useCommitteeRealtimeBase(
  options: UseCommitteeRealtimeOptions,
  additionalTables: string[] = []
) {
  const { workspaceId, enabled = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const invalidateQueries = useCallback((table: string, payload: any) => {
    const wsId = payload.new?.workspace_id || payload.old?.workspace_id || workspaceId;
    
    // Common invalidations
    queryClient.invalidateQueries({ queryKey: ['committee-stats', wsId] });
    queryClient.invalidateQueries({ queryKey: ['committee-tasks', wsId] });
    
    // Table-specific invalidations
    switch (table) {
      case 'workspace_tasks':
        queryClient.invalidateQueries({ queryKey: ['workspace-tasks', wsId] });
        break;
      case 'workspace_team_members':
        queryClient.invalidateQueries({ queryKey: ['workspace-team-members', wsId] });
        break;
      case 'workspace_activities':
        queryClient.invalidateQueries({ queryKey: ['workspace-activities', wsId] });
        break;
      case 'workspace_milestones':
        queryClient.invalidateQueries({ queryKey: ['workspace-milestones', wsId] });
        break;
    }
  }, [queryClient, workspaceId]);

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    const channelName = `committee-realtime:${workspaceId}`;
    channelRef.current = supabase.channel(channelName);

    // Core tables for all committees
    const coreTables = ['workspace_tasks', 'workspace_team_members', 'workspace_activities'];
    const allTables = [...coreTables, ...additionalTables];

    allTables.forEach(table => {
      channelRef.current?.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => invalidateQueries(table, payload)
      );
    });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, enabled, invalidateQueries, additionalTables]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['committee-stats', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['committee-tasks', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['workspace-team-members', workspaceId] });
  }, [queryClient, workspaceId]);

  return { refresh };
}

/**
 * Media Committee Real-Time Hook
 * Subscribes to media crew, coverage schedules, and press credentials
 */
export function useMediaCommitteeRealtime(options: UseCommitteeRealtimeOptions) {
  const { workspaceId, enabled = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const base = useCommitteeRealtimeBase(options);

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    const channelName = `media-realtime:${workspaceId}`;
    channelRef.current = supabase.channel(channelName);

    // Media-specific tables
    channelRef.current
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'media_crew',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['media-crew', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'coverage_schedule',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['coverage-schedule', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'press_credentials',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['press-credentials', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'media_assets',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['media-assets', workspaceId] });
      });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, enabled, queryClient]);

  const refresh = useCallback(() => {
    base.refresh();
    queryClient.invalidateQueries({ queryKey: ['media-crew', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['coverage-schedule', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['press-credentials', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['media-assets', workspaceId] });
  }, [base, queryClient, workspaceId]);

  return { refresh };
}

/**
 * Social Media Committee Real-Time Hook
 * Subscribes to social posts, platform stats, and engagement data
 */
export function useSocialMediaCommitteeRealtime(options: UseCommitteeRealtimeOptions) {
  const { workspaceId, enabled = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const base = useCommitteeRealtimeBase(options);

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    const channelName = `social-media-realtime:${workspaceId}`;
    channelRef.current = supabase.channel(channelName);

    // Social Media-specific tables
    channelRef.current
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'social_media_posts',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['social-posts', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['content-calendar', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'social_media_accounts',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['social-accounts', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'influencer_partnerships',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['influencer-partnerships', workspaceId] });
      });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, enabled, queryClient]);

  const refresh = useCallback(() => {
    base.refresh();
    queryClient.invalidateQueries({ queryKey: ['social-posts', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['social-accounts', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['content-calendar', workspaceId] });
  }, [base, queryClient, workspaceId]);

  return { refresh };
}

/**
 * Marketing Committee Real-Time Hook
 * Subscribes to campaigns, ads, and branding assets
 */
export function useMarketingCommitteeRealtime(options: UseCommitteeRealtimeOptions) {
  const { workspaceId, enabled = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const base = useCommitteeRealtimeBase(options);

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    const channelName = `marketing-realtime:${workspaceId}`;
    channelRef.current = supabase.channel(channelName);

    // Marketing-specific tables
    channelRef.current
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketing_campaigns',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['marketing-campaigns', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ad_campaigns',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['ad-campaigns', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['ad-performance', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'branding_assets',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['branding-assets', workspaceId] });
      });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, enabled, queryClient]);

  const refresh = useCallback(() => {
    base.refresh();
    queryClient.invalidateQueries({ queryKey: ['marketing-campaigns', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['ad-campaigns', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['branding-assets', workspaceId] });
  }, [base, queryClient, workspaceId]);

  return { refresh };
}

/**
 * Communication Committee Real-Time Hook
 * Subscribes to announcements, emails, and messaging channels
 */
export function useCommunicationCommitteeRealtime(options: UseCommitteeRealtimeOptions) {
  const { workspaceId, enabled = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const base = useCommitteeRealtimeBase(options);

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    const channelName = `communication-realtime:${workspaceId}`;
    channelRef.current = supabase.channel(channelName);

    // Communication-specific tables
    channelRef.current
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_announcements',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['announcements', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'email_campaigns',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['email-campaigns', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_channels',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['messaging-channels', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'press_releases',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['press-releases', workspaceId] });
      });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, enabled, queryClient]);

  const refresh = useCallback(() => {
    base.refresh();
    queryClient.invalidateQueries({ queryKey: ['announcements', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['email-campaigns', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['messaging-channels', workspaceId] });
  }, [base, queryClient, workspaceId]);

  return { refresh };
}

/**
 * Content Committee Real-Time Hook
 * Subscribes to blog articles, media assets, and publication pipeline
 */
export function useContentCommitteeRealtime(options: UseCommitteeRealtimeOptions) {
  const { workspaceId, enabled = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const base = useCommitteeRealtimeBase(options);

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    const channelName = `content-realtime:${workspaceId}`;
    channelRef.current = supabase.channel(channelName);

    // Content-specific tables
    channelRef.current
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'blog_articles',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['blog-articles', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'content_assets',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['content-assets', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['media-library', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'publication_items',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['publication-pipeline', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'page_builder_pages',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['page-builder', workspaceId] });
      });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, enabled, queryClient]);

  const refresh = useCallback(() => {
    base.refresh();
    queryClient.invalidateQueries({ queryKey: ['blog-articles', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['content-assets', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['publication-pipeline', workspaceId] });
  }, [base, queryClient, workspaceId]);

  return { refresh };
}

/**
 * Logistics Committee Real-Time Hook
 * Subscribes to shipments, transport schedules, equipment, and venue logistics
 */
export function useLogisticsCommitteeRealtime(options: UseCommitteeRealtimeOptions) {
  const { workspaceId, enabled = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const base = useCommitteeRealtimeBase(options);

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    const channelName = `logistics-realtime:${workspaceId}`;
    channelRef.current = supabase.channel(channelName);

    // Logistics-specific tables
    channelRef.current
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_logistics',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['logistics-shipments', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_transport_schedules',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['transport-schedules', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_equipment',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['logistics-equipment', workspaceId] });
      });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, enabled, queryClient]);

  const refresh = useCallback(() => {
    base.refresh();
    queryClient.invalidateQueries({ queryKey: ['logistics-shipments', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['transport-schedules', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['logistics-equipment', workspaceId] });
  }, [base, queryClient, workspaceId]);

  return { refresh };
}

/**
 * Finance Committee Real-Time Hook
 * Subscribes to expenses, invoices, and budget requests
 */
export function useFinanceCommitteeRealtime(options: UseCommitteeRealtimeOptions) {
  const { workspaceId, enabled = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const base = useCommitteeRealtimeBase(options);

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    const channelName = `finance-realtime:${workspaceId}`;
    channelRef.current = supabase.channel(channelName);

    // Finance-specific tables
    channelRef.current
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_expenses',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['workspace-expenses', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['expense-tracker', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_invoices',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['workspace-invoices', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_budget_requests',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['budget-requests', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['budget-approval-queue', workspaceId] });
      });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, enabled, queryClient]);

  const refresh = useCallback(() => {
    base.refresh();
    queryClient.invalidateQueries({ queryKey: ['workspace-expenses', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['workspace-invoices', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['budget-requests', workspaceId] });
  }, [base, queryClient, workspaceId]);

  return { refresh };
}

/**
 * Registration Committee Real-Time Hook
 * Subscribes to event registrations and check-ins
 */
export function useRegistrationCommitteeRealtime(options: UseCommitteeRealtimeOptions) {
  const { workspaceId, enabled = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const base = useCommitteeRealtimeBase(options);

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    const channelName = `registration-realtime:${workspaceId}`;
    channelRef.current = supabase.channel(channelName);

    // Registration-specific tables
    channelRef.current
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_registrations',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['event-registrations', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['registration-stats', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'check_ins',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['check-ins', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['check-in-stats', workspaceId] });
      });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, enabled, queryClient]);

  const refresh = useCallback(() => {
    base.refresh();
    queryClient.invalidateQueries({ queryKey: ['event-registrations', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['check-ins', workspaceId] });
  }, [base, queryClient, workspaceId]);

  return { refresh };
}

/**
 * Sponsorship Committee Real-Time Hook
 * Subscribes to sponsors and sponsor deliverables
 */
export function useSponsorshipCommitteeRealtime(options: UseCommitteeRealtimeOptions) {
  const { workspaceId, enabled = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const base = useCommitteeRealtimeBase(options);

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    const channelName = `sponsorship-realtime:${workspaceId}`;
    channelRef.current = supabase.channel(channelName);

    // Sponsorship-specific tables
    channelRef.current
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sponsors',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['sponsors', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['sponsorship-stats', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sponsor_deliverables',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['sponsor-deliverables', workspaceId] });
      });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, enabled, queryClient]);

  const refresh = useCallback(() => {
    base.refresh();
    queryClient.invalidateQueries({ queryKey: ['sponsors', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['sponsor-deliverables', workspaceId] });
  }, [base, queryClient, workspaceId]);

  return { refresh };
}

/**
 * Volunteers Committee Real-Time Hook
 * Subscribes to volunteer shifts and applications
 */
export function useVolunteersCommitteeRealtime(options: UseCommitteeRealtimeOptions) {
  const { workspaceId, enabled = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const base = useCommitteeRealtimeBase(options);

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    const channelName = `volunteers-realtime:${workspaceId}`;
    channelRef.current = supabase.channel(channelName);

    // Volunteers-specific tables
    channelRef.current
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'volunteer_shifts',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['volunteer-shifts', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['volunteer-schedule', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'volunteer_applications',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['volunteer-applications', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['volunteer-roster', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'volunteer_check_ins',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['volunteer-check-ins', workspaceId] });
      });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, enabled, queryClient]);

  const refresh = useCallback(() => {
    base.refresh();
    queryClient.invalidateQueries({ queryKey: ['volunteer-shifts', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['volunteer-applications', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['volunteer-check-ins', workspaceId] });
  }, [base, queryClient, workspaceId]);

  return { refresh };
}

/**
 * Technical Committee Real-Time Hook
 * Subscribes to support tickets and equipment
 */
export function useTechnicalCommitteeRealtime(options: UseCommitteeRealtimeOptions) {
  const { workspaceId, enabled = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const base = useCommitteeRealtimeBase(options);

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    const channelName = `technical-realtime:${workspaceId}`;
    channelRef.current = supabase.channel(channelName);

    // Technical-specific tables
    channelRef.current
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_tickets',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['support-tickets', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['ticket-queue', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'equipment',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['equipment', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['equipment-inventory', workspaceId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_streams',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['live-streams', workspaceId] });
      });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, enabled, queryClient]);

  const refresh = useCallback(() => {
    base.refresh();
    queryClient.invalidateQueries({ queryKey: ['support-tickets', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['equipment', workspaceId] });
    queryClient.invalidateQueries({ queryKey: ['live-streams', workspaceId] });
  }, [base, queryClient, workspaceId]);

  return { refresh };
}
