import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function PublicLandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <span className="text-primary-foreground text-sm font-bold">T1</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-semibold text-foreground leading-tight">
                Thittam1Hub
              </span>
              <span className="hidden sm:inline text-[11px] text-muted-foreground tracking-wide uppercase">
                Event OS for modern teams
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <Link
              to="/events"
              className="rounded-full px-3 py-1.5 text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Browse events
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                className="rounded-full px-3 py-1.5 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Go to dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-full px-3 py-1.5 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 space-y-12 sm:space-y-16">
        {/* Hero */}
        <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5 sm:space-y-6 animate-fade-in">
            <p className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Participant & Organizer hub
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              All your hackathon journeys in one place.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
              Discover events, register in a few clicks, check in with a single QR pass, and collect
              certificates—while organizers get a powerful console for tracking attendance and scores.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <Link
                to="/events"
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 hover-scale"
              >
                Browse public events
              </Link>
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-border/70 bg-background/80 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/70 hover-scale"
                >
                  Open my dashboard
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-full border border-border/70 bg-background/80 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/70 hover-scale"
                >
                  Create free account
                </Link>
              )}
            </div>

            <div className="flex items-center gap-4 pt-2 text-xs sm:text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live QR attendance
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Certificate generation built in</span>
            </div>
          </div>

          {/* Hero card */}
          <div className="lg:pl-8">
            <div className="relative max-w-md mx-auto">
              <div className="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-3xl" aria-hidden="true" />
              <div className="relative rounded-[1.75rem] border border-border/60 bg-card/90 backdrop-blur-xl shadow-xl p-4 sm:p-5 space-y-4 animate-scale-in">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                      Next event
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-foreground">
                      Thittam1Hub Hackathon
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                    Registration open
                  </span>
                </div>

                <div className="rounded-xl border border-dashed border-border/60 bg-background/80 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Your universal QR pass</p>
                    <p className="text-sm font-medium text-foreground">Reuse across every joined event</p>
                  </div>
                  <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                    QR Preview
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="font-semibold text-foreground mb-1">Participants</p>
                    <p className="text-2xl font-bold text-primary">1.2k</p>
                    <p className="text-[11px] text-muted-foreground">Real-time check-ins</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="font-semibold text-foreground mb-1">Certificates</p>
                    <p className="text-2xl font-bold text-primary">430</p>
                    <p className="text-[11px] text-muted-foreground">Auto-generated PDFs</p>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  Built for colleges, communities, and hackathon teams running recurring events.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature highlights */}
        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'One QR for every event',
              body: 'Participants get a single profile QR pass that works across all the events they join—no new codes every time.',
            },
            {
              title: 'Participant-first dashboard',
              body: 'Attendees can see upcoming events, past attendance, and certificates in a clean, mobile-first dashboard.',
            },
            {
              title: 'Organizer-grade console',
              body: 'Workspace-style console for organizers with live attendance, judging, and organization management tools.',
            },
          ].map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 sm:p-5 shadow-sm animate-fade-in"
            >
              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{feature.body}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
