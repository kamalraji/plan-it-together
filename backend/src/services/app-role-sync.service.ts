import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserRole } from '@prisma/client';
import { mapUserRoleToAppRole } from './role-mapping.service';

let supabaseAdminClient: SupabaseClient | null = null;

function getSupabaseAdminClient(): SupabaseClient | null {
  if (supabaseAdminClient) return supabaseAdminClient;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      '[AppRoleSync] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Skipping role sync.'
    );
    return null;
  }

  supabaseAdminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminClient;
}

/**
 * Synchronize the high-level application role (app_role) into the
 * Lovable Cloud / database user_roles table for the given user.
 */
export async function syncUserAppRole(userId: string, userRole: UserRole): Promise<void> {
  const client = getSupabaseAdminClient();

  if (!client) {
    // Configuration issue already logged; do not block the main flow.
    return;
  }

  const appRole = mapUserRoleToAppRole(userRole);

  // Clear existing roles for this user to enforce a single high-level app_role
  const { error: deleteError } = await client
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.error('[AppRoleSync] Failed to clear existing roles', deleteError);
    throw new Error('Failed to clear existing app roles for user');
  }

  const { error: insertError } = await client.from('user_roles').insert({
    user_id: userId,
    role: appRole,
  });

  if (insertError) {
    console.error('[AppRoleSync] Failed to insert app role', insertError);
    throw new Error('Failed to sync app role for user');
  }
}
