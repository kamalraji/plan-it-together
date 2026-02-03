import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PageViewEvent {
  route_name: string;
  route_params?: string;
  referrer?: string;
  entered_at: string;
  exited_at?: string;
  duration_ms: number;
  metadata?: Record<string, unknown>;
}

interface NavigationPattern {
  from_route: string;
  to_route: string;
  timestamp: string;
  dwell_time_ms: number;
}

interface RequestBody {
  user_id: string;
  events: PageViewEvent[];
  patterns: NavigationPattern[];
  session_id: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: RequestBody = await req.json();
    const { user_id, events, patterns, session_id } = body;

    if (!user_id || !session_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process page view events
    if (events && events.length > 0) {
      const pageViews = events.map((event) => ({
        user_id,
        session_id,
        route_name: event.route_name,
        route_params: event.route_params,
        referrer: event.referrer,
        entered_at: event.entered_at,
        exited_at: event.exited_at,
        duration_ms: event.duration_ms,
        metadata: event.metadata,
        event_type: event.metadata?.event_type || 'page_view',
      }));

      const { error: eventsError } = await supabase
        .from("route_analytics_events")
        .insert(pageViews);

      if (eventsError) {
        console.error("Failed to insert events:", eventsError);
      }
    }

    // Process navigation patterns
    if (patterns && patterns.length > 0) {
      const navPatterns = patterns.map((pattern) => ({
        user_id,
        session_id,
        from_route: pattern.from_route,
        to_route: pattern.to_route,
        timestamp: pattern.timestamp,
        dwell_time_ms: pattern.dwell_time_ms,
      }));

      const { error: patternsError } = await supabase
        .from("route_navigation_patterns")
        .insert(navPatterns);

      if (patternsError) {
        console.error("Failed to insert patterns:", patternsError);
      }
    }

    // Update session summary
    const profileEvents = events.filter((e) => 
      e.route_name.startsWith('/profile') || 
      e.route_name.startsWith('/u/') ||
      e.route_name.startsWith('/p/')
    );

    if (profileEvents.length > 0) {
      const totalDuration = profileEvents.reduce((sum, e) => sum + e.duration_ms, 0);
      
      await supabase.rpc('update_profile_view_stats', {
        p_user_id: user_id,
        p_view_count: profileEvents.length,
        p_total_duration_ms: totalDuration,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: { events: events?.length || 0, patterns: patterns?.length || 0 } 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing analytics:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
