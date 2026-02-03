/**
 * Media Gallery Section - Event Form
 * Handles: event images gallery
 */
import React from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EventImageGallery, type EventImage } from '@/components/events/form/EventImageGallery';
import { SectionHeader, FormSectionWrapper, SectionInfoBox } from '../SectionComponents';

interface MediaSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  stepNumber: number;
  images: EventImage[];
  onImagesChange: (images: EventImage[]) => void;
  isSubmitting: boolean;
}

export const MediaSection: React.FC<MediaSectionProps> = ({
  isOpen,
  onToggle,
  stepNumber,
  images,
  onImagesChange,
  isSubmitting,
}) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
        <SectionHeader
          title="Media Gallery"
          description="Event images and promotional visuals"
          icon={PhotoIcon}
          isOpen={isOpen}
          stepNumber={stepNumber}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FormSectionWrapper>
          <SectionInfoBox variant="accent">
            🖼️ Add images to showcase your event. The primary image will be used as the event
            cover.
          </SectionInfoBox>

          <EventImageGallery
            images={images}
            onChange={onImagesChange}
            maxImages={10}
            disabled={isSubmitting}
          />
        </FormSectionWrapper>
      </CollapsibleContent>
    </Collapsible>
  );
};
