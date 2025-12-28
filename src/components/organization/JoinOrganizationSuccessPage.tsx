import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface JoinSuccessLocationState {
  organizationName?: string;
}

export const JoinOrganizationSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as JoinSuccessLocationState;

  const organizationName = state.organizationName || 'the organization';

  useEffect(() => {
    document.title = `Join request sent | Thittam1Hub`;

    const description = `Your request to join ${organizationName} has been submitted. Learn what happens next and when to expect approval.`;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + '/dashboard/organizations/join/success');
  }, [organizationName]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-border/70 bg-card/90 backdrop-blur">
          <CardHeader className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
              Organizations
            </p>
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Request sent successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm sm:text-base text-muted-foreground">
            <p>
              Your request to join <span className="font-medium text-foreground">{organizationName}</span>{' '}
              has been submitted. An organization admin will review your request and update your
              membership status.
            </p>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold tracking-wide text-foreground/90">
                What happens next?
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-medium text-foreground">Review by organizers:</span>{' '}
                  your profile and request details will be reviewed by the organization owner or
                  admins.
                </li>
                <li>
                  <span className="font-medium text-foreground">Email & in-app updates:</span>{' '}
                  you&apos;ll see your status change from <span className="font-mono">Pending</span>{' '}
                  to <span className="font-mono">Active</span> once approved, and you may receive an
                  email notification.
                </li>
                <li>
                  <span className="font-medium text-foreground">Typical approval time:</span>{' '}
                  most requests are reviewed within 24–72 hours, depending on the organization.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold tracking-wide text-foreground/90">
                While you wait
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Make sure your profile information is complete and up to date.</li>
                <li>Browse public events and opportunities available in Thittam1Hub.</li>
                <li>If you requested the wrong organization, you can submit a new request.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <div className="space-y-1 text-xs text-muted-foreground/80 max-w-md">
                <p>
                  You can return to the organization list at any time to check the status of your
                  request. Once approved, you&apos;ll see <span className="font-mono">Joined</span>{' '}
                  next to the organization name.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/organizations/join')}
                >
                  Back to organization list
                </Button>
                <Button
                  variant="default"
                  onClick={() => navigate('/dashboard/organizations')}
                >
                  Go to Organizations dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JoinOrganizationSuccessPage;
