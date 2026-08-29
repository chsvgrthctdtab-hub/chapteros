import type { DocumentCategory, DocumentAccessLevel, DocumentSourceType, Profile } from '@/types';

export type { DocumentCategory, DocumentAccessLevel, DocumentSourceType };

export interface DocumentItem {
  id: string;
  organizationId: string;
  termId?: string | null;
  activityId?: string | null;
  memberId?: string | null;
  taskId?: string | null;
  title: string;
  category: DocumentCategory;
  sourceType: DocumentSourceType;
  filePath: string;
  driveFileId?: string | null;
  driveUrl?: string | null;
  fileIconUrl?: string | null;
  thumbnailUrl?: string | null;
  isFolder?: boolean;
  fileSize?: number | null;
  mimeType?: string | null;
  accessLevel: DocumentAccessLevel;
  uploadedBy?: string | null;
  linkedBy?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  uploader?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    email?: string;
  } | null;
  linker?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    email?: string;
  } | null;
  term?: {
    id: string;
    name: string;
    isCurrent: boolean;
  } | null;
  activity?: {
    id: string;
    title: string;
    code?: string | null;
  } | null;
  task?: {
    id: string;
    title: string;
  } | null;
  member?: {
    id: string;
    fullName: string;
    studentId: string;
  } | null;
}

export type DocumentSortBy = 'createdAt' | 'title' | 'fileSize';
export type SortOrder = 'asc' | 'desc';

export interface DocumentFilterParams {
  search?: string;
  sourceType?: 'all' | 'supabase' | 'google_drive';
  category?: DocumentCategory | 'all';
  accessLevel?: DocumentAccessLevel | 'all';
  termId?: string | 'all';
  activityId?: string | 'all';
  taskId?: string;
  memberId?: string;
  linkedStatus?: 'all' | 'linked' | 'unlinked';
  fileTypeGroup?: 'all' | 'pdf' | 'word' | 'excel' | 'powerpoint' | 'image' | 'archive' | 'text' | 'gdoc' | 'gsheet' | 'gslide' | 'gform' | 'folder';
  sortBy?: DocumentSortBy;
  sortOrder?: SortOrder;
}

export interface DocumentStats {
  totalCount: number;
  supabaseCount: number;
  googleDriveCount: number;
  totalSizeBytes: number;
  publicCount: number;
  internalCount: number;
  boardOnlyCount: number;
  adminOnlyCount: number;
  categoryCounts: Record<DocumentCategory, number>;
  fileTypeCounts: Record<string, number>;
  recentUploadsCount: number; // in last 30 days
}

export interface DocumentTermOption {
  id: string;
  name: string;
  isCurrent: boolean;
}

export interface DocumentActivityOption {
  id: string;
  title: string;
  termId: string;
  startDate: string;
}

export interface DocumentTaskOption {
  id: string;
  title: string;
  activityId?: string | null;
}

export interface DocumentMemberOption {
  id: string;
  fullName: string;
  studentId: string;
  position?: string | null;
}

export interface UploadProgressInfo {
  state: 'idle' | 'validating' | 'uploading' | 'saving_metadata' | 'success' | 'error';
  progressPercent: number;
  fileName?: string;
  errorMessage?: string;
}
