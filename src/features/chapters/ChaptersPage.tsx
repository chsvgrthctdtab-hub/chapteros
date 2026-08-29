import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, Users, Shield, Network, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useOrganizationDetail,
  useOrganizationMemberships,
  useUserOrganizations,
  useUpdateOrganizationMutation,
  useUpdateMembershipMutation,
  useRemoveMembershipMutation,
  useUploadOrganizationLogoMutation,
  useDeleteOrganizationLogoMutation,
} from './queries/organization.queries';
import { OrganizationInfoCard } from './components/OrganizationInfoCard';
import { OrganizationMembershipsCard } from './components/OrganizationMembershipsCard';
import { MyOrganizationsCard } from './components/MyOrganizationsCard';
import { ROLES, isOrgAdmin, isOrgBoard, canManageOrganization } from '@/types/roles';
import type { OrganizationRole, MembershipStatus } from '@/types';

export function ChaptersPage() {
  const {
    user,
    activeOrganization,
    memberships: authMemberships,
    activeRole,
    setActiveOrganizationId,
    refreshAuth,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'memberships' | 'my-orgs'>('info');

  const {
    data: organization,
    isLoading: isLoadingOrg,
  } = useOrganizationDetail(activeOrganization?.id);

  const {
    data: memberships = [],
    isLoading: isLoadingMemberships,
  } = useOrganizationMemberships(activeOrganization?.id);

  const {
    data: userOrganizations = [],
    isLoading: isLoadingUserOrgs,
  } = useUserOrganizations(user?.id);

  const updateOrgMutation = useUpdateOrganizationMutation();
  const updateMembershipMutation = useUpdateMembershipMutation();
  const removeMembershipMutation = useRemoveMembershipMutation();
  const uploadLogoMutation = useUploadOrganizationLogoMutation();
  const deleteLogoMutation = useDeleteOrganizationLogoMutation();

  const activeOrgId = activeOrganization?.id;

  // Resolve current membership specifically for the active organization
  const currentMembership = useMemo(() => {
    if (!user?.id || !activeOrgId) return null;

    // 1. Search in organization memberships list
    const inOrgList = memberships.find(
      (m) => m.userId === user.id && m.organizationId === activeOrgId && m.status === 'active'
    );
    if (inOrgList) return inOrgList;

    // 2. Search in auth memberships list
    const inAuthList = authMemberships.find(
      (m) => m.userId === user.id && m.organizationId === activeOrgId && m.status === 'active'
    );
    if (inAuthList) {
      return {
        id: inAuthList.id,
        organizationId: inAuthList.organizationId,
        userId: inAuthList.userId,
        role: inAuthList.role,
        status: inAuthList.status,
        createdAt: inAuthList.createdAt,
        updatedAt: inAuthList.updatedAt,
      };
    }

    return null;
  }, [memberships, authMemberships, user?.id, activeOrgId]);

  const membershipRole = currentMembership?.role ?? activeRole;
  const membershipStatus = currentMembership?.status ?? (activeRole ? 'active' : null);
  const canManageLogo = Boolean(
    canManageOrganization(activeOrgId, currentMembership) ||
    (activeOrgId &&
      membershipStatus === 'active' &&
      (membershipRole === 'admin' ||
        membershipRole === 'leader' ||
        membershipRole === 'deputy' ||
        membershipRole === 'treasurer' ||
        membershipRole === 'secretary' ||
        isOrgAdmin(membershipRole) ||
        isOrgBoard(membershipRole)))
  );

  const roleInfo = membershipRole ? ROLES[membershipRole] : null;

  const handleSaveOrganization = async (payload: {
    name: string;
    code: string;
    description: string | null;
    logo_url: string | null;
  }) => {
    if (!activeOrganization) return;
    await updateOrgMutation.mutateAsync({
      id: activeOrganization.id,
      payload,
      updaterUserId: user?.id,
    });
    await refreshAuth();
  };

  const handleUploadLogo = async (file: File) => {
    if (!activeOrganization) return;

    await uploadLogoMutation.mutateAsync({
      organizationId: activeOrganization.id,
      file,
      uploaderUserId: user?.id,
      currentLogoUrl: organization?.logoUrl || activeOrganization.logoUrl,
    });
    await refreshAuth();
  };

  const handleDeleteLogo = async () => {
    if (!activeOrganization) return;

    await deleteLogoMutation.mutateAsync({
      organizationId: activeOrganization.id,
      currentLogoUrl: organization?.logoUrl || activeOrganization.logoUrl,
      removerUserId: user?.id,
    });
    await refreshAuth();
  };

  const handleUpdateMembership = async (
    membershipId: string,
    role: OrganizationRole,
    status: MembershipStatus
  ) => {
    if (!activeOrganization) return;
    await updateMembershipMutation.mutateAsync({
      membershipId,
      organizationId: activeOrganization.id,
      payload: { role, status },
      updaterUserId: user?.id,
    });
    await refreshAuth();
  };

  const handleRemoveMembership = async (membershipId: string) => {
    if (!activeOrganization) return;
    await removeMembershipMutation.mutateAsync({
      membershipId,
      organizationId: activeOrganization.id,
      removerUserId: user?.id,
    });
    await refreshAuth();
  };

  const handleSwitchOrganization = async (orgId: string) => {
    await setActiveOrganizationId(orgId);
    await refreshAuth();
  };

  const currentOrg = organization || activeOrganization;

  return (
    <div id="chapters-page" className="space-y-6">
      <PageHeader
        title="Chapters"
        description="Quản lý thông tin định danh, biểu trưng chính thức, danh sách tài khoản thành viên và chuyển đổi Chi hội hoạt động."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Chapters' },
        ]}
      />

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 overflow-hidden border border-blue-100">
            {currentOrg?.logoUrl ? (
              <img
                src={currentOrg.logoUrl}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-slate-500 block">Chi hội đang kích hoạt</span>
            <span className="text-xs font-bold text-slate-900 truncate block">
              {currentOrg?.name || 'Đang tải...'}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {currentOrg?.code || '—'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Tổng tài khoản thành viên</span>
            <span className="text-base font-bold text-slate-900">
              {isLoadingMemberships ? <Loader2 className="h-4 w-4 animate-spin" /> : memberships.length}
            </span>
            <span className="text-[10px] text-slate-400 block">đã được cấp quyền</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Vai trò của bạn</span>
            <div className="mt-0.5">
              {roleInfo ? (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${roleInfo.colorClasses.bg} ${roleInfo.colorClasses.text} ${roleInfo.colorClasses.border}`}
                >
                  {roleInfo.label}
                </span>
              ) : (
                <span className="text-xs text-slate-400">Chưa xác định</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {userOrganizations.length} Chi hội liên kết
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'info' | 'memberships' | 'my-orgs')}>
        <TabsList className="grid grid-cols-3 max-w-lg mb-6">
          <TabsTrigger value="info" className="text-xs flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Thông tin Chi hội
          </TabsTrigger>
          <TabsTrigger value="memberships" className="text-xs flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Phân quyền hệ thống
          </TabsTrigger>
          <TabsTrigger value="my-orgs" className="text-xs flex items-center gap-1.5">
            <Network className="h-3.5 w-3.5" />
            Chi hội của tôi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4 m-0">
          <OrganizationInfoCard
            organization={currentOrg}
            activeRole={membershipRole}
            membership={currentMembership}
            canManageLogo={canManageLogo}
            onSave={handleSaveOrganization}
            onUploadLogo={handleUploadLogo}
            onDeleteLogo={handleDeleteLogo}
            isLoading={isLoadingOrg || updateOrgMutation.isPending}
            isUploadingLogo={uploadLogoMutation.isPending}
            isDeletingLogo={deleteLogoMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="memberships" className="space-y-4 m-0">
          <OrganizationMembershipsCard
            memberships={memberships}
            organizationId={activeOrganization?.id || ''}
            currentUserId={user?.id}
            activeRole={membershipRole}
            onUpdateMembership={handleUpdateMembership}
            onRemoveMembership={handleRemoveMembership}
            isLoading={isLoadingMemberships || updateMembershipMutation.isPending || removeMembershipMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="my-orgs" className="space-y-4 m-0">
          <MyOrganizationsCard
            userOrganizations={userOrganizations}
            activeOrganizationId={activeOrganization?.id}
            onSwitchOrganization={handleSwitchOrganization}
            isLoading={isLoadingUserOrgs}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
