import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import dayjs from 'dayjs';
import type {
  DocumentFilterParams,
  DocumentItem,
  DocumentStats,
  DocumentTermOption,
  DocumentActivityOption,
  DocumentTaskOption,
  DocumentMemberOption,
  DocumentCategory,
} from '../types/document.types';
import { getFileTypeGroup } from '../utils/document.utils';

export const documentKeys = {
  all: ['documents'] as const,
  list: (orgId?: string, filters?: DocumentFilterParams) =>
    [...documentKeys.all, 'list', orgId, filters] as const,
  activityDocuments: (orgId?: string, activityId?: string) =>
    [...documentKeys.all, 'activity', orgId, activityId] as const,
  taskDocuments: (orgId?: string, taskId?: string) =>
    [...documentKeys.all, 'task', orgId, taskId] as const,
  stats: (orgId?: string) => [...documentKeys.all, 'stats', orgId] as const,
  terms: (orgId?: string) => [...documentKeys.all, 'terms', orgId] as const,
  activities: (orgId?: string, termId?: string) =>
    [...documentKeys.all, 'activities', orgId, termId] as const,
  tasks: (orgId?: string, activityId?: string) =>
    [...documentKeys.all, 'tasks', orgId, activityId] as const,
  members: (orgId?: string) => [...documentKeys.all, 'members', orgId] as const,
};

/**
 * Fetch documents list for an organization with rich filtering and sorting
 */
export function useDocuments(organizationId?: string, filters: DocumentFilterParams = {}) {
  return useQuery<DocumentItem[]>({
    queryKey: documentKeys.list(organizationId, filters),
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId || !isSupabaseConfigured) {
        return [];
      }

      let query = (supabase.from('documents') as any)
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
          uploader:profiles!uploaded_by(
            id,
            full_name,
            avatar_url,
            email
          ),
          linker:profiles!linked_by(
            id,
            full_name,
            avatar_url,
            email
          ),
          term:terms!term_id(
            id,
            name,
            is_current
          ),
          activity:activities!activity_id(
            id,
            title,
            code
          ),
          task:tasks!task_id(
            id,
            title
          ),
          member:members!member_id(
            id,
            full_name,
            student_id
          )
        `)
        .eq('organization_id', organizationId);

      // Source type filter
      if (filters.sourceType && filters.sourceType !== 'all') {
        query = query.eq('source_type', filters.sourceType);
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      // Access Level filter
      if (filters.accessLevel && filters.accessLevel !== 'all') {
        query = query.eq('access_level', filters.accessLevel);
      }

      // Term filter
      if (filters.termId && filters.termId !== 'all') {
        query = query.eq('term_id', filters.termId);
      }

      // Activity filter
      if (filters.activityId && filters.activityId !== 'all') {
        query = query.eq('activity_id', filters.activityId);
      }

      // Task filter
      if (filters.taskId) {
        query = query.eq('task_id', filters.taskId);
      }

      // Member filter
      if (filters.memberId) {
        query = query.eq('member_id', filters.memberId);
      }

      // Search keyword across title, drive_url, file_path
      if (filters.search && filters.search.trim().length > 0) {
        const s = filters.search.trim();
        query = query.or(`title.ilike.%${s}%,drive_url.ilike.%${s}%,file_path.ilike.%${s}%`);
      }

      // Sorting
      const sortColumn =
        filters.sortBy === 'title'
          ? 'title'
          : filters.sortBy === 'fileSize'
          ? 'file_size'
          : 'created_at';
      const isAsc = filters.sortOrder === 'asc';

      query = query.order(sortColumn, { ascending: isAsc, nullsFirst: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching documents list:', error);
        throw error;
      }

      if (!data) return [];

      let formattedList: DocumentItem[] = (data as any[]).map((row) => ({
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
        metadata: row.metadata || {},
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
              fullName: row.member.full_name,
              studentId: row.member.student_id,
            }
          : null,
      }));

      // Filter by file type group if specified
      if (filters.fileTypeGroup && filters.fileTypeGroup !== 'all') {
        formattedList = formattedList.filter(
          (doc) => getFileTypeGroup(doc.mimeType, doc.filePath) === filters.fileTypeGroup
        );
      }

      // Filter by linked status if specified
      if (filters.linkedStatus && filters.linkedStatus !== 'all') {
        formattedList = formattedList.filter((doc) => {
          const isLinked = Boolean(doc.termId || doc.activityId || doc.taskId || doc.memberId);
          return filters.linkedStatus === 'linked' ? isLinked : !isLinked;
        });
      }

      return formattedList;
    },
  });
}

/**
 * Fetch documents tied to a specific activity
 */
export function useActivityDocuments(organizationId?: string, activityId?: string) {
  return useQuery<DocumentItem[]>({
    queryKey: documentKeys.activityDocuments(organizationId, activityId),
    enabled: !!organizationId && !!activityId,
    queryFn: async () => {
      if (!organizationId || !activityId || !isSupabaseConfigured) {
        return [];
      }

      const { data, error } = await (supabase.from('documents') as any)
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
          uploader:profiles!uploaded_by(
            id,
            full_name,
            avatar_url,
            email
          ),
          linker:profiles!linked_by(
            id,
            full_name,
            avatar_url,
            email
          ),
          term:terms!term_id(
            id,
            name,
            is_current
          )
        `)
        .eq('organization_id', organizationId)
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activity documents:', error);
        throw error;
      }

      if (!data) return [];

      return (data as any[]).map((row) => ({
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
        metadata: row.metadata || {},
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
      }));
    },
  });
}

/**
 * Fetch documents tied to a specific task
 */
export function useTaskDocuments(organizationId?: string, taskId?: string) {
  return useQuery<DocumentItem[]>({
    queryKey: documentKeys.taskDocuments(organizationId, taskId),
    enabled: !!organizationId && !!taskId,
    queryFn: async () => {
      if (!organizationId || !taskId || !isSupabaseConfigured) {
        return [];
      }

      const { data, error } = await (supabase.from('documents') as any)
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
          uploader:profiles!uploaded_by(
            id,
            full_name,
            avatar_url,
            email
          ),
          linker:profiles!linked_by(
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching task documents:', error);
        throw error;
      }

      if (!data) return [];

      return (data as any[]).map((row) => ({
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
        metadata: row.metadata || {},
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
      }));
    },
  });
}

/**
 * Calculate aggregate document statistics for the organization
 */
export function useDocumentStats(organizationId?: string) {
  return useQuery<DocumentStats>({
    queryKey: documentKeys.stats(organizationId),
    enabled: !!organizationId,
    queryFn: async () => {
      const defaultStats: DocumentStats = {
        totalCount: 0,
        supabaseCount: 0,
        googleDriveCount: 0,
        totalSizeBytes: 0,
        publicCount: 0,
        internalCount: 0,
        boardOnlyCount: 0,
        adminOnlyCount: 0,
        categoryCounts: {
          general: 0,
          resolution: 0,
          decision: 0,
          plan: 0,
          report: 0,
          template: 0,
          handover: 0,
          financial_receipt: 0,
        },
        fileTypeCounts: {},
        recentUploadsCount: 0,
      };

      if (!organizationId || !isSupabaseConfigured) {
        return defaultStats;
      }

      const { data, error } = await (supabase.from('documents') as any)
        .select('id, category, source_type, access_level, file_size, mime_type, file_path, created_at')
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error fetching document stats:', error);
      }

      if (!data || data.length === 0) {
        return defaultStats;
      }

      const thirtyDaysAgo = dayjs().subtract(30, 'day');
      const stats = { ...defaultStats };

      (data as any[]).forEach((row) => {
        stats.totalCount += 1;
        const size = row.file_size || 0;
        stats.totalSizeBytes += size;

        // Source types
        if (row.source_type === 'google_drive') {
          stats.googleDriveCount += 1;
        } else {
          stats.supabaseCount += 1;
        }

        // Access levels
        if (row.access_level === 'public') stats.publicCount += 1;
        else if (row.access_level === 'internal') stats.internalCount += 1;
        else if (row.access_level === 'board_only' || row.access_level === 'confidential') stats.boardOnlyCount += 1;
        else if (row.access_level === 'admin_only') stats.adminOnlyCount += 1;

        // Categories
        const cat = row.category as DocumentCategory;
        if (cat && stats.categoryCounts[cat] !== undefined) {
          stats.categoryCounts[cat] += 1;
        }

        // File types
        const typeGroup = getFileTypeGroup(row.mime_type, row.file_path);
        stats.fileTypeCounts[typeGroup] = (stats.fileTypeCounts[typeGroup] || 0) + 1;

        // Recent uploads
        if (dayjs(row.created_at).isAfter(thirtyDaysAgo)) {
          stats.recentUploadsCount += 1;
        }
      });

      return stats;
    },
  });
}

/**
 * Fetch available terms for dropdown selection
 */
export function useDocumentTerms(organizationId?: string) {
  return useQuery<DocumentTermOption[]>({
    queryKey: documentKeys.terms(organizationId),
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId || !isSupabaseConfigured) {
        return [];
      }

      const { data, error } = await (supabase.from('terms') as any)
        .select('id, name, is_current')
        .eq('organization_id', organizationId)
        .order('is_current', { ascending: false })
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching terms for documents:', error);
        return [];
      }

      return (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        isCurrent: t.is_current,
      }));
    },
  });
}

/**
 * Fetch activities for dropdown selection (optionally filtered by term)
 */
export function useDocumentActivities(organizationId?: string, termId?: string) {
  return useQuery<DocumentActivityOption[]>({
    queryKey: documentKeys.activities(organizationId, termId),
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId || !isSupabaseConfigured) {
        return [];
      }

      let query = (supabase.from('activities') as any)
        .select('id, title, term_id, start_date')
        .eq('organization_id', organizationId)
        .order('start_date', { ascending: false });

      if (termId && termId !== 'all') {
        query = query.eq('term_id', termId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching activities for documents:', error);
        return [];
      }

      return (data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        termId: a.term_id,
        startDate: a.start_date,
      }));
    },
  });
}

/**
 * Fetch tasks for dropdown selection
 */
export function useDocumentTasks(organizationId?: string, activityId?: string) {
  return useQuery<DocumentTaskOption[]>({
    queryKey: documentKeys.tasks(organizationId, activityId),
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId || !isSupabaseConfigured) {
        return [];
      }

      let query = (supabase.from('tasks') as any)
        .select('id, title, activity_id')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (activityId && activityId !== 'all') {
        query = query.eq('activity_id', activityId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks for documents:', error);
        return [];
      }

      return (data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        activityId: t.activity_id,
      }));
    },
  });
}

/**
 * Fetch members for dropdown selection
 */
export function useDocumentMembers(organizationId?: string) {
  return useQuery<DocumentMemberOption[]>({
    queryKey: documentKeys.members(organizationId),
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId || !isSupabaseConfigured) {
        return [];
      }

      const { data, error } = await (supabase.from('members') as any)
        .select('id, full_name, student_id, position')
        .eq('organization_id', organizationId)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching members for documents:', error);
        return [];
      }

      return (data || []).map((m: any) => ({
        id: m.id,
        fullName: m.full_name,
        studentId: m.student_id,
        position: m.position,
      }));
    },
  });
}
