import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
export const ProfileSettingsPage: React.FC = () => {
  const {
    user
  } = useAuth();
  const {
    preferences: prefs,
    updatePreferences
  } = useNotifications(user?.id);
  useEffect(() => {
    document.title = 'Profile settings | Thittam1Hub';
    const description = 'Manage notification preferences and account details for your Thittam1Hub profile.';
    let meta = document.querySelector("meta[name='description']");
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + '/dashboard/profile/settings');
  }, []);
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">You need to be logged in to manage settings.</p>
      </div>;
  }
  return <main className="min-h-screen bg-gradient-to-br from-cream to-lavender/20 px-4 sm:px-6 lg:px-8 py-8">
      <section className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
            Profile settings
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
            Control how Thittam1Hub contacts you and review your basic account information.
          </p>
        </header>

        <div className="space-y-6">
          {/* Account summary */}
          <section className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-4">Account</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium text-foreground">{user.email}</dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Role</dt>
                <dd className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {user.role}
                </dd>
              </div>
            </dl>
          </section>

          {/* Become organizer banner for participants */}
          {user.role === 'PARTICIPANT' && (
            <section className="rounded-xl border border-accent bg-accent/10 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-foreground">Become an organizer</h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                  Upgrade your account to create organizations, host events, and invite your own team while
                  still participating in events.
                </p>
              </div>
              <a
                href="/dashboard/onboarding/become-organizer"
                className="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Become an organizer
              </a>
            </section>
          )}

            {!prefs ? <p className="text-xs text-muted-foreground">
                Loading your notification preferences…
              </p> : <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" checked={prefs.workspace_enabled} onChange={e => updatePreferences({
                  workspace_enabled: e.target.checked
                })} />
                    <span>
                      <span className="block font-medium text-foreground">Workspaces</span>
                      <span className="block text-xs text-muted-foreground">
                        Task updates, mentions, and workspace invitations.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" checked={prefs.event_enabled} onChange={e => updatePreferences({
                  event_enabled: e.target.checked
                })} />
                    <span>
                      <span className="block font-medium text-foreground">Events</span>
                      <span className="block text-xs text-muted-foreground">
                        Event reminders and schedule changes.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" checked={prefs.marketplace_enabled} onChange={e => updatePreferences({
                  marketplace_enabled: e.target.checked
                })} />
                    <span>
                      <span className="block font-medium text-foreground">Marketplace</span>
                      <span className="block text-xs text-muted-foreground">
                        Booking updates and service messages.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" checked={prefs.organization_enabled} onChange={e => updatePreferences({
                  organization_enabled: e.target.checked
                })} />
                    <span>
                      <span className="block font-medium text-foreground">Organizations</span>
                      <span className="block text-xs text-muted-foreground">
                        Invitations and updates from organizations you follow.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" checked={prefs.system_enabled} onChange={e => updatePreferences({
                  system_enabled: e.target.checked
                })} />
                    <span>
                      <span className="block font-medium text-foreground">System</span>
                      <span className="block text-xs text-muted-foreground">
                        Important product updates and security alerts.
                      </span>
                    </span>
                  </label>
                </div>

                <div className="border-t border-border pt-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" checked={prefs.sound_enabled} onChange={e => updatePreferences({
                  sound_enabled: e.target.checked
                })} />
                    <span>
                      <span className="block font-medium text-foreground">Sound</span>
                      <span className="block text-xs text-muted-foreground">
                        Play a short sound for important notifications.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" checked={prefs.vibration_enabled} onChange={e => updatePreferences({
                  vibration_enabled: e.target.checked
                })} />
                    <span>
                      <span className="block font-medium text-foreground">Vibration</span>
                      <span className="block text-xs text-muted-foreground">
                        Use vibration on supported devices for critical alerts.
                      </span>
                    </span>
                  </label>
                </div>
              </div>}
          </section>
        </div>
      </section>
    </main>;
};