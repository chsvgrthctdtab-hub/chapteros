import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  ArrowLeft,
  Calendar,
  Building2,
  Users,
  Plus,
  CalendarCheck,
  MapPin,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
  Trash2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  DollarSign,
  CheckSquare,
  Search,
  Filter,
  User,
  Kanban,
  List,
  Edit,
  Loader2,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  UserX,
  Percent,
  Download,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import {
  usePlanDetail,
  useRemoveCohost,
  useAcceptPlanInvitation,
  useRejectPlanInvitation,
  useUpdatePlan,
} from '@/features/plans/queries/plan.queries';
import {
  useCollabActivities,
  useCollabTasks,
  useCollabTransactions,
  useCollabPlanPersonnel,
  useUpdateCollabTask,
  useDeleteCollabTask,
  useCollabParticipants,
  useUpdateCollabParticipantStatus,
} from '@/features/plans/queries/collab.queries';
import { CreateCollabActivityDialog } from '@/features/plans/components/CreateCollabActivityDialog';
import { CreateCollabTaskDialog } from '@/features/plans/components/CreateCollabTaskDialog';
import { InviteCohostDialog } from '@/features/plans/components/InviteCohostDialog';
import { EditPlanDialog } from '@/features/plans/components/EditPlanDialog';
import { DeletePlanDialog } from '@/features/plans/components/DeletePlanDialog';
import { CollabFinanceModule } from '@/features/plans/components/CollabFinanceModule';
import { isOrgBoard } from '@/types/roles';
import { formatError } from '@/lib/error-formatter';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { getOrgTypeLabel, getOrgTypeBadgeClass } from '@/lib/organization.utils';
import type { CollabTask, CollabTaskStatus, TaskPriority, PlanStatus } from '@/types';

const PLAN_STATUS_CONFIG: Record<string, { label: string; colorClasses: string }> = {
  draft: { label: 'Bản nháp', colorClasses: 'bg-slate-100 text-slate-700 border-slate-200' },
  planning: { label: 'Đang lập kế hoạch', colorClasses: 'bg-purple-50 text-purple-700 border-purple-200' },
  active: { label: 'Đang thực hiện', colorClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'Đã hoàn thành', colorClasses: 'bg-blue-50 text-blue-700 border-blue-200' },
  cancelled: { label: 'Đã hủy', colorClasses: 'bg-rose-50 text-rose-700 border-rose-200' },
};

type PlanTab = 'activities' | 'participants' | 'tasks' | 'finance' | 'personnel';

export function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { user, activeOrganization, activeRole } = useAuth();

  const [activeTab, setActiveTab] = useState<PlanTab>('activities');
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
  const [isInviteCohostOpen, setIsInviteCohostOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CollabTask | null>(null);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [isDeletePlanOpen, setIsDeletePlanOpen] = useState(false);

  // Filters for campaign-wide tasks
  const [taskSearch, setTaskSearch] = useState('');
  const [taskActivityFilter, setTaskActivityFilter] = useState<string>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [personnelSearch, setPersonnelSearch] = useState('');
  const [personnelOrgFilter, setPersonnelOrgFilter] = useState<string>('all');

  // Filters for campaign-wide participants
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantStatusFilter, setParticipantStatusFilter] = useState<string>('all');
  const [participantOrgFilter, setParticipantOrgFilter] = useState<string>('all');

  // Plan & Collab queries
  const { data: plan, isLoading: isPlanLoading, refetch: refetchPlan } = usePlanDetail(planId);
  const { data: collabActivities = [], isLoading: isActivitiesLoading, refetch: refetchActivities } =
    useCollabActivities(planId);
  const { data: collabTasks = [], isLoading: isTasksLoading, refetch: refetchTasks } =
    useCollabTasks(planId);
  const { data: transactions = [] } = useCollabTransactions(planId);
  const { data: personnel = [], isLoading: isPersonnelLoading } = useCollabPlanPersonnel(planId);
  const { data: participantsResult, isLoading: isParticipantsLoading } = useCollabParticipants(
    undefined,
    planId
  );

  const campaignParticipants = participantsResult?.data || [];
  const campaignParticipantStats = participantsResult?.stats || {
    total: 0,
    present: 0,
    absent: 0,
    unmarked: 0,
    participationRate: 0,
  };

  // Mutations
  const removeCohostMutation = useRemoveCohost();
  const acceptInvitationMutation = useAcceptPlanInvitation();
  const rejectInvitationMutation = useRejectPlanInvitation();
  const updateTaskMutation = useUpdateCollabTask();
  const deleteTaskMutation = useDeleteCollabTask();
  const updateParticipantMutation = useUpdateCollabParticipantStatus(undefined, planId);

  // BCH role check
  const isBch = isOrgBoard(activeRole);

  // My organization relationship with this plan
  const myOrgParticipant = useMemo(() => {
    if (!activeOrganization || !plan) return null;
    if (plan.leadOrganizationId === activeOrganization.id) {
      return {
        status: 'active' as const,
        isHost: true,
        roleInPlan: 'host' as const,
        roleDescription: 'Đơn vị chủ trì',
      };
    }
    const po = (plan.organizations || []).find((o) => o.organizationId === activeOrganization.id);
    if (!po) return null;
    return {
      status: po.status,
      isHost: Boolean(po.isHost),
      roleInPlan: po.roleInPlan,
      roleDescription: po.roleDescription,
    };
  }, [activeOrganization, plan]);

  const isOrgActiveInPlan = myOrgParticipant?.status === 'active';
  const isHostOrg = plan?.leadOrganizationId === activeOrganization?.id;

  // Plan level management (invite/remove cohost, edit plan details): Host Org BCH
  const canManagePlan = isBch && isHostOrg;

  // Operational management (tasks, activities, transactions): Any active participant BCH
  const canManageOperational = isBch && isOrgActiveInPlan;

  const [actionError, setActionError] = useState<string | null>(null);

  // All org IDs already in this plan (Lead Org + Co-hosts)
  const existingOrgIds = useMemo(() => {
    if (!plan) return new Set<string>();
    const ids = new Set<string>();
    if (plan.leadOrganizationId) ids.add(plan.leadOrganizationId);
    (plan.organizations || []).forEach((o) => {
      if (o.status !== 'removed' && o.status !== 'rejected') {
        ids.add(o.organizationId);
      }
    });
    return ids;
  }, [plan]);

  // Check if current user's organization has a pending invitation
  const myOrgPendingInvitation = useMemo(() => {
    if (!activeOrganization || !plan?.organizations) return null;
    return plan.organizations.find(
      (po) => po.organizationId === activeOrganization.id && po.status === 'pending'
    );
  }, [activeOrganization, plan]);

  // Participating organizations list (active only for task assignment & execution)
  const participatingOrganizations = useMemo(() => {
    if (!plan) return [];
    const list: { id: string; name: string; code: string; isHost: boolean }[] = [];
    if (plan.leadOrganization) {
      list.push({
        id: plan.leadOrganization.id,
        name: plan.leadOrganization.name,
        code: plan.leadOrganization.code,
        isHost: true,
      });
    }
    (plan.organizations || []).forEach((po) => {
      if (po.organization && po.organizationId !== plan.leadOrganizationId && po.status === 'active') {
        list.push({
          id: po.organization.id,
          name: po.organization.name,
          code: po.organization.code || 'ORG',
          isHost: false,
        });
      }
    });
    return list;
  }, [plan]);

  const handleRemoveCohost = async (orgId: string) => {
    if (!canManagePlan) {
      setActionError('Chỉ Ban Chấp Hành đơn vị chủ trì mới có quyền gỡ đơn vị phối hợp.');
      return;
    }
    if (!planId || !confirm('Bạn có chắc muốn gỡ đơn vị này khỏi chiến dịch?')) return;
    try {
      setActionError(null);
      await removeCohostMutation.mutateAsync({
        planId,
        organizationId: orgId,
      });
      refetchPlan();
    } catch (err: unknown) {
      console.error('Failed to remove cohost:', err);
      const formatted = formatError(err);
      setActionError(formatted.message || 'Không thể gỡ đơn vị phối hợp. Vui lòng thử lại.');
    }
  };

  const handleAcceptInvitation = async () => {
    if (!planId || !activeOrganization) return;
    try {
      setActionError(null);
      await acceptInvitationMutation.mutateAsync({
        planId,
        organizationId: activeOrganization.id,
      });
      refetchPlan();
    } catch (err: unknown) {
      console.error('Failed to accept invitation:', err);
      const formatted = formatError(err);
      setActionError(formatted.message || 'Không thể chấp nhận lời mời. Vui lòng thử lại.');
    }
  };

  const handleRejectInvitation = async () => {
    if (!planId || !activeOrganization || !confirm('Bạn có chắc muốn từ chối tham gia chiến dịch này?')) return;
    try {
      setActionError(null);
      await rejectInvitationMutation.mutateAsync({
        planId,
        organizationId: activeOrganization.id,
      });
      refetchPlan();
    } catch (err: unknown) {
      console.error('Failed to reject invitation:', err);
      const formatted = formatError(err);
      setActionError(formatted.message || 'Không thể từ chối lời mời. Vui lòng thử lại.');
    }
  };

  const handleTaskStatusChange = async (task: CollabTask, newStatus: CollabTaskStatus) => {
    if (!canManageOperational) {
      setActionError('Đơn vị chưa được kích hoạt tham gia kế hoạch hoặc bạn không thuộc Ban Chấp Hành nên chưa thể cập nhật trạng thái.');
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
      console.error('Failed to update task:', err);
      const formatted = formatError(err);
      setActionError(formatted.message || 'Đơn vị chưa được kích hoạt tham gia kế hoạch nên chưa thể thực hiện thao tác này.');
    }
  };

  const handleDeleteTask = async (taskId: string, actId?: string | null) => {
    if (!canManageOperational) {
      setActionError('Đơn vị chưa được kích hoạt tham gia kế hoạch hoặc bạn không thuộc Ban Chấp Hành nên chưa thể xóa công việc.');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa công việc này?')) return;
    try {
      setActionError(null);
      await deleteTaskMutation.mutateAsync({
        id: taskId,
        planId: planId!,
        collabActivityId: actId || undefined,
      });
    } catch (err: unknown) {
      console.error('Failed to delete task:', err);
      const formatted = formatError(err);
      setActionError(formatted.message || 'Đơn vị chưa được kích hoạt tham gia kế hoạch nên chưa thể thực hiện thao tác này.');
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return collabTasks.filter((task) => {
      if (taskActivityFilter !== 'all' && task.collabActivityId !== taskActivityFilter) return false;
      if (taskStatusFilter !== 'all' && task.status !== taskStatusFilter) return false;
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
  }, [collabTasks, taskActivityFilter, taskStatusFilter, taskSearch]);

  // Campaign Metrics Overview (Plan Stats)
  const campaignMetrics = useMemo(() => {
    const totalActivities = collabActivities.length;
    
    // Count activities that are ready (all tasks completed & has >= 1 task)
    let readyActivitiesCount = 0;
    collabActivities.forEach((act) => {
      const actTasks = collabTasks.filter((t) => t.collabActivityId === act.id);
      const totalTasks = actTasks.length > 0 ? actTasks.length : (act.tasksCount || 0);
      const doneTasks = actTasks.length > 0
        ? actTasks.filter((t) => t.status === 'done').length
        : (act.completedTasksCount || 0);
      if (totalTasks > 0 && doneTasks === totalTasks) {
        readyActivitiesCount++;
      }
    });

    const totalTasksCount = collabTasks.length;
    const doneTasksCount = collabTasks.filter((t) => t.status === 'done').length;
    const inProgressTasksCount = collabTasks.filter((t) => t.status === 'in_progress' || t.status === 'review').length;
    const todoTasksCount = collabTasks.filter((t) => t.status === 'todo').length;

    // Overdue tasks count
    const now = new Date();
    const overdueTasksCount = collabTasks.filter((t) => {
      if (t.status === 'done' || !t.dueDate) return false;
      return new Date(t.dueDate) < now;
    }).length;

    const readinessPercent = totalTasksCount > 0
      ? Math.round((doneTasksCount / totalTasksCount) * 100)
      : (totalActivities > 0 ? 0 : 100);

    return {
      totalActivities,
      readyActivitiesCount,
      totalTasksCount,
      doneTasksCount,
      inProgressTasksCount,
      todoTasksCount,
      overdueTasksCount,
      readinessPercent,
    };
  }, [collabActivities, collabTasks]);

  // Filtered Personnel
  const filteredPersonnel = useMemo(() => {
    return personnel.filter((p) => {
      if (personnelOrgFilter !== 'all' && p.organizationId !== personnelOrgFilter) return false;
      if (personnelSearch.trim()) {
        const q = personnelSearch.toLowerCase();
        const nameMatch = p.fullName.toLowerCase().includes(q);
        const idMatch = p.studentId?.toLowerCase().includes(q);
        const classMatch = p.className?.toLowerCase().includes(q);
        const emailMatch = p.email?.toLowerCase().includes(q);
        const orgMatch = p.organizationName.toLowerCase().includes(q);
        return nameMatch || idMatch || classMatch || emailMatch || orgMatch;
      }
      return true;
    });
  }, [personnel, personnelOrgFilter, personnelSearch]);

  // Filtered Campaign Participants
  const filteredCampaignParticipants = useMemo(() => {
    return campaignParticipants.filter((p: any) => {
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
  }, [campaignParticipants, participantStatusFilter, participantOrgFilter, participantSearch]);

  const handleCampaignAttendanceToggle = (participantId: string, currentStatus: string, targetStatus: 'present' | 'absent') => {
    if (!canManageOperational) {
      setActionError('Bạn chưa có quyền điểm danh người tham gia.');
      return;
    }
    const newStatus = currentStatus === targetStatus ? 'unmarked' : targetStatus;
    updateParticipantMutation.mutate({
      participantId,
      data: { attendanceStatus: newStatus },
    });
  };

  const handleExportCampaignParticipantsCSV = () => {
    if (filteredCampaignParticipants.length === 0) return;
    const headers = ['STT', 'Ho va ten', 'MSSV', 'Lop', 'Khoa', 'Don vi', 'Diem danh', 'Email', 'So dien thoai'];
    const rows = filteredCampaignParticipants.map((p: any, idx: number) => {
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
    link.setAttribute('download', `Diem_danh_chien_dich_${plan?.code || 'Collab'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Finance Summary
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      if (tx.transactionType === 'income') income += amt;
      else expense += amt;
    });
    return { totalIncome: income, totalExpense: expense, netBalance: income - expense };
  }, [transactions]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (isPlanLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-100 rounded-md w-1/4" />
        <div className="h-40 bg-slate-50 rounded-2xl" />
        <div className="h-64 bg-slate-50 rounded-2xl" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-12 max-w-lg mx-auto text-center space-y-4">
        <div className="h-16 w-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy chiến dịch</h2>
        <p className="text-xs text-slate-500">
          Chiến dịch này không tồn tại hoặc tài khoản của bạn chưa có quyền truy cập.
        </p>
        <Button onClick={() => navigate('/plans')} variant="outline" size="sm" className="text-xs">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Về danh sách Kế hoạch
        </Button>
      </div>
    );
  }

  const statusConfig = PLAN_STATUS_CONFIG[plan.status] || PLAN_STATUS_CONFIG.active;
  const cohosts = plan.organizations || [];

  return (
    <div id="plan-detail-page" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button
          id="btn-back-to-plans"
          variant="ghost"
          size="sm"
          onClick={() => navigate('/plans')}
          className="text-xs text-slate-600 hover:text-slate-900 gap-1.5 pl-0 hover:bg-transparent"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Danh sách Chiến dịch</span>
        </Button>

        <Badge className="bg-purple-100 text-purple-800 border-none text-xs px-2.5 py-1">
          Chiến Dịch Liên Đơn Vị (Collab)
        </Badge>
      </div>

      {/* Main Plan Header Card */}
      <Card className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        {/* Pending Invitation Alert for current user's organization */}
        {myOrgPendingInvitation && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm">
                  Đơn vị của bạn được mời tham gia Chiến dịch này!
                </div>
                <div className="text-xs text-purple-100">
                  Vai trò đề xuất: <span className="font-semibold underline">{myOrgPendingInvitation.roleDescription || 'Đơn vị đồng tổ chức'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                size="sm"
                onClick={handleRejectInvitation}
                disabled={rejectInvitationMutation.isPending}
                className="text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                Từ chối
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptInvitation}
                disabled={acceptInvitationMutation.isPending}
                className="text-xs bg-white text-purple-900 hover:bg-purple-50 font-bold shadow-sm"
              >
                {acceptInvitationMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                )}
                Chấp nhận tham gia
              </Button>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200">
                  {plan.code}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.colorClasses}`}>
                  {statusConfig.label}
                </span>
                <span className="text-xs text-slate-400">
                  Tạo ngày {formatDate(plan.createdAt)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {plan.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                {plan.description || 'Chưa có mô tả chi tiết.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {canManagePlan && (
                <>
                  <Button
                    id="btn-header-invite-cohost"
                    variant="outline"
                    onClick={() => setIsInviteCohostOpen(true)}
                    className="text-xs h-9 gap-1.5 rounded-xl border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 font-semibold cursor-pointer shadow-2xs"
                  >
                    <UserPlus className="h-4 w-4 text-purple-600" />
                    <span>Mời đơn vị</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsEditPlanOpen(true)}
                    className="text-xs h-9 gap-1.5 rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5 text-slate-600" />
                    <span>Chỉnh sửa</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsDeletePlanOpen(true)}
                    className="text-xs h-9 gap-1.5 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xóa Collab</span>
                  </Button>
                </>
              )}

              {canManageOperational && (
                <Button
                  id="btn-create-collab-activity"
                  onClick={() => setIsCreateActivityOpen(true)}
                  className="text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-xs rounded-xl cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Tạo hoạt động Collab
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100/60">
              <div className="h-10 w-10 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-purple-800 flex items-center gap-1">
                  <span>Chủ trì:</span>
                  <span className="font-semibold text-purple-900">
                    {getOrgTypeLabel(plan.leadOrganization?.type)}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {plan.leadOrganization?.name || 'Đơn vị chủ trì'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="h-10 w-10 bg-blue-100/70 text-blue-700 rounded-lg flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-slate-500">Đơn vị tham gia</div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {cohosts.length} đơn vị phối hợp
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="h-10 w-10 bg-emerald-100/70 text-emerald-700 rounded-lg flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-slate-500">Thời gian triển khai</div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {plan.startDate ? formatDate(plan.startDate) : 'Chưa rõ'}
                  {plan.endDate ? ` - ${formatDate(plan.endDate)}` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="h-10 w-10 bg-amber-100/70 text-amber-700 rounded-lg flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-slate-500">Quỹ chiến dịch</div>
                <div className="text-xs font-bold text-slate-900 font-mono truncate">
                  {formatVND(netBalance)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          id="tab-btn-activities"
          onClick={() => setActiveTab('activities')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'activities'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck className="h-4 w-4" />
          <span>Hoạt Động Trực Thuộc ({collabActivities.length})</span>
        </button>

        <button
          id="tab-btn-participants"
          onClick={() => setActiveTab('participants')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'participants'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Người Tham Gia ({campaignParticipantStats.total})</span>
        </button>

        <button
          id="tab-btn-tasks"
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'tasks'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          <span>Tất Cả Nhiệm Vụ ({collabTasks.length})</span>
        </button>

        <button
          id="tab-btn-finance"
          onClick={() => setActiveTab('finance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'finance'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Tài Chính & Gây Quỹ ({transactions.length})</span>
        </button>

        <button
          id="tab-btn-personnel"
          onClick={() => setActiveTab('personnel')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'personnel'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Nhân Sự Ban Tổ Chức ({personnel.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: ACTIVITIES & CO-HOSTS */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          {/* Plan Metrics Overview Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Metric 1: Activities & Readiness */}
            <Card className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Hoạt động Collab</span>
                <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <CalendarCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {campaignMetrics.totalActivities}
                </span>
                <span className="text-xs font-medium text-slate-500">hoạt động</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                  <CheckCircle2 className="h-3 w-3" />
                  {campaignMetrics.readyActivitiesCount}/{campaignMetrics.totalActivities} sẵn sàng
                </span>
              </div>
            </Card>

            {/* Metric 2: Task Workload Distribution */}
            <Card className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Khối lượng công việc</span>
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CheckSquare className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {campaignMetrics.totalTasksCount}
                </span>
                <span className="text-xs font-medium text-slate-500">nhiệm vụ</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] flex-wrap font-medium">
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {campaignMetrics.doneTasksCount} xong
                </span>
                <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  {campaignMetrics.inProgressTasksCount} đang làm
                </span>
                {campaignMetrics.overdueTasksCount > 0 ? (
                  <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                    <AlertTriangle className="h-3 w-3" />
                    {campaignMetrics.overdueTasksCount} quá hạn
                  </span>
                ) : (
                  <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    {campaignMetrics.todoTasksCount} cần làm
                  </span>
                )}
              </div>
            </Card>

            {/* Metric 3: Overall Campaign Readiness Progress */}
            <Card className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Tiến độ & Sẵn sàng</span>
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {campaignMetrics.readinessPercent}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">hoàn thành</span>
                </div>
                <span className="text-xs font-bold text-slate-700 font-mono">
                  {campaignMetrics.doneTasksCount}/{campaignMetrics.totalTasksCount} việc
                </span>
              </div>
              <div className="mt-2.5 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    campaignMetrics.readinessPercent === 100
                      ? 'bg-emerald-600'
                      : campaignMetrics.readinessPercent > 50
                      ? 'bg-purple-600'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${campaignMetrics.readinessPercent}%` }}
                />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Collab Activities in Plan */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-purple-600" />
                    Danh Sách Hoạt Động Phối Hợp ({collabActivities.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Các sự kiện độc lập trong chiến dịch. Nhấp vào bất kỳ thẻ nào để mở chi tiết hoạt động.
                  </p>
                </div>
              </div>

              {isActivitiesLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 bg-slate-50 border border-slate-200 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : collabActivities.length === 0 ? (
                <Card className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center shadow-2xs">
                  <div className="h-12 w-12 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-purple-500">
                    <CalendarCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Chưa có hoạt động collab nào</h3>
                  <p className="text-xs text-slate-500 mt-0.5 mb-4">
                    Chiến dịch chưa có sự kiện độc lập nào được thiết lập. Hãy tạo hoạt động phối hợp đầu tiên!
                  </p>
                  {canManageOperational && (
                    <Button
                      onClick={() => setIsCreateActivityOpen(true)}
                      size="sm"
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tạo hoạt động Collab
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="space-y-3">
                  {collabActivities.map((act) => {
                    const actTasks = collabTasks.filter((t) => t.collabActivityId === act.id);
                    const totalTasks = actTasks.length > 0 ? actTasks.length : (act.tasksCount || 0);
                    const completedTasks = actTasks.length > 0
                      ? actTasks.filter((t) => t.status === 'done').length
                      : (act.completedTasksCount || 0);
                    const isAllDone = totalTasks > 0 && completedTasks === totalTasks;
                    const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    return (
                      <Card
                        key={act.id}
                        id={`collab-act-card-${act.id}`}
                        onClick={() => navigate(`/plans/${planId}/collab-activities/${act.id}`)}
                        className="group bg-white hover:bg-purple-50/30 border border-slate-200 hover:border-purple-300 rounded-2xl p-5 transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0"
                      >
                        {/* Left: Activity Details */}
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                              {act.code}
                            </span>
                            <Badge className="bg-purple-100 text-purple-800 border-none text-[10px] shrink-0">
                              {act.category === 'volunteer'
                                ? 'Tình nguyện'
                                : act.category === 'academic'
                                ? 'Học thuật'
                                : act.category === 'sports'
                                ? 'Thể thao'
                                : act.category === 'culture'
                                ? 'Văn hóa'
                                : act.category === 'meeting'
                                ? 'Hội thảo / Họp'
                                : act.category === 'training'
                                ? 'Tập huấn'
                                : 'Sự kiện'}
                            </Badge>
                            {act.leadOrganization && (
                              <span className="text-[11px] text-purple-700 font-semibold flex items-center gap-1 min-w-0 truncate" title={act.leadOrganization.name}>
                                <Building2 className="h-3 w-3 text-purple-500 shrink-0" />
                                <span className="truncate">{act.leadOrganization.name}</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors break-words break-all min-w-0">
                            {act.title}
                          </h3>

                          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap min-w-0">
                            <span className="flex items-center gap-1.5 text-[11px] shrink-0 text-slate-600">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {formatDate(act.startDate)} - {formatDate(act.endDate)}
                            </span>
                            {act.location && (
                              <span className="flex items-center gap-1.5 text-[11px] text-slate-600 min-w-0 break-words break-all max-w-[280px]" title={act.location}>
                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{act.location}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Progress Metric & Chevron Indicator */}
                        <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                          {/* Progress Metric Block */}
                          <div className="flex flex-col items-start md:items-end min-w-[130px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold font-mono text-slate-900">
                                {totalTasks > 0 ? `${completedTasks}/${totalTasks} việc` : '0 việc'}
                              </span>
                              {totalTasks > 0 && (
                                <span className={`text-[10px] font-bold ${isAllDone ? 'text-emerald-600' : 'text-purple-600'}`}>
                                  ({percent}%)
                                </span>
                              )}
                            </div>

                            {/* Progress Bar / Ready Badge */}
                            <div className="mt-1 flex items-center gap-1.5">
                              {isAllDone ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0">
                                  Sẵn sàng triển khai
                                </Badge>
                              ) : totalTasks > 0 ? (
                                <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-purple-600 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Chưa giao việc</span>
                              )}
                            </div>
                          </div>

                          {/* Navigation Indicator Arrow */}
                          <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-purple-100 text-slate-400 group-hover:text-purple-700 flex items-center justify-center transition-colors">
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

          {/* Right 1 Col: Participating Organizations / Co-hosts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  Đơn Vị Tham Gia ({cohosts.length})
                </h2>
                <p className="text-[11px] text-slate-500">Chỉ những đơn vị được mời mới có quyền phân công</p>
              </div>

              {canManagePlan && (
                <Button
                  id="btn-open-invite-cohost"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsInviteCohostOpen(true)}
                  className="text-xs text-purple-600 hover:text-purple-700 gap-1.5 hover:bg-purple-50"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Mời đơn vị
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {cohosts.map((cohost) => {
                const orgType = cohost.organization?.type;
                const typeLabel = getOrgTypeLabel(orgType);
                const typeBadgeClass = getOrgTypeBadgeClass(orgType);
                const parentName = cohost.organization?.parent?.name;
                const isPending = cohost.status === 'pending';
                const isRejected = cohost.status === 'rejected';
                const isRemoved = cohost.status === 'removed';

                if (isRemoved) return null;

                const roleLabel =
                  cohost.roleInPlan === 'host'
                    ? 'Chủ trì'
                    : cohost.roleInPlan === 'co_host'
                    ? 'Đồng tổ chức'
                    : cohost.roleInPlan === 'partner'
                    ? 'Đối tác'
                    : cohost.roleInPlan === 'supporter'
                    ? 'Tài trợ'
                    : cohost.roleInPlan === 'observer'
                    ? 'Quan sát'
                    : 'Đồng tổ chức';

                return (
                  <Card
                    key={cohost.id}
                    className={`bg-white border rounded-2xl p-3.5 transition-all shadow-2xs ${
                      cohost.isHost
                        ? 'border-purple-200 bg-purple-50/20'
                        : isPending
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            cohost.isHost
                              ? 'bg-purple-600 text-white'
                              : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {cohost.organization?.code?.substring(0, 3) || 'ORG'}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${typeBadgeClass}`}>
                              {typeLabel}
                            </span>
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {cohost.organization?.name || 'Đơn vị thành viên'}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold shrink-0 ${
                              cohost.isHost
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            }`}>
                              {roleLabel}
                            </span>
                            {isPending && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 shrink-0">
                                Chờ xác nhận
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 shrink-0">
                                Đã từ chối
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <p className="truncate">
                              {cohost.roleDescription || (cohost.isHost ? 'Đơn vị chủ trì chiến dịch' : 'Đơn vị đồng tổ chức')}
                            </p>
                            {parentName && (
                              <span className="text-indigo-600 shrink-0">
                                • {parentName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {canManagePlan && !cohost.isHost && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCohost(cohost.organizationId)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                          title="Gỡ đơn vị này khỏi chiến dịch"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* TAB CONTENT 2: ALL COLLAB TASKS */}
      {activeTab === 'tasks' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          {/* Informative Banner for Read-Only / Non-Manage State */}
          {!canManageOperational && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Chế độ xem nhiệm vụ: </span>
                {myOrgParticipant?.status === 'pending'
                  ? 'Đơn vị của bạn đang nhận lời mời tham gia (Chờ xác nhận). Hãy chấp nhận lời mời ở đầu trang để kích hoạt quyền giao việc và cập nhật tiến độ.'
                  : myOrgParticipant?.status === 'rejected'
                  ? 'Đơn vị đã từ chối tham gia kế hoạch này nên không thể thao tác các công việc trực thuộc.'
                  : !isBch
                  ? 'Tài khoản không thuộc Ban Chấp Hành nên không có quyền phân công và cập nhật trạng thái nhiệm vụ.'
                  : 'Đơn vị của bạn chưa được kích hoạt tham gia kế hoạch này.'}
              </div>
            </div>
          )}

          {/* Action Error Banner */}
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-2 text-xs text-rose-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{actionError}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActionError(null)}
                className="h-5 px-1 text-xs text-rose-600 hover:bg-rose-100"
              >
                Đóng
              </Button>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-purple-600" />
                Tất Cả Nhiệm Vụ ({filteredTasks.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Danh sách nhiệm vụ của các hoạt động trong chiến dịch.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative min-w-[180px]">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Tìm nhiệm vụ..."
                  className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
                />
              </div>

              {/* Filter by Activity */}
              <Select value={taskActivityFilter} onValueChange={setTaskActivityFilter}>
                <SelectTrigger className="h-8 text-xs w-[140px] bg-slate-50">
                  <SelectValue placeholder="Hoạt động" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="all" className="text-xs">Tất cả hoạt động</SelectItem>
                  {collabActivities.map((act) => (
                    <SelectItem key={act.id} value={act.id} className="text-xs">
                      {act.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter by Status */}
              <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                <SelectTrigger className="h-8 text-xs w-[120px] bg-slate-50">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="all" className="text-xs">Tất cả trạng thái</SelectItem>
                  <SelectItem value="todo" className="text-xs">Chưa làm</SelectItem>
                  <SelectItem value="in_progress" className="text-xs">Đang làm</SelectItem>
                  <SelectItem value="review" className="text-xs">Chờ duyệt</SelectItem>
                  <SelectItem value="done" className="text-xs">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>

              {canManageOperational && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskDialogOpen(true);
                  }}
                  className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Giao việc mới
                </Button>
              )}
            </div>
          </div>

          {/* Task Table */}
          {isTasksLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <span>Đang tải danh sách công việc...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-10 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
              <CheckSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Chưa có công việc nào</p>
              <p className="mt-0.5">Danh sách nhiệm vụ của các hoạt động trong chiến dịch.</p>
              {canManageOperational && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskDialogOpen(true);
                  }}
                  className="mt-3 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Giao việc ngay
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Công việc</th>
                    <th className="px-4 py-3">Hoạt động</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ưu tiên</th>
                    <th className="px-4 py-3">Người phụ trách</th>
                    <th className="px-4 py-3">Hạn chót</th>
                    {canManageOperational && <th className="px-4 py-3 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredTasks.map((task) => {
                    const assigneePerson = personnel.find((p) => p.userId === task.assignedTo);
                    const act = collabActivities.find((a) => a.id === task.collabActivityId);

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900 min-w-[180px] max-w-[300px]">
                          <div className="break-words break-all">{task.title}</div>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 font-normal line-clamp-1 break-words break-all">
                              {task.description}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-purple-700 font-medium">
                          {act ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/plans/${planId}/collab-activities/${act.id}`)}
                              className="text-purple-700 hover:text-purple-900 font-medium hover:underline text-left inline-flex items-center gap-1 max-w-[160px] truncate"
                              title={`Xem hoạt động: ${act.title}`}
                            >
                              <span className="truncate">{act.title}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 italic">Toàn chiến dịch</span>
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

                        <td className="px-4 py-3 min-w-[160px]">
                          {assigneePerson ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                                {assigneePerson.fullName.slice(0, 1)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-medium text-slate-900 block truncate">
                                  {assigneePerson.fullName}
                                </span>
                                <span className="text-[10px] text-slate-600 block truncate" title={assigneePerson.organizationName}>
                                  {assigneePerson.organizationName}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Chưa phân công</span>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600">
                          {task.dueDate ? formatDate(task.dueDate) : '--'}
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
                                onClick={() => handleDeleteTask(task.id, task.collabActivityId)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
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

      {/* TAB CONTENT 2: CAMPAIGN PARTICIPANTS & ATTENDANCE */}
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
                {campaignParticipantStats.total}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Toàn bộ chiến dịch</div>
            </Card>

            <Card className="p-4 border-emerald-200/80 bg-emerald-50/40 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
                <span>Có mặt</span>
                <UserCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
                {campaignParticipantStats.present}
              </div>
              <div className="text-[11px] text-emerald-600/80 mt-0.5">Đã điểm danh có mặt</div>
            </Card>

            <Card className="p-4 border-rose-200/80 bg-rose-50/40 shadow-2xs">
              <div className="flex items-center justify-between text-rose-800 text-xs font-semibold">
                <span>Vắng</span>
                <UserX className="h-4 w-4 text-rose-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-rose-700 font-mono">
                {campaignParticipantStats.absent}
              </div>
              <div className="text-[11px] text-rose-600/80 mt-0.5">Vắng mặt</div>
            </Card>

            <Card className="p-4 border-blue-200/80 bg-blue-50/40 shadow-2xs">
              <div className="flex items-center justify-between text-blue-800 text-xs font-semibold">
                <span>Tỉ lệ có mặt</span>
                <Percent className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-blue-700 font-mono">
                {campaignParticipantStats.participationRate}%
              </div>
              <div className="text-[11px] text-blue-600/80 mt-0.5">
                {campaignParticipantStats.unmarked} chưa điểm danh
              </div>
            </Card>
          </div>

          {/* Participant Table Container */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  Danh Sách Người Tham Gia Toàn Chiến Dịch ({filteredCampaignParticipants.length})
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tổng hợp người tham gia, sinh viên và tình nguyện viên đăng ký từ tất cả các đơn vị.
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

                {/* Export CSV Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCampaignParticipantsCSV}
                  className="h-8 text-xs border-slate-200 hover:bg-slate-50 font-medium"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Xuất CSV
                </Button>
              </div>
            </div>

            {/* Attendance Table */}
            {isParticipantsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span>Đang tải danh sách người tham gia...</span>
              </div>
            ) : filteredCampaignParticipants.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                Chưa có người tham gia nào trong các hoạt động của chiến dịch.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Họ và tên</th>
                      <th className="w-28 px-3 py-3 text-center">MSSV</th>
                      <th className="w-20 px-3 py-3 text-center">Lớp</th>
                      <th className="w-16 px-3 py-3 text-center">Khóa</th>
                      <th className="w-32 px-3 py-3">Đơn vị</th>
                      <th className="w-60 px-4 py-3 text-center">Điểm danh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredCampaignParticipants.map((p: any) => {
                      const isPresent = p.attendanceStatus === 'present';
                      const isAbsent = p.attendanceStatus === 'absent';
                      const memOrg = participatingOrganizations.find((o) => o.id === p.member?.organizationId);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
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
                                onClick={() => handleCampaignAttendanceToggle(p.id, p.attendanceStatus, 'present')}
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
                                onClick={() => handleCampaignAttendanceToggle(p.id, p.attendanceStatus, 'absent')}
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

      {/* TAB CONTENT 3: COLLAB FINANCE MODULE */}
      {activeTab === 'finance' && (
        <CollabFinanceModule
          plan={plan}
          collabActivities={collabActivities}
          canManage={canManageOperational}
        />
      )}

      {/* TAB CONTENT 4: BAN TỔ CHỨC */}
      {activeTab === 'personnel' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-600" />
                Ban Tổ Chức ({filteredPersonnel.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhân sự Ban chấp hành và cán bộ phụ trách từ các đơn vị tham gia.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={personnelSearch}
                  onChange={(e) => setPersonnelSearch(e.target.value)}
                  placeholder="Tìm thành viên, đơn vị..."
                  className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
                />
              </div>

              {participatingOrganizations.length > 1 && (
                <Select value={personnelOrgFilter} onValueChange={setPersonnelOrgFilter}>
                  <SelectTrigger className="h-8 text-xs w-[140px] bg-slate-50">
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

              {canManagePlan && (
                <Button
                  id="btn-btc-invite-cohost"
                  size="sm"
                  onClick={() => setIsInviteCohostOpen(true)}
                  className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5 shadow-2xs cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Mời đơn vị</span>
                </Button>
              )}
            </div>
          </div>

          {isPersonnelLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <span>Đang tải danh sách Ban tổ chức...</span>
            </div>
          ) : filteredPersonnel.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">
              Không tìm thấy thành viên Ban tổ chức phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredPersonnel.map((person) => {
                const assignedCount = collabTasks.filter((t) => t.assignedTo === person.userId).length;
                const typeLabel = getOrgTypeLabel(person.organizationType);
                const typeBadgeClass = getOrgTypeBadgeClass(person.organizationType);

                return (
                  <div
                    key={`${person.userId}-${person.organizationId}`}
                    className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col justify-between gap-3 hover:border-purple-200 hover:shadow-2xs transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm shrink-0">
                          {person.fullName.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 truncate block text-[13px]">
                            {person.fullName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium block truncate">
                            {person.position || 'Thành viên Ban tổ chức'}
                          </span>
                        </div>
                      </div>

                      <Badge className="bg-purple-100 text-purple-800 border-none text-[10px] px-2 py-0.5 shrink-0">
                        {assignedCount} việc
                      </Badge>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border shrink-0 ${typeBadgeClass}`}>
                          {typeLabel}
                        </span>
                        <span className="text-slate-600 font-medium truncate" title={person.organizationName}>
                          {person.organizationName}
                        </span>
                      </div>

                      {person.email && (
                        <span className="text-slate-400 text-[10px] truncate max-w-[110px]" title={person.email}>
                          {person.email}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Dialog: Create Collab Activity */}
      <CreateCollabActivityDialog
        isOpen={isCreateActivityOpen}
        onClose={() => setIsCreateActivityOpen(false)}
        plan={plan}
        onSuccess={() => {
          refetchActivities();
        }}
      />

      {/* Dialog: Create / Edit Collab Task */}
      <CreateCollabTaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        planId={plan.id}
        editingTask={editingTask}
        onSuccess={() => {
          refetchTasks();
        }}
      />

      {/* Dialog: Invite Cohost Organization */}
      <InviteCohostDialog
        isOpen={isInviteCohostOpen}
        onClose={() => setIsInviteCohostOpen(false)}
        planId={plan.id}
        existingOrgIds={existingOrgIds}
        onSuccess={() => {
          refetchPlan();
        }}
      />

      {/* Dialog: Edit Plan */}
      <EditPlanDialog
        isOpen={isEditPlanOpen}
        onClose={() => setIsEditPlanOpen(false)}
        plan={plan}
        onSuccess={() => {
          refetchPlan();
        }}
      />

      {/* Dialog: Delete Plan */}
      <DeletePlanDialog
        isOpen={isDeletePlanOpen}
        onClose={() => setIsDeletePlanOpen(false)}
        plan={plan}
        onSuccess={() => {
          navigate('/plans');
        }}
      />
    </div>
  );
}
