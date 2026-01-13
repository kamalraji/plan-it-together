import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { createHmac } from "node:crypto";
import { z, uuidSchema, socialPlatformSchema, validationError } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Zod schemas for social media post actions
const postNowSchema = z.object({
  action: z.literal("post_now"),
  workspace_id: uuidSchema,
  queue_id: uuidSchema,
});

const addToQueueSchema = z.object({
  action: z.literal("add_to_queue"),
  workspace_id: uuidSchema,
  post_id: uuidSchema,
});

const requestSchema = z.discriminatedUnion("action", [
  postNowSchema,
  addToQueueSchema,
]);

// Twitter API v2 implementation
async function postToTwitter(content: string, credentials: Record<string, string>): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const API_KEY = credentials.api_key;
    const API_SECRET = credentials.api_secret;
    const ACCESS_TOKEN = credentials.access_token;
    const ACCESS_TOKEN_SECRET = credentials.access_token_secret;

    if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
      return { success: false, error: 'Missing Twitter API credentials' };
    }

    const url = 'https://api.x.com/2/tweets';
    const method = 'POST';

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: API_KEY,
      oauth_nonce: Math.random().toString(36).substring(2),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: ACCESS_TOKEN,
      oauth_version: '1.0',
    };

    // Generate signature
    const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
      Object.entries(oauthParams)
        .sort()
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
    )}`;
    const signingKey = `${encodeURIComponent(API_SECRET)}&${encodeURIComponent(ACCESS_TOKEN_SECRET)}`;
    const hmacSha1 = createHmac('sha1', signingKey);
    const signature = hmacSha1.update(signatureBaseString).digest('base64');

    const signedOAuthParams = { ...oauthParams, oauth_signature: signature };
    const oauthHeader = 'OAuth ' + Object.entries(signedOAuthParams)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(', ');

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': oauthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Twitter API Error:', data);
      return { success: false, error: data.detail || data.title || 'Twitter API error' };
    }

    return { success: true, postId: data.data?.id };
  } catch (error: any) {
    console.error('Twitter posting error:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

// LinkedIn API implementation
async function postToLinkedIn(content: string, credentials: Record<string, string>): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const accessToken = credentials.access_token;
    const personUrn = credentials.person_urn;

    if (!accessToken || !personUrn) {
      return { success: false, error: 'Missing LinkedIn API credentials' };
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('LinkedIn API Error:', data);
      return { success: false, error: data.message || 'LinkedIn API error' };
    }

    return { success: true, postId: data.id };
  } catch (error: any) {
    console.error('LinkedIn posting error:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

// Instagram API (via Meta Graph API) implementation
async function postToInstagram(content: string, mediaUrl: string | null, credentials: Record<string, string>): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const accessToken = credentials.access_token;
    const igUserId = credentials.instagram_user_id;

    if (!accessToken || !igUserId) {
      return { success: false, error: 'Missing Instagram API credentials' };
    }

    // Instagram requires media for posts - if no media, return error
    if (!mediaUrl) {
      return { success: false, error: 'Instagram requires an image or video for posts' };
    }

    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: mediaUrl,
          caption: content,
          access_token: accessToken,
        }),
      }
    );

    const containerData = await containerResponse.json();
    
    if (!containerResponse.ok) {
      return { success: false, error: containerData.error?.message || 'Failed to create media container' };
    }

    // Step 2: Publish the media
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();
    
    if (!publishResponse.ok) {
      return { success: false, error: publishData.error?.message || 'Failed to publish media' };
    }

    return { success: true, postId: publishData.id };
  } catch (error: any) {
    console.error('Instagram posting error:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const rawBody = await req.json().catch(() => ({}));

    // Validate input with Zod
    const parseResult = requestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return validationError(parseResult.error, corsHeaders);
    }

    const body = parseResult.data;

    console.log('Social media post action:', body.action, 'workspace:', body.workspace_id);

    if (body.action === 'post_now') {
      // Get the post from queue
      const { data: queueItem, error: queueError } = await supabase
        .from('social_post_queue')
        .select(`
          *,
          social_post:workspace_social_posts(*)
        `)
        .eq('id', body.queue_id)
        .single();

      if (queueError || !queueItem) {
        throw new Error('Queue item not found');
      }

      // Get credentials for the platform
      const { data: credentials, error: credError } = await supabase
        .from('workspace_social_api_credentials')
        .select('*')
        .eq('workspace_id', body.workspace_id)
        .eq('platform', queueItem.platform)
        .eq('is_active', true)
        .single();

      if (credError || !credentials) {
        // Update queue with error
        await supabase
          .from('social_post_queue')
          .update({ 
            status: 'failed', 
            error_message: 'No active API credentials found for platform' 
          })
          .eq('id', body.queue_id);

        return new Response(JSON.stringify({ 
          success: false, 
          error: 'No API credentials configured for ' + queueItem.platform 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Update queue status to processing
      await supabase
        .from('social_post_queue')
        .update({ status: 'processing' })
        .eq('id', body.queue_id);

      const postContent = queueItem.social_post?.content || '';
      const mediaUrl = queueItem.social_post?.media_urls?.[0] || null;
      const decryptedCreds = credentials.encrypted_credentials;

      let result: { success: boolean; postId?: string; error?: string };

      switch (queueItem.platform) {
        case 'twitter':
          result = await postToTwitter(postContent, decryptedCreds);
          break;
        case 'linkedin':
          result = await postToLinkedIn(postContent, decryptedCreds);
          break;
        case 'instagram':
          result = await postToInstagram(postContent, mediaUrl, decryptedCreds);
          break;
        default:
          result = { success: false, error: 'Unsupported platform: ' + queueItem.platform };
      }

      // Update queue with result
      if (result.success) {
        await supabase
          .from('social_post_queue')
          .update({ 
            status: 'posted', 
            posted_at: new Date().toISOString(),
            external_post_id: result.postId,
            error_message: null
          })
          .eq('id', body.queue_id);

        // Update the social post status
        if (queueItem.social_post_id) {
          await supabase
            .from('workspace_social_posts')
            .update({ 
              status: 'published', 
              published_at: new Date().toISOString() 
            })
            .eq('id', queueItem.social_post_id);
        }
      } else {
        const retryCount = (queueItem.retry_count || 0) + 1;
        await supabase
          .from('social_post_queue')
          .update({ 
            status: retryCount >= 3 ? 'failed' : 'queued',
            error_message: result.error,
            retry_count: retryCount
          })
          .eq('id', body.queue_id);
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'add_to_queue') {
      // Add a post to the queue
      const { data: post, error: postError } = await supabase
        .from('workspace_social_posts')
        .select('*')
        .eq('id', body.post_id)
        .single();

      if (postError || !post) {
        throw new Error('Post not found');
      }

      const { data: queueItem, error: insertError } = await supabase
        .from('social_post_queue')
        .insert({
          workspace_id: body.workspace_id,
          social_post_id: body.post_id,
          platform: post.platform,
          status: 'queued',
          scheduled_for: post.scheduled_for,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return new Response(JSON.stringify({ success: true, queueItem }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  } catch (error: any) {
    console.error('Error in social-media-post:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
