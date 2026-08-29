import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import { taskKeys } from '../queries/task.queries';
import type { TaskStatus } from '../types/task.types';
import type { TaskFormData } from '../schemas/task.schema';

interface CreateTaskPayload {
  organizationId: string;
  data: TaskFormData;
  createdBy?: string;
}

interface UpdateTaskPayload {
  taskId: string;
  organizationId: string;
  data: Partial<TaskFormData>;
  updatedBy?: string;
}

interface UpdateTaskStatusPayload {
  taskId: string;
  organizationId: string;
  status: TaskStatus;
  progress?: number;
  activityId?: string | null;
  updatedBy?: string;
  userRole?: string | null;
}

interface UpdateTaskProgressPayload {
  taskId: string;
  organizationId: string;
  progress: number;
  status?: TaskStatus;
  activityId?: string | null;
  updatedBy?: string;
}

interface DeleteTaskPayload {
  taskId: string;
  organizationId: string;
  activityId?: string | null;
  deletedBy?: string;
}

/**
 * Mutation: Create a new task (Standalone or Activity-linked)
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, data, createdBy }: CreateTaskPayload) => {
      return taskService.createTask(organizationId, data, createdBy);
    },
    onSuccess: (createdTask, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'upcoming-tasks', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overdue-tasks', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'charts', variables.organizationId] });
      if (variables.data.activityId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byActivity(variables.organizationId, variables.data.activityId),
        });
      }
    },
  });
}

/**
 * Mutation: Update existing task details
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, organizationId, data, updatedBy }: UpdateTaskPayload) => {
      return taskService.updateTask(taskId, organizationId, data, updatedBy);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.organizationId, variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'upcoming-tasks', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overdue-tasks', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'charts', variables.organizationId] });
      if (variables.data.activityId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byActivity(variables.organizationId, variables.data.activityId),
        });
      }
    },
  });
}

/**
 * Mutation: Fast update status of a task
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, organizationId, status, progress, updatedBy, userRole }: UpdateTaskStatusPayload) => {
      return taskService.updateTaskStatus(taskId, organizationId, status, progress, updatedBy, userRole);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.organizationId, variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'upcoming-tasks', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overdue-tasks', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'charts', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'org', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', variables.organizationId] });
      if (variables.activityId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byActivity(variables.organizationId, variables.activityId),
        });
      }
    },
  });
}

/**
 * Mutation: Fast update progress of a task
 */
export function useUpdateTaskProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, organizationId, progress, status, updatedBy }: UpdateTaskProgressPayload) => {
      return taskService.updateTaskProgress(taskId, organizationId, progress, status, updatedBy);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.organizationId, variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'upcoming-tasks', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overdue-tasks', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'charts', variables.organizationId] });
      if (variables.activityId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byActivity(variables.organizationId, variables.activityId),
        });
      }
    },
  });
}

/**
 * Mutation: Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, organizationId, deletedBy }: DeleteTaskPayload) => {
      await taskService.deleteTask(taskId, organizationId, deletedBy);
      return { success: true, taskId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'upcoming-tasks', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overdue-tasks', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'charts', variables.organizationId] });
      if (variables.activityId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byActivity(variables.organizationId, variables.activityId),
        });
      }
    },
  });
}
