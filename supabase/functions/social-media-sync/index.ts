import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { z, uuidSchema, socialPlatformSchema, validationError } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Zod schemas for social media sync actions (strict mode)
const syncActionSchema = z.enum(["sync_post_metrics", "sync_platform_stats", "generate_report"]);
const syncTypeSchema = z.enum(["full", "incremental", "metrics_only"]);

const syncRequestSchema = z.object({
  action: syncActionSchema,
  workspace_id: uuidSchema,
  platform: socialPlatformSchema.optional(),
  sync_type: syncTypeSchema.optional(),
}).strict();

// Helper function to verify user has workspace access
// deno-lint-ignore no-explicit-any
async function verifyWorkspaceAccess(
  serviceClient: any,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const { data, error } = await serviceClient
    .from('workspace_members')
    .select('id, role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  // Only allow members with management roles to sync
  const managementRoles = ['owner', 'admin', 'manager', 'l1_organizer', 'l2_committee_head', 'l3_committee_member'];
  const member = data as { id: string; role: string };
  return managementRoles.includes(member.role);
}

// Twitter Analytics Sync
async function syncTwitterAnalytics(credentials: Record<string, string>, postIds: string[]): Promise<{ metrics: Record<string, Record<string, number>>; error?: string }> {
  try {
    const bearerToken = credentials.bearer_token;
    
    if (!bearerToken) {
      return { metrics: {}, error: 'Missing Twitter bearer token' };
    }

    const metrics: Record<string, Record<string, number>> = {};

    for (const postId of postIds) {
      const response = await fetch(
        `https://api.x.com/2/tweets/${postId}?tweet.fields=public_metrics`,
        {
          headers: { 'Authorization': `Bearer ${bearerToken}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        metrics[postId] = {
          likes: data.data?.public_metrics?.like_count || 0,
          retweets: data.data?.public_metrics?.retweet_count || 0,
          replies: data.data?.public_metrics?.reply_count || 0,
          impressions: data.data?.public_metrics?.impression_count || 0,
        };
      }
    }

    return { metrics };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Twitter sync error:', message);
    return { metrics: {}, error: message };
  }
}

// LinkedIn Analytics Sync
async function syncLinkedInAnalytics(credentials: Record<string, string>, postIds: string[]): Promise<{ metrics: Record<string, Record<string, number>>; error?: string }> {
  try {
    const accessToken = credentials.access_token;
    
    if (!accessToken) {
      return { metrics: {}, error: 'Missing LinkedIn access token' };
    }

    const metrics: Record<string, Record<string, number>> = {};

    for (const postId of postIds) {
      const response = await fetch(
        `https://api.linkedin.com/v2/socialActions/${postId}`,
        {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        metrics[postId] = {
          likes: data.likesSummary?.totalLikes || 0,
          comments: data.commentsSummary?.totalFirstLevelComments || 0,
          shares: 0, // LinkedIn doesn't provide shares in this endpoint
        };
      }
    }

    return { metrics };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('LinkedIn sync error:', message);
    return { metrics: {}, error: message };
  }
}

// Instagram Analytics Sync
async function syncInstagramAnalytics(credentials: Record<string, string>, postIds: string[]): Promise<{ metrics: Record<string, Record<string, number>>; error?: string }> {
  try {
    const accessToken = credentials.access_token;
    
    if (!accessToken) {
      return { metrics: {}, error: 'Missing Instagram access token' };
    }

    const metrics: Record<string, Record<string, number>> = {};

    for (const postId of postIds) {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${postId}/insights?metric=impressions,reach,saved,likes,comments,shares&access_token=${accessToken}`
      );

      if (response.ok) {
        const data = await response.json();
        const metricsData: Record<string, number> = {};
        
        data.data?.forEach((metric: { name: string; values?: Array<{ value: number }> }) => {
          metricsData[metric.name] = metric.values?.[0]?.value || 0;
        });

        metrics[postId] = {
          impressions: metricsData.impressions || 0,
          reach: metricsData.reach || 0,
          saves: metricsData.saved || 0,
          likes: metricsData.likes || 0,
          comments: metricsData.comments || 0,
          shares: metricsData.shares || 0,
        };
      }
    }

    return { metrics };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Instagram sync error:', message);
    return { metrics: {}, error: message };
  }
}

// Sync platform followers/profile stats
async function syncPlatformStats(platform: string, credentials: Record<string, string>): Promise<{ stats: Record<string, number>; error?: string }> {
  try {
    switch (platform) {
      case 'twitter': {
        const bearerToken = credentials.bearer_token;
        const userId = credentials.user_id;
        
        if (!bearerToken || !userId) {
          return { stats: {}, error: 'Missing Twitter credentials' };
        }

        const response = await fetch(
          `https://api.x.com/2/users/${userId}?user.fields=public_metrics`,
          { headers: { 'Authorization': `Bearer ${bearerToken}` } }
        );

        if (response.ok) {
          const data = await response.json();
          return {
            stats: {
              followers_count: data.data?.public_metrics?.followers_count || 0,
              following_count: data.data?.public_metrics?.following_count || 0,
              posts_count: data.data?.public_metrics?.tweet_count || 0,
            },
          };
        }
        break;
      }
      case 'instagram': {
        const accessToken = credentials.access_token;
        const igUserId = credentials.instagram_user_id;

        if (!accessToken || !igUserId) {
          return { stats: {}, error: 'Missing Instagram credentials' };
        }

        const response = await fetch(
          `https://graph.facebook.com/v18.0/${igUserId}?fields=followers_count,follows_count,media_count&access_token=${accessToken}`
        );

        if (response.ok) {
          const data = await response.json();
          return {
            stats: {
              followers_count: data.followers_count || 0,
              following_count: data.follows_count || 0,
              posts_count: data.media_count || 0,
            },
          };
        }
        break;
      }
      case 'linkedin': {
        // LinkedIn doesn't provide follower counts for personal profiles via API
        // Would need Company Page access
        return { stats: { followers_count: 0, following_count: 0, posts_count: 0 } };
      }
    }

    return { stats: {} };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${platform} stats sync error:`, message);
    return { stats: {}, error: message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with user's auth context for permission checks
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const rawBody = await req.json().catch(() => ({}));

    // Validate input with Zod
    const parseResult = syncRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return validationError(parseResult.error, corsHeaders);
    }

    const { action, workspace_id, platform, sync_type } = parseResult.data;

    // ===== AUTHORIZATION CHECK =====
    const hasAccess = await verifyWorkspaceAccess(supabase, user.id, workspace_id);
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Forbidden: You do not have permission to sync social media data for this workspace' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Social media sync action:', action, 'platform:', platform, 'user:', user.id);

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('social_analytics_sync_log')
      .insert({
        workspace_id,
        platform: platform || 'all',
        sync_type: sync_type || 'full',
        status: 'in_progress',
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create sync log:', logError);
    }

    if (action === 'sync_post_metrics') {
      // Get posts with external IDs
      const { data: queueItems, error: queueError } = await supabase
        .from('social_post_queue')
        .select('external_post_id, platform, social_post_id')
        .eq('workspace_id', workspace_id)
        .eq('status', 'posted')
        .not('external_post_id', 'is', null);

      if (queueError) {
        throw queueError;
      }

      // Group by platform
      const postsByPlatform: Record<string, string[]> = {};
      queueItems?.forEach(item => {
        if (!postsByPlatform[item.platform]) {
          postsByPlatform[item.platform] = [];
        }
        postsByPlatform[item.platform].push(item.external_post_id);
      });

      let totalSynced = 0;

      for (const [plat, postIds] of Object.entries(postsByPlatform)) {
        // Get credentials
        const { data: credentials } = await supabase
          .from('workspace_social_api_credentials')
          .select('encrypted_credentials')
          .eq('workspace_id', workspace_id)
          .eq('platform', plat)
          .eq('is_active', true)
          .single();

        if (!credentials) continue;

        let result: { metrics: Record<string, Record<string, number>>; error?: string };

        switch (plat) {
          case 'twitter':
            result = await syncTwitterAnalytics(credentials.encrypted_credentials, postIds);
            break;
          case 'linkedin':
            result = await syncLinkedInAnalytics(credentials.encrypted_credentials, postIds);
            break;
          case 'instagram':
            result = await syncInstagramAnalytics(credentials.encrypted_credentials, postIds);
            break;
          default:
            continue;
        }

        // Update post metrics in database
        for (const [externalId, metrics] of Object.entries(result.metrics)) {
          const queueItem = queueItems?.find(q => q.external_post_id === externalId);
          if (queueItem?.social_post_id) {
            await supabase
              .from('workspace_social_posts')
              .update({
                engagement_likes: metrics.likes || 0,
                engagement_comments: metrics.comments || metrics.replies || 0,
                engagement_shares: metrics.shares || metrics.retweets || 0,
                reach: metrics.reach || 0,
                impressions: metrics.impressions || 0,
              })
              .eq('id', queueItem.social_post_id);
            totalSynced++;
          }
        }
      }

      // Update sync log
      if (syncLog) {
        await supabase
          .from('social_analytics_sync_log')
          .update({
            status: 'completed',
            records_synced: totalSynced,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLog.id);
      }

      return new Response(JSON.stringify({ success: true, synced: totalSynced }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'sync_platform_stats') {
      // Get all platform credentials
      const { data: allCredentials, error: credError } = await supabase
        .from('workspace_social_api_credentials')
        .select('*')
        .eq('workspace_id', workspace_id)
        .eq('is_active', true);

      if (credError) {
        throw credError;
      }

      let totalSynced = 0;

      for (const cred of allCredentials || []) {
        const result = await syncPlatformStats(cred.platform, cred.encrypted_credentials);
        
        if (Object.keys(result.stats).length > 0) {
          await supabase
            .from('workspace_social_platforms')
            .update({
              followers_count: result.stats.followers_count,
              following_count: result.stats.following_count,
              posts_count: result.stats.posts_count,
              last_synced_at: new Date().toISOString(),
            })
            .eq('workspace_id', workspace_id)
            .eq('platform', cred.platform);
          totalSynced++;
        }

        // Update last_used_at for credentials
        await supabase
          .from('workspace_social_api_credentials')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', cred.id);
      }

      // Update sync log
      if (syncLog) {
        await supabase
          .from('social_analytics_sync_log')
          .update({
            status: 'completed',
            records_synced: totalSynced,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLog.id);
      }

      return new Response(JSON.stringify({ success: true, synced: totalSynced }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate engagement report
    if (action === 'generate_report') {
      const today = new Date().toISOString().split('T')[0];

      // Get all platforms
      const { data: platforms } = await supabase
        .from('workspace_social_platforms')
        .select('*')
        .eq('workspace_id', workspace_id);

      // Get post metrics for reporting period
      const { data: posts } = await supabase
        .from('workspace_social_posts')
        .select('*')
        .eq('workspace_id', workspace_id)
        .eq('status', 'published');

      for (const plat of platforms || []) {
        const platformPosts = posts?.filter(p => p.platform === plat.platform) || [];
        
        const report = {
          workspace_id,
          report_date: today,
          platform: plat.platform,
          total_followers: plat.followers_count || 0,
          follower_growth: 0, // Would need historical data to calculate
          total_posts: platformPosts.length,
          total_likes: platformPosts.reduce((sum, p) => sum + (p.engagement_likes || 0), 0),
          total_comments: platformPosts.reduce((sum, p) => sum + (p.engagement_comments || 0), 0),
          total_shares: platformPosts.reduce((sum, p) => sum + (p.engagement_shares || 0), 0),
          total_saves: platformPosts.reduce((sum, p) => sum + (p.engagement_saves || 0), 0),
          total_reach: platformPosts.reduce((sum, p) => sum + (p.reach || 0), 0),
          total_impressions: platformPosts.reduce((sum, p) => sum + (p.impressions || 0), 0),
          engagement_rate: plat.engagement_rate || 0,
        };

        // Upsert report
        await supabase
          .from('workspace_engagement_reports')
          .upsert(report, { 
            onConflict: 'workspace_id,report_date,platform',
            ignoreDuplicates: false 
          });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in social-media-sync:', message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
