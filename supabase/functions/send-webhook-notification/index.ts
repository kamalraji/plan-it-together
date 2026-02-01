import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z, uuidSchema, notificationTypeSchema, parseAndValidate } from "../_shared/validation.ts";
import { requireAuth, verifyWorkspaceAccess, forbiddenResponse } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod schema for webhook payload (strict mode)
const webhookPayloadSchema = z.object({
  workspace_id: uuidSchema,
  notification_type: notificationTypeSchema,
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message too long"),
  metadata: z.object({
    task_id: uuidSchema.optional(),
    channel_id: uuidSchema.optional(),
    sender_name: z.string().max(100).optional(),
    due_date: z.string().max(50).optional(),
    priority: z.string().max(20).optional(),
    url: z.string().url().max(2048).optional(),
  }).strict().optional(),
}).strict();

type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

interface Integration {
  id: string;
  platform: 'slack' | 'discord' | 'teams' | 'webhook';
  webhook_url: string;
  notification_types: string[];
}

function formatSlackMessage(payload: WebhookPayload) {
  const blocks: unknown[] = [
    { type: "header", text: { type: "plain_text", text: payload.title, emoji: true } },
    { type: "section", text: { type: "mrkdwn", text: payload.message } }
  ];
  if (payload.metadata?.url) {
    blocks.push({ type: "actions", elements: [{ type: "button", text: { type: "plain_text", text: "View in App", emoji: true }, url: payload.metadata.url }] });
  }
  return { blocks, text: `${payload.title}: ${payload.message}` };
}

function formatDiscordMessage(payload: WebhookPayload) {
  const embed: Record<string, unknown> = { title: payload.title, description: payload.message, color: getColorForType(payload.notification_type), timestamp: new Date().toISOString() };
  if (payload.metadata?.sender_name) embed.author = { name: payload.metadata.sender_name };
  if (payload.metadata?.url) embed.url = payload.metadata.url;
  const fields: Array<{ name: string; value: string; inline: boolean }> = [];
  if (payload.metadata?.priority) fields.push({ name: "Priority", value: payload.metadata.priority, inline: true });
  if (payload.metadata?.due_date) fields.push({ name: "Due Date", value: payload.metadata.due_date, inline: true });
  if (fields.length > 0) embed.fields = fields;
  return { embeds: [embed] };
}

function formatTeamsMessage(payload: WebhookPayload) {
  const card: Record<string, unknown> = { "@type": "MessageCard", "@context": "http://schema.org/extensions", themeColor: getColorHexForType(payload.notification_type), summary: payload.title, sections: [{ activityTitle: payload.title, activitySubtitle: payload.metadata?.sender_name || "System", text: payload.message }] };
  if (payload.metadata?.url) card.potentialAction = [{ "@type": "OpenUri", name: "View in App", targets: [{ os: "default", uri: payload.metadata.url }] }];
  return card;
}

function formatGenericWebhook(payload: WebhookPayload) {
  return { type: payload.notification_type, title: payload.title, message: payload.message, metadata: payload.metadata, timestamp: new Date().toISOString() };
}

function getColorForType(type: string): number {
  switch (type) { case 'broadcast': return 0x3B82F6; case 'task_assignment': return 0x10B981; case 'deadline_reminder': return 0xF59E0B; default: return 0x6B7280; }
}

function getColorHexForType(type: string): string {
  switch (type) { case 'broadcast': return '3B82F6'; case 'task_assignment': return '10B981'; case 'deadline_reminder': return 'F59E0B'; default: return '6B7280'; }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // ===== AUTHENTICATION CHECK =====
    const authResult = await requireAuth(req, corsHeaders);
    if (!authResult.success) {
      return authResult.response;
    }

    const parseResult = await parseAndValidate(req, webhookPayloadSchema, corsHeaders);
    if (!parseResult.success) return parseResult.response;

    const payload = parseResult.data;

    // ===== AUTHORIZATION CHECK - Workspace access required =====
    const hasAccess = await verifyWorkspaceAccess(authResult.serviceClient, authResult.user.id, payload.workspace_id);
    if (!hasAccess) {
      return forbiddenResponse("You do not have permission to send notifications for this workspace", corsHeaders);
    }

    console.log('User', authResult.user.id, 'sending webhook notification:', payload);

    const { data: integrations, error: fetchError } = await authResult.serviceClient
      .from('workspace_integrations')
      .select('id, platform, webhook_url, notification_types')
      .eq('workspace_id', payload.workspace_id)
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching integrations:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch integrations' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const relevantIntegrations = (integrations || []).filter((int: Integration) => int.notification_types.includes(payload.notification_type));
    console.log(`Found ${relevantIntegrations.length} relevant integrations for ${payload.notification_type}`);

    if (relevantIntegrations.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No active integrations for this notification type' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results = await Promise.allSettled(relevantIntegrations.map(async (integration: Integration) => {
      let body: unknown;
      switch (integration.platform) {
        case 'slack': body = formatSlackMessage(payload); break;
        case 'discord': body = formatDiscordMessage(payload); break;
        case 'teams': body = formatTeamsMessage(payload); break;
        default: body = formatGenericWebhook(payload);
      }
      console.log(`Sending to ${integration.platform}:`, integration.webhook_url);
      const response = await fetch(integration.webhook_url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error(`${integration.platform} webhook failed: ${response.status}`);
      return { platform: integration.platform, success: true };
    }));

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) console.error('Some webhooks failed:', failed);

    return new Response(JSON.stringify({ success: true, sent: successful, total: relevantIntegrations.length, failures: failed.map(f => (f as PromiseRejectedResult).reason?.message) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error processing webhook notification:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});