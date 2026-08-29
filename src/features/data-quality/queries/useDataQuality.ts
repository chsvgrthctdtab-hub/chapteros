import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { dataQualityService } from '@/services/data-quality.service';
import type {
  DataQualityCategory,
  DataQualityFilters,
  DataQualityIssue,
  DataQualityOverview,
  DataQualitySummary,
} from '../types';

export const dataQualityKeys = {
  all: (orgId: string) => ['data-quality', orgId] as const,
  overview: (orgId: string, role?: string | null) =>
    ['data-quality', orgId, 'overview', role || 'anonymous'] as const,
  summary: (orgId: string, role?: string | null) =>
    ['data-quality', orgId, 'summary', role || 'anonymous'] as const,
  issues: (orgId: string, filters?: DataQualityFilters, role?: string | null) =>
    ['data-quality', orgId, 'issues', filters || {}, role || 'anonymous'] as const,
  category: (orgId: string, category: DataQualityCategory, role?: string | null) =>
    ['data-quality', orgId, 'category', category, role || 'anonymous'] as const,
};

/**
 * Hook to fetch Data Quality Overview for the current organization
 */
export function useDataQualityOverview(
  orgIdOverride?: string,
  options?: Partial<UseQueryOptions<DataQualityOverview, Error>>
) {
  const { currentOrganization, currentRole } = useCurrentOrganization();
  const organizationId = orgIdOverride || currentOrganization?.id || '';

  return useQuery({
    queryKey: dataQualityKeys.overview(organizationId, currentRole),
    queryFn: () => dataQualityService.getOverview(organizationId, currentRole),
    enabled: Boolean(organizationId),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

/**
 * Hook to fetch Data Quality Summary for the current organization
 */
export function useDataQualitySummary(
  orgIdOverride?: string,
  options?: Partial<UseQueryOptions<DataQualitySummary, Error>>
) {
  const { currentOrganization, currentRole } = useCurrentOrganization();
  const organizationId = orgIdOverride || currentOrganization?.id || '';

  return useQuery({
    queryKey: dataQualityKeys.summary(organizationId, currentRole),
    queryFn: () => dataQualityService.getSummary(organizationId, currentRole),
    enabled: Boolean(organizationId),
    staleTime: 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch filtered Data Quality Issues
 */
export function useDataQualityIssues(
  filters: DataQualityFilters = {},
  orgIdOverride?: string,
  options?: Partial<UseQueryOptions<DataQualityIssue[], Error>>
) {
  const { currentOrganization, currentRole } = useCurrentOrganization();
  const organizationId = orgIdOverride || currentOrganization?.id || '';

  return useQuery({
    queryKey: dataQualityKeys.issues(organizationId, filters, currentRole),
    queryFn: () => dataQualityService.getIssues(organizationId, filters, currentRole),
    enabled: Boolean(organizationId),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Hook to fetch Data Quality Issues for a single category
 */
export function useDataQualityCategory(
  category: DataQualityCategory,
  orgIdOverride?: string,
  options?: Partial<UseQueryOptions<DataQualityIssue[], Error>>
) {
  const { currentOrganization, currentRole } = useCurrentOrganization();
  const organizationId = orgIdOverride || currentOrganization?.id || '';

  return useQuery({
    queryKey: dataQualityKeys.category(organizationId, category, currentRole),
    queryFn: () => dataQualityService.checkCategory(organizationId, category, currentRole),
    enabled: Boolean(organizationId && category),
    staleTime: 30 * 1000,
    ...options,
  });
}
