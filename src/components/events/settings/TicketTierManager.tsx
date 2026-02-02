import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Reorder } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TicketIcon, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/looseClient';
import { TicketTierCard } from './TicketTierCard';
import { TicketTierForm } from './TicketTierForm';
import { useConfirmation } from '@/components/ui/confirmation-dialog';
import type { TicketTier, CreateTicketTierDTO } from '@/types/ticketTier';

interface TicketTierManagerProps {
  eventId: string;
}

export const TicketTierManager: React.FC<TicketTierManagerProps> = ({ eventId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<TicketTier | null>(null);
  const [duplicatingTier, setDuplicatingTier] = useState<TicketTier | null>(null);
  const { confirm, dialogProps, ConfirmationDialog: DeleteDialog } = useConfirmation();

  // Local state for drag-reorder
  const [orderedTiers, setOrderedTiers] = useState<TicketTier[]>([]);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);

  // Fetch tiers
  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['ticket-tiers', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_tiers')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as TicketTier[];
    },
  });

  // Sync fetched tiers to local state
  useEffect(() => {
    setOrderedTiers(tiers);
    setHasOrderChanges(false);
  }, [tiers]);

  // Create tier mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateTicketTierDTO) => {
      const maxOrder = tiers.length > 0 ? Math.max(...tiers.map((t) => t.sort_order)) : -1;
      const { error } = await supabase.from('ticket_tiers').insert({
        ...data,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-tiers', eventId] });
      toast({ title: 'Ticket tier created', description: 'The new tier has been added.' });
      setIsFormOpen(false);
      setDuplicatingTier(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create tier.', variant: 'destructive' });
    },
  });

  // Update tier mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CreateTicketTierDTO & { id: string }) => {
      const { id, event_id, ...updateData } = data;
      const { error } = await supabase
        .from('ticket_tiers')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-tiers', eventId] });
      toast({ title: 'Ticket tier updated', description: 'Changes have been saved.' });
      setIsFormOpen(false);
      setEditingTier(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update tier.', variant: 'destructive' });
    },
  });

  // Delete tier mutation
  const deleteMutation = useMutation({
    mutationFn: async (tierId: string) => {
      const { error } = await supabase.from('ticket_tiers').delete().eq('id', tierId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-tiers', eventId] });
      toast({ title: 'Ticket tier deleted', description: 'The tier has been removed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete tier.', variant: 'destructive' });
    },
  });

  // Batch update sort order mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedTiers: TicketTier[]) => {
      // Update each tier's sort_order
      const updates = reorderedTiers.map((tier, index) => 
        supabase
          .from('ticket_tiers')
          .update({ sort_order: index })
          .eq('id', tier.id)
      );
      
      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-tiers', eventId] });
      toast({ title: 'Order saved', description: 'Tier order has been updated.' });
      setHasOrderChanges(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save tier order.', variant: 'destructive' });
    },
  });

  const handleReorder = useCallback((newOrder: TicketTier[]) => {
    setOrderedTiers(newOrder);
    // Check if order actually changed
    const orderChanged = newOrder.some((tier, index) => tier.id !== tiers[index]?.id);
    setHasOrderChanges(orderChanged);
  }, [tiers]);

  const handleSaveOrder = useCallback(() => {
    reorderMutation.mutate(orderedTiers);
  }, [orderedTiers, reorderMutation]);

  const handleAddClick = () => {
    setEditingTier(null);
    setDuplicatingTier(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (tier: TicketTier) => {
    setEditingTier(tier);
    setDuplicatingTier(null);
    setIsFormOpen(true);
  };

  const handleDuplicateClick = (tier: TicketTier) => {
    setEditingTier(null);
    setDuplicatingTier({
      ...tier,
      name: `${tier.name} (Copy)`,
      sold_count: 0,
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (tier: TicketTier) => {
    const confirmed = await confirm({
      title: 'Delete Ticket Tier',
      description: `Are you sure you want to delete "${tier.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(tier.id);
    }
  };

  const handleFormSubmit = async (data: CreateTicketTierDTO) => {
    if (editingTier) {
      await updateMutation.mutateAsync({ ...data, id: editingTier.id });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TicketIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Ticket Tiers</CardTitle>
                <CardDescription>Manage different ticket types and pricing. Drag to reorder.</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasOrderChanges && (
                <Button 
                  onClick={handleSaveOrder} 
                  size="sm" 
                  variant="outline"
                  disabled={reorderMutation.isPending}
                >
                  {reorderMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Order
                </Button>
              )}
              <Button onClick={handleAddClick} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Tier
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : orderedTiers.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <TicketIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">No ticket tiers yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first ticket tier to start selling tickets
              </p>
              <Button onClick={handleAddClick} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add First Tier
              </Button>
            </div>
          ) : (
            <Reorder.Group 
              axis="y" 
              values={orderedTiers} 
              onReorder={handleReorder}
              className="space-y-3"
            >
              {orderedTiers.map((tier) => (
                <Reorder.Item key={tier.id} value={tier}>
                  <TicketTierCard
                    tier={tier}
                    onEdit={handleEditClick}
                    onDuplicate={handleDuplicateClick}
                    onDelete={handleDeleteClick}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </CardContent>
      </Card>

      <TicketTierForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        tier={editingTier || duplicatingTier}
        eventId={eventId}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <DeleteDialog {...dialogProps} />
    </>
  );
};
