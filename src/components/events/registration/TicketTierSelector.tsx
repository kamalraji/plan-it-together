import React, { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Ticket, Minus, Plus, Tag, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  TicketTier, 
  getTierSaleStatus, 
  getTierStatusColor, 
  getTierStatusLabel,
} from '@/types/ticketTier';
import { usePromoCodeValidation } from '@/hooks/usePromoCodeValidation';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export interface TicketSelection {
  tierId: string;
  tierName: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

interface TicketTierSelectorProps {
  eventId: string;
  maxTicketsPerOrder?: number;
  onSelectionChange: (selection: TicketSelection | null, promoCodeId: string | null, discountAmount: number) => void;
  className?: string;
}

export const TicketTierSelector: React.FC<TicketTierSelectorProps> = ({
  eventId,
  maxTicketsPerOrder = 10,
  onSelectionChange,
  className,
}) => {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  // Fetch active ticket tiers
  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['public-ticket-tiers', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_tiers')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as TicketTier[];
    },
    enabled: !!eventId,
  });

  // Promo code validation
  const {
    isValidating: isValidatingPromo,
    appliedPromoCode,
    promoError,
    validatePromoCode,
    clearPromoCode,
  } = usePromoCodeValidation(eventId);

  // Get selected tier details
  const selectedTier = useMemo(() => {
    return tiers.find(t => t.id === selectedTierId) || null;
  }, [tiers, selectedTierId]);

  // Calculate pricing
  const pricing = useMemo(() => {
    if (!selectedTier) {
      return { subtotal: 0, discount: 0, total: 0, currency: 'INR' };
    }

    const subtotal = selectedTier.price * quantity;
    let discount = 0;

    if (appliedPromoCode) {
      if (appliedPromoCode.discount_type === 'percentage') {
        discount = (subtotal * appliedPromoCode.discount_value) / 100;
      } else {
        const applicableQty = appliedPromoCode.max_quantity 
          ? Math.min(quantity, appliedPromoCode.max_quantity) 
          : quantity;
        discount = appliedPromoCode.discount_value * applicableQty;
      }
      // Cap discount at subtotal
      discount = Math.min(discount, subtotal);
    }

    return {
      subtotal,
      discount,
      total: subtotal - discount,
      currency: selectedTier.currency,
    };
  }, [selectedTier, quantity, appliedPromoCode]);

  // Notify parent of selection changes
  const notifySelectionChange = useCallback((
    tier: TicketTier | null, 
    qty: number, 
    promoId: string | null, 
    discountAmt: number
  ) => {
    if (!tier) {
      onSelectionChange(null, null, 0);
      return;
    }

    onSelectionChange(
      {
        tierId: tier.id,
        tierName: tier.name,
        quantity: qty,
        unitPrice: tier.price,
        currency: tier.currency,
      },
      promoId,
      discountAmt
    );
  }, [onSelectionChange]);

  // Handle tier selection
  const handleTierSelect = (tier: TicketTier) => {
    const status = getTierSaleStatus(tier);
    if (status !== 'on_sale') return;

    setSelectedTierId(tier.id);
    setQuantity(1);
    // Clear promo when changing tier
    if (appliedPromoCode) {
      clearPromoCode();
      setPromoApplied(false);
      setPromoCode('');
    }
    notifySelectionChange(tier, 1, null, 0);
  };

  // Handle quantity change
  const handleQuantityChange = (delta: number) => {
    if (!selectedTier) return;

    const status = getTierSaleStatus(selectedTier);
    if (status !== 'on_sale') return;

    const maxAvailable = selectedTier.quantity !== null 
      ? selectedTier.quantity - selectedTier.sold_count 
      : Infinity;
    
    const newQty = Math.max(1, Math.min(quantity + delta, maxTicketsPerOrder, maxAvailable));
    setQuantity(newQty);

    // Re-validate promo code with new quantity
    if (appliedPromoCode) {
      notifySelectionChange(selectedTier, newQty, appliedPromoCode.id, pricing.discount);
    } else {
      notifySelectionChange(selectedTier, newQty, null, 0);
    }
  };

  // Handle promo code application
  const handleApplyPromo = async () => {
    if (!selectedTier || !promoCode.trim()) return;

    const subtotal = selectedTier.price * quantity;
    const result = await validatePromoCode(promoCode, selectedTierId || undefined, quantity, subtotal);
    
    if (result.isValid && result.promoCode) {
      setPromoApplied(true);
      notifySelectionChange(selectedTier, quantity, result.promoCode.id, result.discountAmount);
    }
  };

  // Handle promo code removal
  const handleRemovePromo = () => {
    clearPromoCode();
    setPromoApplied(false);
    setPromoCode('');
    if (selectedTier) {
      notifySelectionChange(selectedTier, quantity, null, 0);
    }
  };

  // Format price display
  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return `${symbol}${price.toLocaleString()}`;
  };

  // Get tier availability info
  const getTierAvailability = (tier: TicketTier): string => {
    const status = getTierSaleStatus(tier);
    if (status === 'sold_out') return 'Sold Out';
    if (status === 'upcoming') {
      return tier.sale_start 
        ? `Sales start ${new Date(tier.sale_start).toLocaleDateString()}` 
        : 'Coming Soon';
    }
    if (status === 'ended') return 'Sales Ended';
    if (status === 'inactive') return 'Not Available';
    
    if (tier.quantity !== null) {
      const remaining = tier.quantity - tier.sold_count;
      return `${remaining} remaining`;
    }
    return 'Available';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Select Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (tiers.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No tickets available for this event.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Select Tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tier Selection */}
        <div className="space-y-3">
          {tiers.map((tier) => {
            const status = getTierSaleStatus(tier);
            const statusColor = getTierStatusColor(status);
            const isSelected = selectedTierId === tier.id;
            const isAvailable = status === 'on_sale';

            return (
              <button
                key={tier.id}
                onClick={() => handleTierSelect(tier)}
                disabled={!isAvailable}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                  isSelected && isAvailable && 'border-primary bg-primary/5',
                  !isSelected && isAvailable && 'border-border hover:border-primary/50',
                  !isAvailable && 'border-muted bg-muted/30 cursor-not-allowed opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{tier.name}</h4>
                      <Badge variant="secondary" className={cn('text-xs', statusColor)}>
                        {getTierStatusLabel(status)}
                      </Badge>
                    </div>
                    {tier.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {tier.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {getTierAvailability(tier)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-lg">
                      {formatPrice(tier.price, tier.currency)}
                    </p>
                    {tier.price > 0 && (
                      <p className="text-xs text-muted-foreground">per ticket</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quantity Selector - only show when tier is selected */}
        {selectedTier && getTierSaleStatus(selectedTier) === 'on_sale' && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Quantity</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(1)}
                  disabled={
                    quantity >= maxTicketsPerOrder ||
                    (selectedTier.quantity !== null && 
                     quantity >= selectedTier.quantity - selectedTier.sold_count)
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Promo Code Section */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    disabled={promoApplied}
                    className="pl-9"
                  />
                </div>
                {promoApplied ? (
                  <Button variant="outline" onClick={handleRemovePromo}>
                    Remove
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim() || isValidatingPromo}
                  >
                    {isValidatingPromo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </Button>
                )}
              </div>
              
              {/* Promo feedback */}
              {promoError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {promoError}
                </p>
              )}
              {promoApplied && appliedPromoCode && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {appliedPromoCode.discount_type === 'percentage' 
                    ? `${appliedPromoCode.discount_value}% off applied!`
                    : `${formatPrice(appliedPromoCode.discount_value, pricing.currency)} off applied!`}
                </p>
              )}
            </div>

            {/* Price Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedTier.name} × {quantity}
                </span>
                <span>{formatPrice(pricing.subtotal, pricing.currency)}</span>
              </div>
              
              {pricing.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(pricing.discount, pricing.currency)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total</span>
                <span>{formatPrice(pricing.total, pricing.currency)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
