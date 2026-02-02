import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);
  
  if (!userLimit || now > userLimit.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

interface ProfileData {
  full_name: string;
  bio: string | null;
  headline: string | null;
  skills: string[] | null;
  interests: string[] | null;
  looking_for: string[] | null;
  organization: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  if (!lovableApiKey) {
    return new Response(
      JSON.stringify({ error: "AI service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Rate limit
  if (!checkRateLimit(user.id, 20, 60000)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { target_user_id, similarity_score } = await req.json();

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ error: "target_user_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch both profiles
    const [userProfileRes, targetProfileRes] = await Promise.all([
      supabase
        .from("impact_profiles")
        .select("full_name, bio, headline, skills, interests, looking_for, organization")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("impact_profiles")
        .select("full_name, bio, headline, skills, interests, looking_for, organization")
        .eq("user_id", target_user_id)
        .single(),
    ]);

    if (userProfileRes.error || targetProfileRes.error) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch profiles" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userProfile = userProfileRes.data as ProfileData;
    const targetProfile = targetProfileRes.data as ProfileData;

    // Check cache
    const { data: cached } = await supabase
      .from("ai_match_insights")
      .select("*")
      .eq("user_id", user.id)
      .eq("target_user_id", target_user_id)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cached) {
      return new Response(
        JSON.stringify(cached),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate AI insights
    const insights = await generateMatchInsights(
      userProfile,
      targetProfile,
      similarity_score || 0.5,
      lovableApiKey
    );

    // Cache result
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    await supabase.from("ai_match_insights").upsert({
      user_id: user.id,
      target_user_id: target_user_id,
      match_score: insights.matchScore,
      match_narrative: insights.narrative,
      conversation_starters: insights.conversationStarters,
      collaboration_ideas: insights.collaborationIdeas,
      match_category: insights.category,
      shared_context: insights.sharedContext,
      model_version: "gemini-2.5-flash",
      generated_at: new Date().toISOString(),
      expires_at: expiresAt,
    });

    return new Response(
      JSON.stringify(insights),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Match analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateMatchInsights(
  userProfile: ProfileData,
  targetProfile: ProfileData,
  similarityScore: number,
  apiKey: string
): Promise<{
  matchScore: number;
  narrative: string;
  conversationStarters: string[];
  collaborationIdeas: string[];
  category: string;
  sharedContext: Record<string, unknown>;
}> {
  const prompt = `Analyze this professional match between two people and generate insights.

Person 1 (You):
- Name: ${userProfile.full_name}
- Bio: ${userProfile.bio || "Not provided"}
- Headline: ${userProfile.headline || "Not provided"}
- Skills: ${(userProfile.skills || []).join(", ") || "Not listed"}
- Interests: ${(userProfile.interests || []).join(", ") || "Not listed"}
- Looking for: ${(userProfile.looking_for || []).join(", ") || "Not specified"}
- Organization: ${userProfile.organization || "Not specified"}

Person 2 (Match):
- Name: ${targetProfile.full_name}
- Bio: ${targetProfile.bio || "Not provided"}
- Headline: ${targetProfile.headline || "Not provided"}
- Skills: ${(targetProfile.skills || []).join(", ") || "Not listed"}
- Interests: ${(targetProfile.interests || []).join(", ") || "Not listed"}
- Looking for: ${(targetProfile.looking_for || []).join(", ") || "Not specified"}
- Organization: ${targetProfile.organization || "Not specified"}

Semantic Similarity Score: ${(similarityScore * 100).toFixed(0)}%

Return a JSON object with these exact fields:
{
  "matchScore": <0-100 integer>,
  "narrative": "<1-2 sentence natural explanation of why these people are a good match>",
  "conversationStarters": ["<opener 1>", "<opener 2>", "<opener 3>"],
  "collaborationIdeas": ["<idea 1>", "<idea 2>"],
  "category": "<one of: professional, social, mentorship, collaboration, learning>",
  "sharedContext": {
    "commonSkills": ["<skill1>", "<skill2>"],
    "commonInterests": ["<interest1>"],
    "complementaryGoals": "<brief explanation if applicable>"
  }
}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: "You are a professional networking assistant. Return only valid JSON, no markdown or explanation.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded");
    }
    if (response.status === 402) {
      throw new Error("Payment required");
    }
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
    // Clean potential markdown formatting
    const cleanContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    
    const parsed = JSON.parse(cleanContent);
    
    return {
      matchScore: parsed.matchScore || Math.round(similarityScore * 100),
      narrative: parsed.narrative || "You two have interesting overlap in your backgrounds.",
      conversationStarters: parsed.conversationStarters || ["Hi! I noticed we have some common interests."],
      collaborationIdeas: parsed.collaborationIdeas || [],
      category: parsed.category || "professional",
      sharedContext: parsed.sharedContext || {},
    };
  } catch {
    console.warn("Failed to parse AI response, using fallback");
    
    // Calculate basic shared context
    const commonSkills = (userProfile.skills || []).filter(s => 
      (targetProfile.skills || []).includes(s)
    );
    const commonInterests = (userProfile.interests || []).filter(i => 
      (targetProfile.interests || []).includes(i)
    );

    return {
      matchScore: Math.round(similarityScore * 100),
      narrative: `You and ${targetProfile.full_name} share ${commonSkills.length + commonInterests.length} common areas of interest.`,
      conversationStarters: [
        `Hi ${targetProfile.full_name}! I noticed we both have an interest in ${commonInterests[0] || commonSkills[0] || "similar areas"}.`,
      ],
      collaborationIdeas: [],
      category: "professional",
      sharedContext: { commonSkills, commonInterests },
    };
  }
}
