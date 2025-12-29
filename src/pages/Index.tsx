import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const sections = [
  {
    id: "overview",
    title: "Overview",
    description:
      "Thittam1Hub is a unified event management and publishing platform for organizers, participants, and organizations.",
  },
  {
    id: "architecture",
    title: "Architecture",
    description:
      "Three-tier architecture with React frontend, Node.js/Express backend, PostgreSQL database, and external services.",
  },
  {
    id: "core-services",
    title: "Core Domain Services",
    description:
      "Authentication, events, registration, attendance, judging, certificates, organizations, and marketplace.",
  },
  {
    id: "roles",
    title: "User Roles",
    description:
      "Super-Admins, Organizers, Participants, Volunteers, Judges, Speakers, Organization Admins, and Vendors.",
  },
  {
    id: "requirements",
    title: "Key Functional Requirements",
    description:
      "High-level view of major capabilities derived from the requirements specification.",
  },
];

const Index = () => {

  useEffect(() => {
    document.title = "Thittam1Hub Documentation";

    const description =
      "Functional and architectural documentation for Thittam1Hub unified event management and publishing platform.";

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
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background">
      <header className="border-b border-border/60 bg-background/60 backdrop-blur">
        <div className="container grid gap-6 py-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center md:py-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-secondary to-accent text-xs font-semibold text-primary-foreground shadow-[0_0_0_1px_hsl(var(--border))]">
                T1
              </span>
              <div>
                <p className="text-sm font-semibold tracking-wide text-muted-foreground">Documentation</p>
                <p className="text-base font-medium text-foreground">Thittam1Hub Platform</p>
              </div>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Clean lines for complex event worlds
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
              A Ligne Claire-inspired design system for planning, running, and verifying events—from first sketch to
              signed certificate.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-primary/40 bg-primary/5 text-xs font-normal text-primary">
                v1.0 Design &amp; Requirements
              </Badge>
              <Button
                variant="outline"
                className="group border-primary/40 bg-primary/5 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => {
                  const el = document.getElementById('requirements');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                View key requirements
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">{/* placeholder, illustration added below */}</div>
        </div>

      </header>

      <main className="container grid gap-10 py-8 md:grid-cols-[260px_minmax(0,1fr)] md:py-12">
        <aside className="sticky top-24 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">On this page</p>
          <ul className="mt-2 space-y-1 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  className="w-full rounded-md px-2 py-1.5 text-left text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  onClick={() => {
                    const el = document.getElementById(section.id);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="space-y-10 pb-12">
          <section id="overview" className="scroll-mt-28 space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Thittam1Hub System Documentation</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Thittam1Hub is a full-stack web application that centralizes the planning, management, tracking, and
              publishing of events. It supports high-scale, multi-event operations with secure certificate generation and
              public verification as core capabilities.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground">Primary personas</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-foreground/90">
                  Organizers, participants, volunteers, judges, speakers, organization admins, vendors, and
                  super-admins.
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground">Core value</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-foreground/90">
                  Unified event operations, from registration and attendance to judging, certificates, and
                  verification.
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground">Key extensions</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-foreground/90">
                  Official organization pages and an integrated B2B event services marketplace.
                </CardContent>
              </Card>
            </div>
          </section>

          <section id="architecture" className="scroll-mt-28 space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Architecture</h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              The system follows a three-tier architecture with a React client, a modular Node.js/Express application
              layer, a PostgreSQL data layer, and focused integrations with email, storage, QR generation, and PDF
              rendering services.
            </p>
            <Card className="border-border/70 bg-card/60 backdrop-blur">
              <CardContent className="pt-6 text-xs font-mono leading-relaxed text-muted-foreground">
                <pre className="whitespace-pre overflow-auto text-[0.7rem]">
                  {`Client Layer (React)
  - Organizer UI
  - Participant UI
  - Volunteer & judging interfaces

Application Layer (Node.js / Express)
  - Auth, Event, Registration, Attendance
  - Judging, Certificate, Communication
  - Organization, Discovery, Marketplace
  - Vendor, Booking, Payment

Data Layer (PostgreSQL)
  - Users, Events, Certificates
  - Registrations, Attendance, Judging

External Services
  - Email provider (SendGrid / SES)
  - Storage (S3-compatible)
  - QR code generation
  - Certificate PDF rendering`}
                </pre>
              </CardContent>
            </Card>
          </section>

          <section id="core-services" className="scroll-mt-28 space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Core domain services</h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Logical backend services encapsulate key functional areas. Each exposes clear interfaces and enforces
              role-based access control.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Auth & user access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    <li>User registration, login, and email verification.</li>
                    <li>JWT-based authentication with refresh tokens.</li>
                    <li>Role-based access control for all protected operations.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Events & registrations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Event creation, templates, modes (offline/online/hybrid).</li>
                    <li>Configurable registration forms, capacity, and waitlists.</li>
                    <li>Landing page generation with branded assets.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Attendance & judging</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    <li>QR-based check-in, session-level attendance reporting.</li>
                    <li>Rubric-based judging, weighted scores, leaderboards.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Certificates & verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Automatic certificate generation from event rules.</li>
                    <li>Unique certificate IDs with embedded verification QR.</li>
                    <li>Public verification portal for third parties.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Organizations & official pages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Verified organization profiles with branding and categories.</li>
                    <li>Organization-scoped admin management and event listing.</li>
                    <li>Follower model for discovery and updates.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Marketplace & vendors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Vendor profiles, service listings, and service packages.</li>
                    <li>Booking requests, agreements, and platform commissions.</li>
                    <li>Vendor dashboards with analytics and communication tools.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          <section id="roles" className="scroll-mt-28 space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">User roles</h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              The platform defines clear roles for access control and workflow separation. Sub-roles inherit base
              permissions and add role-specific capabilities.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold">Super-Admin</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Controls organizer onboarding, organization verification, and global configuration.
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold">Organizer</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Creates events, manages registrations, communications, judging, certificates, and analytics.
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold">Participant</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Self-service registration, dashboard access, QR check-in, leaderboard and certificate visibility.
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold">Volunteer</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Operates event-side tooling such as QR-based check-in and attendance dashboards.
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold">Judge</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Accesses assigned submissions only and submits rubric-based scores.
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold">Organization Admin & Vendor</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Manage organization pages, teams, events, and marketplace offerings and bookings.
                </CardContent>
              </Card>
            </div>
          </section>

          <section id="requirements" className="scroll-mt-28 space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Key functional requirements</h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              This section summarizes major requirements from the specification. Refer to the full requirements document
              for exhaustive acceptance criteria and edge cases.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold">User management & onboarding</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Role model with organizers, participants, and sub-roles (volunteer, judge, speaker).</li>
                    <li>Invitation-based organizer onboarding controlled by Super-Admins.</li>
                    <li>Self-service participant registration tied to event codes and invitations.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold">Event lifecycle</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Template-driven event creation with branding, schedule, and sponsors.</li>
                    <li>Mode configuration (offline/online/hybrid) with venue and virtual link requirements.</li>
                    <li>Auto-generated, SEO-optimized event landing pages with share graphics.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold">Attendance, judging, and analytics</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    <li>QR-based attendance tracking with immediate status updates.</li>
                    <li>Rubric-based scoring with weighted criteria and real-time leaderboards.</li>
                    <li>Analytics dashboards for registrations, attendance, scoring, and exports.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/60 backdrop-blur">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold">Certificates, organizations, and marketplace</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Automated certificate generation, distribution, and verification portal.</li>
                    <li>Official organization pages with verification and team management.</li>
                    <li>Integrated vendor marketplace with bookings, agreements, and commissions.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default Index;
