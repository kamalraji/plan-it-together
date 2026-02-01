import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z, uuidSchema, workspaceRoleSchema, parseAndValidate } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod schema for respond request (strict mode)
const respondSchema = z.object({
  request_id: uuidSchema,
  action: z.enum(["approve", "reject"], { 
    errorMap: () => ({ message: 'Action must be "approve" or "reject"' })
  }),
  role: workspaceRoleSchema.optional(),
  review_notes: z.string().trim().max(500, "Review notes too long").optional(),
}).strict();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
    const parseResult = await parseAndValidate(req, respondSchema, corsHeaders);
    if (!parseResult.success) {
      return parseResult.response;
    }

    const { request_id, action, role, review_notes } = parseResult.data;

    console.log(`User ${user.id} responding to access request ${request_id} with action: ${action}`);

    const { data: accessRequest, error: requestError } = await supabase
      .from('workspace_access_requests')
      .select('*, workspaces(id, name, organizer_id)')
      .eq('id', request_id)
      .eq('status', 'PENDING')
      .single();

    if (requestError || !accessRequest) {
      console.error('Access request lookup error:', requestError);
      return new Response(
        JSON.stringify({ error: 'Access request not found or already processed' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (accessRequest.workspaces.organizer_id !== user.id) {
      console.error(`User ${user.id} is not the owner of workspace. Owner is ${accessRequest.workspaces.organizer_id}`);
      return new Response(
        JSON.stringify({ error: 'Only the workspace owner can respond to access requests' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const { error: updateError } = await supabase
      .from('workspace_access_requests')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        review_notes,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', request_id);

    if (updateError) {
      console.error('Error updating access request:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update access request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'approve') {
      // Determine and validate role
      let memberRole = role || accessRequest.requested_role || 'VOLUNTEER_COORDINATOR';
      
      // Runtime validation for role from database (requested_role might be invalid legacy data)
      const roleValidation = workspaceRoleSchema.safeParse(memberRole);
      if (!roleValidation.success) {
        console.warn(`Invalid role "${memberRole}" found, defaulting to VOLUNTEER_COORDINATOR`);
        memberRole = 'VOLUNTEER_COORDINATOR';
      }
      
      const { error: memberInsertError } = await supabase
        .from('workspace_team_members')
        .insert({
          workspace_id: accessRequest.workspace_id,
          user_id: accessRequest.user_id,
          role: memberRole,
          status: 'ACTIVE',
        });

      if (memberInsertError) {
        console.error('Error adding team member:', memberInsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to add user to workspace' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase
        .from('notifications')
        .insert({
          user_id: accessRequest.user_id,
          title: 'Access Request Approved',
          message: `Your request to join "${accessRequest.workspaces.name}" has been approved. You've been added as ${memberRole.replace(/_/g, ' ')}.`,
          type: 'workspace',
          category: 'workspace',
          action_url: `/console/workspaces/${accessRequest.workspace_id}`,
          action_label: 'View Workspace',
        });

      console.log(`User ${accessRequest.user_id} approved and added to workspace ${accessRequest.workspace_id}`);
    } else {
      await supabase
        .from('notifications')
        .insert({
          user_id: accessRequest.user_id,
          title: 'Access Request Declined',
          message: `Your request to join "${accessRequest.workspaces.name}" was not approved.${review_notes ? ` Reason: ${review_notes}` : ''}`,
          type: 'workspace',
          category: 'workspace',
        });

      console.log(`Access request ${request_id} rejected for user ${accessRequest.user_id}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Access request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        status: newStatus 
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
