import { useState, useMemo, Fragment } from 'react';
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
  UserPlus,
  Download,
  Check,
  X,
  Loader2,
  ShieldCheck,
  FileSpreadsheet,
  Phone,
  Flag,
  Share2,
  Package,
  ChevronRight,
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
import { ImportCollabParticipantsModal } from '@/features/plans/components/ImportCollabParticipantsModal';
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
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'timeline'>('table');

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
  const [isImportParticipantsOpen, setIsImportParticipantsOpen] = useState(false);
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
      if (taskStatusFilter !== 'all') {
        if (taskStatusFilter === 'overdue') {
          const today = new Date().toISOString().split('T')[0];
          if (!(task.dueDate && task.dueDate < today && task.status !== 'done')) return false;
        } else if (task.status !== taskStatusFilter) {
          return false;
        }
      }
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

  // Gom nhóm công việc theo Mảng (Category) tương tự Google Sheet
  const groupedTasksByCategory = useMemo(() => {
    const groups: Record<string, CollabTask[]> = {};
    filteredTasks.forEach((task) => {
      const cat = task.category?.trim() || 'Công việc chung';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(task);
    });
    return groups;
  }, [filteredTasks]);

  // Filtered Participants
  const filteredParticipants = useMemo(() => {
    return participants.filter((p: any) => {
      if (participantStatusFilter !== 'all' && p.attendanceStatus !== participantStatusFilter) return false;
      if (participantOrgFilter !== 'all') {
        if (participantOrgFilter === 'external') {
          if (!p.externalOrganization && p.organizationId) return false;
        } else if (p.organizationId !== participantOrgFilter && p.member?.organizationId !== participantOrgFilter) {
          return false;
        }
      }

      if (participantSearch.trim()) {
        const q = participantSearch.toLowerCase();
        const nameMatch = (p.fullName || p.member?.fullName || '').toLowerCase().includes(q);
        const idMatch = (p.studentId || p.member?.studentId || '').toLowerCase().includes(q);
        const classMatch = (p.className || p.member?.className || '').toLowerCase().includes(q);
        const cohortVal = String(p.cohort || p.member?.cohort || '');
        const cohortMatch = cohortVal.toLowerCase().includes(q) || `k${cohortVal}`.toLowerCase().includes(q);
        const emailMatch = (p.email || p.member?.email || '').toLowerCase().includes(q);
        const roleMatch = (p.roleTitle || '').toLowerCase().includes(q);
        const extMatch = (p.externalOrganization || '').toLowerCase().includes(q);
        return nameMatch || idMatch || classMatch || cohortMatch || emailMatch || roleMatch || extMatch;
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
    const headers = ['STT', 'Ho va ten', 'MSSV', 'Lop', 'Khoa', 'Don vi', 'Doi hinh', 'Diem danh', 'Email', 'So dien thoai'];
    const rows = filteredParticipants.map((p: any, idx: number) => {
      const orgName = p.externalOrganization
        ? p.externalOrganization
        : participatingOrganizations.find((o) => o.id === p.organizationId || o.id === p.member?.organizationId)?.name || 'Đơn vị';
      const attStatus = p.attendanceStatus === 'present' ? 'Co mat' : p.attendanceStatus === 'absent' ? 'Vang' : 'Chua diem danh';
      return [
        idx + 1,
        `"${p.fullName || p.member?.fullName || ''}"`,
        `"${p.studentId || p.member?.studentId || ''}"`,
        `"${p.className || p.member?.className || ''}"`,
        `"${p.cohort || p.member?.cohort || ''}"`,
        `"${orgName}"`,
        `"${p.roleTitle || 'Tình nguyện viên'}"`,
        `"${attStatus}"`,
        `"${p.email || p.member?.email || ''}"`,
        `"${p.phone || p.member?.phone || ''}"`,
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

  const handleDeleteParticipant = async (participantId: string) => {
    if (!canManageOperational) return;
    if (!confirm('Bạn có chắc chắn muốn xóa người này khỏi danh sách tham gia?')) return;
    try {
      await removeParticipantMutation.mutateAsync(participantId);
      setSelectedParticipantIds((prev) => prev.filter((id) => id !== participantId));
    } catch (err) {
      console.error('Failed to remove participant:', err);
    }
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
        <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
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
    <div id="collab-activity-detail-page" className="w-full space-y-4">
      {/* Top Breadcrumb & Status Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Sleek Minimal Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link
            to="/plans"
            className="hover:text-slate-900 transition-colors"
          >
            Chiến dịch
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link
            to={`/plans/${planId}`}
            className="hover:text-slate-900 transition-colors font-medium text-slate-700 truncate max-w-[220px]"
            title={plan.name}
          >
            {plan.name}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="font-mono font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200/60">
            {activity.code}
          </span>
        </div>

        {canManageOperational && (
          <div className="flex items-center gap-2">
            <Select
              value={activity.status}
              onValueChange={(val: ActivityStatus) => handleStatusChange(val)}
              disabled={updateActivityMutation.isPending}
            >
              <SelectTrigger className="h-8 text-xs bg-white border-slate-200/90 shadow-2xs w-[140px] font-medium rounded-lg">
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
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActionError(null)} className="h-6 w-6 p-0 text-rose-500">
            ✕
          </Button>
        </div>
      )}

      {/* Hero Header Card - Minimal Linear & Apple Style */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[11px] font-medium text-slate-600 border-slate-200 bg-slate-50/80">
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
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-normal">
              Hoạt động độc lập trong Chiến dịch Collab
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {activity.title}
          </h1>

          {activity.description && (
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed pt-0.5">
              {activity.description}
            </p>
          )}
        </div>

        {/* Minimal Horizontal Property Ribbon */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-100 text-xs">
          {/* Đơn vị phụ trách */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/70 text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <span className="text-slate-400 font-medium">Đơn vị:</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${getOrgTypeBadgeClass(activity.leadOrganization?.type)}`}>
              {getOrgTypeLabel(activity.leadOrganization?.type)}
            </span>
            <span className="font-semibold text-slate-900 truncate max-w-[200px]" title={activity.leadOrganization?.name}>
              {activity.leadOrganization?.name || 'Đơn vị phụ trách'}
            </span>
          </div>

          {/* Thời gian diễn ra */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/70 text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="text-slate-400 font-medium">Thời gian:</span>
            <span className="font-medium text-slate-900 font-mono">
              {formatDate(activity.startDate)} – {formatDate(activity.endDate)}
            </span>
          </div>

          {/* Địa điểm */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/70 text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-slate-400 font-medium">Địa điểm:</span>
            <span className="font-medium text-slate-900 truncate max-w-[240px]" title={activity.location || 'Chưa cập nhật'}>
              {activity.location || 'Chưa cập nhật'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Header - Minimal Underline Style */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={cn(
            'flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer -mb-px',
            activeTab === 'tasks'
              ? 'border-violet-600 text-violet-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          )}
        >
          <CheckSquare className="h-4 w-4 shrink-0" />
          <span>Nhiệm vụ</span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium',
              activeTab === 'tasks' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-600'
            )}
          >
            {tasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('participants')}
          className={cn(
            'flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer -mb-px',
            activeTab === 'participants'
              ? 'border-violet-600 text-violet-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          )}
        >
          <Users className="h-4 w-4 shrink-0" />
          <span>Người tham gia</span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium',
              activeTab === 'participants' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-600'
            )}
          >
            {participantStats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('forms')}
          className={cn(
            'flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer -mb-px',
            activeTab === 'forms'
              ? 'border-violet-600 text-violet-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          )}
        >
          <FileSpreadsheet className="h-4 w-4 shrink-0" />
          <span>Google Form</span>
          {forms.length > 0 && (
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium',
                activeTab === 'forms' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-600'
              )}
            >
              {forms.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('finance')}
          className={cn(
            'flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer -mb-px',
            activeTab === 'finance'
              ? 'border-violet-600 text-violet-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          )}
        >
          <DollarSign className="h-4 w-4 shrink-0" />
          <span>Thu chi</span>
          {transactions.length > 0 && (
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium',
                activeTab === 'finance' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-600'
              )}
            >
              {transactions.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT 1: TASKS */}
      {activeTab === 'tasks' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          {/* Top Bar: Interactive Status Chips + Progress Indicator */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            {/* Quick Interactive Status Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setTaskStatusFilter('all')}
                className={cn(
                  'h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                  taskStatusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                )}
              >
                <span>Tất cả</span>
                <span className={cn('text-[10px] font-mono px-1 rounded', taskStatusFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/80 text-slate-600')}>
                  {stats.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTaskStatusFilter(taskStatusFilter === 'todo' ? 'all' : 'todo')}
                className={cn(
                  'h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                  taskStatusFilter === 'todo'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Cần làm</span>
                <span className="text-[10px] font-mono text-slate-500">
                  {stats.todo}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTaskStatusFilter(taskStatusFilter === 'in_progress' ? 'all' : 'in_progress')}
                className={cn(
                  'h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                  taskStatusFilter === 'in_progress'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50/70 text-blue-700 hover:bg-blue-100/80 border border-blue-200/60'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Đang làm</span>
                <span className={cn('text-[10px] font-mono px-1 rounded', taskStatusFilter === 'in_progress' ? 'bg-blue-700 text-blue-100' : 'text-blue-700')}>
                  {stats.inProgress}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTaskStatusFilter(taskStatusFilter === 'review' ? 'all' : 'review')}
                className={cn(
                  'h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                  taskStatusFilter === 'review'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50/70 text-amber-700 hover:bg-amber-100/80 border border-amber-200/60'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Chờ duyệt</span>
                <span className={cn('text-[10px] font-mono px-1 rounded', taskStatusFilter === 'review' ? 'bg-amber-700 text-amber-100' : 'text-amber-700')}>
                  {stats.review}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTaskStatusFilter(taskStatusFilter === 'done' ? 'all' : 'done')}
                className={cn(
                  'h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                  taskStatusFilter === 'done'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200/60'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Đã xong</span>
                <span className={cn('text-[10px] font-mono px-1 rounded', taskStatusFilter === 'done' ? 'bg-emerald-700 text-emerald-100' : 'text-emerald-700')}>
                  {stats.completed}
                </span>
              </button>

              {stats.overdue > 0 && (
                <button
                  type="button"
                  onClick={() => setTaskStatusFilter(taskStatusFilter === 'overdue' ? 'all' : 'overdue')}
                  className={cn(
                    'h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                    taskStatusFilter === 'overdue'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>Trễ hạn</span>
                  <span className="text-[10px] font-mono font-bold text-rose-700">
                    {stats.overdue}
                  </span>
                </button>
              )}
            </div>

            {/* Completion Rate indicator */}
            <div className="flex items-center gap-2.5 text-xs text-slate-500 self-end lg:self-auto shrink-0">
              <span className="text-[11px] font-medium text-slate-500">Tiến độ:</span>
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%` }}
                />
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-700">
                {stats.completed}/{stats.total} ({stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>

          {/* Action Row: Search, Filters, View Modes & Giao việc */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Tìm việc, người phụ trách..."
                className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-white shadow-2xs text-violet-700 font-medium' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="Xem dạng bảng"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'kanban' ? 'bg-white shadow-2xs text-violet-700 font-medium' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="Xem dạng bảng Kanban"
                >
                  <Kanban className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('timeline')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'timeline' ? 'bg-white shadow-2xs text-violet-700 font-medium' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="Xem dòng thời gian Timeline"
                >
                  <Clock className="h-3.5 w-3.5" />
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
                  className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-2xs font-semibold rounded-lg active:scale-[0.98] transition-all cursor-pointer"
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
                                className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs space-y-2 hover:border-violet-300 transition-all text-left min-w-0 overflow-hidden"
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
                                        className="h-6 w-6 p-0 text-slate-400 hover:text-violet-600"
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
                                  {task.externalAssignee ? (
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1">
                                        <Badge className="bg-violet-50 text-violet-700 border border-violet-200/70 text-[9px] px-1 py-0.2 shrink-0">
                                          Đối tác ngoài
                                        </Badge>
                                        <span className="text-violet-950 font-semibold truncate block text-[11px]" title={task.externalAssignee}>
                                          {task.externalAssignee}
                                        </span>
                                      </div>
                                      {task.externalContact && (
                                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5 mt-0.5">
                                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                                          {task.externalContact}
                                        </span>
                                      )}
                                    </div>
                                  ) : assigneePerson ? (
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 font-bold text-[9px] flex items-center justify-center shrink-0">
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
            ) : viewMode === 'timeline' ? (
              /* Timeline View */
              <div className="space-y-6 pt-2">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 italic">
                    Không có công việc nào phù hợp với bộ lọc
                  </div>
                ) : (
                  Object.entries(
                    filteredTasks.reduce((acc, task) => {
                      const pName = task.phase?.trim() || 'Hạng mục công việc chung';
                      if (!acc[pName]) acc[pName] = [];
                      acc[pName].push(task);
                      return acc;
                    }, {} as Record<string, CollabTask[]>)
                  ).map(([phaseName, phaseTasks]) => (
                    <div key={phaseName} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
                            <Flag className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                            {phaseName}
                          </h3>
                        </div>
                        <Badge className="bg-white text-violet-700 border border-violet-200 text-[10px] font-mono">
                          {phaseTasks.length} nhiệm vụ
                        </Badge>
                      </div>

                      <div className="relative pl-6 sm:pl-8 border-l-2 border-violet-200 ml-3 sm:ml-4 space-y-3 pt-1">
                        {phaseTasks.map((task) => {
                          const assigneePerson = personnel.find((p) => p.userId === task.assignedTo);
                          const isOverdue =
                            task.dueDate &&
                            task.dueDate < new Date().toISOString().split('T')[0] &&
                            task.status !== 'done';

                          return (
                            <div
                              key={task.id}
                              className="relative bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-violet-300 transition-all space-y-2"
                            >
                              {/* Timeline bullet */}
                              <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-3.5 h-3.5 rounded-full bg-white border-3 border-violet-600 shadow-xs" />

                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {(task.dueTime || task.dueDate) && (
                                    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                                      <Clock className="w-3 h-3 text-indigo-600" />
                                      <span>
                                        {task.dueTime ? `${task.dueTime} ` : ''}
                                        {task.dueDate ? `(${formatDate(task.dueDate)})` : ''}
                                      </span>
                                    </span>
                                  )}
                                  <Badge
                                    className={`text-[10px] px-1.5 py-0.2 border-none ${
                                      task.priority === 'urgent'
                                        ? 'bg-rose-100 text-rose-800'
                                        : task.priority === 'high'
                                        ? 'bg-amber-100 text-amber-800'
                                        : task.priority === 'medium'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {task.priority === 'urgent' ? 'Khẩn cấp' : task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {canManageOperational && (
                                    <Select
                                      value={task.status}
                                      onValueChange={(val: CollabTaskStatus) => handleTaskStatusChange(task, val)}
                                    >
                                      <SelectTrigger className="h-6 w-24 text-[10px] bg-slate-50 border-slate-200">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white border-slate-200">
                                        <SelectItem value="todo" className="text-[10px]">Cần làm</SelectItem>
                                        <SelectItem value="in_progress" className="text-[10px]">Đang làm</SelectItem>
                                        <SelectItem value="review" className="text-[10px]">Chờ duyệt</SelectItem>
                                        <SelectItem value="done" className="text-[10px]">Hoàn thành</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                  {canManageOperational && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingTask(task);
                                          setIsTaskDialogOpen(true);
                                        }}
                                        className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700"
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
                                    </>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{task.title}</h4>
                                {task.description && (
                                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{task.description}</p>
                                )}
                              </div>

                              {/* Assignee Footer */}
                              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs flex-wrap">
                                {task.externalAssignee ? (
                                  <div className="inline-flex items-center gap-1.5 text-xs text-violet-900 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-200/70 font-semibold">
                                    <Share2 className="w-3 h-3 text-violet-600" />
                                    <span>Đối tác: <strong>{task.externalAssignee}</strong></span>
                                    {task.externalContact && (
                                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-0.5 ml-1">
                                        <Phone className="w-2.5 h-2.5" />
                                        {task.externalContact}
                                      </span>
                                    )}
                                  </div>
                                ) : assigneePerson ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[9px] flex items-center justify-center">
                                      {assigneePerson.fullName.slice(0, 1)}
                                    </div>
                                    <span className="font-medium text-slate-800">{assigneePerson.fullName}</span>
                                    <span className="text-[10px] text-slate-500">({assigneePerson.organizationCode})</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">Chưa phân công</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Table View */
              <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/90 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Nội dung công việc</th>
                      <th className="px-4 py-3">Đơn vị phụ trách</th>
                      <th className="px-4 py-3">Người phụ trách</th>
                      <th className="px-4 py-3">Sản phẩm đầu ra</th>
                      <th className="px-4 py-3">Deadline</th>
                      <th className="px-4 py-3">Ưu tiên</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      {canManageOperational && <th className="px-4 py-3 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={canManageOperational ? 8 : 7} className="px-4 py-8 text-center text-slate-400 italic">
                          Không có công việc nào phù hợp với bộ lọc
                        </td>
                      </tr>
                    ) : (
                      Object.entries(groupedTasksByCategory).map(([categoryName, catTasks]) => (
                        <Fragment key={categoryName}>
                          {/* Dòng tiêu đề Mảng công việc phong cách Linear */}
                          <tr className="bg-slate-50/80 border-t border-b border-slate-200/80">
                            <td colSpan={canManageOperational ? 8 : 7} className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />
                                <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">{categoryName}</span>
                                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shadow-2xs">
                                  {catTasks.length} việc
                                </span>
                              </div>
                            </td>
                          </tr>

                          {catTasks.map((task) => {
                            const assigneePerson = personnel.find((p) => p.userId === task.assignedTo);
                            const isOverdue =
                              task.dueDate &&
                              task.dueDate < new Date().toISOString().split('T')[0] &&
                              task.status !== 'done';
                            const isLeadOrg = task.organizationId && plan?.leadOrganizationId === task.organizationId;

                            return (
                              <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                                {/* 1. Nội dung công việc */}
                                <td className="px-4 py-3 font-semibold text-slate-900 min-w-[200px] max-w-[320px]">
                                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                    {task.phase && (
                                      <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700 border border-slate-200/70">
                                        {task.phase.split(':')[0] || task.phase}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs sm:text-sm font-semibold text-slate-900 break-words">{task.title}</div>
                                  {task.description && (
                                    <p className="text-[11px] text-slate-500 font-normal line-clamp-1 break-words mt-0.5">
                                      {task.description}
                                    </p>
                                  )}
                                </td>

                                {/* 2. Đơn vị phụ trách */}
                                <td className="px-4 py-3 whitespace-nowrap min-w-[130px]">
                                  {task.externalOrganization ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      <span>{task.externalOrganization}</span>
                                    </span>
                                  ) : task.organization ? (
                                    <span className={cn(
                                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs",
                                      isLeadOrg
                                        ? "bg-rose-50 text-rose-700 border-rose-200/80"
                                        : "bg-blue-50 text-blue-700 border-blue-200/80"
                                    )}>
                                      <span className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        isLeadOrg ? "bg-rose-500" : "bg-blue-500"
                                      )} />
                                      <span>{task.organization.code || task.organization.name}</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">Chưa chỉ định</span>
                                  )}
                                </td>

                                {/* 3. Người phụ trách */}
                                <td className="px-4 py-3 min-w-[150px]">
                                  {task.externalAssignee ? (
                                    <div className="min-w-0">
                                      <span className="font-semibold text-slate-800 text-xs truncate block" title={task.externalAssignee}>
                                        {task.externalAssignee}
                                      </span>
                                      {task.externalContact && (
                                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                                          <span>{task.externalContact}</span>
                                        </span>
                                      )}
                                    </div>
                                  ) : assigneePerson ? (
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                        {assigneePerson.fullName.slice(0, 1)}
                                      </div>
                                      <div className="min-w-0">
                                        <span className="font-medium text-slate-900 block truncate text-xs">{assigneePerson.fullName}</span>
                                        <span className="text-[10px] text-slate-500 truncate block min-w-0">
                                          {assigneePerson.organizationCode}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">Đơn vị tự phân công</span>
                                  )}
                                </td>

                                {/* 4. Sản phẩm đầu ra */}
                                <td className="px-4 py-3 min-w-[150px] max-w-[220px]">
                                  {task.deliverable ? (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/80 text-slate-800 font-medium text-xs max-w-full shadow-2xs">
                                      <Package className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                                      <span className="truncate block" title={task.deliverable}>{task.deliverable}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 font-mono text-xs">--</span>
                                  )}
                                </td>

                                {/* 5. Deadline */}
                                <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px]">
                                  {task.dueDate ? (
                                    <span className={cn(
                                      "inline-flex items-center gap-1",
                                      isOverdue ? "text-rose-600 font-bold" : "text-slate-600"
                                    )}>
                                      {formatDate(task.dueDate)}
                                      {task.dueTime && <span className="text-[10px] text-slate-400">({task.dueTime})</span>}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">--</span>
                                  )}
                                </td>

                                {/* 6. Mức ưu tiên */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Badge
                                    className={`text-[10px] px-2 py-0.5 border shadow-2xs font-medium ${
                                      task.priority === 'urgent'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : task.priority === 'high'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : task.priority === 'medium'
                                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
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

                                {/* 7. Trạng thái */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {canManageOperational ? (
                                    <Select
                                      value={task.status}
                                      onValueChange={(val: CollabTaskStatus) => handleTaskStatusChange(task, val)}
                                    >
                                      <SelectTrigger className="h-7 text-xs w-[115px] bg-white border-slate-200 shadow-2xs rounded-lg font-medium">
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

                                {/* 8. Thao tác */}
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
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-violet-600"
                                        title="Chỉnh sửa"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                                        title="Xóa"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {/* TAB CONTENT 2: PARTICIPANTS & INSTANT 0ms ATTENDANCE */}
      {activeTab === 'participants' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          {/* Top Bar: Interactive Participant Status Chips + Attendance Rate */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            {/* Quick Interactive Status Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setParticipantStatusFilter('all')}
                className={cn(
                  'h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                  participantStatusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                )}
              >
                <span>Tất cả</span>
                <span className={cn('text-[10px] font-mono px-1 rounded', participantStatusFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/80 text-slate-600')}>
                  {participantStats.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setParticipantStatusFilter(participantStatusFilter === 'present' ? 'all' : 'present')}
                className={cn(
                  'h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                  participantStatusFilter === 'present'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200/60'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Có mặt</span>
                <span className={cn('text-[10px] font-mono px-1 rounded', participantStatusFilter === 'present' ? 'bg-emerald-700 text-emerald-100' : 'text-emerald-700')}>
                  {participantStats.present}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setParticipantStatusFilter(participantStatusFilter === 'absent' ? 'all' : 'absent')}
                className={cn(
                  'h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                  participantStatusFilter === 'absent'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50/70 text-rose-700 hover:bg-rose-100/80 border border-rose-200/60'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Vắng</span>
                <span className={cn('text-[10px] font-mono px-1 rounded', participantStatusFilter === 'absent' ? 'bg-rose-700 text-rose-100' : 'text-rose-700')}>
                  {participantStats.absent}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setParticipantStatusFilter(participantStatusFilter === 'unmarked' ? 'all' : 'unmarked')}
                className={cn(
                  'h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer',
                  participantStatusFilter === 'unmarked'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Chưa điểm danh</span>
                <span className="text-[10px] font-mono text-slate-500">
                  {participantStats.unmarked}
                </span>
              </button>
            </div>

            {/* Attendance Rate */}
            <div className="flex items-center gap-2.5 text-xs text-slate-500 self-end lg:self-auto shrink-0">
              <span className="text-[11px] font-medium text-slate-500">Tỉ lệ có mặt:</span>
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${participantStats.participationRate}%` }}
                />
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-700">
                {participantStats.participationRate}%
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                placeholder="Tìm tên, MSSV, lớp..."
                className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
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
                  <div className="flex items-center gap-1.5 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-violet-900">
                      Đã chọn {selectedParticipantIds.length}:
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAttendance('present')}
                      className="h-6 text-[10px] px-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold active:scale-[0.98]"
                    >
                      Có mặt
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAttendance('absent')}
                      className="h-6 text-[10px] px-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold active:scale-[0.98]"
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
                  className="h-8 text-xs border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 font-semibold gap-1.5 rounded-lg shadow-2xs active:scale-[0.98] cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-violet-600" />
                  <span>Google Form ({forms.length})</span>
                </Button>

                {/* Export CSV Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="h-8 text-xs border-slate-200/90 hover:bg-slate-50 text-slate-700 font-medium rounded-lg shadow-2xs active:scale-[0.98]"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Xuất CSV
                </Button>

                {/* Paste & Import Button */}
                {canManageOperational && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImportParticipantsOpen(true)}
                    className="h-8 text-xs border-emerald-200/80 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70 font-semibold gap-1.5 rounded-lg shadow-2xs active:scale-[0.98] cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    <span>⚡ Nhập từ Sheet</span>
                  </Button>
                )}

                {/* Add Participant Button */}
                {canManageOperational && (
                  <Button
                    size="sm"
                    onClick={() => setIsAddParticipantOpen(true)}
                    className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-2xs font-semibold gap-1.5 rounded-lg active:scale-[0.98] cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Thêm người</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Attendance Table */}
            {isParticipantsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                <span>Đang tải danh sách người tham gia...</span>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Users className="h-5 w-5" />
                </div>
                <p>Chưa có người tham gia nào được ghi nhận cho hoạt động này.</p>
                {canManageOperational && (
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsImportParticipantsOpen(true)}
                      className="text-xs gap-1 border-emerald-200/80 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70 rounded-lg active:scale-[0.98]"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Dán từ Google Sheet
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsAddParticipantOpen(true)}
                      className="text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg active:scale-[0.98] gap-1"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Thêm người đầu tiên
                    </Button>
                  </div>
                )}
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
                          className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 min-w-[180px]">Họ và tên</th>
                      <th className="w-24 px-3 py-3 text-center">MSSV</th>
                      <th className="w-24 px-3 py-3 text-center">Lớp / Khóa</th>
                      <th className="w-28 px-3 py-3">Đơn vị</th>
                      <th className="w-36 px-3 py-3">Đội hình / Vai trò</th>
                      <th className="w-48 px-3 py-3 text-center">Điểm danh</th>
                      {canManageOperational && <th className="w-12 px-2 py-3 text-center">Xóa</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredParticipants.map((p: any) => {
                      const isSelected = selectedParticipantIds.includes(p.id);
                      const isPresent = p.attendanceStatus === 'present';
                      const isAbsent = p.attendanceStatus === 'absent';
                      const memOrg = participatingOrganizations.find((o) => o.id === p.organizationId || o.id === p.member?.organizationId);

                      return (
                        <tr
                          key={p.id}
                          className={cn(
                            'hover:bg-slate-50/60 transition-colors',
                            isSelected && 'bg-violet-50/40'
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
                              className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                            />
                          </td>

                          {/* Họ và tên */}
                          <td className="px-4 py-3 font-semibold text-slate-900 min-w-[180px]">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {(p.fullName || p.member?.fullName || 'N').slice(0, 1)}
                              </div>
                              <div className="min-w-0">
                                <span className="block truncate">{p.fullName || p.member?.fullName || 'Người tham gia'}</span>
                                {(p.email || p.phone) && (
                                  <span className="text-[10px] text-slate-400 font-normal block truncate">
                                    {[p.email, p.phone].filter(Boolean).join(' • ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* MSSV */}
                          <td className="w-24 px-3 py-3 text-center font-mono font-medium text-slate-700">
                            {p.studentId || p.member?.studentId || '--'}
                          </td>

                          {/* Lớp / Khóa */}
                          <td className="w-24 px-3 py-3 text-center">
                            <span className="font-medium text-slate-700 block truncate">
                              {p.className || p.member?.className || '--'}
                            </span>
                            {(p.cohort || p.member?.cohort) && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {String(p.cohort || p.member?.cohort).toUpperCase().startsWith('K')
                                  ? (p.cohort || p.member?.cohort)
                                  : `K${p.cohort || p.member?.cohort}`}
                              </span>
                            )}
                          </td>

                          {/* Đơn vị */}
                          <td className="w-28 px-3 py-3">
                            {p.externalOrganization ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-medium truncate max-w-[130px]" title={p.externalOrganization}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="truncate">{p.externalOrganization}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-violet-50 text-violet-800 border border-violet-200/80 px-2 py-0.5 rounded-full font-semibold truncate max-w-[120px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-600 shrink-0" />
                                <span>{memOrg?.code || p.organization?.code || 'Đơn vị'}</span>
                              </span>
                            )}
                          </td>

                          {/* Đội hình / Vai trò */}
                          <td className="w-36 px-3 py-3">
                            <span className="inline-block text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium truncate max-w-[130px]">
                              {p.roleTitle || 'Tình nguyện viên'}
                            </span>
                          </td>

                          {/* Điểm danh: Instant 0ms Flat 2-Button Group */}
                          <td className="w-48 px-3 py-3 text-center">
                            <div className="inline-flex items-center justify-center gap-1 p-0.5 bg-slate-100/90 rounded-lg">
                              {/* Có mặt Button */}
                              <button
                                type="button"
                                disabled={!canManageOperational}
                                onClick={() => handleAttendanceToggle(p.id, p.attendanceStatus, 'present')}
                                className={cn(
                                  'h-6 px-2.5 rounded-md font-bold text-[10px] flex items-center gap-1 transition-all',
                                  isPresent
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-emerald-700 hover:bg-emerald-100/70 bg-transparent'
                                )}
                              >
                                <Check className="h-3 w-3 stroke-[2.5]" />
                                <span>Có mặt</span>
                              </button>

                              {/* Vắng Button */}
                              <button
                                type="button"
                                disabled={!canManageOperational}
                                onClick={() => handleAttendanceToggle(p.id, p.attendanceStatus, 'absent')}
                                className={cn(
                                  'h-6 px-2.5 rounded-md font-bold text-[10px] flex items-center gap-1 transition-all',
                                  isAbsent
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-rose-700 hover:bg-rose-100/70 bg-transparent'
                                )}
                              >
                                <X className="h-3 w-3 stroke-[2.5]" />
                                <span>Vắng</span>
                              </button>
                            </div>
                          </td>

                          {/* Thao tác */}
                          {canManageOperational && (
                            <td className="w-12 px-2 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteParticipant(p.id)}
                                className="h-6 w-6 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Xóa người tham gia"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
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
      )}

      {/* TAB CONTENT 3: FINANCE */}
      {activeTab === 'finance' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-violet-600" />
                Khoản Thu / Chi Hoạt Động ({transactions.length})
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Các chứng từ và giao dịch tài chính ghi nhận trực tiếp cho hoạt động này.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Tổng chi phí:</span>
              <span className="text-sm font-bold text-violet-900 font-mono">
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

      {/* Modal for Import Collab Participants from Sheet/Excel */}
      <ImportCollabParticipantsModal
        isOpen={isImportParticipantsOpen}
        onClose={() => setIsImportParticipantsOpen(false)}
        planId={planId!}
        activityId={activityId!}
        participatingOrganizations={participatingOrganizations}
      />


    </div>
  );
}
