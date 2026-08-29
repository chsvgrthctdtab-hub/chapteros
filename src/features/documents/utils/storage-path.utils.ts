/**
 * Unified Supabase Storage Path Builder & Helper for Chi Hội Documents
 */

export const DOCUMENTS_BUCKET = 'documents';

export interface StoragePathParams {
  organizationId: string;
  fileName: string;
  termId?: string | null;
  activityId?: string | null;
  taskId?: string | null;
  memberId?: string | null;
  fileId?: string;
}

/**
 * Remove special characters, accents/diacritics (or normalize), spaces, and unsafe path characters from filename
 */
export function sanitizeFileName(originalName: string): string {
  // Extract extension
  const lastDotIdx = originalName.lastIndexOf('.');
  const ext = lastDotIdx > -1 ? originalName.slice(lastDotIdx).toLowerCase() : '';
  const baseName = lastDotIdx > -1 ? originalName.slice(0, lastDotIdx) : originalName;

  // Normalize Vietnamese accents and replace unsafe chars
  const normalized = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80); // Limit length

  const cleanBase = normalized.length > 0 ? normalized : 'document';
  return `${cleanBase}${ext}`;
}

/**
 * Generate unique random ID (UUID format)
 */
export function generateFileId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate standardized organization-scoped storage path
 *
 * Rules:
 * 1. Activity document: organizations/{orgId}/terms/{termId}/activities/{activityId}/{fileId}-{fileName}
 * 2. Task document: organizations/{orgId}/terms/{termId}/tasks/{taskId}/{fileId}-{fileName}
 * 3. Member document: organizations/{orgId}/members/{memberId}/{fileId}-{fileName}
 * 4. Term document: organizations/{orgId}/terms/{termId}/{fileId}-{fileName}
 * 5. General document: organizations/{orgId}/general/{fileId}-{fileName}
 */
export function buildDocumentStoragePath(params: StoragePathParams): {
  storagePath: string;
  fileId: string;
  sanitizedName: string;
} {
  const { organizationId, fileName, termId, activityId, taskId, memberId } = params;

  if (!organizationId) {
    throw new Error('Organization ID is required to construct document storage path');
  }

  const fileId = params.fileId || generateFileId();
  const sanitizedName = sanitizeFileName(fileName);
  const fileSegment = `${fileId}-${sanitizedName}`;

  let storagePath: string;

  if (activityId) {
    const termSegment = termId || 'general';
    storagePath = `organizations/${organizationId}/terms/${termSegment}/activities/${activityId}/${fileSegment}`;
  } else if (taskId) {
    const termSegment = termId || 'general';
    storagePath = `organizations/${organizationId}/terms/${termSegment}/tasks/${taskId}/${fileSegment}`;
  } else if (memberId) {
    storagePath = `organizations/${organizationId}/members/${memberId}/${fileSegment}`;
  } else if (termId) {
    storagePath = `organizations/${organizationId}/terms/${termId}/${fileSegment}`;
  } else {
    storagePath = `organizations/${organizationId}/general/${fileSegment}`;
  }

  return {
    storagePath,
    fileId,
    sanitizedName,
  };
}
