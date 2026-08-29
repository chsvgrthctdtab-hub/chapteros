import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import type {
  ReportOverview,
  ReportFilterParams,
  MemberStatistics,
  TermStatistics,
  ActivityStatistics,
  TaskStatistics,
  FundStatistics,
} from '@/types/report';

export const reportKeys = {
  all: ['reports'] as const,
  overview: (orgId?: string, termId?: string) =>
    [...reportKeys.all, 'overview', orgId, termId] as const,
  members: (orgId?: string, termId?: string) =>
    [...reportKeys.all, 'members', orgId, termId] as const,
  terms: (orgId?: string) =>
    [...reportKeys.all, 'terms', orgId] as const,
  activities: (orgId?: string, params?: ReportFilterParams) =>
    [...reportKeys.all, 'activities', orgId, params] as const,
  tasks: (orgId?: string, params?: ReportFilterParams) =>
    [...reportKeys.all, 'tasks', orgId, params] as const,
  funds: (orgId?: string, params?: ReportFilterParams) =>
    [...reportKeys.all, 'funds', orgId, params] as const,
};

/**
 * Hook to fetch high-level overview metrics for an organization and optional term
 */
export function useReportOverview(organizationId?: string, termId?: string) {
  return useQuery<ReportOverview>({
    queryKey: reportKeys.overview(organizationId, termId),
    enabled: Boolean(organizationId),
    queryFn: () => reportService.getOverview(organizationId!, { termId }),
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to fetch member demographic and distribution statistics
 */
export function useReportMemberStats(organizationId?: string, termId?: string) {
  return useQuery<MemberStatistics>({
    queryKey: reportKeys.members(organizationId, termId),
    enabled: Boolean(organizationId),
    queryFn: () => reportService.getMemberStatistics(organizationId!, { termId }),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch term comparative statistics across all terms of the organization
 */
export function useReportTermStats(organizationId?: string) {
  return useQuery<TermStatistics>({
    queryKey: reportKeys.terms(organizationId),
    enabled: Boolean(organizationId),
    queryFn: () => reportService.getTermStatistics(organizationId!),
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to fetch activity and event metrics with optional term and date filters
 */
export function useReportActivityStats(
  organizationId?: string,
  params?: ReportFilterParams
) {
  return useQuery<ActivityStatistics>({
    queryKey: reportKeys.activities(organizationId, params),
    enabled: Boolean(organizationId),
    queryFn: () => reportService.getActivityStatistics(organizationId!, params),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch task progress, priority, and completion statistics
 */
export function useReportTaskStats(
  organizationId?: string,
  params?: ReportFilterParams
) {
  return useQuery<TaskStatistics>({
    queryKey: reportKeys.tasks(organizationId, params),
    enabled: Boolean(organizationId),
    queryFn: () => reportService.getTaskStatistics(organizationId!, params),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch fund and financial income/expense statistics
 */
export function useReportFundStats(
  organizationId?: string,
  params?: ReportFilterParams
) {
  return useQuery<FundStatistics>({
    queryKey: reportKeys.funds(organizationId, params),
    enabled: Boolean(organizationId),
    queryFn: () => reportService.getFundStatistics(organizationId!, params),
    staleTime: 1000 * 30,
  });
}
