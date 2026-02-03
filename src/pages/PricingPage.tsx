import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { useSeo } from "@/hooks/useSeo";

const PricingPage = () => {
  useSeo({
    title: "Pricing for event teams | Thittam1Hub",
    description:
      "Transparent Thittam1Hub pricing for event teams, from starter workspaces to full multi-organization rollouts.",
    canonicalPath: "/pricing",
  });

  return (
    <PublicPageLayout>
      <main className="bg-background text-foreground">
      <section className="border-b border-border/60 bg-card/80 py-14 md:py-20">
        <div className="container max-w-4xl mx-auto text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Pricing</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Pricing that matches how your events actually run
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Start with a single workspace and graduate to a full multi-organization rollout—without switching tools or
            migrating data.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16 border-b border-border/60 bg-background">
        <div className="container max-w-5xl mx-auto grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">Starter</p>
              <p className="text-2xl font-semibold">Free</p>
              <p className="mt-2 text-xs text-muted-foreground">For small teams validating one flagship event.</p>
              <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                <li>• 1 event workspace</li>
                <li>• Registration & attendance tracking</li>
                <li>• Basic certificate issuing</li>
                <li>• Email support</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-primary/60 bg-card/80 p-5 shadow-md ring-1 ring-primary/40">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-1">Growth</p>
              <p className="text-2xl font-semibold">Custom</p>
              <p className="mt-2 text-xs text-muted-foreground">For campuses, communities, and brands scaling events.</p>
              <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                <li>• Multiple event workspaces</li>
                <li>• Advanced attendance & judging workflows</li>
                <li>• Branded, QR-backed certificates</li>
                <li>• Onboarding & rollout support</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">Enterprise</p>
              <p className="text-2xl font-semibold">Talk to us</p>
              <p className="mt-2 text-xs text-muted-foreground">For multi-region, multi-brand, or compliance-heavy teams.</p>
              <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                <li>• Multi-organization hierarchy</li>
                <li>• Advanced security & data controls</li>
                <li>• Custom integrations & SLAs</li>
                <li>• Dedicated success manager</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/80 p-6 space-y-3 text-sm text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">How pricing works</h2>
            <p>
              We look at how many events you run per year, how many organizers and reviewers you have, and whether you
              need participant-facing verification pages branded for your organization.
            </p>
            <p>
              That turns into a simple workspace-based quote you can roll out across departments or partner teams without
              surprise overages.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 border-b border-border/60 bg-card/80">
        <div className="container max-w-5xl mx-auto space-y-6">
          <h2 className="text-xl font-semibold tracking-tight">Feature comparison</h2>
          <div className="overflow-x-auto text-xs md:text-sm">
            <table className="min-w-full border border-border/60 rounded-xl overflow-hidden">
              <thead className="bg-background/80">
                <tr>
                  <th className="text-left px-4 py-3 border-b border-border/60">Capability</th>
                  <th className="text-center px-4 py-3 border-b border-border/60">Starter</th>
                  <th className="text-center px-4 py-3 border-b border-border/60">Growth</th>
                  <th className="text-center px-4 py-3 border-b border-border/60">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {[
                  { label: "Event workspaces", starter: "1", growth: "Up to 10", enterprise: "Unlimited" },
                  { label: "Registration & attendance", starter: "Included", growth: "Included", enterprise: "Included" },
                  { label: "Judging workflows", starter: "Basic", growth: "Advanced", enterprise: "Advanced" },
                  { label: "Certificates & verification", starter: "Basic", growth: "Branded", enterprise: "Branded + custom" },
                  { label: "Roles & permissions", starter: "Simple", growth: "Granular", enterprise: "Org-wide" },
                ].map((row) => (
                  <tr key={row.label} className="bg-background/60">
                    <td className="px-4 py-3 text-left font-medium text-foreground">{row.label}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{row.starter}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{row.growth}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="faq" className="py-12 md:py-16 bg-background border-b border-border/60">
        <div className="container max-w-3xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">Pricing FAQs</h2>
            <p className="text-sm text-muted-foreground">
              Honest answers to the questions teams usually ask when rolling out Thittam1Hub.
            </p>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <motion.details className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3" initial={false}>
              <summary className="font-semibold cursor-pointer">Can we start with a single event?</summary>
              <p className="mt-2 text-xs md:text-sm">
                Yes. Many teams begin with one flagship event and then expand once the workspace is proven for their
                stakeholders.
              </p>
            </motion.details>
            <motion.details className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3" initial={false}>
              <summary className="font-semibold cursor-pointer">Do you charge per registration?</summary>
              <p className="mt-2 text-xs md:text-sm">
                No. We price around workspaces and capabilities so you can run high-volume events without unpredictable
                per-attendee overages.
              </p>
            </motion.details>
            <motion.details className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3" initial={false}>
              <summary className="font-semibold cursor-pointer">How do we get a formal quote?</summary>
              <p className="mt-2 text-xs md:text-sm">
                Share your event volume and rollout plan via the demo or pricing forms, and we&apos;ll return with a
                tailored quote that maps cleanly to your finance model.
              </p>
            </motion.details>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-card/80">
        <div className="container max-w-3xl text-center space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to talk numbers?</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Tell us about your events, and we&apos;ll propose a rollout that fits your budget and how your teams actually
            work.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <Button
              className="rounded-full px-6 py-2.5 text-sm font-semibold bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
              onClick={() => (window.location.href = "/help?intent=pricing")}
            >
              Talk to sales
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-6 py-2.5 text-sm font-semibold border-border/70 bg-background/80 text-foreground hover:bg-muted/70"
              onClick={() => (window.location.href = "/help?intent=demo")}
            >
              Book a demo
            </Button>
          </div>
        </div>
      </section>
      </main>
    </PublicPageLayout>
  );
};

export default PricingPage;
