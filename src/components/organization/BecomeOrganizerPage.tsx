import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/looseClient';

export const BecomeOrganizerPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUserRoles } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: fnError } = await supabase.functions.invoke('self-approve-organizer');

      if (fnError) {
        setError(fnError.message || 'Failed to upgrade to organizer. Please try again.');
        setIsSubmitting(false);
        return;
      }

      await refreshUserRoles();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Failed to upgrade to organizer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream to-lavender/30 px-4">
      <section className="max-w-xl w-full bg-background/90 backdrop-blur-md border border-border/50 rounded-2xl shadow-soft p-8">
        <header className="mb-6 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Become an organizer
          </h1>
          <p className="text-sm text-muted-foreground">
            Upgrade your account to host events, manage teams, and access the organizer console.
          </p>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-muted-foreground">
            This will immediately upgrade your account to the <span className="font-medium">organizer</span>{' '}
            role. You will be able to create organizations, invite team members, and run events. You can
            still participate in events as usual.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard', { replace: true })}
              className="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background/60 text-muted-foreground hover:bg-background/90 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs sm:text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed shadow-soft"
            >
              {isSubmitting ? 'Upgrading…' : 'Upgrade to organizer'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};
