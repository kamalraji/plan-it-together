import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const AttendflowLanding = () => {
  useEffect(() => {
    const title = "Event marketing workspace | Thittam1Hub";
    document.title = title;

    const description =
      "Placeholder marketing site showcasing the Thittam1Hub event workspace with an Attendflow-style layout.";

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
    canonical.setAttribute("href", window.location.href);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground af-grid-bg">
      {/* Top nav */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-md">
              TH
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">Thittam1Hub Events</span>
              <span className="text-[11px] text-muted-foreground">Event workspaces for teams</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            {navLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollToId(link.href.replace("#", ""))}
                className="hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
            <Button className="rounded-full px-5 bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
              Get started
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container relative py-16 md:py-24 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/40 px-3 py-1 text-xs font-medium text-accent-foreground shadow-sm mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Event marketing workspace
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
                Orchestrate every
                <br />
                event from one <span className="af-hero-emphasis">workspace</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm md:text-base text-muted-foreground">
                Placeholder copy for your event marketing story. Describe how your team plans, tracks, and
                measures events in one collaborative hub.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button className="rounded-full px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:from-primary hover:to-primary/80">
                  Book a demo
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full px-6 py-2.5 text-sm font-semibold border-border/70 bg-background/80 text-foreground hover:bg-muted/70"
                >
                  Explore the product
                </Button>
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">
                No real data here yet—replace this with your own conversion copy.
              </p>
            </div>

            {/* Hero visual placeholder */}
            <div className="relative h-[260px] md:h-[320px] lg:h-[360px] rounded-3xl border border-border/60 bg-card/80 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />
              <div className="relative h-full p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-8 w-24 rounded-full bg-background/80 border border-border/60" />
                  <div className="h-8 w-16 rounded-full bg-primary/80" />
                </div>
                <div className="flex-1 rounded-2xl border border-dashed border-border/70 bg-background/70" />
                <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                  <div className="h-10 rounded-xl bg-background/80 border border-border/60" />
                  <div className="h-10 rounded-xl bg-background/80 border border-border/60" />
                  <div className="h-10 rounded-xl bg-background/80 border border-border/60" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Logos row placeholder
            </p>
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground/70 text-xs md:text-sm">
              <span>Your logo 1</span>
              <span>Your logo 2</span>
              <span>Your logo 3</span>
              <span>Your logo 4</span>
            </div>
          </div>
        </section>

        {/* Feature strips */}
        <section
          id="features"
          className="border-t border-border/60 bg-card/80 backdrop-blur-sm py-14 md:py-16"
        >
          <div className="container grid gap-8 md:grid-cols-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight mb-2">Attendance workspace</h2>
              <p className="text-sm text-muted-foreground">
                Placeholder description for how organizers track every event they attend in a single plan.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight mb-2">Sponsor & exhibitor hub</h2>
              <p className="text-sm text-muted-foreground">
                Placeholder text describing lead capture, booth performance, and handoff back to revenue teams.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight mb-2">Built on Thittam1Hub</h2>
              <p className="text-sm text-muted-foreground">
                Placeholder copy showing how this sits on top of your registration, attendance, and certificate data.
              </p>
            </div>
          </div>
        </section>

        {/* Workflow section */}
        <section
          id="workflow"
          className="border-t border-border/60 bg-background/95 py-14 md:py-16"
        >
          <div className="container grid gap-10 lg:grid-cols-2 items-start">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">A simple event workflow</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Outline how your real product works here—this placeholder just mirrors the Attendflow layout
                with steps you can customize later.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                "Plan your event portfolio",
                "Coordinate teams and assets",
                "Capture onsite activity",
                "Measure and report impact",
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3 flex items-start gap-3 shadow-sm"
                >
                  <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 text-[11px] flex items-center justify-center text-primary font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{step}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Short placeholder explanation for this step—replace with your own copy.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section
          id="pricing"
          className="border-t border-border/60 bg-card/80 backdrop-blur-sm py-14 md:py-16"
        >
          <div className="container grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">Pricing placeholder</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Use this section to mirror the Attendflow pricing layout. Replace the placeholder labels
                and bullets with your own tiers.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>• Placeholder bullet one</li>
                <li>• Placeholder bullet two</li>
                <li>• Placeholder bullet three</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-xl">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold">$—</span>
                <span className="text-xs text-muted-foreground">per month</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Replace this with your real pricing. This is only a visual shell.
              </p>
              <Button className="mt-4 w-full rounded-full">Talk to sales</Button>
            </div>
          </div>
        </section>

        {/* FAQ placeholder */}
        <section
          id="faq"
          className="border-t border-border/60 bg-background/95 py-14 md:py-16"
        >
          <div className="container max-w-3xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">Frequently asked questions</h2>
              <p className="text-sm text-muted-foreground">
                Mirror the FAQ structure from Attendflow here. Swap each Q&A with your own content.
              </p>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm"
                >
                  <p className="text-sm font-semibold">Placeholder question {item}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Placeholder answer text for this question. Replace with real copy that matches your
                    policies and product.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/60 bg-card/80 py-14 md:py-16">
          <div className="container max-w-3xl text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Replace this with your real closing CTA
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              The layout mirrors Attendflow&apos;s final call-to-action block, but all of the messaging here is
              placeholder text you can adapt to your own product.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <Button className="rounded-full px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground shadow-lg hover:bg-primary/90">
                Get started
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-6 py-2.5 text-sm font-semibold border-border/70 bg-background/80 text-foreground hover:bg-muted/70"
              >
                Book a walkthrough
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AttendflowLanding;
