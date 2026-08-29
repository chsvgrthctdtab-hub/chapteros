import { useMutation, useQueryClient } from '@tanstack/react-query';
import { googleIntegrationService } from '../services/google-integration.service';
import type { ConnectGooglePayload, DisconnectGooglePayload, VerifyGooglePayload } from '../types/google.types';
import { googleIntegrationKeys } from '../queries/google.queries';

export function useConnectGoogleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConnectGooglePayload) => googleIntegrationService.connectGoogle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleIntegrationKeys.all });
    },
  });
}

export function useDisconnectGoogleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DisconnectGooglePayload) =>
      googleIntegrationService.disconnectGoogle(
        payload.connectionId,
        payload.connectionType,
        payload.organizationId,
        payload.userId
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleIntegrationKeys.all });
    },
  });
}

export function useVerifyGoogleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VerifyGooglePayload) =>
      googleIntegrationService.verifyConnection(payload.connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleIntegrationKeys.all });
    },
  });
}
