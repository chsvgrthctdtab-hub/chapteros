import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Kanban,
  List,
  Edit,
  Trash2,
  CheckCircle2,
  DollarSign,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Download,
  Check,
  X,
  Loader2,
  ShieldCheck,
  Percent,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlanDetail } from '@/features/plans/queries/plan.queries';
import {
  useCollabActivityDetail,
  useCollabTasks,
  useUpdateCollabActivity,
  useUpdateCollabTask,
  useDeleteCollabTask,
  useCollabTransactions,
  useCollabPlanPersonnel,
  useCollabParticipants,
  useUpdateCollabParticipantStatus,
  useRemoveCollabParticipant,
  useBulkUpdateCollabAttendance,
} from '@/features/plans/queries/collab.queries';
import { useActivityForms } from '@/integrations/google/forms/google-forms.queries';
import { ActivityGoogleFormsSection } from '@/features/activities/components/ActivityGoogleFormsSection';
import { CreateCollabTaskDialog } from '@/features/plans/components/CreateCollabTaskDialog';
import { AddCollabParticipantDialog } from '@/features/plans/components/AddCollabParticipantDialog';
import { useAuth } from '@/contexts/AuthContext';
import { isOrgBoard } from '@/types/roles';
import { formatError } from '@/lib/error-formatter';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { getOrgTypeLabel, getOrgTypeBadgeClass } from '@/lib/organization.utils';
import type { CollabTask, CollabTaskStatus, TaskPriority, ActivityStatus } from '@/types';

type CollabActivityTab = 'tasks' | 'participants' | 'forms' | 'finance';

export function CollabActivityDetailPage() {
  const { planId, activityId } = useParams<{ planId: string; activityId: string }>();
  const navigate = useNavigate();
  const { activeRole, activeOrganization } = useAuth();

  const [activeTab, setActiveTab] = useState<CollabActivityTab>('tasks');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Task filters
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('all');
  const [taskOrgFilter, setTaskOrgFilter] = useState<string>('all');

  // Participant filters & selection
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantStatusFilter, setParticipantStatusFilter] = useState<string>('all');
  const [participantOrgFilter, setParticipantOrgFilter] = useState<string>('all');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);

  // Dialogs
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CollabTask | null>(null);
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Queries
  const { data: plan, isLoading: isPlanLoading } = usePlanDetail(planId);
  const { data: activity, isLoading: isActivityLoading, refetch: refetchActivity } =
    useCollabActivityDetail(activityId);
  const { data: forms = [] } = useActivityForms(activityId);
  const { data: tasks = [], isLoading: isTasksLoading, refetch: refetchTasks } = useCollabTasks(
    planId,
    activityId
  );
  const { data: transactions = [] } = useCollabTransactions(planId, activityId);
  const { data: personnel = [] } = useCollabPlanPersonnel(planId);
  const { data: participantsResult, isLoading: isParticipantsLoading } = useCollabParticipants(
    activityId,
    planId
  );

  const participants = participantsResult?.data || [];
  const participantStats = participantsResult?.stats || {
    total: 0,
    present: 0,
    absent: 0,
    unmarked: 0,
    participationRate: 0,
  };

  // Mutations
  const updateActivityMutation = useUpdateCollabActivity();
  const updateTaskMutation = useUpdateCollabTask();
  const deleteTaskMutation = useDeleteCollabTask();
  const updateParticipantMutation = useUpdateCollabParticipantStatus(activityId, planId);
  const removeParticipantMutation = useRemoveCollabParticipant(activityId, planId);
  const bulkAttendanceMutation = useBulkUpdateCollabAttendance(activityId, planId);

  // BCH role check
  const isBch = isOrgBoard(activeRole);

  // Organization participant status in this plan
  const myOrgParticipant = useMemo(() => {
    if (!activeOrganization || !plan) return null;
    if (plan.leadOrganizationId === activeOrganization.id) {
      return {
        status: 'active' as const,
        isHost: true,
      };
    }
    const po = (plan.organizations || []).find((o) => o.organizationId === activeOrganization.id);
    if (!po) return null;
    return {
      status: po.status,
      isHost: Boolean(po.isHost),
    };
  }, [activeOrganization, plan]);

  const isOrgActiveInPlan = myOrgParticipant?.status === 'active';
  const canManageOperational = isBch && isOrgActiveInPlan;

  // Participating organizations in this plan (active only)
  const participatingOrganizations = useMemo(() => {
    if (!plan) return [];
    const list: { id: string; name: string; code: string; type?: any }[] = [];
    if (plan.leadOrganization) {
      list.push({
        id: plan.leadOrganization.id,
        name: plan.leadOrganization.name,
        code: plan.leadOrganization.code,
        type: plan.leadOrganization.type,
      });
    }
    (plan.organizations || []).forEach((po) => {
      if (po.organization && po.organizationId !== plan.leadOrganizationId && po.status === 'active') {
        list.push({
          id: po.organization.id,
          name: po.organization.name,
          code: po.organization.code || 'ORG',
          type: po.organization.type,
        });
      }
    });
    return list;
  }, [plan]);

  // Task Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const review = tasks.filter((t) => t.status === 'review').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;

    const today = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== 'done'
    ).length;

    const totalExpense = transactions
      .filter((t) => t.transactionType === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return { total, completed, inProgress, review, todo, overdue, totalExpense };
  }, [tasks, transactions]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (taskStatusFilter !== 'all' && task.status !== taskStatusFilter) return false;
      if (taskPriorityFilter !== 'all' && task.priority !== taskPriorityFilter) return false;
      if (taskOrgFilter !== 'all' && task.organizationId !== taskOrgFilter) return false;

      if (taskSearch.trim()) {
        const q = taskSearch.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(q);
        const descMatch = task.description?.toLowerCase().includes(q);
        const assigneeMatch = task.assignee?.fullName?.toLowerCase().includes(q);
        const orgMatch = task.organization?.name?.toLowerCase().includes(q);
        return titleMatch || descMatch || assigneeMatch || orgMatch;
      }
      return true;
    });
  }, [tasks, taskStatusFilter, taskPriorityFilter, taskOrgFilter, taskSearch]);

  // Filtered Participants
  const filteredParticipants = useMemo(() => {
    return participants.filter((p: any) => {
      if (participantStatusFilter !== 'all' && p.attendanceStatus !== participantStatusFilter) return false;
      if (participantOrgFilter !== 'all' && p.member?.organizationId !== participantOrgFilter) return false;

      if (participantSearch.trim()) {
        const q = participantSearch.toLowerCase();
        const nameMatch = p.member?.fullName?.toLowerCase().includes(q);
        const idMatch = p.member?.studentId?.toLowerCase().includes(q);
        const classMatch = p.member?.className?.toLowerCase().includes(q);
        const emailMatch = p.member?.email?.toLowerCase().includes(q);
        return nameMatch || idMatch || classMatch || emailMatch;
      }
      return true;
    });
  }, [participants, participantStatusFilter, participantOrgFilter, participantSearch]);

  const handleStatusChange = async (newStatus: ActivityStatus) => {
    if (!activityId) return;
    if (!canManageOperational) {
      setActionError('Đơn vị chưa được kích hoạt tham gia kế hoạch hoặc bạn không thuộc Ban Chấp Hành nên chưa thể đổi trạng thái hoạt động.');
      return;
    }
    try {
      setActionError(null);
      await updateActivityMutation.mutateAsync({
        id: activityId,
        payload: { status: newStatus },
      });
      refetchActivity();
    } catch (err: unknown) {
      console.error('Failed to update activity status:', err);
      const formatted = formatError(err);
      setActionError(formatted.message || 'Đơn vị chưa được kích hoạt tham gia kế hoạch nên chưa thể thực hiện thao tác này.');
    }
  };

  const handleTaskStatusChange = async (task: CollabTask, newStatus: CollabTaskStatus) => {
    if (!canManageOperational) {
      setActionError('Đơn vị chưa được kích hoạt tham gia kế hoạch hoặc bạn không thuộc Ban Chấp Hành nên chưa thể cập nhật trạng thái nhiệm vụ.');
      return;
    }
    try {
      setActionError(null);
      await updateTaskMutation.mutateAsync({
        id: task.id,
        payload: {
          status: newStatus,
        },
      });
    } catch (err: unknown) {
      console.error('Failed to update task status:', err);
      const formatted = formatError(err);
      setActionError(formatted.message || 'Đơn vị chưa được kích hoạt tham gia kế hoạch nên chưa thể thực hiện thao tác này.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!canManageOperational) {
      setActionError('Đơn vị chưa được kích hoạt tham gia kế hoạch hoặc bạn không thuộc Ban Chấp Hành nên chưa thể xóa nhiệm vụ.');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa nhiệm vụ này?')) return;
    try {
      setActionError(null);
      await deleteTaskMutation.mutateAsync({
        id: taskId,
        planId: planId!,
        collabActivityId: activityId,
      });
    } catch (err: unknown) {
      console.error('Failed to delete task:', err);
      const formatted = formatError(err);
      setActionError(formatted.message || 'Đơn vị chưa được kích hoạt tham gia kế hoạch nên chưa thể thực hiện thao tác này.');
    }
  };

  // Instant 0ms 2-option single click attendance toggle
  const handleAttendanceToggle = (participantId: string, currentStatus: string, targetStatus: 'present' | 'absent') => {
    if (!canManageOperational) {
      setActionError('Bạn chưa có quyền điểm danh hoạt động này.');
      return;
    }
    const newStatus = currentStatus === targetStatus ? 'unmarked' : targetStatus;
    updateParticipantMutation.mutate({
      participantId,
      data: { attendanceStatus: newStatus },
    });
  };

  // Batch attendance
  const handleBulkAttendance = (status: 'present' | 'absent') => {
    if (selectedParticipantIds.length === 0) return;
    bulkAttendanceMutation.mutate({
      participantIds: selectedParticipantIds,
      status,
    });
    setSelectedParticipantIds([]);
  };

  // CSV Export for Collab participants
  const handleExportCSV = () => {
    if (filteredParticipants.length === 0) return;
    const headers = ['STT', 'Ho va ten', 'MSSV', 'Lop', 'Khoa', 'Don vi', 'Diem danh', 'Email', 'So dien thoai'];
    const rows = filteredParticipants.map((p: any, idx: number) => {
      const orgName = participatingOrganizations.find((o) => o.id === p.member?.organizationId)?.name || 'Đơn vị';
      const attStatus = p.attendanceStatus === 'present' ? 'Co mat' : p.attendanceStatus === 'absent' ? 'Vang' : 'Chua diem danh';
      return [
        idx + 1,
        `"${p.member?.fullName || ''}"`,
        `"${p.member?.studentId || ''}"`,
        `"${p.member?.className || ''}"`,
        `"${p.member?.cohort || ''}"`,
        `"${orgName}"`,
        `"${attStatus}"`,
        `"${p.member?.email || ''}"`,
        `"${p.member?.phone || ''}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Diem_danh_${activity?.code || 'Collab'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (isActivityLoading || isPlanLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
        <span>Đang tải thông tin hoạt động Collab...</span>
      </div>
    );
  }

  if (!activity || !plan) {
    return (
      <div className="p-12 max-w-lg mx-auto text-center space-y-4">
        <div className="h-16 w-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy hoạt động</h2>
        <p className="text-xs text-slate-500">
          Hoạt động này không tồn tại hoặc đã bị xóa khỏi chiến dịch.
        </p>
        <Button onClick={() => navigate(`/plans/${planId}`)} variant="outline" size="sm" className="text-xs">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Về trang Chiến dịch
        </Button>
      </div>
    );
  }

  const columns: { status: CollabTaskStatus; title: string; color: string }[] = [
    { status: 'todo', title: 'Cần làm', color: 'text-slate-700' },
    { status: 'in_progress', title: 'Đang làm', color: 'text-blue-700' },
    { status: 'review', title: 'Chờ duyệt', color: 'text-amber-700' },
    { status: 'done', title: 'Hoàn thành', color: 'text-emerald-700' },
  ];

  return (
    <div id="collab-activity-detail-page" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top breadcrumb & Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/plans/${planId}`)}
          className="text-xs text-slate-600 hover:text-slate-900 gap-1.5 pl-0 hover:bg-transparent"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Về Chiến dịch: <strong className="text-slate-900">{plan.name}</strong></span>
        </Button>

        {canManageOperational && (
          <div className="flex items-center gap-2">
            <Select
              value={activity.status}
              onValueChange={(val: ActivityStatus) => handleStatusChange(val)}
              disabled={updateActivityMutation.isPending}
            >
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200 w-[140px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="draft" className="text-xs">Bản nháp</SelectItem>
                <SelectItem value="published" className="text-xs">Đã công bố</SelectItem>
                <SelectItem value="ongoing" className="text-xs">Đang diễn ra</SelectItem>
                <SelectItem value="completed" className="text-xs">Đã hoàn thành</SelectItem>
                <SelectItem value="cancelled" className="text-xs">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActionError(null)} className="h-6 w-6 p-0 text-rose-500">
            ✕
          </Button>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-purple-100 text-purple-800 border-none font-mono text-[11px]">
                {activity.code}
              </Badge>
              <Badge variant="outline" className="text-[11px] font-medium border-slate-200">
                {activity.category === 'volunteer'
                  ? 'Tình nguyện'
                  : activity.category === 'academic'
                  ? 'Học thuật'
                  : activity.category === 'sports'
                  ? 'Thể thao'
                  : activity.category === 'culture'
                  ? 'Văn hóa'
                  : activity.category === 'meeting'
                  ? 'Hội thảo / Họp'
                  : activity.category === 'training'
                  ? 'Tập huấn'
                  : 'Sự kiện'}
              </Badge>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">
                Hoạt động độc lập trong Chiến dịch Collab
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {activity.title}
            </h1>

            {activity.description && (
              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                {activity.description}
              </p>
            )}
          </div>
        </div>

        {/* Metadata info bar: 3 distinct blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 pt-3 border-t border-slate-100 text-xs">
          {/* Block 1: Đơn vị phụ trách */}
          <div className="flex items-center gap-3 py-2 md:py-0 md:pr-4 text-slate-700">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] text-slate-400 block font-medium">Đơn vị phụ trách</span>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${getOrgTypeBadgeClass(activity.leadOrganization?.type)}`}>
                  {getOrgTypeLabel(activity.leadOrganization?.type)}
                </span>
                <span className="font-semibold text-slate-900 truncate" title={activity.leadOrganization?.name}>
                  {activity.leadOrganization?.name || 'Đơn vị phụ trách'}
                </span>
              </div>
            </div>
          </div>

          {/* Block 2: Thời gian diễn ra */}
          <div className="flex items-center gap-3 py-2 md:py-0 md:px-4 text-slate-700">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] text-slate-400 block font-medium">Thời gian diễn ra</span>
              <span className="font-semibold text-slate-900 truncate block mt-0.5">
                {formatDate(activity.startDate)} - {formatDate(activity.endDate)}
              </span>
            </div>
          </div>

          {/* Block 3: Địa điểm */}
          <div className="flex items-center gap-3 py-2 md:py-0 md:pl-4 text-slate-700">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] text-slate-400 block font-medium">Địa điểm</span>
              <span className="font-semibold text-slate-900 truncate block mt-0.5" title={activity.location || 'Chưa cập nhật'}>
                {activity.location || 'Chưa cập nhật'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tasks')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'tasks'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <CheckSquare className="h-4 w-4" />
          <span>Nhiệm Vụ ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('participants')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'participants'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <Users className="h-4 w-4" />
          <span>Người Tham Gia & Điểm Danh ({participantStats.total})</span>
        </button>

        <button
          onClick={() => setActiveTab('forms')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'forms'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Biểu Mẫu Google Form ({forms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={cn(
            'px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer',
            activeTab === 'finance'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <DollarSign className="h-4 w-4" />
          <span>Chi Phí & Thu Chi ({transactions.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Task Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] text-slate-500 font-medium block">Tổng Công Việc</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">{stats.total}</span>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] text-emerald-800 font-medium block">Đã Hoàn Thành</span>
              <span className="text-lg font-bold text-emerald-700 font-mono mt-0.5 block">{stats.completed}</span>
            </div>

            <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] text-blue-800 font-medium block">Đang Thực Hiện</span>
              <span className="text-lg font-bold text-blue-700 font-mono mt-0.5 block">{stats.inProgress}</span>
            </div>

            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] text-amber-800 font-medium block">Chờ Duyệt</span>
              <span className="text-lg font-bold text-amber-700 font-mono mt-0.5 block">{stats.review}</span>
            </div>

            <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] text-rose-800 font-medium block">Trễ Hạn (Overdue)</span>
              <span className="text-lg font-bold text-rose-700 font-mono mt-0.5 block">{stats.overdue}</span>
            </div>
          </div>

          {/* Task Management Dashboard */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-purple-600" />
                  Nhiệm Vụ ({filteredTasks.length})
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Quản lý và phân công công việc liên đơn vị.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative min-w-[180px]">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Tìm việc, người phụ trách..."
                    className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <Select value={taskPriorityFilter} onValueChange={setTaskPriorityFilter}>
                  <SelectTrigger className="h-8 text-xs w-[110px] bg-slate-50">
                    <SelectValue placeholder="Ưu tiên" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="all" className="text-xs">Tất cả ưu tiên</SelectItem>
                    <SelectItem value="urgent" className="text-xs">Khẩn cấp</SelectItem>
                    <SelectItem value="high" className="text-xs">Cao</SelectItem>
                    <SelectItem value="medium" className="text-xs">Trung bình</SelectItem>
                    <SelectItem value="low" className="text-xs">Thấp</SelectItem>
                  </SelectContent>
                </Select>

                {participatingOrganizations.length > 1 && (
                  <Select value={taskOrgFilter} onValueChange={setTaskOrgFilter}>
                    <SelectTrigger className="h-8 text-xs w-[130px] bg-slate-50">
                      <SelectValue placeholder="Đơn vị phụ trách" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="all" className="text-xs">Tất cả đơn vị</SelectItem>
                      {participatingOrganizations.map((org) => (
                        <SelectItem key={org.id} value={org.id} className="text-xs">
                          {org.code} - {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'table' ? 'bg-white shadow-xs text-purple-700 font-medium' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="Xem dạng bảng"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('kanban')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'kanban' ? 'bg-white shadow-xs text-purple-700 font-medium' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="Xem dạng bảng Kanban"
                  >
                    <Kanban className="h-3.5 w-3.5" />
                  </button>
                </div>

                {canManageOperational && (
                  <Button
                    id="btn-add-collab-task-main"
                    size="sm"
                    onClick={() => {
                      setEditingTask(null);
                      setIsTaskDialogOpen(true);
                    }}
                    className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Giao việc
                  </Button>
                )}
              </div>
            </div>

            {/* Kanban Board View */}
            {viewMode === 'kanban' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {columns.map((col) => {
                  const colTasks = filteredTasks.filter((t) => t.status === col.status);

                  return (
                    <div
                      key={col.status}
                      className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col min-h-[350px] min-w-0"
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                        <span className={`text-xs font-bold ${col.color} flex items-center gap-1.5`}>
                          {col.title}
                        </span>
                        <Badge className="bg-white text-slate-600 text-[10px] px-1.5 py-0.2 border border-slate-200">
                          {colTasks.length}
                        </Badge>
                      </div>

                      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                        {colTasks.length === 0 ? (
                          <div className="p-4 text-center text-[11px] text-slate-400 italic">
                            Không có công việc nào
                          </div>
                        ) : (
                          colTasks.map((task) => {
                            const isOverdue =
                              task.dueDate &&
                              task.dueDate < new Date().toISOString().split('T')[0] &&
                              task.status !== 'done';

                            const assigneePerson = personnel.find((p) => p.userId === task.assignedTo);

                            return (
                              <div
                                key={task.id}
                                className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs space-y-2 hover:border-purple-300 transition-all text-left min-w-0 overflow-hidden"
                              >
                                <div className="flex items-start justify-between gap-1.5 min-w-0">
                                  <span className="text-xs font-semibold text-slate-900 leading-snug break-words break-all min-w-0">
                                    {task.title}
                                  </span>
                                  {canManageOperational && (
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingTask(task);
                                          setIsTaskDialogOpen(true);
                                        }}
                                        className="h-6 w-6 p-0 text-slate-400 hover:text-purple-600"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                {task.description && (
                                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed break-words break-all min-w-0">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex items-center justify-between text-[10px] pt-1 gap-1">
                                  <Badge
                                    className={`text-[10px] px-1.5 py-0 border-none shrink-0 ${
                                      task.priority === 'urgent'
                                        ? 'bg-rose-100 text-rose-800 font-bold'
                                        : task.priority === 'high'
                                        ? 'bg-amber-100 text-amber-800'
                                        : task.priority === 'medium'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {task.priority === 'urgent'
                                      ? 'Khẩn cấp'
                                      : task.priority === 'high'
                                      ? 'Ưu tiên cao'
                                      : task.priority === 'medium'
                                      ? 'Trung bình'
                                      : 'Thấp'}
                                  </Badge>

                                  {task.dueDate && (
                                    <span
                                      className={`flex items-center gap-1 font-mono text-[10px] shrink-0 ${
                                        isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                                      }`}
                                    >
                                      <Clock className="h-3 w-3" />
                                      {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] min-w-0">
                                  {assigneePerson ? (
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                                        {assigneePerson.fullName.slice(0, 1)}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <span className="text-slate-800 font-medium truncate block text-[11px]">
                                          {assigneePerson.fullName}
                                        </span>
                                        <div className="flex items-center gap-1 min-w-0 flex-wrap">
                                          <span className={`text-[8px] px-1 py-0.2 rounded font-semibold border shrink-0 ${getOrgTypeBadgeClass(assigneePerson.organizationType)}`}>
                                            {getOrgTypeLabel(assigneePerson.organizationType)}
                                          </span>
                                          <span className="text-[10px] text-slate-600 font-medium truncate block min-w-0" title={assigneePerson.organizationName}>
                                            {assigneePerson.organizationCode}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px] shrink-0">
                                      Chưa phân công
                                    </span>
                                  )}

                                  {canManageOperational && (
                                    <Select
                                      value={task.status}
                                      onValueChange={(val: CollabTaskStatus) => handleTaskStatusChange(task, val)}
                                    >
                                      <SelectTrigger className="h-6 w-20 text-[10px] bg-slate-50 border-slate-200 shrink-0">
                                        <SelectValue placeholder="Chuyển" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white border-slate-200">
                                        <SelectItem value="todo" className="text-[10px]">Cần làm</SelectItem>
                                        <SelectItem value="in_progress" className="text-[10px]">Đang làm</SelectItem>
                                        <SelectItem value="review" className="text-[10px]">Chờ duyệt</SelectItem>
                                        <SelectItem value="done" className="text-[10px]">Hoàn thành</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Table View */
              <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Tiêu đề công việc</th>
                      <th className="px-4 py-3">Người phụ trách</th>
                      <th className="px-4 py-3">Mức ưu tiên</th>
                      <th className="px-4 py-3">Hạn chót</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      {canManageOperational && <th className="px-4 py-3 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                          Không có công việc nào phù hợp với bộ lọc
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((task) => {
                        const assigneePerson = personnel.find((p) => p.userId === task.assignedTo);
                        const isOverdue =
                          task.dueDate &&
                          task.dueDate < new Date().toISOString().split('T')[0] &&
                          task.status !== 'done';

                        return (
                          <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-900 min-w-[200px] max-w-[320px]">
                              <div className="break-words break-all">{task.title}</div>
                              {task.description && (
                                <p className="text-[11px] text-slate-500 font-normal line-clamp-1 break-words break-all">
                                  {task.description}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-3 min-w-[180px]">
                              {assigneePerson ? (
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                                    {assigneePerson.fullName.slice(0, 1)}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-medium text-slate-900 block truncate">{assigneePerson.fullName}</span>
                                    <div className="flex items-center gap-1 mt-0.5 min-w-0 flex-wrap">
                                      <span className={`text-[8px] px-1 py-0.2 rounded font-semibold border shrink-0 ${getOrgTypeBadgeClass(assigneePerson.organizationType)}`}>
                                        {getOrgTypeLabel(assigneePerson.organizationType)}
                                      </span>
                                      <span className="text-[10px] text-slate-600 truncate block min-w-0" title={assigneePerson.organizationName}>
                                        {assigneePerson.organizationCode}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Chưa phân công</span>
                              )}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge
                                className={`text-[10px] px-1.5 py-0.5 border-none ${
                                  task.priority === 'urgent'
                                    ? 'bg-rose-100 text-rose-800'
                                    : task.priority === 'high'
                                    ? 'bg-amber-100 text-amber-800'
                                    : task.priority === 'medium'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {task.priority === 'urgent'
                                  ? 'Khẩn cấp'
                                  : task.priority === 'high'
                                  ? 'Cao'
                                  : task.priority === 'medium'
                                  ? 'Trung bình'
                                  : 'Thấp'}
                              </Badge>
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px]">
                              {task.dueDate ? (
                                <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                                  {formatDate(task.dueDate)}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">--</span>
                              )}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap">
                              {canManageOperational ? (
                                <Select
                                  value={task.status}
                                  onValueChange={(val: CollabTaskStatus) => handleTaskStatusChange(task, val)}
                                >
                                  <SelectTrigger className="h-7 text-xs w-[120px] bg-slate-50 border-slate-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border-slate-200">
                                    <SelectItem value="todo" className="text-xs">Cần làm</SelectItem>
                                    <SelectItem value="in_progress" className="text-xs">Đang làm</SelectItem>
                                    <SelectItem value="review" className="text-xs">Chờ duyệt</SelectItem>
                                    <SelectItem value="done" className="text-xs">Hoàn thành</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge className="text-[10px]">
                                  {task.status === 'done'
                                    ? 'Đã hoàn thành'
                                    : task.status === 'in_progress'
                                    ? 'Đang thực hiện'
                                    : task.status === 'review'
                                    ? 'Chờ duyệt'
                                    : 'Chưa làm'}
                                </Badge>
                              )}
                            </td>

                            {canManageOperational && (
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingTask(task);
                                      setIsTaskDialogOpen(true);
                                    }}
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-purple-600"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: PARTICIPANTS & INSTANT 0ms ATTENDANCE */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          {/* KPI Stat Cards (Standard 4 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Tổng người tham gia</span>
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
                {participantStats.total}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Hội viên & Tình nguyện viên</div>
            </Card>

            <Card className="p-4 border-emerald-200/80 bg-emerald-50/40 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
                <span>Có mặt</span>
                <UserCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
                {participantStats.present}
              </div>
              <div className="text-[11px] text-emerald-600/80 mt-0.5">Đã xác nhận tham gia</div>
            </Card>

            <Card className="p-4 border-rose-200/80 bg-rose-50/40 shadow-2xs">
              <div className="flex items-center justify-between text-rose-800 text-xs font-semibold">
                <span>Vắng</span>
                <UserX className="h-4 w-4 text-rose-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-rose-700 font-mono">
                {participantStats.absent}
              </div>
              <div className="text-[11px] text-rose-600/80 mt-0.5">Vắng mặt</div>
            </Card>

            <Card className="p-4 border-blue-200/80 bg-blue-50/40 shadow-2xs">
              <div className="flex items-center justify-between text-blue-800 text-xs font-semibold">
                <span>Tỉ lệ có mặt</span>
                <Percent className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-blue-700 font-mono">
                {participantStats.participationRate}%
              </div>
              <div className="text-[11px] text-blue-600/80 mt-0.5">
                {participantStats.unmarked} chưa điểm danh
              </div>
            </Card>
          </div>

          {/* Participant Table Container */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  Danh Sách Điểm Danh ({filteredParticipants.length})
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Điểm danh 1 chạm phản hồi tức thì cho tất cả hội viên và người đăng ký.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative min-w-[180px]">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    placeholder="Tìm tên, MSSV, lớp..."
                    className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                {/* Status Filter */}
                <Select value={participantStatusFilter} onValueChange={setParticipantStatusFilter}>
                  <SelectTrigger className="h-8 text-xs w-[120px] bg-slate-50">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="all" className="text-xs">Tất cả</SelectItem>
                    <SelectItem value="present" className="text-xs text-emerald-700 font-semibold">Có mặt</SelectItem>
                    <SelectItem value="absent" className="text-xs text-rose-700 font-semibold">Vắng</SelectItem>
                    <SelectItem value="unmarked" className="text-xs text-slate-500">Chưa điểm danh</SelectItem>
                  </SelectContent>
                </Select>

                {/* Org Filter */}
                {participatingOrganizations.length > 1 && (
                  <Select value={participantOrgFilter} onValueChange={setParticipantOrgFilter}>
                    <SelectTrigger className="h-8 text-xs w-[120px] bg-slate-50">
                      <SelectValue placeholder="Đơn vị" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="all" className="text-xs">Tất cả đơn vị</SelectItem>
                      {participatingOrganizations.map((org) => (
                        <SelectItem key={org.id} value={org.id} className="text-xs">
                          {org.code} - {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Batch Action Toolbar */}
                {selectedParticipantIds.length > 0 && canManageOperational && (
                  <div className="flex items-center gap-1.5 bg-purple-50 px-2 py-1 rounded-xl border border-purple-200">
                    <span className="text-[11px] font-bold text-purple-900">
                      Đã chọn {selectedParticipantIds.length}:
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAttendance('present')}
                      className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Có mặt
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAttendance('absent')}
                      className="h-6 text-[10px] px-2 bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Vắng
                    </Button>
                  </div>
                )}

                {/* Google Forms Link Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('forms')}
                  className="h-8 text-xs border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 font-semibold gap-1.5 shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-purple-600" />
                  <span>Google Form ({forms.length})</span>
                </Button>

                {/* Export CSV Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="h-8 text-xs border-slate-200 hover:bg-slate-50 font-medium"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Xuất CSV
                </Button>

                {/* Add Participant Button */}
                {canManageOperational && (
                  <Button
                    size="sm"
                    onClick={() => setIsAddParticipantOpen(true)}
                    className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm font-semibold gap-1"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Thêm người tham gia
                  </Button>
                )}
              </div>
            </div>

            {/* Attendance Table */}
            {isParticipantsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span>Đang tải danh sách người tham gia...</span>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                Chưa có người tham gia nào được ghi nhận cho hoạt động này.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="w-10 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredParticipants.length > 0 &&
                            selectedParticipantIds.length === filteredParticipants.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParticipantIds(filteredParticipants.map((p: any) => p.id));
                            } else {
                              setSelectedParticipantIds([]);
                            }
                          }}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                      </th>
                      <th className="px-4 py-3">Họ và tên</th>
                      <th className="w-28 px-3 py-3 text-center">MSSV</th>
                      <th className="w-20 px-3 py-3 text-center">Lớp</th>
                      <th className="w-16 px-3 py-3 text-center">Khóa</th>
                      <th className="w-32 px-3 py-3">Đơn vị</th>
                      <th className="w-60 px-4 py-3 text-center">Điểm danh</th>
                      {canManageOperational && <th className="w-14 px-3 py-3 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredParticipants.map((p: any) => {
                      const isSelected = selectedParticipantIds.includes(p.id);
                      const isPresent = p.attendanceStatus === 'present';
                      const isAbsent = p.attendanceStatus === 'absent';
                      const memOrg = participatingOrganizations.find((o) => o.id === p.member?.organizationId);

                      return (
                        <tr
                          key={p.id}
                          className={cn(
                            'hover:bg-slate-50/60 transition-colors',
                            isSelected && 'bg-purple-50/30'
                          )}
                        >
                          {/* Checkbox */}
                          <td className="w-10 px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedParticipantIds((prev) => [...prev, p.id]);
                                } else {
                                  setSelectedParticipantIds((prev) => prev.filter((id) => id !== p.id));
                                }
                              }}
                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>

                          {/* Họ và tên */}
                          <td className="px-4 py-3 font-semibold text-slate-900 min-w-[180px]">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {(p.member?.fullName || 'N').slice(0, 1)}
                              </div>
                              <div className="min-w-0">
                                <span className="block truncate">{p.member?.fullName || 'Người tham gia'}</span>
                                {p.member?.email && (
                                  <span className="text-[10px] text-slate-400 font-normal block truncate">
                                    {p.member.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* MSSV */}
                          <td className="w-28 px-3 py-3 text-center font-mono font-medium text-slate-700">
                            {p.member?.studentId || '--'}
                          </td>

                          {/* Lớp */}
                          <td className="w-20 px-3 py-3 text-center font-medium text-slate-700">
                            {p.member?.className || '--'}
                          </td>

                          {/* Khóa */}
                          <td className="w-16 px-3 py-3 text-center font-mono text-slate-600">
                            {p.member?.cohort || '--'}
                          </td>

                          {/* Đơn vị */}
                          <td className="w-32 px-3 py-3">
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium truncate block max-w-[120px]">
                              {memOrg?.code || 'Đơn vị'}
                            </span>
                          </td>

                          {/* Điểm danh: Instant 0ms Flat 2-Button Group */}
                          <td className="w-60 px-4 py-3 text-center">
                            <div className="inline-flex items-center justify-center gap-1.5 p-1 bg-slate-100/90 rounded-xl">
                              {/* Có mặt Button */}
                              <button
                                type="button"
                                disabled={!canManageOperational}
                                onClick={() => handleAttendanceToggle(p.id, p.attendanceStatus, 'present')}
                                className={cn(
                                  'h-7 px-3 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all',
                                  isPresent
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-emerald-700 hover:bg-emerald-100/70 bg-transparent'
                                )}
                              >
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                <span>Có mặt</span>
                              </button>

                              {/* Vắng Button */}
                              <button
                                type="button"
                                disabled={!canManageOperational}
                                onClick={() => handleAttendanceToggle(p.id, p.attendanceStatus, 'absent')}
                                className={cn(
                                  'h-7 px-3 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all',
                                  isAbsent
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-rose-700 hover:bg-rose-100/70 bg-transparent'
                                )}
                              >
                                <X className="h-3.5 w-3.5 stroke-[2.5]" />
                                <span>Vắng</span>
                              </button>
                            </div>
                          </td>

                          {/* Thao tác */}
                          {canManageOperational && (
                            <td className="w-14 px-3 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Bạn có chắc muốn xóa người này khỏi danh sách tham gia?')) {
                                    removeParticipantMutation.mutate(p.id);
                                  }
                                }}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: FINANCE */}
      {activeTab === 'finance' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                Khoản Thu / Chi Hoạt Động ({transactions.length})
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Các chứng từ và giao dịch tài chính ghi nhận trực tiếp cho hoạt động này.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Tổng chi phí:</span>
              <span className="text-sm font-bold text-purple-900 font-mono">
                {formatVND(stats.totalExpense)}
              </span>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">
              Chưa có khoản thu chi nào được ghi nhận cho hoạt động này.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Nội dung chi / thu</th>
                    <th className="px-4 py-3">Danh mục</th>
                    <th className="px-4 py-3">Đơn vị chi</th>
                    <th className="px-4 py-3">Ngày ghi nhận</th>
                    <th className="px-4 py-3 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{tx.description}</td>
                      <td className="px-4 py-3">{tx.categoryName}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                          {tx.organization?.code || 'Đơn vị'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">{formatDate(tx.transactionDate)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatVND(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: GOOGLE FORMS INTEGRATION */}
      {activeTab === 'forms' && (
        <ActivityGoogleFormsSection
          activity={activity as any}
          canManage={canManageOperational}
        />
      )}

      {/* Dialog for Create/Edit Collab Task */}
      <CreateCollabTaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        planId={planId!}
        collabActivityId={activityId}
        editingTask={editingTask}
        onSuccess={() => {
          refetchTasks();
        }}
      />

      {/* Dialog for Add Collab Participant */}
      <AddCollabParticipantDialog
        isOpen={isAddParticipantOpen}
        onClose={() => setIsAddParticipantOpen(false)}
        activityId={activityId!}
        planId={planId!}
        defaultOrganizationId={activity.leadOrganizationId || activeOrganization?.id}
        participatingOrganizations={participatingOrganizations}
      />
    </div>
  );
}
