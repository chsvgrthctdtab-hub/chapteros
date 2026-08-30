import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import type { Database } from '@/types/database.types';
import type {
  DocumentCategory,
  DocumentAccessLevel,
  DocumentSourceType,
} from '@/types';
import type { DocumentItem } from '@/features/documents/types/document.types';
import type {
  GoogleDriveFile,
  LinkDriveFilePayload,
  UploadDriveFilePayload,
  CreateDriveFolderPayload,
  DriveSearchQuery,
  DriveSearchResponse,
  LinkedDriveCheckResult,
} from './google-drive.types';
import {
  extractGoogleDriveFileId,
  buildGoogleDriveViewUrl,
  getDriveFileTypeGroup,
  GOOGLE_DRIVE_MIME_TYPES,
} from './google-drive.constants';

const LOCAL_STORAGE_DRIVE_DOCS_KEY = 'chihoi_local_drive_docs_';

type DbDocument = Database['public']['Tables']['documents']['Row'];

interface RawDocumentDbRow extends DbDocument {
  category: DocumentCategory;
  source_type: DocumentSourceType;
  access_level: DocumentAccessLevel;
  uploader?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email?: string;
  } | null;
  linker?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email?: string;
  } | null;
  term?: {
    id: string;
    name: string;
    is_current: boolean;
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
    full_name?: string;
    fullName?: string;
    student_id?: string;
    studentId?: string;
  } | null;
}

function mapRowToDocumentItem(row: RawDocumentDbRow): DocumentItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    termId: row.term_id,
    activityId: row.activity_id,
    memberId: row.member_id,
    taskId: row.task_id,
    title: row.title,
    category: row.category,
    sourceType: row.source_type || 'supabase',
    filePath: row.file_path,
    driveFileId: row.drive_file_id,
    driveUrl: row.drive_url,
    fileIconUrl: row.file_icon_url,
    thumbnailUrl: row.thumbnail_url,
    isFolder: row.is_folder || false,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    accessLevel: row.access_level,
    uploadedBy: row.uploaded_by,
    linkedBy: row.linked_by,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    uploader: row.uploader
      ? {
          id: row.uploader.id,
          fullName: row.uploader.full_name,
          avatarUrl: row.uploader.avatar_url,
          email: row.uploader.email,
        }
      : null,
    linker: row.linker
      ? {
          id: row.linker.id,
          fullName: row.linker.full_name,
          avatarUrl: row.linker.avatar_url,
          email: row.linker.email,
        }
      : null,
    term: row.term
      ? {
          id: row.term.id,
          name: row.term.name,
          isCurrent: row.term.is_current,
        }
      : null,
    activity: row.activity
      ? {
          id: row.activity.id,
          title: row.activity.title,
          code: row.activity.code,
        }
      : null,
    task: row.task
      ? {
          id: row.task.id,
          title: row.task.title,
        }
      : null,
    member: row.member
      ? {
          id: row.member.id,
          fullName: row.member.full_name || row.member.fullName || '',
          studentId: row.member.student_id || row.member.studentId || '',
        }
      : null,
  };
}

export const googleDriveService = {
  /**
   * Check if a Google Drive file is already linked to this Organization / Activity / Task
   */
  async checkDriveFileLinked(
    organizationId: string,
    driveFileId: string,
    context?: { activityId?: string | null; taskId?: string | null }
  ): Promise<LinkedDriveCheckResult> {
    if (!organizationId || !driveFileId) {
      return { isLinked: false };
    }

    if (!isSupabaseConfigured) {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_DRIVE_DOCS_KEY}${organizationId}`);
      if (raw) {
        try {
          const list: DocumentItem[] = JSON.parse(raw);
          const match = list.find((doc) => {
            if (doc.driveFileId !== driveFileId) return false;
            if (context?.activityId) return doc.activityId === context.activityId;
            if (context?.taskId) return doc.taskId === context.taskId;
            return !doc.activityId && !doc.taskId;
          });

          if (match) {
            return {
              isLinked: true,
              existingDocument: match,
              contextMessage: match.activityId
                ? `Tệp này đã được liên kết trong Hoạt động "${match.activity?.title || 'đang chọn'}"`
                : match.taskId
                ? `Tệp này đã được liên kết trong Công việc "${match.task?.title || 'đang chọn'}"`
                : 'Tệp này đã có trong danh mục Tài liệu chung của Đơn vị',
            };
          }
        } catch {
          // ignore
        }
      }
      return { isLinked: false };
    }

    try {
      let query = (supabase.from('documents') as any)
        .select(`
          id,
          organization_id,
          term_id,
          activity_id,
          task_id,
          title,
          category,
          source_type,
          file_path,
          drive_file_id,
          drive_url,
          access_level,
          created_at,
          updated_at,
          activity:activities!activity_id(id, title),
          task:tasks!task_id(id, title)
        `)
        .eq('organization_id', organizationId)
        .eq('source_type', 'google_drive')
        .eq('drive_file_id', driveFileId);

      if (context?.activityId) {
        query = query.eq('activity_id', context.activityId);
      } else if (context?.taskId) {
        query = query.eq('task_id', context.taskId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Error checking drive file link status:', error.message);
        return { isLinked: false };
      }

      if (data && data.length > 0) {
        const doc = data[0];
        return {
          isLinked: true,
          existingDocument: doc,
          contextMessage: doc.activity?.title
            ? `Tệp này đã được liên kết trong Hoạt động "${doc.activity.title}"`
            : doc.task?.title
            ? `Tệp này đã được liên kết trong Công việc "${doc.task.title}"`
            : 'Tệp này đã có trong danh mục Tài liệu chung của Đơn vị',
        };
      }

      return { isLinked: false };
    } catch (err) {
      console.error('Unexpected error checking drive file link:', err);
      return { isLinked: false };
    }
  },

  /**
   * Link a Google Drive file / folder into Chi Hội Manager database
   */
  async linkDriveFile(payload: LinkDriveFilePayload): Promise<{
    success: boolean;
    document?: DocumentItem;
    error?: string;
  }> {
    if (!payload.organizationId) {
      return { success: false, error: 'Thiếu mã định danh Chi hội.' };
    }
    if (!payload.driveFileId) {
      return { success: false, error: 'Thiếu mã tệp Google Drive.' };
    }
    if (!payload.title?.trim()) {
      return { success: false, error: 'Vui lòng nhập tên tài liệu.' };
    }

    // 1. Check duplicate link in same context
    const check = await this.checkDriveFileLinked(payload.organizationId, payload.driveFileId, {
      activityId: payload.activityId,
      taskId: payload.taskId,
    });

    if (check.isLinked) {
      return {
        success: false,
        error: check.contextMessage || 'Tệp Google Drive này đã được liên kết trong hệ thống.',
      };
    }

    const driveUrl = payload.driveUrl || buildGoogleDriveViewUrl(payload.driveFileId, payload.mimeType);
    const filePath = payload.filePath || (payload.isFolder ? payload.title : `google_drive://${payload.driveFileId}`);

    if (!isSupabaseConfigured) {
      // Local storage fallback for sandbox
      const newDoc: DocumentItem = {
        id: `mock-drive-doc-${Date.now()}`,
        organizationId: payload.organizationId,
        termId: payload.termId || null,
        activityId: payload.activityId || null,
        taskId: payload.taskId || null,
        memberId: payload.memberId || null,
        title: payload.title.trim(),
        category: payload.category,
        sourceType: 'google_drive',
        filePath,
        driveFileId: payload.driveFileId,
        driveUrl,
        fileIconUrl: payload.fileIconUrl || null,
        thumbnailUrl: payload.thumbnailUrl || null,
        isFolder: payload.isFolder || false,
        fileSize: payload.fileSize || null,
        mimeType: payload.mimeType || 'application/vnd.google-apps.document',
        accessLevel: payload.accessLevel,
        uploadedBy: payload.linkedBy || null,
        linkedBy: payload.linkedBy || null,
        metadata: payload.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const storageKey = `${LOCAL_STORAGE_DRIVE_DOCS_KEY}${payload.organizationId}`;
      const existing = localStorage.getItem(storageKey);
      const list: DocumentItem[] = existing ? JSON.parse(existing) : [];
      list.unshift(newDoc);
      localStorage.setItem(storageKey, JSON.stringify(list));

      return { success: true, document: newDoc };
    }

    try {
      const insertPayload = {
        organization_id: payload.organizationId,
        term_id: payload.termId || null,
        activity_id: payload.activityId || null,
        task_id: payload.taskId || null,
        member_id: payload.memberId || null,
        title: payload.title.trim(),
        category: payload.category,
        source_type: 'google_drive',
        file_path: filePath,
        drive_file_id: payload.driveFileId,
        drive_url: driveUrl,
        file_icon_url: payload.fileIconUrl || null,
        thumbnail_url: payload.thumbnailUrl || null,
        is_folder: payload.isFolder || false,
        file_size: payload.fileSize || null,
        mime_type: payload.mimeType || 'application/vnd.google-apps.document',
        access_level: payload.accessLevel,
        uploaded_by: payload.linkedBy || null,
        linked_by: payload.linkedBy || null,
        metadata: payload.metadata || {},
      };

      const { data, error } = await (supabase.from('documents') as any)
        .insert(insertPayload)
        .select(`
          id,
          organization_id,
          term_id,
          activity_id,
          member_id,
          task_id,
          title,
          category,
          source_type,
          file_path,
          drive_file_id,
          drive_url,
          file_icon_url,
          thumbnail_url,
          is_folder,
          file_size,
          mime_type,
          access_level,
          uploaded_by,
          linked_by,
          metadata,
          created_at,
          updated_at,
          uploader:profiles!uploaded_by(id, full_name, avatar_url, email),
          linker:profiles!linked_by(id, full_name, avatar_url, email),
          term:terms!term_id(id, name, is_current),
          activity:activities!activity_id(id, title, code),
          task:tasks!task_id(id, title)
        `)
        .single();

      if (error) {
        console.error('Error linking Google Drive file in DB:', error);
        if (error.code === '23505') {
          return {
            success: false,
            error: 'Tệp Google Drive này đã được liên kết trong cùng hoạt động hoặc Chi hội.',
          };
        }
        return {
          success: false,
          error: error.message || 'Lỗi khi lưu thông tin liên kết Google Drive.',
        };
      }

      // Audit Log for Drive Linking
      if (payload.linkedBy) {
        try {
          await auditLogRepository.log({
            organization_id: payload.organizationId,
            user_id: payload.linkedBy,
            action: 'google_drive.link',
            entity_type: 'document',
            entity_id: data.id,
            metadata: {
              title: payload.title.trim(),
              driveFileId: payload.driveFileId,
              driveUrl,
              category: payload.category,
              activityId: payload.activityId || null,
              taskId: payload.taskId || null,
            },
          });
        } catch (auditErr) {
          console.warn('Audit log write error on Drive link:', auditErr);
        }
      }

      return {
        success: true,
        document: mapRowToDocumentItem(data as RawDocumentDbRow),
      };
    } catch (err) {
      console.error('Unexpected error in linkDriveFile:', err);
      return {
        success: false,
        error: (err as Error).message || 'Lỗi không xác định khi liên kết tài liệu Drive.',
      };
    }
  },

  /**
   * Upload binary file directly to Google Drive via secure backend proxy
   * (Does NOT upload into Supabase Storage; does NOT expose tokens to browser)
   */
  async uploadDirectToDrive(
    payload: UploadDriveFilePayload
  ): Promise<{ success: boolean; document?: DocumentItem; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', payload.file);
      formData.append('organizationId', payload.organizationId);
      if (payload.userId) formData.append('userId', payload.userId);
      if (payload.userEmail) formData.append('userEmail', payload.userEmail);
      if (payload.title) formData.append('title', payload.title);
      if (payload.folderId) formData.append('folderId', payload.folderId);
      if (payload.folderName) formData.append('folderName', payload.folderName);

      const localToken = localStorage.getItem('chapteros_google_access_token');
      let googleToken = localToken;
      if (!googleToken) {
        try {
          const res = await supabase
            .from('google_connections')
            .select('metadata')
            .eq('status', 'connected')
            .eq('organization_id', payload.organizationId)
            .maybeSingle();
          const connData: any = res?.data;
          const meta = connData?.metadata as Record<string, any> | undefined;
          googleToken = meta?.access_token || meta?.accessToken || null;
        } catch {
          // ignore
        }
      }

      if (googleToken) {
        formData.append('googleAccessToken', googleToken);
      }

      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: {
          ...(googleToken ? { 'x-google-access-token': googleToken } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error || `Upload to Google Drive failed with status ${response.status}`);
      }

      const resData = await response.json();
      if (!resData.success || !resData.file) {
        throw new Error(resData.error || 'Không nhận được thông tin tệp từ Google Drive.');
      }

      const uploadedDriveFile = resData.file;
      const targetFilePath = payload.folderName
        ? `${payload.folderName}/${payload.file.name}`
        : (uploadedDriveFile.filePath || payload.file.name);

      // Link the uploaded Google Drive file into ChapterOS via authenticated client Supabase
      return await this.linkDriveFile({
        organizationId: payload.organizationId,
        termId: payload.termId,
        activityId: payload.activityId,
        taskId: payload.taskId,
        memberId: payload.memberId,
        driveFileId: uploadedDriveFile.id,
        title: payload.title || uploadedDriveFile.name || payload.file.name,
        filePath: targetFilePath,
        driveUrl: uploadedDriveFile.webViewLink,
        mimeType: uploadedDriveFile.mimeType || payload.file.type,
        fileSize: uploadedDriveFile.size || payload.file.size,
        fileIconUrl: uploadedDriveFile.iconLink,
        category: payload.category,
        accessLevel: payload.accessLevel,
        linkedBy: payload.userId,
        metadata: {
          folderName: payload.folderName || null,
        },
      });
    } catch (err) {
      console.error('[googleDriveService.uploadDirectToDrive] Error:', err);
      return {
        success: false,
        error: (err as Error).message || 'Không thể tải tệp lên Google Drive.',
      };
    }
  },

  /**
   * Create real folder in Google Drive & save in documents
   */
  async createDriveFolder(
    payload: CreateDriveFolderPayload
  ): Promise<{ success: boolean; document?: DocumentItem; error?: string }> {
    try {
      let folderId = `gfolder-${Date.now()}`;
      let folderUrl = payload.driveUrl?.trim() || `https://drive.google.com/drive/folders/${folderId}`;

      const localToken = localStorage.getItem('chapteros_google_access_token');
      let googleToken = localToken;
      if (!googleToken) {
        try {
          const res = await supabase
            .from('google_connections')
            .select('metadata')
            .eq('status', 'connected')
            .eq('organization_id', payload.organizationId)
            .maybeSingle();
          const connData: any = res?.data;
          const meta = connData?.metadata as Record<string, any> | undefined;
          googleToken = meta?.access_token || meta?.accessToken || null;
        } catch {
          // ignore
        }
      }

      try {
        const response = await fetch('/api/drive/create-folder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(googleToken ? { 'x-google-access-token': googleToken } : {}),
          },
          body: JSON.stringify({
            ...payload,
            googleAccessToken: googleToken,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.folder) {
            folderId = resData.folder.id;
            if (!payload.driveUrl?.trim()) {
              folderUrl = resData.folder.webViewLink || folderUrl;
            }
          }
        }
      } catch (apiErr) {
        console.warn('[Google Drive API create-folder notice]', apiErr);
      }

      // Save to PostgreSQL via authenticated client Supabase instance
      return await this.linkDriveFile({
        organizationId: payload.organizationId,
        title: payload.folderName.trim(),
        filePath: payload.folderName.trim(),
        driveFileId: folderId,
        driveUrl: folderUrl,
        mimeType: 'application/vnd.google-apps.folder',
        isFolder: true,
        category: 'general',
        accessLevel: 'internal',
        linkedBy: payload.userId,
        metadata: {
          folderName: payload.folderName.trim(),
        },
      });
    } catch (err) {
      console.error('[googleDriveService.createDriveFolder] Error:', err);
      return {
        success: false,
        error: (err as Error).message || 'Lỗi khi tạo thư mục.',
      };
    }
  },

  /**
   * Unlink a Google Drive document from Chi Hội Manager
   * Policy: UNLINK ONLY (Do NOT delete from Google Drive)
   */
  async unlinkDriveFile(
    documentId: string,
    organizationId: string,
    unlinkedBy?: string | null
  ): Promise<{ success: boolean; error?: string }> {
    if (!documentId || !organizationId) {
      return { success: false, error: 'Thiếu thông tin tài liệu cần gỡ liên kết.' };
    }

    if (!isSupabaseConfigured) {
      const storageKey = `${LOCAL_STORAGE_DRIVE_DOCS_KEY}${organizationId}`;
      const existing = localStorage.getItem(storageKey);
      if (existing) {
        try {
          const list: DocumentItem[] = JSON.parse(existing);
          const filtered = list.filter((d) => d.id !== documentId);
          localStorage.setItem(storageKey, JSON.stringify(filtered));
        } catch {
          // ignore
        }
      }
      return { success: true };
    }

    try {
      // 1. Get drive_file_id to delete on Google Drive cloud
      let driveFileIdToDelete: string | null = null;
      try {
        const res = await supabase
          .from('documents')
          .select('drive_file_id')
          .eq('id', documentId)
          .maybeSingle();
        const docData: any = res?.data;
        driveFileIdToDelete = docData?.drive_file_id || null;
      } catch {
        // ignore
      }

      // 2. Call backend Google Drive Delete API to permanently delete on Google Drive cloud
      if (driveFileIdToDelete && !driveFileIdToDelete.startsWith('gfolder-') && !driveFileIdToDelete.startsWith('gfile-')) {
        try {
          const localToken = localStorage.getItem('chapteros_google_access_token');
          await fetch('/api/drive/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(localToken ? { 'x-google-access-token': localToken } : {}),
            },
            body: JSON.stringify({
              driveFileId: driveFileIdToDelete,
              organizationId,
              userId: unlinkedBy,
              googleAccessToken: localToken,
            }),
          });
        } catch (cloudDelErr) {
          console.warn('[Google Drive Cloud Delete error notice]', cloudDelErr);
        }
      }

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error unlinking drive document from DB:', error);
        return { success: false, error: error.message || 'Không thể gỡ liên kết tài liệu.' };
      }

      // Audit Log for Drive Unlinking
      if (unlinkedBy) {
        try {
          await auditLogRepository.log({
            organization_id: organizationId,
            user_id: unlinkedBy,
            action: 'google_drive.unlink',
            entity_type: 'document',
            entity_id: documentId,
            metadata: {
              unlinkedAt: new Date().toISOString(),
            },
          });
        } catch (auditErr) {
          console.warn('Audit log write error on Drive unlink:', auditErr);
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Unexpected error unlinking drive document:', err);
      return {
        success: false,
        error: (err as Error).message || 'Lỗi bất ngờ khi gỡ liên kết tài liệu.',
      };
    }
  },

  /**
   * Fetch metadata of a Google Drive file using Google Drive REST API v3 or smart fallback
   */
  async fetchDriveFileMetadata(
    urlOrId: string,
    accessToken?: string | null
  ): Promise<GoogleDriveFile> {
    const fileId = extractGoogleDriveFileId(urlOrId);
    if (!fileId) {
      throw new Error('Định dạng liên kết hoặc ID Google Drive không hợp lệ.');
    }

    // Determine likely type from raw URL structure
    let guessedMime: string = GOOGLE_DRIVE_MIME_TYPES.DOCUMENT;
    let guessedName = 'Tài liệu Google Drive';
    const lower = urlOrId.toLowerCase();

    if (lower.includes('/spreadsheets/')) {
      guessedMime = GOOGLE_DRIVE_MIME_TYPES.SPREADSHEET;
      guessedName = 'Bảng tính Google Sheets';
    } else if (lower.includes('/presentation/')) {
      guessedMime = GOOGLE_DRIVE_MIME_TYPES.PRESENTATION;
      guessedName = 'Bản trình chiếu Google Slides';
    } else if (lower.includes('/forms/')) {
      guessedMime = GOOGLE_DRIVE_MIME_TYPES.FORM;
      guessedName = 'Biểu mẫu Google Forms';
    } else if (lower.includes('/folders/')) {
      guessedMime = GOOGLE_DRIVE_MIME_TYPES.FOLDER;
      guessedName = 'Thư mục Google Drive';
    } else if (lower.endsWith('.pdf') || lower.includes('pdf')) {
      guessedMime = GOOGLE_DRIVE_MIME_TYPES.PDF;
      guessedName = 'Văn bản PDF Google Drive';
    }

    // If an OAuth access token is provided, attempt live Drive API v3 call
    if (accessToken) {
      try {
        const fields =
          'id,name,mimeType,iconLink,thumbnailLink,webViewLink,webContentLink,size,createdTime,modifiedTime,owners,description,capabilities';
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${fields}&supportsAllDrives=true`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = (await response.json()) as {
            id?: string;
            name?: string;
            mimeType?: string;
            size?: string;
            iconLink?: string;
            thumbnailLink?: string;
            webViewLink?: string;
            webContentLink?: string;
            createdTime?: string;
            modifiedTime?: string;
            owners?: { displayName?: string; emailAddress?: string; photoLink?: string }[];
            description?: string;
          };
          const mime = data.mimeType || guessedMime;
          return {
            id: data.id || fileId,
            name: data.name || guessedName,
            mimeType: mime,
            size: data.size ? parseInt(data.size, 10) : null,
            iconLink: data.iconLink,
            thumbnailLink: data.thumbnailLink,
            webViewLink: data.webViewLink || buildGoogleDriveViewUrl(fileId, mime),
            webContentLink: data.webContentLink,
            createdTime: data.createdTime,
            modifiedTime: data.modifiedTime,
            owners: data.owners,
            description: data.description,
            isFolder: mime === GOOGLE_DRIVE_MIME_TYPES.FOLDER,
            fileTypeGroup: getDriveFileTypeGroup(mime, data.name),
          };
        }
      } catch (apiErr) {
        console.warn('Google Drive v3 API direct lookup notice:', apiErr);
      }
    }

    // Fallback metadata parsed from URL structure
    return {
      id: fileId,
      name: guessedName,
      mimeType: guessedMime,
      webViewLink: buildGoogleDriveViewUrl(fileId, guessedMime),
      isFolder: guessedMime === GOOGLE_DRIVE_MIME_TYPES.FOLDER,
      fileTypeGroup: getDriveFileTypeGroup(guessedMime, guessedName),
    };
  },

  /**
   * Search or list Drive files with pagination and keyword filtering
   */
  async searchDriveFiles(
    params: DriveSearchQuery,
    accessToken?: string | null
  ): Promise<DriveSearchResponse> {
    if (accessToken) {
      try {
        let q = 'trashed = false';
        if (params.query?.trim()) {
          q += ` and name contains '${params.query.trim().replace(/'/g, "\\'")}'`;
        }
        if (params.folderId) {
          q += ` and '${params.folderId}' in parents`;
        }

        const pageSize = params.pageSize || 20;
        const pageToken = params.pageToken ? `&pageToken=${encodeURIComponent(params.pageToken)}` : '';
        const fields = 'nextPageToken,files(id,name,mimeType,iconLink,thumbnailLink,webViewLink,size,modifiedTime,owners)';

        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
            q
          )}&pageSize=${pageSize}${pageToken}&fields=${encodeURIComponent(
            fields
          )}&supportsAllDrives=true&orderBy=folder,modifiedTime desc`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        );

        if (res.ok) {
          const json = (await res.json()) as {
            files?: Array<{
              id: string;
              name: string;
              mimeType: string;
              size?: string;
              iconLink?: string;
              thumbnailLink?: string;
              webViewLink?: string;
              modifiedTime?: string;
              owners?: { displayName?: string; emailAddress?: string; photoLink?: string }[];
            }>;
            nextPageToken?: string;
          };
          const files: GoogleDriveFile[] = (json.files || []).map((f) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            size: f.size ? parseInt(f.size, 10) : null,
            iconLink: f.iconLink,
            thumbnailLink: f.thumbnailLink,
            webViewLink: f.webViewLink || buildGoogleDriveViewUrl(f.id, f.mimeType),
            modifiedTime: f.modifiedTime,
            owners: f.owners,
            isFolder: f.mimeType === GOOGLE_DRIVE_MIME_TYPES.FOLDER,
            fileTypeGroup: getDriveFileTypeGroup(f.mimeType, f.name),
          }));

          return {
            files,
            nextPageToken: json.nextPageToken,
          };
        }
      } catch (err) {
        console.warn('Live Drive search failed:', err);
      }
    }

    // When no access token is available, return empty list (no mock data)
    return { files: [] };
  },
};
