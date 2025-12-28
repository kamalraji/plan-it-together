import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyMemberOrganizations } from '@/hooks/useOrganization';

export const OrganizerRootDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: orgs, isLoading: orgsLoading } = useMyMemberOrganizations();

  const hasOrgs = Array.isArray(orgs) && orgs.length > 0;

  return (
    <main className="min-h-screen bg-background">
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">/ Organizer</p>
          <h1 className="text-3xl font-bold text-foreground">Organizer home</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Welcome back{user?.name ? `, ${user.name}` : ''}. From here you can create or join organizations
            and jump into each organization dashboard.
          </p>
        </header>

        {orgsLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : !hasOrgs ? (
          <section className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">You don&apos;t have any organizations yet</h2>
            <p className="text-sm text-muted-foreground">
              Create your first organization to start running events and workspaces, or request to join an
              existing one.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/organizations/create"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Create organization
              </Link>
              <Link
                to="/dashboard/organizations/join"
                className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Join existing organization
              </Link>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Your organizations</h2>
              <Link
                to="/organizations/create"
                className="text-xs font-medium text-primary hover:text-primary/80"
              >
                + Create another organization
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orgs!.map((org: any) => (
                <article
                  key={org.id}
                  className="rounded-xl border border-border bg-card/80 p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-foreground truncate">{org.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{org.slug}</p>
                    </div>
                    {org.role && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                        {org.role}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Link
                      to={`/${org.slug}/dashboard`}
                      className="flex-1 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-medium py-2 hover:bg-primary/90"
                    >
                      Open dashboard
                    </Link>
                    <Link
                      to={`/${org.slug}/settings/dashboard`}
                      className="flex-1 inline-flex items-center justify-center rounded-lg border border-border text-xs font-medium py-2 text-foreground hover:bg-muted"
                    >
                      Settings
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
};
