export interface PromoCode {
  id: string;
  event_id: string;
  code: string;
  name: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string | null;
  valid_until: string | null;
  min_quantity: number;
  max_quantity: number | null;
  applicable_tier_ids: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePromoCodeDTO {
  event_id: string;
  code: string;
  name?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  min_quantity?: number;
  max_quantity?: number | null;
  applicable_tier_ids?: string[] | null;
  is_active?: boolean;
}

export type PromoCodeStatus = 'active' | 'expired' | 'exhausted' | 'upcoming' | 'inactive';

export function getPromoCodeStatus(code: PromoCode): PromoCodeStatus {
  if (!code.is_active) return 'inactive';
  
  const now = new Date();
  
  if (code.valid_from && new Date(code.valid_from) > now) {
    return 'upcoming';
  }
  
  if (code.valid_until && new Date(code.valid_until) < now) {
    return 'expired';
  }
  
  if (code.max_uses !== null && code.current_uses >= code.max_uses) {
    return 'exhausted';
  }
  
  return 'active';
}

export function getPromoCodeStatusColor(status: PromoCodeStatus): string {
  switch (status) {
    case 'active': return 'text-success bg-success/20';
    case 'upcoming': return 'text-warning bg-warning/20';
    case 'expired': return 'text-muted-foreground bg-muted';
    case 'exhausted': return 'text-destructive bg-destructive/20';
    case 'inactive': return 'text-muted-foreground bg-muted';
  }
}

export function formatDiscount(code: PromoCode): string {
  if (code.discount_type === 'percentage') {
    return `${code.discount_value}% off`;
  }
  return `₹${code.discount_value} off`;
}

export function calculateDiscount(
  code: PromoCode,
  subtotal: number,
  quantity: number,
  tierId?: string
): number {
  // Check if code applies to this tier
  if (code.applicable_tier_ids && code.applicable_tier_ids.length > 0) {
    if (!tierId || !code.applicable_tier_ids.includes(tierId)) {
      return 0;
    }
  }
  
  // Check quantity requirements
  if (quantity < code.min_quantity) {
    return 0;
  }
  
  // Calculate discount
  let discount = 0;
  if (code.discount_type === 'percentage') {
    discount = (subtotal * code.discount_value) / 100;
  } else {
    // Fixed amount - apply per applicable ticket up to max_quantity
    const applicableQty = code.max_quantity 
      ? Math.min(quantity, code.max_quantity) 
      : quantity;
    discount = code.discount_value * applicableQty;
  }
  
  // Discount cannot exceed subtotal
  return Math.min(discount, subtotal);
}
