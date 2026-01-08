import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  workspace_id: string;
  email: string;
  role: string;
  custom_message?: string;
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

    const body: InviteRequest = await req.json();
    const { workspace_id, email, role, custom_message } = body;

    // Validate required fields
    if (!workspace_id || !email || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: workspace_id, email, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} attempting to invite ${email} to workspace ${workspace_id} with role ${role}`);

    // Check if the current user is the workspace owner
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

    // Only workspace owner can invite members
    if (workspace.organizer_id !== user.id) {
      console.error(`User ${user.id} is not the owner of workspace ${workspace_id}. Owner is ${workspace.organizer_id}`);
      return new Response(
        JSON.stringify({ error: 'Only the workspace owner can invite members' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user with this email already exists in the system
    const { data: existingUsers } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    // Check auth.users for the email
    const { data: authUsers, error: authLookupError } = await supabase.auth.admin.listUsers();
    
    let targetUserId: string | null = null;
    if (!authLookupError && authUsers?.users) {
      const foundUser = authUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (foundUser) {
        targetUserId = foundUser.id;
      }
    }

    // Check if user is already a member
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

    // Check for existing pending invitation
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

    // If user exists in the system, add them directly to workspace_team_members
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

      // Create a notification for the user
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

    // User doesn't exist - create an invitation record
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

    console.log(`Invitation created for ${email} to workspace ${workspace_id}:`, invitation.id);

    // If the invited user exists but wasn't added directly (edge case), 
    // or for future: send email notification for external invites
    // For now, we've handled the direct add case above with a notification

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
