import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Building2,
  Calendar,
  Users2,
  ChevronRight,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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
    badgeVariant: 'default',
    colorClasses: 'bg-[#e6f0ff] text-signal-blue border-[#d4e4fa]',
  },
  planning: {
    label: 'Đang lập kế hoạch',
    badgeVariant: 'warning',
    colorClasses: 'bg-amber-50 text-amber-800 border-amber-200/70',
  },
  draft: {
    label: 'Bản nháp',
    badgeVariant: 'outline',
    colorClasses: 'bg-pebble text-slate-gray border-hairline',
  },
  completed: {
    label: 'Đã hoàn thành',
    badgeVariant: 'success',
    colorClasses: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
  },
  cancelled: {
    label: 'Đã hủy',
    badgeVariant: 'outline',
    colorClasses: 'bg-rose-50 text-rose-800 border-rose-200/70',
  },
};

export function PlansPage() {
  const navigate = useNavigate();
  const { memberships, activeOrganization, activeRole } = useAuth();

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
    <div id="plans-page" className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-ink-navy tracking-tight flex items-center gap-2.5">
              <FolderKanban strokeWidth={1.5} className="h-6 w-6 text-signal-blue" />
              Collab
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-gray mt-1">
            Quản lý các chiến dịch quy mô lớn, chương trình phối hợp liên đơn vị và theo dõi hoạt động tập trung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <Button
              id="btn-create-plan"
              onClick={() => setIsCreateOpen(true)}
              title="Tạo chiến dịch Collab mới"
              className="h-8 sm:h-9 px-2.5 sm:px-4 text-xs font-semibold bg-signal-blue hover:bg-[#005be0] text-white gap-1 sm:gap-1.5 shadow-sm cursor-pointer rounded-lg"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Tạo Collab mới</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-hairline shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-gray" />
          <Input
            id="input-search-plans"
            type="text"
            placeholder="Tìm theo tên hoặc mã code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs bg-white border-hairline text-ink-navy placeholder:text-mist-gray w-full"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-pebble border border-hairline rounded-lg overflow-x-auto w-full sm:w-auto scrollbar-none">
          {(['all', 'active', 'planning', 'completed', 'draft'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`h-7 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                selectedStatus === status
                  ? 'bg-white text-ink-navy shadow-sm font-semibold'
                  : 'text-slate-gray hover:text-ink-navy hover:bg-white/50'
              }`}
            >
              {status === 'all' ? 'Tất cả' : PLAN_STATUS_CONFIG[status]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Grid / List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-white border border-hairline rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="h-5 bg-pebble rounded-md w-3/4" />
              <div className="h-4 bg-pebble rounded-md w-1/2" />
              <div className="h-16 bg-pebble/60 rounded-xl" />
            </Card>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card className="bg-white border border-hairline rounded-2xl p-12 text-center shadow-sm">
          <div className="h-16 w-16 bg-[#e6f0ff] border border-hairline rounded-2xl flex items-center justify-center mx-auto mb-4 text-signal-blue">
            <FolderKanban strokeWidth={1.5} className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-ink-navy">Không tìm thấy chiến dịch nào</h3>
          <p className="text-xs text-slate-gray max-w-md mx-auto mt-1 mb-6">
            {searchTerm || selectedStatus !== 'all'
              ? 'Không có kế hoạch nào phù hợp với bộ lọc tìm kiếm hiện tại.'
              : 'Hiện chưa có chiến dịch phối hợp nào được tạo. Hãy khởi tạo chiến dịch đầu tiên để kết nối các đơn vị!'}
          </p>
          {canManage && (
            <Button
              id="btn-empty-create-plan"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs bg-signal-blue hover:bg-[#005be0] text-white gap-1.5 shadow-sm rounded-lg"
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

            return (
              <Card
                key={plan.id}
                id={`plan-card-${plan.id}`}
                onClick={() => navigate(`/plans/${plan.id}`)}
                className="group bg-white hover:bg-white border border-hairline hover:border-signal-blue/40 transition-all duration-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Top badges & actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-tight bg-pebble text-ink-navy border border-hairline">
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
                          className="p-1 rounded-lg hover:bg-pebble text-slate-gray hover:text-signal-blue cursor-pointer transition-colors"
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
                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-gray hover:text-rose-600 cursor-pointer transition-colors"
                          title="Xóa Collab"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-ink-navy group-hover:text-signal-blue transition-colors line-clamp-1 leading-snug">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-gray mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
                      {plan.description || 'Chưa có mô tả chi tiết cho kế hoạch này.'}
                    </p>
                  </div>

                  {/* Host Organization Info */}
                  <div className="p-3 bg-pebble/60 border border-hairline rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-gray">
                      <span className="flex items-center gap-1.5 font-medium text-slate-gray text-[11px]">
                        <Building2 className="h-3.5 w-3.5 text-signal-blue" />
                        Chủ trì:
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0 max-w-[170px]">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${getOrgTypeBadgeClass(plan.leadOrganization?.type)}`}>
                          {getOrgTypeLabel(plan.leadOrganization?.type)}
                        </span>
                        <span className="font-semibold text-ink-navy truncate">
                          {plan.leadOrganization?.name || 'Đơn vị chủ trì'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-slate-gray">
                      <span className="flex items-center gap-1.5 font-medium text-slate-gray text-[11px]">
                        <Users2 className="h-3.5 w-3.5 text-signal-blue" />
                        Đồng tổ chức:
                      </span>
                      <span className="font-semibold text-ink-navy">
                        {cohostsCount > 0 ? `${cohostsCount} đơn vị` : 'Chưa có'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Strip */}
                <div className="px-5 py-3 bg-cloud border-t border-hairline flex items-center justify-between text-xs text-slate-gray">
                  <div className="flex items-center gap-1.5 text-[11px] tabular-nums">
                    <Calendar className="h-3.5 w-3.5 text-mist-gray" />
                    <span>
                      {plan.startDate ? formatDate(plan.startDate) : 'Chưa rõ'}
                      {plan.endDate ? ` - ${formatDate(plan.endDate)}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-semibold text-signal-blue group-hover:translate-x-0.5 transition-transform text-[11px] tabular-nums">
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
