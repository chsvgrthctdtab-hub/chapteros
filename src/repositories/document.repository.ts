import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { Document, DocumentCategory, DocumentAccessLevel, DocumentSourceType, Profile } from '@/types';

type DbDocument = Database['public']['Tables']['documents']['Row'];
type DbDocumentInsert = Database['public']['Tables']['documents']['Insert'];
type DbDocumentUpdate = Database['public']['Tables']['documents']['Update'];
type DbProfile = Database['public']['Tables']['profiles']['Row'];

function mapDocumentFromDb(
  row: DbDocument & { uploader?: DbProfile | null }
): Document {
  return {
    id: row.id,
    organizationId: row.organization_id,
    termId: row.term_id,
    activityId: row.activity_id,
    memberId: row.member_id,
    taskId: row.task_id,
    title: row.title,
    category: row.category as DocumentCategory,
    sourceType: row.source_type as DocumentSourceType,
    filePath: row.file_path,
    driveFileId: row.drive_file_id,
    driveUrl: row.drive_url,
    fileIconUrl: row.file_icon_url,
    thumbnailUrl: row.thumbnail_url,
    isFolder: row.is_folder,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    accessLevel: row.access_level as DocumentAccessLevel,
    uploadedBy: row.uploaded_by,
    linkedBy: row.linked_by,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    uploader: row.uploader
      ? {
          id: row.uploader.id,
          fullName: row.uploader.full_name,
          email: row.uploader.email,
          avatarUrl: row.uploader.avatar_url,
          phone: row.uploader.phone,
          studentId: row.uploader.student_id,
          createdAt: row.uploader.created_at,
          updatedAt: row.uploader.updated_at,
        }
      : undefined,
  };
}

export interface DocumentFilterOptions {
  organizationId: string;
  termId?: string;
  activityId?: string;
  category?: string;
  sourceType?: string;
  search?: string;
}

export const documentRepository = {
  async getDocuments(filters: DocumentFilterOptions): Promise<Document[]> {
    if (!isSupabaseConfigured) return [];
    let query = supabase
      .from('documents')
      .select(
        `
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
        uploader:profiles!documents_uploaded_by_fkey (
          id,
          full_name,
          email,
          avatar_url,
          phone,
          student_id,
          created_at,
          updated_at
        )
      `
      )
      .eq('organization_id', filters.organizationId)
      .order('created_at', { ascending: false });

    if (filters.termId && filters.termId !== 'all') {
      query = query.eq('term_id', filters.termId);
    }
    if (filters.activityId) {
      query = query.eq('activity_id', filters.activityId);
    }
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category as DocumentCategory);
    }
    if (filters.sourceType && filters.sourceType !== 'all') {
      query = query.eq('source_type', filters.sourceType as DocumentSourceType);
    }
    if (filters.search && filters.search.trim()) {
      const s = filters.search.trim();
      query = query.or(`title.ilike.%${s}%,file_path.ilike.%${s}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return ((data as unknown as (DbDocument & { uploader?: DbProfile | null })[]) || []).map(
      mapDocumentFromDb
    );
  },

  async getById(id: string): Promise<Document | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('documents')
      .select('*, uploader:profiles!documents_uploaded_by_fkey (*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data
      ? mapDocumentFromDb(data as unknown as DbDocument & { uploader?: DbProfile | null })
      : null;
  },

  async create(payload: DbDocumentInsert): Promise<Document> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { data, error } = await supabase
      .from('documents')
      .insert(payload as never)
      .select('*, uploader:profiles!documents_uploaded_by_fkey (*)')
      .single();

    if (error) throw error;
    return mapDocumentFromDb(data as unknown as DbDocument & { uploader?: DbProfile | null });
  },

  async update(id: string, payload: DbDocumentUpdate): Promise<Document> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { data, error } = await supabase
      .from('documents')
      .update(payload as never)
      .eq('id', id)
      .select('*, uploader:profiles!documents_uploaded_by_fkey (*)')
      .single();

    if (error) throw error;
    return mapDocumentFromDb(data as unknown as DbDocument & { uploader?: DbProfile | null });
  },

  async delete(id: string, organizationId?: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    let query = supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { error } = await query;
    if (error) throw error;
  },
};
