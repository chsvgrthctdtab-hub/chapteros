import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService } from '@/services/activity.service';
import { useAuth } from '@/contexts/AuthContext';
import { activityKeys } from '../queries/activity.queries';
import type { ActivityFormData, AddParticipantFormData, UpdateParticipantFormData } from '../schemas/activity.schema';
import type { ActivityStatus, AttendanceStatus, RegistrationStatus } from '../types/activity.types';

function formatServiceError(err: unknown, defaultMsg: string): string {
  if (err instanceof Error && err.message) {
    const msg = err.message;
    if (msg.includes('uq_activity_member_participant')) {
      return 'Hội viên này đã có trong danh sách tham gia hoạt động. Bạn có thể cập nhật trạng thái điểm danh thay vì thêm mới.';
    }
    if (msg.includes('chk_activity_dates')) {
      return 'Thời gian kết thúc hoạt động không thể trước thời gian bắt đầu.';
    }
    if (msg.includes('row-level security') || msg.includes('violates row-level security policy')) {
      return 'Bạn không có đủ quyền hạn (Yêu cầu Ban Chấp Hành hoặc Quản trị viên) để thực hiện thao tác này.';
    }
    return msg;
  }

  const errorObj = err as { code?: string; message?: string; details?: string };
  const message = errorObj?.message || '';

  if (message.includes('uq_activity_member_participant') || errorObj?.code === '23505') {
    return 'Hội viên này đã có trong danh sách tham gia hoạt động. Bạn có thể cập nhật trạng thái điểm danh thay vì thêm mới.';
  }
  if (message.includes('chk_activity_dates')) {
    return 'Thời gian kết thúc hoạt động không thể trước thời gian bắt đầu.';
  }
  if (message.includes('row-level security') || message.includes('violates row-level security policy')) {
    return 'Bạn không có đủ quyền hạn (Yêu cầu Ban Chấp Hành hoặc Quản trị viên) để thực hiện thao tác này.';
  }
  return message || defaultMsg;
}

/**
 * Mutation: Create a new Activity
 */
export function useCreateActivity(organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: ActivityFormData) => {
      if (!organizationId) {
        throw new Error('Chưa chọn Chi hội làm việc');
      }

      try {
        const activity = await activityService.createActivity(
          organizationId,
          formData,
          user?.id
        );
        return activity;
      } catch (err) {
        throw new Error(formatServiceError(err, 'Không thể tạo hoạt động mới'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}

/**
 * Mutation: Update Activity Information
 */
export function useUpdateActivity(activityId: string, organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: Partial<ActivityFormData>) => {
      if (!activityId) {
        throw new Error('Thiếu ID hoạt động cần cập nhật');
      }
      if (!organizationId) {
        throw new Error('Chưa chọn Chi hội làm việc');
      }

      try {
        const updated = await activityService.updateActivity(
          activityId,
          organizationId,
          formData,
          user?.id
        );
        return updated;
      } catch (err) {
        throw new Error(formatServiceError(err, 'Không thể cập nhật thông tin hoạt động'));
      }
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: [...activityKeys.details(), activityId] });
      const previousDetails = queryClient.getQueriesData({ queryKey: [...activityKeys.details(), activityId] });

      queryClient.setQueriesData(
        { queryKey: [...activityKeys.details(), activityId] },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            ...formData,
          };
        }
      );

      return { previousDetails };
    },
    onError: (_err, _formData, context) => {
      if (context?.previousDetails) {
        context.previousDetails.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...activityKeys.details(), activityId] });
    },
  });
}

/**
 * Mutation: Quick Update Activity Status
 */
export function useUpdateActivityStatus(activityId: string, organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (newStatus: ActivityStatus) => {
      if (!activityId) {
        throw new Error('Thiếu ID hoạt động');
      }
      if (!organizationId) {
        throw new Error('Chưa chọn Chi hội làm việc');
      }

      try {
        const updated = await activityService.updateActivityStatus(
          activityId,
          organizationId,
          newStatus,
          user?.id
        );
        return updated;
      } catch (err) {
        throw new Error(formatServiceError(err, 'Không thể thay đổi trạng thái hoạt động'));
      }
    },
    onMutate: async (newStatus: ActivityStatus) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: [...activityKeys.details(), activityId] });
      const previousDetails = queryClient.getQueriesData({ queryKey: [...activityKeys.details(), activityId] });

      // Optimistically update all matching detail query data
      queryClient.setQueriesData(
        { queryKey: [...activityKeys.details(), activityId] },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            status: newStatus,
          };
        }
      );

      return { previousDetails };
    },
    onError: (_err, _newStatus, context) => {
      if (context?.previousDetails) {
        context.previousDetails.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...activityKeys.details(), activityId] });
    },
  });
}

/**
 * Mutation: Delete or Cancel/Archive Activity
 */
export function useDeleteOrArchiveActivity(organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ activityId, action }: { activityId: string; action: 'delete' | 'cancel' }) => {
      if (!activityId) {
        throw new Error('Thiếu ID hoạt động');
      }
      if (!organizationId) {
        throw new Error('Chưa chọn Chi hội làm việc');
      }

      try {
        const result = await activityService.deleteOrArchiveActivity(
          activityId,
          organizationId,
          action,
          user?.id
        );
        return result;
      } catch (err) {
        throw new Error(formatServiceError(err, action === 'cancel' ? 'Không thể hủy hoạt động' : 'Không thể xóa hoạt động'));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(variables.activityId) });
    },
  });
}

/**
 * Mutation: Add Participant to Activity
 */
export function useAddActivityParticipant(activityId: string, organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: AddParticipantFormData) => {
      if (!activityId) throw new Error('Thiếu ID hoạt động');
      if (!organizationId) throw new Error('Chưa chọn Chi hội làm việc');

      try {
        const participant = await activityService.addParticipant(
          activityId,
          organizationId,
          formData,
          user?.id
        );
        return participant;
      } catch (err) {
        throw new Error(formatServiceError(err, 'Không thể thêm người tham gia'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.participants(activityId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(activityId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

/**
 * Mutation: Update Participant Status (Registration & Attendance)
 */
export function useUpdateActivityParticipant(activityId: string, organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      participantId,
      data,
    }: {
      participantId: string;
      data: Partial<UpdateParticipantFormData>;
    }) => {
      if (!activityId) throw new Error('Thiếu ID hoạt động');
      if (!organizationId) throw new Error('Chưa chọn Chi hội làm việc');

      try {
        const participant = await activityService.updateParticipant(
          participantId,
          activityId,
          organizationId,
          data,
          user?.id
        );
        return participant;
      } catch (err) {
        throw new Error(formatServiceError(err, 'Không thể cập nhật trạng thái người tham gia'));
      }
    },
    onMutate: async ({ participantId, data }) => {
      // 1. Cancel ongoing participant queries for this activity
      await queryClient.cancelQueries({
        queryKey: [...activityKeys.details(), activityId, 'participants'],
      });

      // 2. Snapshot previous data for rollback on error
      const previousParticipantsQueries = queryClient.getQueriesData({
        queryKey: [...activityKeys.details(), activityId, 'participants'],
      });

      // 3. Optimistically update all matching participant queries
      queryClient.setQueriesData(
        { queryKey: [...activityKeys.details(), activityId, 'participants'] },
        (old: any) => {
          if (!old || !old.data) return old;
          const updatedData = old.data.map((p: any) => {
            if (p.id !== participantId) return p;
            return {
              ...p,
              attendanceStatus: data.attendanceStatus ?? p.attendanceStatus,
              registrationStatus: data.registrationStatus ?? p.registrationStatus,
              notes: data.notes !== undefined ? data.notes : p.notes,
              attendedAt:
                data.attendanceStatus === 'present'
                  ? new Date().toISOString()
                  : data.attendanceStatus === 'absent' || data.attendanceStatus === 'unmarked'
                  ? null
                  : p.attendedAt,
            };
          });

          const present = updatedData.filter((p: any) => p.attendanceStatus === 'present').length;
          const absent = updatedData.filter((p: any) => p.attendanceStatus === 'absent').length;
          const excused = updatedData.filter((p: any) => p.attendanceStatus === 'excused').length;
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
              excused,
              unmarked,
              participationRate,
            },
          };
        }
      );

      return { previousParticipantsQueries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousParticipantsQueries) {
        context.previousParticipantsQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [...activityKeys.details(), activityId, 'participants'],
      });
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(activityId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}

/**
 * Mutation: Remove Participant from Activity
 */
export function useRemoveActivityParticipant(activityId: string, organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (participantId: string) => {
      if (!activityId) throw new Error('Thiếu ID hoạt động');
      if (!organizationId) throw new Error('Chưa chọn Chi hội làm việc');

      try {
        await activityService.removeParticipant(
          participantId,
          activityId,
          organizationId,
          user?.id
        );
        return { success: true };
      } catch (err) {
        throw new Error(formatServiceError(err, 'Không thể xóa người tham gia'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...activityKeys.details(), activityId, 'participants'],
      });
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(activityId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

/**
 * Mutation: Bulk Mark Attendance Status
 */
export function useBulkUpdateAttendance(activityId: string, organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      participantIds,
      attendanceStatus,
    }: {
      participantIds: string[];
      attendanceStatus: AttendanceStatus;
    }) => {
      if (!activityId) throw new Error('Thiếu ID hoạt động');
      if (!organizationId) throw new Error('Chưa chọn Chi hội làm việc');
      if (participantIds.length === 0) return { success: true, count: 0 };

      try {
        await activityService.bulkUpdateAttendance(
          activityId,
          organizationId,
          participantIds,
          attendanceStatus,
          user?.id
        );
        return { success: true, count: participantIds.length };
      } catch (err) {
        throw new Error(formatServiceError(err, 'Không thể cập nhật hàng loạt trạng thái điểm danh'));
      }
    },
    onMutate: async ({ participantIds, attendanceStatus }) => {
      await queryClient.cancelQueries({
        queryKey: [...activityKeys.details(), activityId, 'participants'],
      });

      const previousParticipantsQueries = queryClient.getQueriesData({
        queryKey: [...activityKeys.details(), activityId, 'participants'],
      });

      queryClient.setQueriesData(
        { queryKey: [...activityKeys.details(), activityId, 'participants'] },
        (old: any) => {
          if (!old || !old.data) return old;
          const idSet = new Set(participantIds);
          const updatedData = old.data.map((p: any) => {
            if (!idSet.has(p.id)) return p;
            return {
              ...p,
              attendanceStatus,
              attendedAt: attendanceStatus === 'present' ? new Date().toISOString() : null,
            };
          });

          const present = updatedData.filter((p: any) => p.attendanceStatus === 'present').length;
          const absent = updatedData.filter((p: any) => p.attendanceStatus === 'absent').length;
          const excused = updatedData.filter((p: any) => p.attendanceStatus === 'excused').length;
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
              excused,
              unmarked,
              participationRate,
            },
          };
        }
      );

      return { previousParticipantsQueries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousParticipantsQueries) {
        context.previousParticipantsQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [...activityKeys.details(), activityId, 'participants'],
      });
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(activityId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
    },
  });
}

/**
 * Mutation: Bulk Add Participants
 */
export function useBulkAddActivityParticipants(activityId: string, organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      memberIds,
      registrationStatus = 'registered',
      attendanceStatus = 'unmarked',
    }: {
      memberIds: string[];
      registrationStatus?: RegistrationStatus;
      attendanceStatus?: AttendanceStatus;
    }) => {
      if (!activityId) throw new Error('Thiếu ID hoạt động');
      if (!organizationId) throw new Error('Chưa chọn Chi hội làm việc');

      try {
        const added = await activityService.bulkAddParticipants(
          activityId,
          organizationId,
          memberIds,
          registrationStatus,
          attendanceStatus,
          user?.id
        );
        return added;
      } catch (err) {
        throw new Error(formatServiceError(err, 'Không thể thêm danh sách hội viên tham gia'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.participants(activityId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(activityId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
