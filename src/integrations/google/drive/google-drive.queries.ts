import { useQuery } from '@tanstack/react-query';
import { googleDriveService } from './google-drive.service';
import type { DriveSearchQuery } from './google-drive.types';

export const googleDriveKeys = {
  all: ['google-drive'] as const,
  search: (query: DriveSearchQuery) => [...googleDriveKeys.all, 'search', query] as const,
  fileMetadata: (urlOrId: string) => [...googleDriveKeys.all, 'metadata', urlOrId] as const,
  checkLinked: (orgId: string, fileId: string, context?: { activityId?: string | null; taskId?: string | null }) =>
    [...googleDriveKeys.all, 'check-linked', orgId, fileId, context] as const,
};

/**
 * Query to search or list Google Drive files
 */
export function useDriveSearch(query: DriveSearchQuery, enabled: boolean = true) {
  return useQuery({
    queryKey: googleDriveKeys.search(query),
    queryFn: () => googleDriveService.searchDriveFiles(query),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query to fetch metadata for a single Google Drive file or URL
 */
export function useDriveFileMetadata(urlOrId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: googleDriveKeys.fileMetadata(urlOrId || ''),
    queryFn: () => googleDriveService.fetchDriveFileMetadata(urlOrId || ''),
    enabled: Boolean(urlOrId && enabled),
    retry: false,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Query to verify if a file is already linked in the given context
 */
export function useCheckDriveFileLinked(
  organizationId: string,
  driveFileId?: string | null,
  context?: { activityId?: string | null; taskId?: string | null }
) {
  return useQuery({
    queryKey: googleDriveKeys.checkLinked(organizationId, driveFileId || '', context),
    queryFn: () => googleDriveService.checkDriveFileLinked(organizationId, driveFileId || '', context),
    enabled: Boolean(organizationId && driveFileId),
  });
}
