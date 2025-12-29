import { useEffect, useState } from "react";
import { ArrowRight, CalendarRange, LayoutDashboard, BadgeCheck, ShieldCheck, BarChart3, Users, University } from "lucide-react";
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
  product: "product",
  solutions: "solutions",
  pricing: "pricing",
  resources: "resources",
} as const;

type SectionKey = keyof typeof sections;

const Index = () => {
  useEffect(() => {
    document.title = "Thittam1Hub – Event & Certificate Hub for Universities and Teams";

    const descriptionContent =
      "Thittam1Hub is a futuristic hub for events, attendance, and smart certificates for universities, tech communities, corporate L&D teams, and small businesses.";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 via-primary to-primary/50 shadow-[0_0_25px_rgba(59,130,246,0.6)]">
              <University className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <span className="block text-xs uppercase tracking-[0.22em] text-primary/80">Thittam1Hub</span>
              <span className="block text-sm text-muted-foreground">University Program Hub</span>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <button
              onClick={() => scrollTo(sections.product)}
              className={cn(
                "story-link transition-colors hover:text-foreground",
                activeSection === "product" && "text-foreground",
              )}
            >
              Product
            </button>
            <button
              onClick={() => scrollTo(sections.solutions)}
              className={cn(
                "story-link transition-colors hover:text-foreground",
                activeSection === "solutions" && "text-foreground",
              )}
            >
              Solutions
            </button>
            <button
              onClick={() => scrollTo(sections.pricing)}
              className={cn(
                "story-link transition-colors hover:text-foreground",
                activeSection === "pricing" && "text-foreground",
              )}
            >
              Pricing
            </button>
            <button
              onClick={() => scrollTo(sections.resources)}
              className={cn(
                "story-link transition-colors hover:text-foreground",
                activeSection === "resources" && "text-foreground",
              )}
            >
              Resources
            </button>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" size="sm">
              Login
            </Button>
            <Button size="sm" className="shadow-[0_0_30px_rgba(59,130,246,0.6)]">
              Book Campus Demo
            </Button>
          </div>

          <div className="flex md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollTo(sections.pricing)}
              className="border-border/60 bg-background/60 backdrop-blur-xl"
            >
              View Plans
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden border-b border-border/40 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.26),_transparent_55%),radial-gradient(circle_at_bottom,_hsl(var(--accent)/0.16),_transparent_55%)]"
        >
          <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen" aria-hidden="true" />
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:px-6 lg:py-20">
            <div className="relative z-10 space-y-7 animate-fade-in">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/50 px-3 py-1 text-xs text-primary shadow-[0_0_25px_hsl(var(--primary)/0.3)] backdrop-blur-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Built for universities, tech organizers, and modern teams
              </p>
              <h1
                id="hero-title"
                className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
              >
                One hub for every event, attendance, and certificate.
              </h1>
              <p className="max-w-xl text-balance text-sm text-muted-foreground sm:text-base">
                Thittam1Hub is a futuristic command center for universities, tech communities, corporate L&amp;D, and
                small businesses&mdash;uniting registrations, check-ins, and smart certificates in a single, secure
                workspace.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="hover-scale bg-primary text-primary-foreground shadow-[0_0_40px_hsl(var(--primary)/0.7)] ring-1 ring-primary/70 ring-offset-2 ring-offset-background"
                  onClick={() => scrollTo(sections.resources)}
                >
                  Book Campus Demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="hover-scale border-primary/40 bg-background/60 text-primary backdrop-blur-xl"
                  onClick={() => scrollTo(sections.product)}
                >
                  Explore Demo Workspace
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-primary/20" />
                  <span>Multi-department ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/25" />
                  <span>Audit-friendly reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-violet-500/25" />
                  <span>Smart certificate verification</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                {["Universities & colleges", "Student clubs", "Tech communities", "Corporate L&D", "Small businesses"].map(
                  (label) => (
                    <span
                      key={label}
                      className="rounded-full border border-border/60 bg-background/70 px-3 py-1 backdrop-blur-xl"
                    >
                      {label}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-center">
              <div className="relative max-w-md">
                <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/20 via-primary/0 to-foreground/10 blur-2xl" />
                <div className="relative space-y-4 rounded-[1.75rem] border border-border/60 bg-background/60 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.8)] backdrop-blur-2xl">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-gradient-to-r from-background/70 via-background/90 to-background/80 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Live campus overview</p>
                      <p className="text-sm font-semibold">Semester Events Dashboard</p>
                    </div>
                    <div className="rounded-xl bg-primary/20 px-3 py-1 text-[11px] font-medium text-primary">
                      +42% engagement
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1.1fr_minmax(0,1fr)]">
                    <Card className="border-border/60 bg-background/70 backdrop-blur-xl">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <CalendarRange className="h-4 w-4 text-primary" />
                          Upcoming Events
                        </CardTitle>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">12 active</span>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {[
                          "National Tech Symposium",
                          "Faculty Development Program",
                          "AI & Data Science Workshop",
                        ].map((label) => (
                          <div
                            key={label}
                            className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-2 py-1.5 text-[11px]"
                          >
                            <span className="truncate">{label}</span>
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">
                              Registrations live
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      <Card className="border-border/60 bg-background/70 backdrop-blur-xl">
                        <CardContent className="space-y-1.5 p-3">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                              Certificates this semester
                            </span>
                            <span className="text-[11px] text-emerald-400">Verified via QR</span>
                          </div>
                          <p className="text-xl font-semibold">4,382</p>
                          <div className="mt-1 flex gap-1">
                            <span className="h-1.5 flex-1 rounded-full bg-primary/30" />
                            <span className="h-1.5 flex-[0.7] rounded-full bg-primary" />
                            <span className="h-1.5 flex-[0.4] rounded-full bg-primary/60" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border/60 bg-background/70 backdrop-blur-xl">
                        <CardContent className="flex items-center justify-between gap-3 p-3">
                          <div className="space-y-1">
                            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <BarChart3 className="h-3.5 w-3.5 text-primary" />
                              Average attendance per event
                            </p>
                            <p className="text-lg font-semibold">86%</p>
                          </div>
                          <div className="flex h-12 w-20 items-end justify-between rounded-lg bg-background/80 p-1">
                            {[40, 70, 50, 90].map((h, i) => (
                              <span
                                key={i}
                                style={{ height: `${h}%` }}
                                className="w-2 rounded-full bg-gradient-to-t from-primary/40 via-primary/80 to-primary"
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Built for Universities Strip */}
        <section
          id={sections.product}
          aria-labelledby="product-heading"
          className="border-b border-border/40 bg-background/80"
        >
          <AnimateOnScroll className="mx-auto max-w-6xl px-4 py-10 lg:px-6 lg:py-14">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 id="product-heading" className="text-lg font-semibold tracking-tight md:text-xl">
                  Built for real-world event complexity.
                </h2>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  Thittam1Hub understands multi-department campuses, tech communities, corporate academies, and
                  recurring training programs across organizations.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Scattered tools → One hub",
                  description:
                    "Unify events, registrations, attendance, and certificates under a single, searchable system.",
                },
                {
                  title: "Manual work → Automation",
                  description:
                    "Automate bulk certificate issuing, reminders, and status tracking for every program.",
                },
                {
                  title: "No visibility → Live analytics",
                  description:
                    "See event performance, engagement, and certificate issuance in real time across departments.",
                },
                {
                  title: "Unclear roles → Structured access",
                  description:
                    "Give central admin, HoDs, and faculty precise control and visibility for their responsibilities.",
                },
              ].map((item) => (
                <Card
                  key={item.title}
                  className="hover-scale border-border/60 bg-background/70 shadow-[0_15px_45px_rgba(15,23,42,0.7)] backdrop-blur-xl"
                >
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AnimateOnScroll>
        </section>

        {/* Key Pillars */}
        <section
          id={sections.solutions}
          aria-labelledby="pillars-heading"
          className="border-b border-border/40 bg-gradient-to-b from-background/90 via-background to-background/90"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
              <h2 id="pillars-heading" className="text-lg font-semibold tracking-tight md:text-xl">
                Everything your campus, community, or company needs in four pillars.
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                From planning to proof of participation, Thittam1Hub keeps every step auditable for universities,
                tech communities, corporate L&amp;D, and small businesses.
              </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-primary/40 bg-background/70 text-primary backdrop-blur-xl"
                onClick={() => scrollTo(sections.resources)}
              >
                Talk to our team
              </Button>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: LayoutDashboard,
                  label: "Unified workspaces",
                  body: "Run conferences, fests, trainings, and client programs from one pane of glass.",
                },
                {
                  icon: BadgeCheck,
                  label: "Smart certificates & QR verify",
                  body: "Design once, issue at scale, and let students, learners, or clients verify with a scan.",
                },
                {
                  icon: Users,
                  label: "Attendance & participation insights",
                  body: "Track registrations, check-ins, and session-level participation across campuses or offices.",
                },
                {
                  icon: ShieldCheck,
                  label: "Granular access control",
                  body: "Give central admin, organizers, managers, and reviewers precise permissions.",
                },
              ].map(({ icon: Icon, label, body }) => (
                <Card
                  key={label}
                  className="group hover-scale border-border/60 bg-background/70 shadow-[0_15px_45px_rgba(15,23,42,0.7)] backdrop-blur-xl"
                >
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{label}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">{body}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-heading" className="border-b border-border/40 bg-background/80">
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
            <div className="mb-8 max-w-2xl">
              <h2 id="how-heading" className="text-lg font-semibold tracking-tight md:text-xl">
                How Thittam1Hub fits into your program calendar.
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                From planning to verified certificates, your entire journey is mapped and measurable for every cohort.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              <ol className="space-y-5 text-sm">
                {[
                  {
                    step: "01",
                    title: "Create events and programs",
                    text: "Configure events, cohorts, and trainings with roles and forms for departments, clubs, or teams.",
                  },
                  {
                    step: "02",
                    title: "Run and monitor live",
                    text: "Track registrations, check-ins, and engagement in real time across campuses or offices.",
                  },
                  {
                    step: "03",
                    title: "Issue and verify certificates",
                    text: "Bulk-generate QR-enabled certificates that students, participants, or employees can verify in seconds.",
                  },
                ].map((item) => (
                  <li key={item.step} className="flex gap-4">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-xs font-semibold text-primary">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <Card className="border-border/60 bg-background/80 shadow-[0_20px_60px_rgba(15,23,42,0.8)] backdrop-blur-xl">
                <CardHeader className="space-y-1 pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Semester performance snapshot
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    A live dashboard summarizing participation, certificates issued, and department activity.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-xs md:grid-cols-3">
                    <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                      <p className="text-muted-foreground">Events this semester</p>
                      <p className="mt-1 text-lg font-semibold">48</p>
                      <p className="mt-1 text-[11px] text-emerald-400">+18% vs last year</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                      <p className="text-muted-foreground">Unique participants</p>
                      <p className="mt-1 text-lg font-semibold">3,920</p>
                      <p className="mt-1 text-[11px] text-emerald-400">Higher cross-department engagement</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                      <p className="text-muted-foreground">Certificates issued</p>
                      <p className="mt-1 text-lg font-semibold">4,382</p>
                      <p className="mt-1 text-[11px] text-emerald-400">NAAC-ready evidence exports</p>
                    </div>
                  </div>

                  <div className="h-32 rounded-xl border border-border/60 bg-gradient-to-tr from-primary/10 via-background to-accent/10 p-3">
                    <p className="text-xs text-muted-foreground">Department activity over time</p>
                    <div className="mt-3 flex h-20 items-end justify-between gap-1">
                      {[
                        { h: 35, label: "CSE" },
                        { h: 55, label: "ECE" },
                        { h: 45, label: "MECH" },
                        { h: 75, label: "EEE" },
                        { h: 65, label: "CIVIL" },
                      ].map((bar) => (
                        <div key={bar.label} className="flex flex-1 flex-col items-center gap-1">
                          <span
                            style={{ height: `${bar.h}%` }}
                            className="w-full rounded-full bg-gradient-to-t from-primary/30 via-primary/80 to-primary"
                          />
                          <span className="text-[10px] text-muted-foreground">{bar.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-primary/40 bg-background/70 text-primary backdrop-blur-xl"
                    onClick={() => scrollTo(sections.resources)}
                  >
                    View a live example dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Use cases & social proof */}
        <section aria-labelledby="usecases-heading" className="border-b border-border/40 bg-background/90">
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 id="usecases-heading" className="text-lg font-semibold tracking-tight md:text-xl">
                  From hackathons to L&amp;D, one consistent experience.
                </h2>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  Thittam1Hub adapts to cultural events, technical symposiums, corporate trainings, community meetups,
                  and internal workshops.
                </p>
              </div>
            </div>

             <div className="flex flex-wrap gap-2 text-xs">
              {["University fests & FDPs", "Tech meetups & hackathons", "Corporate trainings & L&D", "Small business events"].map(
                (label) => (
                  <span
                    key={label}
                    className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-muted-foreground backdrop-blur-xl"
                  >
                    {label}
                  </span>
                ),
              )}
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Card className="border-border/60 bg-background/80 backdrop-blur-xl">
                <CardContent className="space-y-4 p-5">
                  <p className="text-sm">
                    With Thittam1Hub we finally have a single source of truth for every department event.
                    Certificates, attendance, and reports are ready instantly whenever our accreditation teams ask.
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="h-9 w-9 rounded-full bg-primary/20" />
                    <div>
                      <p className="font-medium">Dean of Academics</p>
                      <p className="text-muted-foreground">Tier-1 Engineering College (Name on request)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-background/80 backdrop-blur-xl">
                <CardContent className="space-y-3 p-5 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">University-specific highlights</p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Per-department workspaces with central admin overview.</li>
                    <li>Certificate and attendance evidence exports for NAAC, NBA, and internal audits.</li>
                    <li>Support for student email domains and role-based onboarding.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section
          id={sections.pricing}
          aria-labelledby="pricing-heading"
          className="border-b border-border/40 bg-gradient-to-b from-background/95 via-background to-background/90"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
            <div className="mb-8 max-w-2xl">
              <h2 id="pricing-heading" className="text-lg font-semibold tracking-tight md:text-xl">
                Simple ways to start with Thittam1Hub.
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Begin with a focused pilot or roll out campus-wide. We help you design an adoption plan that fits your
                academic calendar.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="flex flex-col border-border/60 bg-background/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-sm">Departmental Pilot</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Start with a few departments or centres of excellence.
                  </p>
                </CardHeader>
                <CardContent className="mt-auto space-y-3 text-xs text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Ideal for 38 departments</li>
                    <li>Guided onboarding and migration support</li>
                    <li>Shared insights with central academic office</li>
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-primary/40 bg-background/70 text-primary"
                    onClick={() => scrollTo(sections.resources)}
                  >
                    Discuss pilot
                  </Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col border-primary/50 bg-gradient-to-b from-primary/15 via-background/95 to-background/90 shadow-[0_20px_70px_rgba(59,130,246,0.7)] backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-sm">Campus Plan</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    One hub for all departments, events, and certificates across the institution.
                  </p>
                </CardHeader>
                <CardContent className="mt-auto space-y-3 text-xs text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Unlimited events and certificates</li>
                    <li>Per-department workspaces with central control</li>
                    <li>Priority support during peak academic seasons</li>
                  </ul>
                  <Button size="sm" className="w-full shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                    Book campus demo
                  </Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col border-border/60 bg-background/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-sm">Multi-campus / Group</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    For universities and education groups with multiple campuses.
                  </p>
                </CardHeader>
                <CardContent className="mt-auto space-y-3 text-xs text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Org hierarchy and multi-campus reporting</li>
                    <li>Custom governance and compliance workflows</li>
                    <li>Dedicated success and support team</li>
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-primary/40 bg-background/70 text-primary"
                  >
                    Talk to sales
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ & resources */}
        <section
          id={sections.resources}
          aria-labelledby="faq-heading"
          className="border-b border-border/40 bg-background/95"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 id="faq-heading" className="text-lg font-semibold tracking-tight md:text-xl">
                  Answers to questions your academic council will ask.
                </h2>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  A brief overview you can share with Deans, IQAC, and IT teams when introducing Thittam1Hub.
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 text-xs text-muted-foreground md:items-end">
                <p className="font-medium text-foreground">Prefer a live walkthrough?</p>
                <Button
                  size="sm"
                  className="shadow-[0_0_30px_rgba(59,130,246,0.6)]"
                >
                  Book Campus Demo
                </Button>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <Accordion type="single" collapsible className="space-y-2">
                {[
                  {
                    q: "Can we onboard multiple departments with separate access?",
                    a: "Yes. Each department can have its own workspace, coordinators, and events while central admin gets a unified view and reporting.",
                  },
                  {
                    q: "Can we customize certificate templates with our university branding?",
                    a: "Thittam1Hub supports fully branded certificate templates with logos, signatures, QR codes, and dynamic fields like event name and participant details.",
                  },
                  {
                    q: "How does Thittam1Hub handle data security?",
                    a: "Your data is stored on a secure, audited cloud infrastructure with role-based access, detailed logs, and export controls for sensitive reports.",
                  },
                  {
                    q: "How long does implementation usually take?",
                    a: "Most institutions complete their pilot in a few weeks, with full campus adoption usually aligning with the next academic term.",
                  },
                  {
                    q: "Can students and recruiters verify certificates online?",
                    a: "Yes. Every certificate can include a QR code and verification URL, allowing quick validation of authenticity.",
                  },
                ].map((item, idx) => (
                  <AccordionItem
                    key={item.q}
                    value={`item-${idx + 1}`}
                    className="rounded-xl border border-border/60 bg-background/80 px-4"
                  >
                    <AccordionTrigger className="text-left text-sm font-medium">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <Card className="border-border/60 bg-background/90 backdrop-blur-xl">
                <CardContent className="space-y-4 p-5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Designed with academic audits in mind</p>
                  </div>
                  <p>
                    Thittam1Hub keeps a clear, exportable trail of events, attendance, and certificates that you can
                    share with accreditation bodies and internal quality cells.
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Download-ready reports for NAAC, NBA, and internal reviews.</li>
                    <li>Evidence mapping from events to outcomes and participation.</li>
                    <li>Role-based access to sensitive data and exports.</li>
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-primary/40 bg-background/70 text-primary"
                  >
                    Get an implementation checklist
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section aria-labelledby="final-cta-heading" className="bg-gradient-to-b from-background/95 via-background to-background">
          <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 lg:py-16">
            <div className="rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/20 via-background to-background/95 p-8 shadow-[0_25px_80px_rgba(59,130,246,0.7)] backdrop-blur-2xl">
              <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
                <div>
                  <h2 id="final-cta-heading" className="text-xl font-semibold tracking-tight md:text-2xl">
                    Ready to turn your university into a unified, verifiable hub of events and certificates?
                  </h2>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    Share Thittam1Hub with your Dean, HoDs, or IQAC teamand start with a focused pilot before rolling
                    out campus-wide.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Button size="lg" className="hover-scale shadow-[0_0_30px_rgba(59,130,246,0.8)]">
                      Book Campus Demo
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="hover-scale border-primary/50 bg-background/80 text-primary"
                    >
                      Explore Demo Workspace
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <p>Secure, auditable, and designed for academic accreditation.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <p>Dashboards that your academic council can actually use.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <p>Built for cross-department collaboration and student experience.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-background/95">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between lg:px-6">
          <p> a9 {new Date().getFullYear()} Thittam1Hub. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <button className="hover:text-foreground">Docs</button>
            <button className="hover:text-foreground">Status</button>
            <button className="hover:text-foreground">Privacy</button>
            <button className="hover:text-foreground">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
