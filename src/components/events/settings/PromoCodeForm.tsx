import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { PromoCode, CreatePromoCodeDTO } from '@/types/promoCode';
import type { TicketTier } from '@/types/ticketTier';

const promoCodeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50).toUpperCase(),
  name: z.string().max(100).optional().nullable(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.coerce.number().positive('Must be greater than 0'),
  max_uses: z.coerce.number().int().min(1).optional().nullable(),
  valid_from: z.string().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  min_quantity: z.coerce.number().int().min(1).default(1),
  max_quantity: z.coerce.number().int().min(1).optional().nullable(),
  applicable_tier_ids: z.array(z.string()).optional().nullable(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof promoCodeSchema>;

interface PromoCodeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promoCode?: PromoCode | null;
  eventId: string;
  tiers: TicketTier[];
  onSubmit: (data: CreatePromoCodeDTO) => Promise<void>;
  isSubmitting?: boolean;
}

export const PromoCodeForm: React.FC<PromoCodeFormProps> = ({
  open,
  onOpenChange,
  promoCode,
  eventId,
  tiers,
  onSubmit,
  isSubmitting = false,
}) => {
  const isEditing = !!promoCode;

  const form = useForm<FormValues>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: promoCode?.code || '',
      name: promoCode?.name || '',
      discount_type: promoCode?.discount_type || 'percentage',
      discount_value: promoCode?.discount_value || 10,
      max_uses: promoCode?.max_uses || null,
      valid_from: promoCode?.valid_from ? promoCode.valid_from.slice(0, 16) : '',
      valid_until: promoCode?.valid_until ? promoCode.valid_until.slice(0, 16) : '',
      min_quantity: promoCode?.min_quantity || 1,
      max_quantity: promoCode?.max_quantity || null,
      applicable_tier_ids: promoCode?.applicable_tier_ids || [],
      is_active: promoCode?.is_active ?? true,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        code: promoCode?.code || '',
        name: promoCode?.name || '',
        discount_type: promoCode?.discount_type || 'percentage',
        discount_value: promoCode?.discount_value || 10,
        max_uses: promoCode?.max_uses || null,
        valid_from: promoCode?.valid_from ? promoCode.valid_from.slice(0, 16) : '',
        valid_until: promoCode?.valid_until ? promoCode.valid_until.slice(0, 16) : '',
        min_quantity: promoCode?.min_quantity || 1,
        max_quantity: promoCode?.max_quantity || null,
        applicable_tier_ids: promoCode?.applicable_tier_ids || [],
        is_active: promoCode?.is_active ?? true,
      });
    }
  }, [open, promoCode, form]);

  const discountType = form.watch('discount_type');

  const handleSubmit = async (values: FormValues) => {
    await onSubmit({
      event_id: eventId,
      code: values.code.toUpperCase(),
      name: values.name || null,
      discount_type: values.discount_type,
      discount_value: values.discount_value,
      max_uses: values.max_uses || null,
      valid_from: values.valid_from || null,
      valid_until: values.valid_until || null,
      min_quantity: values.min_quantity,
      max_quantity: values.max_quantity || null,
      applicable_tier_ids: values.applicable_tier_ids?.length ? values.applicable_tier_ids : null,
      is_active: values.is_active,
    });
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue('code', code);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the promo code details.'
              : 'Create a new promo code for discounts.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Promo Code *</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                placeholder="e.g., EARLYBIRD20"
                className="uppercase"
                {...form.register('code')}
              />
              <Button type="button" variant="outline" onClick={generateCode}>
                Generate
              </Button>
            </div>
            {form.formState.errors.code && (
              <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              placeholder="e.g., Early Bird Discount"
              {...form.register('name')}
            />
          </div>

          {/* Discount Type and Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount_type">Discount Type</Label>
              <Select
                value={form.watch('discount_type')}
                onValueChange={(value: 'percentage' | 'fixed') => form.setValue('discount_type', value)}
              >
                <SelectTrigger id="discount_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_value">
                {discountType === 'percentage' ? 'Discount %' : 'Discount Amount'} *
              </Label>
              <Input
                id="discount_value"
                type="number"
                min="0"
                step={discountType === 'percentage' ? '1' : '0.01'}
                max={discountType === 'percentage' ? '100' : undefined}
                placeholder={discountType === 'percentage' ? '10' : '100'}
                {...form.register('discount_value')}
              />
              {form.formState.errors.discount_value && (
                <p className="text-sm text-destructive">{form.formState.errors.discount_value.message}</p>
              )}
            </div>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_uses">Max Uses</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                placeholder="Unlimited"
                {...form.register('max_uses')}
              />
              <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_quantity">Min Tickets</Label>
              <Input
                id="min_quantity"
                type="number"
                min="1"
                placeholder="1"
                {...form.register('min_quantity')}
              />
              <p className="text-xs text-muted-foreground">Minimum tickets for discount</p>
            </div>
          </div>

          {/* Validity Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valid_from">Valid From</Label>
              <Input
                id="valid_from"
                type="datetime-local"
                {...form.register('valid_from')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                type="datetime-local"
                {...form.register('valid_until')}
              />
            </div>
          </div>

          {/* Applicable Tiers */}
          {tiers.length > 0 && (
            <div className="space-y-2">
              <Label>Applicable Ticket Tiers</Label>
              <div className="border rounded-md p-3 space-y-2">
                {tiers.map((tier) => (
                  <label key={tier.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.watch('applicable_tier_ids')?.includes(tier.id) || false}
                      onChange={(e) => {
                        const current = form.watch('applicable_tier_ids') || [];
                        if (e.target.checked) {
                          form.setValue('applicable_tier_ids', [...current, tier.id]);
                        } else {
                          form.setValue('applicable_tier_ids', current.filter((id) => id !== tier.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{tier.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave all unchecked to apply to all tiers
              </p>
            </div>
          )}

          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Active</Label>
              <p className="text-sm text-muted-foreground">
                Enable this promo code
              </p>
            </div>
            <Switch
              id="is_active"
              checked={form.watch('is_active')}
              onCheckedChange={(checked) => form.setValue('is_active', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Code' : 'Create Code'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
