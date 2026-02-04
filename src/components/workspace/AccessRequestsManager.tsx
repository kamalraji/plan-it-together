import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckIcon, XMarkIcon, ArrowPathIcon, UserIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface AccessRequest {
  id: string;
  workspace_id: string;
  user_id: string;
  requested_role: string | null;
  message: string | null;
  status: string | null;
  created_at: string;
  user_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface AccessRequestsManagerProps {
  workspaceId: string;
}

export function AccessRequestsManager({ workspaceId }: AccessRequestsManagerProps) {
  const queryClient = useQueryClient();

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['access-requests', workspaceId],
    queryFn: async (): Promise<AccessRequest[]> => {
      const { data, error } = await supabase
        .from('workspace_access_requests')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles for the requests
      const userIds = (data || []).map(r => r.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      return (data || []).map(r => ({
        ...r,
        user_profile: profileMap.get(r.user_id),
      }));
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ requestId, action, role }: { requestId: string; action: 'approve' | 'reject'; role?: string }) => {
      const { data, error } = await supabase.functions.invoke('respond-access-request', {
        body: {
          request_id: requestId,
          action,
          role,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.action === 'approve' ? 'Request approved' : 'Request rejected');
      queryClient.invalidateQueries({ queryKey: ['access-requests', workspaceId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to respond to request');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <ArrowPathIcon className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-sm text-destructive">Failed to load access requests</p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <UserIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No pending access requests</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">
          Pending Access Requests ({requests.length})
        </h3>
      </div>

      <ul className="divide-y divide-border">
        {requests.map(request => (
          <li key={request.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  {request.user_profile?.avatar_url ? (
                    <img
                      src={request.user_profile.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {request.user_profile?.full_name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requested {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                  </p>
                  {request.message && (
                    <p className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded p-2">
                      "{request.message}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => respondMutation.mutate({ requestId: request.id, action: 'approve' })}
                  disabled={respondMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 border border-green-300 text-xs font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                >
                  <CheckIcon className="w-3.5 h-3.5 mr-1" />
                  Approve
                </button>
                <button
                  onClick={() => respondMutation.mutate({ requestId: request.id, action: 'reject' })}
                  disabled={respondMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                >
                  <XMarkIcon className="w-3.5 h-3.5 mr-1" />
                  Reject
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
