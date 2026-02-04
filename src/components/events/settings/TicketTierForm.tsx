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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { TicketTier, CreateTicketTierDTO } from '@/types/ticketTier';

const CURRENCIES = [
  { value: 'INR', label: '₹ INR' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' },
];

const ticketTierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  currency: z.string().min(1),
  quantity: z.coerce.number().int().min(1).optional().nullable(),
  sale_start: z.string().optional().nullable(),
  sale_end: z.string().optional().nullable(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof ticketTierSchema>;

interface TicketTierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier?: TicketTier | null;
  eventId: string;
  onSubmit: (data: CreateTicketTierDTO) => Promise<void>;
  isSubmitting?: boolean;
}

export const TicketTierForm: React.FC<TicketTierFormProps> = ({
  open,
  onOpenChange,
  tier,
  eventId,
  onSubmit,
  isSubmitting = false,
}) => {
  const isEditing = !!tier;

  const form = useForm<FormValues>({
    resolver: zodResolver(ticketTierSchema),
    defaultValues: {
      name: tier?.name || '',
      description: tier?.description || '',
      price: tier?.price || 0,
      currency: tier?.currency || 'INR',
      quantity: tier?.quantity || null,
      sale_start: tier?.sale_start ? tier.sale_start.slice(0, 16) : '',
      sale_end: tier?.sale_end ? tier.sale_end.slice(0, 16) : '',
      is_active: tier?.is_active ?? true,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: tier?.name || '',
        description: tier?.description || '',
        price: tier?.price || 0,
        currency: tier?.currency || 'INR',
        quantity: tier?.quantity || null,
        sale_start: tier?.sale_start ? tier.sale_start.slice(0, 16) : '',
        sale_end: tier?.sale_end ? tier.sale_end.slice(0, 16) : '',
        is_active: tier?.is_active ?? true,
      });
    }
  }, [open, tier, form]);

  const handleSubmit = async (values: FormValues) => {
    await onSubmit({
      event_id: eventId,
      name: values.name,
      description: values.description || null,
      price: values.price,
      currency: values.currency,
      quantity: values.quantity || null,
      sale_start: values.sale_start || null,
      sale_end: values.sale_end || null,
      is_active: values.is_active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Ticket Tier' : 'Add Ticket Tier'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details for this ticket tier.'
              : 'Create a new ticket tier with pricing and availability options.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Early Bird, Regular, VIP"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Benefits or details about this tier..."
              rows={2}
              {...form.register('description')}
            />
          </div>

          {/* Price and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...form.register('price')}
              />
              {form.formState.errors.price && (
                <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={form.watch('currency')}
                onValueChange={(value) => form.setValue('currency', value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity Available</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="Leave empty for unlimited"
              {...form.register('quantity')}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for unlimited tickets
            </p>
          </div>

          {/* Sale Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale_start">Sale Start</Label>
              <Input
                id="sale_start"
                type="datetime-local"
                {...form.register('sale_start')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_end">Sale End</Label>
              <Input
                id="sale_end"
                type="datetime-local"
                {...form.register('sale_end')}
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Active</Label>
              <p className="text-sm text-muted-foreground">
                Make this tier available for purchase
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
              {isEditing ? 'Update Tier' : 'Create Tier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
