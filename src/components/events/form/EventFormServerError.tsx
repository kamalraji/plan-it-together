/**
 * Event Form Server Error Component
 * Displays server-side errors with optional action buttons
 */
import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/looseClient';
import { useToast } from '@/hooks/use-toast';

interface EventFormServerErrorProps {
  error: string;
}

export const EventFormServerError: React.FC<EventFormServerErrorProps> = ({ error }) => {
  const { toast } = useToast();
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const showAccessRequest = error.includes('organizer/admin permissions');

  const handleRequestAccess = async () => {
    if (isRequestingAccess) return;
    setIsRequestingAccess(true);
    try {
      const { error: invokeError } = await supabase.functions.invoke('self-approve-organizer');
      if (invokeError) throw invokeError;
      toast({
        title: 'Organizer access requested',
        description: 'Your request has been recorded.',
      });
    } catch {
      toast({
        title: 'Failed to request access',
        variant: 'destructive',
      });
    } finally {
      setIsRequestingAccess(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <Alert variant="destructive">
        <AlertTitle>Failed to save event</AlertTitle>
        <AlertDescription>
          <p>{error}</p>
          {showAccessRequest && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 border-destructive text-destructive hover:bg-destructive/10"
              disabled={isRequestingAccess}
              onClick={handleRequestAccess}
            >
              {isRequestingAccess ? 'Requesting…' : 'Request organizer access'}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EventFormServerError;
