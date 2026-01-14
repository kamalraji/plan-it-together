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

// Themes and styles for certificate backgrounds
const THEMES = [
  { id: 'formal', prompts: ['formal ceremony backdrop with elegant marble textures', 'regal governmental document style background'] },
  { id: 'celebration', prompts: ['celebration with subtle confetti and festive elements', 'achievement celebration with warm lighting'] },
  { id: 'corporate', prompts: ['professional corporate office environment', 'modern business setting with clean lines'] },
  { id: 'academic', prompts: ['university campus with classical architecture', 'scholarly library with books and knowledge symbols'] },
  { id: 'tech', prompts: ['futuristic technology with circuit patterns', 'digital innovation with abstract data flows'] },
  { id: 'creative', prompts: ['artistic studio with paint splashes and brushstrokes', 'creative workshop with colorful elements'] },
  { id: 'nature', prompts: ['serene nature landscape with trees and mountains', 'environmental sustainability with green elements'] },
  { id: 'awards', prompts: ['award ceremony stage with spotlights', 'trophy display with golden accents'] },
];

const STYLES = [
  { id: 'elegant', modifier: 'elegant sophisticated refined luxurious' },
  { id: 'modern', modifier: 'modern contemporary sleek minimalist' },
  { id: 'minimal', modifier: 'minimal clean simple subtle' },
  { id: 'vibrant', modifier: 'vibrant colorful dynamic energetic' },
  { id: 'classic', modifier: 'classic traditional timeless vintage' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for admin authentication
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

    // Parse request body
    const { theme, style, generateAll = false } = await req.json();

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { theme: string; style: string; url: string; error?: string }[] = [];

    // Generate backgrounds based on request
    const themesToProcess = generateAll ? THEMES : THEMES.filter(t => t.id === theme);
    const stylesToProcess = generateAll ? STYLES : STYLES.filter(s => s.id === style);

    for (const themeConfig of themesToProcess) {
      for (const styleConfig of stylesToProcess) {
        try {
          console.log(`Generating: ${themeConfig.id}/${styleConfig.id}`);
          
          // Create a unique prompt for this combination
          const basePrompt = themeConfig.prompts[Math.floor(Math.random() * themeConfig.prompts.length)];
          const prompt = `A4 landscape certificate background (842x595 pixels), ${basePrompt}, ${styleConfig.modifier} style. Abstract, elegant, suitable for formal document. No text, no people, no faces. Professional gradients and subtle patterns. Ultra high resolution.`;

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

          // Upload to Supabase Storage
          const fileName = `${themeConfig.id}/${styleConfig.id}-01.png`;
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
            theme: themeConfig.id,
            style: styleConfig.id,
            url: urlData.publicUrl,
          });

          console.log(`Successfully generated: ${themeConfig.id}/${styleConfig.id}`);

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error generating ${themeConfig.id}/${styleConfig.id}:`, error);
          results.push({
            theme: themeConfig.id,
            style: styleConfig.id,
            url: '',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
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
