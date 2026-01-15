import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Orientations for certificate backgrounds
const ORIENTATIONS = [
  { id: 'landscape', dimensions: '842x595 pixels', aspectDesc: 'A4 landscape, wider than tall' },
  { id: 'portrait', dimensions: '595x842 pixels', aspectDesc: 'A4 portrait, taller than wide' },
];

// Themes with refined, subtle prompts for certificate backgrounds
const THEMES = [
  { id: 'formal', prompts: ['subtle cream and gold gradient with delicate corner ornaments', 'soft ivory background with faint watermark pattern and thin golden border'] },
  { id: 'celebration', prompts: ['warm champagne gradient with very subtle sparkle texture', 'soft peach to cream gradient with elegant light rays'] },
  { id: 'corporate', prompts: ['clean slate blue to white gradient with geometric corner accents', 'professional navy edge fade with crisp white center'] },
  { id: 'academic', prompts: ['parchment texture with subtle laurel wreath watermark', 'classic ivory with faint book spine pattern border'] },
  { id: 'tech', prompts: ['soft blue gradient with subtle circuit line accents in corners', 'minimal gray gradient with faint hexagonal pattern'] },
  { id: 'creative', prompts: ['soft watercolor wash in muted pastels around edges', 'gentle gradient with abstract brush stroke accents'] },
  { id: 'nature', prompts: ['soft sage green gradient with delicate leaf silhouettes in corners', 'calm earth tones with subtle organic texture'] },
  { id: 'awards', prompts: ['warm gold gradient fading to cream with subtle ribbon motif', 'champagne background with elegant trophy silhouette watermark'] },
];

// Refined styles - more subtle modifiers
const STYLES = [
  { id: 'elegant', modifier: 'sophisticated, refined, subtle luxury, understated' },
  { id: 'modern', modifier: 'clean, contemporary, minimalist, geometric' },
  { id: 'minimal', modifier: 'very simple, mostly blank, sparse details, clean' },
  { id: 'vibrant', modifier: 'slightly brighter colors, still professional, tasteful' },
  { id: 'classic', modifier: 'timeless, traditional, dignified, formal' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for authentication (admin check temporarily removed for background generation)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // NOTE: Admin role check temporarily disabled for background generation
    console.log(`User ${user.id} triggering certificate background generation`);

    // Parse request body
    const { theme, style, generateAll = false } = await req.json();

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { orientation: string; theme: string; style: string; url: string; error?: string }[] = [];

    // Generate backgrounds based on request - now includes orientations
    const themesToProcess = generateAll ? THEMES : THEMES.filter(t => t.id === theme);
    const stylesToProcess = generateAll ? STYLES : STYLES.filter(s => s.id === style);
    const orientationsToProcess = ORIENTATIONS;

    for (const orientation of orientationsToProcess) {
      for (const themeConfig of themesToProcess) {
        for (const styleConfig of stylesToProcess) {
          try {
            console.log(`Generating: ${orientation.id}/${themeConfig.id}/${styleConfig.id}`);
            
            // Create a refined, subtle prompt for this combination
            const basePrompt = themeConfig.prompts[Math.floor(Math.random() * themeConfig.prompts.length)];
            const prompt = `Professional certificate background, ${orientation.aspectDesc} (${orientation.dimensions}). ${basePrompt}. Style: ${styleConfig.modifier}. IMPORTANT: Subtle and understated design suitable for formal documents. Large empty center area for text. Decorative elements only in corners or edges. No text, no people, no faces. Soft gradients, muted colors. Ultra high resolution, print quality.`;

            // Generate image using Lovable AI
            const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash-image-preview',
                messages: [{ role: 'user', content: prompt }],
                modalities: ['image', 'text'],
              }),
            });

            if (!response.ok) {
              throw new Error(`Image generation failed: ${response.statusText}`);
            }

            const data = await response.json();
            const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

            if (!imageBase64) {
              throw new Error('No image returned from AI');
            }

            // Extract base64 data (remove data:image/png;base64, prefix)
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

            // Upload to Supabase Storage with orientation in path
            const fileName = `${orientation.id}/${themeConfig.id}/${styleConfig.id}-01.png`;
            const { error: uploadError } = await supabase.storage
              .from('certificate-backgrounds')
              .upload(fileName, imageBuffer, {
                contentType: 'image/png',
                upsert: true,
              });

            if (uploadError) {
              throw uploadError;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('certificate-backgrounds')
              .getPublicUrl(fileName);

            results.push({
              orientation: orientation.id,
              theme: themeConfig.id,
              style: styleConfig.id,
              url: urlData.publicUrl,
            });

            console.log(`Successfully generated: ${orientation.id}/${themeConfig.id}/${styleConfig.id}`);

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Error generating ${orientation.id}/${themeConfig.id}/${styleConfig.id}:`, error);
            results.push({
              orientation: orientation.id,
              theme: themeConfig.id,
              style: styleConfig.id,
              url: '',
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-certificate-backgrounds:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
