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
