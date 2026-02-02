import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Ticket, Tag, CheckCircle2 } from 'lucide-react';
import type { TicketSelection } from './TicketTierSelector';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

interface OrderSummaryProps {
  selection: TicketSelection | null;
  discountAmount: number;
  promoCode?: string | null;
  className?: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  selection,
  discountAmount,
  promoCode,
  className,
}) => {
  if (!selection) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a ticket to see your order summary.
          </p>
        </CardContent>
      </Card>
    );
  }

  const symbol = CURRENCY_SYMBOLS[selection.currency] || selection.currency;
  const subtotal = selection.unitPrice * selection.quantity;
  const total = Math.max(0, subtotal - discountAmount);

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `${symbol}${price.toLocaleString()}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="h-4 w-4" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ticket line item */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Ticket className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selection.tierName}</p>
            <p className="text-sm text-muted-foreground">
              {formatPrice(selection.unitPrice)} × {selection.quantity}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-medium">{formatPrice(subtotal)}</p>
          </div>
        </div>

        {/* Promo code badge */}
        {promoCode && discountAmount > 0 && (
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <Tag className="h-4 w-4 text-green-600" />
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              {promoCode}
            </Badge>
            <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
          </div>
        )}

        {/* Price breakdown */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Free event note */}
        {total === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            No payment required for this registration.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
