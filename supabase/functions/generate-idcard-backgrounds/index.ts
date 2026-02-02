import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackgroundSpec {
  theme: string;
  style: string;
  prompt: string;
}

// Background generation specifications
const BACKGROUND_SPECS: BackgroundSpec[] = [
  // Technology theme
  { theme: 'technology', style: 'professional', prompt: 'Abstract professional technology background with subtle circuit board patterns, blue gradient, clean and corporate, suitable for ID card' },
  { theme: 'technology', style: 'modern', prompt: 'Modern technology background with flowing digital lines, cyan and blue gradient, futuristic and sleek, suitable for ID card' },
  { theme: 'technology', style: 'minimal', prompt: 'Minimal technology background with subtle geometric patterns, light gray with blue accents, clean and simple, suitable for ID card' },
  { theme: 'technology', style: 'vibrant', prompt: 'Vibrant technology background with neon purple and pink gradients, digital abstract patterns, energetic, suitable for ID card' },
  { theme: 'technology', style: 'elegant', prompt: 'Elegant technology background with deep blue gradient, subtle tech patterns, sophisticated and professional, suitable for ID card' },

  // Medical theme
  { theme: 'medical', style: 'professional', prompt: 'Professional healthcare background with subtle medical symbols, sky blue gradient, clean and trustworthy, suitable for ID card' },
  { theme: 'medical', style: 'modern', prompt: 'Modern healthcare background with abstract cellular patterns, teal and green gradient, fresh and innovative, suitable for ID card' },
  { theme: 'medical', style: 'minimal', prompt: 'Minimal healthcare background with clean lines, white with teal accents, sterile and professional, suitable for ID card' },
  { theme: 'medical', style: 'vibrant', prompt: 'Vibrant healthcare background with cyan and aqua gradients, dynamic health symbols, energetic, suitable for ID card' },
  { theme: 'medical', style: 'elegant', prompt: 'Elegant healthcare background with deep blue gradient, subtle DNA helix patterns, sophisticated, suitable for ID card' },

  // Corporate theme
  { theme: 'corporate', style: 'professional', prompt: 'Professional corporate background with subtle geometric patterns, navy blue gradient, executive and authoritative, suitable for ID card' },
  { theme: 'corporate', style: 'modern', prompt: 'Modern corporate background with abstract business patterns, slate gray gradient, contemporary office style, suitable for ID card' },
  { theme: 'corporate', style: 'minimal', prompt: 'Minimal corporate background with clean lines, charcoal with light accents, simple and professional, suitable for ID card' },
  { theme: 'corporate', style: 'vibrant', prompt: 'Dynamic corporate background with bold blue gradients, modern business patterns, energetic professional, suitable for ID card' },
  { theme: 'corporate', style: 'elegant', prompt: 'Elegant corporate background with dark slate gradient, subtle executive patterns, luxury business style, suitable for ID card' },

  // Conference theme
  { theme: 'conference', style: 'professional', prompt: 'Professional conference background with stage lighting effects, purple gradient, event-ready, suitable for ID card' },
  { theme: 'conference', style: 'modern', prompt: 'Modern conference background with abstract event patterns, indigo gradient, contemporary summit style, suitable for ID card' },
  { theme: 'conference', style: 'minimal', prompt: 'Minimal conference background with subtle spotlight patterns, violet with clean lines, simple event style, suitable for ID card' },
  { theme: 'conference', style: 'vibrant', prompt: 'Vibrant conference background with neon stage lights, purple and pink gradients, festival energy, suitable for ID card' },
  { theme: 'conference', style: 'elegant', prompt: 'Elegant conference background with gala lighting, deep purple gradient, luxury event style, suitable for ID card' },

  // Education theme
  { theme: 'education', style: 'professional', prompt: 'Professional education background with subtle academic patterns, navy blue gradient, scholarly and authoritative, suitable for ID card' },
  { theme: 'education', style: 'modern', prompt: 'Modern education background with abstract learning symbols, cyan and blue gradient, innovative campus style, suitable for ID card' },
  { theme: 'education', style: 'minimal', prompt: 'Minimal education background with clean lines, gray with subtle book patterns, simple academic style, suitable for ID card' },
  { theme: 'education', style: 'vibrant', prompt: 'Vibrant education background with warm yellow and orange accents, creative learning patterns, energetic, suitable for ID card' },
  { theme: 'education', style: 'elegant', prompt: 'Elegant education background with deep navy gradient, ivy league patterns, prestigious academic style, suitable for ID card' },

  // Creative theme
  { theme: 'creative', style: 'professional', prompt: 'Professional creative background with artistic brush strokes, pink gradient, studio quality, suitable for ID card' },
  { theme: 'creative', style: 'modern', prompt: 'Modern creative background with abstract art patterns, orange gradient, contemporary gallery style, suitable for ID card' },
  { theme: 'creative', style: 'minimal', prompt: 'Minimal creative background with subtle canvas texture, warm gray with artistic accents, clean design, suitable for ID card' },
  { theme: 'creative', style: 'vibrant', prompt: 'Vibrant creative background with color splashes, red and orange gradients, artistic explosion, suitable for ID card' },
  { theme: 'creative', style: 'elegant', prompt: 'Elegant creative background with refined artistic patterns, deep rose gradient, sophisticated art style, suitable for ID card' },

  // Nature theme
  { theme: 'nature', style: 'professional', prompt: 'Professional nature background with subtle leaf patterns, emerald green gradient, eco-corporate style, suitable for ID card' },
  { theme: 'nature', style: 'modern', prompt: 'Modern nature background with abstract botanical patterns, bright green gradient, fresh eco design, suitable for ID card' },
  { theme: 'nature', style: 'minimal', prompt: 'Minimal nature background with subtle plant patterns, lime green with clean lines, simple organic style, suitable for ID card' },
  { theme: 'nature', style: 'vibrant', prompt: 'Vibrant nature background with lush foliage patterns, bright green gradients, spring energy, suitable for ID card' },
  { theme: 'nature', style: 'elegant', prompt: 'Elegant nature background with refined botanical patterns, deep forest green gradient, luxury eco style, suitable for ID card' },

  // Abstract theme
  { theme: 'abstract', style: 'professional', prompt: 'Professional abstract background with geometric shapes, indigo and purple gradient, sophisticated patterns, suitable for ID card' },
  { theme: 'abstract', style: 'modern', prompt: 'Modern abstract background with flowing shapes, teal and cyan gradient, contemporary design, suitable for ID card' },
  { theme: 'abstract', style: 'minimal', prompt: 'Minimal abstract background with simple geometric lines, gray gradient, clean and modern, suitable for ID card' },
  { theme: 'abstract', style: 'vibrant', prompt: 'Vibrant abstract background with bold shapes, rose and pink gradients, energetic patterns, suitable for ID card' },
  { theme: 'abstract', style: 'elegant', prompt: 'Elegant abstract background with refined geometric patterns, indigo to purple gradient, sophisticated design, suitable for ID card' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated (admin check temporarily removed for background generation)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // NOTE: Admin role check temporarily disabled for background generation
    // Uncomment the following block after generation is complete:
    /*
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    */

    console.log(`User ${user.id} triggering background generation`);

    const { action, theme, style } = await req.json();

    if (action === 'generate-single') {
      // Generate a single background
      const spec = BACKGROUND_SPECS.find(s => s.theme === theme && s.style === style);
      if (!spec) {
        return new Response(
          JSON.stringify({ error: 'Invalid theme/style combination' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate image using Lovable AI
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [{
            role: "user",
            content: `${spec.prompt}. Create a 16:10 aspect ratio image (like 324x204 pixels). Abstract background only, no text, no faces, no people. High quality, professional design suitable for an ID card background.`
          }],
          modalities: ["image", "text"]
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`AI generation failed: ${response.status}`);
      }

      const data = await response.json();
      const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageBase64) {
        throw new Error('No image generated');
      }

      // Extract base64 data
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // Upload to Supabase Storage
      const filePath = `${theme}/${style}-01.png`;
      const { error: uploadError } = await supabase.storage
        .from('idcard-backgrounds')
        .upload(filePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: publicUrl } = supabase.storage
        .from('idcard-backgrounds')
        .getPublicUrl(filePath);

      return new Response(
        JSON.stringify({ 
          success: true, 
          imageUrl: publicUrl.publicUrl,
          theme,
          style
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'generate-all') {
      // Generate all backgrounds (this would be called in batches)
      const results = [];
      
      for (const spec of BACKGROUND_SPECS) {
        try {
          // Add delay between generations to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
          if (!LOVABLE_API_KEY) continue;

          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image-preview",
              messages: [{
                role: "user",
                content: `${spec.prompt}. Create a 16:10 aspect ratio image (like 324x204 pixels). Abstract background only, no text, no faces, no people. High quality, professional design suitable for an ID card background.`
              }],
              modalities: ["image", "text"]
            })
          });

          if (!response.ok) continue;

          const data = await response.json();
          const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (!imageBase64) continue;

          const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
          const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

          const filePath = `${spec.theme}/${spec.style}-01.png`;
          await supabase.storage
            .from('idcard-backgrounds')
            .upload(filePath, imageBuffer, {
              contentType: 'image/png',
              upsert: true
            });

          results.push({ theme: spec.theme, style: spec.style, success: true });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error(`Failed to generate ${spec.theme}/${spec.style}:`, err);
          results.push({ theme: spec.theme, style: spec.style, success: false, error: errorMessage });
        }
      }

      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list-specs') {
      return new Response(
        JSON.stringify({ specs: BACKGROUND_SPECS }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
