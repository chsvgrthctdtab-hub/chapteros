import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { OrganizationRole } from '@/types/database.types';
import {
  ALL_CHECKERS,
  QUALITY_CHECKERS,
} from '@/features/data-quality/checkers';
import type {
  DataQualityCategory,
  DataQualityFilters,
  DataQualityIssue,
  DataQualityOverview,
  DataQualitySeverity,
  DataQualitySummary,
  CategoryQualityBreakdown,
} from '@/features/data-quality/types';

const SEVERITY_WEIGHTS: Record<DataQualitySeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

const CATEGORIES: DataQualityCategory[] = [
  'members',
  'terms',
  'activities',
  'tasks',
  'finance',
  'documents',
  'system',
];

/**
 * Check if a role has permission to access data quality inspection for specific categories
 */
export function getAccessibleQualityCategories(
  role?: OrganizationRole | null
): DataQualityCategory[] {
  if (!role) return [];

  const normalized = role.toLowerCase();
  if (['admin', 'leader', 'deputy'].includes(normalized)) {
    return ['members', 'terms', 'activities', 'tasks', 'finance', 'documents', 'system'];
  }

  if (normalized === 'secretary') {
    return ['members', 'terms', 'activities', 'tasks', 'documents', 'system'];
  }

  if (normalized === 'treasurer') {
    return ['finance', 'terms', 'system'];
  }

  return [];
}

/**
 * Validate that the current actor role can inspect quality issues for the given category
 */
export function canAccessQualityCategory(
  role?: OrganizationRole | null,
  category?: DataQualityCategory
): boolean {
  if (!role) return false;
  const allowed = getAccessibleQualityCategories(role);
  if (!category || category === 'system') return allowed.length > 0;
  return allowed.includes(category);
}

/**
 * Sort data quality issues deterministically:
 * 1. Severity: critical -> warning -> info
 * 2. DetectedAt: newest first
 * 3. Category
 */
export function sortDataQualityIssues(issues: DataQualityIssue[]): DataQualityIssue[] {
  return [...issues].sort((a, b) => {
    const weightA = SEVERITY_WEIGHTS[a.severity] || 0;
    const weightB = SEVERITY_WEIGHTS[b.severity] || 0;

    if (weightA !== weightB) {
      return weightB - weightA; // higher severity first
    }

    const dateA = new Date(a.detectedAt).getTime();
    const dateB = new Date(b.detectedAt).getTime();
    if (dateA !== dateB) {
      return dateB - dateA; // newer first
    }

    return a.category.localeCompare(b.category);
  });
}

/**
 * Deterministic quality score calculation:
 * Returns integer 0..100 based on weighted issue severity deductions
 */
export function calculateQualityScore(summary: {
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  totalEvaluated?: number;
}): number {
  const penalty =
    summary.criticalCount * 12 +
    summary.warningCount * 4 +
    summary.infoCount * 1;

  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}

export const dataQualityService = {
  /**
   * Check quality for a single category
   */
  async checkCategory(
    organizationId: string,
    category: DataQualityCategory,
    actorRole?: OrganizationRole | null
  ): Promise<DataQualityIssue[]> {
    if (!organizationId) return [];

    if (actorRole && !canAccessQualityCategory(actorRole, category)) {
      throw new Error(`Bạn không có quyền kiểm tra dữ liệu cho danh mục: ${category}.`);
    }

    const checker = QUALITY_CHECKERS[category];
    if (!checker) return [];

    const rawIssues = await checker.check(organizationId);
    return sortDataQualityIssues(rawIssues);
  },

  /**
   * Get all data quality issues for an organization with optional filtering and RBAC enforcement
   */
  async getIssues(
    organizationId: string,
    filters: DataQualityFilters = {},
    actorRole?: OrganizationRole | null
  ): Promise<DataQualityIssue[]> {
    if (!organizationId) return [];

    // RBAC check
    if (actorRole && getAccessibleQualityCategories(actorRole).length === 0) {
      throw new Error('Bạn không có quyền truy cập dữ liệu kiểm định chất lượng.');
    }

    const allowedCategories = getAccessibleQualityCategories(actorRole);
    const targetCategory = filters.category && filters.category !== 'all' ? filters.category : null;

    if (targetCategory && actorRole && !allowedCategories.includes(targetCategory)) {
      throw new Error(`Bạn không có quyền truy cập dữ liệu cho danh mục: ${targetCategory}.`);
    }

    // Determine checkers to run
    const checkersToRun = ALL_CHECKERS.filter((checker) => {
      if (targetCategory && checker.category !== targetCategory) {
        return false;
      }
      if (actorRole && !allowedCategories.includes(checker.category)) {
        return false;
      }
      return true;
    });

    // Execute checkers in parallel (bounded batch of 6 domain checkers)
    const results = await Promise.all(
      checkersToRun.map(async (c) => {
        try {
          return await c.check(organizationId);
        } catch (err) {
          console.error(`[DataQualityService] Error running ${c.name}:`, err);
          return [];
        }
      })
    );

    let allIssues = results.flat();

    // Apply filters
    if (filters.severity && filters.severity !== 'all') {
      allIssues = allIssues.filter((i) => i.severity === filters.severity);
    }

    if (filters.code) {
      allIssues = allIssues.filter((i) => i.code === filters.code);
    }

    if (filters.entityType) {
      allIssues = allIssues.filter((i) => i.entityType === filters.entityType);
    }

    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      allIssues = allIssues.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          (i.entityName && i.entityName.toLowerCase().includes(q)) ||
          i.code.toLowerCase().includes(q)
      );
    }

    return sortDataQualityIssues(allIssues);
  },

  /**
   * Get aggregated summary and score for an organization
   */
  async getSummary(
    organizationId: string,
    actorRole?: OrganizationRole | null
  ): Promise<DataQualitySummary> {
    if (!organizationId) {
      return {
        totalIssues: 0,
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
        healthyCount: 0,
        qualityScore: 100,
        byCategory: {
          members: { total: 0, critical: 0, warning: 0, info: 0 },
          terms: { total: 0, critical: 0, warning: 0, info: 0 },
          activities: { total: 0, critical: 0, warning: 0, info: 0 },
          tasks: { total: 0, critical: 0, warning: 0, info: 0 },
          finance: { total: 0, critical: 0, warning: 0, info: 0 },
          documents: { total: 0, critical: 0, warning: 0, info: 0 },
          system: { total: 0, critical: 0, warning: 0, info: 0 },
        },
      };
    }

    const issues = await this.getIssues(organizationId, {}, actorRole);

    let criticalCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    const byCategory: Record<DataQualityCategory, CategoryQualityBreakdown> = {
      members: { total: 0, critical: 0, warning: 0, info: 0 },
      terms: { total: 0, critical: 0, warning: 0, info: 0 },
      activities: { total: 0, critical: 0, warning: 0, info: 0 },
      tasks: { total: 0, critical: 0, warning: 0, info: 0 },
      finance: { total: 0, critical: 0, warning: 0, info: 0 },
      documents: { total: 0, critical: 0, warning: 0, info: 0 },
      system: { total: 0, critical: 0, warning: 0, info: 0 },
    };

    for (const issue of issues) {
      if (issue.severity === 'critical') criticalCount++;
      else if (issue.severity === 'warning') warningCount++;
      else if (issue.severity === 'info') infoCount++;

      const catBreakdown = byCategory[issue.category];
      if (catBreakdown) {
        catBreakdown.total++;
        if (issue.severity === 'critical') catBreakdown.critical++;
        else if (issue.severity === 'warning') catBreakdown.warning++;
        else if (issue.severity === 'info') catBreakdown.info++;
      }
    }

    const totalIssues = issues.length;
    const qualityScore = calculateQualityScore({ criticalCount, warningCount, infoCount });

    // Count how many categories have 0 issues (healthy)
    const allowed = getAccessibleQualityCategories(actorRole);
    let healthyCount = 0;
    for (const cat of allowed) {
      if (cat !== 'system' && byCategory[cat]?.total === 0) {
        healthyCount++;
      }
    }

    return {
      totalIssues,
      criticalCount,
      warningCount,
      infoCount,
      healthyCount,
      qualityScore,
      byCategory,
    };
  },

  /**
   * Get high-level overview for dashboard / data quality landing
   */
  async getOverview(
    organizationId: string,
    actorRole?: OrganizationRole | null
  ): Promise<DataQualityOverview> {
    const summary = await this.getSummary(organizationId, actorRole);
    const allIssues = await this.getIssues(organizationId, {}, actorRole);

    // Pick top 10 most critical/urgent issues
    const recentIssues = allIssues.slice(0, 10);

    return {
      summary,
      recentIssues,
      evaluatedAt: new Date().toISOString(),
      organizationId,
    };
  },
};
