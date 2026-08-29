import { useMutation, useQueryClient } from '@tanstack/react-query';
import { googleDriveService } from './google-drive.service';
import { documentKeys } from '@/features/documents/queries/document.queries';
import { googleDriveKeys } from './google-drive.queries';
import type {
  LinkDriveFilePayload,
  UnlinkDriveFilePayload,
  UploadDriveFilePayload,
  CreateDriveFolderPayload,
} from './google-drive.types';

/**
 * Mutation to link a Google Drive file to an Activity, Task or Organization general docs
 */
export function useLinkDriveFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LinkDriveFilePayload) => {
      const result = await googleDriveService.linkDriveFile(payload);
      if (!result.success || !result.document) {
        throw new Error(result.error || 'Không thể liên kết tệp từ Google Drive.');
      }
      return result.document;
    },
    onSuccess: (_, variables) => {
      // Invalidate general documents cache
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: documentKeys.list(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.stats(variables.organizationId) });

      // Invalidate specific context cache
      if (variables.activityId) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.activityDocuments(variables.organizationId, variables.activityId),
        });
      }
      if (variables.taskId) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.taskDocuments(variables.organizationId, variables.taskId),
        });
      }

      // Invalidate Google Drive check keys
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.all });
    },
  });
}

/**
 * Mutation to upload a binary file directly to Google Drive
 */
export function useUploadDirectToDrive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UploadDriveFilePayload) => {
      const result = await googleDriveService.uploadDirectToDrive(payload);
      if (!result.success || !result.document) {
        throw new Error(result.error || 'Không thể tải tệp lên Google Drive.');
      }
      return result.document;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: documentKeys.list(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.stats(variables.organizationId) });

      if (variables.activityId) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.activityDocuments(variables.organizationId, variables.activityId),
        });
      }
      if (variables.taskId) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.taskDocuments(variables.organizationId, variables.taskId),
        });
      }

      queryClient.invalidateQueries({ queryKey: googleDriveKeys.all });
    },
  });
}

/**
 * Mutation to create a new folder in Google Drive and save in database
 */
export function useCreateDriveFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateDriveFolderPayload) => {
      const result = await googleDriveService.createDriveFolder(payload);
      if (!result.success || !result.document) {
        throw new Error(result.error || 'Không thể tạo thư mục.');
      }
      return result.document;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: documentKeys.list(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.stats(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: googleDriveKeys.all });
    },
  });
}

/**
 * Mutation to unlink a Google Drive document
 * (Deletes Chi Hội Manager metadata row, preserves actual Google Drive file)
 */
export function useUnlinkDriveFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      organizationId,
    }: UnlinkDriveFilePayload) => {
      const result = await googleDriveService.unlinkDriveFile(documentId, organizationId);
      if (!result.success) {
        throw new Error(result.error || 'Không thể gỡ liên kết tài liệu.');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: documentKeys.list(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.stats(variables.organizationId) });

      if (variables.activityId) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.activityDocuments(variables.organizationId, variables.activityId),
        });
      }
      if (variables.taskId) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.taskDocuments(variables.organizationId, variables.taskId),
        });
      }

      queryClient.invalidateQueries({ queryKey: googleDriveKeys.all });
    },
  });
}
