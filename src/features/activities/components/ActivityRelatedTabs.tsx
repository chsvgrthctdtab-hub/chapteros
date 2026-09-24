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
import {
  ORGANIZER_SCOPES,
  ACTIVITY_SCALES,
  LEAN_COMPETENCY_TAGS,
  SV5T_CRITERIA,
} from '../types/competency.types';
import {
  parseActivityMetadata,
  stripActivityMetadata,
} from '../utils/activity-metadata';
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
    <div className="bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden">
      {/* Workspace Tabs Navigation Bar: Divided Evenly & No Scrollbar */}
      <div className="border-b border-hairline bg-cloud w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                    ? 'border-signal-blue text-signal-blue bg-white shadow-xs -mb-px rounded-t-lg font-bold'
                    : 'border-transparent text-slate-gray hover:text-ink-navy hover:bg-pebble hover:border-hairline'
                )}
              >
                <Icon
                  className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-signal-blue' : 'text-mist-gray')}
                />
                <span className="truncate">{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums shrink-0',
                      isActive ? 'bg-[#e6f0ff] text-signal-blue' : 'bg-pebble text-slate-gray'
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
        {activeTab === 'overview' && (() => {
          const meta = parseActivityMetadata(activity.description);
          const cleanDescription = stripActivityMetadata(activity.description);
          const scopeMeta = meta.organizerScope ? ORGANIZER_SCOPES[meta.organizerScope] : null;
          const scaleMeta = meta.activityScale ? ACTIVITY_SCALES[meta.activityScale] : null;
          const semesterLabel =
            meta.semester === 'hk1'
              ? 'Học kỳ I'
              : meta.semester === 'hk2'
              ? 'Học kỳ II'
              : meta.semester === 'hk3'
              ? 'Học kỳ III (Hè)'
              : null;

          return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2/3): Description & Plan, Schedule Milestones, Location */}
              <div className="lg:col-span-2 space-y-6">
                {/* Competency Standards & Chapter Evaluation Card */}
                <div className="bg-white rounded-2xl border border-hairline p-3.5 sm:p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-hairline pb-2.5 gap-2 flex-wrap">
                    <h3 className="text-xs font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-signal-blue" />
                      <span>Chuẩn Đánh Giá Thi Đua Chi Hội</span>
                    </h3>
                    <span className="text-[11px] text-slate-gray font-medium bg-cloud px-2 py-0.5 rounded-md border border-hairline">
                      Khung chuẩn CTUMP
                    </span>
                  </div>

                  {/* 4-Item Balanced Metrics Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    {/* Semester */}
                    <div className="bg-cloud/60 p-2.5 rounded-xl border border-hairline flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-mist-gray uppercase tracking-wider">Học kỳ</span>
                      <p className="text-xs font-bold text-signal-blue mt-0.5 truncate">{semesterLabel || 'Chưa phân loại'}</p>
                    </div>

                    {/* Organizer Scope */}
                    <div className="bg-cloud/60 p-2.5 rounded-xl border border-hairline flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-mist-gray uppercase tracking-wider">Cấp tổ chức</span>
                      <div className="mt-0.5">
                        {scopeMeta ? (
                          <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border leading-tight ${scopeMeta.badgeClass}`}>
                            {scopeMeta.badgeLabel}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-gray font-medium">Cấp Chi hội</span>
                        )}
                      </div>
                    </div>

                    {/* Scale & Scorecard */}
                    <div className="bg-cloud/60 p-2.5 rounded-xl border border-hairline flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-mist-gray uppercase tracking-wider">Quy mô thi đua</span>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <span className="text-xs font-bold text-ink-navy truncate">{scaleMeta?.label || 'Quy mô Nhỏ'}</span>
                        {scaleMeta && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${scaleMeta.badgeClass}`}>
                            +{scaleMeta.pointsHsV}đ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Estimated Budget */}
                    <div className="bg-cloud/60 p-2.5 rounded-xl border border-hairline flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-mist-gray uppercase tracking-wider">Dự toán kinh phí</span>
                      <p className="text-xs font-bold text-ink-navy mt-0.5 truncate tabular-nums">
                        {meta.estimatedBudget ? `${(meta.estimatedBudget).toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                      </p>
                    </div>
                  </div>

                  {/* Monthly Meeting Extra Badge if applicable */}
                  {meta.isMonthlyUnionMeeting && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-signal-blue" />
                      <span>Sinh hoạt Chi đoàn / Chi hội định kỳ (+50đ)</span>
                    </div>
                  )}

                  {/* Lean Competencies Tag List */}
                  {meta.competencyTags && meta.competencyTags.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-hairline">
                      <span className="text-[11px] font-bold text-slate-gray uppercase tracking-wider">
                        Chuẩn Năng Lực Hội Sinh Viên phụ trách:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {meta.competencyTags.map((tagKey) => {
                          const tag = LEAN_COMPETENCY_TAGS[tagKey];
                          if (!tag) return null;
                          return (
                            <div
                              key={tagKey}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${tag.badgeClass}`}
                            >
                              <span className="bg-white/80 px-1 py-0.2 rounded text-[10px] font-bold border border-hairline">
                                {tag.code}
                              </span>
                              <span>{tag.name}</span>
                              {tag.yearlyRequirement && (
                                <span className="text-[10px] opacity-80">({tag.yearlyRequirement})</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SV5T Criteria */}
                  {meta.sv5tCriteria && meta.sv5tCriteria.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-hairline">
                      <span className="text-[11px] font-bold text-slate-gray uppercase tracking-wider">
                        Tiêu chí Sinh Viên 5 Tốt hỗ trợ:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {meta.sv5tCriteria.map((critKey) => {
                          const crit = SV5T_CRITERIA[critKey];
                          if (!crit) return null;
                          return (
                            <span
                              key={critKey}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${crit.badgeClass}`}
                            >
                              ✓ {crit.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description & Operational Plan */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-signal-blue" />
                      <span>Mô tả & Kế hoạch hoạt động</span>
                    </h3>
                    {canManage && !isLocked && onOpenEdit && (
                      <button
                        type="button"
                        onClick={onOpenEdit}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-signal-blue hover:text-[#005be0] transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Chỉnh sửa</span>
                      </button>
                    )}
                  </div>

                  <div className="bg-cloud rounded-xl p-4 border border-hairline text-xs text-ink-navy leading-relaxed space-y-2.5">
                    {cleanDescription ? (
                      <p className="whitespace-pre-line text-ink-navy">{cleanDescription}</p>
                    ) : activity.plan?.description ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-signal-blue font-semibold text-[11px]">
                          <FolderKanban className="w-3.5 h-3.5 text-signal-blue" />
                          <span>Nội dung từ kế hoạch liên kết: {activity.plan.name}</span>
                        </div>
                        <p className="whitespace-pre-line text-ink-navy">{activity.plan.description}</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-1">
                        <p className="text-mist-gray italic">Chưa có mô tả chi tiết cho hoạt động này.</p>
                        {canManage && !isLocked && onOpenEdit && (
                          <button
                            type="button"
                            onClick={onOpenEdit}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-signal-blue hover:text-[#005be0] cursor-pointer"
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
                  <h3 className="text-xs font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-signal-blue" />
                    <span>Thời gian & Các mốc sự kiện</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3.5 border border-hairline space-y-1">
                      <span className="text-[10px] font-bold text-mist-gray uppercase">Bắt đầu</span>
                      <p className="text-xs font-bold text-ink-navy">
                        {formatDateTime(activity.startDate)}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-3.5 border border-hairline space-y-1">
                      <span className="text-[10px] font-bold text-mist-gray uppercase">Kết thúc</span>
                      <p className="text-xs font-bold text-ink-navy">
                        {activity.endDate ? formatDateTime(activity.endDate) : 'Sự kiện trong ngày'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location & Venue */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-signal-blue" />
                    <span>Địa điểm tổ chức</span>
                  </h3>
                  <div className="bg-white rounded-xl p-3.5 border border-hairline flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#e6f0ff] text-signal-blue flex items-center justify-center shrink-0 border border-[#d4e4fa]">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-navy">
                        {activity.location || 'Chưa có địa điểm cụ thể'}
                      </p>
                      <p className="text-[11px] text-slate-gray">
                        {activity.location ? 'Địa điểm tập trung và điểm danh' : 'Chưa xác định / Trực tuyến'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (1/3): Lead Person, Lifecycle Transitions, Google Forms */}
              <div className="space-y-5">
                {/* Responsible Lead Person Card */}
                <div className="bg-white rounded-2xl border border-hairline p-4 shadow-sm space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-gray uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-signal-blue" />
                    <span>Trưởng Ban tổ chức / Phụ trách</span>
                  </h4>

                  {activity.leadMember ? (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#e6f0ff] text-signal-blue border border-[#d4e4fa] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {leadInitials || <User className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-bold text-ink-navy truncate">
                          {activity.leadMember.fullName}
                        </p>
                        {activity.leadMember.studentId && (
                          <p className="text-[10px] text-slate-gray tabular-nums">
                            MSSV: {activity.leadMember.studentId}
                          </p>
                        )}
                        {activity.leadMember.email && (
                          <p className="text-[10px] text-slate-gray truncate">
                            {activity.leadMember.email}
                          </p>
                        )}
                        {activity.leadMember.phone && (
                          <p className="text-[10px] text-slate-gray tabular-nums">
                            {activity.leadMember.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-mist-gray space-y-1">
                      <User strokeWidth={1.5} className="w-6 h-6 mx-auto opacity-40" />
                      <p className="text-xs italic">Chưa phân công người phụ trách</p>
                    </div>
                  )}
                </div>

                {/* Activity Lifecycle & State Machine */}
                <div className="bg-white rounded-2xl border border-hairline p-4 shadow-sm space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-gray uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-signal-blue" />
                      <span>Tiến trình hoạt động</span>
                    </span>
                    <ActivityStatusBadge status={activity.status} />
                  </h4>

                  <p className="text-[11px] text-slate-gray leading-relaxed font-medium bg-cloud p-2.5 rounded-lg border border-hairline">
                    {ACTIVITY_STATUSES[activity.status]?.description || ''}
                  </p>

                  {/* Allowed Status Transitions for Board */}
                  {canManage && !isLocked && allowedNextStatuses.length > 0 && (
                    <div className="pt-2 border-t border-hairline space-y-1.5">
                      <span className="text-[10px] font-bold text-mist-gray uppercase">
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
                              className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold border border-hairline hover:bg-pebble hover:border-mist-gray text-ink-navy transition-colors flex items-center justify-between group cursor-pointer"
                            >
                              <span className="text-ink-navy group-hover:text-signal-blue">{nextCfg?.label || nextStatus}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-mist-gray group-hover:text-signal-blue transition-colors" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Google Forms Quick Card */}
                {primaryForm && (
                  <div className="bg-white rounded-2xl border border-hairline p-4 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold text-slate-gray uppercase tracking-wider flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-signal-blue" />
                        <span>Biểu mẫu đăng ký</span>
                      </h4>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                          primaryForm.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-pebble text-slate-gray border-hairline'
                        )}
                      >
                        {primaryForm.status === 'active' ? 'Đang mở đơn' : 'Đã đóng đơn'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-ink-navy truncate">
                      {primaryForm.title}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-gray">
                      <span>Số phản hồi đã đồng bộ:</span>
                      <strong className="text-ink-navy tabular-nums font-semibold">
                        {primaryForm.responseCount}
                      </strong>
                    </div>

                    {primaryForm.publishedUrl && (
                      <a
                        href={primaryForm.publishedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-signal-blue hover:text-[#005be0] pt-1"
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
          );
        })()}

        {/* 2. PARTICIPANTS & ATTENDANCE TAB: Registered Members Roster and Fast Check-in */}
        {activeTab === 'participants' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-hairline">
              <div>
                <h3 className="text-sm font-bold text-ink-navy">
                  Danh sách người tham gia & Điểm danh ({participants.length})
                </h3>
                <p className="text-xs text-slate-gray">
                  Quản lý danh sách đăng ký, cập nhật trạng thái có mặt, ghi chú và điểm danh trực tiếp.
                </p>
              </div>

              {canManage && !isLocked && (
                <button
                  type="button"
                  id="add-participant-tab-btn"
                  onClick={onOpenAddParticipant}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-signal-blue hover:bg-[#005be0] rounded-lg shadow-sm transition-colors cursor-pointer"
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
            <div className="flex items-center justify-between pb-2 border-b border-hairline">
              <div>
                <h3 className="text-sm font-bold text-ink-navy">Nhiệm vụ hoạt động</h3>
                <p className="text-xs text-slate-gray">
                  Phân công nhiệm vụ, thời hạn hoàn thành và tiến độ thực hiện.
                </p>
              </div>

              {canManage && !isLocked && (
                <button
                  type="button"
                  id="create-activity-task-btn"
                  onClick={() => setIsCreateTaskOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-signal-blue hover:bg-[#005be0] rounded-lg shadow-sm transition-colors cursor-pointer"
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
