import type { DocumentCategory, DocumentAccessLevel, DocumentItem } from '@/features/documents/types/document.types';

export type GoogleDriveFileTypeGroup =
  | 'doc'
  | 'sheet'
  | 'slide'
  | 'form'
  | 'pdf'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'folder'
  | 'other';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number | null;
  iconLink?: string | null;
  thumbnailLink?: string | null;
  webViewLink: string;
  webContentLink?: string | null;
  createdTime?: string | null;
  modifiedTime?: string | null;
  owners?: Array<{
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
  }>;
  isFolder: boolean;
  fileTypeGroup: GoogleDriveFileTypeGroup;
  description?: string | null;
  sharedWithMe?: boolean;
}

export interface LinkDriveFilePayload {
  organizationId: string;
  termId?: string | null;
  activityId?: string | null;
  taskId?: string | null;
  memberId?: string | null;
  driveFileId: string;
  title: string;
  filePath?: string | null;
  driveUrl: string;
  mimeType?: string;
  fileSize?: number | null;
  fileIconUrl?: string | null;
  thumbnailUrl?: string | null;
  isFolder?: boolean;
  category: DocumentCategory;
  accessLevel: DocumentAccessLevel;
  linkedBy?: string | null;
  metadata?: Record<string, unknown>;
}

export interface UploadDriveFilePayload {
  file: File;
  organizationId: string;
  termId?: string | null;
  activityId?: string | null;
  taskId?: string | null;
  memberId?: string | null;
  title?: string;
  category: DocumentCategory;
  accessLevel: DocumentAccessLevel;
  userId?: string | null;
  folderId?: string | null;
  folderName?: string | null;
  userEmail?: string | null;
}

export interface CreateDriveFolderPayload {
  organizationId: string;
  folderName: string;
  parentFolderId?: string | null;
  driveUrl?: string | null;
  userId?: string | null;
  userEmail?: string | null;
}

export interface UnlinkDriveFilePayload {
  documentId: string;
  organizationId: string;
  activityId?: string | null;
  taskId?: string | null;
}

export interface DriveSearchQuery {
  query?: string;
  folderId?: string | null;
  mimeTypeGroup?: GoogleDriveFileTypeGroup | 'all';
  pageSize?: number;
  pageToken?: string | null;
}

export interface DriveSearchResponse {
  files: GoogleDriveFile[];
  nextPageToken?: string | null;
}

export interface LinkedDriveCheckResult {
  isLinked: boolean;
  existingDocument?: DocumentItem | null;
  contextMessage?: string;
}
