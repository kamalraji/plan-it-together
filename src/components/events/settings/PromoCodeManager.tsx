import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Tag, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/looseClient';
import { PromoCodeCard } from './PromoCodeCard';
import { PromoCodeForm } from './PromoCodeForm';
import { useConfirmation } from '@/components/ui/confirmation-dialog';
import type { PromoCode, CreatePromoCodeDTO } from '@/types/promoCode';
import type { TicketTier } from '@/types/ticketTier';

interface PromoCodeManagerProps {
  eventId: string;
}

export const PromoCodeManager: React.FC<PromoCodeManagerProps> = ({ eventId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [duplicatingCode, setDuplicatingCode] = useState<PromoCode | null>(null);
  const { confirm, dialogProps, ConfirmationDialog: DeleteDialog } = useConfirmation();

  // Fetch promo codes
  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ['promo-codes', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PromoCode[];
    },
  });

  // Fetch ticket tiers for the form
  const { data: tiers = [] } = useQuery({
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreatePromoCodeDTO) => {
      const { error } = await supabase.from('promo_codes').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes', eventId] });
      toast({ title: 'Promo code created', description: 'The new code is ready to use.' });
      setIsFormOpen(false);
      setDuplicatingCode(null);
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({ title: 'Code already exists', description: 'Please use a different code.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to create promo code.', variant: 'destructive' });
      }
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CreatePromoCodeDTO & { id: string }) => {
      const { id, event_id, ...updateData } = data;
      const { error } = await supabase
        .from('promo_codes')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes', eventId] });
      toast({ title: 'Promo code updated', description: 'Changes have been saved.' });
      setIsFormOpen(false);
      setEditingCode(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update promo code.', variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (codeId: string) => {
      const { error } = await supabase.from('promo_codes').delete().eq('id', codeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes', eventId] });
      toast({ title: 'Promo code deleted', description: 'The code has been removed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete promo code.', variant: 'destructive' });
    },
  });

  const handleAddClick = () => {
    setEditingCode(null);
    setDuplicatingCode(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (code: PromoCode) => {
    setEditingCode(code);
    setDuplicatingCode(null);
    setIsFormOpen(true);
  };

  const handleDuplicateClick = (code: PromoCode) => {
    setEditingCode(null);
    setDuplicatingCode({
      ...code,
      code: `${code.code}_COPY`,
      current_uses: 0,
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (code: PromoCode) => {
    const confirmed = await confirm({
      title: 'Delete Promo Code',
      description: `Are you sure you want to delete "${code.code}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(code.id);
    }
  };

  const handleFormSubmit = async (data: CreatePromoCodeDTO) => {
    if (editingCode) {
      await updateMutation.mutateAsync({ ...data, id: editingCode.id });
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
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Promo Codes</CardTitle>
                <CardDescription>Create discount codes for your event</CardDescription>
              </div>
            </div>
            <Button onClick={handleAddClick} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Code
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Tag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">No promo codes yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create promo codes to offer discounts
              </p>
              <Button onClick={handleAddClick} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create First Code
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {promoCodes.map((code) => (
                <PromoCodeCard
                  key={code.id}
                  promoCode={code}
                  onEdit={handleEditClick}
                  onDuplicate={handleDuplicateClick}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PromoCodeForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        promoCode={editingCode || duplicatingCode}
        eventId={eventId}
        tiers={tiers}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <DeleteDialog {...dialogProps} />
    </>
  );
};
