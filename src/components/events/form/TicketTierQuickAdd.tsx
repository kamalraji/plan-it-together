import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Ticket, GripVertical } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CURRENCIES = [
  { value: 'INR', label: '₹ INR' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export interface QuickTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number | null;
}

interface TicketTierQuickAddProps {
  tiers: QuickTier[];
  onChange: (tiers: QuickTier[]) => void;
  disabled?: boolean;
}

export const TicketTierQuickAdd: React.FC<TicketTierQuickAddProps> = ({
  tiers,
  onChange,
  disabled = false,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [quantity, setQuantity] = useState('');

  const handleAddTier = () => {
    if (!name.trim()) return;

    const newTier: QuickTier = {
      id: `temp-${Date.now()}`,
      name: name.trim(),
      price: parseFloat(price) || 0,
      currency,
      quantity: quantity ? parseInt(quantity, 10) : null,
    };

    onChange([...tiers, newTier]);
    
    // Reset form
    setName('');
    setPrice('');
    setQuantity('');
  };

  const handleRemoveTier = (tierId: string) => {
    onChange(tiers.filter(t => t.id !== tierId));
  };

  const formatPrice = (tierPrice: number, tierCurrency: string) => {
    if (tierPrice === 0) return 'Free';
    const symbol = CURRENCY_SYMBOLS[tierCurrency] || tierCurrency;
    return `${symbol}${tierPrice.toLocaleString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Existing tiers list */}
      {tiers.length > 0 && (
        <div className="space-y-2">
          {tiers.map((tier) => (
            <Card key={tier.id} className="bg-muted/30">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-primary" />
                      <span className="font-medium truncate">{tier.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {formatPrice(tier.price, tier.currency)}
                      </Badge>
                      {tier.quantity !== null && (
                        <span>{tier.quantity} tickets</span>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveTier(tier.id)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add new tier form */}
      <Card className="border-dashed">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tier-name" className="text-sm">Tier Name *</Label>
              <Input
                id="tier-name"
                placeholder="e.g., Early Bird, VIP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tier-price" className="text-sm">Price</Label>
              <div className="flex gap-2">
                <Select value={currency} onValueChange={setCurrency} disabled={disabled}>
                  <SelectTrigger className="w-24">
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
                <Input
                  id="tier-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={disabled}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tier-quantity" className="text-sm">Quantity (optional)</Label>
              <Input
                id="tier-quantity"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTier}
                disabled={disabled || !name.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {tiers.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Add your first ticket tier above. You can add more tiers after creating the event.
        </p>
      )}
    </div>
  );
};
