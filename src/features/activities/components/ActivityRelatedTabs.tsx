import React, { useState } from 'react';
import {
  FileText,
  Users,
  CheckCircle2,
  CheckSquare,
  DollarSign,
  FolderArchive,
  Calendar,
  MapPin,
  Tag,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  Info,
  CalendarDays,
  FileSpreadsheet,
  Lock,
  Plus,
  Clock,
  Send,
  Flame,
  XCircle,
  ExternalLink,
  ShieldCheck,
  User,
  Edit3,
  FolderKanban,
} from 'lucide-react';
import { ActivityStatusBadge } from './ActivityStatusBadge';
import { ActivityCategoryBadge } from './ActivityCategoryBadge';
import { ParticipantListTable } from './ParticipantListTable';
import { ActivityTasksSection } from '@/features/tasks/components/ActivityTasksSection';
import { TaskFormModal } from '@/features/tasks/components/TaskFormModal';
import { ActivityFinanceSection } from '@/features/finance/components/ActivityFinanceSection';
import { ActivityDocumentsSection } from '@/features/documents/components/ActivityDocumentsSection';
import { ActivityGoogleFormsSection } from './ActivityGoogleFormsSection';
import { ActivityCalendarIntegrationCard } from '@/integrations/google/calendar';
import { useActivityForms } from '@/integrations/google/forms/google-forms.queries';
import {
  useTaskAssignees,
  useTaskTerms,
  useTaskActivities,
} from '@/features/tasks/queries/task.queries';
import { useCreateTask } from '@/features/tasks/mutations/task.mutations';
import { formatDateTime, formatDateRange } from '@/lib/date';
import {
  ACTIVITY_STATUSES,
  type ActivityDetail,
  type ActivityParticipantItem,
} from '../types/activity.types';
import type { ActivityParticipantsStats } from '@/repositories/activity.repository';
import {
  getAllowedActivityTransitions,
  isActivityLocked,
  ACTIVITY_STATUS_VIETNAMESE_LABELS,
} from '../utils/activity-workflow';
import type { Activity, ActivityStatus, AttendanceStatus, RegistrationStatus, Member } from '@/types';
import type { TaskFormData } from '@/features/tasks/schemas/task.schema';
import { cn } from '@/lib/utils';

interface ActivityRelatedTabsProps {
  activity: ActivityDetail;
  participants: ActivityParticipantItem[];
  stats?: ActivityParticipantsStats;
  availableMembers?: Member[];
  canManage?: boolean;
  onOpenEdit?: () => void;
  onOpenAddParticipant: () => void;
  onUpdateParticipantStatus: (
    participantId: string,
    data: {
      registrationStatus?: RegistrationStatus;
      attendanceStatus?: AttendanceStatus;
      notes?: string;
    }
  ) => Promise<void>;
  onRemoveParticipant: (participantId: string) => Promise<void>;
  onBulkUpdateAttendance: (participantIds: string[], status: AttendanceStatus) => Promise<void>;
  onUpdateActivityStatus: (status: ActivityStatus) => Promise<void>;
  isUpdatingStatus?: boolean;
}

export type TabType =
  | 'overview'
  | 'participants'
  | 'tasks'
  | 'finance'
  | 'forms'
  | 'documents'
  | 'calendar';

export function ActivityRelatedTabs({
  activity,
  participants,
  stats,
  availableMembers = [],
  canManage = false,
  onOpenEdit,
  onOpenAddParticipant,
  onUpdateParticipantStatus,
  onRemoveParticipant,
  onBulkUpdateAttendance,
  onUpdateActivityStatus,
  isUpdatingStatus = false,
}: ActivityRelatedTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const isLocked = isActivityLocked(activity.status);

  // Google Forms Query
  const { data: activityForms = [] } = useActivityForms(activity.id);
  const primaryForm = activityForms.find((f) => f.isPrimary) || activityForms[0] || null;

  // Task Creation Queries
  const { data: assignees = [] } = useTaskAssignees(activity.organizationId);
  const { data: terms = [] } = useTaskTerms(activity.organizationId);
  const { data: activities = [] } = useTaskActivities(activity.organizationId);
  const createTaskMutation = useCreateTask();

  const handleCreateTask = async (data: TaskFormData) => {
    await createTaskMutation.mutateAsync({
      organizationId: activity.organizationId,
      data: {
        ...data,
        activityId: activity.id,
      },
    });
    setIsCreateTaskOpen(false);
  };

  const allowedNextStatuses = getAllowedActivityTransitions(activity.status);

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

  // Tabs list (Merged Participants & Attendance into a single comprehensive tab)
  const tabs = [
    { id: 'overview' as const, label: 'Tổng quan', icon: FileText },
    {
      id: 'participants' as const,
      label: 'Người tham gia',
      icon: Users,
      count: participants.length,
    },
    { id: 'tasks' as const, label: 'Nhiệm vụ', icon: CheckSquare },
    { id: 'finance' as const, label: 'Thu chi', icon: DollarSign },
    {
      id: 'forms' as const,
      label: 'Biểu mẫu',
      icon: FileSpreadsheet,
      count: primaryForm?.responseCount,
    },
    { id: 'documents' as const, label: 'Tài liệu', icon: FolderArchive },
    { id: 'calendar' as const, label: 'Lịch sự kiện', icon: Calendar },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Workspace Tabs Navigation Bar: Divided Evenly & No Scrollbar */}
      <div className="border-b border-slate-200/80 bg-slate-50/70 w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center w-full min-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`activity-tab-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-3 px-1.5 sm:px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer text-center min-w-0',
                  isActive
                    ? 'border-emerald-700 text-emerald-800 bg-white shadow-2xs -mb-px rounded-t-lg font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 hover:border-slate-300'
                )}
              >
                <Icon
                  className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-emerald-700' : 'text-slate-400')}
                />
                <span className="truncate">{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono shrink-0',
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-4 sm:p-6">
        {/* 1. OVERVIEW TAB: Two-Column Layout */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2/3): Description & Plan, Schedule Milestones, Location */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description & Operational Plan */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Mô tả & Kế hoạch hoạt động</span>
                    </h3>
                    {canManage && !isLocked && onOpenEdit && (
                      <button
                        type="button"
                        onClick={onOpenEdit}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Chỉnh sửa</span>
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 text-xs text-slate-700 leading-relaxed space-y-2.5">
                    {activity.description ? (
                      <p className="whitespace-pre-line text-slate-800">{activity.description}</p>
                    ) : activity.plan?.description ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-blue-700 font-semibold text-[11px]">
                          <FolderKanban className="w-3.5 h-3.5" />
                          <span>Nội dung từ kế hoạch liên kết: {activity.plan.name}</span>
                        </div>
                        <p className="whitespace-pre-line text-slate-700">{activity.plan.description}</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-1">
                        <p className="text-slate-400 italic">Chưa có mô tả chi tiết cho hoạt động này.</p>
                        {canManage && !isLocked && onOpenEdit && (
                          <button
                            type="button"
                            onClick={onOpenEdit}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Thêm mô tả</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Schedule & Timing Milestones */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Thời gian & Các mốc sự kiện</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Bắt đầu</span>
                      <p className="text-xs font-bold text-slate-900">
                        {formatDateTime(activity.startDate)}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Kết thúc</span>
                      <p className="text-xs font-bold text-slate-900">
                        {activity.endDate ? formatDateTime(activity.endDate) : 'Sự kiện trong ngày'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location & Venue */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Địa điểm tổ chức</span>
                  </h3>
                  <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">
                        {activity.location || 'Chưa có địa điểm cụ thể'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {activity.location ? 'Địa điểm tập trung và điểm danh' : 'Chưa xác định / Trực tuyến'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (1/3): Lead Person, Lifecycle Transitions, Google Forms */}
              <div className="space-y-5">
                {/* Responsible Lead Person Card */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Trưởng Ban tổ chức / Phụ trách</span>
                  </h4>

                  {activity.leadMember ? (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {leadInitials || <User className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {activity.leadMember.fullName}
                        </p>
                        {activity.leadMember.studentId && (
                          <p className="text-[10px] text-slate-500 font-mono">
                            MSSV: {activity.leadMember.studentId}
                          </p>
                        )}
                        {activity.leadMember.email && (
                          <p className="text-[10px] text-slate-500 truncate">
                            {activity.leadMember.email}
                          </p>
                        )}
                        {activity.leadMember.phone && (
                          <p className="text-[10px] text-slate-500 font-mono">
                            {activity.leadMember.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-slate-400 space-y-1">
                      <User className="w-6 h-6 mx-auto opacity-40" />
                      <p className="text-xs italic">Chưa phân công người phụ trách</p>
                    </div>
                  )}
                </div>

                {/* Activity Lifecycle & State Machine */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Tiến trình hoạt động</span>
                    </span>
                    <ActivityStatusBadge status={activity.status} />
                  </h4>

                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
                    {ACTIVITY_STATUSES[activity.status]?.description || ''}
                  </p>

                  {/* Allowed Status Transitions for Board */}
                  {canManage && !isLocked && allowedNextStatuses.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Chuyển trạng thái sang:
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {allowedNextStatuses.map((nextStatus) => {
                          const nextCfg = ACTIVITY_STATUSES[nextStatus];
                          return (
                            <button
                              key={nextStatus}
                              type="button"
                              id={`transition-to-${nextStatus}-btn`}
                              disabled={isUpdatingStatus}
                              onClick={() => onUpdateActivityStatus(nextStatus)}
                              className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200/90 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors flex items-center justify-between group cursor-pointer"
                            >
                              <span className="text-slate-800 group-hover:text-emerald-900">{nextCfg?.label || nextStatus}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 transition-colors" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Google Forms Quick Card */}
                {primaryForm && (
                  <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Biểu mẫu đăng ký</span>
                      </h4>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.2 rounded-full border',
                          primaryForm.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        )}
                      >
                        {primaryForm.status === 'active' ? 'Đang mở đơn' : 'Đã đóng đơn'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 truncate">
                      {primaryForm.title}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Số phản hồi đã đồng bộ:</span>
                      <strong className="text-slate-900 font-mono">
                        {primaryForm.responseCount}
                      </strong>
                    </div>

                    {primaryForm.publishedUrl && (
                      <a
                        href={primaryForm.publishedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 pt-1"
                      >
                        <span>Mở biểu mẫu Google Forms</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. PARTICIPANTS & ATTENDANCE TAB: Registered Members Roster and Fast Check-in */}
        {activeTab === 'participants' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Danh sách người tham gia & Điểm danh ({participants.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Quản lý danh sách đăng ký, cập nhật trạng thái có mặt, ghi chú và điểm danh trực tiếp.
                </p>
              </div>

              {canManage && !isLocked && (
                <button
                  type="button"
                  id="add-participant-tab-btn"
                  onClick={onOpenAddParticipant}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm người tham gia</span>
                </button>
              )}
            </div>

            <ParticipantListTable
              participants={participants}
              activityTitle={activity.title}
              stats={stats}
              canManage={canManage && !isLocked}
              onUpdateStatus={onUpdateParticipantStatus}
              onRemoveParticipant={onRemoveParticipant}
              onBulkUpdateAttendance={onBulkUpdateAttendance}
            />
          </div>
        )}

        {/* 4. TASKS TAB: Operational Work Breakdown */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Nhiệm vụ hoạt động</h3>
                <p className="text-xs text-slate-500">
                  Phân công nhiệm vụ, thời hạn hoàn thành và tiến độ thực hiện.
                </p>
              </div>

              {canManage && !isLocked && (
                <button
                  type="button"
                  id="create-activity-task-btn"
                  onClick={() => setIsCreateTaskOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo nhiệm vụ</span>
                </button>
              )}
            </div>

            <ActivityTasksSection
              activityId={activity.id}
              activityTitle={activity.title}
              organizationId={activity.organizationId}
              canManage={canManage && !isLocked}
              onOpenCreateTaskModal={() => setIsCreateTaskOpen(true)}
            />

            <TaskFormModal
              isOpen={isCreateTaskOpen}
              onClose={() => setIsCreateTaskOpen(false)}
              onSubmit={handleCreateTask}
              assignees={assignees}
              terms={terms}
              activities={activities}
              defaultActivityId={activity.id}
              isLoading={createTaskMutation.isPending}
            />
          </div>
        )}

        {/* 5. FINANCE TAB */}
        {activeTab === 'finance' && (
          <div className="space-y-4">
            <ActivityFinanceSection
              activityId={activity.id}
              activityTitle={activity.title}
              organizationId={activity.organizationId}
              canManage={canManage && !isLocked}
            />
          </div>
        )}

        {/* 6. GOOGLE FORMS TAB */}
        {activeTab === 'forms' && (
          <div className="space-y-4">
            <ActivityGoogleFormsSection
              activity={activity}
              canManage={canManage && !isLocked}
              members={availableMembers}
            />
          </div>
        )}

        {/* 7. DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <ActivityDocumentsSection
              activityId={activity.id}
              activityTitle={activity.title}
              organizationId={activity.organizationId}
              canManage={canManage && !isLocked}
            />
          </div>
        )}

        {/* 8. CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <ActivityCalendarIntegrationCard
              activity={activity as unknown as Activity}
              canManage={canManage && !isLocked}
            />
          </div>
        )}
      </div>
    </div>
  );
}
