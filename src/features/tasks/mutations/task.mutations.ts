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
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(variables.organizationId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats(variables.organizationId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'active' });
      if (variables.data.activityId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byActivity(variables.organizationId, variables.data.activityId),
          refetchType: 'active',
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
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(variables.organizationId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.organizationId, variables.taskId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats(variables.organizationId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'active' });
      if (variables.data.activityId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byActivity(variables.organizationId, variables.data.activityId),
          refetchType: 'active',
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
    onMutate: async ({ taskId, organizationId, status, progress }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(organizationId, taskId) });
      const previousTask = queryClient.getQueryData(taskKeys.detail(organizationId, taskId));

      if (previousTask) {
        queryClient.setQueryData(taskKeys.detail(organizationId, taskId), (old: any) => {
          if (!old) return old;
          const nextProgress = progress !== undefined ? progress : (status === 'completed' ? 100 : (status === 'todo' ? 0 : old.progress));
          return {
            ...old,
            status,
            progress: nextProgress,
          };
        });
      }

      return { previousTask };
    },
    onError: (_err, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(variables.organizationId, variables.taskId), context.previousTask);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(variables.organizationId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.organizationId, variables.taskId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats(variables.organizationId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'active' });
      if (variables.activityId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byActivity(variables.organizationId, variables.activityId),
          refetchType: 'active',
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
    onMutate: async ({ taskId, organizationId, progress, status }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(organizationId, taskId) });
      const previousTask = queryClient.getQueryData(taskKeys.detail(organizationId, taskId));

      if (previousTask) {
        queryClient.setQueryData(taskKeys.detail(organizationId, taskId), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            progress,
            status: status || (progress === 100 ? 'completed' : old.status),
          };
        });
      }

      return { previousTask };
    },
    onError: (_err, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(variables.organizationId, variables.taskId), context.previousTask);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(variables.organizationId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.organizationId, variables.taskId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats(variables.organizationId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'active' });
      if (variables.activityId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byActivity(variables.organizationId, variables.activityId),
          refetchType: 'active',
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
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(variables.organizationId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats(variables.organizationId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'active' });
      if (variables.activityId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byActivity(variables.organizationId, variables.activityId),
          refetchType: 'active',
        });
      }
    },
  });
}
