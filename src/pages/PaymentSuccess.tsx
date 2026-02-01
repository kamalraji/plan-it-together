import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  Loader2, 
  XCircle, 
  Ticket, 
  Calendar,
  Home,
  RefreshCw
} from 'lucide-react';
import { useTicketCheckout } from '@/hooks/useTicketCheckout';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment, loading } = useTicketCheckout();
  
  const sessionId = searchParams.get('session_id');
  const registrationId = searchParams.get('registration_id') || searchParams.get('registrationId');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [registration, setRegistration] = useState<{
    id: string;
    eventName?: string;
    tierName?: string;
    quantity?: number;
    totalAmount?: number;
    currency?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkPaymentStatus = async () => {
    setStatus('loading');
    
    const result = await verifyPayment(sessionId || undefined, registrationId || undefined);
    
    if (!result) {
      setStatus('error');
      setErrorMessage('Failed to verify payment status');
      return;
    }

    if (result.status === 'confirmed') {
      setStatus('success');
      setRegistration(result.registration || null);
    } else if (result.status === 'pending') {
      setStatus('pending');
      setRegistration(result.registration || null);
    } else {
      setStatus('error');
      setErrorMessage(result.error || 'Payment verification failed');
    }
  };

  useEffect(() => {
    if (sessionId || registrationId) {
      checkPaymentStatus();
    } else {
      setStatus('error');
      setErrorMessage('Missing payment information');
    }
  }, [sessionId, registrationId]);

  const formatPrice = (amount: number, currency: string = 'USD') => {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return amount === 0 ? 'Free' : `${symbol}${amount.toLocaleString()}`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground text-center">
              Please wait while we confirm your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4 mb-4">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Payment Issue</h2>
            <p className="text-muted-foreground text-center mb-6">
              {errorMessage || 'There was an issue processing your payment.'}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Go Back
              </Button>
              <Button onClick={checkPaymentStatus}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-4 mb-4">
              <Loader2 className="h-12 w-12 text-yellow-600 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Payment Processing</h2>
            <p className="text-muted-foreground text-center mb-6">
              Your payment is being processed. This may take a moment.
            </p>
            <Button onClick={checkPaymentStatus}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <p className="text-muted-foreground mt-2">
            Your registration has been confirmed.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {registration && (
            <>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Event</p>
                    <p className="font-medium">{registration.eventName || 'Event'}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center gap-3">
                  <Ticket className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Ticket</p>
                    <p className="font-medium">{registration.tierName || 'Ticket'}</p>
                  </div>
                  <Badge variant="secondary">×{registration.quantity || 1}</Badge>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="text-xl font-bold">
                    {formatPrice(registration.totalAmount || 0, registration.currency)}
                  </span>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-center">
                  <strong>Confirmation ID:</strong>{' '}
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">
                    {registration.id.slice(0, 8).toUpperCase()}
                  </code>
                </p>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  A confirmation email has been sent to your registered email address.
                </p>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link to="/my-registrations">
                <Ticket className="h-4 w-4 mr-2" />
                My Tickets
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
