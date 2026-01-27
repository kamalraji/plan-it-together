/**
 * Event Form Header Component
 * Sticky header with title, draft status, and progress indicator
 */
import React from 'react';
import { DraftStatusIndicator } from './DraftStatusIndicator';
import { SectionProgressIndicator, type SectionProgress } from './SectionProgressIndicator';

interface EventFormHeaderProps {
  mode: 'create' | 'edit';
  isDraftSaving: boolean;
  lastSaved: Date | null;
  hasDraft: boolean;
  sectionProgress: SectionProgress[];
  onSectionClick: (sectionId: string) => void;
}

export const EventFormHeader: React.FC<EventFormHeaderProps> = ({
  mode,
  isDraftSaving,
  lastSaved,
  hasDraft,
  sectionProgress,
  onSectionClick,
}) => {
  const pageTitle = mode === 'create' ? 'Create Event' : 'Edit Event';
  const subtitle = mode === 'create'
    ? 'Fill in the details to create your event draft'
    : 'Update your event information';

  return (
    <div className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <DraftStatusIndicator
              isSaving={isDraftSaving}
              lastSaved={lastSaved}
              hasDraft={hasDraft}
            />
            <SectionProgressIndicator
              sections={sectionProgress}
              onSectionClick={onSectionClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventFormHeader;
