import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import type { NotificationState } from '../types/notification.types';

export const notificationKeys = {
  all: ['notifications'] as const,
  userOrg: (orgId?: string, userId?: string) =>
    ['notifications', orgId, userId] as const,
};

export function useNotifications(organizationId?: string, userId?: string) {
  return useQuery<NotificationState>({
    queryKey: notificationKeys.userOrg(organizationId, userId),
    queryFn: () => notificationService.getNotifications(organizationId!, userId!),
    enabled: Boolean(organizationId && userId),
    staleTime: 60 * 1000,
    refetchInterval: 120 * 1000, // Background refresh every 2 mins
    refetchIntervalInBackground: false,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      userId,
      notificationKey,
    }: {
      organizationId: string;
      userId: string;
      notificationKey: string;
    }) => notificationService.markRead(organizationId, userId, notificationKey),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.userOrg(variables.organizationId, variables.userId),
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      userId,
      notificationKeys,
    }: {
      organizationId: string;
      userId: string;
      notificationKeys: string[];
    }) => notificationService.markAllRead(organizationId, userId, notificationKeys),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.userOrg(variables.organizationId, variables.userId),
      });
    },
  });
}
