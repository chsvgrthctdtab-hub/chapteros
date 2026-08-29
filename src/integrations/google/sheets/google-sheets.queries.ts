import { useQuery } from '@tanstack/react-query';
import { googleSheetsService } from './google-sheets.service';

export const googleSheetsKeys = {
  all: ['google-sheets'] as const,
  lists: () => [...googleSheetsKeys.all, 'list'] as const,
  list: (orgId: string | null | undefined) => [...googleSheetsKeys.lists(), orgId] as const,
};

export function useConnectedSpreadsheets(organizationId: string | null | undefined) {
  return useQuery({
    queryKey: googleSheetsKeys.list(organizationId),
    queryFn: async () => {
      if (!organizationId) return [];
      return googleSheetsService.getConnectedSpreadsheets(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}
