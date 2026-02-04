/**
 * Basic Information Section - Event Form
 * Handles: name, description, mode, visibility, category, capacity, registration settings
 */
import React from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Building2, Ticket } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { TicketTierQuickAdd, QuickTier } from '@/components/events/form/TicketTierQuickAdd';
import { SectionHeader, FormSectionWrapper } from '../SectionComponents';
import { categoryLabels, registrationTypes } from '../constants';
import { EventFormValues } from '@/lib/event-form-schema';

interface BasicInfoSectionProps {
  form: UseFormReturn<EventFormValues>;
  isOpen: boolean;
  onToggle: () => void;
  isSubmitting: boolean;
  isLoadingOrganizations: boolean;
  currentOrganization?: { id: string; name: string } | null;
  pendingTiers: QuickTier[];
  onPendingTiersChange: (tiers: QuickTier[]) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  form,
  isOpen,
  onToggle,
  isSubmitting,
  isLoadingOrganizations,
  currentOrganization,
  pendingTiers,
  onPendingTiersChange,
}) => {
  const { control } = form;
  const watchIsFreeEvent = useWatch({ control, name: 'isFreeEvent' });

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
        <SectionHeader
          title="Basic Information"
          description="Name, organization, description, and format"
          icon={SparklesIcon}
          isOpen={isOpen}
          stepNumber={1}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FormSectionWrapper>
          {/* Organization Display */}
          <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Creating under</p>
                {isLoadingOrganizations ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : currentOrganization ? (
                  <p className="font-medium text-foreground">{currentOrganization.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No organization found</p>
                )}
              </div>
            </div>
          </div>

          {/* Event Name */}
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event name *</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="e.g. Campus DevFest 2025"
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  This appears on your landing page and emails — keep it short and clear.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Share what makes this event special. Use formatting to highlight key details..."
                    minHeight="180px"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  A rich overview that helps attendees understand who this event is for.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mode & Visibility */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event mode *</FormLabel>
                  <FormControl>
                    <select
                      className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    >
                      <option value="ONLINE">🌐 Online</option>
                      <option value="OFFLINE">📍 In-Person</option>
                      <option value="HYBRID">🔄 Hybrid</option>
                    </select>
                  </FormControl>
                  <FormDescription>Choose how people will join.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event visibility</FormLabel>
                  <FormControl>
                    <select
                      className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    >
                      <option value="PUBLIC">🌐 Public — Visible to everyone</option>
                      <option value="UNLISTED">👁️ Unlisted — Via direct link only</option>
                      <option value="PRIVATE">🔒 Private — Invite only</option>
                    </select>
                  </FormControl>
                  <FormDescription>Control who can see your event.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Category */}
          <FormField
            control={control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event category</FormLabel>
                <FormControl>
                  <select
                    className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...field}
                  >
                    <option value="">Select category...</option>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label as string}
                        </option>
                      ))}
                  </select>
                </FormControl>
                <FormDescription>Helps attendees discover your event.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Capacity & Registration Type */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 150" className="h-11" {...field} />
                  </FormControl>
                  <FormDescription>Optional: set a soft cap.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="registrationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration type</FormLabel>
                  <FormControl>
                    <select
                      className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    >
                      {registrationTypes.map((type: { value: string; label: string }) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>How attendees can register.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Free Event & Waitlist Toggles */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="isFreeEvent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Free event</FormLabel>
                    <FormDescription>Toggle off if this is a paid event.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="allowWaitlist"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable waitlist</FormLabel>
                    <FormDescription>Allow waitlist when capacity is reached.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Ticket Tiers Section - show when paid event */}
          {!watchIsFreeEvent && (
            <div className="mt-4 p-4 border border-dashed border-primary/30 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Ticket className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Ticket Tiers</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Add your ticket tiers below. You can add more or edit these later in event
                settings.
              </p>
              <TicketTierQuickAdd
                tiers={pendingTiers}
                onChange={onPendingTiersChange}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Tags */}
          <FormField
            control={control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags / Keywords</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="e.g. tech, hackathon, students, AI"
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Comma-separated tags for SEO and event discovery.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SEO Fields */}
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm font-medium text-foreground mb-4">🔍 Search Engine Optimization</p>

            <div className="space-y-6">
              <FormField
                control={control}
                name="metaDescription"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Meta Description</FormLabel>
                      <span className="text-xs text-muted-foreground">
                        {field.value?.length || 0}/160
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="A brief description for search engines..."
                        maxLength={160}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Appears in search results. Keep under 160 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="customSlug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom URL Slug</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="e.g. devfest-2025"
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Creates a friendly URL like /events/devfest-2025
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </FormSectionWrapper>
      </CollapsibleContent>
    </Collapsible>
  );
};
