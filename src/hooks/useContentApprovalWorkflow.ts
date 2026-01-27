import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export type ApprovalStage = 
  | 'submitted' 
  | 'content_review' 
  | 'design_review' 
  | 'legal_review' 
  | 'final_approval' 
  | 'approved' 
  | 'rejected';

export type ApprovalPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ContentType = 'social_post' | 'blog_article' | 'marketing_material' | 'press_release';
export type SourceCommittee = 'content' | 'social_media' | 'marketing' | 'sponsorship';

export interface ContentApproval {
  id: string;
  workspace_id: string;
  content_type: ContentType;
  content_id: string;
  title: string;
  description: string | null;
  current_stage: ApprovalStage;
  priority: ApprovalPriority;
  submitted_by: string | null;
  submitted_at: string;
  source_committee: SourceCommittee | null;
  target_platforms: string[];
  scheduled_publish_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ApprovalStageRecord {
  id: string;
  approval_id: string;
  stage: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  reviewer_id: string | null;
  reviewer_name: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ContentApprovalWithStages extends ContentApproval {
  stages: ApprovalStageRecord[];
}

// Stage workflow configuration
export const APPROVAL_STAGES: { id: ApprovalStage; label: string; description: string }[] = [
  { id: 'submitted', label: 'Submitted', description: 'Content awaiting initial review' },
  { id: 'content_review', label: 'Content Review', description: 'Reviewing content accuracy and quality' },
  { id: 'design_review', label: 'Design Review', description: 'Reviewing visual elements and branding' },
  { id: 'legal_review', label: 'Legal Review', description: 'Checking compliance and legal requirements' },
  { id: 'final_approval', label: 'Final Approval', description: 'Final sign-off before publishing' },
  { id: 'approved', label: 'Approved', description: 'Ready for publishing' },
  { id: 'rejected', label: 'Rejected', description: 'Content requires revisions' },
];

// Queries
export function useContentApprovals(workspaceId: string, filters?: { 
  stage?: ApprovalStage; 
  contentType?: ContentType;
  sourceCommittee?: SourceCommittee;
  priority?: ApprovalPriority;
}) {
  return useQuery({
    queryKey: ['content-approvals', workspaceId, filters],
    queryFn: async () => {
      let query = supabase
        .from('content_approvals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('submitted_at', { ascending: false });

      if (filters?.stage) {
        query = query.eq('current_stage', filters.stage);
      }
      if (filters?.contentType) {
        query = query.eq('content_type', filters.contentType);
      }
      if (filters?.sourceCommittee) {
        query = query.eq('source_committee', filters.sourceCommittee);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ContentApproval[];
    },
    enabled: !!workspaceId,
  });
}

export function useContentApprovalDetails(approvalId: string) {
  return useQuery({
    queryKey: ['content-approval-details', approvalId],
    queryFn: async () => {
      const { data: approval, error: approvalError } = await supabase
        .from('content_approvals')
        .select('*')
        .eq('id', approvalId)
        .single();

      if (approvalError) throw approvalError;

      const { data: stages, error: stagesError } = await supabase
        .from('content_approval_stages')
        .select('*')
        .eq('approval_id', approvalId)
        .order('created_at', { ascending: true });

      if (stagesError) throw stagesError;

      return {
        ...approval,
        stages: stages || [],
      } as ContentApprovalWithStages;
    },
    enabled: !!approvalId,
  });
}

export function usePendingApprovalsCount(workspaceId: string) {
  return useQuery({
    queryKey: ['pending-approvals-count', workspaceId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('content_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .not('current_stage', 'in', '("approved","rejected")');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!workspaceId,
  });
}

// Mutations
export function useSubmitForApproval(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      content_type: ContentType;
      content_id: string;
      title: string;
      description?: string;
      priority?: ApprovalPriority;
      source_committee?: SourceCommittee;
      target_platforms?: string[];
      scheduled_publish_at?: string;
      metadata?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('content_approvals')
        .insert({
          workspace_id: workspaceId,
          content_type: input.content_type,
          content_id: input.content_id,
          title: input.title,
          description: input.description,
          priority: input.priority || 'medium',
          source_committee: input.source_committee,
          target_platforms: input.target_platforms || [],
          scheduled_publish_at: input.scheduled_publish_at,
          metadata: input.metadata || {},
          submitted_by: user?.id,
          current_stage: 'submitted',
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial stage record
      await supabase
        .from('content_approval_stages')
        .insert({
          approval_id: data.id,
          stage: 'submitted',
          status: 'approved',
          reviewer_id: user?.id,
          reviewed_at: new Date().toISOString(),
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-approvals', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals-count', workspaceId] });
      toast.success('Content submitted for approval');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit for approval: ${error.message}`);
    },
  });
}

export function useReviewApproval(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      approval_id: string;
      action: 'approve' | 'reject' | 'skip';
      review_notes?: string;
      next_stage?: ApprovalStage;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Get current approval
      const { data: approval, error: fetchError } = await supabase
        .from('content_approvals')
        .select('*')
        .eq('id', input.approval_id)
        .single();

      if (fetchError) throw fetchError;

      // Determine next stage
      let nextStage: ApprovalStage;
      if (input.action === 'reject') {
        nextStage = 'rejected';
      } else if (input.action === 'skip' || input.action === 'approve') {
        if (input.next_stage) {
          nextStage = input.next_stage;
        } else {
          // Auto-advance to next stage
          const stageOrder: ApprovalStage[] = ['submitted', 'content_review', 'design_review', 'legal_review', 'final_approval', 'approved'];
          const currentIndex = stageOrder.indexOf(approval.current_stage as ApprovalStage);
          nextStage = stageOrder[currentIndex + 1] as ApprovalStage || 'approved';
        }
      } else {
        nextStage = approval.current_stage as ApprovalStage;
      }

      // Create stage record
      const { error: stageError } = await supabase
        .from('content_approval_stages')
        .insert({
          approval_id: input.approval_id,
          stage: approval.current_stage,
          status: input.action === 'approve' ? 'approved' : input.action === 'reject' ? 'rejected' : 'skipped',
          reviewer_id: user?.id,
          reviewer_name: profile?.full_name || user?.email,
          review_notes: input.review_notes,
          reviewed_at: new Date().toISOString(),
        });

      if (stageError) throw stageError;

      // Update approval stage
      const { data, error } = await supabase
        .from('content_approvals')
        .update({ current_stage: nextStage })
        .eq('id', input.approval_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content-approvals', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['content-approval-details', variables.approval_id] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals-count', workspaceId] });
      
      const actionText = variables.action === 'approve' ? 'approved' : 
                        variables.action === 'reject' ? 'rejected' : 'skipped';
      toast.success(`Stage ${actionText} successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to review: ${error.message}`);
    },
  });
}

export function useUpdateApprovalPriority(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ approval_id, priority }: { approval_id: string; priority: ApprovalPriority }) => {
      const { data, error } = await supabase
        .from('content_approvals')
        .update({ priority })
        .eq('id', approval_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content-approvals', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['content-approval-details', variables.approval_id] });
      toast.success('Priority updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update priority: ${error.message}`);
    },
  });
}

// Social Media API Integration hooks
export function useSocialPostQueue(workspaceId: string) {
  return useQuery({
    queryKey: ['social-post-queue', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_post_queue')
        .select(`
          *,
          social_post:workspace_social_posts(*)
        `)
        .eq('workspace_id', workspaceId)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useAddToPostQueue(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data, error } = await supabase.functions.invoke('social-media-post', {
        body: {
          action: 'add_to_queue',
          workspace_id: workspaceId,
          post_id: postId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-post-queue', workspaceId] });
      toast.success('Post added to queue');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add to queue: ${error.message}`);
    },
  });
}

export function usePublishToSocial(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueId: string) => {
      const { data, error } = await supabase.functions.invoke('social-media-post', {
        body: {
          action: 'post_now',
          workspace_id: workspaceId,
          queue_id: queueId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-post-queue', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['social-posts', workspaceId] });
      toast.success('Post published successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to publish: ${error.message}`);
    },
  });
}

export function useSyncSocialAnalytics(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: 'sync_post_metrics' | 'sync_platform_stats' | 'generate_report') => {
      const { data, error } = await supabase.functions.invoke('social-media-sync', {
        body: {
          action,
          workspace_id: workspaceId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['social-posts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['social-platforms', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-reports', workspaceId] });
      
      const actionText = action === 'sync_post_metrics' ? 'Post metrics synced' :
                        action === 'sync_platform_stats' ? 'Platform stats synced' :
                        'Report generated';
      toast.success(actionText);
    },
    onError: (error: Error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });
}

// Social API Credentials
export function useSocialApiCredentials(workspaceId: string) {
  return useQuery({
    queryKey: ['social-api-credentials', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_social_api_credentials')
        .select('id, workspace_id, platform, credential_type, is_active, last_used_at, expires_at, created_at')
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useSaveSocialApiCredentials(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      platform: string;
      credential_type: string;
      credentials: Record<string, string>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('workspace_social_api_credentials')
        .upsert({
          workspace_id: workspaceId,
          platform: input.platform,
          credential_type: input.credential_type,
          encrypted_credentials: input.credentials,
          is_active: true,
          created_by: user?.id,
        }, {
          onConflict: 'workspace_id,platform',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-api-credentials', workspaceId] });
      toast.success('API credentials saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save credentials: ${error.message}`);
    },
  });
}
