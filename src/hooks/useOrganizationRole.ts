import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { OrganizationRole } from '@/types';

export interface UseOrganizationRoleReturn {
  role: OrganizationRole | null;
  isAdmin: boolean;
  isLeader: boolean;
  isDeputy: boolean;
  isSecretary: boolean;
  isTreasurer: boolean;
  isBoard: boolean;
  canManageMembers: boolean;
  canManageFinance: boolean;
  canManageActivities: boolean;
  canManageTasks: boolean;
  canManageSettings: boolean;
  canAccessGoogleIntegrations: boolean;
  roleDisplayName: string;
}

export const ROLE_DISPLAY_NAMES: Record<OrganizationRole, string> = {
  admin: 'Quản trị viên (Admin)',
  leader: 'Chi hội trưởng',
  deputy: 'Chi hội phó',
  secretary: 'Ủy viên / Thư ký',
  treasurer: 'Thủ quỹ',
};

export function useOrganizationRole(): UseOrganizationRoleReturn {
  const { activeRole } = useAuth();

  return useMemo(() => {
    const role = activeRole;
    const isAdmin = role === 'admin';
    const isLeader = role === 'leader' || role === 'admin';
    const isDeputy = role === 'deputy';
    const isSecretary = role === 'secretary';
    const isTreasurer = role === 'treasurer';
    const isBoard = role ? ['admin', 'leader', 'deputy', 'secretary', 'treasurer'].includes(role) : false;

    const canManageMembers = role ? ['admin', 'leader', 'deputy'].includes(role) : false;
    const canManageFinance = isBoard;
    const canManageActivities = role ? ['admin', 'leader', 'deputy', 'secretary'].includes(role) : false;
    const canManageTasks = role ? ['admin', 'leader', 'deputy', 'secretary'].includes(role) : false;
    const canManageSettings = role === 'admin';
    const canAccessGoogleIntegrations = isBoard;

    const roleDisplayName = role ? (ROLE_DISPLAY_NAMES[role] || role) : 'Chưa phân quyền';

    return {
      role,
      isAdmin,
      isLeader,
      isDeputy,
      isSecretary,
      isTreasurer,
      isBoard,
      canManageMembers,
      canManageFinance,
      canManageActivities,
      canManageTasks,
      canManageSettings,
      canAccessGoogleIntegrations,
      roleDisplayName,
    };
  }, [activeRole]);
}

export default useOrganizationRole;
