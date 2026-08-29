import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardTerms,
  fetchDashboardStats,
  fetchUpcomingActivities,
  fetchUpcomingTasks,
  fetchOverdueTasks,
  fetchDashboardChartData,
} from '../services/dashboard.service';
import type {
  DashboardTermOption,
  DashboardStats,
  UpcomingActivityItem,
  UpcomingTaskItem,
  OverdueTaskItem,
  DashboardChartData,
} from '../types/dashboard.types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  terms: (orgId?: string) => [...dashboardKeys.all, 'terms', orgId] as const,
  stats: (orgId?: string, termId?: string) =>
    [...dashboardKeys.all, 'stats', orgId, termId] as const,
  upcomingActivities: (orgId?: string, termId?: string) =>
    [...dashboardKeys.all, 'upcoming-activities', orgId, termId] as const,
  upcomingTasks: (orgId?: string, termId?: string) =>
    [...dashboardKeys.all, 'upcoming-tasks', orgId, termId] as const,
  overdueTasks: (orgId?: string, termId?: string) =>
    [...dashboardKeys.all, 'overdue-tasks', orgId, termId] as const,
  charts: (orgId?: string, termId?: string) =>
    [...dashboardKeys.all, 'charts', orgId, termId] as const,
};

/**
 * Hook to fetch terms for active organization in dashboard
 */
export function useDashboardTerms(organizationId?: string) {
  return useQuery<DashboardTermOption[]>({
    queryKey: dashboardKeys.terms(organizationId),
    enabled: Boolean(organizationId),
    queryFn: () => fetchDashboardTerms(organizationId!),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch core aggregated KPIs (Members, Activities, Tasks, Finance)
 */
export function useDashboardStats(organizationId?: string, termId?: string) {
  return useQuery<DashboardStats>({
    queryKey: dashboardKeys.stats(organizationId, termId),
    enabled: Boolean(organizationId),
    queryFn: () => fetchDashboardStats(organizationId!, termId),
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to fetch top upcoming activities
 */
export function useUpcomingActivities(organizationId?: string, termId?: string, limit = 5) {
  return useQuery<UpcomingActivityItem[]>({
    queryKey: dashboardKeys.upcomingActivities(organizationId, termId),
    enabled: Boolean(organizationId),
    queryFn: () => fetchUpcomingActivities(organizationId!, termId, limit),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch top upcoming & priority tasks
 */
export function useUpcomingTasks(organizationId?: string, termId?: string, limit = 5) {
  return useQuery<UpcomingTaskItem[]>({
    queryKey: dashboardKeys.upcomingTasks(organizationId, termId),
    enabled: Boolean(organizationId),
    queryFn: () => fetchUpcomingTasks(organizationId!, termId, limit),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch overdue tasks
 */
export function useOverdueTasks(organizationId?: string, termId?: string, limit = 5) {
  return useQuery<OverdueTaskItem[]>({
    queryKey: dashboardKeys.overdueTasks(organizationId, termId),
    enabled: Boolean(organizationId),
    queryFn: () => fetchOverdueTasks(organizationId!, termId, limit),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch chart & analytics distribution data
 */
export function useDashboardCharts(organizationId?: string, termId?: string) {
  return useQuery<DashboardChartData>({
    queryKey: dashboardKeys.charts(organizationId, termId),
    enabled: Boolean(organizationId),
    queryFn: () => fetchDashboardChartData(organizationId!, termId),
    staleTime: 1000 * 60, // 1 minute
  });
}
