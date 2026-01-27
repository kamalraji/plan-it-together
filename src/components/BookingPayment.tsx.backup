import { useEffect, useState } from 'react';
import { isFeatureEnabled } from '../utils/features';

interface BookingPaymentProps {
  booking: {
    id: string;
    vendor: {
      businessName: string;
      contactEmail: string;
      contactPhone?: string;
    };
    serviceListing: {
      title: string;
      pricing: number;
    };
    totalAmount: number;
    currency: string;
  };
}

export function BookingPayment({ booking }: BookingPaymentProps) {
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isFeatureEnabled('PAYMENT_PROCESSING')
      .then(setPaymentEnabled)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
  }

  if (paymentEnabled) {
    // Future: Show integrated payment form
    return (
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Payment</h3>
        {/* Payment form would go here */}
        <div className="text-center py-8">
          <p className="text-gray-600">Integrated payment processing</p>
        </div>
      </div>
    );
  }

  // Current: Show direct payment instructions
  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Payment Instructions</h3>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">
              Direct Payment Required
            </h4>
            <p className="mt-1 text-sm text-blue-700">
              Please arrange payment directly with the vendor using your preferred method.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b">
          <span className="font-medium">Service:</span>
          <span>{booking.serviceListing.title}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="font-medium">Total Amount:</span>
          <span className="text-lg font-semibold">
            {booking.currency} {booking.totalAmount.toFixed(2)}
          </span>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Vendor Contact Information</h4>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <a 
                href={`mailto:${booking.vendor.contactEmail}?subject=Payment for ${booking.serviceListing.title}&body=Hi ${booking.vendor.businessName},%0D%0A%0D%0AI would like to arrange payment for the booking: ${booking.serviceListing.title}%0D%0ATotal Amount: ${booking.currency} ${booking.totalAmount.toFixed(2)}%0D%0A%0D%0APlease let me know your preferred payment method.%0D%0A%0D%0AThank you!`}
                className="text-blue-600 hover:text-blue-800"
              >
                {booking.vendor.contactEmail}
              </a>
            </div>
            
            {booking.vendor.contactPhone && (
              <div className="flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <a 
                  href={`tel:${booking.vendor.contactPhone}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {booking.vendor.contactPhone}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Important</h4>
              <p className="mt-1 text-sm text-yellow-700">
                Please keep records of your payment for your own reference. 
                Once payment is confirmed with the vendor, they will update the booking status.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => window.open(`mailto:${booking.vendor.contactEmail}?subject=Payment for ${booking.serviceListing.title}`, '_blank')}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Vendor via Email
          </button>
          
          {booking.vendor.contactPhone && (
            <button
              onClick={() => window.open(`tel:${booking.vendor.contactPhone}`, '_blank')}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Call Vendor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}