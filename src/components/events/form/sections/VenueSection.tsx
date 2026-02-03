/**
 * Location & Venue Section - Event Form
 * Handles: venue name, address, city, state, country, capacity, accessibility
 */
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { MapPinIcon } from '@heroicons/react/24/outline';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SectionHeader, FormSectionWrapper, SectionInfoBox } from '../SectionComponents';
import { accessibilityOptions, languageOptions } from '../constants';
import { EventFormValues } from '@/lib/event-form-schema';

interface VenueSectionProps {
  form: UseFormReturn<EventFormValues>;
  isOpen: boolean;
  onToggle: () => void;
  stepNumber: number;
  selectedMode: string;
}

export const VenueSection: React.FC<VenueSectionProps> = ({
  form,
  isOpen,
  onToggle,
  stepNumber,
  selectedMode,
}) => {
  const { control } = form;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
        <SectionHeader
          title="Location & Venue"
          description="Physical venue details for in-person attendance"
          icon={MapPinIcon}
          isOpen={isOpen}
          stepNumber={stepNumber}
          isConditional
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FormSectionWrapper borderColor="border-accent/30">
          <SectionInfoBox variant="accent">
            📍 These details will be shown to attendees for your{' '}
            <span className="font-medium text-foreground">
              {selectedMode === 'HYBRID' ? 'in-person' : 'offline'}
            </span>{' '}
            event.
          </SectionInfoBox>

          {/* Venue Name */}
          <FormField
            control={control}
            name="venueName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue name</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="e.g. Tech Hub Convention Center"
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Name of the venue or building.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={control}
            name="venueAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street address</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="123 Main Street, Suite 100"
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City & State */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="venueCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="e.g. Chennai" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="venueState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State / Province</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g. Tamil Nadu"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Country & Postal Code */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="venueCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="e.g. India" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="venuePostalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal code</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="e.g. 600001" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Venue Capacity */}
          <FormField
            control={control}
            name="venueCapacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue capacity</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 500" className="h-11" {...field} />
                </FormControl>
                <FormDescription>
                  Maximum attendees the venue can accommodate.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Accessibility Features */}
          <div className="space-y-4">
            <FormLabel className="text-base font-medium">Accessibility features</FormLabel>
            <p className="text-sm text-muted-foreground -mt-2">
              Select all accessibility features available at the venue.
            </p>
            <FormField
              control={control}
              name="accessibilityFeatures"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {accessibilityOptions.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
                      >
                        <Checkbox
                          id={option.id}
                          checked={field.value?.includes(option.id)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, option.id]);
                            } else {
                              field.onChange(
                                currentValue.filter((v: string) => v !== option.id)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={option.id}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Accessibility Notes */}
          <FormField
            control={control}
            name="accessibilityNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accessibility notes</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Additional accessibility information, e.g., entrance location for wheelchair users..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Any additional details about venue accessibility.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Event Language */}
          <FormField
            control={control}
            name="accessibilityLanguage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Language</FormLabel>
                <FormControl>
                  <select
                    className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...field}
                  >
                    {languageOptions.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormDescription>
                  Primary language for presentations and materials.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSectionWrapper>
      </CollapsibleContent>
    </Collapsible>
  );
};
