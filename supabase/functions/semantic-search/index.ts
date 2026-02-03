import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  workspaceId: string;
  types?: ('tasks' | 'messages' | 'members' | 'files')[];
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { query, workspaceId, types = ['tasks', 'messages', 'members'], limit = 20 } = await req.json() as SearchRequest;

    if (!query || !workspaceId) {
      return new Response(JSON.stringify({ error: 'Missing query or workspaceId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searchTerm = `%${query.toLowerCase()}%`;
    const results: Record<string, any[]> = {};

    // Parallel search across different content types
    const searchPromises: Promise<void>[] = [];

    if (types.includes('tasks')) {
      const taskPromise = (async () => {
        const { data, error } = await supabase
          .from('workspace_tasks')
          .select('id, title, description, status, priority, due_date, assigned_to')
          .eq('workspace_id', workspaceId)
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(limit);
        if (!error && data) {
          results.tasks = data.map(t => ({
            ...t,
            type: 'task',
            matchField: t.title?.toLowerCase().includes(query.toLowerCase()) ? 'title' : 'description',
          }));
        }
      })();
      searchPromises.push(taskPromise);
    }

    if (types.includes('messages')) {
      const messagePromise = (async () => {
        const { data, error } = await supabase
          .from('channel_messages')
          .select(`
            id, content, created_at, sender_name,
            channel:channel_id (
              id, name, workspace_id
            )
          `)
          .ilike('content', searchTerm)
          .limit(limit);
        if (!error && data) {
          // Filter to only messages from channels in this workspace
          results.messages = data
            .filter((m: any) => m.channel?.workspace_id === workspaceId)
            .map((m: any) => ({
              id: m.id,
              content: m.content,
              created_at: m.created_at,
              sender_name: m.sender_name,
              channel_name: m.channel?.name,
              channel_id: m.channel?.id,
              type: 'message',
            }));
        }
      })();
      searchPromises.push(messagePromise);
    }

    if (types.includes('members')) {
      const memberPromise = (async () => {
        const { data, error } = await supabase
          .from('workspace_team_members')
          .select(`
            id, role, status, user_id,
            profile:user_id (
              id, full_name, email, avatar_url
            )
          `)
          .eq('workspace_id', workspaceId)
          .eq('status', 'ACTIVE')
          .limit(limit);
        if (!error && data) {
          // Filter by name/email match
          results.members = data
            .filter((m: any) => {
              const name = m.profile?.full_name?.toLowerCase() || '';
              const email = m.profile?.email?.toLowerCase() || '';
              const q = query.toLowerCase();
              return name.includes(q) || email.includes(q);
            })
            .map((m: any) => ({
              id: m.id,
              user_id: m.user_id,
              full_name: m.profile?.full_name,
              email: m.profile?.email,
              avatar_url: m.profile?.avatar_url,
              role: m.role,
              type: 'member',
            }));
        }
      })();
      searchPromises.push(memberPromise);
    }

    await Promise.all(searchPromises);

    // Combine and rank results
    const allResults = [
      ...(results.tasks || []),
      ...(results.messages || []),
      ...(results.members || []),
    ];

    // Sort by relevance (exact matches first, then partial)
    const queryLower = query.toLowerCase();
    allResults.sort((a, b) => {
      const aTitle = (a.title || a.content || a.full_name || '').toLowerCase();
      const bTitle = (b.title || b.content || b.full_name || '').toLowerCase();
      
      const aExact = aTitle.startsWith(queryLower);
      const bExact = bTitle.startsWith(queryLower);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    return new Response(JSON.stringify({
      results: allResults.slice(0, limit),
      grouped: results,
      query,
      total: allResults.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ error: 'Search failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
