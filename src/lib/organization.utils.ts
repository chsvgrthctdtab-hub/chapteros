import type { OrganizationType, Organization } from '@/types';

/**
 * Ánh xạ loại hình đơn vị sang chữ viết tắt chuẩn:
 * - chi_hoi -> "CH"
 * - lien_chi / lien_chi_hoi -> "LCH"
 * - doi -> "ĐỘI"
 * - clb -> "CLB"
 * Các trường hợp khác trả về chuỗi rỗng ""
 */
export function getOrgTypeShort(type?: string | null): string {
  if (!type) return '';
  const normalized = type.trim().toLowerCase();
  switch (normalized) {
    case 'chi_hoi':
      return 'CH';
    case 'lien_chi':
    case 'lien_chi_hoi':
      return 'LCH';
    case 'doi':
      return 'ĐỘI';
    case 'clb':
      return 'CLB';
    default:
      return '';
  }
}

/**
 * Alias cho getOrgTypeShort
 */
export const formatOrgTypeShort = getOrgTypeShort;
export const getOrgTypeAbbr = getOrgTypeShort;

/**
 * Lấy tên đầy đủ tiếng Việt của loại hình đơn vị
 */
export function getOrgTypeFullName(type?: string | null): string {
  if (!type) return 'Đơn vị';
  const normalized = type.trim().toLowerCase();
  switch (normalized) {
    case 'chi_hoi':
      return 'Chi hội';
    case 'lien_chi':
    case 'lien_chi_hoi':
      return 'Liên chi hội';
    case 'doi':
      return 'Đội';
    case 'clb':
      return 'Câu lạc bộ';
    default:
      return 'Đơn vị';
  }
}

/**
 * Tạo mã định danh ngẫu nhiên chuẩn cho đơn vị: [PREFIX]-[RANDOM_5]
 * Ví dụ: "CH-A8K92", "LCH-X7B21", "CLB-M3P9Q", "DOI-N2R4T"
 */
export function generateOrganizationCode(type?: string | null, customSuffix?: string): string {
  const prefix = getOrgTypeShort(type) || 'CH';
  // Chuyển ký tự có dấu như 'ĐỘI' thành 'DOI' khi làm code
  const codePrefix = prefix === 'ĐỘI' ? 'DOI' : prefix;
  
  if (customSuffix?.trim()) {
    const cleanSuffix = customSuffix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `${codePrefix}-${cleanSuffix}`;
  }

  // Tạo chuỗi 5 ký tự ngẫu nhiên bao gồm chữ cái in hoa và chữ số (loại bỏ O, 0, I, 1 dễ gây nhầm lẫn)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomCode = '';
  for (let i = 0; i < 5; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${codePrefix}-${randomCode}`;
}

export interface OrganizationTypeConfig {
  type: OrganizationType;
  label: string;
  shortLabel: string;
  badgeClass: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBg: string;
  iconText: string;
  description: string;
}

export const ORGANIZATION_TYPE_CONFIG: Record<string, OrganizationTypeConfig> = {
  lien_chi: {
    type: 'lien_chi_hoi' as OrganizationType,
    label: 'Liên chi hội',
    shortLabel: 'LCH',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    iconBg: 'bg-indigo-600',
    iconText: 'text-white',
    description: 'Đơn vị cấp Liên chi hội sinh viên quản lý các Chi hội trực thuộc',
  },
  lien_chi_hoi: {
    type: 'lien_chi_hoi',
    label: 'Liên chi hội',
    shortLabel: 'LCH',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    iconBg: 'bg-indigo-600',
    iconText: 'text-white',
    description: 'Đơn vị cấp Liên chi hội sinh viên quản lý các Chi hội trực thuộc',
  },
  chi_hoi: {
    type: 'chi_hoi',
    label: 'Chi hội',
    shortLabel: 'CH',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    iconBg: 'bg-blue-600',
    iconText: 'text-white',
    description: 'Chi hội sinh viên lớp / khóa / chuyên ngành',
  },
  clb: {
    type: 'clb',
    label: 'Câu lạc bộ',
    shortLabel: 'CLB',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    iconBg: 'bg-purple-600',
    iconText: 'text-white',
    description: 'Câu lạc bộ học thuật / kỹ năng / sở thích',
  },
  doi: {
    type: 'doi',
    label: 'Đội',
    shortLabel: 'ĐỘI',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    iconBg: 'bg-emerald-600',
    iconText: 'text-white',
    description: 'Đội hình chuyên trách / công tác xã hội / xung kích',
  },
};

export const ORGANIZATION_TYPES: OrganizationType[] = [
  'chi_hoi',
  'lien_chi_hoi',
  'clb',
  'doi',
];

export const ORGANIZATION_TYPE_OPTIONS: { value: string; label: string; shortLabel: string; description: string }[] = [
  {
    value: 'chi_hoi',
    label: 'Chi hội (CH)',
    shortLabel: 'CH',
    description: 'Chi hội sinh viên lớp / khóa / chuyên ngành',
  },
  {
    value: 'lien_chi',
    label: 'Liên chi hội (LCH)',
    shortLabel: 'LCH',
    description: 'Quản lý các Chi hội trực thuộc cấp Khoa/Viện',
  },
  {
    value: 'clb',
    label: 'Câu lạc bộ (CLB)',
    shortLabel: 'CLB',
    description: 'CLB học thuật / phong trào / kỹ năng',
  },
  {
    value: 'doi',
    label: 'Đội (ĐỘI)',
    shortLabel: 'ĐỘI',
    description: 'Đội hình tình nguyện / xung kích / chuyên môn',
  },
];

/**
 * Lấy nhãn tiếng Việt chuẩn xác theo loại hình đơn vị
 */
export function getOrgTypeLabel(type?: OrganizationType | string | null): string {
  if (!type) return 'Đơn vị';
  return getOrgTypeFullName(type);
}

/**
 * Lấy viết tắt chuẩn xác theo loại hình đơn vị
 */
export function getOrgTypeShortLabel(type?: OrganizationType | string | null): string {
  return getOrgTypeShort(type);
}

/**
 * Lấy CSS classes cho Badge hiển thị loại hình đơn vị
 */
export function getOrgTypeBadgeClass(type?: OrganizationType | string | null): string {
  if (!type) return 'bg-slate-50 text-slate-700 border-slate-200';
  const normalized = type.trim().toLowerCase();
  const config = ORGANIZATION_TYPE_CONFIG[normalized];
  return config ? config.badgeClass : 'bg-slate-50 text-slate-700 border-slate-200';
}

/**
 * Format tên hiển thị đơn vị kèm loại hình và đơn vị trực thuộc (phân cấp)
 * Ví dụ: "[Chi hội] K47 CNTT 01 (Trực thuộc: LCH CNTT)"
 */
export function formatOrgHierarchyLabel(
  org?: {
    name: string;
    code?: string;
    type?: OrganizationType | string | null;
    parent?: { name: string; type?: OrganizationType | string | null } | null;
    parentName?: string | null;
  } | null
): string {
  if (!org) return '';
  const typeLabel = getOrgTypeLabel(org.type);
  const parentName = org.parent?.name || org.parentName;
  if (parentName) {
    return `[${typeLabel}] ${org.name} (Trực thuộc: ${parentName})`;
  }
  return `[${typeLabel}] ${org.name}`;
}

/**
 * Format nhãn chi tiết cho Option trong Select / Dropdown
 */
export function formatOrgSelectOption(
  org: Organization | { id: string; name: string; code: string; type?: OrganizationType; parent?: { name: string } | null; parentName?: string | null },
  suffixRole?: string
): { mainLabel: string; typeBadge: string; parentText?: string } {
  const typeConfig = ORGANIZATION_TYPE_CONFIG[(org.type as OrganizationType) || 'chi_hoi'] || ORGANIZATION_TYPE_CONFIG.chi_hoi;
  const parentName = org.parent?.name || (org as any).parentName || (org as any).parentOrgName;
  
  return {
    mainLabel: suffixRole ? `${org.name} (${suffixRole})` : org.name,
    typeBadge: typeConfig.shortLabel,
    parentText: parentName ? `Trực thuộc: ${parentName}` : undefined,
  };
}
