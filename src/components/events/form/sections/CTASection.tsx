/**
 * Call to Action Section - Event Form
 * Handles: primary and secondary CTA button labels
 */
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CursorArrowRaysIcon } from '@heroicons/react/24/outline';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SectionHeader, FormSectionWrapper } from '../SectionComponents';
import { EventFormValues } from '@/lib/event-form-schema';

interface CTASectionProps {
  form: UseFormReturn<EventFormValues>;
  isOpen: boolean;
  onToggle: () => void;
  stepNumber: number;
}

export const CTASection: React.FC<CTASectionProps> = ({
  form,
  isOpen,
  onToggle,
  stepNumber,
}) => {
  const { control } = form;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
        <SectionHeader
          title="Call to Action"
          description="Button labels for your event page"
          icon={CursorArrowRaysIcon}
          isOpen={isOpen}
          stepNumber={stepNumber}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FormSectionWrapper>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="primaryCtaLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary button label</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Register now"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Main call-to-action on your event hero.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="secondaryCtaLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary button label</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Learn more"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: softer action for schedule, FAQ, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSectionWrapper>
      </CollapsibleContent>
    </Collapsible>
  );
};
