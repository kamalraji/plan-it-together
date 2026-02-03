/**
 * Organizer & Contact Section - Event Form
 * Handles: contact email, phone, support URL, event website
 */
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { UserCircleIcon } from '@heroicons/react/24/outline';
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
import { SectionHeader, FormSectionWrapper, SectionInfoBox } from '../SectionComponents';
import { EventFormValues } from '@/lib/event-form-schema';

interface OrganizerSectionProps {
  form: UseFormReturn<EventFormValues>;
  isOpen: boolean;
  onToggle: () => void;
}

export const OrganizerSection: React.FC<OrganizerSectionProps> = ({
  form,
  isOpen,
  onToggle,
}) => {
  const { control } = form;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
        <SectionHeader
          title="Organizer & Contact"
          description="Contact information for attendee inquiries"
          icon={UserCircleIcon}
          isOpen={isOpen}
          stepNumber={3}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FormSectionWrapper>
          <SectionInfoBox>
            📧 Attendees will use this information to reach out with questions.
          </SectionInfoBox>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="organizer@example.com"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Primary contact for attendee inquiries.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact phone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Optional phone number for urgent queries.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="supportUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support / FAQ URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://yoursite.com/support"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Link to help center or FAQ page.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="eventWebsite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event website</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://yourevent.com"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>External website for more information.</FormDescription>
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
