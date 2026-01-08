import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestAccessBody {
  workspace_id: string;
  requested_role?: string;
  message?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the current user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestAccessBody = await req.json();
    const { workspace_id, requested_role, message } = body;

    if (!workspace_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: workspace_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} requesting access to workspace ${workspace_id}`);

    // Check if workspace exists
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name, organizer_id')
      .eq('id', workspace_id)
      .single();

    if (workspaceError || !workspace) {
      console.error('Workspace lookup error:', workspaceError);
      return new Response(
        JSON.stringify({ error: 'Workspace not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is the owner
    if (workspace.organizer_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'You are the owner of this workspace' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('workspace_team_members')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .single();

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: 'You are already a member of this workspace' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabase
      .from('workspace_access_requests')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'PENDING')
      .single();

    if (existingRequest) {
      return new Response(
        JSON.stringify({ error: 'You already have a pending request for this workspace' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the access request
    const { data: accessRequest, error: insertError } = await supabase
      .from('workspace_access_requests')
      .insert({
        workspace_id,
        user_id: user.id,
        requested_role,
        message,
        status: 'PENDING',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating access request:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create access request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get requester's profile for the notification
    const { data: requesterProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const requesterName = requesterProfile?.full_name || user.email || 'A user';

    // Notify the workspace owner
    await supabase
      .from('notifications')
      .insert({
        user_id: workspace.organizer_id,
        title: 'New Access Request',
        message: `${requesterName} has requested to join your workspace "${workspace.name}"`,
        type: 'workspace',
        category: 'workspace',
        action_url: `/console/workspaces/${workspace_id}/team`,
        action_label: 'Review Request',
      });

    console.log(`Access request created for user ${user.id} to workspace ${workspace_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Access request submitted successfully',
        request_id: accessRequest.id 
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
