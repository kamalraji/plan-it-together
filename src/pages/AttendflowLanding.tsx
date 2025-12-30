import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#integrations", label: "Integrations" },
];

const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const AttendflowLanding = () => {
  useEffect(() => {
    const title = "Event marketing made simple | Thittam1Hub";
    document.title = title;

    const description =
      "Modern event marketing hub for teams who attend, sponsor, and exhibit—built on Thittam1Hub.";

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
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-md">
              AF
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">Attendflow</span>
              <span className="text-[11px] text-muted-foreground">Powered by Thittam1Hub</span>
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
              Start free
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container relative py-16 md:py-24 lg:py-28">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/40 px-3 py-1 text-xs font-medium text-accent-foreground shadow-sm mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Event marketing workspace
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
              Event marketing
              <br />
              made <span className="af-hero-emphasis">simple</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm md:text-base text-muted-foreground">
              Stop juggling spreadsheets, drives, and forms. Built for teams who attend, sponsor, and
              exhibit—on top of Thittam1Hub&apos;s event infrastructure.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button className="rounded-full px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:from-primary hover:to-primary/80">
                Book a demo
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-6 py-2.5 text-sm font-semibold border-border/70 bg-background/80 text-foreground hover:bg-muted/70"
              >
                Start free
              </Button>
            </div>
          </div>

          <div className="mt-14 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Trusted by teams who outgrow spreadsheets
            </p>
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground/70 text-xs md:text-sm">
              <span>Groupii</span>
              <span>Keystone Business Credit</span>
              <span>Coast to Coast Radio Networks</span>
              <span>WillaCare</span>
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
              <h2 className="text-xl font-semibold tracking-tight mb-2">For teams who attend</h2>
              <p className="text-sm text-muted-foreground">
                Centralize every event your team touches—tasks, assets, and results in one live workspace.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight mb-2">For sponsors & exhibitors</h2>
              <p className="text-sm text-muted-foreground">
                Capture leads, track booth performance, and hand clean results back to revenue teams.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight mb-2">Built on Thittam1Hub</h2>
              <p className="text-sm text-muted-foreground">
                Use the same infrastructure that powers registration, attendance, and certificates across
                your events.
              </p>
            </div>
          </div>
        </section>

        <section
          id="integrations"
          className="border-t border-border/60 bg-background/95 py-14 md:py-16"
        >
          <div className="container flex flex-col md:flex-row gap-10 items-start md:items-center">
            <div className="flex-1 space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">Plug into your existing stack</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Sync attendees and results with your CRM, email tools, and data warehouse. Attendflow sits
                on top of your current systems instead of replacing them.
              </p>
              <Link
                to="/integrations"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/90"
              >
                Explore integrations
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AttendflowLanding;
