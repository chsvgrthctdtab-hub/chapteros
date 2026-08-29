import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planRepository, type PlanFilterParams, type DbPlanInsert, type DbPlanUpdate } from '@/repositories/plan.repository';
import { collabKeys } from './collab.queries';
import type { Plan, Activity } from '@/types';

export const planKeys = {
  all: ['plans'] as const,
  lists: () => [...planKeys.all, 'list'] as const,
  list: (orgIds: string[], params: PlanFilterParams) =>
    [...planKeys.lists(), orgIds, params] as const,
  details: () => [...planKeys.all, 'detail'] as const,
  detail: (id: string) => [...planKeys.details(), id] as const,
  activities: (planId: string) => [...planKeys.detail(planId), 'activities'] as const,
};

/**
 * Hook to fetch plans for the user's current/associated organizations
 */
export function usePlansList(organizationIds: string[], params: PlanFilterParams = {}) {
  return useQuery<Plan[]>({
    queryKey: planKeys.list(organizationIds, params),
    queryFn: async () => {
      if (!organizationIds.length) return [];
      return planRepository.listPlans(organizationIds, params);
    },
    enabled: organizationIds.length > 0,
    staleTime: 1000 * 20,
  });
}

/**
 * Hook to fetch single plan detail
 */
export function usePlanDetail(planId?: string) {
  return useQuery<Plan | null>({
    queryKey: planKeys.detail(planId || ''),
    queryFn: async () => {
      if (!planId) return null;
      return planRepository.getPlanDetail(planId);
    },
    enabled: Boolean(planId),
  });
}

/**
 * Hook to fetch activities belonging to a plan
 */
export function usePlanActivities(planId?: string) {
  return useQuery<Activity[]>({
    queryKey: planKeys.activities(planId || ''),
    queryFn: async () => {
      if (!planId) return [];
      return planRepository.getPlanActivities(planId);
    },
    enabled: Boolean(planId),
  });
}

/**
 * Hook to create a plan
 */
export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload }: { payload: DbPlanInsert }) => {
      return planRepository.createPlan(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

/**
 * Hook to update a plan
 */
export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: DbPlanUpdate }) => {
      return planRepository.updatePlan(id, payload);
    },
    onSuccess: (updatedPlan) => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
      queryClient.setQueryData(planKeys.detail(updatedPlan.id), updatedPlan);
    },
  });
}

/**
 * Hook to delete a plan
 */
export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return planRepository.deletePlan(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

/**
 * Hook to add cohost org (invite with status = pending)
 */
export function useAddCohost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      organizationId,
      roleDescription,
      roleInPlan,
    }: {
      planId: string;
      organizationId: string;
      roleDescription?: string;
      roleInPlan?: 'co_host' | 'partner' | 'supporter' | 'observer';
    }) => {
      return planRepository.addCohost(planId, organizationId, roleDescription, roleInPlan);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.planId) });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
  });
}

/**
 * Hook to accept plan invitation
 */
export function useAcceptPlanInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      organizationId,
    }: {
      planId: string;
      organizationId: string;
    }) => {
      return planRepository.acceptPlanInvitation(planId, organizationId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.planId) });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: collabKeys.personnel(variables.planId) });
      queryClient.invalidateQueries({ queryKey: collabKeys.activities(variables.planId) });
      queryClient.invalidateQueries({ queryKey: collabKeys.tasks(variables.planId) });
      queryClient.invalidateQueries({ queryKey: collabKeys.transactions(variables.planId) });
    },
  });
}

/**
 * Hook to reject plan invitation
 */
export function useRejectPlanInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      organizationId,
    }: {
      planId: string;
      organizationId: string;
    }) => {
      return planRepository.rejectPlanInvitation(planId, organizationId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.planId) });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: collabKeys.personnel(variables.planId) });
      queryClient.invalidateQueries({ queryKey: collabKeys.activities(variables.planId) });
      queryClient.invalidateQueries({ queryKey: collabKeys.tasks(variables.planId) });
      queryClient.invalidateQueries({ queryKey: collabKeys.transactions(variables.planId) });
    },
  });
}

/**
 * Hook to remove cohost org
 */
export function useRemoveCohost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      organizationId,
    }: {
      planId: string;
      organizationId: string;
    }) => {
      return planRepository.removeCohost(planId, organizationId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.planId) });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: collabKeys.personnel(variables.planId) });
      queryClient.invalidateQueries({ queryKey: collabKeys.activities(variables.planId) });
      queryClient.invalidateQueries({ queryKey: collabKeys.tasks(variables.planId) });
      queryClient.invalidateQueries({ queryKey: collabKeys.transactions(variables.planId) });
    },
  });
}
