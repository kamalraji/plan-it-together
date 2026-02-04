import { Shield, Lock, CheckCircle, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrustBadge {
  icon: React.ElementType;
  label: string;
  description: string;
}

const trustBadges: TrustBadge[] = [
  {
    icon: Shield,
    label: 'SOC 2 Compliant',
    description: 'Enterprise-grade security standards',
  },
  {
    icon: Lock,
    label: 'End-to-End Encryption',
    description: 'Your data is always protected',
  },
  {
    icon: CheckCircle,
    label: '99.9% Uptime',
    description: 'Reliable infrastructure you can trust',
  },
  {
    icon: Award,
    label: 'GDPR Ready',
    description: 'Full compliance with privacy regulations',
  },
];

interface TrustBadgesProps {
  className?: string;
  /** Variant: horizontal row or grid */
  variant?: 'row' | 'grid';
}

export function TrustBadges({ className, variant = 'row' }: TrustBadgesProps) {
  if (variant === 'grid') {
    return (
      <section
        className={`py-12 md:py-16 bg-background/95 border-t border-border/60 ${className ?? ''}`}
      >
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Enterprise-Ready Security
            </h2>
            <p className="text-sm text-muted-foreground">
              Your events and data are protected by industry-leading security measures.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustBadges.map((badge, index) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="rounded-xl border border-border/60 bg-card/80 p-4 text-center hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-3">
                  <badge.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {badge.label}
                </h3>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Row variant (compact, often used in footers or CTAs)
  return (
    <div className={`py-6 ${className ?? ''}`}>
      <div className="container">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {trustBadges.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <badge.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TrustBadges;
