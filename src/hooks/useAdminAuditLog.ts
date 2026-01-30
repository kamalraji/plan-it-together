import { supabase } from "@/integrations/supabase/client";

interface AuditLogParams {
  action: string;
  target_type: string;
  target_id?: string;
  details?: Record<string, unknown>;
}

/**
 * Hook for creating admin audit logs via the secure edge function.
 * This ensures audit logs are only created by verified admins through a secure channel.
 */
export const useAdminAuditLog = () => {
  const logAction = async (params: AuditLogParams): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.functions.invoke("admin-audit-log", {
        body: params,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: "Failed to create audit log" };
    }
  };

  return { logAction };
};
