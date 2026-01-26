import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskSuggestionRequest {
  eventName: string;
  eventCategory: string;
  startDate: string;
  endDate?: string;
  existingTasks: string[];
  workspaceType?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authResult = await requireAuth(req, corsHeaders);
    if (!authResult.success) {
      return authResult.response;
    }

    const { eventName, eventCategory, startDate, endDate, existingTasks, workspaceType } = await req.json() as TaskSuggestionRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`User ${authResult.user.id} requesting task suggestions for event: ${eventName}`);

    // Calculate days until event
    const now = new Date();
    const eventStart = new Date(startDate);
    const daysUntilEvent = Math.ceil((eventStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine phase based on timeline
    let suggestedPhase = 'PRE_EVENT';
    if (daysUntilEvent <= 0 && endDate) {
      const eventEnd = new Date(endDate);
      if (now <= eventEnd) {
        suggestedPhase = 'DURING_EVENT';
      } else {
        suggestedPhase = 'POST_EVENT';
      }
    }

    const systemPrompt = `You are an expert event planner assistant. Based on the event context provided, suggest 3-5 actionable tasks that are:
1. Specific to the event type and category
2. Appropriate for the current timeline (${daysUntilEvent} days until event)
3. Not duplicating any existing tasks
4. Organized by priority and phase
5. Practical and immediately actionable

Focus on tasks that are commonly overlooked but critical for event success. Consider the workspace type for appropriate scope of tasks.`;

    const userPrompt = `Event Context:
- Name: ${eventName}
- Category: ${eventCategory}
- Start Date: ${startDate}
- Days Until Event: ${daysUntilEvent}
- Current Phase: ${suggestedPhase}
- Workspace Type: ${workspaceType || 'GENERAL'}
- Existing Tasks: ${existingTasks.length > 0 ? existingTasks.join(', ') : 'None yet'}

Please suggest 3-5 new tasks that would be most valuable to add right now. Avoid suggesting tasks that duplicate the existing ones.`;

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
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_tasks",
              description: "Return 3-5 actionable task suggestions for the event.",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Clear, actionable task title" },
                        description: { type: "string", description: "Brief description of what needs to be done" },
                        category: { 
                          type: "string", 
                          enum: ["SETUP", "MARKETING", "LOGISTICS", "TECHNICAL", "REGISTRATION", "FINANCE", "VOLUNTEER", "OPERATIONS", "CONTENT", "CATERING", "POST_EVENT", "SAFETY"],
                          description: "Task category"
                        },
                        priority: { 
                          type: "string", 
                          enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
                          description: "Task priority level"
                        },
                        phase: {
                          type: "string",
                          enum: ["PRE_EVENT", "DURING_EVENT", "POST_EVENT"],
                          description: "Event phase for this task"
                        },
                        estimatedHours: { 
                          type: "number", 
                          description: "Estimated hours to complete"
                        },
                        subtasks: {
                          type: "array",
                          items: { type: "string" },
                          description: "Optional list of subtasks"
                        }
                      },
                      required: ["title", "description", "category", "priority", "phase"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["suggestions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_tasks" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    // Extract suggestions from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsedArgs = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ suggestions: parsedArgs.suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse from content if tool calling didn't work
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify({ suggestions: parsed.suggestions || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        console.error("Failed to parse content as JSON:", content);
      }
    }

    return new Response(JSON.stringify({ suggestions: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in suggest-tasks function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});