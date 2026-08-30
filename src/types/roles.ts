import type { OrganizationRole } from './database.types';
import type { Language } from '@/lib/i18n';

export type { OrganizationRole };

export interface RoleDefinition {
  key: OrganizationRole;
  label: string;
  shortLabel: string;
  description: string;
  level: number; // 1 (highest) to 6 (standard)
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  colorClasses: {
    bg: string;
    text: string;
    border: string;
  };
}

export const ROLE_LABELS: Record<Language, Record<OrganizationRole, string>> = {
  vi: {
    admin: 'Quản trị viên Chi hội',
    leader: 'Chi hội trưởng',
    deputy: 'Chi hội phó',
    treasurer: 'Thủ quỹ',
    secretary: 'Thư ký / Ủy viên',
  },
  en: {
    admin: 'Chapter Administrator',
    leader: 'Chapter Leader',
    deputy: 'Deputy Leader',
    treasurer: 'Treasurer',
    secretary: 'Secretary / Committee Member',
  },
};

export const ROLE_SHORT_LABELS: Record<Language, Record<OrganizationRole, string>> = {
  vi: {
    admin: 'Admin',
    leader: 'Trưởng',
    deputy: 'Phó',
    treasurer: 'Thủ quỹ',
    secretary: 'Thư ký',
  },
  en: {
    admin: 'Admin',
    leader: 'Leader',
    deputy: 'Deputy',
    treasurer: 'Treasurer',
    secretary: 'Secretary',
  },
};

export const ROLES: Record<OrganizationRole, RoleDefinition> = {
  admin: {
    key: 'admin',
    label: 'Quản trị viên Chi hội',
    shortLabel: 'Admin',
    description: 'Toàn quyền cấu hình Chi hội, phân quyền thành viên và quản lý hệ thống.',
    level: 1,
    badgeVariant: 'destructive',
    colorClasses: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
    },
  },
  leader: {
    key: 'leader',
    label: 'Chi hội trưởng',
    shortLabel: 'Trưởng',
    description: 'Điều hành chung các hoạt động, phê duyệt kế hoạch, nhân sự và tài chính của Đơn vị.',
    level: 2,
    badgeVariant: 'default',
    colorClasses: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
  },
  deputy: {
    key: 'deputy',
    label: 'Chi hội phó',
    shortLabel: 'Phó',
    description: 'Phụ trách chuyên môn, hoạt động phong trào và hỗ trợ điều hành Chi hội.',
    level: 3,
    badgeVariant: 'secondary',
    colorClasses: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
    },
  },
  treasurer: {
    key: 'treasurer',
    label: 'Thủ quỹ',
    shortLabel: 'Thủ quỹ',
    description: 'Quản lý thu chi, quỹ hội viên, chứng từ hóa đơn và báo cáo tài chính.',
    level: 4,
    badgeVariant: 'warning',
    colorClasses: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
  },
  secretary: {
    key: 'secretary',
    label: 'Thư ký / Ủy viên',
    shortLabel: 'Thư ký',
    description: 'Soạn thảo văn bản, quản lý hồ sơ tài liệu, nghị quyết và biên bản họp.',
    level: 4,
    badgeVariant: 'info',
    colorClasses: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-200',
    },
  },
};

/**
 * Check if the role belongs to organization administration (admin or leader)
 */
export function isOrgAdmin(role?: OrganizationRole | null): boolean {
  if (!role) return false;
  return role === 'admin' || role === 'leader';
}

/**
 * Check if the role belongs to Executive Board (Ban Chấp Hành)
 */
export function isOrgBoard(role?: OrganizationRole | null): boolean {
  if (!role) return false;
  return ['admin', 'leader', 'deputy', 'treasurer', 'secretary'].includes(role);
}

/**
 * Check if the role has financial management access
 */
export function isOrgTreasurer(role?: OrganizationRole | null): boolean {
  if (!role) return false;
  return ['admin', 'leader', 'treasurer'].includes(role);
}

/**
 * Check if user can create / edit regular finance transactions (All Executive Board members)
 */
export function canManageFinance(role?: OrganizationRole | null): boolean {
  return isOrgBoard(role);
}

/**
 * Check if user can approve or reject financial transactions (Admin or Leader)
 */
export function canApproveFinance(role?: OrganizationRole | null): boolean {
  return isOrgAdmin(role);
}

/**
 * Check if user can perform periodic closing and reopen periods (Admin or Leader)
 */
export function canCloseFinancePeriod(role?: OrganizationRole | null): boolean {
  return isOrgAdmin(role);
}

/**
 * Check if the role has document/administrative access
 */
export function isOrgSecretary(role?: OrganizationRole | null): boolean {
  if (!role) return false;
  return ['admin', 'leader', 'deputy', 'secretary'].includes(role);
}

/**
 * Check if the role has activity & attendance management access (Admin, Leader, Deputy, Secretary)
 * Treasurer role is focused on financial management and does not have default attendance management permission.
 */
export function canManageAttendance(role?: OrganizationRole | null): boolean {
  if (!role) return false;
  return ['admin', 'leader', 'deputy', 'secretary'].includes(role);
}

/**
 * Check if the role has activity management access
 */
export function canManageActivities(role?: OrganizationRole | null): boolean {
  if (!role) return false;
  return ['admin', 'leader', 'deputy', 'secretary'].includes(role);
}

/**
 * Generic check if user has any of the allowed roles
 */
export function hasRole(role: OrganizationRole | null | undefined, allowedRoles: OrganizationRole[]): boolean {
  if (!role) return false;
  return allowedRoles.includes(role);
}

/**
 * Permission check for managing organization profile and logo
 */
export function canManageOrganization(
  organizationId?: string | null,
  membership?: {
    organizationId?: string;
    organization_id?: string;
    role?: OrganizationRole | string;
    status?: string;
  } | null
): boolean {
  if (!organizationId || !membership) return false;
  const orgId = membership.organizationId || membership.organization_id;
  const role = membership.role as OrganizationRole;
  const status = membership.status;

  if (orgId && orgId !== organizationId) return false;
  if (status !== 'active') return false;

  return isOrgAdmin(role) || isOrgBoard(role) || role === 'admin' || role === 'leader';
}

/**
 * Dynamic role labels tailored to Organization Type (Chi hội, Liên chi hội, CLB, Đội nhóm, Đoàn khoa)
 */
export function getRoleLabel(
  role?: OrganizationRole | null,
  lang: Language = 'vi',
  orgType?: string | null
): string {
  if (!role) return lang === 'vi' ? 'Khách' : 'Guest';

  if (lang === 'vi') {
    const t = orgType?.trim().toLowerCase();
    if (t === 'clb') {
      const clbMap: Record<OrganizationRole, string> = {
        admin: 'Quản trị viên CLB',
        leader: 'Chủ nhiệm CLB',
        deputy: 'Phó Chủ nhiệm CLB',
        treasurer: 'Trưởng ban Tài chính / Thủ quỹ',
        secretary: 'Ủy viên Ban Chủ nhiệm / Thư ký',
      };
      if (clbMap[role]) return clbMap[role];
    } else if (t === 'doi' || t === 'doi_nhom') {
      const doiMap: Record<OrganizationRole, string> = {
        admin: 'Quản trị viên Đội',
        leader: 'Đội trưởng',
        deputy: 'Đội phó',
        treasurer: 'Thủ quỹ Đội',
        secretary: 'Ủy viên Ban Điều hành / Thư ký',
      };
      if (doiMap[role]) return doiMap[role];
    } else if (t === 'lien_chi' || t === 'lien_chi_hoi' || t === 'lienchi' || t === 'lch' || t === 'lien_chi_doan') {
      const lchMap: Record<OrganizationRole, string> = {
        admin: 'Quản trị viên Liên Chi hội',
        leader: 'Liên Chi hội trưởng',
        deputy: 'Liên Chi hội phó',
        treasurer: 'Ủy viên BCH / Thủ quỹ',
        secretary: 'Ủy viên Ban Chấp Hành / Thư ký',
      };
      if (lchMap[role]) return lchMap[role];
    } else if (t === 'doan_khoa') {
      const doanMap: Record<OrganizationRole, string> = {
        admin: 'Quản trị viên',
        leader: 'Bí thư Đoàn',
        deputy: 'Phó Bí thư Đoàn',
        treasurer: 'Ủy viên BTV / Thủ quỹ',
        secretary: 'Ủy viên Ban Chấp Hành',
      };
      if (doanMap[role]) return doanMap[role];
    } else if (!t || t === 'chi_hoi' || t === 'chihoi' || t === 'ch') {
      const chMap: Record<OrganizationRole, string> = {
        admin: 'Quản trị viên Chi hội',
        leader: 'Chi hội trưởng',
        deputy: 'Chi hội phó',
        treasurer: 'Thủ quỹ',
        secretary: 'Thư ký / Ủy viên BCH',
      };
      if (chMap[role]) return chMap[role];
    }
  }

  return ROLE_LABELS[lang]?.[role] || ROLES[role]?.label || role;
}

/**
 * Get short label for a role tailored to Organization Type
 */
export function getRoleShortLabel(
  role?: OrganizationRole | null,
  lang: Language = 'vi',
  orgType?: string | null
): string {
  if (!role) return lang === 'vi' ? 'Khách' : 'Guest';

  if (lang === 'vi') {
    const t = orgType?.trim().toLowerCase();
    if (t === 'clb' || t === 'cau_lac_bo' || t === 'club') {
      const clbMap: Record<OrganizationRole, string> = {
        admin: 'Admin',
        leader: 'Chủ nhiệm',
        deputy: 'Phó Chủ nhiệm',
        treasurer: 'Thủ quỹ',
        secretary: 'Ủy viên BCN',
      };
      if (clbMap[role]) return clbMap[role];
    } else if (t === 'doi' || t === 'doi_nhom' || t === 'team') {
      const doiMap: Record<OrganizationRole, string> = {
        admin: 'Admin',
        leader: 'Đội trưởng',
        deputy: 'Đội phó',
        treasurer: 'Thủ quỹ',
        secretary: 'Ủy viên BĐH',
      };
      if (doiMap[role]) return doiMap[role];
    } else if (t === 'lien_chi' || t === 'lien_chi_hoi' || t === 'lienchi' || t === 'lch' || t === 'lien_chi_doan') {
      const lchMap: Record<OrganizationRole, string> = {
        admin: 'Admin',
        leader: 'Liên Chi trưởng',
        deputy: 'Liên Chi phó',
        treasurer: 'Thủ quỹ',
        secretary: 'Ủy viên BCH',
      };
      if (lchMap[role]) return lchMap[role];
    } else if (t === 'doan_khoa') {
      const doanMap: Record<OrganizationRole, string> = {
        admin: 'Admin',
        leader: 'Bí thư',
        deputy: 'Phó Bí thư',
        treasurer: 'Thủ quỹ',
        secretary: 'Ủy viên BCH',
      };
      if (doanMap[role]) return doanMap[role];
    } else if (!t || t === 'chi_hoi' || t === 'chihoi' || t === 'ch') {
      const chMap: Record<OrganizationRole, string> = {
        admin: 'Admin',
        leader: 'Chi hội trưởng',
        deputy: 'Chi hội phó',
        treasurer: 'Thủ quỹ',
        secretary: 'Thư ký',
      };
      if (chMap[role]) return chMap[role];
    }
  }

  return ROLE_SHORT_LABELS[lang]?.[role] || ROLES[role]?.shortLabel || role;
}

/**
 * Get Board Title tailored to Organization Type
 * Example:
 * - chi_hoi -> "Ban Chấp Hành Chi hội"
 * - clb -> "Ban Chủ nhiệm CLB"
 * - doi -> "Ban Điều hành Đội"
 * - lien_chi_hoi -> "Ban Chấp Hành Liên Chi hội"
 */
export function getOrgBoardTitle(orgType?: string | null, lang: Language = 'vi'): string {
  if (lang === 'en') {
    const t = orgType?.trim().toLowerCase();
    if (t === 'clb' || t === 'cau_lac_bo' || t === 'club') return 'Club Executive Board';
    if (t === 'doi' || t === 'doi_nhom' || t === 'team') return 'Team Management Board';
    if (t === 'lien_chi' || t === 'lien_chi_hoi' || t === 'lienchi' || t === 'lch') return 'Union Chapter Executive Board';
    return 'Executive Board';
  }
  const t = orgType?.trim().toLowerCase();
  switch (t) {
    case 'clb':
    case 'cau_lac_bo':
    case 'club':
      return 'Ban Chủ nhiệm CLB';
    case 'doi':
    case 'doi_nhom':
    case 'team':
      return 'Ban Điều hành Đội';
    case 'lien_chi':
    case 'lien_chi_hoi':
    case 'lienchi':
    case 'lch':
    case 'lien_chi_doan':
      return 'Ban Chấp Hành Liên Chi hội';
    case 'doan_khoa':
      return 'Ban Chấp Hành Đoàn Khoa';
    case 'chi_hoi':
    default:
      return 'Ban Chấp Hành Đơn vị';
  }
}

/**
 * Get Member noun tailored to Organization Type
 * Example:
 * - chi_hoi / lien_chi_hoi -> "Hội viên"
 * - clb -> "Thành viên CLB"
 * - doi -> "Đội viên"
 * - doan_khoa -> "Đoàn viên"
 */
export function getOrgMemberNoun(orgType?: string | null, lang: Language = 'vi'): string {
  if (lang === 'en') return 'Members';
  const t = orgType?.trim().toLowerCase();
  switch (t) {
    case 'clb':
      return 'Thành viên CLB';
    case 'doi':
    case 'doi_nhom':
      return 'Đội viên';
    case 'doan_khoa':
      return 'Đoàn viên';
    case 'lien_chi':
    case 'lien_chi_hoi':
    case 'chi_hoi':
    default:
      return 'Hội viên';
  }
}
