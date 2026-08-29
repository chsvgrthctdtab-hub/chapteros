import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collabRepository,
  type DbCollabActivityInsert,
  type DbCollabActivityUpdate,
  type DbCollabTaskInsert,
  type DbCollabTaskUpdate,
  type DbCollabTransactionInsert,
  type DbCollabTransactionUpdate,
} from '@/repositories/collab.repository';
import type {
  CollabActivity,
  CollabTask,
  CollabTransaction,
  CollabMemberOption,
} from '@/types';

export const collabKeys = {
  all: ['collab'] as const,
  activities: (planId: string) => [...collabKeys.all, 'activities', planId] as const,
  activityDetail: (activityId: string) => [...collabKeys.all, 'activity', activityId] as const,
  tasks: (planId: string, activityId?: string) =>
    [...collabKeys.all, 'tasks', planId, activityId || 'all'] as const,
  transactions: (planId: string, activityId?: string) =>
    [...collabKeys.all, 'transactions', planId, activityId || 'all'] as const,
  personnel: (planId: string) => [...collabKeys.all, 'personnel', planId] as const,
  participants: (activityId?: string, planId?: string) =>
    [...collabKeys.all, 'participants', activityId || 'all', planId || 'all'] as const,
};

// ==========================================
// 1. COLLAB ACTIVITIES HOOKS
// ==========================================
export function useCollabActivities(planId?: string) {
  return useQuery<CollabActivity[]>({
    queryKey: planId ? collabKeys.activities(planId) : ['collab', 'activities', 'none'],
    queryFn: async () => {
      if (!planId) return [];
      return collabRepository.listCollabActivities(planId);
    },
    enabled: !!planId,
    staleTime: 1000 * 20, // 20s
  });
}

export function useCollabActivityDetail(activityId?: string) {
  return useQuery<CollabActivity | null>({
    queryKey: activityId ? collabKeys.activityDetail(activityId) : ['collab', 'activity', 'none'],
    queryFn: async () => {
      if (!activityId) return null;
      return collabRepository.getCollabActivityDetail(activityId);
    },
    enabled: !!activityId,
  });
}

export function useCreateCollabActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload }: { payload: DbCollabActivityInsert }) => {
      return collabRepository.createCollabActivity(payload);
    },
    onSuccess: (data) => {
      if (data?.planId) {
        queryClient.invalidateQueries({ queryKey: collabKeys.activities(data.planId) });
      }
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useUpdateCollabActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: DbCollabActivityUpdate }) => {
      return collabRepository.updateCollabActivity(id, payload);
    },
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: collabKeys.activityDetail(data.id) });
      }
      if (data?.planId) {
        queryClient.invalidateQueries({ queryKey: collabKeys.activities(data.planId) });
      }
    },
  });
}

export function useDeleteCollabActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, planId }: { id: string; planId: string }) => {
      await collabRepository.deleteCollabActivity(id);
      return { id, planId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.activities(variables.planId) });
    },
  });
}

// ==========================================
// 2. COLLAB TASKS HOOKS (WITH 0ms OPTIMISTIC UI)
// ==========================================
export function useCollabTasks(planId?: string, collabActivityId?: string) {
  return useQuery<CollabTask[]>({
    queryKey: planId ? collabKeys.tasks(planId, collabActivityId) : ['collab', 'tasks', 'none'],
    queryFn: async () => {
      if (!planId) return [];
      return collabRepository.listCollabTasks(planId, collabActivityId);
    },
    enabled: !!planId,
    staleTime: 1000 * 15,
  });
}

export function useCreateCollabTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload }: { payload: DbCollabTaskInsert }) => {
      return collabRepository.createCollabTask(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collab', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['collab', 'activities'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      if (data?.planId) {
        queryClient.invalidateQueries({ queryKey: collabKeys.tasks(data.planId) });
        queryClient.invalidateQueries({ queryKey: collabKeys.activities(data.planId) });
      }
    },
  });
}

export function useUpdateCollabTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: DbCollabTaskUpdate }) => {
      return collabRepository.updateCollabTask(id, payload);
    },
    onMutate: async ({ id, payload }) => {
      // 1. Cancel ongoing task queries
      await queryClient.cancelQueries({ queryKey: ['collab', 'tasks'] });

      // 2. Snapshot previous tasks for rollback
      const previousTasksQueries = queryClient.getQueriesData({ queryKey: ['collab', 'tasks'] });

      // 3. Optimistically update all matching task lists (0ms instant response)
      queryClient.setQueriesData({ queryKey: ['collab', 'tasks'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: CollabTask) => {
          if (t.id !== id) return t;
          return {
            ...t,
            ...payload,
            status: payload.status !== undefined ? (payload.status as any) : t.status,
            priority: payload.priority !== undefined ? (payload.priority as any) : t.priority,
            assignedTo: payload.assigned_to !== undefined ? payload.assigned_to : t.assignedTo,
            organizationId: payload.organization_id !== undefined ? payload.organization_id : t.organizationId,
            dueDate: payload.due_date !== undefined ? payload.due_date : t.dueDate,
          };
        });
      });

      return { previousTasksQueries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasksQueries) {
        context.previousTasksQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collab', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['collab', 'activities'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      if (data?.planId) {
        queryClient.invalidateQueries({ queryKey: collabKeys.tasks(data.planId) });
        queryClient.invalidateQueries({ queryKey: collabKeys.activities(data.planId) });
      }
    },
  });
}

export function useDeleteCollabTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, planId, collabActivityId }: { id: string; planId: string; collabActivityId?: string }) => {
      await collabRepository.deleteCollabTask(id);
      return { id, planId, collabActivityId };
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['collab', 'tasks'] });
      const previousTasksQueries = queryClient.getQueriesData({ queryKey: ['collab', 'tasks'] });

      queryClient.setQueriesData({ queryKey: ['collab', 'tasks'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.filter((t: CollabTask) => t.id !== id);
      });

      return { previousTasksQueries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasksQueries) {
        context.previousTasksQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collab', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['collab', 'activities'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      if (variables?.planId) {
        queryClient.invalidateQueries({ queryKey: collabKeys.tasks(variables.planId) });
        queryClient.invalidateQueries({ queryKey: collabKeys.activities(variables.planId) });
      }
    },
  });
}

// ==========================================
// 3. COLLAB TRANSACTIONS (FINANCE & FUNDING)
// ==========================================
export function useCollabTransactions(planId?: string, collabActivityId?: string) {
  return useQuery<CollabTransaction[]>({
    queryKey: planId ? collabKeys.transactions(planId, collabActivityId) : ['collab', 'finance', 'none'],
    queryFn: async () => {
      if (!planId) return [];
      return collabRepository.listCollabTransactions(planId, collabActivityId);
    },
    enabled: !!planId,
    staleTime: 1000 * 20,
  });
}

export function useCreateCollabTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload }: { payload: DbCollabTransactionInsert }) => {
      return collabRepository.createCollabTransaction(payload);
    },
    onSuccess: (data) => {
      if (data?.planId) {
        queryClient.invalidateQueries({
          queryKey: collabKeys.transactions(data.planId, data.collabActivityId || undefined),
        });
        queryClient.invalidateQueries({ queryKey: collabKeys.transactions(data.planId) });
      }
    },
  });
}

export function useUpdateCollabTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: DbCollabTransactionUpdate }) => {
      return collabRepository.updateCollabTransaction(id, payload);
    },
    onSuccess: (data) => {
      if (data?.planId) {
        queryClient.invalidateQueries({
          queryKey: collabKeys.transactions(data.planId, data.collabActivityId || undefined),
        });
        queryClient.invalidateQueries({ queryKey: collabKeys.transactions(data.planId) });
      }
    },
  });
}

export function useDeleteCollabTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      planId,
      collabActivityId,
    }: {
      id: string;
      planId: string;
      collabActivityId?: string;
    }) => {
      await collabRepository.deleteCollabTransaction(id);
      return { id, planId, collabActivityId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: collabKeys.transactions(variables.planId, variables.collabActivityId),
      });
      queryClient.invalidateQueries({ queryKey: collabKeys.transactions(variables.planId) });
    },
  });
}

// ==========================================
// 4. CROSS-ORGANIZATION PERSONNEL DIRECTORY
// ==========================================
export function useCollabPlanPersonnel(planId?: string) {
  return useQuery<CollabMemberOption[]>({
    queryKey: planId ? collabKeys.personnel(planId) : ['collab', 'personnel', 'none'],
    queryFn: async () => {
      if (!planId) return [];
      return collabRepository.getCollabPlanPersonnel(planId);
    },
    enabled: !!planId,
    staleTime: 1000 * 60, // 1 min
  });
}

// ==========================================
// 5. COLLAB PARTICIPANTS & ATTENDANCE HOOKS
// ==========================================
export function useCollabParticipants(activityId?: string, planId?: string) {
  return useQuery({
    queryKey: collabKeys.participants(activityId, planId),
    queryFn: async () => {
      return collabRepository.listCollabParticipants(activityId, planId);
    },
    enabled: Boolean(activityId || planId),
    staleTime: 1000 * 15,
  });
}

export function useAddCollabParticipant(activityId?: string, planId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      activityId: string;
      organizationId: string;
      memberId?: string;
      fullName: string;
      studentId?: string;
      className?: string;
      cohort?: string;
      phone?: string;
      email?: string;
      notes?: string;
      attendanceStatus?: string;
    }) => {
      return collabRepository.addCollabParticipant(data.activityId, data.organizationId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collab', 'participants'] });
    },
  });
}

export function useUpdateCollabParticipantStatus(activityId?: string, planId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      participantId,
      data,
    }: {
      participantId: string;
      data: { attendanceStatus?: string; notes?: string };
    }) => {
      return collabRepository.updateCollabParticipant(participantId, data);
    },
    onMutate: async ({ participantId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['collab', 'participants'] });

      const previousQueries = queryClient.getQueriesData({ queryKey: ['collab', 'participants'] });

      queryClient.setQueriesData({ queryKey: ['collab', 'participants'] }, (old: any) => {
        if (!old || !Array.isArray(old.data)) return old;
        const updatedData = old.data.map((p: any) => {
          if (p.id !== participantId) return p;
          return {
            ...p,
            attendanceStatus: data.attendanceStatus ?? p.attendanceStatus,
            notes: data.notes !== undefined ? data.notes : p.notes,
            attendedAt: data.attendanceStatus === 'present' ? new Date().toISOString() : null,
          };
        });

        const present = updatedData.filter((p: any) => p.attendanceStatus === 'present').length;
        const absent = updatedData.filter((p: any) => p.attendanceStatus === 'absent').length;
        const unmarked = updatedData.filter((p: any) => p.attendanceStatus === 'unmarked').length;
        const total = updatedData.length;
        const participationRate = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

        return {
          ...old,
          data: updatedData,
          stats: {
            ...old.stats,
            total,
            present,
            absent,
            unmarked,
            participationRate,
          },
        };
      });

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['collab', 'participants'] });
    },
  });
}

export function useRemoveCollabParticipant(activityId?: string, planId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participantId: string) => {
      return collabRepository.removeCollabParticipant(participantId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collab', 'participants'] });
    },
  });
}

export function useBulkUpdateCollabAttendance(activityId?: string, planId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      participantIds,
      status,
    }: {
      participantIds: string[];
      status: string;
    }) => {
      return collabRepository.bulkUpdateCollabAttendance(participantIds, status);
    },
    onMutate: async ({ participantIds, status }) => {
      await queryClient.cancelQueries({ queryKey: ['collab', 'participants'] });

      const previousQueries = queryClient.getQueriesData({ queryKey: ['collab', 'participants'] });

      queryClient.setQueriesData({ queryKey: ['collab', 'participants'] }, (old: any) => {
        if (!old || !Array.isArray(old.data)) return old;
        const idSet = new Set(participantIds);
        const updatedData = old.data.map((p: any) => {
          if (!idSet.has(p.id)) return p;
          return {
            ...p,
            attendanceStatus: status,
            attendedAt: status === 'present' ? new Date().toISOString() : null,
          };
        });

        const present = updatedData.filter((p: any) => p.attendanceStatus === 'present').length;
        const absent = updatedData.filter((p: any) => p.attendanceStatus === 'absent').length;
        const unmarked = updatedData.filter((p: any) => p.attendanceStatus === 'unmarked').length;
        const total = updatedData.length;
        const participationRate = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

        return {
          ...old,
          data: updatedData,
          stats: {
            ...old.stats,
            total,
            present,
            absent,
            unmarked,
            participationRate,
          },
        };
      });

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['collab', 'participants'] });
    },
  });
}
