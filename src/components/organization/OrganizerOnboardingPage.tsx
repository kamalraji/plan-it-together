import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Info } from 'lucide-react';
import { useMyMemberOrganizations } from '@/hooks/useOrganization';
import { useEventCreatePath } from '@/hooks/useEventCreatePath';

interface OnboardingChecklistRow {
  id: string;
  user_id: string;
  organization_id: string | null;
  completed_at: string | null;
}

export const OrganizerOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: memberOrganizations, isLoading: loadingMemberOrgs } = useMyMemberOrganizations();

  const primaryOrganization = memberOrganizations && memberOrganizations.length > 0
    ? memberOrganizations[0]
    : null;

  const { data: checklist, isLoading } = useQuery<OnboardingChecklistRow | null>({
    queryKey: ['organizer-onboarding-checklist', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('onboarding_checklist')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return (data as OnboardingChecklistRow) ?? null;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { data: existing, error: existingError } = await supabase
        .from('onboarding_checklist')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (existingError && existingError.code !== 'PGRST116') throw existingError;
      if (existing) {
        const { error } = await supabase
          .from('onboarding_checklist')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('onboarding_checklist').insert({
          user_id: user.id,
          completed_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-onboarding-checklist', user?.id] });
      navigate('/dashboard', { replace: true });
    },
  });

  useEffect(() => {
    document.title = 'Organizer Onboarding | Thittam1Hub';
    let meta = document.querySelector("meta[name='description']");
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      'content',
      'Organizer onboarding checklist to create your first event and invite team members in Thittam1Hub.',
    );
  }, []);

  const isCompleted = !!checklist?.completed_at;
  const progressPercent = isCompleted ? 100 : 40;
  const statusLabel = isCompleted ? 'Checklist completed' : 'In progress';

  return (
    <main className="min-h-screen bg-gradient-to-br from-cream to-lavender/30">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
        <header className="mb-8 text-center space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground/80">
            Organizer Onboarding
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Launch your first event in minutes
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Follow this quick checklist to set up your organization workspace, create your first
            event, and invite your core team.
          </p>
        </header>

        <Card className="bg-card/90 backdrop-blur border-border/70 shadow-lg">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg">Getting started checklist</CardTitle>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                <CheckCircle2 className={`h-3.5 w-3.5 ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`} />
                {statusLabel}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Three quick steps to get your organizer workspace ready. You can come back here any
              time from your dashboard.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ol className="space-y-4 text-sm text-foreground">
              <li className="flex gap-3">
                <span className="mt-1 h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  1
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Confirm your organization details</p>
                    <span
                      className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-1 cursor-help"
                      aria-label="Why this matters"
                      title="A clear organization profile builds trust with participants and partners."
                    >
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Review your organization profile, logo, and contact details so participants know
                    who&apos;s running the event.
                  </p>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingMemberOrgs}
                      onClick={() => {
                        if (primaryOrganization) {
                          navigate(`/${primaryOrganization.slug}/settings/dashboard`);
                        } else {
                          navigate('/dashboard/organizations/join');
                        }
                      }}
                    >
                      {primaryOrganization ? 'Manage organization settings' : 'Join or create organization'}
                    </Button>
                    <a
                      href="https://thittam1hub.com/help/organizer-organization-setup"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      How to structure your organization profile
                    </a>
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  2
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Create your first event</p>
                    <span
                      className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-1 cursor-help"
                      aria-label="Why this matters"
                      title="Defining dates, format, and capacity early helps you communicate clearly and plan operations."
                    >
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Define the basics: name, date, format (online/offline), and capacity for your
                    first event.
                  </p>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => {
                        const target = useEventCreatePath();
                        navigate(target);
                      }}
                    >
                      Create event
                    </Button>
                    <a
                      href="https://thittam1hub.com/help/organizer-first-event"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      Tips for a high-impact first event
                    </a>
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  3
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Invite your core team</p>
                    <span
                      className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-1 cursor-help"
                      aria-label="Why this matters"
                      title="Bringing co-organizers, volunteers, and judges in early spreads the workload and improves quality."
                    >
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Share access with co-organizers, volunteers, or judges so they can help manage
                    registrations and run the event.
                  </p>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => navigate(primaryOrganization ? `/${primaryOrganization.slug}/team` : '/dashboard/organizations/join')}>
                      Manage team members
                    </Button>
                    <a
                      href="https://thittam1hub.com/help/organizer-team-roles"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      Best practices for team roles
                    </a>
                  </div>
                </div>
              </li>
            </ol>

            <div className="pt-4 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                You can revisit this checklist anytime from your dashboard. Mark it complete once
                you&apos;ve created your first event and invited your team.
              </p>
              <Button
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending || isLoading}
              >
                {isCompleted ? 'Continue to dashboard' : 'Mark checklist as complete'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default OrganizerOnboardingPage;
