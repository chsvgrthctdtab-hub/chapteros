import { useQuery } from '@tanstack/react-query';
import { googleFormsService } from './google-forms.service';
import type { FormResponseFilterParams } from './google-forms.types';

export const googleFormsKeys = {
  all: ['activity_forms'] as const,
  activityForms: (activityId?: string) => ['activity_forms', 'activity', activityId] as const,
  primaryForm: (activityId?: string) => ['activity_forms', 'primary', activityId] as const,
  responses: (formId?: string, params?: FormResponseFilterParams) =>
    ['activity_forms', 'responses', formId, params] as const,
};

export function useActivityForms(activityId?: string) {
  return useQuery({
    queryKey: googleFormsKeys.activityForms(activityId),
    queryFn: () => {
      if (!activityId) return Promise.resolve([]);
      return googleFormsService.getActivityForms(activityId);
    },
    enabled: !!activityId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function usePrimaryActivityForm(activityId?: string) {
  return useQuery({
    queryKey: googleFormsKeys.primaryForm(activityId),
    queryFn: () => {
      if (!activityId) return Promise.resolve(null);
      return googleFormsService.getPrimaryForm(activityId);
    },
    enabled: !!activityId,
    staleTime: 1000 * 30,
  });
}

export function useFormResponses(formId?: string, params?: FormResponseFilterParams) {
  return useQuery({
    queryKey: googleFormsKeys.responses(formId, params),
    queryFn: () => {
      if (!formId) return Promise.resolve({ data: [], total: 0 });
      return googleFormsService.getFormResponses(formId, params);
    },
    enabled: !!formId,
    staleTime: 1000 * 15,
  });
}
