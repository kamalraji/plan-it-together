import { useEffect, useState, useRef } from 'react';

interface LiveRegionProps {
  /** Message to announce to screen readers */
  message: string;
  /** Priority: 'polite' waits for user to be idle, 'assertive' interrupts immediately */
  priority?: 'polite' | 'assertive';
  /** Clear the message after this many ms (default: 5000) */
  clearAfter?: number;
}

/**
 * Announces messages to screen readers without visual change
 * Use for dynamic content updates, form submissions, loading states, etc.
 */
export function LiveRegion({ 
  message, 
  priority = 'polite',
  clearAfter = 5000 
}: LiveRegionProps) {
  const [announcement, setAnnouncement] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (message) {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set the announcement
      setAnnouncement(message);
      
      // Clear after delay to allow re-announcement of same message
      timeoutRef.current = setTimeout(() => {
        setAnnouncement('');
      }, clearAfter);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

/**
 * Hook to manage live region announcements
 */
export function useLiveAnnouncement() {
  const [message, setMessage] = useState('');

  const announce = (newMessage: string) => {
    // Toggle empty string to force re-announcement of same message
    setMessage('');
    setTimeout(() => setMessage(newMessage), 50);
  };

  return { message, announce };
}
