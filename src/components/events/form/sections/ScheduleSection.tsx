/**
 * Schedule Section - Event Form
 * Handles: start/end dates, timezone, registration deadline
 */
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { SectionHeader, FormSectionWrapper, SectionInfoBox } from '../SectionComponents';
import { commonTimezones } from '../constants';
import { EventFormValues } from '@/lib/event-form-schema';

interface ScheduleSectionProps {
  form: UseFormReturn<EventFormValues>;
  isOpen: boolean;
  onToggle: () => void;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  form,
  isOpen,
  onToggle,
}) => {
  const { control } = form;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
        <SectionHeader
          title="Date & Time"
          description="When will this event take place?"
          icon={CalendarDaysIcon}
          isOpen={isOpen}
          stepNumber={2}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FormSectionWrapper>
          <SectionInfoBox>
            📅 Set when your event starts and ends. All times will be shown in the selected
            timezone.
          </SectionInfoBox>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date & time *</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date: Date | undefined) =>
                        field.onChange(date ? date.toISOString().slice(0, 16) : '')
                      }
                      placeholder="Select start date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End date & time *</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date: Date | undefined) =>
                        field.onChange(date ? date.toISOString().slice(0, 16) : '')
                      }
                      placeholder="Select end date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <select
                      className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    >
                      {commonTimezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    All event times will be displayed in this timezone.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="registrationDeadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration deadline</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date: Date | undefined) =>
                        field.onChange(date ? date.toISOString().slice(0, 16) : '')
                      }
                      placeholder="Optional deadline"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: close registrations before event starts.
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
