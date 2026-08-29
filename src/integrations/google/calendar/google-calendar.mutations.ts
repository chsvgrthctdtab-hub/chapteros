import { useMutation, useQueryClient } from '@tanstack/react-query';
import { googleCalendarService } from './google-calendar.service';
import { googleCalendarKeys } from './google-calendar.queries';
import type { Activity } from '@/types';
import type {
  CreateCalendarEventParams,
  UpdateCalendarEventParams,
  UnlinkCalendarEventParams,
  DeleteGoogleCalendarEventParams,
} from './google-calendar.types';

/**
 * Mutation to create and project an Activity to Google Calendar
 */
export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      params,
      activity,
      appUrl,
    }: {
      params: CreateCalendarEventParams;
      activity: Activity;
      appUrl?: string;
    }) => {
      const result = await googleCalendarService.createCalendarEvent(params, activity, appUrl);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Không thể tạo sự kiện trên Google Calendar.');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and set cache immediately
      queryClient.setQueryData(
        googleCalendarKeys.activityEvent(variables.params.activityId, variables.params.organizationId),
        data
      );
      queryClient.invalidateQueries({
        queryKey: googleCalendarKeys.activityEvent(variables.params.activityId, variables.params.organizationId),
      });
    },
  });
}

/**
 * Mutation to update an existing Google Calendar event
 */
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      params,
      activity,
      appUrl,
    }: {
      params: UpdateCalendarEventParams;
      activity: Activity;
      appUrl?: string;
    }) => {
      const result = await googleCalendarService.updateCalendarEvent(params, activity, appUrl);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Không thể cập nhật sự kiện Google Calendar.');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        googleCalendarKeys.activityEvent(variables.params.activityId, variables.params.organizationId),
        data
      );
      queryClient.invalidateQueries({
        queryKey: googleCalendarKeys.activityEvent(variables.params.activityId, variables.params.organizationId),
      });
    },
  });
}

/**
 * Mutation to unlink Google Calendar integration without deleting Activity or Google Event
 */
export function useUnlinkCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UnlinkCalendarEventParams) => {
      const result = await googleCalendarService.unlinkCalendarEvent(params);
      if (!result.success) {
        throw new Error(result.error || 'Không thể gỡ liên kết Google Calendar.');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(
        googleCalendarKeys.activityEvent(variables.activityId, variables.organizationId),
        null
      );
      queryClient.invalidateQueries({
        queryKey: googleCalendarKeys.activityEvent(variables.activityId, variables.organizationId),
      });
    },
  });
}

/**
 * Mutation to delete Google Calendar event and unlink
 */
export function useDeleteGoogleCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DeleteGoogleCalendarEventParams) => {
      const result = await googleCalendarService.deleteGoogleCalendarEvent(params);
      if (!result.success) {
        throw new Error(result.error || 'Không thể xóa sự kiện trên Google Calendar.');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(
        googleCalendarKeys.activityEvent(variables.activityId, variables.organizationId),
        null
      );
      queryClient.invalidateQueries({
        queryKey: googleCalendarKeys.activityEvent(variables.activityId, variables.organizationId),
      });
    },
  });
}
