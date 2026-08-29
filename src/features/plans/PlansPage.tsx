import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Clock,
  Archive,
  XCircle,
  Users2,
  ChevronRight,
  Sparkles,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { usePlansList } from '@/features/plans/queries/plan.queries';
import { CreatePlanDialog } from '@/features/plans/components/CreatePlanDialog';
import { EditPlanDialog } from '@/features/plans/components/EditPlanDialog';
import { DeletePlanDialog } from '@/features/plans/components/DeletePlanDialog';
import { formatDate } from '@/lib/date';
import { getOrgTypeLabel, getOrgTypeBadgeClass } from '@/lib/organization.utils';
import type { PlanStatus, Plan, Organization } from '@/types';

const PLAN_STATUS_CONFIG: Record<
  PlanStatus,
  { label: string; badgeVariant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'info'; colorClasses: string }
> = {
  active: {
    label: 'Đang triển khai',
    badgeVariant: 'success',
    colorClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  planning: {
    label: 'Đang lập kế hoạch',
    badgeVariant: 'warning',
    colorClasses: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  draft: {
    label: 'Bản nháp',
    badgeVariant: 'outline',
    colorClasses: 'bg-slate-50 text-slate-700 border-slate-200',
  },
  completed: {
    label: 'Đã hoàn thành',
    badgeVariant: 'default',
    colorClasses: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  cancelled: {
    label: 'Đã hủy',
    badgeVariant: 'outline',
    colorClasses: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export function PlansPage() {
  const navigate = useNavigate();
  const { user, memberships, activeOrganization, activeRole } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PlanStatus | 'all'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

  // Extract all org IDs user belongs to
  const userOrgIds = useMemo(() => {
    return (memberships || []).map((m) => m.organizationId);
  }, [memberships]);

  const userOrganizations = useMemo(() => {
    const orgMap = new Map<string, Organization>();
    (memberships || []).forEach((m) => {
      if (m.organizationId && !orgMap.has(m.organizationId)) {
        const org = (m as any).organization;
        if (org) {
          orgMap.set(m.organizationId, {
            id: m.organizationId,
            name: org.name || 'Đơn vị',
            code: org.code || 'ORG',
            type: org.type || 'chi_hoi',
            parentId: org.parentId || org.parent_id || null,
            parent: org.parent || null,
            createdAt: org.createdAt || org.created_at || '',
            updatedAt: org.updatedAt || org.updated_at || '',
          });
        }
      }
    });
    return Array.from(orgMap.values());
  }, [memberships]);

  const canManage = activeRole === 'admin' || activeRole === 'leader' || activeRole === 'deputy';

  // Fetch plans
  const { data: plans = [], isLoading } = usePlansList(userOrgIds, {
    search: searchTerm,
    status: selectedStatus,
  });

  return (
    <div id="plans-page" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <FolderKanban className="h-6 w-6 text-blue-600" />
              Collab
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý các chiến dịch quy mô lớn, chương trình phối hợp liên đơn vị và theo dõi hoạt động tập trung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <Button
              id="btn-create-plan"
              onClick={() => setIsCreateOpen(true)}
              className="h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tạo Collab mới
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="input-search-plans"
            type="text"
            placeholder="Tìm theo tên hoặc mã code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs bg-slate-50/50 border-slate-200 w-full"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {(['all', 'active', 'planning', 'completed', 'draft'] as const).map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedStatus(status)}
              className={`h-8 text-xs font-medium rounded-lg px-3 transition-colors ${
                selectedStatus === status
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {status === 'all' ? 'Tất cả' : PLAN_STATUS_CONFIG[status]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Plan Grid / List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="h-5 bg-slate-100 rounded-md w-3/4" />
              <div className="h-4 bg-slate-100 rounded-md w-1/2" />
              <div className="h-16 bg-slate-50 rounded-xl" />
            </Card>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs">
          <div className="h-16 w-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <FolderKanban className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Không tìm thấy chiến dịch nào</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {searchTerm || selectedStatus !== 'all'
              ? 'Không có kế hoạch nào phù hợp với bộ lọc tìm kiếm hiện tại.'
              : 'Hiện chưa có chiến dịch phối hợp nào được tạo. Hãy khởi tạo chiến dịch đầu tiên để kết nối các đơn vị!'}
          </p>
          {canManage && (
            <Button
              id="btn-empty-create-plan"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Tạo chiến dịch mới
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {plans.map((plan) => {
            const statusConfig = PLAN_STATUS_CONFIG[plan.status] || PLAN_STATUS_CONFIG.active;
            const cohostsCount = (plan.organizations || []).length;
            const isHost = activeOrganization?.id === plan.leadOrganizationId;

            return (
              <Card
                key={plan.id}
                id={`plan-card-${plan.id}`}
                onClick={() => navigate(`/plans/${plan.id}`)}
                className="group bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-blue-300 transition-all duration-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Top badges & actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {plan.code}
                      </span>

                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.colorClasses}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPlan(plan);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 cursor-pointer transition-colors"
                          title="Chỉnh sửa Collab"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingPlan(plan);
                          }}
                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                          title="Xóa Collab"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
                      {plan.description || 'Chưa có mô tả chi tiết cho kế hoạch này.'}
                    </p>
                  </div>

                  {/* Host Organization Info */}
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium text-slate-500 text-[11px]">
                        <Building2 className="h-3.5 w-3.5 text-blue-600" />
                        Chủ trì:
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0 max-w-[170px]">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${getOrgTypeBadgeClass(plan.leadOrganization?.type)}`}>
                          {getOrgTypeLabel(plan.leadOrganization?.type)}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {plan.leadOrganization?.name || 'Đơn vị chủ trì'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium text-slate-500 text-[11px]">
                        <Users2 className="h-3.5 w-3.5 text-purple-600" />
                        Đồng tổ chức:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {cohostsCount > 0 ? `${cohostsCount} đơn vị` : 'Chưa có'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Strip */}
                <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {plan.startDate ? formatDate(plan.startDate) : 'Chưa rõ'}
                      {plan.endDate ? ` - ${formatDate(plan.endDate)}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform text-[11px]">
                    <span>{plan.activitiesCount || 0} sự kiện</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Plan Dialog */}
      <CreatePlanDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        availableOrganizations={userOrganizations}
        defaultLeadOrgId={activeOrganization?.id}
        onSuccess={(newPlanId) => {
          navigate(`/plans/${newPlanId}`);
        }}
      />

      {/* Edit Plan Dialog */}
      <EditPlanDialog
        isOpen={Boolean(editingPlan)}
        onClose={() => setEditingPlan(null)}
        plan={editingPlan}
      />

      {/* Delete Plan Dialog */}
      <DeletePlanDialog
        isOpen={Boolean(deletingPlan)}
        onClose={() => setDeletingPlan(null)}
        plan={deletingPlan}
      />
    </div>
  );
}
