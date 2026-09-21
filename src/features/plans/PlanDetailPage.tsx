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
  FileSpreadsheet,
  Package,
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
  useRemoveCollabParticipant,
  useBulkUpdateCollabAttendance,
} from '@/features/plans/queries/collab.queries';
import { CreateCollabActivityDialog } from '@/features/plans/components/CreateCollabActivityDialog';
import { CreateCollabTaskDialog } from '@/features/plans/components/CreateCollabTaskDialog';
import { InviteCohostDialog } from '@/features/plans/components/InviteCohostDialog';
import { EditPlanDialog } from '@/features/plans/components/EditPlanDialog';
import { DeletePlanDialog } from '@/features/plans/components/DeletePlanDialog';
import { AddCollabParticipantDialog } from '@/features/plans/components/AddCollabParticipantDialog';
import { ImportCollabParticipantsModal } from '@/features/plans/components/ImportCollabParticipantsModal';
import { CollabFinanceModule } from '@/features/plans/components/CollabFinanceModule';
import { isOrgBoard } from '@/types/roles';
import { formatError } from '@/lib/error-formatter';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { getOrgTypeLabel, getOrgTypeBadgeClass } from '@/lib/organization.utils';
import type { CollabTask, CollabTaskStatus, TaskPriority, PlanStatus } from '@/types';

const PLAN_STATUS_CONFIG: Record<string, { label: string; colorClasses: string }> = {
  draft: { label: 'Bản nháp', colorClasses: 'bg-slate-100 text-slate-700 border-slate-200' },
  planning: { label: 'Đang lập kế hoạch', colorClasses: 'bg-violet-50 text-violet-700 border-violet-200' },
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
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isImportParticipantsOpen, setIsImportParticipantsOpen] = useState(false);

  // Filters for campaign-wide tasks
  const [taskSearch, setTaskSearch] = useState('');
  const [taskActivityFilter, setTaskActivityFilter] = useState<string>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [personnelSearch, setPersonnelSearch] = useState('');
  const [personnelOrgFilter, setPersonnelOrgFilter] = useState<string>('all');

  // Filters and selection for campaign-wide participants
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantStatusFilter, setParticipantStatusFilter] = useState<string>('all');
  const [participantOrgFilter, setParticipantOrgFilter] = useState<string>('all');
  const [participantActivityFilter, setParticipantActivityFilter] = useState<string>('all');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);

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
  const removeParticipantMutation = useRemoveCollabParticipant(undefined, planId);
  const bulkAttendanceMutation = useBulkUpdateCollabAttendance(undefined, planId);

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
      if (participantOrgFilter !== 'all') {
        if (participantOrgFilter === 'external') {
          if (!p.externalOrganization && p.organizationId) return false;
        } else if (p.organizationId !== participantOrgFilter) {
          return false;
        }
      }
      if (participantActivityFilter !== 'all') {
        if (participantActivityFilter === 'campaign_wide') {
          if (p.collabActivityId) return false;
        } else if (p.collabActivityId !== participantActivityFilter) {
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
  }, [campaignParticipants, participantStatusFilter, participantOrgFilter, participantActivityFilter, participantSearch]);

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

  const handleSelectAllParticipants = () => {
    if (selectedParticipantIds.length === filteredCampaignParticipants.length) {
      setSelectedParticipantIds([]);
    } else {
      setSelectedParticipantIds(filteredCampaignParticipants.map((p) => p.id));
    }
  };

  const handleToggleSelectParticipant = (id: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAttendanceAction = (status: 'present' | 'absent') => {
    if (!canManageOperational || selectedParticipantIds.length === 0) return;
    bulkAttendanceMutation.mutate(
      { participantIds: selectedParticipantIds, status },
      {
        onSuccess: () => {
          setSelectedParticipantIds([]);
        },
      }
    );
  };

  const handleDeleteParticipant = (id: string) => {
    if (!canManageOperational) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa người này khỏi danh sách tham gia?')) {
      removeParticipantMutation.mutate(id, {
        onSuccess: () => {
          setSelectedParticipantIds((prev) => prev.filter((i) => i !== id));
        },
      });
    }
  };

  const handleExportCampaignParticipantsCSV = () => {
    if (filteredCampaignParticipants.length === 0) return;
    const headers = ['STT', 'Ho va ten', 'MSSV', 'Lop', 'Khoa', 'Don vi', 'Doi hinh', 'Hoat dong phan cong', 'Diem danh', 'Email', 'So dien thoai'];
    const rows = filteredCampaignParticipants.map((p: any, idx: number) => {
      const orgName = p.externalOrganization
        ? p.externalOrganization
        : participatingOrganizations.find((o) => o.id === p.organizationId || o.id === p.member?.organizationId)?.name || 'Đơn vị';
      const actTitle = p.collabActivity?.title || 'Toàn chiến dịch';
      const attStatus = p.attendanceStatus === 'present' ? 'Co mat' : p.attendanceStatus === 'absent' ? 'Vang' : 'Chua diem danh';
      return [
        idx + 1,
        `"${p.fullName || p.member?.fullName || ''}"`,
        `"${p.studentId || p.member?.studentId || ''}"`,
        `"${p.className || p.member?.className || ''}"`,
        `"${p.cohort || p.member?.cohort || ''}"`,
        `"${orgName}"`,
        `"${p.roleTitle || 'Tình nguyện viên'}"`,
        `"${actTitle}"`,
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
    <div id="plan-detail-page" className="w-full space-y-5">
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

        <Badge className="bg-violet-50 text-violet-700 border border-violet-200/80 text-xs px-2.5 py-1 font-semibold rounded-full">
          Chiến Dịch Liên Đơn Vị (Collab)
        </Badge>
      </div>

      {/* Main Plan Header Card */}
      <Card className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        {/* Pending Invitation Alert for current user's organization */}
        {myOrgPendingInvitation && (
          <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles strokeWidth={1.5} className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm">
                  Đơn vị của bạn được mời tham gia Chiến dịch này!
                </div>
                <div className="text-xs text-violet-100">
                  Vai trò đề xuất: <span className="font-semibold underline">{myOrgPendingInvitation.roleDescription || 'Đơn vị đồng tổ chức'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                size="sm"
                onClick={handleRejectInvitation}
                disabled={rejectInvitationMutation.isPending}
                className="text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg active:scale-[0.98]"
              >
                Từ chối
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptInvitation}
                disabled={acceptInvitationMutation.isPending}
                className="text-xs bg-white text-violet-900 hover:bg-violet-50 font-bold shadow-sm rounded-lg active:scale-[0.98]"
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

        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-violet-50 text-violet-800 border border-violet-200/80">
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
                    className="text-xs h-8 gap-1.5 rounded-lg border-slate-200/90 hover:bg-slate-50 font-medium cursor-pointer shadow-2xs"
                  >
                    <UserPlus className="h-3.5 w-3.5 text-violet-600" />
                    <span>Mời đơn vị</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsEditPlanOpen(true)}
                    className="text-xs h-8 gap-1.5 rounded-lg border-slate-200/90 hover:bg-slate-50 font-medium cursor-pointer shadow-2xs"
                  >
                    <Edit className="h-3.5 w-3.5 text-slate-600" />
                    <span>Chỉnh sửa</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsDeletePlanOpen(true)}
                    className="text-xs h-8 gap-1.5 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 font-medium cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xóa</span>
                  </Button>
                </>
              )}

              {canManageOperational && (
                <Button
                  id="btn-create-collab-activity"
                  onClick={() => setIsCreateActivityOpen(true)}
                  className="text-xs h-8 bg-violet-600 hover:bg-violet-700 text-white gap-1.5 shadow-xs rounded-lg font-semibold cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tạo hoạt động Collab
                </Button>
              )}
            </div>
          </div>

          {/* Minimal Horizontal Property Ribbon */}
          <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-slate-100 text-xs">
            {/* Đơn vị chủ trì */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/70 text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              <span className="text-slate-400 font-medium">Chủ trì:</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${getOrgTypeBadgeClass(plan.leadOrganization?.type)}`}>
                {getOrgTypeLabel(plan.leadOrganization?.type)}
              </span>
              <span className="font-semibold text-slate-900 truncate max-w-[200px]" title={plan.leadOrganization?.name}>
                {plan.leadOrganization?.name || 'Đơn vị chủ trì'}
              </span>
            </div>

            {/* Đơn vị tham gia */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/70 text-slate-700">
              <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="text-slate-400 font-medium">Phối hợp:</span>
              <span className="font-semibold text-slate-900">
                {cohosts.length} đơn vị
              </span>
            </div>

            {/* Thời gian triển khai */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/70 text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-slate-400 font-medium">Thời gian:</span>
              <span className="font-medium text-slate-900 font-mono">
                {plan.startDate ? formatDate(plan.startDate) : 'Chưa rõ'}
                {plan.endDate ? ` – ${formatDate(plan.endDate)}` : ''}
              </span>
            </div>

            {/* Quỹ chiến dịch */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50/80 border border-slate-200/70 text-slate-700">
              <DollarSign className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-slate-400 font-medium">Quỹ:</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatVND(netBalance)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation Header - Minimal Underline Style */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto scrollbar-none">
        <button
          id="tab-btn-activities"
          type="button"
          onClick={() => setActiveTab('activities')}
          className={cn(
            'flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer -mb-px',
            activeTab === 'activities'
              ? 'border-violet-600 text-violet-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          )}
        >
          <CalendarCheck className="h-4 w-4 shrink-0" />
          <span>Hoạt động trực thuộc</span>
          <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium', activeTab === 'activities' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-600')}>
            {collabActivities.length}
          </span>
        </button>

        <button
          id="tab-btn-participants"
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
          <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium', activeTab === 'participants' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-600')}>
            {campaignParticipantStats.total}
          </span>
        </button>

        <button
          id="tab-btn-tasks"
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
          <span>Tất cả nhiệm vụ</span>
          <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium', activeTab === 'tasks' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-600')}>
            {collabTasks.length}
          </span>
        </button>

        <button
          id="tab-btn-finance"
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
          <span>Tài chính & Gây quỹ</span>
          {transactions.length > 0 && (
            <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium', activeTab === 'finance' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-600')}>
              {transactions.length}
            </span>
          )}
        </button>

        <button
          id="tab-btn-personnel"
          type="button"
          onClick={() => setActiveTab('personnel')}
          className={cn(
            'flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer -mb-px',
            activeTab === 'personnel'
              ? 'border-violet-600 text-violet-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          )}
        >
          <Building2 className="h-4 w-4 shrink-0" />
          <span>Ban Tổ Chức</span>
          {personnel.length > 0 && (
            <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium', activeTab === 'personnel' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-600')}>
              {personnel.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT 1: ACTIVITIES & CO-HOSTS */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          {/* Plan Metrics Overview Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Metric 1: Activities & Readiness */}
            <Card className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Hoạt động Collab</span>
                <div className="h-8 w-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <CalendarCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {campaignMetrics.totalActivities}
                </span>
                <span className="text-xs font-medium text-slate-500">hoạt động</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] tabular-nums">
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
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {campaignMetrics.totalTasksCount}
                </span>
                <span className="text-xs font-medium text-slate-500">nhiệm vụ</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] flex-wrap font-medium">
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded tabular-nums">
                  {campaignMetrics.doneTasksCount} xong
                </span>
                <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded tabular-nums">
                  {campaignMetrics.inProgressTasksCount} đang làm
                </span>
                {campaignMetrics.overdueTasksCount > 0 ? (
                  <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 tabular-nums">
                    <AlertTriangle className="h-3 w-3" />
                    {campaignMetrics.overdueTasksCount} quá hạn
                  </span>
                ) : (
                  <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">
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
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {campaignMetrics.readinessPercent}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">hoàn thành</span>
                </div>
                <span className="text-xs font-bold text-slate-700 tabular-nums">
                  {campaignMetrics.doneTasksCount}/{campaignMetrics.totalTasksCount} việc
                </span>
              </div>
              <div className="mt-2.5 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    campaignMetrics.readinessPercent === 100
                      ? 'bg-emerald-600'
                      : campaignMetrics.readinessPercent > 50
                      ? 'bg-violet-600'
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
                    <CalendarCheck className="h-5 w-5 text-violet-600" />
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
                  <div className="h-12 w-12 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-violet-600">
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
                      className="text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1.5 shadow-2xs font-semibold rounded-lg active:scale-[0.98]"
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
                        className="group bg-white hover:bg-violet-50/30 border border-slate-200 hover:border-violet-300 rounded-2xl p-5 transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0"
                      >
                        {/* Left: Activity Details */}
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                              {act.code}
                            </span>
                            <Badge className="bg-violet-50 text-violet-700 border border-violet-200/70 text-[10px] shrink-0 font-medium">
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
                              <span className="text-[11px] text-violet-700 font-semibold flex items-center gap-1 min-w-0 truncate" title={act.leadOrganization.name}>
                                <Building2 className="h-3 w-3 text-violet-500 shrink-0" />
                                <span className="truncate">{act.leadOrganization.name}</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-violet-700 transition-colors break-words break-all min-w-0">
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
                                <span className={`text-[10px] font-bold ${isAllDone ? 'text-emerald-600' : 'text-violet-600'}`}>
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
                                    className="bg-violet-600 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Chưa giao việc</span>
                              )}
                            </div>
                          </div>

                          {/* Navigation Indicator Arrow */}
                          <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-violet-100 text-slate-400 group-hover:text-violet-700 flex items-center justify-center transition-colors">
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
                  <Building2 strokeWidth={1.5} className="h-5 w-5 text-violet-600" />
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
                  className="text-xs text-violet-600 hover:text-violet-700 gap-1.5 hover:bg-violet-50 rounded-lg active:scale-[0.98]"
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
                        ? 'border-violet-200 bg-violet-50/20'
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
                              ? 'bg-violet-600 text-white'
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
                                ? 'bg-violet-100 text-violet-800'
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
                <CheckSquare className="h-4 w-4 text-violet-600" />
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
                  className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-2xs font-semibold rounded-lg active:scale-[0.98] transition-all cursor-pointer"
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
              <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
              <span>Đang tải danh sách công việc...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-10 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
              <CheckSquare strokeWidth={1.5} className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Chưa có công việc nào</p>
              <p className="mt-0.5">Danh sách nhiệm vụ của các hoạt động trong chiến dịch.</p>
              {canManageOperational && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskDialogOpen(true);
                  }}
                  className="mt-3 text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-2xs font-semibold rounded-lg active:scale-[0.98]"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Giao việc ngay
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/90 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Công việc</th>
                    <th className="px-4 py-3">Đơn vị phụ trách</th>
                    <th className="px-4 py-3">Hoạt động</th>
                    <th className="px-4 py-3">Người phụ trách</th>
                    <th className="px-4 py-3">Sản phẩm đầu ra</th>
                    <th className="px-4 py-3">Hạn chót</th>
                    <th className="px-4 py-3">Ưu tiên</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    {canManageOperational && <th className="px-4 py-3 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredTasks.map((task) => {
                    const assigneePerson = personnel.find((p) => p.userId === task.assignedTo);
                    const act = collabActivities.find((a) => a.id === task.collabActivityId);
                    const isLeadOrg = task.organizationId && plan?.leadOrganizationId === task.organizationId;

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900 min-w-[180px] max-w-[280px]">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            {task.category && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-violet-50 text-violet-700 border border-violet-200/70">
                                {task.category}
                              </span>
                            )}
                          </div>
                          <div className="break-words font-semibold text-xs sm:text-sm">{task.title}</div>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 font-normal line-clamp-1 break-words mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </td>

                        {/* Đơn vị phụ trách */}
                        <td className="px-4 py-3 whitespace-nowrap min-w-[120px]">
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

                        <td className="px-4 py-3 whitespace-nowrap text-violet-700 font-medium">
                          {act ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/plans/${planId}/collab-activities/${act.id}`)}
                              className="text-violet-700 hover:text-violet-900 font-medium hover:underline text-left inline-flex items-center gap-1 max-w-[160px] truncate"
                              title={`Xem hoạt động: ${act.title}`}
                            >
                              <span className="truncate">{act.title}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 italic">Toàn chiến dịch</span>
                          )}
                        </td>

                        {/* Người phụ trách */}
                        <td className="px-4 py-3 min-w-[150px]">
                          {task.externalAssignee ? (
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 text-xs truncate block" title={task.externalAssignee}>
                                {task.externalAssignee}
                              </span>
                              {task.externalContact && (
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  {task.externalContact}
                                </span>
                              )}
                            </div>
                          ) : assigneePerson ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                                {assigneePerson.fullName.slice(0, 1)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-medium text-slate-900 block truncate text-xs">
                                  {assigneePerson.fullName}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate" title={assigneePerson.organizationName}>
                                  {assigneePerson.organizationCode}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Đơn vị tự phân công</span>
                          )}
                        </td>

                        {/* Sản phẩm đầu ra */}
                        <td className="px-4 py-3 min-w-[140px] max-w-[200px]">
                          {task.deliverable ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/80 text-slate-800 font-medium text-xs max-w-full shadow-2xs">
                              <Package className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                              <span className="truncate block" title={task.deliverable}>{task.deliverable}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 italic text-[11px]">--</span>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600 text-xs">
                          {task.dueTime && <span className="text-indigo-700 font-semibold mr-1">{task.dueTime}</span>}
                          {task.dueDate ? formatDate(task.dueDate) : '--'}
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
            <Card className="p-3.5 bg-white border border-slate-200/80 shadow-2xs rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Tổng người tham gia</span>
                <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {campaignParticipantStats.total}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Toàn bộ chiến dịch</div>
            </Card>

            <Card className="p-3.5 bg-white border border-emerald-200/80 shadow-2xs rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
                <span>Có mặt</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
                {campaignParticipantStats.present}
              </div>
              <div className="text-[11px] text-emerald-600/80 mt-0.5">Đã điểm danh có mặt</div>
            </Card>

            <Card className="p-3.5 bg-white border border-rose-200/80 shadow-2xs rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-rose-800 text-xs font-semibold">
                <span>Vắng</span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <UserX className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-rose-700 tabular-nums">
                {campaignParticipantStats.absent}
              </div>
              <div className="text-[11px] text-rose-600/80 mt-0.5">Vắng mặt</div>
            </Card>

            <Card className="p-3.5 bg-white border border-blue-200/80 shadow-2xs rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-800 text-xs font-semibold">
                <span>Tỉ lệ có mặt</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Percent className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-blue-700 tabular-nums">
                {campaignParticipantStats.participationRate}%
              </div>
              <div className="text-[11px] text-blue-600/80 mt-0.5">
                <span className="tabular-nums font-semibold">{campaignParticipantStats.unmarked}</span> chưa điểm danh
              </div>
            </Card>
          </div>

          {/* Participant Table Container */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-violet-600" />
                  Danh Sách Lực Lượng Toàn Chiến Dịch ({filteredCampaignParticipants.length})
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tổng hợp danh sách chiến sĩ, tình nguyện viên đăng ký từ tất cả các đơn vị phối hợp.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative min-w-[170px]">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    placeholder="Tìm tên, MSSV, đội hình..."
                    className="pl-8 h-8 text-xs bg-slate-50/70 border-slate-200/90 focus:bg-white"
                  />
                </div>

                {/* Status Filter */}
                <Select value={participantStatusFilter} onValueChange={setParticipantStatusFilter}>
                  <SelectTrigger className="h-8 text-xs w-[110px] bg-slate-50/70 border-slate-200/90">
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
                <Select value={participantOrgFilter} onValueChange={setParticipantOrgFilter}>
                  <SelectTrigger className="h-8 text-xs w-[120px] bg-slate-50/70 border-slate-200/90">
                    <SelectValue placeholder="Đơn vị" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="all" className="text-xs">Tất cả đơn vị</SelectItem>
                    {participatingOrganizations.map((org) => (
                      <SelectItem key={org.id} value={org.id} className="text-xs">
                        {org.code}
                      </SelectItem>
                    ))}
                    <SelectItem value="external" className="text-xs text-emerald-700 font-medium">
                      Đối tác ngoài
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Activity Filter */}
                {collabActivities.length > 0 && (
                  <Select value={participantActivityFilter} onValueChange={setParticipantActivityFilter}>
                    <SelectTrigger className="h-8 text-xs w-[130px] bg-slate-50/70 border-slate-200/90">
                      <SelectValue placeholder="Hoạt động" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="all" className="text-xs">Tất cả hoạt động</SelectItem>
                      <SelectItem value="campaign_wide" className="text-xs font-semibold text-violet-700">
                        Toàn chiến dịch
                      </SelectItem>
                      {collabActivities.map((act) => (
                        <SelectItem key={act.id} value={act.id} className="text-xs truncate">
                          {act.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Batch Action Toolbar */}
                {selectedParticipantIds.length > 0 && canManageOperational && (
                  <div className="flex items-center gap-1.5 bg-violet-50 px-2.5 py-1 rounded-xl border border-violet-200/80 text-violet-900 shadow-2xs">
                    <span className="text-[11px] font-bold text-violet-900">
                      Đã chọn {selectedParticipantIds.length}:
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAttendanceAction('present')}
                      className="h-6 text-[10px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md active:scale-[0.98] shadow-2xs"
                    >
                      Có mặt
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAttendanceAction('absent')}
                      className="h-6 text-[10px] px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md active:scale-[0.98] shadow-2xs"
                    >
                      Vắng
                    </Button>
                  </div>
                )}

                {/* Export CSV Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCampaignParticipantsCSV}
                  className="h-8 text-xs border-slate-200/90 hover:bg-slate-50 font-medium active:scale-[0.98] shadow-2xs"
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
                    className="h-8 text-xs border-emerald-200/80 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70 font-semibold gap-1.5 shadow-2xs active:scale-[0.98] cursor-pointer"
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
                    className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-2xs font-semibold gap-1.5 active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
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
            ) : filteredCampaignParticipants.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Users strokeWidth={1.5} className="h-5 w-5" />
                </div>
                <p>Chưa có người tham gia nào trong danh sách lực lượng chiến dịch.</p>
                {canManageOperational && (
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsImportParticipantsOpen(true)}
                      className="h-8 text-xs gap-1.5 border-emerald-200/80 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70 active:scale-[0.98] font-semibold shadow-2xs"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      Dán từ Google Sheet
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsAddParticipantOpen(true)}
                      className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1.5 active:scale-[0.98] font-semibold shadow-2xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Thêm người đầu tiên
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
                {/* Desktop View */}
                <div className="hidden md:block max-h-[620px] overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 shadow-2xs">
                      <tr>
                        <th className="w-10 px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={
                              filteredCampaignParticipants.length > 0 &&
                              selectedParticipantIds.length === filteredCampaignParticipants.length
                            }
                            onChange={handleSelectAllParticipants}
                            className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-3 min-w-[180px]">Họ và tên</th>
                        <th className="w-24 px-3 py-3 text-center">MSSV</th>
                        <th className="w-24 px-3 py-3 text-center">Lớp / Khóa</th>
                        <th className="w-28 px-3 py-3">Đơn vị</th>
                        <th className="w-36 px-3 py-3">Đội hình / Vai trò</th>
                        <th className="w-36 px-3 py-3">Hoạt động phân bổ</th>
                        <th className="w-48 px-3 py-3 text-center">Điểm danh</th>
                        {canManageOperational && (
                          <th className="w-12 px-2 py-3 text-center">Xóa</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredCampaignParticipants.map((p: any) => {
                        const isPresent = p.attendanceStatus === 'present';
                        const isAbsent = p.attendanceStatus === 'absent';
                        const isSelected = selectedParticipantIds.includes(p.id);
                        const memOrg = participatingOrganizations.find((o) => o.id === p.organizationId || o.id === p.member?.organizationId);

                        return (
                          <tr key={p.id} className={cn('hover:bg-slate-50/60 transition-colors', isSelected && 'bg-violet-50/40')}>
                            {/* Checkbox */}
                            <td className="w-10 px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectParticipant(p.id)}
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

                            {/* Hoạt động phân bổ */}
                            <td className="w-36 px-3 py-3 text-slate-600 text-[11px]">
                              {p.collabActivity?.title ? (
                                <span className="truncate block max-w-[130px] font-medium text-violet-700" title={p.collabActivity.title}>
                                  {p.collabActivity.title}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Toàn chiến dịch</span>
                              )}
                            </td>

                            {/* Điểm danh 1-chạm */}
                            <td className="w-48 px-3 py-3 text-center">
                              <div className="inline-flex items-center justify-center gap-1 p-0.5 bg-slate-100/90 rounded-lg">
                                <button
                                  type="button"
                                  disabled={!canManageOperational}
                                  onClick={() => handleCampaignAttendanceToggle(p.id, p.attendanceStatus, 'present')}
                                  className={cn(
                                    'h-6 px-2.5 rounded-md font-semibold text-[10px] flex items-center gap-1 transition-all active:scale-[0.98]',
                                    isPresent
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : 'text-emerald-700 hover:bg-emerald-100/70 bg-transparent'
                                  )}
                                >
                                  <Check className="h-3 w-3 stroke-[2.5]" />
                                  <span>Có mặt</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={!canManageOperational}
                                  onClick={() => handleCampaignAttendanceToggle(p.id, p.attendanceStatus, 'absent')}
                                  className={cn(
                                    'h-6 px-2.5 rounded-md font-semibold text-[10px] flex items-center gap-1 transition-all active:scale-[0.98]',
                                    isAbsent
                                      ? 'bg-rose-600 text-white shadow-2xs'
                                      : 'text-rose-700 hover:bg-rose-100/70 bg-transparent'
                                  )}
                                >
                                  <X className="h-3 w-3 stroke-[2.5]" />
                                  <span>Vắng</span>
                                </button>
                              </div>
                            </td>

                            {/* Thao tác xóa */}
                            {canManageOperational && (
                              <td className="w-12 px-2 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteParticipant(p.id)}
                                  className="h-6 w-6 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors active:scale-[0.95]"
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

                {/* Mobile Responsive Thumb-Friendly Card View */}
                <div className="block md:hidden divide-y divide-slate-100 bg-white max-h-[620px] overflow-y-auto p-3 space-y-3">
                  {filteredCampaignParticipants.map((p: any) => {
                    const isPresent = p.attendanceStatus === 'present';
                    const isAbsent = p.attendanceStatus === 'absent';
                    const isSelected = selectedParticipantIds.includes(p.id);
                    const memOrg = participatingOrganizations.find((o) => o.id === p.organizationId || o.id === p.member?.organizationId);

                    return (
                      <div
                        key={p.id}
                        className={cn(
                          'p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-2.5 transition-colors',
                          isSelected && 'bg-violet-50/50 border-violet-200'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectParticipant(p.id)}
                              className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer h-4 w-4 shrink-0"
                            />
                            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {(p.fullName || p.member?.fullName || 'N').slice(0, 1)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs truncate">
                                {p.fullName || p.member?.fullName || 'Người tham gia'}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <span className="font-mono font-medium">{p.studentId || p.member?.studentId || '--'}</span>
                                <span>•</span>
                                <span>{p.className || p.member?.className || '--'}</span>
                              </div>
                            </div>
                          </div>

                          {canManageOperational && (
                            <button
                              type="button"
                              onClick={() => handleDeleteParticipant(p.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                              title="Xóa người tham gia"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Metadata tags */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          {p.externalOrganization ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate">{p.externalOrganization}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-violet-50 text-violet-800 border border-violet-200/80 px-2 py-0.5 rounded-full font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-600 shrink-0" />
                              <span>{memOrg?.code || p.organization?.code || 'Đơn vị'}</span>
                            </span>
                          )}

                          <span className="inline-block text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                            {p.roleTitle || 'Tình nguyện viên'}
                          </span>

                          {p.collabActivity?.title && (
                            <span className="inline-block text-[10px] bg-violet-50 text-violet-700 border border-violet-200/60 px-2 py-0.5 rounded-md font-medium truncate max-w-[200px]">
                              {p.collabActivity.title}
                            </span>
                          )}
                        </div>

                        {/* Fast Attendance Bar on Mobile (Large Thumb Target) */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            disabled={!canManageOperational}
                            onClick={() => handleCampaignAttendanceToggle(p.id, p.attendanceStatus, 'present')}
                            className={cn(
                              'h-8 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer',
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-emerald-700 hover:bg-emerald-50 border border-slate-200/60'
                            )}
                          >
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>Có mặt</span>
                          </button>

                          <button
                            type="button"
                            disabled={!canManageOperational}
                            onClick={() => handleCampaignAttendanceToggle(p.id, p.attendanceStatus, 'absent')}
                            className={cn(
                              'h-8 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer',
                              isAbsent
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 text-rose-700 hover:bg-rose-50 border border-slate-200/60'
                            )}
                          >
                            <X className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>Vắng</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                <Building2 className="h-4 w-4 text-violet-600" />
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
                  className="pl-8 h-8 text-xs bg-slate-50/70 border-slate-200/90 focus:bg-white"
                />
              </div>

              {participatingOrganizations.length > 1 && (
                <Select value={personnelOrgFilter} onValueChange={setPersonnelOrgFilter}>
                  <SelectTrigger className="h-8 text-xs w-[140px] bg-slate-50/70 border-slate-200/90">
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
                  className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-1.5 shadow-2xs active:scale-[0.98] cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Mời đơn vị</span>
                </Button>
              )}
            </div>
          </div>

          {isPersonnelLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
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
                    className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-2xl flex flex-col justify-between gap-3 hover:border-violet-200 hover:shadow-2xs transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-sm shrink-0">
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

                      <Badge className="bg-violet-50 text-violet-700 border border-violet-200/80 font-semibold text-[10px] px-2 py-0.5 shrink-0 rounded-full">
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

      {/* Dialog: Add Collab Participant */}
      <AddCollabParticipantDialog
        isOpen={isAddParticipantOpen}
        onClose={() => setIsAddParticipantOpen(false)}
        planId={plan.id}
        activities={collabActivities}
        participatingOrganizations={participatingOrganizations}
      />

      {/* Modal: Import Collab Participants from Google Sheet / Excel */}
      <ImportCollabParticipantsModal
        isOpen={isImportParticipantsOpen}
        onClose={() => setIsImportParticipantsOpen(false)}
        planId={plan.id}
        activities={collabActivities}
        participatingOrganizations={participatingOrganizations}
      />
    </div>
  );
}
