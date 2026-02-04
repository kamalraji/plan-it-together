import { createContext, useContext } from 'react';

export interface OrganizationContextValue {
  organization: any;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export { OrganizationContext };
export const OrganizationProvider = OrganizationContext.Provider;

export const useCurrentOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error('useCurrentOrganization must be used within an OrganizationProvider');
  }
  return ctx.organization;
};

/**
 * Safe version of useCurrentOrganization that returns null if not in org context.
 * Use this in components that may or may not be rendered within an organization scope.
 */
export const useOptionalOrganization = () => {
  const ctx = useContext(OrganizationContext);
  return ctx?.organization ?? null;
};
