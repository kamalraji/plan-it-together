import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  corsHeaders,
  validateAuth,
  checkRateLimit,
  errorResponse,
  successResponse,
  initRequestContext,
  logInfo,
  logError,
  logRequestComplete,
} from "../_shared/security.ts";

// =============================================
// TYPES
// =============================================
interface ProfileData {
  user_id: string;
  bio: string | null;
  headline: string | null;
  skills: string[] | null;
  interests: string[] | null;
  looking_for: string[] | null;
  organization: string | null;
  job_title: string | null;
}

interface EmbeddingRequest {
  user_id?: string;
  force_refresh?: boolean;
}

// =============================================
// EMBEDDING GENERATION
// =============================================
async function generateEmbedding(text: string): Promise<number[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 768
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

function hashProfileData(profile: ProfileData): string {
  const content = [
    profile.bio || '',
    profile.headline || '',
    (profile.skills || []).sort().join(','),
    (profile.interests || []).sort().join(','),
    (profile.looking_for || []).sort().join(','),
    profile.organization || '',
    profile.job_title || ''
  ].join('|');
  
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function buildTextForEmbedding(
  profile: ProfileData, 
  type: 'bio' | 'skills' | 'interests' | 'goals' | 'combined'
): string {
  switch (type) {
    case 'bio':
      return [
        profile.headline || '',
        profile.bio || '',
        profile.organization ? `Works at ${profile.organization}` : '',
        profile.job_title ? `Role: ${profile.job_title}` : ''
      ].filter(Boolean).join('. ');
      
    case 'skills':
      return (profile.skills || []).join(', ');
      
    case 'interests':
      return (profile.interests || []).join(', ');
      
    case 'goals':
      return (profile.looking_for || []).join(', ');
      
    case 'combined':
      return [
        profile.headline || '',
        profile.bio || '',
        `Skills: ${(profile.skills || []).join(', ')}`,
        `Interests: ${(profile.interests || []).join(', ')}`,
        `Looking for: ${(profile.looking_for || []).join(', ')}`
      ].filter(s => s && s.length > 10).join('. ');
  }
}

function compressEmbedding(embedding: number[]): number[] {
  const targetDim = 128;
  const factor = Math.floor(embedding.length / targetDim);
  const result: number[] = [];
  
  for (let i = 0; i < targetDim; i++) {
    let sum = 0;
    for (let j = 0; j < factor; j++) {
      sum += embedding[i * factor + j];
    }
    result.push(sum / factor);
  }
  
  const magnitude = Math.sqrt(result.reduce((sum, v) => sum + v * v, 0));
  return result.map(v => v / magnitude);
}

// =============================================
// MAIN HANDLER
// =============================================
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = initRequestContext('generate-profile-embedding');

  try {
    // 1. Authentication
    const auth = await validateAuth(req);
    if (!auth.authenticated || !auth.userId) {
      logRequestComplete(401);
      return errorResponse('Unauthorized', 401, corsHeaders);
    }

    // 2. Rate limiting (10 embedding generations per hour)
    const rateCheck = checkRateLimit(auth.userId, 'generate-embedding', { maxRequests: 10, windowMs: 3600000 });
    if (!rateCheck.allowed) {
      logRequestComplete(429);
      return errorResponse('Rate limit exceeded. Try again later.', 429, corsHeaders);
    }

    // 3. Parse request
    let targetUserId = auth.userId;
    let forceRefresh = false;
    
    if (req.method === 'POST') {
      const body = await req.json() as EmbeddingRequest;
      if (body.user_id) {
        if (body.user_id !== auth.userId) {
          logRequestComplete(403);
          return errorResponse('Cannot generate embeddings for other users', 403, corsHeaders);
        }
        targetUserId = body.user_id;
      }
      forceRefresh = body.force_refresh || false;
    }

    // 4. Get profile data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile, error: profileError } = await supabase
      .from('impact_profiles')
      .select('user_id, bio, headline, skills, interests, looking_for, organization, job_title')
      .eq('user_id', targetUserId)
      .single();

    if (profileError || !profile) {
      logError('Profile not found', profileError);
      logRequestComplete(404);
      return errorResponse('Profile not found', 404, corsHeaders);
    }

    const typedProfile = profile as ProfileData;

    // 5. Check if refresh needed
    const sourceHash = hashProfileData(typedProfile);
    
    if (!forceRefresh) {
      const { data: existing } = await supabase
        .from('profile_embeddings')
        .select('source_hash, last_updated')
        .eq('user_id', targetUserId)
        .single();
        
      if (existing && existing.source_hash === sourceHash) {
        logInfo('Embeddings up to date', { userId: targetUserId });
        logRequestComplete(200);
        return successResponse({ 
          success: true, 
          message: 'Embeddings already up to date',
          cached: true
        }, corsHeaders);
      }
    }

    // 6. Generate embeddings
    logInfo('Generating embeddings', { userId: targetUserId });
    
    const bioText = buildTextForEmbedding(typedProfile, 'bio');
    const skillsText = buildTextForEmbedding(typedProfile, 'skills');
    const interestsText = buildTextForEmbedding(typedProfile, 'interests');
    const goalsText = buildTextForEmbedding(typedProfile, 'goals');
    const combinedText = buildTextForEmbedding(typedProfile, 'combined');

    const [bioEmb, skillsEmb, interestsEmb, goalsEmb, combinedEmb] = await Promise.all([
      bioText.length > 5 ? generateEmbedding(bioText) : null,
      skillsText.length > 5 ? generateEmbedding(skillsText) : null,
      interestsText.length > 5 ? generateEmbedding(interestsText) : null,
      goalsText.length > 5 ? generateEmbedding(goalsText) : null,
      combinedText.length > 20 ? generateEmbedding(combinedText) : null,
    ]);

    const userEmbedding = combinedEmb ? compressEmbedding(combinedEmb) : null;
    const qualityScore = [bioEmb, skillsEmb, interestsEmb, goalsEmb].filter(Boolean).length / 4;

    // 7. Store embeddings
    const { error: upsertError } = await supabase
      .from('profile_embeddings')
      .upsert({
        user_id: targetUserId,
        bio_embedding: bioEmb ? `[${bioEmb.join(',')}]` : null,
        skills_embedding: skillsEmb ? `[${skillsEmb.join(',')}]` : null,
        interests_embedding: interestsEmb ? `[${interestsEmb.join(',')}]` : null,
        goals_embedding: goalsEmb ? `[${goalsEmb.join(',')}]` : null,
        user_embedding: userEmbedding ? `[${userEmbedding.join(',')}]` : null,
        embedding_version: 1,
        source_hash: sourceHash,
        last_updated: new Date().toISOString(),
        is_complete: qualityScore === 1,
        quality_score: qualityScore
      });

    if (upsertError) {
      logError('Failed to store embeddings', upsertError);
      logRequestComplete(500);
      return errorResponse('Failed to store embeddings', 500, corsHeaders);
    }

    logInfo('Embeddings generated successfully', { 
      userId: targetUserId, 
      qualityScore 
    });
    
    logRequestComplete(200);
    return successResponse({ 
      success: true,
      quality_score: qualityScore,
      is_complete: qualityScore === 1
    }, corsHeaders);

  } catch (error) {
    logError('Generate embedding error', error);
    logRequestComplete(500);
    return errorResponse('Internal server error', 500, corsHeaders);
  }
});
