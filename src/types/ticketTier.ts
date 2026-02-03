export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantity: number | null;
  sold_count: number;
  sale_start: string | null;
  sale_end: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketTierDTO {
  event_id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  quantity?: number | null;
  sale_start?: string | null;
  sale_end?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateTicketTierDTO extends Partial<Omit<CreateTicketTierDTO, 'event_id'>> {
  id: string;
}

export type TierSaleStatus = 'upcoming' | 'on_sale' | 'ended' | 'sold_out' | 'inactive';

export function getTierSaleStatus(tier: TicketTier): TierSaleStatus {
  if (!tier.is_active) return 'inactive';
  
  const now = new Date();
  
  if (tier.sale_start && new Date(tier.sale_start) > now) {
    return 'upcoming';
  }
  
  if (tier.sale_end && new Date(tier.sale_end) < now) {
    return 'ended';
  }
  
  if (tier.quantity !== null && tier.sold_count >= tier.quantity) {
    return 'sold_out';
  }
  
  return 'on_sale';
}

export function getTierStatusColor(status: TierSaleStatus): string {
  switch (status) {
    case 'on_sale': return 'text-green-600 bg-green-100';
    case 'upcoming': return 'text-yellow-600 bg-yellow-100';
    case 'ended': return 'text-muted-foreground bg-muted';
    case 'sold_out': return 'text-red-600 bg-red-100';
    case 'inactive': return 'text-muted-foreground bg-muted';
  }
}

export function getTierStatusLabel(status: TierSaleStatus): string {
  switch (status) {
    case 'on_sale': return 'On Sale';
    case 'upcoming': return 'Upcoming';
    case 'ended': return 'Ended';
    case 'sold_out': return 'Sold Out';
    case 'inactive': return 'Inactive';
  }
}
