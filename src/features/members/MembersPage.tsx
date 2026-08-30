import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Download,
  Upload,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { isOrgBoard, getOrgBoardTitle, getOrgMemberNoun, type OrganizationRole } from '@/types/roles';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { QueryErrorState } from '@/components/common/QueryErrorState';
import { MemberKPIStrip } from './components/MemberKPIStrip';
import { MemberFilters, type MemberViewMode } from './components/MemberFilters';
import { MemberListTable } from './components/MemberListTable';
import { MemberCard } from './components/MemberCard';
import { MemberTableSkeleton, MemberCardSkeleton } from './components/MemberSkeleton';
import { MemberFormDialog } from './components/MemberFormDialog';
import { MemberDetailDialog } from './components/MemberDetailDialog';
import { AssignTermDialog } from './components/AssignTermDialog';
import { ExecutiveBoardSection } from './components/ExecutiveBoardSection';
import { GoogleSheetsExportModal } from '@/integrations/google/sheets/components/GoogleSheetsExportModal';
import { GoogleSheetsImportWizardModal } from '@/integrations/google/sheets/components/GoogleSheetsImportWizardModal';
import { ImportMembersFromFileDialog } from './components/ImportMembersFromFileDialog';
import { useMembersList, useOrgTerms, useMemberKPIStats, memberKeys } from './queries/member.queries';
import { useOrganizationMemberships } from '@/features/chapters/queries/organization.queries';
import {
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
  useAssignTermMember,
  useUpdateTermMember,
} from './mutations/member.mutations';
import type { Member } from '@/types';
import type {
  MemberFilterParams,
  MemberTermHistoryItem,
} from './types/member.types';
import type { MemberFormData, TermMemberFormData } from './schemas/member.schema';

export function MembersPage() {
  const { activeOrganization, activeMembership } = useAuth();
  const { t, language } = useLanguage();
  const toast = useToast();
  const queryClient = useQueryClient();
  const orgId = activeOrganization?.id;

  // Board permissions check (Admin, Leader, Deputy, Treasurer, Secretary)
  const canManage = isOrgBoard(activeMembership?.role);

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
  const [sheetsExportOpen, setSheetsExportOpen] = useState(false);
  const [sheetsImportOpen, setSheetsImportOpen] = useState(false);
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
    setEditingMember(member);
    setFormDialogOpen(true);
  };

  const handleOpenDetailDialog = (member: Member) => {
    setSelectedMember(member);
    setDetailDialogOpen(true);
  };

  const handleOpenAssignTerm = (member: Member, initialData?: MemberTermHistoryItem) => {
    setAssignTargetMember(member);
    setEditingTermAssignment(initialData || null);
    setAssignTermDialogOpen(true);
  };

  const handleDeleteMember = (member: Member) => {
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
      if (editingMember) {
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

  // Export to CSV
  const handleExportCsv = () => {
    const data = membersResponse?.data || [];
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
        'Chuyên ngành',
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
        `"${m.major || ''}"`,
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

  const membersList = membersResponse?.data || [];
  const isViewingBchOnly = filters.position === 'bch';
  const orgType = activeOrganization?.type;
  const boardTitle = getOrgBoardTitle(orgType, language);
  const memberNoun = getOrgMemberNoun(orgType, language);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {language === 'vi' ? `${memberNoun} & ${boardTitle}` : `${memberNoun} & ${boardTitle}`}
            </h1>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full font-mono">
              {stats.total} {memberNoun.toLowerCase()} • {stats.boardCount} {boardTitle}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'vi'
              ? `Quản lý hồ sơ ${memberNoun.toLowerCase()} và phân quyền ${boardTitle}.`
              : `Manage ${memberNoun.toLowerCase()} directory and ${boardTitle} permissions.`}
          </p>
        </div>

        {/* Top Header Actions (Single clean row) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Dropdown Xuất */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 px-2.5 text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 border-slate-200 cursor-pointer flex items-center gap-1 font-medium"
              >
                <Download className="h-3.5 w-3.5 text-emerald-700" />
                <span>{t('members.action.export', 'Xuất')}</span>
                <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-lg">
              <DropdownMenuItem onClick={() => setSheetsExportOpen(true)} className="cursor-pointer text-xs py-2">
                <Download className="h-3.5 w-3.5 mr-2 text-emerald-700" />
                <span>{t('members.action.export_sheets', 'Xuất Google Sheets')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer text-xs py-2">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-slate-500" />
                <span>{t('members.action.export_csv', 'Xuất file CSV')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dropdown Nhập */}
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 px-2.5 text-slate-700 hover:text-blue-700 hover:bg-blue-50 border-slate-200 cursor-pointer flex items-center gap-1 font-medium"
                >
                  <Upload className="h-3.5 w-3.5 text-blue-600" />
                  <span>{t('members.action.import', 'Nhập')}</span>
                  <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 shadow-lg">
                <DropdownMenuItem
                  onClick={() => setFileImportOpen(true)}
                  className="cursor-pointer text-xs py-2 font-medium text-emerald-800 focus:text-emerald-900 focus:bg-emerald-50"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                  <span>Nhập từ file Excel / CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSheetsImportOpen(true)}
                  className="cursor-pointer text-xs py-2 text-slate-700"
                >
                  <Upload className="h-3.5 w-3.5 mr-2 text-blue-600" />
                  <span>Nhập từ Google Sheets</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Nút Thêm hội viên */}
          {canManage && (
            <Button
              size="sm"
              onClick={handleOpenCreateDialog}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 px-3 shadow-xs cursor-pointer font-medium shrink-0 flex items-center gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span className="whitespace-nowrap">{language === 'vi' ? `Thêm ${memberNoun.toLowerCase()}` : `Add ${memberNoun.toLowerCase()}`}</span>
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
        totalResults={isViewingBchOnly ? stats.boardCount : membersResponse?.totalCount}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* 4. Display Content: Executive Board vs Member Roster */}
      {isViewingBchOnly ? (
        /* SPECIALIZED VIEW: Ban Chấp Hành / Ban Chủ Nhiệm from organization_memberships */
        <ExecutiveBoardSection
          memberships={bchMemberships}
          organizationName={activeOrganization?.name}
          organizationCode={activeOrganization?.code}
          organizationType={activeOrganization?.type}
          isLoading={isLoadingBch}
          searchTerm={filters.search}
          onSearchChange={(val) => handleFilterChange({ search: val, page: 1 })}
          canManage={canManage}
        />
      ) : (
        /* STANDARD VIEW: Member Roster */
        <div className="space-y-6">
          {/* Error State if query fails */}
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
                <div className="bg-white border border-slate-200/90 rounded-xl p-12 text-center shadow-2xs space-y-4">
                  <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-200">
                    <Users className="h-7 w-7 text-slate-400" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {language === 'vi'
                        ? 'Không tìm thấy hội viên nào'
                        : 'No members found'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {language === 'vi'
                        ? 'Chưa có hồ sơ hội viên nào trong Chi hội hoặc không có kết quả phù hợp với bộ lọc hiện tại.'
                        : 'No member records in this Chapter or none matched current filters.'}
                    </p>
                  </div>
                  {canManage && (
                    <Button
                      onClick={handleOpenCreateDialog}
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 shadow-xs cursor-pointer"
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
            ? 'Hành động này sẽ xóa vĩnh viễn hồ sơ và toàn bộ phân công nhiệm kỳ liên quan khỏi Chi hội.'
            : 'This action will permanently delete the member profile and related term assignments.'
        }
        confirmLabel={language === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
        cancelLabel={language === 'vi' ? 'Hủy' : 'Cancel'}
        variant="destructive"
        isLoading={deleteMemberMutation.isPending}
        onConfirm={handleConfirmDelete}
      />

      {/* Google Sheets Export Modal */}
      {orgId && (
        <GoogleSheetsExportModal
          open={sheetsExportOpen}
          onOpenChange={setSheetsExportOpen}
          module="members"
          termId={filters.termId !== 'all' ? filters.termId : undefined}
        />
      )}

      {/* Google Sheets Import Wizard Modal */}
      {orgId && (
        <GoogleSheetsImportWizardModal
          open={sheetsImportOpen}
          onOpenChange={setSheetsImportOpen}
          module="members"
          termId={filters.termId !== 'all' ? filters.termId : undefined}
          onImportSuccess={() => queryClient.invalidateQueries({ queryKey: memberKeys.all })}
        />
      )}

      {/* Import từ file Excel/CSV */}
      {orgId && (
        <ImportMembersFromFileDialog
          open={fileImportOpen}
          onOpenChange={setFileImportOpen}
          organizationId={orgId}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: memberKeys.all })}
        />
      )}
    </div>
  );
}
