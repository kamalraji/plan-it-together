import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    id: 'getting-started-1',
    question: 'What is Thittam1Hub?',
    answer:
      'Thittam1Hub is a unified event management and publishing platform that centralizes planning, tracking, registrations, QR-based attendance, judging, and certificate-backed verification for every event.',
    category: 'Getting Started',
  },
  {
    id: 'getting-started-2',
    question: 'How do I create my first event?',
    answer:
      'Sign up for free, create or join an organization, then click "Create Event" from your dashboard. Our guided setup will walk you through event details, registration forms, and publishing.',
    category: 'Getting Started',
  },
  {
    id: 'getting-started-3',
    question: 'Can I use Thittam1Hub for free?',
    answer:
      'Yes! We offer a free tier for small events and individual organizers. Upgrade to paid plans as your event volume grows or when you need advanced features like analytics and team collaboration.',
    category: 'Getting Started',
  },
  // Pricing & Plans
  {
    id: 'pricing-1',
    question: 'How is pricing structured?',
    answer:
      'Pricing is based on your organization size and event volume. We offer flexible plans that scale with your needs—from free community events to enterprise programs with thousands of attendees.',
    category: 'Pricing & Plans',
  },
  {
    id: 'pricing-2',
    question: 'Can I switch plans anytime?',
    answer:
      'Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle, and we prorate charges accordingly.',
    category: 'Pricing & Plans',
  },
  // Event Management
  {
    id: 'events-1',
    question: 'How does QR check-in work?',
    answer:
      'Each registered attendee receives a unique QR code. At the event, use our mobile app or any camera to scan codes instantly. Attendance is recorded in real-time with live dashboards.',
    category: 'Event Management',
  },
  {
    id: 'events-2',
    question: 'Can I customize registration forms?',
    answer:
      'Yes. Build custom forms with our drag-and-drop editor. Add text fields, dropdowns, file uploads, and conditional logic to collect exactly the data you need.',
    category: 'Event Management',
  },
  {
    id: 'events-3',
    question: 'How do I manage multiple events?',
    answer:
      'Your organization workspace shows all events in one place. Filter by status, duplicate successful events as templates, and share team members across events.',
    category: 'Event Management',
  },
  // Certificates & Verification
  {
    id: 'certificates-1',
    question: 'How do certificates work?',
    answer:
      'Issue beautiful, customizable certificates with embedded QR codes. Anyone can scan the QR to verify the certificate is authentic—no accounts required.',
    category: 'Certificates & Verification',
  },
  {
    id: 'certificates-2',
    question: 'Can sponsors verify participation?',
    answer:
      'Yes. Our public verification portal allows sponsors, recruiters, and institutions to confirm attendance and achievements without needing a Thittam1Hub account.',
    category: 'Certificates & Verification',
  },
  // Organizations & Teams
  {
    id: 'teams-1',
    question: 'How do team workspaces work?',
    answer:
      'Each event gets its own workspace where you assign roles like Team Lead, Volunteer, or Marketing. Members see only what they need, and access winds down when the event ends.',
    category: 'Organizations & Teams',
  },
  {
    id: 'teams-2',
    question: 'Can I invite external collaborators?',
    answer:
      'Yes. Invite anyone by email to join your event workspace with specific role-based permissions. They can contribute without accessing your entire organization.',
    category: 'Organizations & Teams',
  },
  // Technical & Security
  {
    id: 'security-1',
    question: 'Is my data secure?',
    answer:
      'We use industry-standard encryption, row-level security, and regular audits. Your data is stored in SOC 2 compliant infrastructure with automatic backups.',
    category: 'Technical & Security',
  },
  {
    id: 'security-2',
    question: 'Do you offer SSO integration?',
    answer:
      'Enterprise plans include SAML SSO integration with providers like Okta, Azure AD, and Google Workspace. Contact us for custom identity requirements.',
    category: 'Technical & Security',
  },
];

const categories = [
  'Getting Started',
  'Pricing & Plans',
  'Event Management',
  'Certificates & Verification',
  'Organizations & Teams',
  'Technical & Security',
];

interface FAQSectionProps {
  className?: string;
  /** Filter to specific category */
  category?: string;
  /** Show category headers */
  showCategories?: boolean;
  /** Max items to show per category (0 = all) */
  maxPerCategory?: number;
}

export function FAQSection({
  className,
  category,
  showCategories = true,
  maxPerCategory = 0,
}: FAQSectionProps) {
  const location = useLocation();

  // Filter FAQs by category if specified
  const filteredFAQs = useMemo(() => {
    if (category) {
      return faqData.filter((faq) => faq.category === category);
    }
    return faqData;
  }, [category]);

  // Group FAQs by category
  const groupedFAQs = useMemo(() => {
    const grouped: Record<string, FAQItem[]> = {};
    categories.forEach((cat) => {
      const items = filteredFAQs.filter((faq) => faq.category === cat);
      if (items.length > 0) {
        grouped[cat] = maxPerCategory > 0 ? items.slice(0, maxPerCategory) : items;
      }
    });
    return grouped;
  }, [filteredFAQs, maxPerCategory]);

  // Handle deep linking to specific FAQ item
  useEffect(() => {
    const hash = location.hash;
    if (hash && hash.startsWith('#faq-')) {
      const faqId = hash.replace('#faq-', '');
      const element = document.getElementById(`faq-${faqId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Trigger accordion open via click
          const trigger = element.querySelector('[data-state]');
          if (trigger && trigger.getAttribute('data-state') === 'closed') {
            (trigger as HTMLButtonElement).click();
          }
        }, 100);
      }
    }
  }, [location.hash]);

  // Generate JSON-LD structured data
  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: filteredFAQs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }),
    [filteredFAQs]
  );

  return (
    <section
      id="faq"
      className={`py-16 md:py-20 bg-background/95 ${className ?? ''}`}
      aria-labelledby="faq-heading"
    >
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2
            id="faq-heading"
            className="text-2xl md:text-3xl font-semibold tracking-tight mb-4"
          >
            Frequently Asked Questions
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about Thittam1Hub. Can't find what you're looking for?{' '}
            <a
              href="/help?intent=contact"
              className="text-primary hover:underline"
            >
              Contact our support team
            </a>
            .
          </p>
        </motion.div>

        {showCategories ? (
          <div className="space-y-10">
            {categories.map((cat) => {
              const items = groupedFAQs[cat];
              if (!items || items.length === 0) return null;

              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {cat}
                  </h3>
                  <Accordion type="single" collapsible className="space-y-2">
                    {items.map((faq) => (
                      <AccordionItem
                        key={faq.id}
                        id={`faq-${faq.id}`}
                        value={faq.id}
                        className="rounded-xl border border-border/60 bg-card/80 px-4 data-[state=open]:shadow-md transition-shadow"
                      >
                        <AccordionTrigger className="text-left text-sm font-medium py-4 hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pb-4">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {filteredFAQs.map((faq) => (
              <AccordionItem
                key={faq.id}
                id={`faq-${faq.id}`}
                value={faq.id}
                className="rounded-xl border border-border/60 bg-card/80 px-4 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left text-sm font-medium py-4 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </section>
  );
}

export default FAQSection;
