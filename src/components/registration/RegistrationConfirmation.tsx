import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Registration, RegistrationStatus, Event } from '../../types';

interface RegistrationConfirmationProps {
  registration: Registration;
  event: Event;
}

export const RegistrationConfirmation: React.FC<RegistrationConfirmationProps> = ({
  registration,
  event,
}) => {
  const navigate = useNavigate();

  const getStatusInfo = () => {
    switch (registration.status) {
      case RegistrationStatus.CONFIRMED:
        return {
          icon: (
            <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Registration Confirmed!',
          message: 'You\'re all set for the event. Check your email for your QR code and event details.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
        };
      case RegistrationStatus.WAITLISTED:
        return {
          icon: (
            <svg className="h-12 w-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'You\'re on the Waitlist',
          message: 'The event is currently full, but we\'ve added you to the waitlist. We\'ll notify you if a spot becomes available.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
        };
      case RegistrationStatus.PENDING:
        return {
          icon: (
            <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Registration Pending',
          message: 'Your registration is being processed. You\'ll receive a confirmation email shortly.',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
        };
      default:
        return {
          icon: (
            <svg className="h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Registration Submitted',
          message: 'Your registration has been submitted.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="max-w-2xl mx-auto">
      <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-8`}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center mb-6">
            {statusInfo.icon}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {statusInfo.title}
          </h2>
          
          <p className={`text-lg ${statusInfo.textColor} mb-6`}>
            {statusInfo.message}
          </p>

          {/* Event Details Summary */}
          <div className="bg-white rounded-lg p-6 mb-6 text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Event:</span>
                <span className="font-medium text-gray-900">{event.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">
                  {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mode:</span>
                <span className="font-medium text-gray-900">{event.mode}</span>
              </div>
              {event.venue && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Venue:</span>
                  <span className="font-medium text-gray-900">{event.venue.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Registration ID:</span>
                <span className="font-mono text-sm text-gray-900">{registration.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  registration.status === RegistrationStatus.CONFIRMED 
                    ? 'bg-green-100 text-green-800'
                    : registration.status === RegistrationStatus.WAITLISTED
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {registration.status}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-lg p-6 mb-6 text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              {registration.status === RegistrationStatus.CONFIRMED && (
                <>
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Check your email for your QR code and event details</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save the QR code to your phone for easy check-in</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Visit your dashboard to view event updates and materials</span>
                  </div>
                </>
              )}
              
              {registration.status === RegistrationStatus.WAITLISTED && (
                <>
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>We'll email you immediately if a spot becomes available</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Keep an eye on your email for updates</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Check your dashboard for waitlist position updates</span>
                  </div>
                </>
              )}

              {registration.status === RegistrationStatus.PENDING && (
                <>
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>You'll receive a confirmation email within 24 hours</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Check your dashboard for status updates</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate(`/events/${event.id}`)}
              className="flex-1 sm:flex-none bg-gray-200 text-gray-800 px-6 py-3 rounded-md font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              View Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};