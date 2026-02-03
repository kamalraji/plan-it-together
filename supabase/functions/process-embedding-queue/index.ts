import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// deno-lint-ignore no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

interface EmbeddingJob {
  job_id: string;
  user_id: string;
  priority: number;
  attempts: number;
}

interface ProfileData {
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
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  if (!lovableApiKey) {
    console.error("LOVABLE_API_KEY not configured");
    return new Response(
      JSON.stringify({ error: "AI service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { batch_size = 5 } = await req.json().catch(() => ({}));

    // Get pending jobs
    const { data: jobs, error: jobsError } = await supabase
      .rpc("get_pending_embedding_jobs", { p_limit: batch_size });

    if (jobsError) {
      console.error("Error fetching jobs:", jobsError);
      throw jobsError;
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending jobs", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${jobs.length} embedding jobs`);

    const results = await Promise.allSettled(
      (jobs as EmbeddingJob[]).map((job) => processJob(supabase, job, lovableApiKey))
    );

    const processed = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    console.log(`Completed: ${processed} success, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: "Batch processed", 
        processed, 
        failed,
        total: jobs.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Queue processing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processJob(
  supabase: AnySupabaseClient,
  job: EmbeddingJob,
  apiKey: string
): Promise<void> {
  try {
    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from("impact_profiles")
      .select("bio, headline, skills, interests, looking_for, organization")
      .eq("user_id", job.user_id)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found: ${profileError?.message}`);
    }

    // Generate embeddings using real API
    const embeddings = await generateEmbeddings(profile as ProfileData, apiKey);

    // Calculate source hash
    const sourceText = buildSourceText(profile as ProfileData);
    const sourceHash = await hashText(sourceText);

    // Store embeddings
    const { error: upsertError } = await supabase
      .from("profile_embeddings")
      .upsert({
        user_id: job.user_id,
        bio_embedding: embeddings.bio ? `[${embeddings.bio.join(',')}]` : null,
        skills_embedding: embeddings.skills ? `[${embeddings.skills.join(',')}]` : null,
        interests_embedding: embeddings.interests ? `[${embeddings.interests.join(',')}]` : null,
        user_embedding: embeddings.combined ? `[${embeddings.combined.join(',')}]` : null,
        source_hash: sourceHash,
        last_updated: new Date().toISOString(),
        embedding_version: 1,
      });

    if (upsertError) {
      throw new Error(`Failed to store embeddings: ${upsertError.message}`);
    }

    // Mark job complete
    await supabase.rpc("complete_embedding_job", {
      p_job_id: job.job_id,
      p_success: true,
    });

    console.log(`Successfully processed embedding for user ${job.user_id}`);

  } catch (error) {
    console.error(`Failed job ${job.job_id}:`, error);
    
    await supabase.rpc("complete_embedding_job", {
      p_job_id: job.job_id,
      p_success: false,
      p_error_message: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
}

function buildSourceText(profile: ProfileData): string {
  return [
    profile.bio || "",
    profile.headline || "",
    (profile.skills || []).join(", "),
    (profile.interests || []).join(", "),
    (profile.looking_for || []).join(", "),
    profile.organization || "",
  ].join(" | ");
}

async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function generateEmbeddings(
  profile: ProfileData,
  apiKey: string
): Promise<{ bio: number[] | null; skills: number[] | null; interests: number[] | null; combined: number[] | null }> {
  
  // Build text inputs for each embedding type
  const bioText = [profile.bio, profile.headline, profile.organization]
    .filter(Boolean)
    .join(". ");
  
  const skillsText = (profile.skills || []).join(", ");
  const interestsText = [
    ...(profile.interests || []),
    ...(profile.looking_for || []),
  ].join(", ");
  
  const combinedText = [
    profile.headline || '',
    profile.bio || '',
    `Skills: ${(profile.skills || []).join(', ')}`,
    `Interests: ${(profile.interests || []).join(', ')}`,
    `Looking for: ${(profile.looking_for || []).join(', ')}`
  ].filter(s => s && s.length > 10).join('. ');

  // Generate embeddings in parallel using real API
  const [bioEmb, skillsEmb, interestsEmb, combinedEmb] = await Promise.all([
    bioText.length > 5 ? getEmbedding(bioText, apiKey) : null,
    skillsText.length > 5 ? getEmbedding(skillsText, apiKey) : null,
    interestsText.length > 5 ? getEmbedding(interestsText, apiKey) : null,
    combinedText.length > 20 ? getEmbedding(combinedText, apiKey).then(emb => compressEmbedding(emb, 128)) : null,
  ]);

  return {
    bio: bioEmb,
    skills: skillsEmb,
    interests: interestsEmb,
    combined: combinedEmb,
  };
}

async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  // Use Lovable AI Gateway's embedding endpoint
  const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.substring(0, 8000), // Limit input length
      dimensions: 768
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded");
    }
    if (response.status === 402) {
      throw new Error("Payment required - add credits to workspace");
    }
    const errorText = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.data?.[0]?.embedding) {
    throw new Error("Invalid embedding response format");
  }
  
  return data.data[0].embedding;
}

function compressEmbedding(embedding: number[], targetDim: number): number[] {
  const factor = Math.floor(embedding.length / targetDim);
  const result: number[] = [];
  
  for (let i = 0; i < targetDim; i++) {
    let sum = 0;
    for (let j = 0; j < factor; j++) {
      sum += embedding[i * factor + j];
    }
    result.push(sum / factor);
  }
  
  // Normalize
  const magnitude = Math.sqrt(result.reduce((sum, v) => sum + v * v, 0)) || 1;
  return result.map(v => v / magnitude);
}
