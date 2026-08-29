import { useQuery } from '@tanstack/react-query';
import { googleIntegrationService } from '../services/google-integration.service';

export const googleIntegrationKeys = {
  all: ['google-integration'] as const,
  overview: (orgId: string | null, userId: string | null) =>
    [...googleIntegrationKeys.all, 'overview', orgId, userId] as const,
  userConnection: (userId: string | null) =>
    [...googleIntegrationKeys.all, 'user', userId] as const,
  orgConnection: (orgId: string | null) =>
    [...googleIntegrationKeys.all, 'org', orgId] as const,
  metrics: (orgId: string | null) =>
    [...googleIntegrationKeys.all, 'metrics', orgId] as const,
  syncActivities: (orgId: string | null) =>
    [...googleIntegrationKeys.all, 'syncActivities', orgId] as const,
};

export function useGoogleIntegrationOverview(orgId: string | null, userId: string | null) {
  return useQuery({
    queryKey: googleIntegrationKeys.overview(orgId, userId),
    queryFn: () => googleIntegrationService.getOverview(orgId, userId),
    staleTime: 1000 * 30, // 30s
    enabled: true,
  });
}

export function useUserGoogleConnection(userId: string | null) {
  return useQuery({
    queryKey: googleIntegrationKeys.userConnection(userId),
    queryFn: () => (userId ? googleIntegrationService.getUserConnection(userId) : null),
    enabled: Boolean(userId),
    staleTime: 1000 * 60,
  });
}

export function useOrgGoogleConnection(orgId: string | null) {
  return useQuery({
    queryKey: googleIntegrationKeys.orgConnection(orgId),
    queryFn: () => (orgId ? googleIntegrationService.getOrgConnection(orgId) : null),
    enabled: Boolean(orgId),
    staleTime: 1000 * 60,
  });
}

export function useGoogleServiceMetrics(orgId: string | null) {
  return useQuery({
    queryKey: googleIntegrationKeys.metrics(orgId),
    queryFn: () => googleIntegrationService.getServiceMetrics(orgId),
    enabled: Boolean(orgId),
    staleTime: 1000 * 30,
  });
}

export function useRecentSyncActivities(orgId: string | null, limit = 10) {
  return useQuery({
    queryKey: googleIntegrationKeys.syncActivities(orgId),
    queryFn: () => googleIntegrationService.getRecentSyncActivities(orgId, limit),
    enabled: Boolean(orgId),
    staleTime: 1000 * 20,
  });
}

