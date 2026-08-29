import { useMutation, useQueryClient } from '@tanstack/react-query';
import { googleFormsService } from './google-forms.service';
import { googleFormsKeys } from './google-forms.queries';
import type {
  CreateActivityFormPayload,
  UpdateActivityFormPayload,
  ManualMatchMemberPayload,
} from './google-forms.types';

export function useCreateOrLinkGoogleForm(activityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateActivityFormPayload) =>
      googleFormsService.createOrLinkGoogleForm(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleFormsKeys.activityForms(activityId) });
      queryClient.invalidateQueries({ queryKey: googleFormsKeys.primaryForm(activityId) });
    },
  });
}

export function useUpdateActivityForm(activityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      formId,
      data,
    }: {
      formId: string;
      data: UpdateActivityFormPayload;
    }) => googleFormsService.updateForm(formId, activityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleFormsKeys.activityForms(activityId) });
      queryClient.invalidateQueries({ queryKey: googleFormsKeys.primaryForm(activityId) });
    },
  });
}

export function useDeleteActivityForm(activityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formId: string) => googleFormsService.deleteForm(formId, activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleFormsKeys.activityForms(activityId) });
      queryClient.invalidateQueries({ queryKey: googleFormsKeys.primaryForm(activityId) });
    },
  });
}

export function useSyncFormResponses(activityId: string, formId: string, orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => googleFormsService.syncFormResponses(formId, activityId, orgId),
    onSuccess: () => {
      // Invalidate form queries
      queryClient.invalidateQueries({ queryKey: googleFormsKeys.activityForms(activityId) });
      queryClient.invalidateQueries({ queryKey: googleFormsKeys.primaryForm(activityId) });
      queryClient.invalidateQueries({ queryKey: ['activity_forms', 'responses', formId] });
      
      // Invalidate ALL activity queries so participant list immediately reflects synced users!
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activity_participants'] });
    },
  });
}

export function useManualMatchMember(activityId: string, formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ManualMatchMemberPayload) =>
      googleFormsService.manualMatchMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_forms', 'responses', formId] });
      queryClient.invalidateQueries({ queryKey: googleFormsKeys.activityForms(activityId) });
      queryClient.invalidateQueries({ queryKey: googleFormsKeys.primaryForm(activityId) });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activity_participants'] });
    },
  });
}

export function useImportFormResponsesCsv(activityId: string, formId: string, orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (csvContent: string) =>
      googleFormsService.importFormResponsesFromCsv(formId, activityId, orgId, csvContent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleFormsKeys.activityForms(activityId) });
      queryClient.invalidateQueries({ queryKey: googleFormsKeys.primaryForm(activityId) });
      queryClient.invalidateQueries({ queryKey: ['activity_forms', 'responses', formId] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activity_participants'] });
    },
  });
}

export function useAttachGoogleSheet(activityId: string, formId: string, orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sheetUrl: string) =>
      googleFormsService.attachGoogleSheet(formId, activityId, orgId, sheetUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: googleFormsKeys.activityForms(activityId) });
      queryClient.invalidateQueries({ queryKey: googleFormsKeys.primaryForm(activityId) });
      queryClient.invalidateQueries({ queryKey: ['activity_forms', 'responses', formId] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activity_participants'] });
    },
  });
}
