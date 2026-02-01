/**
 * Branding Section - Event Form
 * Handles: primary color, hero subtitle, logo, banner
 */
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { PaintBrushIcon } from '@heroicons/react/24/outline';
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
import { ImageUpload } from '@/components/ui/image-upload';
import { SectionHeader, FormSectionWrapper } from '../SectionComponents';
import { EventFormValues } from '@/lib/event-form-schema';

interface BrandingSectionProps {
  form: UseFormReturn<EventFormValues>;
  isOpen: boolean;
  onToggle: () => void;
  stepNumber: number;
}

export const BrandingSection: React.FC<BrandingSectionProps> = ({
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
          title="Branding"
          description="Visual identity for your event page"
          icon={PaintBrushIcon}
          isOpen={isOpen}
          stepNumber={stepNumber}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FormSectionWrapper>
          {/* Color & Subtitle */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        className="h-11 w-16 cursor-pointer p-1"
                        {...field}
                      />
                      <Input
                        type="text"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="#2563eb"
                        className="h-11 flex-1 font-mono text-sm"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Accent color for buttons and highlights.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="heroSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hero subtitle</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="A catchy tagline"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Short elevator pitch under your title.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Logo */}
          <FormField
            control={control}
            name="logoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event logo</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="https://example.com/logo.png"
                    folder="logos"
                    aspectRatio="square"
                    maxSizeMB={2}
                  />
                </FormControl>
                <FormDescription>
                  Square image works best. Upload or paste a URL.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Banner */}
          <FormField
            control={control}
            name="bannerUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hero banner image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="https://example.com/hero-banner.jpg"
                    folder="banners"
                    aspectRatio="banner"
                    maxSizeMB={5}
                  />
                </FormControl>
                <FormDescription>
                  Wide image (3:1 ratio) for the top of your landing page.
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
