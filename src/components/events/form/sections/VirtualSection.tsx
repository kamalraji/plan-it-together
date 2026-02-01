/**
 * Virtual Event Section - Event Form
 * Handles: platform, meeting URL, meeting ID, password, instructions
 */
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
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
import { SectionHeader, FormSectionWrapper, SectionInfoBox } from '../SectionComponents';
import { virtualPlatforms } from '../constants';
import { EventFormValues } from '@/lib/event-form-schema';

interface VirtualSectionProps {
  form: UseFormReturn<EventFormValues>;
  isOpen: boolean;
  onToggle: () => void;
  stepNumber: number;
  selectedMode: string;
}

export const VirtualSection: React.FC<VirtualSectionProps> = ({
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
          title="Virtual Event Setup"
          description="Meeting link and online access details"
          icon={VideoCameraIcon}
          isOpen={isOpen}
          stepNumber={stepNumber}
          isConditional
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FormSectionWrapper borderColor="border-accent/30">
          <SectionInfoBox variant="accent">
            🌐 Provide the virtual meeting details for your{' '}
            <span className="font-medium text-foreground">
              {selectedMode === 'HYBRID' ? 'online' : 'virtual'}
            </span>{' '}
            attendees.
          </SectionInfoBox>

          {/* Platform & Meeting ID */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="virtualPlatform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  <FormControl>
                    <select
                      className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    >
                      <option value="">Select platform...</option>
                      {virtualPlatforms.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>Video conferencing platform you'll use.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="virtualMeetingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting ID</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g. 123 456 7890"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Optional meeting ID or room code.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Meeting URL */}
          <FormField
            control={control}
            name="virtualMeetingUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting URL</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://zoom.us/j/123456789"
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormDescription>The link attendees will use to join.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="virtualPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting password</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Optional password"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Password required to join (if any).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Instructions */}
          <FormField
            control={control}
            name="virtualInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Joining instructions</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Any additional instructions for joining the virtual session..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Tips or requirements for attendees (e.g., download app beforehand).
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
