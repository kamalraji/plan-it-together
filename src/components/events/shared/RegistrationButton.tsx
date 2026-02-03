import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDeepLink } from '@/hooks/useDeepLink';

interface RegistrationButtonProps {
  eventId: string;
  eventSlug?: string;
  label?: string;
  tierId?: string;
  promoCode?: string;
  disabled?: boolean;
  isFull?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export function RegistrationButton({ 
  eventId,
  eventSlug,
  label = 'Register Now',
  tierId,
  promoCode,
  disabled = false,
  isFull = false,
  className,
  variant = 'default',
  size = 'default'
}: RegistrationButtonProps) {
  const navigate = useNavigate();
  const { createEventLink } = useDeepLink();
  
  const handleClick = () => {
    if (eventSlug) {
      // Use deep link with optional tier and promo
      const link = createEventLink(eventSlug, { 
        tab: 'register',
        tier: tierId,
        promo: promoCode 
      });
      navigate(link);
    } else {
      // Fallback to ID-based URL
      let url = `/events/${eventId}`;
      const params = new URLSearchParams();
      if (tierId) params.set('tier', tierId);
      if (promoCode) params.set('promo', promoCode);
      if (params.toString()) url += `?${params}`;
      navigate(url);
    }
  };
  
  if (isFull) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={cn('cursor-not-allowed', className)}
        aria-label="Event is sold out"
      >
        Sold Out
      </Button>
    );
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={cn('min-h-[44px]', className)}
      aria-label={`Register for this event${tierId ? ' with selected tier' : ''}`}
    >
      {label}
    </Button>
  );
}
