import type { OrganizationRole } from '@/types/database.types';

export type DataQualityCategory =
  | 'members'
  | 'terms'
  | 'activities'
  | 'tasks'
  | 'finance'
  | 'documents'
  | 'system';

export type DataQualitySeverity = 'critical' | 'warning' | 'info';

export type DataQualityEntityType =
  | 'member'
  | 'term'
  | 'activity'
  | 'task'
  | 'finance'
  | 'document'
  | 'system';

export interface DataQualityIssue {
  id: string;
  organizationId: string;
  category: DataQualityCategory;
  severity: DataQualitySeverity;
  code: string;
  title: string;
  description: string;
  entityType: DataQualityEntityType;
  entityId?: string | null;
  entityName?: string | null;
  detectedAt: string;
  actionLabel?: string;
  actionRoute?: string;
  metadata?: Record<string, unknown>;
}

export interface DataQualityFilters {
  category?: DataQualityCategory | 'all';
  severity?: DataQualitySeverity | 'all';
  code?: string;
  search?: string;
  entityType?: string;
}

export interface CategoryQualityBreakdown {
  total: number;
  critical: number;
  warning: number;
  info: number;
}

export interface DataQualitySummary {
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  healthyCount: number;
  qualityScore: number | null;
  byCategory: Record<DataQualityCategory, CategoryQualityBreakdown>;
}

export interface DataQualityOverview {
  summary: DataQualitySummary;
  recentIssues: DataQualityIssue[];
  evaluatedAt: string;
  organizationId: string;
}

export interface DataQualityChecker {
  category: DataQualityCategory;
  name: string;
  description: string;
  check(organizationId: string): Promise<DataQualityIssue[]>;
}

export interface DataQualityRolePermissions {
  canAccessAll: boolean;
  allowedCategories: DataQualityCategory[];
}
