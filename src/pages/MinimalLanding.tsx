import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, FileBadge2, LayoutDashboard, LineChart, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "@/components/AnimateOnScroll";
 
const sections = {
  why: "why",
  how: "how",
  features: "features",
  pricing: "pricing",
  faq: "faq",
} as const;

type SectionKey = keyof typeof sections;

const MinimalLanding = () => {
  useEffect(() => {
    document.title = "Thittam1Hub – Minimal University Hub";

    const descriptionContent =
      "Thittam1Hub gives universities a clean, reliable hub for events, attendance, and certificates in one place.";

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = descriptionContent;

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
  }, []);

  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id as (typeof sections)[SectionKey];
            const matchedKey = (Object.keys(sections) as SectionKey[]).find(
              (key) => sections[key] === id,
            );
            if (matchedKey) {
              setActiveSection(matchedKey);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "-64px 0px -60% 0px",
        threshold: 0.3,
      },
    );

    const sectionElements = (Object.values(sections) as string[])
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    sectionElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">Thittam1Hub</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">University Program Hub</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <button
              onClick={() => scrollTo(sections.why)}
              className={cn(
                "transition-colors hover:text-foreground",
                activeSection === "why" && "text-foreground font-medium",
              )}
            >
              Why Thittam1Hub
            </button>
            <button
              onClick={() => scrollTo(sections.how)}
              className={cn(
                "transition-colors hover:text-foreground",
                activeSection === "how" && "text-foreground font-medium",
              )}
            >
              How it works
            </button>
            <button
              onClick={() => scrollTo(sections.pricing)}
              className={cn(
                "transition-colors hover:text-foreground",
                activeSection === "pricing" && "text-foreground font-medium",
              )}
            >
              Pricing
            </button>
            <button
              onClick={() => scrollTo(sections.faq)}
              className={cn(
                "transition-colors hover:text-foreground",
                activeSection === "faq" && "text-foreground font-medium",
              )}
            >
              FAQ
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
            <Button size="sm" className="px-4" onClick={() => scrollTo(sections.how)}>
              Book campus demo
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section aria-labelledby="hero-title" className="border-b border-border/60 bg-background">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2 lg:px-6 lg:py-20">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Built for universities, tech communities, and modern teams
              </p>
              <h1
                id="hero-title"
                className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
              >
                One hub for every event, attendance, and certificate.
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
                Thittam1Hub quietly powers registrations, attendance, and certificates so universities, tech clubs,
                corporate L&amp;D teams, and small businesses can focus on outcomes, not logistics.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => scrollTo(sections.how)}>
                  Book campus demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollTo(sections.features)}>
                  View sample workspace
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Multi-department and multi-team ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Audit-friendly, exportable reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>QR certificate verification for learners</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                {["Universities & colleges", "Student clubs", "Tech communities", "Corporate L&D", "Small businesses"].map(
                  (label) => (
                    <span key={label} className="rounded-full border border-border/60 bg-background px-3 py-1">
                      {label}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <Card className="w-full max-w-md border-border/60 bg-muted/40">
                <CardHeader className="space-y-1 pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    <span>Campus overview</span>
                    <span className="text-xs font-normal text-muted-foreground">This semester</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px]">Events this semester</p>
                      <p className="text-lg font-semibold text-foreground">42</p>
                    </div>
                    <div>
                      <p className="text-[11px]">Certificates issued</p>
                      <p className="text-lg font-semibold text-foreground">4,382</p>
                    </div>
                    <div>
                      <p className="text-[11px]">Average attendance</p>
                      <p className="text-lg font-semibold text-foreground">86%</p>
                    </div>
                  </div>
                  <div className="rounded-md border border-border/60 p-3">
                    <p className="mb-2 flex items-center gap-2 text-[11px]">
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Events by department
                    </p>
                    <div className="flex items-end justify-between gap-1">
                      {["CSE", "ECE", "MECH", "CIVIL", "MBA"].map((dept, i) => (
                        <div key={dept} className="flex flex-1 flex-col items-center gap-1">
                          <span
                            className="w-6 rounded-md bg-primary/30"
                            style={{ height: `${40 + i * 10}%` }}
                          />
                          <span className="text-[10px] text-muted-foreground">{dept}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id={sections.why} aria-labelledby="why-heading" className="border-b border-border/60 bg-background">
          <AnimateOnScroll className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
            <div className="mb-8 max-w-2xl space-y-2">
              <h2 id="why-heading" className="text-xl font-semibold tracking-tight">
                Why universities and tech-savvy teams choose Thittam1Hub
              </h2>
              <p className="text-sm text-muted-foreground">
                A single, reliable system for departments, exam cells, tech communities, corporate academies, and small
                teams to run events and prove outcomes.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "For universities",
                  body: "All departments and events in one structured view for leadership, IQAC, and exam cells.",
                },
                {
                  title: "For tech communities",
                  body: "Branded certificates with QR-based verification for meetups, hackathons, and bootcamps.",
                },
                {
                  title: "For corporate L&D & small businesses",
                  body: "Attendance and certificate logs ready when managers, HR, or auditors ask.",
                },
              ].map((item) => (
                <Card key={item.title} className="border-border/60 bg-background">
                  <CardContent className="space-y-2 p-5">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AnimateOnScroll>
        </section>

        {/* How it works */}
        <section
          id={sections.how}
          aria-labelledby="how-heading"
          className="border-b border-border/60 bg-muted/50"
        >
          <AnimateOnScroll className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 id="how-heading" className="text-xl font-semibold tracking-tight">
                  How it works for campuses, communities, and teams
                </h2>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  Thittam1Hub is simple enough for departments, student clubs, and L&amp;D teams to start in days and
                  structured enough for campus-wide or company-wide rollout.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => scrollTo(sections.pricing)}>
                Talk to our team
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Create an event or program",
                  body: "Set up events with dates, registration forms, and roles for departments, clubs, or teams.",
                },
                {
                  step: "02",
                  title: "Run and monitor in one place",
                  body: "Track registrations, check-ins, and attendance as events progress across campuses or offices.",
                },
                {
                  step: "03",
                  title: "Issue & verify certificates",
                  body: "Bulk-generate certificates and let learners, students, or employees verify them online anytime.",
                },
              ].map((item) => (
                <Card key={item.step} className="border-border/60 bg-background">
                  <CardContent className="space-y-3 p-5">
                    <p className="text-xs font-medium text-muted-foreground">Step {item.step}</p>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AnimateOnScroll>
        </section>

        {/* Features */}
        <section
          id={sections.features}
          aria-labelledby="features-heading"
          className="border-b border-border/60 bg-background"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
            <div className="mb-8 max-w-2xl space-y-2">
              <h2 id="features-heading" className="text-xl font-semibold tracking-tight">
                The essentials, done properly
              </h2>
              <p className="text-sm text-muted-foreground">
                Four core capabilities your campus, community, or company can rely on every cycle.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  icon: FileBadge2,
                  title: "Certificate Studio",
                  body: "Create branded templates with dynamic data for universities, meetups, trainings, and more.",
                },
                {
                  icon: Users,
                  title: "Attendance Engine",
                  body: "Capture and export attendance by event, session, department, or team.",
                },
                {
                  icon: LayoutDashboard,
                  title: "Multi-workspace overview",
                  body: "Give departments, clubs, and L&D teams their own space while leadership sees the whole picture.",
                },
                {
                  icon: ShieldCheck,
                  title: "Access & security",
                  body: "Roles for admin, coordinators, and managers with activity logs for accountability.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <Card key={title} className="border-border/60 bg-background">
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">{body}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Analytics & reports */}
        <section aria-labelledby="analytics-heading" className="border-b border-border/60 bg-muted/50">
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
            <div className="mb-8 max-w-2xl space-y-2">
              <h2 id="analytics-heading" className="text-xl font-semibold tracking-tight">
                Clear reports for councils, managers, and stakeholders
              </h2>
              <p className="text-sm text-muted-foreground">
                Evidence of participation, attendance, and certificates is always ready for accreditation bodies,
                leadership reviews, or client audits.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <Card className="border-border/60 bg-background">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <LineChart className="h-4 w-4" />
                    Participation over the year
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">Sample dashboard</span>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                  <div className="h-32 rounded-md bg-muted" />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Events per month</span>
                    <span>Certificates issued</span>
                    <span>Attendance rate</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4 text-xs text-muted-foreground">
                <p className="text-sm font-medium text-foreground">Designed for real reporting contexts</p>
                <ul className="space-y-2 list-disc pl-4">
                  <li>Downloadable participation reports per event, department, or team.</li>
                  <li>Attendance summaries aligned with NAAC/NBA, HR, or internal requirements.</li>
                  <li>Certificate logs that show when and to whom certificates were issued across audiences.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          id={sections.pricing}
          aria-labelledby="pricing-heading"
          className="border-b border-border/60 bg-background"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
            <div className="mb-8 max-w-2xl space-y-2">
              <h2 id="pricing-heading" className="text-xl font-semibold tracking-tight">
                Start small or roll out campus-wide
              </h2>
              <p className="text-sm text-muted-foreground">
                Flexible ways to begin — from a single department to a multi-campus rollout.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  label: "Departmental pilot",
                  body: "Ideal for one or two departments to experience Thittam1Hub.",
                  cta: "Talk to us",
                },
                {
                  label: "Campus plan",
                  body: "For institutions standardizing events and certificates on one system.",
                  cta: "Book demo",
                },
                {
                  label: "Multi-campus",
                  body: "For university groups or multi-campus setups.",
                  cta: "Contact sales",
                },
              ].map((plan) => (
                <Card key={plan.label} className="border-border/60 bg-background">
                  <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{plan.label}</p>
                      <p className="text-xs text-muted-foreground">{plan.body}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id={sections.faq} aria-labelledby="faq-heading" className="border-b border-border/60 bg-muted/50">
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
            <div className="mb-6 max-w-2xl space-y-2">
              <h2 id="faq-heading" className="text-xl font-semibold tracking-tight">
                Frequently asked questions
              </h2>
              <p className="text-sm text-muted-foreground">
                Answers to common questions from universities and colleges.
              </p>
            </div>

            <Accordion type="single" collapsible className="max-w-2xl">
              <AccordionItem value="multi-department">
                <AccordionTrigger className="text-left text-sm">
                  Can we run multiple departments under one account?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground">
                  Yes. Departments can have their own workspaces while central administrators get a consolidated
                  university-wide view and control over access.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="branding">
                <AccordionTrigger className="text-left text-sm">
                  Can we customize certificates with our own branding and signatures?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground">
                  Thittam1Hub supports institute logos, colors, signatories, and dynamic fields so certificates are fully
                  aligned with your brand and process.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="verification">
                <AccordionTrigger className="text-left text-sm">
                  How do participants and recruiters verify certificates?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground">
                  Each certificate includes a secure verification link or QR code. Scanning or visiting the link shows
                  certificate details hosted by Thittam1Hub.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="security">
                <AccordionTrigger className="text-left text-sm">Is our data secure?</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground">
                  Data is stored securely with role-based access, and you control who can create events, issue
                  certificates, and access reports.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="timeline">
                <AccordionTrigger className="text-left text-sm">
                  How long does it take to go live on campus?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground">
                  Many institutions start with a pilot in a few weeks, then expand to additional departments once
                  processes are in place.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section aria-labelledby="final-cta-heading" className="bg-background">
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
            <div className="max-w-xl space-y-4 text-center mx-auto">
              <h2 id="final-cta-heading" className="text-xl font-semibold tracking-tight">
                Ready to unify events and certificates across your university?
              </h2>
              <p className="text-sm text-muted-foreground">
                See how Thittam1Hub fits into your existing processes in a short, focused campus demo.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" onClick={() => scrollTo(sections.how)}>
                  Book campus demo
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollTo(sections.features)}>
                  View sample workspace
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground md:flex-row lg:px-6">
          <p>&copy; {new Date().getFullYear()} Thittam1Hub. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#" className="hover:text-foreground">
              About
            </a>
            <a href="#" className="hover:text-foreground">
              Docs
            </a>
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
            <a href="#" className="hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MinimalLanding;
