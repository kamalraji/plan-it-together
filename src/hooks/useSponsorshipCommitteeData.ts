import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  SPONSOR_COLUMNS, 
  SPONSOR_PROPOSAL_COLUMNS, 
  SPONSOR_DELIVERABLE_COLUMNS,
  SPONSOR_BENEFIT_COLUMNS,
  SPONSOR_COMMUNICATION_COLUMNS,
} from '@/lib/supabase-columns';

// Types (matches actual workspace_sponsors table schema)
export interface Sponsor {
  id: string;
  workspace_id: string;
  name: string;
  company_name: string | null;
  tier: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contract_value: number;
  amount_paid: number | null;
  payment_status: string;
  deliverables: string | null;
  deliverables_status: string | null;
  proposal_sent_at: string | null;
  contract_signed_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SponsorProposal {
  id: string;
  workspace_id: string;
  sponsor_id: string | null;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  proposed_tier: string;
  proposed_value: number;
  stage: string;
  stage_entered_at: string;
  proposal_document_url: string | null;
  notes: string | null;
  next_follow_up_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SponsorDeliverable {
  id: string;
  workspace_id: string;
  sponsor_id: string;
  title: string;
  description: string | null;
  category: string;
  due_date: string;
  completed_at: string | null;
  status: string;
  priority: string;
  proof_url: string | null;
  notes: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sponsor?: Sponsor;
}

export interface SponsorBenefit {
  id: string;
  workspace_id: string;
  tier: string;
  name: string;
  description: string | null;
  category: string;
  value_estimate: number | null;
  quantity: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SponsorCommunication {
  id: string;
  workspace_id: string;
  sponsor_id: string;
  type: string;
  subject: string;
  content: string | null;
  direction: string;
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  recipient_email: string | null;
  attachments: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sponsor?: Sponsor;
}

export interface SponsorshipStats {
  totalSponsors: number;
  totalRevenue: number;
  collectedRevenue: number;
  pendingProposals: number;
  deliverablesDue: number;
  overduDeliverables: number;
  proposalsByStage: Record<string, number>;
  revenueByTier: Record<string, number>;
}

// =============================================
// QUERIES
// =============================================

export function useSponsors(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-sponsors', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_sponsors')
        .select(SPONSOR_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Sponsor[];
    },
    enabled: !!workspaceId,
  });
}

export function useProposals(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['sponsor-proposals', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_sponsor_proposals')
        .select(SPONSOR_PROPOSAL_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SponsorProposal[];
    },
    enabled: !!workspaceId,
  });
}

export function useDeliverables(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['sponsor-deliverables', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_sponsor_deliverables')
        .select(`${SPONSOR_DELIVERABLE_COLUMNS.detail}, sponsor:workspace_sponsors(id, name, tier)`)
        .eq('workspace_id', workspaceId)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return (data || []) as SponsorDeliverable[];
    },
    enabled: !!workspaceId,
  });
}

export function useBenefits(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['sponsor-benefits', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_sponsor_benefits')
        .select(SPONSOR_BENEFIT_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('tier')
        .order('display_order');
      
      if (error) throw error;
      return data as SponsorBenefit[];
    },
    enabled: !!workspaceId,
  });
}

export function useCommunications(workspaceId: string | undefined, sponsorId?: string) {
  return useQuery({
    queryKey: ['sponsor-communications', workspaceId, sponsorId],
    queryFn: async () => {
      if (!workspaceId) return [];
      let query = supabase
        .from('workspace_sponsor_communications')
        .select(`${SPONSOR_COMMUNICATION_COLUMNS.detail}, sponsor:workspace_sponsors(id, name)`)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (sponsorId) {
        query = query.eq('sponsor_id', sponsorId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SponsorCommunication[];
    },
    enabled: !!workspaceId,
  });
}

export function useSponsorshipStats(workspaceId: string | undefined) {
  const { data: sponsors } = useSponsors(workspaceId);
  const { data: proposals } = useProposals(workspaceId);
  const { data: deliverables } = useDeliverables(workspaceId);

  const stats: SponsorshipStats = {
    totalSponsors: sponsors?.filter(s => s.status === 'active').length || 0,
    totalRevenue: sponsors?.reduce((sum, s) => sum + (s.contract_value || 0), 0) || 0,
    collectedRevenue: sponsors?.filter(s => s.payment_status === 'paid')
      .reduce((sum, s) => sum + (s.contract_value || 0), 0) || 0,
    pendingProposals: proposals?.filter(p => !['closed_won', 'closed_lost'].includes(p.stage)).length || 0,
    deliverablesDue: deliverables?.filter(d => d.status === 'pending').length || 0,
    overduDeliverables: deliverables?.filter(d => 
      d.status !== 'completed' && new Date(d.due_date) < new Date()
    ).length || 0,
    proposalsByStage: proposals?.reduce((acc, p) => {
      acc[p.stage] = (acc[p.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    revenueByTier: sponsors?.reduce((acc, s) => {
      acc[s.tier] = (acc[s.tier] || 0) + (s.contract_value || 0);
      return acc;
    }, {} as Record<string, number>) || {},
  };

  return stats;
}

// =============================================
// MUTATIONS - SPONSORS
// =============================================

export function useCreateSponsor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown> & { workspace_id: string }) => {
      const { data: result, error } = await supabase
        .from('workspace_sponsors')
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-sponsors', variables.workspace_id] });
      toast.success('Sponsor added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add sponsor: ${error.message}`);
    },
  });
}

export function useUpdateSponsor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId, ...data }: Partial<Sponsor> & { id: string; workspaceId: string }) => {
      const { data: result, error } = await supabase
        .from('workspace_sponsors')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-sponsors', variables.workspaceId] });
      toast.success('Sponsor updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update sponsor: ${error.message}`);
    },
  });
}

export function useDeleteSponsor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId: _workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase
        .from('workspace_sponsors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-sponsors', variables.workspaceId] });
      toast.success('Sponsor removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove sponsor: ${error.message}`);
    },
  });
}

// =============================================
// MUTATIONS - PROPOSALS
// =============================================

export function useCreateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown> & { workspace_id: string }) => {
      const { data: result, error } = await supabase
        .from('workspace_sponsor_proposals')
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-proposals', variables.workspace_id] });
      toast.success('Proposal created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create proposal: ${error.message}`);
    },
  });
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId, ...data }: Partial<SponsorProposal> & { id: string; workspaceId: string }) => {
      const { data: result, error } = await supabase
        .from('workspace_sponsor_proposals')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-proposals', variables.workspaceId] });
      toast.success('Proposal updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update proposal: ${error.message}`);
    },
  });
}

export function useMoveProposalStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId: _workspaceId, stage }: { id: string; workspaceId: string; stage: string }) => {
      const { data: result, error } = await supabase
        .from('workspace_sponsor_proposals')
        .update({ stage, stage_entered_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-proposals', variables.workspaceId] });
      toast.success('Proposal stage updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update stage: ${error.message}`);
    },
  });
}

export function useConvertProposalToSponsor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ proposal, workspaceId }: { proposal: SponsorProposal; workspaceId: string }) => {
      // Create sponsor from proposal
      const { data: sponsor, error: sponsorError } = await supabase
        .from('workspace_sponsors')
        .insert({
          workspace_id: workspaceId,
          name: proposal.company_name,
          tier: proposal.proposed_tier,
          contact_name: proposal.contact_name,
          contact_email: proposal.contact_email,
          contact_phone: proposal.contact_phone,
          contract_value: proposal.proposed_value,
          payment_status: 'pending',
          status: 'active',
        })
        .select()
        .single();
      
      if (sponsorError) throw sponsorError;

      // Update proposal to link to sponsor and mark as closed_won
      const { error: proposalError } = await supabase
        .from('workspace_sponsor_proposals')
        .update({ 
          stage: 'closed_won', 
          sponsor_id: sponsor.id,
          stage_entered_at: new Date().toISOString(),
        })
        .eq('id', proposal.id);
      
      if (proposalError) throw proposalError;

      return sponsor;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-sponsors', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['sponsor-proposals', variables.workspaceId] });
      toast.success('Proposal converted to sponsor successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to convert proposal: ${error.message}`);
    },
  });
}

// =============================================
// MUTATIONS - DELIVERABLES
// =============================================

export function useCreateDeliverable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown> & { workspace_id: string; sponsor_id: string }) => {
      const { data: result, error } = await supabase
        .from('workspace_sponsor_deliverables')
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-deliverables', variables.workspace_id] });
      toast.success('Deliverable added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add deliverable: ${error.message}`);
    },
  });
}

export function useUpdateDeliverable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId, ...data }: Partial<SponsorDeliverable> & { id: string; workspaceId: string }) => {
      const { data: result, error } = await supabase
        .from('workspace_sponsor_deliverables')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-deliverables', variables.workspaceId] });
      toast.success('Deliverable updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update deliverable: ${error.message}`);
    },
  });
}

export function useMarkDeliverableComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId: _workspaceId, proofUrl }: { id: string; workspaceId: string; proofUrl?: string }) => {
      const { data: result, error } = await supabase
        .from('workspace_sponsor_deliverables')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          proof_url: proofUrl || null,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-deliverables', variables.workspaceId] });
      toast.success('Deliverable marked as complete');
    },
    onError: (error: Error) => {
      toast.error(`Failed to complete deliverable: ${error.message}`);
    },
  });
}

// =============================================
// MUTATIONS - BENEFITS
// =============================================

export function useCreateBenefit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown> & { workspace_id: string }) => {
      const { data: result, error } = await supabase
        .from('workspace_sponsor_benefits')
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-benefits', variables.workspace_id] });
      toast.success('Benefit added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add benefit: ${error.message}`);
    },
  });
}

export function useUpdateBenefit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId, ...data }: Partial<SponsorBenefit> & { id: string; workspaceId: string }) => {
      const { data: result, error } = await supabase
        .from('workspace_sponsor_benefits')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-benefits', variables.workspaceId] });
      toast.success('Benefit updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update benefit: ${error.message}`);
    },
  });
}

export function useDeleteBenefit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId: _workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase
        .from('workspace_sponsor_benefits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-benefits', variables.workspaceId] });
      toast.success('Benefit removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove benefit: ${error.message}`);
    },
  });
}

// =============================================
// MUTATIONS - COMMUNICATIONS
// =============================================

export function useCreateCommunication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown> & { workspace_id: string; sponsor_id: string }) => {
      const { data: result, error } = await supabase
        .from('workspace_sponsor_communications')
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-communications', variables.workspace_id] });
      toast.success('Communication logged successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to log communication: ${error.message}`);
    },
  });
}

export function useUpdateCommunication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId, ...data }: Partial<SponsorCommunication> & { id: string; workspaceId: string }) => {
      const { data: result, error } = await supabase
        .from('workspace_sponsor_communications')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-communications', variables.workspaceId] });
      toast.success('Communication updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update communication: ${error.message}`);
    },
  });
}

export function useSendCommunication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId: _workspaceId }: { id: string; workspaceId: string }) => {
      const { data: result, error } = await supabase
        .from('workspace_sponsor_communications')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-communications', variables.workspaceId] });
      toast.success('Communication marked as sent');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send communication: ${error.message}`);
    },
  });
}
