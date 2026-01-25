/**
 * Event Hooks - Event management and data hooks
 * 
 * Re-exports hooks from the flat structure for backwards compatibility
 * while providing organized imports.
 */

// Core event data
export { useEventData } from '../useEventData';
export { useEventManagementMetrics } from '../useEventManagementMetrics';
export { useEventStatusHistory } from '../useEventStatusHistory';
export { useEventDraft } from '../useEventDraft';

// Event access and permissions
export { useEventAccess } from '../useEventAccess';
export { useEventWorkspaceAccess } from '../useEventWorkspaceAccess';
export { useEventSettingsAccess } from '../useEventSettingsAccess';

// Event publishing
export { useEventPublish } from '../useEventPublish';
export { useEventPublishApprovals } from '../useEventPublishApprovals';
export { useRootPublishRequirements } from '../useRootPublishRequirements';

// Event form and creation
export { useEventCreatePath } from '../useEventCreatePath';
export { useEventManagementPaths } from '../useEventManagementPaths';
export { useEventFormKeyboard, formatShortcut } from '../useEventFormKeyboard';
export { useFormValidation } from '../useFormValidation';

// Page building
export { usePageBuilderSections } from '../usePageBuilderSections';
export { usePageBuildingResponsibilities } from '../usePageBuildingResponsibilities';
export { usePageViewTracking } from '../usePageViewTracking';

// Registration and ticketing
export { useManualRegistration } from '../useManualRegistration';
export { useTicketCheckout } from '../useTicketCheckout';
export { usePromoCodeValidation } from '../usePromoCodeValidation';
export { useWaitlist } from '../useWaitlist';

// Countdown and scheduling
export { useCountdown } from '../useCountdown';
export { useRunsheet } from '../useRunsheet';
export { useGanttChart } from '../useGanttChart';
