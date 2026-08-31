import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Edit3,
  Trash2,
  AlertTriangle,
  Lock,
  Flag,
  UserCheck,
  Download,
  Share2,
  ChevronRight,
  User,
  FolderKanban,
} from 'lucide-react';
import { useCurrentOrg } from '@/features/auth/hooks/useCurrentOrg';
import { useToast } from '@/contexts/ToastContext';
import {
  useActivityDetail,
  useActivityParticipants,
  useAvailableMembersForActivity,
  useActivityTerms,
  useActivityLeadCandidates,
  activityKeys,
} from '@/features/activities/queries/activity.queries';
import {
  useUpdateActivity,
  useUpdateActivityStatus,
  useDeleteOrArchiveActivity,
  useAddActivityParticipant,
  useUpdateActivityParticipant,
  useRemoveActivityParticipant,
  useBulkUpdateAttendance,
} from '@/features/activities/mutations/activity.mutations';
import { ActivityStatusBadge } from '@/features/activities/components/ActivityStatusBadge';
import { ActivityCategoryBadge } from '@/features/activities/components/ActivityCategoryBadge';
import { ActivityKPIStrip } from '@/features/activities/components/ActivityKPIStrip';
import { ActivityRelatedTabs } from '@/features/activities/components/ActivityRelatedTabs';
import { ActivityDetailSkeleton } from '@/features/activities/components/ActivitySkeleton';
import { ActivityFormDialog } from '@/features/activities/components/ActivityFormDialog';
import { AddParticipantDialog } from '@/features/activities/components/AddParticipantDialog';
import { GoogleSheetsExportModal } from '@/integrations/google/sheets/components/GoogleSheetsExportModal';
import { QueryErrorState } from '@/components/common/QueryErrorState';
import { formatDateRange, formatDateTime } from '@/lib/date';
import { isActivityLocked } from '@/features/activities/utils/activity-workflow';
import type {
  ActivityFormData,
  AddParticipantFormData,
} from '@/features/activities/schemas/activity.schema';
import type { ActivityStatus, AttendanceStatus, RegistrationStatus } from '@/types';
import { cn } from '@/lib/utils';

export function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrg, isBoard, isAdmin } = useCurrentOrg();
  const queryClient = useQueryClient();
  const toast = useToast();

  const canManage = isBoard || isAdmin;

  // Realtime Supabase change subscription
  useEffect(() => {
    if (!id || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`activity-detail-realtime-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [...activityKeys.details(), id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_participants',
          filter: `activity_id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [...activityKeys.details(), id] });
          queryClient.invalidateQueries({ queryKey: activityKeys.participants(id) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sheetsExportOpen, setSheetsExportOpen] = useState(false);

  // Queries
  const {
    data: activity,
    isLoading: isLoadingDetail,
    isError: isDetailError,
    error: detailError,
    refetch: refetchDetail,
  } = useActivityDetail(id, currentOrg?.id);

  const {
    data: participantsData,
    isLoading: isLoadingParticipants,
  } = useActivityParticipants(id);

  const {
    data: availableMembers = [],
    isLoading: isLoadingAvailableMembers,
  } = useAvailableMembersForActivity(currentOrg?.id, id);

  const { data: terms = [] } = useActivityTerms(currentOrg?.id);
  const { data: leadCandidates = [] } = useActivityLeadCandidates(currentOrg?.id);

  // Mutations
  const updateMutation = useUpdateActivity(id || '', currentOrg?.id);
  const updateStatusMutation = useUpdateActivityStatus(id || '', currentOrg?.id);
  const deleteOrArchiveMutation = useDeleteOrArchiveActivity(currentOrg?.id);
  const addParticipantMutation = useAddActivityParticipant(id || '', currentOrg?.id);
  const updateParticipantMutation = useUpdateActivityParticipant(id || '', currentOrg?.id);
  const removeParticipantMutation = useRemoveActivityParticipant(id || '', currentOrg?.id);
  const bulkAttendanceMutation = useBulkUpdateAttendance(id || '', currentOrg?.id);

  const participants = participantsData?.data || [];
  const isLocked = activity ? isActivityLocked(activity.status) : false;

  const handleEditSubmit = async (formData: ActivityFormData) => {
    try {
      await updateMutation.mutateAsync(formData);
      toast.success(`Đã cập nhật hoạt động "${formData.title}".`);
      setIsEditOpen(false);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleAddParticipantSubmit = async (data: AddParticipantFormData) => {
    try {
      await addParticipantMutation.mutateAsync(data);
      toast.success('Đã thêm người tham gia thành công.');
      setIsAddParticipantOpen(false);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleUpdateParticipantStatus = async (
    participantId: string,
    data: {
      registrationStatus?: RegistrationStatus;
      attendanceStatus?: AttendanceStatus;
      notes?: string;
    }
  ) => {
    try {
      await updateParticipantMutation.mutateAsync({
        participantId,
        data,
      });
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await removeParticipantMutation.mutateAsync(participantId);
      toast.success('Đã xóa người tham gia khỏi danh sách.');
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleBulkUpdateAttendance = async (
    participantIds: string[],
    status: AttendanceStatus
  ) => {
    try {
      await bulkAttendanceMutation.mutateAsync({
        participantIds,
        attendanceStatus: status,
      });
      toast.success(`Đã cập nhật điểm danh cho ${participantIds.length} người.`);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleUpdateActivityStatus = async (status: ActivityStatus) => {
    try {
      await updateStatusMutation.mutateAsync(status);
      toast.success('Đã cập nhật trạng thái hoạt động.');
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleDeleteActivity = async (action: 'delete' | 'cancel') => {
    if (!id) return;
    try {
      await deleteOrArchiveMutation.mutateAsync({ activityId: id, action });
      toast.success(
        action === 'delete'
          ? 'Permanently deleted activity.'
          : 'Activity marked as cancelled.'
      );
      setIsDeleteModalOpen(false);
      navigate('/activities');
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  if (isLoadingDetail) {
    return <ActivityDetailSkeleton />;
  }

  if (isDetailError || !activity) {
    return (
      <div className="py-16 px-6 bg-white rounded-xl border border-slate-200/90 text-center space-y-4 max-w-lg mx-auto mt-8 shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Activity Not Found</h2>
        <p className="text-xs text-slate-500">
          {(detailError as Error)?.message ||
            'The activity may have been deleted or you do not have permission to access it.'}
        </p>
        <Link
          to="/activities"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Activities</span>
        </Link>
      </div>
    );
  }

  const leadName = activity.leadMember?.fullName;
  const leadInitials = leadName
    ? leadName
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : null;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* 1. Breadcrumbs & Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            to="/activities"
            className="hover:text-emerald-700 flex items-center gap-1 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Danh sách hoạt động</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-bold truncate max-w-xs">{activity.title}</span>
        </div>

        {/* Action Buttons for Board */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
          {/* Export Sheets */}
          <button
            type="button"
            id="activity-detail-export-sheets-btn"
            onClick={() => setSheetsExportOpen(true)}
            title="Xuất Google Sheets"
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Xuất Sheets</span>
          </button>

          {canManage && (
            <>
              {!isLocked && (
                <button
                  type="button"
                  id="edit-activity-header-btn"
                  onClick={() => setIsEditOpen(true)}
                  title="Chỉnh sửa hoạt động"
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="hidden sm:inline">Chỉnh sửa</span>
                </button>
              )}

              <button
                type="button"
                id="open-delete-activity-modal-btn"
                onClick={() => setIsDeleteModalOpen(true)}
                title="Đóng hoặc xóa hoạt động"
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Đóng / Xóa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Locked State Notification Banner */}
      {isLocked && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-start sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                Hoạt động đã kết thúc ({activity.status === 'completed' ? 'Đã hoàn thành' : 'Đã hủy'})
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Hoạt động này đã được đóng hồ sơ. Các thông tin cốt lõi và danh sách người tham gia được chuyển sang chế độ chỉ đọc.
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 shrink-0">
            Lưu trữ
          </span>
        </div>
      )}

      {/* 3. Operational Activity Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
        {/* Badges & Term & Plan */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <ActivityCategoryBadge category={activity.category} />
            <ActivityStatusBadge status={activity.status} />
            {activity.code && (
              <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {activity.code}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activity.plan && (
              <Link
                to={`/plans/${activity.plan.id}`}
                className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-md border border-blue-200/80 transition-colors"
              >
                <FolderKanban className="w-3 h-3 text-blue-600" />
                <span>Kế hoạch: {activity.plan.name}</span>
              </Link>
            )}

            {activity.term && (
              <div className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200/80">
                <Flag className="w-3 h-3 text-emerald-700" />
                <span>Nhiệm kỳ: {activity.term.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Activity Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
          {activity.title}
        </h1>

        {/* Key Operational Meta Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
          {/* Date & Time */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Thời gian</p>
              <p className="font-semibold text-slate-900 truncate">
                {formatDateRange(activity.startDate, activity.endDate)}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Địa điểm</p>
              <p className="font-semibold text-slate-900 truncate">
                {activity.location || 'Chưa xác định / Trực tuyến'}
              </p>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Người tham gia</p>
              <p className="font-semibold text-slate-900 truncate">
                {participants.length}{' '}
                {activity.targetMembers > 0 ? `/ ${activity.targetMembers} chỉ tiêu` : 'đã ghi danh'}
              </p>
            </div>
          </div>

          {/* Lead Coordinator */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Người phụ trách</p>
              <p className="font-semibold text-slate-900 truncate">
                {activity.leadMember?.fullName || 'Chưa phân công'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. KPI Operational Metric Strip */}
      <ActivityKPIStrip
        activity={activity}
        stats={participantsData?.stats}
      />

      {/* 5. Activity Workspace Tabs */}
      <ActivityRelatedTabs
        activity={activity}
        participants={participants}
        stats={participantsData?.stats}
        availableMembers={availableMembers}
        canManage={canManage}
        onOpenEdit={() => setIsEditOpen(true)}
        onOpenAddParticipant={() => setIsAddParticipantOpen(true)}
        onUpdateParticipantStatus={handleUpdateParticipantStatus}
        onRemoveParticipant={handleRemoveParticipant}
        onBulkUpdateAttendance={handleBulkUpdateAttendance}
        onUpdateActivityStatus={handleUpdateActivityStatus}
        isUpdatingStatus={updateStatusMutation.isPending}
      />

      {/* 6. Edit Activity Dialog */}
      <ActivityFormDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        activityToEdit={activity}
        terms={terms}
        leadCandidates={leadCandidates}
        isSubmitting={updateMutation.isPending}
      />

      {/* 7. Add Participant Dialog */}
      <AddParticipantDialog
        isOpen={isAddParticipantOpen}
        onClose={() => setIsAddParticipantOpen(false)}
        onSubmit={handleAddParticipantSubmit}
        availableMembers={availableMembers}
        isLoadingMembers={isLoadingAvailableMembers}
        isSubmitting={addParticipantMutation.isPending}
      />

      {/* 8. Google Sheets Export Modal */}
      <GoogleSheetsExportModal
        open={sheetsExportOpen}
        onOpenChange={setSheetsExportOpen}
        module="activities"
        termId={activity.termId}
      />

      {/* 9. Delete / Close Activity Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            id="delete-activity-dialog"
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Close or Delete Activity</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                You can mark this activity as cancelled to preserve historical registration records or delete it permanently if created in error.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                id="confirm-cancel-activity-btn"
                disabled={deleteOrArchiveMutation.isPending}
                onClick={() => handleDeleteActivity('cancel')}
                className="w-full py-2.5 px-4 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer text-left flex items-center justify-between"
              >
                <div>
                  <p className="font-bold">Đánh dấu Đã hủy (Khuyên dùng)</p>
                  <p className="text-[10px] text-amber-700">Bảo lưu lịch sử điểm danh, tài liệu và nhật ký hoạt động</p>
                </div>
              </button>

              <button
                type="button"
                id="confirm-hard-delete-activity-btn"
                disabled={deleteOrArchiveMutation.isPending}
                onClick={() => handleDeleteActivity('delete')}
                className="w-full py-2.5 px-4 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer text-left flex items-center justify-between"
              >
                <div>
                  <p className="font-bold">Xóa vĩnh viễn</p>
                  <p className="text-[10px] text-rose-600">Xóa hoàn toàn dữ liệu hoạt động khỏi hệ thống</p>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                id="close-delete-modal-btn"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityDetailPage;
