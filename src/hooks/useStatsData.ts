import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryPresets } from '@/lib/query-config';

// Marketing Stats Hook
export function useMarketingStats(workspaceId: string) {
  return useQuery({
    queryKey: ['marketing-stats', workspaceId],
    queryFn: async () => {
      // Fetch campaigns count from workspace_tasks with marketing category
      const { count: campaignsCount } = await supabase
        .from('workspace_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'IN_PROGRESS');

      // Fetch ad channels for aggregated metrics
      const { data: channels } = await supabase
        .from('ad_channels')
        .select('impressions, clicks, spend, conversions')
        .eq('workspace_id', workspaceId);

      const totalReach = channels?.reduce((sum, ch) => sum + (ch.impressions || 0), 0) ?? 0;
      const totalClicks = channels?.reduce((sum, ch) => sum + (ch.clicks || 0), 0) ?? 0;
      const totalConversions = channels?.reduce((sum, ch) => sum + (ch.conversions || 0), 0) ?? 0;
      const adSpend = channels?.reduce((sum, ch) => sum + (ch.spend || 0), 0) ?? 0;
      const conversionRate = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 100 * 10) / 10 : 0;

      return {
        activeCampaigns: campaignsCount ?? 0,
        totalReach,
        conversionRate,
        adSpend,
      };
    },
    enabled: !!workspaceId,
    ...queryPresets.standard,
  });
}

// Media Stats Hook
export function useMediaStats(workspaceId: string) {
  return useQuery({
    queryKey: ['media-stats', workspaceId],
    queryFn: async () => {
      // Fetch crew counts by type
      const { data: crew } = await supabase
        .from('media_crew')
        .select('crew_type')
        .eq('workspace_id', workspaceId);

      const photographers = crew?.filter(c => c.crew_type === 'photographer').length ?? 0;
      const videographers = crew?.filter(c => c.crew_type === 'videographer').length ?? 0;

      // Fetch press credentials count
      const { count: pressCredentials } = await supabase
        .from('press_credentials')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'approved');

      // Fetch media assets count
      const { count: mediaAssets } = await supabase
        .from('workspace_media_assets')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      // Calculate coverage hours from schedule
      const { data: schedules } = await supabase
        .from('media_coverage_schedule')
        .select('start_time, end_time')
        .eq('workspace_id', workspaceId);

      let coverageHours = 0;
      schedules?.forEach(schedule => {
        const start = new Date(schedule.start_time);
        const end = new Date(schedule.end_time);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (hours > 0) coverageHours += hours;
      });

      // Fetch deliverables count from workspace_tasks
      const { count: deliverables } = await supabase
        .from('workspace_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'DONE');

      return {
        photographers,
        videographers,
        pressCredentials: pressCredentials ?? 0,
        mediaAssets: mediaAssets ?? 0,
        coverageHours: Math.round(coverageHours),
        deliverables: deliverables ?? 0,
      };
    },
    enabled: !!workspaceId,
    ...queryPresets.standard,
  });
}

// Growth Stats Hook
export function useGrowthStats(workspaceId: string) {
  return useQuery({
    queryKey: ['growth-stats', workspaceId],
    queryFn: async () => {
      // Fetch audience demographics for reach
      const { data: demographics } = await supabase
        .from('audience_demographics')
        .select('value')
        .eq('workspace_id', workspaceId);

      const totalReach = demographics?.reduce((sum, d) => sum + (d.value || 0), 0) ?? 0;

      // Fetch sponsorship data from ad_channels as revenue proxy
      const { data: channels } = await supabase
        .from('ad_channels')
        .select('spend')
        .eq('workspace_id', workspaceId);

      const sponsorshipRevenue = channels?.reduce((sum, ch) => sum + (ch.spend || 0), 0) ?? 0;

      // Get social media followers as audience growth
      const { data: socialAccounts } = await supabase
        .from('social_media_accounts')
        .select('followers')
        .eq('workspace_id', workspaceId)
        .eq('is_connected', true);

      const audienceGrowth = socialAccounts?.reduce((sum, a) => sum + (a.followers || 0), 0) ?? 0;

      // Calculate engagement from hashtags
      const { data: hashtags } = await supabase
        .from('hashtag_tracking')
        .select('uses_count, reach')
        .eq('workspace_id', workspaceId);

      // Estimate engagement rate from uses/reach
      const totalUses = hashtags?.reduce((sum, h) => sum + (h.uses_count || 0), 0) ?? 0;
      const totalHashtagReach = hashtags?.reduce((sum, h) => sum + (h.reach || 0), 0) ?? 0;
      const avgEngagement = totalHashtagReach > 0
        ? Math.round((totalUses / totalHashtagReach) * 100 * 10) / 10
        : 0;

      return {
        totalReach,
        audienceGrowth,
        sponsorshipRevenue,
        engagementRate: avgEngagement,
      };
    },
    enabled: !!workspaceId,
    ...queryPresets.standard,
  });
}

// Event Stats Hook
export function useEventStats(workspaceId: string, eventId?: string) {
  return useQuery({
    queryKey: ['event-stats', workspaceId, eventId],
    queryFn: async () => {
      // Fetch schedule items count from event sessions
      const { count: scheduleItems } = await supabase
        .from('event_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId || '');

      // Fetch VIP guests count
      const { count: vipGuests } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId || '')
        .eq('ticket_type', 'vip');

      // Fetch venue zones count
      const { count: venueZones } = await supabase
        .from('workspace_resources')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('type', 'venue');

      // Calculate hours to event
      let hoursToEvent = 0;
      if (eventId) {
        const { data: event } = await supabase
          .from('events')
          .select('start_date')
          .eq('id', eventId)
          .single();

        if (event?.start_date) {
          const eventDate = new Date(event.start_date);
          const now = new Date();
          hoursToEvent = Math.max(0, Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
        }
      }

      return {
        scheduleItems: scheduleItems ?? 0,
        vipGuests: vipGuests ?? 0,
        hoursToEvent,
        venueZones: venueZones ?? 0,
      };
    },
    enabled: !!workspaceId,
    ...queryPresets.standard,
  });
}
