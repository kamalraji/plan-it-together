import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
  const navigate = useNavigate();
  const [logoOrgs, setLogoOrgs] = useState<{ id: string; name: string; logo_url: string | null }[]>([]);
  useEffect(() => {
    const title = "Event marketing workspace | Thittam1Hub";
    document.title = title;

    const description =
      "Thittam1Hub is a unified event management and publishing platform that centralizes planning, tracking, and certificate-backed verification for every event.";

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

  useEffect(() => {
    supabase
      .from("organizations")
      .select("id, name, logo_url")
      .eq("verification_status", "VERIFIED")
      .not("logo_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (!error && data) {
          setLogoOrgs(data);
        }
      });
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
                className="relative inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors after:absolute after:left-0 after:bottom-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-200 hover:text-foreground hover:after:scale-x-100"
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
            <Button
              className="rounded-full px-5 bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
              onClick={() => navigate("/register")}
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container relative py-16 md:py-24 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/20 px-3 py-1 text-[11px] font-medium text-accent-foreground shadow-sm mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Event workspaces that ship proof · Thittam1Hub
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
                One rail from event idea
                <br />
                to verified outcomes
              </h1>
              <p className="mt-5 max-w-xl text-sm md:text-base text-muted-foreground">
                Attendflow by Thittam1Hub turns every event into a temporary workspace—unifying registrations, QR-based
                attendance, judging, and certificate-backed proof so organizers, teams, and sponsors see the same live
                reality.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  className="rounded-full px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:from-primary hover:to-primary/80"
                  onClick={() => navigate("/help?intent=demo")}
                >
                  Book a demo
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full px-6 py-2.5 text-sm font-semibold border-border/70 bg-background/80 text-foreground hover:bg-muted/70"
                  onClick={() => navigate("/register")}
                >
                  Start free
                </Button>
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">
                No credit card required · Built for campuses, communities, and organizations running recurring events.
              </p>
            </div>

            {/* Hero visual: unified event flow */}
            <motion.div
              className="relative h-[260px] md:h-[320px] lg:h-[360px] rounded-3xl border border-border/60 bg-card/80 shadow-2xl overflow-hidden af-hero-panel af-floating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/40 to-accent/20" />
              <div className="relative h-full px-4 py-4 md:px-6 md:py-6 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-background/80 border border-border/60 px-2 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live event flow
                  </span>
                  <span className="hidden sm:inline-flex rounded-full bg-background/70 border border-border/60 px-2 py-1">
                    Registration → certificate
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 items-stretch af-hero-orbit-row">
                  {[
                    { key: "registration", label: "Registration", meta: "Forms & roles" },
                    { key: "attendance", label: "Attendance", meta: "QR check-in" },
                    { key: "judging", label: "Judging", meta: "Scores & notes" },
                    { key: "certificates", label: "Certificates", meta: "QR verification" },
                  ].map((step, index) => (
                    <motion.div
                      key={step.key}
                      className="relative rounded-2xl border border-border/60 bg-background/90 px-3 py-3 flex flex-col justify-between overflow-hidden hover-scale hover-glow"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.08 * index, ease: "easeOut" }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                          {index + 1}
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Stage</span>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-semibold leading-tight">{step.label}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{step.meta}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
                  <p className="hidden sm:inline-flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    One rail from signup to verification
                  </p>
                  <p className="sm:text-right flex-1 sm:flex-none text-right">
                    No exports · no broken handoffs
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-14 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground text-center md:text-left">
              Used across events that need real verification
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-muted-foreground/70 text-xs md:text-sm">
              <span>University fests</span>
              <span>Community hackathons</span>
              <span>Corporate programs</span>
              <span>Industry meetups</span>
            </div>
            {logoOrgs.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground text-center md:text-left">
                  Teams running events on Attendflow
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-[11px] text-muted-foreground/80">
                  {logoOrgs.map((org) => (
                    <div key={org.id} className="flex items-center gap-2 max-w-[160px]">
                      {org.logo_url && (
                        <img
                          src={org.logo_url}
                          alt={`${org.name} logo`}
                          loading="lazy"
                          className="h-6 w-auto rounded-sm border border-border/60 bg-background object-contain"
                        />
                      )}
                      <span className="truncate">{org.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4 text-[11px] text-muted-foreground/85">
              <div className="inline-flex flex-col md:flex-row md:items-center gap-1 md:gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                <span className="font-medium">"Check-in to certificates in one trackable rail."</span>
                <span className="opacity-80">— Asha R., Fest Convenor</span>
              </div>
              <div className="inline-flex flex-col md:flex-row md:items-center gap-1 md:gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent/80" />
                <span className="font-medium">"We stopped juggling forms, sheets, and PDFs for every program."</span>
                <span className="opacity-80">— Karthik S., Community Lead</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature strips */}
        <motion.section
          id="features"
          className="border-t border-border/60 bg-card/80 backdrop-blur-sm py-14 md:py-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="container grid gap-8 md:grid-cols-3">
            <div className="hover-scale hover-glow rounded-2xl border border-border/60 bg-card/80 p-4">
              <h2 className="text-xl font-semibold tracking-tight mb-2">One workspace, every moving part</h2>
              <p className="text-sm text-muted-foreground">
                Replace scattered forms, sheets, and PDFs with a single trackable rail for registrations, attendance,
                judging, certificates, and communication.
              </p>
            </div>
            <div className="hover-scale hover-glow rounded-2xl border border-border/60 bg-card/80 p-4">
              <h2 className="text-xl font-semibold tracking-tight mb-2">Verification your sponsors can trust</h2>
              <p className="text-sm text-muted-foreground">
                Ship QR-backed certificates that anyone can verify publicly—so outcomes are provable, not buried in
                drives.
              </p>
            </div>
            <div className="hover-scale hover-glow rounded-2xl border border-border/60 bg-card/80 p-4">
              <h2 className="text-xl font-semibold tracking-tight mb-2">Built for teams, not hobby projects</h2>
              <p className="text-sm text-muted-foreground">
                Support colleges, companies, and communities with official pages, visibility controls, and analytics
                that make reporting to leadership simple.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Workflow section */}
        <motion.section
          id="workflow"
          className="border-t border-border/60 bg-background/95 py-16 md:py-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="container grid gap-10 lg:grid-cols-2 items-start">
            <div className="space-y-3 max-w-md">
              <h2 className="text-2xl font-semibold tracking-tight">From first brief to last certificate in one workspace</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                See your whole event lifecycle in one line—from announcement to registration, on-ground execution, and
                post-event reporting.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                "Draft and publish your event story in minutes",
                "Capture registrations with the roles and data you actually track",
                "Run QR check-in and judging without extra tools",
                "Issue certificates and share clean summaries with sponsors and leadership",
              ].map((step, index) => (
                <motion.div
                  key={step}
                  className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3 flex items-start gap-3 shadow-sm hover-scale hover-glow"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
                >
                  <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 text-[11px] flex items-center justify-center text-primary font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{step}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Derived from the core flow in your design and requirements docs: one system from registration to
                      verification.
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Organizer-focused workspace explainer */}
        <motion.section
          id="workspaces"
          className="border-t border-border/60 bg-background/95 py-16 md:py-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="container grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
            <div className="space-y-3 max-w-md">
              <h2 className="text-2xl font-semibold tracking-tight">Event Community Workspaces, in organizer terms</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Every event in Thittam1Hub gets its own Event Community Workspace — a temporary, scoped space where
                roles, tasks, and access are tied to that event only, then safely wound down when you are done.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3 hover-scale hover-glow">
                <p className="font-semibold">Roles that match how you actually run events</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Assign workspace roles like Team Lead, Volunteer Manager, Technical, or Marketing. Each role maps to a
                  clear access scope — who can see registrations, attendance, certificates, and workspace settings.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3 hover-scale hover-glow">
                <p className="font-semibold">Tasks that stay inside the event</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create tasks for setup, outreach, logistics, judging, or post-event follow-up. Tasks live in the
                  workspace, tied to the event timeline, not lost across generic boards.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3 hover-scale hover-glow">
                <p className="font-semibold">Access control that ends when the event does</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Team members see only the data they need — and their access automatically winds down as the event
                  closes, so you are not manually cleaning up permissions months later.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Pricing teaser */}
        <motion.section
          id="pricing"
          className="border-t border-border/60 bg-card/80 backdrop-blur-sm py-16 md:py-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="container grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
            <div className="space-y-3 max-w-md">
              <h2 className="text-2xl font-semibold tracking-tight">Pricing that follows your program, not a single event</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Start with one flagship fest and grow into a portfolio of events and workspaces—without rebuilding your
                stack every season.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>• Align plans to event volume, not surprise overages.</li>
                <li>• Keep registrations, attendance, judging, and certificates in the same Supabase-backed system.</li>
                <li>• Add workspace analytics and official pages when leadership is ready to scale collaboration.</li>
              </ul>
            </div>
            <motion.div
              className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-xl hover-scale hover-glow"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold">Talk to us</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Pricing is tailored to your organization size and event volume. Share how you run events today and we
                will recommend a plan based on the real Thittam1Hub architecture.
              </p>
              <Button
                className="mt-4 w-full rounded-full"
                onClick={() => navigate("/pricing")}
              >
                View pricing
              </Button>
            </motion.div>
          </div>
        </motion.section>

        {/* Final CTA (simplified from original for brevity) */}
        <section className="border-t border-border/60 bg-card/80 py-14 md:py-16">
          <div className="container max-w-3xl text-center space-y-4 hover-glow rounded-3xl border border-border/60 bg-card/90 px-6 py-10">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Turn "one-off" events into a repeatable workspace your team trusts
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Run your next fest, hackathon, or roadshow on Attendflow, then roll the same verified flow across every
              program so new organizers inherit a proven rail instead of starting from scratch.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <Button
                className="rounded-full px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                onClick={() => navigate("/register")}
              >
                Get started free
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-6 py-2.5 text-sm font-semibold border-border/70 bg-background/80 text-foreground hover:bg-muted/70"
                onClick={() => navigate("/help?intent=walkthrough")}
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
