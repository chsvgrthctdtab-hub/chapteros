import {
  useTasksList,
  useTaskDetail,
  useTasksByActivity as useTasksByActivityQuery,
  useTaskStats,
  useTaskAssignees,
  useTaskActivities,
  useTaskTerms,
} from '@/features/tasks/queries/task.queries';
import {
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useUpdateTaskProgress,
  useDeleteTask,
} from '@/features/tasks/mutations/task.mutations';
import type {
  TaskFilterParams,
  TaskListItem,
  TaskDetail,
  TaskStats,
  TaskAssigneeOption,
  TaskStatus,
} from '@/features/tasks/types/task.types';
import type { TaskFormData } from '@/features/tasks/schemas/task.schema';

/**
 * Hook to retrieve filtered/paginated tasks for an organization
 */
export function useTasks(organizationId?: string, params: TaskFilterParams = {}) {
  const query = useTasksList(organizationId, params);

  return {
    data: query.data?.data || [],
    totalCount: query.data?.totalCount || 0,
    page: query.data?.page || 1,
    pageSize: query.data?.pageSize || 15,
    totalPages: query.data?.totalPages || 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to retrieve a single task by ID within an organization
 */
export function useTask(taskId?: string, organizationId?: string) {
  const query = useTaskDetail(taskId, organizationId);

  return {
    task: query.data || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to retrieve tasks linked to a specific activity
 */
export function useActivityTasks(activityId?: string, organizationId?: string) {
  const query = useTasksByActivityQuery(activityId, organizationId);

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to retrieve task KPI metrics
 */
export function useTaskKpis(organizationId?: string, termId?: string) {
  const query = useTaskStats(organizationId, termId);

  return {
    stats: query.data || {
      total: 0,
      todo: 0,
      inProgress: 0,
      inReview: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0,
      highOrUrgent: 0,
      completionRate: 0,
    },
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to retrieve assignee options for an organization
 */
export function useAssignees(organizationId?: string) {
  const query = useTaskAssignees(organizationId);

  return {
    assignees: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook providing all mutation operations for task management
 */
export function useTaskMutations(organizationId?: string) {
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const updateStatusMutation = useUpdateTaskStatus();
  const updateProgressMutation = useUpdateTaskProgress();
  const deleteMutation = useDeleteTask();

  return {
    // Actions
    createTask: (data: TaskFormData, createdBy?: string) => {
      if (!organizationId) throw new Error('Organization ID is required');
      return createMutation.mutateAsync({ organizationId, data, createdBy });
    },
    updateTask: (taskId: string, data: Partial<TaskFormData>, updatedBy?: string) => {
      if (!organizationId) throw new Error('Organization ID is required');
      return updateMutation.mutateAsync({ taskId, organizationId, data, updatedBy });
    },
    updateStatus: (taskId: string, status: TaskStatus, progress?: number, activityId?: string | null, updatedBy?: string) => {
      if (!organizationId) throw new Error('Organization ID is required');
      return updateStatusMutation.mutateAsync({ taskId, organizationId, status, progress, activityId, updatedBy });
    },
    updateProgress: (taskId: string, progress: number, status?: TaskStatus, activityId?: string | null, updatedBy?: string) => {
      if (!organizationId) throw new Error('Organization ID is required');
      return updateProgressMutation.mutateAsync({ taskId, organizationId, progress, status, activityId, updatedBy });
    },
    deleteTask: (taskId: string, activityId?: string | null, deletedBy?: string) => {
      if (!organizationId) throw new Error('Organization ID is required');
      return deleteMutation.mutateAsync({ taskId, organizationId, activityId, deletedBy });
    },

    // Status states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isUpdatingProgress: updateProgressMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Errors
    createError: createMutation.error,
    updateError: updateMutation.error,
    updateStatusError: updateStatusMutation.error,
    updateProgressError: updateProgressMutation.error,
    deleteError: deleteMutation.error,
  };
}
