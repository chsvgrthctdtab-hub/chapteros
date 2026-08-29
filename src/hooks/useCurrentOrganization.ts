import { useAuth } from '@/contexts/AuthContext';
import type { Organization, OrganizationRole } from '@/types';
import type { UserMembership } from '@/contexts/AuthContext';

export interface UseCurrentOrganizationReturn {
  currentOrganization: Organization | null;
  currentRole: OrganizationRole | null;
  memberships: UserMembership[];
  activeMembership: UserMembership | null;
  setCurrentOrganizationId: (orgId: string) => void;
  isLoading: boolean;
  hasOrganization: boolean;
}

export function useCurrentOrganization(): UseCurrentOrganizationReturn {
  const {
    activeOrganization,
    activeRole,
    memberships,
    activeMembership,
    setActiveOrganizationId,
    isLoading,
  } = useAuth();

  return {
    currentOrganization: activeOrganization,
    currentRole: activeRole,
    memberships,
    activeMembership,
    setCurrentOrganizationId: setActiveOrganizationId,
    isLoading,
    hasOrganization: Boolean(activeOrganization && memberships.length > 0),
  };
}

export default useCurrentOrganization;
