import { useAuth } from '@/contexts/AuthContext';
import { isOrgBoard, isOrgAdmin, isOrgTreasurer } from '@/types/roles';

export function useCurrentOrg() {
  const { activeOrganization, activeMembership, user, profile, isLoading } = useAuth();

  return {
    currentOrg: activeOrganization,
    membership: activeMembership,
    role: activeMembership?.role,
    isBoard: isOrgBoard(activeMembership?.role),
    isAdmin: isOrgAdmin(activeMembership?.role),
    isTreasurer: isOrgTreasurer(activeMembership?.role),
    user,
    profile,
    isLoading,
  };
}
