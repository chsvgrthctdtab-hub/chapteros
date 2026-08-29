import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import type {
  TaskListItem,
  TaskDetail,
  TaskFilterParams,
  TaskStats,
  TaskAssigneeOption,
} from '../types/task.types';
import type { Term, Activity } from '@/types';
import type { TasksListResponse } from '@/repositories/task.repository';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: (orgId?: string) => (orgId ? [...taskKeys.all, 'list', orgId] as const : [...taskKeys.all, 'list'] as const),
  list: (orgId: string, params: TaskFilterParams) =>
    [...taskKeys.lists(orgId), params] as const,
  details: (orgId?: string) => (orgId ? [...taskKeys.all, 'detail', orgId] as const : [...taskKeys.all, 'detail'] as const),
  detail: (orgId: string, taskId: string) => [...taskKeys.details(orgId), taskId] as const,
  byActivity: (orgId: string, activityId: string) => [...taskKeys.all, 'by-activity', orgId, activityId] as const,
  stats: (orgId: string, termId?: string) => [...taskKeys.all, 'stats', orgId, termId || 'all'] as const,
  assignees: (orgId: string) => [...taskKeys.all, 'assignees', orgId] as const,
  activities: (orgId: string, termId?: string) =>
    [...taskKeys.all, 'activities', orgId, termId || 'all'] as const,
  terms: (orgId: string) => ['terms', 'org', orgId] as const,
};

export type { TasksListResponse };

/**
 * Fetch paginated & filtered tasks via taskService
 */
export function useTasksList(organizationId?: string, params: TaskFilterParams = {}) {
  return useQuery<TasksListResponse>({
    queryKey: taskKeys.list(organizationId || '', params),
    queryFn: async () => {
      if (!organizationId) {
        return { data: [], totalCount: 0, page: 1, pageSize: params.pageSize || 15, totalPages: 0 };
      }
      return taskService.listTasks(organizationId, params);
    },
    enabled: Boolean(organizationId),
  });
}

/**
 * Fetch task detail by ID (tenant-scoped)
 */
export function useTaskDetail(taskId?: string, organizationId?: string) {
  return useQuery<TaskDetail | null>({
    queryKey: taskKeys.detail(organizationId || '', taskId || ''),
    queryFn: async () => {
      if (!taskId || !organizationId) return null;
      return taskService.getTaskById(taskId, organizationId);
    },
    enabled: Boolean(taskId && organizationId),
  });
}

/**
 * Fetch tasks for a specific activity
 */
export function useTasksByActivity(activityId?: string, organizationId?: string) {
  return useQuery<TaskListItem[]>({
    queryKey: taskKeys.byActivity(organizationId || '', activityId || ''),
    queryFn: async () => {
      if (!activityId) return [];
      return taskService.getTasksByActivity(activityId, organizationId);
    },
    enabled: Boolean(activityId),
  });
}

/**
 * Fetch task statistics for dashboard preparation / KPI overview
 */
export function useTaskStats(organizationId?: string, termId?: string) {
  return useQuery<TaskStats>({
    queryKey: taskKeys.stats(organizationId || '', termId),
    queryFn: async () => {
      if (!organizationId) {
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
      return taskService.getTaskStats(organizationId, termId);
    },
    enabled: Boolean(organizationId),
  });
}

/**
 * Fetch available assignees in the organization (Profiles from memberships + members roster)
 */
export function useTaskAssignees(organizationId?: string) {
  return useQuery<TaskAssigneeOption[]>({
    queryKey: taskKeys.assignees(organizationId || ''),
    queryFn: async () => {
      if (!organizationId) return [];
      return taskService.getTaskAssignees(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}

/**
 * Fetch available activities for task linking
 */
export function useTaskActivities(organizationId?: string, termId?: string) {
  return useQuery<Activity[]>({
    queryKey: taskKeys.activities(organizationId || '', termId),
    queryFn: async () => {
      if (!organizationId) return [];
      return taskService.getTaskActivities(organizationId, termId);
    },
    enabled: Boolean(organizationId),
  });
}

/**
 * Fetch terms for task filters and selector
 */
export function useTaskTerms(organizationId?: string) {
  return useQuery<Term[]>({
    queryKey: taskKeys.terms(organizationId || ''),
    queryFn: async () => {
      if (!organizationId) return [];
      return taskService.getTaskTerms(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}
