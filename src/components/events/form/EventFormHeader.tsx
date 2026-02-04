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
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  sectionProgress: SectionProgress[];
  onSectionClick: (sectionId: string) => void;
}

export const EventFormHeader: React.FC<EventFormHeaderProps> = ({
  mode,
  isDraftSaving,
  lastSaved,
  hasDraft,
  syncStatus,
  sectionProgress,
  onSectionClick,
}) => {
  const pageTitle = mode === 'create' ? 'Create Event' : 'Edit Event';
  const subtitle = mode === 'create'
    ? 'Fill in the details to create your event draft'
    : 'Update your event information';

  return (
    <div className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl px-4 py-3 sm:py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Title and mobile draft status */}
          <div className="flex items-center justify-between sm:block">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">{subtitle}</p>
            </div>
            {/* Mobile draft status - inline */}
            <div className="sm:hidden">
              <DraftStatusIndicator
                isSaving={isDraftSaving}
                lastSaved={lastSaved}
                hasDraft={hasDraft}
                syncStatus={syncStatus}
                compact
              />
            </div>
          </div>
          
          {/* Desktop: Draft status and progress */}
          <div className="hidden sm:flex items-center gap-3">
            <DraftStatusIndicator
              isSaving={isDraftSaving}
              lastSaved={lastSaved}
              hasDraft={hasDraft}
              syncStatus={syncStatus}
            />
            <SectionProgressIndicator
              sections={sectionProgress}
              onSectionClick={onSectionClick}
            />
          </div>
        </div>
        
        {/* Mobile progress indicator - horizontal scroll */}
        <div className="sm:hidden mt-3 -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <SectionProgressIndicator
            sections={sectionProgress}
            onSectionClick={onSectionClick}
            compact
          />
        </div>
      </div>
    </div>
  );
};

export default EventFormHeader;
