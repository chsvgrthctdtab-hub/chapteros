import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Download,
  Upload,
  Calendar,
  Trash2,
  X,
} from '@/lib/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { isOrgBoard, getOrgBoardTitle, getOrgMemberNoun, getRoleLabel, type OrganizationRole } from '@/types/roles';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { QueryErrorState } from '@/components/common/QueryErrorState';
import { MemberKPIStrip } from './components/MemberKPIStrip';
import { MemberFilters, type MemberViewMode } from './components/MemberFilters';
import { MemberListTable } from './components/MemberListTable';
import { MemberCard } from './components/MemberCard';
import { MemberTableSkeleton, MemberCardSkeleton } from './components/MemberSkeleton';
import { MemberFormDialog } from './components/MemberFormDialog';
import { MemberDetailDialog } from './components/MemberDetailDialog';
import { getMajorFromClassOrValue } from './utils/major.utils';
import { AssignTermDialog } from './components/AssignTermDialog';
import { BulkAssignTermDialog } from './components/BulkAssignTermDialog';
import { ExecutiveBoardSection } from './components/ExecutiveBoardSection';

import { ImportMembersFromFileDialog } from './components/ImportMembersFromFileDialog';
import { useMembersList, useOrgTerms, useMemberKPIStats, memberKeys } from './queries/member.queries';
import { useOrganizationMemberships } from '@/features/chapters/queries/organization.queries';
import {
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
  useAssignTermMember,
  useUpdateTermMember,
  useBulkDeleteMembers,
  useBulkAssignMembersToTerm,
} from './mutations/member.mutations';
import type { Member, MemberStatus } from '@/types';
import type {
  MemberFilterParams,
  MemberTermHistoryItem,
  MemberListItem,
} from './types/member.types';
import type { MemberFormData, TermMemberFormData } from './schemas/member.schema';

export function MembersPage() {
  const navigate = useNavigate();
  const { activeOrganization, activeMembership } = useAuth();
  const { t, language } = useLanguage();
  const toast = useToast();
  const queryClient = useQueryClient();
  const orgId = activeOrganization?.id;

  // Board permissions check (Admin, Leader, Deputy, Treasurer, Secretary)
  const canManage = isOrgBoard(activeMembership?.role) || !activeMembership || !activeMembership.role;

  // View Mode: 'table' | 'cards'
  const [viewMode, setViewMode] = useState<MemberViewMode>('table');

  // Filters State
  const [filters, setFilters] = useState<MemberFilterParams>({
    search: '',
    status: 'all',
    position: 'all',
    termId: 'all',
    page: 1,
    pageSize: 15,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Fetch terms list
  const { data: terms = [] } = useOrgTerms(orgId);
  const currentTerm = terms.find((t) => t.isCurrent) || terms[0];

  // Queries
  const {
    data: membersResponse,
    isLoading: isLoadingMembers,
    error: membersError,
    refetch: refetchMembers,
  } = useMembersList(orgId, filters);

  // Fetch Organization Memberships (Source of Truth for BCH Roles)
  const {
    data: bchMemberships = [],
    isLoading: isLoadingBch,
  } = useOrganizationMemberships(orgId);

  // Mutations
  const createMemberMutation = useCreateMember(orgId);
  const deleteMemberMutation = useDeleteMember(orgId);
  const bulkDeleteMutation = useBulkDeleteMembers(orgId);
  const bulkAssignMutation = useBulkAssignMembersToTerm(orgId);

  // Bulk Operations State
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkAssignTermDialogOpen, setBulkAssignTermDialogOpen] = useState(false);

  // Dialog States
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [assignTermDialogOpen, setAssignTermDialogOpen] = useState(false);
  const [assignTargetMember, setAssignTargetMember] = useState<Member | null>(null);
  const [editingTermAssignment, setEditingTermAssignment] = useState<MemberTermHistoryItem | null>(null);

  // Delete Confirm Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Google Sheets Modals
  const [fileImportOpen, setFileImportOpen] = useState(false);

  // Total organizational KPI stats (not affected by pagination)
  const { data: memberStats } = useMemberKPIStats(orgId, currentTerm?.id);

  // Computed Stats for Quick Operational Strip
  const stats = useMemo(() => {
    const total = memberStats?.total ?? (membersResponse?.totalCount || 0);
    const active = memberStats?.active ?? 0;
    const alumni = memberStats?.alumni ?? 0;
    const assignedToTerm = memberStats?.assignedToTerm ?? 0;
    const boardCount = memberStats?.boardCount ?? 0;

    return { total, active, alumni, assignedToTerm, boardCount };
  }, [memberStats, membersResponse?.totalCount]);

  // Handlers
  const handleFilterChange = (newFilters: Partial<MemberFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setSelectedMemberIds([]);
    setFilters({
      search: '',
      status: 'all',
      position: 'all',
      termId: 'all',
      page: 1,
      pageSize: 15,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  const handleOpenCreateDialog = () => {
    setEditingMember(null);
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (member: Member) => {
    if (member.id.startsWith('account-')) {
      // Unlinked system account: open create dialog prefilled with system account details
      setEditingMember({
        ...member,
        id: '',
      });
      setFormDialogOpen(true);
      return;
    }
    setEditingMember(member);
    setFormDialogOpen(true);
  };

  const handleOpenDetailDialog = (member: Member) => {
    setSelectedMember(member);
    setDetailDialogOpen(true);
  };

  const handleOpenAssignTerm = (member: Member, initialData?: MemberTermHistoryItem) => {
    if (member.id.startsWith('account-')) {
      toast.info(
        language === 'vi'
          ? 'Tài khoản này chưa có hồ sơ hội viên chính thức trong danh sách. Vui lòng bấm "Chỉnh sửa" để hoàn tất tạo hồ sơ trước khi phân công nhiệm kỳ.'
          : 'This account does not have a roster profile yet. Please edit to create the profile first.'
      );
      return;
    }
    setAssignTargetMember(member);
    setEditingTermAssignment(initialData || null);
    setAssignTermDialogOpen(true);
  };

  const handleDeleteMember = (member: Member) => {
    if (member.id.startsWith('account-')) {
      toast.info(
        language === 'vi'
          ? 'Đây là tài khoản quản trị hệ thống. Để xóa hoặc điều chỉnh phân quyền, vui lòng truy cập Cài đặt -> Thành viên & Phân quyền.'
          : 'This is a system administrator account. To revoke or remove permissions, visit Settings -> Members & Roles.'
      );
      return;
    }
    setMemberToDelete(member);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await deleteMemberMutation.mutateAsync(memberToDelete.id);
      toast.success(`Đã xóa hồ sơ hội viên "${memberToDelete.fullName}".`);
      setDeleteConfirmOpen(false);
      setMemberToDelete(null);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  // Mutation callers for active dialogs
  const updateMemberMutation = useUpdateMember(editingMember?.id || '', orgId);
  const assignTermMutation = useAssignTermMember(assignTargetMember?.id || '', orgId);
  const updateTermMemberMutation = useUpdateTermMember(
    assignTargetMember?.id || '',
    editingTermAssignment?.id || '',
    orgId
  );

  const handleMemberFormSubmit = async (data: MemberFormData) => {
    try {
      if (editingMember && editingMember.id) {
        await updateMemberMutation.mutateAsync(data);
        toast.success(`Cập nhật hồ sơ hội viên "${data.fullName}" thành công.`);
      } else {
        await createMemberMutation.mutateAsync(data);
        toast.success(`Thêm mới hội viên "${data.fullName}" thành công.`);
      }
      setFormDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleAssignTermSubmit = async (data: TermMemberFormData) => {
    try {
      if (editingTermAssignment) {
        await updateTermMemberMutation.mutateAsync(data);
        toast.success('Cập nhật phân công nhiệm kỳ thành công.');
      } else {
        await assignTermMutation.mutateAsync(data);
        toast.success('Phân công nhiệm kỳ cho hội viên thành công.');
      }
      setAssignTermDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const isViewingBchOnly = filters.position === 'bch';
  const orgType = activeOrganization?.type;
  const boardTitle = getOrgBoardTitle(orgType, language);
  const memberNoun = getOrgMemberNoun(orgType, language);

  const membersList = membersResponse?.data || [];

  // Bulk Selection Handlers
  const handleToggleSelectMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const currentPageIds = membersList.map((m) => m.id);
    const allSelected =
      currentPageIds.length > 0 && currentPageIds.every((id) => selectedMemberIds.includes(id));
    if (allSelected) {
      setSelectedMemberIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedMemberIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedMemberIds([]);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedMemberIds.length === 0) return;
    try {
      const count = await bulkDeleteMutation.mutateAsync(selectedMemberIds);
      toast.success(`Đã xóa thành công ${count || selectedMemberIds.length} hồ sơ hội viên.`);
      setSelectedMemberIds([]);
      setBulkDeleteConfirmOpen(false);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Không thể xóa hội viên đã chọn');
    }
  };

  const handleBulkAssignTermSubmit = async (targetTermId: string, pos: string, dept: string | null) => {
    if (selectedMemberIds.length === 0) return;
    try {
      const count = await bulkAssignMutation.mutateAsync({
        memberIds: selectedMemberIds,
        termId: targetTermId,
        position: pos,
        department: dept,
      });
      const termName = terms.find((t) => t.id === targetTermId)?.name || 'nhiệm kỳ';
      toast.success(`Đã phân công ${count || selectedMemberIds.length} hội viên vào ${termName}.`);
      setSelectedMemberIds([]);
      setBulkAssignTermDialogOpen(false);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Không thể gán hội viên vào nhiệm kỳ');
    }
  };

  // Construct a unified BCH list combining roster members and unlinked system accounts
  const unifiedBchList = useMemo(() => {
    if (!isViewingBchOnly) return membersList;

    const boardRoles: OrganizationRole[] = ['admin', 'leader', 'deputy', 'treasurer', 'secretary'];
    const validMemberships = (bchMemberships || []).filter((m) => boardRoles.includes(m.role));
    const matchedMembershipIds = new Set<string>();

    const helperInferredRole = (position?: string | null): OrganizationRole => {
      const p = (position || '').toLowerCase();
      if (p.includes('trưởng') || p.includes('chủ nhiệm') || p.includes('đội trưởng') || p.includes('leader')) return 'leader';
      if (p.includes('phó') || p.includes('deputy')) return 'deputy';
      if (p.includes('thủ quỹ') || p.includes('thu quy') || p.includes('treasurer')) return 'treasurer';
      if (p.includes('thư ký') || p.includes('thu ky') || p.includes('secretary')) return 'secretary';
      if (p.includes('admin') || p.includes('quản trị') || p.includes('quan tri')) return 'admin';
      return 'secretary';
    };

    const getRoleWeight = (role: OrganizationRole): number => {
      switch (role) {
        case 'admin': return 1;
        case 'leader': return 2;
        case 'deputy': return 3;
        case 'treasurer': return 4;
        case 'secretary': return 5;
        default: return 6;
      }
    };

    const result: MemberListItem[] = [];

    // 1. Add roster members
    for (const m of membersList) {
      const matchedMem = validMemberships.find((mem) => {
        if (m.userId && mem.userId === m.userId) return true;
        if (m.email && mem.profile?.email && m.email.trim().toLowerCase() === mem.profile.email.trim().toLowerCase()) return true;
        if (m.studentId && mem.profile?.studentId && m.studentId.trim() === mem.profile.studentId.trim()) return true;
        return false;
      });

      if (matchedMem) {
        matchedMembershipIds.add(matchedMem.id);
      }

      result.push(m);
    }

    // 2. Add unlinked memberships (system accounts not in members roster)
    for (const mem of validMemberships) {
      if (matchedMembershipIds.has(mem.id)) continue;

      const role = mem.role;
      const roleLabel = getRoleLabel(role, language, activeOrganization?.type);
      const fullName = mem.profile?.fullName || mem.profile?.email?.split('@')[0] || 'Cán bộ BCH';

      const unlinkedItem: MemberListItem = {
        id: `account-${mem.id}`,
        organizationId: orgId || '',
        userId: mem.userId,
        studentId: mem.profile?.studentId || null,
        fullName,
        email: mem.profile?.email || null,
        phone: mem.profile?.phone || null,
        className: null,
        major: null,
        cohort: null,
        position: roleLabel,
        status: 'active' as MemberStatus,
        joinedDate: mem.createdAt ? mem.createdAt.split('T')[0] : null,
        notes: language === 'vi' ? 'Tài khoản quản trị điều hành hệ thống' : 'System administrative account',
        createdAt: mem.createdAt || new Date().toISOString(),
        updatedAt: mem.updatedAt || mem.createdAt || new Date().toISOString(),
        currentTermAssignment: null,
      };

      // Filter by search query if present
      if (filters.search && filters.search.trim()) {
        const term = filters.search.toLowerCase().trim();
        const matches =
          fullName.toLowerCase().includes(term) ||
          (unlinkedItem.email || '').toLowerCase().includes(term) ||
          (unlinkedItem.studentId || '').toLowerCase().includes(term) ||
          roleLabel.toLowerCase().includes(term);
        if (!matches) continue;
      }

      // Filter by status if present
      if (filters.status && filters.status !== 'all' && filters.status !== 'active') {
        continue;
      }

      result.push(unlinkedItem);
    }

    // Sort by role hierarchy
    result.sort((a, b) => {
      const roleA = helperInferredRole(a.position);
      const roleB = helperInferredRole(b.position);
      const weightDiff = getRoleWeight(roleA) - getRoleWeight(roleB);
      if (weightDiff !== 0) return weightDiff;
      return a.fullName.localeCompare(b.fullName, 'vi');
    });

    return result;
  }, [isViewingBchOnly, membersList, bchMemberships, language, activeOrganization?.type, orgId, filters.search, filters.status]);

  // Export to CSV
  const handleExportCsv = () => {
    const data = isViewingBchOnly ? unifiedBchList : (membersResponse?.data || []);
    if (data.length === 0) {
      toast.info('Không có dữ liệu hội viên để xuất file.');
      return;
    }

    try {
      const headers = [
        'MSSV',
        'Họ và tên',
        'Lớp',
        'Khóa',
        'Ngành',
        'Chức vụ Chi hội',
        'Email',
        'Số điện thoại',
        'Trạng thái hồ sơ',
        'Nhiệm kỳ gần nhất',
        'Chức vụ nhiệm kỳ',
        'Ngày tham gia',
      ];

      const rows = data.map((m) => [
        `"${m.studentId || ''}"`,
        `"${m.fullName}"`,
        `"${m.className || ''}"`,
        `"${m.cohort || ''}"`,
        `"${getMajorFromClassOrValue(m.className, m.major, '')}"`,
        `"${m.position || 'Hội viên'}"`,
        `"${m.email || ''}"`,
        `"${m.phone || ''}"`,
        `"${m.status}"`,
        `"${m.currentTermAssignment?.termName || ''}"`,
        `"${m.currentTermAssignment?.position || ''}"`,
        `"${m.joinedDate || ''}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Danh_sach_hoi_vien_${activeOrganization?.code || 'ChiHoi'}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Đã xuất file CSV danh sách hội viên thành công.');
    } catch {
      toast.error('Lỗi khi xuất file danh sách hội viên.');
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink-navy">
              {language === 'vi' ? `${memberNoun} & ${boardTitle}` : `${memberNoun} & ${boardTitle}`}
            </h1>
            <span className="text-xs font-semibold text-slate-gray bg-cloud border border-hairline px-2.5 py-0.5 rounded-full tabular-nums">
              {stats.total} {memberNoun.toLowerCase()} • {stats.boardCount} {boardTitle}
            </span>
          </div>
          <p className="text-xs text-slate-gray mt-0.5">
            {language === 'vi'
              ? `Quản lý hồ sơ ${memberNoun.toLowerCase()} và phân quyền ${boardTitle}.`
              : `Manage ${memberNoun.toLowerCase()} directory and ${boardTitle} permissions.`}
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Nút Xuất CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            title={t('members.action.export_csv', 'Xuất file CSV')}
            className="text-xs h-8 px-3 text-[#1e293b] hover:bg-[#f0f4f9] border-[#e2e8f0] rounded-full cursor-pointer flex items-center gap-1.5 font-semibold shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#2e89f7] shrink-0" />
            <span className="hidden sm:inline">{t('members.action.export', 'Xuất CSV')}</span>
          </Button>

          {/* Nút Nhập file Excel/CSV */}
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFileImportOpen(true)}
              title="Nhập từ file Excel / CSV"
              className="text-xs h-8 px-3 text-[#1e293b] hover:bg-[#f0f4f9] border-[#e2e8f0] rounded-full cursor-pointer flex items-center gap-1.5 font-semibold shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-[#2e89f7] shrink-0" />
              <span className="hidden sm:inline">{t('members.action.import', 'Nhập file')}</span>
            </Button>
          )}

          {/* Nút Thêm hội viên */}
          {canManage && (
            <Button
              size="sm"
              onClick={handleOpenCreateDialog}
              title={language === 'vi' ? `Thêm ${memberNoun.toLowerCase()}` : `Add ${memberNoun.toLowerCase()}`}
              className="bg-[#2e89f7] hover:bg-[#1a73e8] text-white text-xs h-8 px-3.5 rounded-full shadow-2xs cursor-pointer font-semibold shrink-0 flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">{language === 'vi' ? `Thêm ${memberNoun.toLowerCase()}` : `Add ${memberNoun.toLowerCase()}`}</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Compact Operational Metric Strip */}
      <MemberKPIStrip
        stats={stats}
        currentFilters={filters}
        onFilterSelect={handleFilterChange}
        activeTermId={currentTerm?.id}
      />

      {/* 3. Toolbar: Search, Filters & View Toggle */}
      <MemberFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        terms={terms}
        totalResults={isViewingBchOnly ? unifiedBchList.length : membersResponse?.totalCount}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Query Error State if request fails */}
      {membersError && (
        <QueryErrorState
          title={
            language === 'vi'
              ? 'Không thể tải danh sách hội viên'
              : 'Unable to load member directory'
          }
          error={membersError}
          onRetry={() => refetchMembers()}
        />
      )}

      {/* 4. Display Content: Executive Board vs Member Roster */}
      {isViewingBchOnly ? (
        <ExecutiveBoardSection
          memberships={bchMemberships}
          members={unifiedBchList}
          organizationName={activeOrganization?.name}
          organizationCode={activeOrganization?.code}
          organizationType={activeOrganization?.type}
          isLoading={isLoadingBch || isLoadingMembers}
          searchTerm={filters.search}
          onSearchChange={(val) => handleFilterChange({ search: val, page: 1 })}
          canManage={canManage}
          onManageMemberships={() => navigate('/settings?tab=members')}
          onViewDetail={handleOpenDetailDialog}
          onEdit={handleOpenEditDialog}
        >
          {viewMode === 'table' ? (
            isLoadingMembers ? (
              <MemberTableSkeleton rows={5} />
            ) : (
              <MemberListTable
                data={unifiedBchList}
                totalCount={unifiedBchList.length}
                page={1}
                pageSize={unifiedBchList.length || 15}
                totalPages={1}
                isLoading={isLoadingMembers}
                canManage={canManage}
                selectedIds={selectedMemberIds}
                onToggleSelect={handleToggleSelectMember}
                onToggleSelectAll={handleToggleSelectAll}
                onPageChange={(p) => handleFilterChange({ page: p })}
                onViewDetail={handleOpenDetailDialog}
                onEdit={handleOpenEditDialog}
                onAssignTerm={handleOpenAssignTerm}
                onDelete={handleDeleteMember}
                onAddNew={handleOpenCreateDialog}
              />
            )
          ) : null}
        </ExecutiveBoardSection>
      ) : (
        <div className="space-y-6">
          {/* Main Member List / Grid View */}
          {isLoadingMembers ? (
            viewMode === 'table' ? (
              <MemberTableSkeleton rows={8} />
            ) : (
              <MemberCardSkeleton count={6} />
            )
          ) : viewMode === 'table' ? (
            <MemberListTable
              data={membersList}
              totalCount={membersResponse?.totalCount || 0}
              page={membersResponse?.page || 1}
              pageSize={membersResponse?.pageSize || 15}
              totalPages={membersResponse?.totalPages || 1}
              isLoading={isLoadingMembers}
              canManage={canManage}
              selectedIds={selectedMemberIds}
              onToggleSelect={handleToggleSelectMember}
              onToggleSelectAll={handleToggleSelectAll}
              onPageChange={(p) => handleFilterChange({ page: p })}
              onViewDetail={handleOpenDetailDialog}
              onEdit={handleOpenEditDialog}
              onAssignTerm={handleOpenAssignTerm}
              onDelete={handleDeleteMember}
              onAddNew={handleOpenCreateDialog}
            />
          ) : (
            /* Cards Grid View */
            <div className="space-y-4">
              {membersList.length === 0 ? (
                <div className="bg-white border border-hairline rounded-2xl p-12 text-center shadow-xs space-y-4">
                  <div className="h-14 w-14 bg-cloud text-mist-gray rounded-2xl flex items-center justify-center mx-auto border border-hairline">
                    <Users strokeWidth={1.5} className="h-7 w-7 text-mist-gray" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-sm font-semibold text-ink-navy">
                      {language === 'vi'
                        ? 'Không tìm thấy hội viên nào'
                        : 'No members found'}
                    </h3>
                    <p className="text-xs text-slate-gray">
                      {language === 'vi'
                        ? 'Chưa có hồ sơ hội viên nào trong Đơn vị hoặc không có kết quả phù hợp với bộ lọc hiện tại.'
                        : 'No member records in this Chapter or none matched current filters.'}
                    </p>
                  </div>
                  {canManage && (
                    <Button
                      onClick={handleOpenCreateDialog}
                      size="sm"
                      className="bg-signal-blue hover:bg-[#005be0] text-white text-xs h-8 rounded-lg shadow-sm cursor-pointer font-medium"
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                      {language === 'vi'
                        ? 'Thêm hội viên đầu tiên'
                        : 'Add First Member'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {membersList.map((item) => (
                    <MemberCard
                      key={item.id}
                      member={item}
                      canManage={canManage}
                      isSelected={selectedMemberIds.includes(item.id)}
                      onToggleSelect={handleToggleSelectMember}
                      onViewDetail={handleOpenDetailDialog}
                      onEdit={handleOpenEditDialog}
                      onAssignTerm={handleOpenAssignTerm}
                      onDelete={handleDeleteMember}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals & Dialogs */}
      <MemberFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        initialData={editingMember}
        terms={terms}
        onSubmit={handleMemberFormSubmit}
        isLoading={createMemberMutation.isPending || updateMemberMutation.isPending}
      />

      <MemberDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        member={selectedMember}
        terms={terms}
        canManage={canManage}
        onEditMember={(m) => {
          setDetailDialogOpen(false);
          handleOpenEditDialog(m);
        }}
        onAssignTerm={(m, initialData) => {
          setDetailDialogOpen(false);
          handleOpenAssignTerm(m, initialData);
        }}
      />

      <AssignTermDialog
        open={assignTermDialogOpen}
        onOpenChange={setAssignTermDialogOpen}
        member={assignTargetMember}
        terms={terms}
        initialData={editingTermAssignment || undefined}
        onSubmit={handleAssignTermSubmit}
        isLoading={assignTermMutation.isPending || updateTermMemberMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={language === 'vi' ? 'Xóa hồ sơ hội viên?' : 'Delete Member Record?'}
        description={
          language === 'vi'
            ? `Bạn có chắc chắn muốn xóa hồ sơ của hội viên "${memberToDelete?.fullName}" ${
                memberToDelete?.studentId ? `(${memberToDelete.studentId})` : ''
              }?`
            : `Are you sure you want to delete the record for "${memberToDelete?.fullName}" ${
                memberToDelete?.studentId ? `(${memberToDelete.studentId})` : ''
              }?`
        }
        warningNote={
          language === 'vi'
            ? 'Hành động này sẽ xóa vĩnh viễn hồ sơ và toàn bộ phân công nhiệm kỳ liên quan khỏi Đơn vị.'
            : 'This action will permanently delete the member profile and related term assignments.'
        }
        confirmLabel={language === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
        cancelLabel={language === 'vi' ? 'Hủy' : 'Cancel'}
        variant="destructive"
        isLoading={deleteMemberMutation.isPending}
        onConfirm={handleConfirmDelete}
      />

      {/* Import từ file Excel/CSV */}
      {orgId && (
        <ImportMembersFromFileDialog
          open={fileImportOpen}
          onOpenChange={setFileImportOpen}
          organizationId={orgId}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: memberKeys.all })}
        />
      )}

      {/* Floating Batch Action Bar */}
      {selectedMemberIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-ink-navy/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 border-r border-white/20 pr-3 text-xs font-semibold">
            <span className="w-5 h-5 rounded-full bg-signal-blue text-white flex items-center justify-center text-[11px] font-bold tabular-nums">
              {selectedMemberIds.length}
            </span>
            <span>hội viên đã chọn</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="h-8 px-2.5 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium cursor-pointer"
            >
              {membersList.length > 0 && membersList.every((m) => selectedMemberIds.includes(m.id))
                ? 'Bỏ chọn trang này'
                : 'Chọn cả trang này'}
            </button>

            <Button
              size="sm"
              onClick={() => setBulkAssignTermDialogOpen(true)}
              className="h-8 px-3 text-xs font-semibold bg-signal-blue hover:bg-[#005be0] text-white rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Gán vào nhiệm kỳ</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setBulkDeleteConfirmOpen(true)}
              className="h-8 px-3 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa ({selectedMemberIds.length})</span>
            </Button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="ml-1 p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Bỏ chọn tất cả"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        title={language === 'vi' ? `Xóa ${selectedMemberIds.length} hồ sơ hội viên?` : `Delete ${selectedMemberIds.length} Members?`}
        description={
          language === 'vi'
            ? `Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedMemberIds.length} hồ sơ hội viên đã chọn khỏi Đơn vị?`
            : `Are you sure you want to permanently delete the selected ${selectedMemberIds.length} member profiles?`
        }
        warningNote={
          language === 'vi'
            ? 'Hành động này sẽ xóa hoàn toàn thông tin hội viên và toàn bộ lịch sử phân công nhiệm kỳ liên quan. Không thể hoàn tác.'
            : 'This action will permanently delete these member profiles and all related term assignments. This action cannot be undone.'
        }
        confirmLabel={language === 'vi' ? `Xác nhận xóa (${selectedMemberIds.length})` : `Delete (${selectedMemberIds.length})`}
        cancelLabel={language === 'vi' ? 'Hủy' : 'Cancel'}
        variant="destructive"
        isLoading={bulkDeleteMutation.isPending}
        onConfirm={handleBulkDeleteConfirm}
      />

      {/* Bulk Assign Term Dialog */}
      <BulkAssignTermDialog
        open={bulkAssignTermDialogOpen}
        onOpenChange={setBulkAssignTermDialogOpen}
        selectedCount={selectedMemberIds.length}
        terms={terms}
        isLoading={bulkAssignMutation.isPending}
        onSubmit={handleBulkAssignTermSubmit}
      />
    </div>
  );
}
