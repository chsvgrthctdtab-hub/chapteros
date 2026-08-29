import {
  useActivitiesList,
  useActivityDetail,
  useActivityParticipants as useActivityParticipantsQuery,
  useAvailableMembersForActivity,
  useActivityTerms,
} from '@/features/activities/queries/activity.queries';
import {
  useCreateActivity,
  useUpdateActivity,
  useUpdateActivityStatus,
  useDeleteOrArchiveActivity,
  useAddActivityParticipant,
  useUpdateActivityParticipant,
  useRemoveActivityParticipant,
  useBulkUpdateAttendance,
  useBulkAddActivityParticipants,
} from '@/features/activities/mutations/activity.mutations';
import type {
  ActivityFilterParams,
  ParticipantFilterParams,
} from '@/features/activities/types/activity.types';

/**
 * Hook to retrieve filtered/paginated activities for an organization
 */
export function useActivities(organizationId?: string, params: ActivityFilterParams = {}) {
  const query = useActivitiesList(organizationId, params);

  return {
    data: query.data?.data || [],
    totalCount: query.data?.totalCount || 0,
    page: query.data?.page || 1,
    pageSize: query.data?.pageSize || 12,
    totalPages: query.data?.totalPages || 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to retrieve a single activity by ID
 */
export function useActivity(activityId?: string, organizationId?: string) {
  const query = useActivityDetail(activityId, organizationId);

  return {
    activity: query.data || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to retrieve participants and attendance breakdown for an activity
 */
export function useActivityParticipants(activityId?: string, params: ParticipantFilterParams = {}) {
  const query = useActivityParticipantsQuery(activityId, params);

  return {
    participants: query.data?.data || [],
    totalCount: query.data?.totalCount || 0,
    stats: query.data?.stats || {
      total: 0,
      registered: 0,
      confirmed: 0,
      waitlist: 0,
      cancelled: 0,
      present: 0,
      absent: 0,
      excused: 0,
      unmarked: 0,
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook combining common activity mutations
 */
export function useActivityMutations(activityId?: string, organizationId?: string) {
  const createActivityMutation = useCreateActivity(organizationId);
  const updateActivityMutation = useUpdateActivity(activityId || '', organizationId);
  const updateStatusMutation = useUpdateActivityStatus(activityId || '', organizationId);
  const deleteOrArchiveMutation = useDeleteOrArchiveActivity(organizationId);

  return {
    createActivity: createActivityMutation.mutateAsync,
    isCreating: createActivityMutation.isPending,
    createError: createActivityMutation.error,

    updateActivity: updateActivityMutation.mutateAsync,
    isUpdating: updateActivityMutation.isPending,
    updateError: updateActivityMutation.error,

    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    updateStatusError: updateStatusMutation.error,

    deleteOrArchive: deleteOrArchiveMutation.mutateAsync,
    isDeleting: deleteOrArchiveMutation.isPending,
    deleteError: deleteOrArchiveMutation.error,
  };
}

/**
 * Hook combining common participant mutations
 */
export function useActivityParticipantMutations(activityId: string, organizationId?: string) {
  const addParticipantMutation = useAddActivityParticipant(activityId, organizationId);
  const updateParticipantMutation = useUpdateActivityParticipant(activityId, organizationId);
  const removeParticipantMutation = useRemoveActivityParticipant(activityId, organizationId);
  const bulkUpdateAttendanceMutation = useBulkUpdateAttendance(activityId, organizationId);
  const bulkAddParticipantsMutation = useBulkAddActivityParticipants(activityId, organizationId);

  return {
    addParticipant: addParticipantMutation.mutateAsync,
    isAdding: addParticipantMutation.isPending,

    updateParticipant: updateParticipantMutation.mutateAsync,
    isUpdating: updateParticipantMutation.isPending,

    removeParticipant: removeParticipantMutation.mutateAsync,
    isRemoving: removeParticipantMutation.isPending,

    bulkUpdateAttendance: bulkUpdateAttendanceMutation.mutateAsync,
    isBulkUpdatingAttendance: bulkUpdateAttendanceMutation.isPending,

    bulkAddParticipants: bulkAddParticipantsMutation.mutateAsync,
    isBulkAdding: bulkAddParticipantsMutation.isPending,
  };
}

export {
  useActivitiesList,
  useActivityDetail,
  useActivityParticipantsQuery,
  useAvailableMembersForActivity,
  useActivityTerms,
  useCreateActivity,
  useUpdateActivity,
  useUpdateActivityStatus,
  useDeleteOrArchiveActivity,
  useAddActivityParticipant,
  useUpdateActivityParticipant,
  useRemoveActivityParticipant,
  useBulkUpdateAttendance,
  useBulkAddActivityParticipants,
};
