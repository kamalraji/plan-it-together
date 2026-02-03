import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { GripVertical, MoreVertical, Pencil, Copy, Trash2 } from 'lucide-react';
import { 
  TicketTier, 
  getTierSaleStatus, 
  getTierStatusColor, 
  getTierStatusLabel 
} from '@/types/ticketTier';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

interface TicketTierCardProps {
  tier: TicketTier;
  onEdit: (tier: TicketTier) => void;
  onDuplicate: (tier: TicketTier) => void;
  onDelete: (tier: TicketTier) => void;
  isDragging?: boolean;
}

export const TicketTierCard: React.FC<TicketTierCardProps> = ({
  tier,
  onEdit,
  onDuplicate,
  onDelete,
  isDragging = false,
}) => {
  const status = getTierSaleStatus(tier);
  const statusColor = getTierStatusColor(status);
  const statusLabel = getTierStatusLabel(status);
  const currencySymbol = CURRENCY_SYMBOLS[tier.currency] || tier.currency;

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `${currencySymbol}${price.toLocaleString()}`;
  };

  const getAvailabilityText = () => {
    if (tier.quantity === null) {
      return `${tier.sold_count} sold`;
    }
    return `${tier.sold_count}/${tier.quantity} sold`;
  };

  return (
    <Card 
      className={`p-4 transition-shadow ${isDragging ? 'shadow-lg ring-2 ring-primary' : 'hover:shadow-md'}`}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div className="cursor-grab text-muted-foreground hover:text-foreground mt-1">
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold truncate">{tier.name}</h4>
                <Badge variant="secondary" className={`text-xs ${statusColor}`}>
                  {statusLabel}
                </Badge>
              </div>
              {tier.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {tier.description}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="text-right shrink-0">
              <p className="font-bold text-lg">{formatPrice(tier.price)}</p>
              <p className="text-xs text-muted-foreground">{getAvailabilityText()}</p>
            </div>
          </div>

          {/* Sale Period Info */}
          {(tier.sale_start || tier.sale_end) && (
            <div className="mt-2 text-xs text-muted-foreground">
              {tier.sale_start && (
                <span>
                  Starts: {new Date(tier.sale_start).toLocaleDateString()}
                </span>
              )}
              {tier.sale_start && tier.sale_end && <span className="mx-1">•</span>}
              {tier.sale_end && (
                <span>
                  Ends: {new Date(tier.sale_end).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(tier)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(tier)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(tier)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};
