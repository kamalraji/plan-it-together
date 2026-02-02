/**
 * FAQs Section - Event Form
 * Handles: frequently asked questions
 */
import React from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EventFAQsSection as FAQsComponent, type EventFAQ } from '@/components/events/form/EventFAQsSection';
import { SectionHeader, FormSectionWrapper, SectionInfoBox } from '../SectionComponents';

interface FAQsSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  stepNumber: number;
  faqs: EventFAQ[];
  onFaqsChange: (faqs: EventFAQ[]) => void;
  isSubmitting: boolean;
}

export const FAQsSection: React.FC<FAQsSectionProps> = ({
  isOpen,
  onToggle,
  stepNumber,
  faqs,
  onFaqsChange,
  isSubmitting,
}) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
        <SectionHeader
          title="Frequently Asked Questions"
          description="Help attendees with common questions"
          icon={QuestionMarkCircleIcon}
          isOpen={isOpen}
          stepNumber={stepNumber}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FormSectionWrapper>
          <SectionInfoBox variant="accent">
            ❓ FAQs help reduce attendee inquiries and improve the registration experience.
          </SectionInfoBox>

          <FAQsComponent
            faqs={faqs}
            onChange={onFaqsChange}
            maxFaqs={20}
            disabled={isSubmitting}
          />
        </FormSectionWrapper>
      </CollapsibleContent>
    </Collapsible>
  );
};
