import { useMutation, useQueryClient } from '@tanstack/react-query';
import { googleSheetsService } from './google-sheets.service';
import { googleSheetsKeys } from './google-sheets.queries';
import type {
  CreateSheetConnectionPayload,
  UpdateSheetConnectionPayload,
  ExportModuleOptions,
  ImportExecutionOptions,
} from './google-sheets.types';

export function useLinkSpreadsheetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSheetConnectionPayload) => googleSheetsService.linkSpreadsheet(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: googleSheetsKeys.list(variables.organizationId) });
    },
  });
}

export function useUpdateSpreadsheetMutation(orgId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSheetConnectionPayload) => googleSheetsService.updateSpreadsheet(payload),
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: googleSheetsKeys.list(orgId) });
      }
    },
  });
}

export function useUnlinkSpreadsheetMutation(orgId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ connectionId }: { connectionId: string }) => {
      if (!orgId) throw new Error('Yêu cầu chọn tổ chức');
      return googleSheetsService.unlinkSpreadsheet(connectionId, orgId);
    },
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: googleSheetsKeys.list(orgId) });
      }
    },
  });
}

export function useExportModuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: ExportModuleOptions) => googleSheetsService.exportModuleData(options),
    onSuccess: (_, variables) => {
      if (variables.organizationId) {
        queryClient.invalidateQueries({ queryKey: googleSheetsKeys.list(variables.organizationId) });
      }
    },
  });
}

export function useExecuteImportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: ImportExecutionOptions) => googleSheetsService.executeImport(options),
    onSuccess: (_, variables) => {
      // Invalidate relevant domain queries depending on module
      if (variables.module === 'members') {
        queryClient.invalidateQueries({ queryKey: ['members'] });
      } else if (variables.module === 'activities') {
        queryClient.invalidateQueries({ queryKey: ['activities'] });
      } else if (variables.module === 'tasks') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } else if (variables.module === 'finance') {
        queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
        queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
      }
    },
  });
}
