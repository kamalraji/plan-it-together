import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  useEffect(() => {
    const title = "Thittam1Hub – Unified event, workspace & certificate hub";
    const description =
      "Plan, run, and verify events in one place – registrations, QR check-ins, workspaces, certificates, and vendors.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.origin + "/");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background">
      <header className="border-b border-border/60 bg-background/60 backdrop-blur">
        <div className="container flex flex-col gap-10 py-10 md:flex-row md:items-center md:justify-between md:py-16">
          <div className="max-w-xl space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-[0_0_0_1px_hsl(var(--border))]">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary via-secondary to-accent text-[0.65rem] font-semibold text-primary-foreground">
                T1
              </span>
              <span className="uppercase tracking-[0.22em] text-[0.65rem] text-muted-foreground/80">
                Event OS for ambitious teams
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Run hackathons, festivals & launches
              <br className="hidden sm:block" />
              without losing the plot.
            </h1>

            <p className="max-w-lg text-sm md:text-base text-muted-foreground">
              Thittam1Hub brings registrations, QR check-ins, workspaces, judging, and certificates into a single
              Ligne&nbsp;Claire-inspired console – so every stakeholder sees the same clean story of your event.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="hover-scale bg-primary text-primary-foreground shadow-md shadow-primary/25"
                onClick={() => {
                  window.location.href = "/events";
                }}
              >
                Browse upcoming events
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="hover-scale border-border/70 bg-background/80 text-sm text-muted-foreground"
                onClick={() => {
                  window.location.href = "/login";
                }}
              >
                Sign in to console
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground/90">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Live QR passes & certificate vaults for participants
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Organizer workspaces with tasks, comms & analytics
              </div>
            </div>
          </div>

          <div className="relative flex-1 max-w-md animate-scale-in">
            <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/5 blur-2xl" />
            <Card className="relative overflow-hidden rounded-3xl border-border/70 bg-card/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <span>Weekend Hackathon 2025</span>
                  <Badge variant="outline" className="text-[0.65rem] uppercase tracking-wide text-primary">
                    Live demo
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-muted-foreground">
                <div className="grid grid-cols-3 gap-3 text-[0.7rem]">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/80">Participants</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">320</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/80">Check-ins</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">92%</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/80">Certificates</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">+610</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/40 p-3">
                  <p className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground/80">
                    Participant view
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    "Everything is in one place – QR pass, schedule, workspace and certificates. I stopped hunting
                    through email threads."
                  </p>
                </div>

                <div className="grid gap-2 text-[0.7rem] md:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-background/60 p-2">
                    <p className="text-[0.65rem] font-semibold text-foreground">Participant dashboard</p>
                    <p className="mt-1 text-[0.7rem] text-muted-foreground">
                      Upcoming events, QR passes, certificate vault – built for mobile thumbs first.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/60 p-2">
                    <p className="text-[0.65rem] font-semibold text-foreground">Organizer console</p>
                    <p className="mt-1 text-[0.7rem] text-muted-foreground">
                      Workspaces, tasks, and analytics stitched into a single control surface.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <main className="container space-y-16 py-10 md:py-16">
        <section className="space-y-6">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">A clean story for every role</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Thittam1Hub keeps organizers, participants, judges, volunteers, and vendors aligned on a single source of
            truth – from first announcement to the last certificate verification.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/70 bg-card/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">For participants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc space-y-1 pl-4">
                  <li>Mobile-first dashboard with QR passes and live schedule.</li>
                  <li>Certificate vault with verification-ready links.</li>
                  <li>Team registration built for hackathons &amp; competitions.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">For organizers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc space-y-1 pl-4">
                  <li>Workspace-style console for every event.</li>
                  <li>Live snapshots of registrations, attendance and scores.</li>
                  <li>Certificate rules that auto-issue the right documents.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">For organizations &amp; vendors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc space-y-1 pl-4">
                  <li>Verified organization pages with event portfolios.</li>
                  <li>Marketplace for production, venues, and tooling partners.</li>
                  <li>Signals of trust baked into every certificate.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Under the hood</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            A modular event OS that covers the full lifecycle: setup, registrations, attendance, judging, certificates,
            organizations, workspaces, and the marketplace around them.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/70 bg-card/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Event &amp; workspace engine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc space-y-1 pl-4">
                  <li>Template-driven creation for hackathons, fests, and meetups.</li>
                  <li>Per-event workspace with tasks, notes, and team comms.</li>
                  <li>Hybrid-friendly flows for offline, online, and mixed formats.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Certificates &amp; verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc space-y-1 pl-4">
                  <li>Rule-based criteria for attendance, roles, and scores.</li>
                  <li>Signed PDFs with QR codes pointing to live verification.</li>
                  <li>Org-level views of issued certificates and disputes.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="rounded-3xl border border-border/70 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 px-6 py-8 md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Ready to see it in action?</h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Explore public events as a participant or sign in as an organizer to start wiring your own workspaces,
                judges, and certificate flows.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="hover-scale bg-primary text-primary-foreground shadow-md shadow-primary/25"
                onClick={() => {
                  window.location.href = "/events";
                }}
              >
                Explore events
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="hover-scale border-border/70 bg-background/80 text-sm text-muted-foreground"
                onClick={() => {
                  window.location.href = "/register";
                }}
              >
                Create organizer account
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="hover-scale text-sm text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  window.location.href = "/docs";
                }}
              >
                View technical documentation
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
