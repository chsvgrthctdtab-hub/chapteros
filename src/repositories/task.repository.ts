import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { Task, TaskStatus, TaskPriority, Profile, Activity, Term, Member } from '@/types';
import type {
  TaskListItem,
  TaskDetail,
  TaskFilterParams,
  TaskStats,
  TaskAssigneeOption,
} from '@/features/tasks/types/task.types';
import { isTaskOverdue } from '@/features/tasks/types/task.types';

export type DbTask = Database['public']['Tables']['tasks']['Row'];
export type DbTaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type DbTaskUpdate = Database['public']['Tables']['tasks']['Update'];
type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbActivity = Database['public']['Tables']['activities']['Row'];
type DbTerm = Database['public']['Tables']['terms']['Row'];
type DbMember = Database['public']['Tables']['members']['Row'];

export interface TasksListResponse {
  data: TaskListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TaskFilterOptions {
  organizationId: string;
  termId?: string;
  activityId?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  search?: string;
  onlyOverdue?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'due_date' | 'created_at' | 'priority' | 'progress' | 'title';
  sortOrder?: 'asc' | 'desc';
}

function mapTaskFromDb(
  row: DbTask & { assignee?: DbProfile | null; activity?: DbActivity | null }
): Task {
  return {
    id: row.id,
    organizationId: row.organization_id,
    termId: row.term_id,
    activityId: row.activity_id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    progress: row.progress,
    dueDate: row.due_date,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignee: row.assignee
      ? {
          id: row.assignee.id,
          fullName: row.assignee.full_name,
          email: row.assignee.email,
          avatarUrl: row.assignee.avatar_url,
          phone: row.assignee.phone,
          studentId: row.assignee.student_id,
          createdAt: row.assignee.created_at,
          updatedAt: row.assignee.updated_at,
        }
      : undefined,
    activity: row.activity
      ? {
          id: row.activity.id,
          organizationId: row.activity.organization_id,
          termId: row.activity.term_id,
          code: row.activity.code,
          title: row.activity.title,
          description: row.activity.description,
          category: row.activity.category as Task['activity'] extends { category: infer C } ? C : never,
          status: row.activity.status as Task['activity'] extends { status: infer S } ? S : never,
          location: row.activity.location,
          startDate: row.activity.start_date,
          endDate: row.activity.end_date,
          targetMembers: row.activity.target_members,
          bannerUrl: row.activity.banner_url,
          createdBy: row.activity.created_by,
          createdAt: row.activity.created_at,
          updatedAt: row.activity.updated_at,
        }
      : undefined,
  };
}

interface RawTaskRow extends DbTask {
  term?: {
    id: string;
    name: string;
    is_current: boolean;
  } | null;
  activity?: {
    id: string;
    code: string | null;
    title: string;
    category: string;
    status: string;
    start_date?: string;
    end_date?: string;
  } | null;
  assignee?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    student_id: string | null;
    phone: string | null;
  } | null;
  creator?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

function mapRawToTaskListItem(row: RawTaskRow): TaskListItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    termId: row.term_id,
    activityId: row.activity_id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    progress: row.progress || 0,
    dueDate: row.due_date,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isOverdue: isTaskOverdue(row.due_date, row.status as TaskStatus),
    term: row.term
      ? {
          id: row.term.id,
          name: row.term.name,
          isCurrent: row.term.is_current,
        }
      : undefined,
    activity: row.activity
      ? {
          id: row.activity.id,
          code: row.activity.code,
          title: row.activity.title,
          category: row.activity.category,
          status: row.activity.status,
          planId: null,
          plan: null,
        }
      : null,
    assignee: row.assignee
      ? {
          id: row.assignee.id,
          fullName: row.assignee.full_name,
          email: row.assignee.email,
          avatarUrl: row.assignee.avatar_url,
          studentId: row.assignee.student_id,
          phone: row.assignee.phone,
          createdAt: '',
          updatedAt: '',
        }
      : null,
    creator: row.creator
      ? {
          id: row.creator.id,
          fullName: row.creator.full_name,
          email: row.creator.email,
          avatarUrl: row.creator.avatar_url,
          createdAt: '',
          updatedAt: '',
        }
      : null,
  };
}

export const taskRepository = {
  /**
   * Fetch paginated and filtered tasks for an organization
   */
  async getTasks(
    organizationId: string,
    params: TaskFilterParams = {}
  ): Promise<TasksListResponse> {
    if (!isSupabaseConfigured || !organizationId) {
      return { data: [], totalCount: 0, page: 1, pageSize: params.pageSize || 15, totalPages: 0 };
    }

    const {
      search = '',
      status = 'all',
      priority = 'all',
      termId = 'all',
      activityId = 'all',
      assignedTo = 'all',
      onlyOverdue = false,
      page = 1,
      pageSize = 15,
      sortBy = 'due_date',
      sortOrder = 'asc',
    } = params;

    let query = supabase
      .from('tasks')
      .select(
        `
        id,
        organization_id,
        term_id,
        activity_id,
        title,
        description,
        status,
        priority,
        progress,
        due_date,
        assigned_to,
        created_by,
        created_at,
        updated_at,
        term:terms (
          id,
          name,
          is_current
        ),
        activity:activities (
          id,
          code,
          title,
          category,
          status
        ),
        assignee:profiles!tasks_assigned_to_fkey (
          id,
          full_name,
          email,
          avatar_url,
          student_id,
          phone
        ),
        creator:profiles!tasks_created_by_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      `,
        { count: 'exact' }
      )
      .eq('organization_id', organizationId);

    // Search by title or description
    if (search.trim()) {
      const sanitized = search.trim();
      query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
    }

    // Status filter
    if (status !== 'all') {
      query = query.eq('status', status as TaskStatus);
    }

    // Priority filter
    if (priority !== 'all') {
      query = query.eq('priority', priority as TaskPriority);
    }

    // Term filter
    if (termId !== 'all') {
      query = query.eq('term_id', termId);
    }

    // Activity filter
    if (activityId === 'standalone' || activityId === 'none') {
      query = query.is('activity_id', null);
    } else if (activityId !== 'all') {
      query = query.eq('activity_id', activityId);
    }

    // Assignee filter
    if (assignedTo === 'unassigned') {
      query = query.is('assigned_to', null);
    } else if (assignedTo !== 'all') {
      query = query.eq('assigned_to', assignedTo);
    }

    // Overdue filter
    if (onlyOverdue) {
      const nowIso = new Date().toISOString();
      query = query
        .lt('due_date', nowIso)
        .not('status', 'in', '("completed","cancelled")');
    }

    // Sorting
    const isAsc = sortOrder === 'asc';
    if (sortBy === 'due_date') {
      query = query.order('due_date', { ascending: isAsc, nullsFirst: false });
    } else if (sortBy === 'priority') {
      query = query.order('priority', { ascending: isAsc });
    } else if (sortBy === 'progress') {
      query = query.order('progress', { ascending: isAsc });
    } else if (sortBy === 'title') {
      query = query.order('title', { ascending: isAsc });
    } else {
      query = query.order('created_at', { ascending: isAsc });
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(error.message || 'Không thể tải danh sách công việc');
    }

    const rows = (data || []) as unknown as RawTaskRow[];
    const formatted: TaskListItem[] = rows.map(mapRawToTaskListItem);
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: formatted,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  /**
   * Fetch single task details by ID (optionally scoped by organization)
   */
  async getById(id: string, organizationId?: string): Promise<TaskDetail | null> {
    if (!isSupabaseConfigured || !id) return null;

    let query = supabase
      .from('tasks')
      .select(
        `
        id,
        organization_id,
        term_id,
        activity_id,
        title,
        description,
        status,
        priority,
        progress,
        due_date,
        assigned_to,
        created_by,
        created_at,
        updated_at,
        term:terms (
          id,
          name,
          is_current
        ),
        activity:activities (
          id,
          code,
          title,
          category,
          status,
          start_date,
          end_date
        ),
        assignee:profiles!tasks_assigned_to_fkey (
          id,
          full_name,
          email,
          avatar_url,
          student_id,
          phone
        ),
        creator:profiles!tasks_created_by_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      `
      )
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(error.message || 'Không tìm thấy thông tin công việc');
    }

    if (!data) return null;

    const row = data as unknown as RawTaskRow;

    // Look up member details if assignee exists
    let memberDetails: Member | null = null;
    if (row.assigned_to) {
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('organization_id', row.organization_id)
        .eq('user_id', row.assigned_to)
        .maybeSingle();

      if (memberData) {
        const m = memberData as unknown as DbMember;
        memberDetails = {
          id: m.id,
          organizationId: m.organization_id,
          userId: m.user_id,
          studentId: m.student_id,
          fullName: m.full_name,
          email: m.email,
          phone: m.phone,
          className: m.class_name,
          major: m.major,
          cohort: m.cohort,
          position: m.position,
          status: m.status as Member['status'],
          joinedDate: m.joined_date,
          notes: m.notes,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
        };
      }
    }

    return {
      ...mapRawToTaskListItem(row),
      memberDetails,
    };
  },

  /**
   * Insert a new task
   */
  async create(payload: DbTaskInsert): Promise<Task> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình');
    const { data, error } = await supabase
      .from('tasks')
      .insert(payload as never)
      .select()
      .single();

    if (error) throw new Error(error.message || 'Không thể tạo công việc mới');
    return mapTaskFromDb(data as DbTask);
  },

  /**
   * Update an existing task
   */
  async update(id: string, payload: DbTaskUpdate, organizationId?: string): Promise<Task> {
    if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình');

    let query = supabase
      .from('tasks')
      .update(payload as never)
      .eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.select().single();

    if (error) throw new Error(error.message || 'Không thể cập nhật công việc');
    return mapTaskFromDb(data as DbTask);
  },

  /**
   * Delete a task
   */
  async delete(id: string, organizationId?: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    let query = supabase.from('tasks').delete().eq('id', id);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { error } = await query;
    if (error) throw new Error(error.message || 'Không thể xóa công việc');
  },

  /**
   * Get task statistics for KPI overview / dashboard
   */
  async getStats(organizationId: string, termId?: string): Promise<TaskStats> {
    if (!isSupabaseConfigured || !organizationId) {
      return {
        total: 0,
        todo: 0,
        inProgress: 0,
        inReview: 0,
        completed: 0,
        cancelled: 0,
        overdue: 0,
        highOrUrgent: 0,
        completionRate: 0,
      };
    }

    let query = supabase
      .from('tasks')
      .select('id, status, priority, due_date')
      .eq('organization_id', organizationId);

    if (termId && termId !== 'all') {
      query = query.eq('term_id', termId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message || 'Không thể tải thống kê công việc');
    }

    interface StatItem {
      id: string;
      status: TaskStatus;
      priority: string;
      due_date: string | null;
    }

    const items = (data || []) as unknown as StatItem[];
    let todo = 0;
    let inProgress = 0;
    let inReview = 0;
    let completed = 0;
    let cancelled = 0;
    let overdue = 0;
    let highOrUrgent = 0;

    items.forEach((item) => {
      if (item.status === 'todo') todo++;
      else if (item.status === 'in_progress') inProgress++;
      else if (item.status === 'in_review') inReview++;
      else if (item.status === 'completed') completed++;
      else if (item.status === 'cancelled') cancelled++;

      if (item.priority === 'high' || item.priority === 'urgent') {
        highOrUrgent++;
      }

      if (isTaskOverdue(item.due_date, item.status)) {
        overdue++;
      }
    });

    const total = items.length;
    const nonCancelled = total - cancelled;
    const completionRate = nonCancelled > 0 ? Math.round((completed / nonCancelled) * 100) : 0;

    return {
      total,
      todo,
      inProgress,
      inReview,
      completed,
      cancelled,
      overdue,
      highOrUrgent,
      completionRate,
    };
  },

  /**
   * Fetch tasks for a specific activity
   */
  async getTasksByActivity(activityId: string, organizationId?: string): Promise<TaskListItem[]> {
    if (!isSupabaseConfigured || !activityId) return [];

    let query = supabase
      .from('tasks')
      .select(
        `
        id,
        organization_id,
        term_id,
        activity_id,
        title,
        description,
        status,
        priority,
        progress,
        due_date,
        assigned_to,
        created_by,
        created_at,
        updated_at,
        assignee:profiles!tasks_assigned_to_fkey (
          id,
          full_name,
          email,
          avatar_url,
          student_id,
          phone
        ),
        creator:profiles!tasks_created_by_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      `
      )
      .eq('activity_id', activityId);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    query = query.order('due_date', { ascending: true, nullsFirst: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message || 'Không thể tải danh sách công việc của hoạt động');
    }

    const rows = (data || []) as unknown as RawTaskRow[];
    return rows.map(mapRawToTaskListItem);
  },

  /**
   * Fetch active members/profiles in organization for task assignment
   */
  async getAssignees(organizationId: string): Promise<TaskAssigneeOption[]> {
    if (!isSupabaseConfigured || !organizationId) return [];

    // 1. Fetch organization memberships with profile
    const { data: memberships, error: memError } = await supabase
      .from('organization_memberships')
      .select(
        `
        id,
        user_id,
        role,
        status,
        profile:profiles (
          id,
          full_name,
          email,
          avatar_url,
          student_id,
          phone
        )
      `
      )
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (memError) {
      throw new Error(memError.message || 'Không thể tải danh sách người thực hiện');
    }

    // 2. Fetch members roster to enrich info
    const { data: memberRoster } = await supabase
      .from('members')
      .select('user_id, student_id, full_name, email, position, class_name')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    interface MemberRosterItem {
      user_id: string | null;
      student_id: string;
      full_name: string;
      email: string | null;
      position: string | null;
      class_name: string | null;
    }

    const rosterList = (memberRoster || []) as unknown as MemberRosterItem[];
    const memberMap = new Map<string, MemberRosterItem>();
    rosterList.forEach((m) => {
      if (m.user_id) memberMap.set(m.user_id, m);
    });

    interface MembershipWithProfile {
      id: string;
      user_id: string;
      role: string;
      status: string;
      profile: {
        id: string;
        full_name: string;
        email: string;
        avatar_url: string | null;
        student_id: string | null;
        phone: string | null;
      } | null;
    }

    const mList = (memberships || []) as unknown as MembershipWithProfile[];
    const assignees: TaskAssigneeOption[] = [];
    const seen = new Set<string>();

    mList.forEach((m) => {
      if (m.profile && !seen.has(m.profile.id)) {
        seen.add(m.profile.id);
        const rosterInfo = memberMap.get(m.user_id);
        assignees.push({
          userId: m.user_id,
          profileId: m.profile.id,
          fullName: m.profile.full_name || rosterInfo?.full_name || 'Hội viên',
          email: m.profile.email || rosterInfo?.email || '',
          avatarUrl: m.profile.avatar_url,
          studentId: m.profile.student_id || rosterInfo?.student_id,
          phone: m.profile.phone,
          position: rosterInfo?.position || m.role,
          role: m.role,
        });
      }
    });

    return assignees.sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));
  },

  /**
   * Fetch activities for dropdown selection / linking
   */
  async getActivities(organizationId: string, termId?: string): Promise<Activity[]> {
    if (!isSupabaseConfigured || !organizationId) return [];

    let query = supabase
      .from('activities')
      .select('id, organization_id, term_id, code, title, category, status, start_date, end_date')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: false });

    if (termId && termId !== 'all') {
      query = query.eq('term_id', termId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message || 'Không thể tải danh sách hoạt động');
    }

    const rows = (data || []) as unknown as DbActivity[];
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      termId: row.term_id,
      code: row.code,
      title: row.title,
      category: row.category as Activity['category'],
      status: row.status as Activity['status'],
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: '',
      updatedAt: '',
    }));
  },

  /**
   * Fetch terms for dropdown selection
   */
  async getTerms(organizationId: string): Promise<Term[]> {
    if (!isSupabaseConfigured || !organizationId) return [];

    const { data, error } = await supabase
      .from('terms')
      .select('id, organization_id, name, start_date, end_date, status, is_current, created_at, updated_at')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Không thể tải danh sách nhiệm kỳ');
    }

    const rows = (data || []) as unknown as DbTerm[];
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status as Term['status'],
      isCurrent: row.is_current,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  /**
   * Validate that an assignee profile ID belongs to an active membership in the organization
   */
  async validateAssigneeMembership(organizationId: string, assignedToProfileId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !organizationId || !assignedToProfileId) return false;

    // Check profiles.id === assignedToProfileId AND organization_memberships.user_id === assignedToProfileId AND organization_id === organizationId AND status === 'active'
    const { data, error } = await supabase
      .from('organization_memberships')
      .select('id, user_id, status')
      .eq('organization_id', organizationId)
      .eq('user_id', assignedToProfileId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) return false;
    return true;
  },
};
