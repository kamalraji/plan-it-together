import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z, uuidSchema, emailSchema, workspaceRoleSchema, parseAndValidate } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod schema for invite request (strict mode)
const inviteSchema = z.object({
  workspace_id: uuidSchema,
  email: emailSchema,
  role: workspaceRoleSchema,
  custom_message: z.string().trim().max(500, "Message too long").optional(),
}).strict();

// Helper function to log audit events
async function logAuditEvent(
  supabase: any,
  params: {
    workspace_id: string;
    actor_id: string;
    actor_email?: string;
    action: string;
    target_user_id?: string;
    target_email?: string;
    previous_value?: any;
    new_value?: any;
    metadata?: any;
    ip_address?: string;
    user_agent?: string;
  }
) {
  try {
    await supabase.from('workspace_audit_logs').insert({
      workspace_id: params.workspace_id,
      actor_id: params.actor_id,
      actor_email: params.actor_email,
      action: params.action,
      target_user_id: params.target_user_id,
      target_email: params.target_email,
      previous_value: params.previous_value,
      new_value: params.new_value,
      metadata: params.metadata,
      ip_address: params.ip_address,
      user_agent: params.user_agent,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const parseResult = await parseAndValidate(req, inviteSchema, corsHeaders);
    if (!parseResult.success) {
      return parseResult.response;
    }

    const { workspace_id, email, role, custom_message } = parseResult.data;

    console.log(`User ${user.id} attempting to invite ${email} to workspace ${workspace_id} with role ${role}`);

    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, organizer_id, name')
      .eq('id', workspace_id)
      .single();

    if (workspaceError || !workspace) {
      console.error('Workspace lookup error:', workspaceError);
      return new Response(
        JSON.stringify({ error: 'Workspace not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (workspace.organizer_id !== user.id) {
      console.error(`User ${user.id} is not the owner of workspace ${workspace_id}. Owner is ${workspace.organizer_id}`);
      return new Response(
        JSON.stringify({ error: 'Only the workspace owner can invite members' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: authUsers, error: authLookupError } = await supabase.auth.admin.listUsers();
    
    let targetUserId: string | null = null;
    if (!authLookupError && authUsers?.users) {
      const foundUser = authUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (foundUser) {
        targetUserId = foundUser.id;
      }
    }

    if (targetUserId) {
      const { data: existingMember } = await supabase
        .from('workspace_team_members')
        .select('id')
        .eq('workspace_id', workspace_id)
        .eq('user_id', targetUserId)
        .eq('status', 'ACTIVE')
        .single();

      if (existingMember) {
        return new Response(
          JSON.stringify({ error: 'User is already a member of this workspace' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: existingInvitation } = await supabase
      .from('workspace_invitations')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('email', email.toLowerCase())
      .eq('status', 'PENDING')
      .single();

    if (existingInvitation) {
      return new Response(
        JSON.stringify({ error: 'An invitation is already pending for this email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (targetUserId) {
      const { error: memberInsertError } = await supabase
        .from('workspace_team_members')
        .insert({
          workspace_id,
          user_id: targetUserId,
          role,
          status: 'ACTIVE',
        });

      if (memberInsertError) {
        console.error('Error adding team member:', memberInsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to add team member' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await logAuditEvent(supabase, {
        workspace_id,
        actor_id: user.id,
        actor_email: user.email,
        action: 'MEMBER_ADDED',
        target_user_id: targetUserId,
        target_email: email.toLowerCase(),
        new_value: { role, status: 'ACTIVE' },
        metadata: {
          workspace_name: workspace.name,
          method: 'direct_add',
          custom_message: custom_message || null,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          title: 'Workspace Invitation Accepted',
          message: `You have been added to the workspace "${workspace.name}" as ${role.replace(/_/g, ' ')}`,
          type: 'workspace',
          category: 'workspace',
          action_url: `/console/workspaces/${workspace_id}`,
          action_label: 'View Workspace',
        });

      console.log(`User ${targetUserId} added directly to workspace ${workspace_id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User added to workspace successfully',
          direct_add: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: invitation, error: inviteError } = await supabase
      .from('workspace_invitations')
      .insert({
        workspace_id,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
        custom_message,
        status: 'PENDING',
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await logAuditEvent(supabase, {
      workspace_id,
      actor_id: user.id,
      actor_email: user.email,
      action: 'INVITATION_SENT',
      target_email: email.toLowerCase(),
      new_value: { role, status: 'PENDING', invitation_id: invitation.id },
      metadata: {
        workspace_name: workspace.name,
        method: 'email_invitation',
        custom_message: custom_message || null,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    console.log(`Invitation created for ${email} to workspace ${workspace_id}:`, invitation.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation sent successfully',
        invitation_id: invitation.id,
        direct_add: false 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
