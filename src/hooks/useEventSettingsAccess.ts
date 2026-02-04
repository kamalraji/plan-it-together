import { useMemo } from 'react';
import { Workspace, WorkspaceType, WorkspaceRole } from '@/types';

export type EventSettingsCategory = 
  | 'ticketing'
  | 'promo_codes'
  | 'seo'
  | 'accessibility'
  | 'landing_page';

export type CommitteeType = 
  | 'registration'
  | 'finance'
  | 'marketing'
  | 'logistics'
  | 'event'
  | 'content'
  | 'unknown';

/**
 * Detects the committee type based on workspace name
 */
export function detectCommitteeType(workspaceName: string): CommitteeType {
  const name = workspaceName.toLowerCase();
  
  if (name.includes('registration')) return 'registration';
  if (name.includes('finance')) return 'finance';
  if (name.includes('marketing')) return 'marketing';
  if (name.includes('logistics')) return 'logistics';
  if (name.includes('content')) return 'content';
  if (name.includes('event') && !name.includes('settings')) return 'event';
  
  return 'unknown';
}

/**
 * Determines which event settings a workspace can access based on its type and the user's role
 */
export interface EventSettingsAccess {
  /** Can access all ticketing/registration settings */
  canAccessTicketing: boolean;
  /** Can access promo code management */
  canAccessPromoCodes: boolean;
  /** Can access SEO settings */
  canAccessSEO: boolean;
  /** Can access accessibility settings */
  canAccessAccessibility: boolean;
  /** Can access landing page management */
  canAccessLandingPage: boolean;
  /** Can access ALL event settings (Root workspace owners only) */
  canAccessAllSettings: boolean;
  /** Should show the Event Settings tab in navigation */
  showEventSettingsTab: boolean;
  /** Detected committee type */
  committeeType: CommitteeType;
  /** Is root workspace owner */
  isRootOwner: boolean;
}

export function useEventSettingsAccess(
  workspace: Workspace | undefined,
  userRole: WorkspaceRole | null | undefined,
  hasPageBuildingResponsibility?: boolean
): EventSettingsAccess {
  return useMemo(() => {
    const defaultAccess: EventSettingsAccess = {
      canAccessTicketing: false,
      canAccessPromoCodes: false,
      canAccessSEO: false,
      canAccessAccessibility: false,
      canAccessLandingPage: false,
      canAccessAllSettings: false,
      showEventSettingsTab: false,
      committeeType: 'unknown',
      isRootOwner: false,
    };

    if (!workspace) return defaultAccess;

    const committeeType = detectCommitteeType(workspace.name);
    const isRootWorkspace = workspace.workspaceType === WorkspaceType.ROOT;
    const isCommittee = workspace.workspaceType === WorkspaceType.COMMITTEE;
    const isDepartment = workspace.workspaceType === WorkspaceType.DEPARTMENT;
    
    // Root workspace owner gets full access to all settings
    // Handle both legacy 'OWNER' and current 'WORKSPACE_OWNER' role values
    const isRootOwner = isRootWorkspace && 
      (userRole === WorkspaceRole.WORKSPACE_OWNER || (userRole as string) === 'OWNER');
    
    // Root workspace members can also access if there are no committees created yet (fallback)
    const isRootMember = isRootWorkspace && !!userRole;

    // Determine access based on workspace type and committee type
    const canAccessTicketing = 
      isRootOwner || 
      isRootMember || 
      (isCommittee && committeeType === 'registration');
    
    const canAccessPromoCodes = 
      isRootOwner || 
      isRootMember || 
      (isCommittee && committeeType === 'finance');
    
    const canAccessSEO = 
      isRootOwner || 
      isRootMember || 
      (isCommittee && committeeType === 'marketing');
    
    const canAccessAccessibility = 
      isRootOwner || 
      isRootMember || 
      (isCommittee && (committeeType === 'logistics' || committeeType === 'event'));

    // Landing page access: ROOT owners always, or workspaces with assigned responsibility
    const canAccessLandingPage = 
      isRootOwner || 
      isRootMember ||
      hasPageBuildingResponsibility === true ||
      (isCommittee && (committeeType === 'content' || committeeType === 'marketing')) ||
      (isDepartment && committeeType === 'content');

    const canAccessAllSettings = isRootOwner || isRootMember;

    // Show the tab for Root workspaces, committees with relevant functions, or those with page building responsibility
    const showEventSettingsTab = 
      isRootWorkspace || 
      hasPageBuildingResponsibility === true ||
      (isCommittee && ['registration', 'finance', 'marketing', 'logistics', 'event', 'content'].includes(committeeType)) ||
      (isDepartment && committeeType === 'content');

    return {
      canAccessTicketing,
      canAccessPromoCodes,
      canAccessSEO,
      canAccessAccessibility,
      canAccessLandingPage,
      canAccessAllSettings,
      showEventSettingsTab,
      committeeType,
      isRootOwner,
    };
  }, [workspace, userRole, hasPageBuildingResponsibility]);
}
