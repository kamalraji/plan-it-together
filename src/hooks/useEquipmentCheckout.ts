import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface EquipmentCheckout {
  id: string;
  workspaceId: string;
  equipmentId: string;
  equipmentName?: string;
  borrowedByWorkspaceId: string | null;
  borrowedByUserId: string | null;
  borrowedByName: string;
  borrowedByCommittee: string | null;
  checkoutDate: string;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  status: 'checked_out' | 'returned' | 'overdue' | 'lost' | 'damaged';
  conditionAtCheckout: 'excellent' | 'good' | 'fair' | 'poor';
  conditionAtReturn: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' | null;
  checkoutNotes: string | null;
  returnNotes: string | null;
  damageDescription: string | null;
  checkedOutBy: string | null;
  returnedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseEquipmentCheckoutOptions {
  workspaceId: string;
}

export function useEquipmentCheckout({ workspaceId }: UseEquipmentCheckoutOptions) {
  const queryClient = useQueryClient();
  const queryKey = ['equipment-checkouts', workspaceId];

  const { data: checkouts = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_equipment_checkouts')
        .select(`
          *,
          equipment:workspace_equipment(name)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        ...mapToCheckout(row),
        equipmentName: row.equipment?.name,
      }));
    },
    enabled: !!workspaceId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`equipment-checkouts-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_equipment_checkouts',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient, queryKey]);

  const checkoutEquipment = useMutation({
    mutationFn: async (data: {
      equipmentId: string;
      borrowedByName: string;
      borrowedByCommittee?: string;
      borrowedByWorkspaceId?: string;
      borrowedByUserId?: string;
      expectedReturnDate: string;
      conditionAtCheckout?: 'excellent' | 'good' | 'fair' | 'poor';
      checkoutNotes?: string;
      checkedOutBy?: string;
    }) => {
      const { error } = await supabase.from('workspace_equipment_checkouts').insert({
        workspace_id: workspaceId,
        equipment_id: data.equipmentId,
        borrowed_by_name: data.borrowedByName,
        borrowed_by_committee: data.borrowedByCommittee,
        borrowed_by_workspace_id: data.borrowedByWorkspaceId,
        borrowed_by_user_id: data.borrowedByUserId,
        expected_return_date: data.expectedReturnDate,
        condition_at_checkout: data.conditionAtCheckout || 'good',
        checkout_notes: data.checkoutNotes,
        checked_out_by: data.checkedOutBy,
        status: 'checked_out',
      });
      if (error) throw error;

      // Update equipment status
      await supabase
        .from('workspace_equipment')
        .update({ status: 'maintenance' })
        .eq('id', data.equipmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['equipment', workspaceId] });
      toast.success('Equipment checked out');
    },
    onError: () => toast.error('Failed to checkout equipment'),
  });

  const returnEquipment = useMutation({
    mutationFn: async ({ id, conditionAtReturn, returnNotes, returnedTo }: {
      id: string;
      conditionAtReturn: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
      returnNotes?: string;
      returnedTo?: string;
    }) => {
      const checkout = checkouts.find(c => c.id === id);
      
      const { error } = await supabase
        .from('workspace_equipment_checkouts')
        .update({
          status: conditionAtReturn === 'damaged' ? 'damaged' : 'returned',
          actual_return_date: new Date().toISOString(),
          condition_at_return: conditionAtReturn,
          return_notes: returnNotes,
          returned_to: returnedTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;

      // Update equipment status back
      if (checkout?.equipmentId) {
        await supabase
          .from('workspace_equipment')
          .update({ status: conditionAtReturn === 'damaged' ? 'failed' : 'passed' })
          .eq('id', checkout.equipmentId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['equipment', workspaceId] });
      toast.success('Equipment returned');
    },
    onError: () => toast.error('Failed to return equipment'),
  });

  const markDamaged = useMutation({
    mutationFn: async ({ id, damageDescription }: { id: string; damageDescription: string }) => {
      const { error } = await supabase
        .from('workspace_equipment_checkouts')
        .update({
          status: 'damaged',
          damage_description: damageDescription,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Marked as damaged');
    },
    onError: () => toast.error('Failed to update'),
  });

  const markLost = useMutation({
    mutationFn: async (id: string) => {
      const checkout = checkouts.find(c => c.id === id);
      
      const { error } = await supabase
        .from('workspace_equipment_checkouts')
        .update({
          status: 'lost',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;

      if (checkout?.equipmentId) {
        await supabase
          .from('workspace_equipment')
          .update({ status: 'failed' })
          .eq('id', checkout.equipmentId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['equipment', workspaceId] });
      toast.success('Marked as lost');
    },
    onError: () => toast.error('Failed to update'),
  });

  const extendCheckout = useMutation({
    mutationFn: async ({ id, newReturnDate }: { id: string; newReturnDate: string }) => {
      const { error } = await supabase
        .from('workspace_equipment_checkouts')
        .update({
          expected_return_date: newReturnDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Checkout extended');
    },
    onError: () => toast.error('Failed to extend'),
  });

  // Computed values
  const now = new Date();
  const activeCheckouts = checkouts.filter(c => c.status === 'checked_out');
  const overdueCheckouts = activeCheckouts.filter(c => new Date(c.expectedReturnDate) < now);

  return {
    checkouts,
    isLoading,
    activeCheckouts,
    overdueCount: overdueCheckouts.length,
    overdueCheckouts,
    checkoutEquipment: checkoutEquipment.mutateAsync,
    returnEquipment: returnEquipment.mutateAsync,
    markDamaged: markDamaged.mutateAsync,
    markLost: markLost.mutateAsync,
    extendCheckout: extendCheckout.mutateAsync,
  };
}

function mapToCheckout(row: any): EquipmentCheckout {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    equipmentId: row.equipment_id,
    borrowedByWorkspaceId: row.borrowed_by_workspace_id,
    borrowedByUserId: row.borrowed_by_user_id,
    borrowedByName: row.borrowed_by_name,
    borrowedByCommittee: row.borrowed_by_committee,
    checkoutDate: row.checkout_date,
    expectedReturnDate: row.expected_return_date,
    actualReturnDate: row.actual_return_date,
    status: row.status,
    conditionAtCheckout: row.condition_at_checkout,
    conditionAtReturn: row.condition_at_return,
    checkoutNotes: row.checkout_notes,
    returnNotes: row.return_notes,
    damageDescription: row.damage_description,
    checkedOutBy: row.checked_out_by,
    returnedTo: row.returned_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
