import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured } from '@/lib/supabase';
import { documentService } from '@/services/document.service';
import { documentKeys } from '../queries/document.queries';
import { buildDocumentStoragePath } from '../utils/storage-path.utils';
import { validateDocumentFile } from '../utils/document.utils';
import {
  uploadDocumentToStorage,
  deleteDocumentFromStorage,
} from '../storage/document-storage.service';
import type {
  DocumentUploadFormData,
  DocumentEditMetadataFormData,
} from '../schemas/document.schema';

export interface UploadDocumentParams {
  organizationId: string;
  file: File;
  data: DocumentUploadFormData;
  uploadedBy?: string | null;
}

export interface UpdateDocumentMetadataParams {
  documentId: string;
  organizationId: string;
  data: DocumentEditMetadataFormData;
  updatedBy?: string | null;
}

export interface DeleteDocumentParams {
  documentId: string;
  organizationId: string;
  storagePath: string;
  deletedBy?: string | null;
  activityId?: string | null;
  taskId?: string | null;
}

/**
 * Mutation to upload a document to Supabase Storage and register its metadata in PostgreSQL
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      file,
      data,
      uploadedBy,
    }: UploadDocumentParams) => {
      if (!organizationId) {
        throw new Error('Thiếu thông tin Chi hội.');
      }

      if (!isSupabaseConfigured) {
        throw new Error('Chưa cấu hình kết nối Supabase Storage & Database.');
      }

      // 1. Validate File
      const validation = validateDocumentFile(file);
      if (!validation.valid) {
        throw new Error(validation.error || 'Tệp tin không hợp lệ.');
      }

      // 2. Build Safe Storage Path
      const { storagePath } = buildDocumentStoragePath({
        organizationId,
        fileName: file.name,
        termId: data.termId || null,
        activityId: data.activityId || null,
        taskId: data.taskId || null,
        memberId: data.memberId || null,
      });

      // 3. Upload Binary to Supabase Storage
      let uploadResult;
      try {
        uploadResult = await uploadDocumentToStorage(file, storagePath);
      } catch (uploadErr) {
        console.error('Storage upload failed:', uploadErr);
        throw uploadErr;
      }

      // 4. Save Document Metadata in PostgreSQL Database via documentService
      try {
        const insertedDoc = await documentService.createDocument(
          {
            organization_id: organizationId,
            term_id: data.termId || null,
            activity_id: data.activityId || null,
            task_id: data.taskId || null,
            member_id: data.memberId || null,
            title: data.title.trim(),
            category: data.category,
            file_path: uploadResult.path,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream',
            access_level: data.accessLevel,
            uploaded_by: uploadedBy || null,
          },
          uploadedBy || undefined
        );

        return insertedDoc;
      } catch (insertError) {
        // Rollback Orphan File if Database Insert Fails
        console.error('Database insert failed, rolling back uploaded storage file:', insertError);
        try {
          await deleteDocumentFromStorage(uploadResult.path);
        } catch (rollbackErr) {
          console.warn('Orphan file rollback warning:', rollbackErr);
        }
        throw new Error(
          (insertError as Error)?.message ||
            'Không thể lưu thông tin tài liệu vào cơ sở dữ liệu. Tệp đã được dọn dẹp an toàn.'
        );
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: documentKeys.list(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.stats(variables.organizationId) });

      if (variables.data.activityId) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.activityDocuments(variables.organizationId, variables.data.activityId),
        });
      }
      if (variables.data.taskId) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.taskDocuments(variables.organizationId, variables.data.taskId),
        });
      }
    },
  });
}

/**
 * Mutation to update document metadata (rename title, change category, access level, links)
 */
export function useUpdateDocumentMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      organizationId,
      data,
      updatedBy,
    }: UpdateDocumentMetadataParams) => {
      if (!documentId || !organizationId) {
        throw new Error('Thiếu thông tin tài liệu hoặc Chi hội');
      }

      if (!isSupabaseConfigured) {
        throw new Error('Chưa cấu hình kết nối Supabase');
      }

      const updatePayload = {
        title: data.title.trim(),
        category: data.category,
        access_level: data.accessLevel,
        term_id: data.termId || null,
        activity_id: data.activityId || null,
        task_id: data.taskId || null,
        member_id: data.memberId || null,
        updated_at: new Date().toISOString(),
      };

      const updatedDoc = await documentService.updateDocument(
        documentId,
        updatePayload,
        updatedBy || undefined
      );

      return updatedDoc;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: documentKeys.list(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.stats(variables.organizationId) });
    },
  });
}

/**
 * Mutation to delete a document (metadata + storage object)
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      organizationId,
      storagePath,
      deletedBy,
    }: DeleteDocumentParams) => {
      if (!documentId || !organizationId) {
        throw new Error('Thiếu thông tin định danh tài liệu');
      }

      if (!isSupabaseConfigured) {
        throw new Error('Chưa cấu hình kết nối Supabase');
      }

      // 1. Delete Database record via documentService (with audit log and tenant filter)
      await documentService.deleteDocument(documentId, organizationId, deletedBy || undefined);

      // 2. Delete File from Storage (only for Supabase Storage files, NOT Google Drive)
      if (storagePath && !storagePath.startsWith('google_drive://')) {
        const { error: storageError } = await deleteDocumentFromStorage(storagePath);
        if (storageError) {
          console.warn('Storage file deletion warning (metadata was removed):', storageError);
        }
      }

      return { success: true };
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
    },
  });
}
