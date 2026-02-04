import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const VERSION = "v1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  type: "task_description" | "message_compose" | "summarize" | "suggest_subtasks";
  content: string;
  context?: {
    workspaceName?: string;
    channelName?: string;
    taskTitle?: string;
  };
}

serve(async (req) => {
  console.log(`[${VERSION}] AI Content Assist request received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error(`[${VERSION}] LOVABLE_API_KEY not configured`);
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { type, content, context }: RequestBody = await req.json();

    if (!type || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type and content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "task_description":
        systemPrompt = `You are a helpful assistant that writes clear, actionable task descriptions for project management. 
Keep descriptions concise (2-3 sentences max), focused on the outcome, and include acceptance criteria when relevant.
Context: Workspace "${context?.workspaceName || 'Unknown'}"`;
        userPrompt = `Write a professional task description for: "${content}"`;
        break;

      case "message_compose":
        systemPrompt = `You are a professional communication assistant. Write clear, friendly, and appropriately formal messages.
Keep messages concise and to the point. Match the tone to the context.
Context: Channel "${context?.channelName || 'general'}"`;
        userPrompt = `Help me write a message about: "${content}"`;
        break;

      case "summarize":
        systemPrompt = `You are a summarization expert. Create clear, concise summaries that capture key points.
Use bullet points for multiple items. Keep summaries under 100 words.`;
        userPrompt = `Summarize the following content:\n\n${content}`;
        break;

      case "suggest_subtasks":
        systemPrompt = `You are a project planning expert. Break down tasks into actionable subtasks.
Each subtask should be specific, measurable, and achievable. Suggest 3-5 subtasks.`;
        userPrompt = `Break down this task into subtasks: "${context?.taskTitle || content}"
        
Task description: ${content}`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Invalid type: ${type}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log(`[${VERSION}] Calling AI gateway for type: ${type}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error(`[${VERSION}] Rate limit exceeded`);
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error(`[${VERSION}] Payment required`);
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error(`[${VERSION}] AI gateway error:`, response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || "";

    console.log(`[${VERSION}] Successfully generated content for type: ${type}`);

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        type,
        _version: VERSION,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[${VERSION}] Error:`, error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        _version: VERSION,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
