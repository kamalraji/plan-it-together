import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import { Event, EventVisibility } from '../../types';

interface PrivateEventAccessProps {
  eventId?: string;
}

export function PrivateEventAccess({ eventId: propEventId }: PrivateEventAccessProps) {
  const { eventId: paramEventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const eventId = propEventId || paramEventId;
  const inviteToken = searchParams.get('invite');

  // Fetch event details to check if it's private (Requirements 24.2, 24.3)
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}`);
      return response.data.event as Event;
    },
    enabled: !!eventId,
  });

  // Validate invite link access (Requirements 24.1, 24.2)
  const validateAccessMutation = useMutation({
    mutationFn: async (data: { inviteToken?: string; accessCode?: string }) => {
      const response = await api.post(`/events/${eventId}/validate-access`, data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.hasAccess) {
        // Redirect to event page or registration
        navigate(`/events/${eventId}`);
      } else {
        setError(data.message || 'Access denied');
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to validate access');
    },
  });

  // Auto-validate if invite token is present
  useEffect(() => {
    if (inviteToken && eventId && !validateAccessMutation.isPending) {
      validateAccessMutation.mutate({ inviteToken });
    }
  }, [inviteToken, eventId]);

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim()) {
      setError(null);
      validateAccessMutation.mutate({ accessCode: accessCode.trim() });
    }
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full bg-card rounded-lg shadow-md p-6 text-center border border-border">
          <div className="text-destructive text-4xl mb-4 font-bold">!</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // If event is not private, redirect to normal event page
  if (event.visibility !== EventVisibility.PRIVATE) {
    navigate(`/events/${eventId}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full bg-card rounded-lg shadow-md p-6 border border-border">
        {/* Event Header */}
        <div className="text-center mb-6">
          {event.organization?.branding?.logoUrl && (
            <img
              src={event.organization.branding.logoUrl}
              alt={event.organization.name}
              className="h-16 w-16 object-contain mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold text-foreground mb-2">{event.name}</h1>
          {event.organization && (
            <p className="text-sm text-muted-foreground">
              Hosted by {event.organization.name}
              {event.organization.verificationStatus === 'VERIFIED' && (
                <span className="ml-1 text-primary">✓</span>
              )}
            </p>
          )}
        </div>

        {/* Access Control (Requirements 24.2, 24.3) */}
        <div className="border-t pt-6">
          <div className="text-center mb-6">
            <div className="text-yellow-500 text-4xl mb-3">🔒</div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Private Event</h2>
            <p className="text-muted-foreground text-sm">
              This is a private event. You need an invitation to access it.
            </p>
          </div>

          {/* Access Code Form */}
          {!inviteToken && (
            <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Access Code
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter your access code"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={validateAccessMutation.isPending || !accessCode.trim()}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validateAccessMutation.isPending ? 'Validating...' : 'Access Event'}
              </button>
            </form>
          )}

          {/* Validating invite token */}
          {inviteToken && validateAccessMutation.isPending && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-muted-foreground">Validating your invitation...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <div className="text-red-400 text-lg mr-2">❌</div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Member Criteria Information (Requirements 24.3) */}
          <div className="mt-6 p-4 bg-primary/5 border border-primary/30 rounded-md">
            <h3 className="text-sm font-medium text-primary mb-2">How to get access:</h3>
            <ul className="text-sm text-primary space-y-1">
              <li>• Contact the event organizer for an invitation</li>
              <li>• Use the invite link shared with you</li>
              {event.organization && (
                <li>• Be a member of {event.organization.name}</li>
              )}
            </ul>
          </div>

          {/* Contact Information */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Need help? Contact the event organizer
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrivateEventAccess;