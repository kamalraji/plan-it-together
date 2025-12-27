import { createContext, useContext } from 'react';

export interface OrganizationContextValue {
  organization: any;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export const OrganizationProvider = OrganizationContext.Provider;

export const useCurrentOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error('useCurrentOrganization must be used within an OrganizationProvider');
  }
  return ctx.organization;
};
