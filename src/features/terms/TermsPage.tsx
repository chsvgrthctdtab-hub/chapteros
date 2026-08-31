import React, { useState, useMemo } from 'react';
import {
  CalendarRange,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
  Calendar,
  CheckCircle,
  Edit2,
  Loader2,
  Eye,
  ArrowRightLeft,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { QueryErrorState } from '@/components/common/QueryErrorState';

import {
  useTermsList,
  useCreateTermMutation,
  useUpdateTermMutation,
  useActivateTermMutation,
  useCloseTermWithSnapshotMutation,
  useArchiveTermMutation,
  useAddTermMemberMutation,
  useUpdateTermMemberMutation,
  useRemoveTermMemberMutation,
} from './queries/term.queries';
import { useActivitiesList } from '@/features/activities/queries/activity.queries';
import { useTasksList } from '@/features/tasks/queries/task.queries';
import { useFinanceTransactions } from '@/features/finance/queries/finance.queries';

import { TermHero } from './components/TermHero';
import { TermMetricStrip } from './components/TermMetricStrip';
import { TermTimeline } from './components/TermTimeline';
import { TermToolbar, type TermViewMode, type TermSortOption } from './components/TermToolbar';
import { TermTable } from './components/TermTable';
import { TermCardsGrid } from './components/TermCardsGrid';
import { TermComparison } from './components/TermComparison';
import { TermOperationalSignals } from './components/TermOperationalSignals';
import { TermDetailDrawer } from './components/TermDetailDrawer';

import { TermFormDialog } from './components/TermFormDialog';
import { ActivateTermDialog } from './components/ActivateTermDialog';
import { CompleteTermDialog } from './components/CompleteTermDialog';
import { TransferTermMembersDialog } from './components/TransferTermMembersDialog';
import { TermClosingSnapshotModal } from './components/TermClosingSnapshotModal';
import { AddTermMemberDialog } from './components/AddTermMemberDialog';

import { isOrgAdmin, isOrgBoard } from '@/types/roles';
import type { Term, TermMember } from '@/types';
import type { TermFormData, TermMemberAssignmentFormData } from './schemas/term.schema';
import type { CloseTermParams } from './types/term.types';

export function TermsPage() {
  const { activeOrganization, activeRole, user, profile } = useAuth();
  const toast = useToast();
  const organizationId = activeOrganization?.id || '';

  // Permission check
  const canManage = isOrgAdmin(activeRole) || isOrgBoard(activeRole);

  // Local UI filters & view mode
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<TermSortOption>('start_desc');
  const [viewMode, setViewMode] = useState<TermViewMode>('table');

  // Dialog & Drawer states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [selectedTermForDrawer, setSelectedTermForDrawer] = useState<Term | null>(null);
  const [activatingTerm, setActivatingTerm] = useState<Term | null>(null);
  const [completingTerm, setCompletingTerm] = useState<Term | null>(null);
  const [transferringTerm, setTransferringTerm] = useState<Term | null>(null);
  const [viewingSnapshotTerm, setViewingSnapshotTerm] = useState<Term | null>(null);

  // Member assignment dialog in drawer
  const [addingMemberToTerm, setAddingMemberToTerm] = useState<Term | null>(null);
  const [editingTermMember, setEditingTermMember] = useState<TermMember | null>(null);

  // Data Queries
  const {
    data: terms = [],
    isLoading: isLoadingTerms,
    isFetching: isFetchingTerms,
    error: termsError,
    refetch: refetchTerms,
  } = useTermsList(organizationId);

  const { data: activitiesRes } = useActivitiesList(organizationId, { pageSize: 500 });
  const { data: tasksRes } = useTasksList(organizationId, { pageSize: 500 });
  const { data: financeRes } = useFinanceTransactions(organizationId, { pageSize: 1000 });

  // Mutations
  const createMutation = useCreateTermMutation();
  const updateMutation = useUpdateTermMutation();
  const activateMutation = useActivateTermMutation();
  const closeTermMutation = useCloseTermWithSnapshotMutation();
  const archiveMutation = useArchiveTermMutation();
  const addMemberMutation = useAddTermMemberMutation();
  const updateMemberMutation = useUpdateTermMemberMutation();
  const removeMemberMutation = useRemoveTermMemberMutation();

  // Aggregate operational numbers per term
  const { activitiesCountMap, tasksCountMap, financeBalanceMap, currentActiveTerm } = useMemo(() => {
    const actMap: Record<string, number> = {};
    const tskMap: Record<string, number> = {};
    const finMap: Record<string, number> = {};

    // Activities count map
    (activitiesRes?.data || []).forEach((act) => {
      if (act.termId) {
        actMap[act.termId] = (actMap[act.termId] || 0) + 1;
      }
    });

    // Tasks count map
    (tasksRes?.data || []).forEach((tsk) => {
      if (tsk.termId) {
        tskMap[tsk.termId] = (tskMap[tsk.termId] || 0) + 1;
      }
    });

    // Finance net balance map
    (financeRes?.transactions || []).forEach((tx) => {
      if (tx.termId) {
        const amt = tx.amount || 0;
        const currentBal = finMap[tx.termId] || 0;
        if (tx.transactionType === 'income') {
          finMap[tx.termId] = currentBal + amt;
        } else if (tx.transactionType === 'expense') {
          finMap[tx.termId] = currentBal - amt;
        }
      }
    });

    const activeTerm = terms.find((t) => t.isCurrent) || null;

    return {
      activitiesCountMap: actMap,
      tasksCountMap: tskMap,
      financeBalanceMap: finMap,
      currentActiveTerm: activeTerm,
    };
  }, [activitiesRes, tasksRes, financeRes, terms]);

  // Total summary metrics
  const totalAssignedMembers = useMemo(() => {
    return terms.reduce((acc, t) => acc + (t.memberCount || 0), 0);
  }, [terms]);

  const totalActivitiesCount = useMemo(() => {
    return Object.values(activitiesCountMap).reduce((acc, val) => acc + val, 0);
  }, [activitiesCountMap]);

  // Current term operational stats for hero
  const currentTermHeroStats = useMemo(() => {
    if (!currentActiveTerm) return undefined;
    return {
      memberCount: currentActiveTerm.memberCount ?? 0,
      activityCount: activitiesCountMap[currentActiveTerm.id] ?? 0,
      taskCount: tasksCountMap[currentActiveTerm.id] ?? 0,
      balance: financeBalanceMap[currentActiveTerm.id] ?? 0,
    };
  }, [currentActiveTerm, activitiesCountMap, tasksCountMap, financeBalanceMap]);

  // Filtered & Sorted terms
  const filteredTerms = useMemo(() => {
    let result = terms.filter((term) => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && !term.isCurrent && term.status !== 'active') return false;
        if (statusFilter !== 'active' && term.status !== statusFilter) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = term.name.toLowerCase();
        const start = (term.startDate || '').toLowerCase();
        const end = (term.endDate || '').toLowerCase();
        return name.includes(q) || start.includes(q) || end.includes(q);
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'start_desc') {
        return (b.startDate || '').localeCompare(a.startDate || '');
      }
      if (sortOption === 'start_asc') {
        return (a.startDate || '').localeCompare(b.startDate || '');
      }
      if (sortOption === 'end_desc') {
        return (b.endDate || '').localeCompare(a.endDate || '');
      }
      if (sortOption === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [terms, statusFilter, searchQuery, sortOption]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortOption('start_desc');
  };

  // Handlers for Mutations
  const handleCreateTermSubmit = async (formData: TermFormData) => {
    if (!organizationId) {
      toast.error('Cannot identify active organization.');
      return;
    }
    try {
      await createMutation.mutateAsync({
        payload: {
          organization_id: organizationId,
          name: formData.name.trim(),
          start_date: formData.startDate,
          end_date: formData.endDate,
          status: 'draft',
          is_current: false,
        },
        actorUserId: user?.id,
      });
      toast.success(`Term "${formData.name.trim()}" created successfully.`);
      setIsCreateOpen(false);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleUpdateTermSubmit = async (formData: TermFormData) => {
    if (!editingTerm) return;
    try {
      await updateMutation.mutateAsync({
        id: editingTerm.id,
        payload: {
          name: formData.name.trim(),
          start_date: formData.startDate,
          end_date: formData.endDate,
          status: formData.status,
        },
        actorUserId: user?.id,
      });
      toast.success(`Updated term details for "${formData.name}".`);
      setEditingTerm(null);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleConfirmActivate = async (termId: string) => {
    if (!organizationId) return;
    try {
      await activateMutation.mutateAsync({
        termId,
        organizationId,
        actorUserId: user?.id,
      });
      toast.success('Term activated as current organizational period.');
      setActivatingTerm(null);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleConfirmClose = async (params: CloseTermParams, actorUserName?: string) => {
    if (!organizationId) return;
    try {
      await closeTermMutation.mutateAsync({
        params,
        actorUserName: actorUserName || profile?.fullName || user?.email || undefined,
      });
      toast.success('Term completed and handover snapshot generated successfully.');
      setCompletingTerm(null);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleArchiveTerm = async (term: Term) => {
    if (!organizationId) return;
    try {
      await archiveMutation.mutateAsync({
        termId: term.id,
        organizationId,
        actorUserId: user?.id,
      });
      toast.success(`Term "${term.name}" has been archived.`);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  // Member assignment handlers
  const handleAddMemberSubmit = async (formData: TermMemberAssignmentFormData) => {
    if (!addingMemberToTerm) return;
    try {
      if (editingTermMember) {
        await updateMemberMutation.mutateAsync({
          id: editingTermMember.id,
          payload: {
            position: formData.position?.trim() || null,
            department: formData.department?.trim() || null,
            status: formData.status,
            notes: formData.notes?.trim() || null,
          },
          actorUserId: user?.id,
          organizationId,
        });
        toast.success('Member assignment updated successfully.');
      } else {
        await addMemberMutation.mutateAsync({
          payload: {
            term_id: addingMemberToTerm.id,
            member_id: formData.memberId,
            position: formData.position?.trim() || null,
            department: formData.department?.trim() || null,
            status: formData.status,
            notes: formData.notes?.trim() || null,
          },
          actorUserId: user?.id,
          organizationId,
        });
        toast.success('Member added to term roster.');
      }
      setAddingMemberToTerm(null);
      setEditingTermMember(null);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleRemoveMember = async (termMemberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this term?`)) return;
    try {
      await removeMemberMutation.mutateAsync({
        id: termMemberId,
        termId: selectedTermForDrawer?.id || '',
        actorUserId: user?.id,
        organizationId,
      });
      toast.success(`Removed ${memberName} from term.`);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  return (
    <div id="terms-workspace-container" className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* 1. Page Header */}
      <PageHeader
        title="Terms"
        description="Manage organizational terms, membership assignments, operational activity and lifecycle status."
        breadcrumbs={[
          { label: 'System & Tools' },
          { label: 'Terms' },
        ]}
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchTerms()}
              disabled={isFetchingTerms}
              title="Làm mới danh sách nhiệm kỳ"
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs text-slate-700 bg-white border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 sm:mr-1.5 shrink-0 ${isFetchingTerms ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>

            {canManage && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                title="Tạo nhiệm kỳ mới"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 sm:h-9 px-2.5 sm:px-4 font-medium shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Tạo nhiệm kỳ</span>
              </Button>
            )}
          </div>
        }
      />

      {/* 2. Current Term Hero */}
      <TermHero
        currentTerm={currentActiveTerm}
        hasTerms={terms.length > 0}
        termStats={currentTermHeroStats}
        onOpenDetail={(term) => setSelectedTermForDrawer(term)}
        onTransfer={(term) => setTransferringTerm(term)}
        onComplete={(term) => setCompletingTerm(term)}
        onEdit={(term) => setEditingTerm(term)}
        onActivateFirstAvailable={() => {
          const firstCandidate = terms.find((t) => t.status === 'active' || t.status === 'draft') || terms[0];
          if (firstCandidate) setActivatingTerm(firstCandidate);
        }}
        canManage={canManage}
      />

      {/* 3. Operational Metric Summary Strip */}
      <TermMetricStrip
        terms={terms}
        currentTerm={currentActiveTerm}
        totalMembersAssigned={totalAssignedMembers}
        totalActivitiesCount={totalActivitiesCount}
      />

      {/* 4. Term Lifecycle Timeline */}
      <TermTimeline
        terms={terms}
        currentTermId={currentActiveTerm?.id}
        onSelectTerm={(term) => setSelectedTermForDrawer(term)}
        activitiesCountMap={activitiesCountMap}
      />

      {/* 5. Operational Signals */}
      <TermOperationalSignals
        terms={terms}
        currentTerm={currentActiveTerm}
        onActivateTerm={(term) => setActivatingTerm(term)}
        onCompleteTerm={(term) => setCompletingTerm(term)}
      />

      {/* 6. Filter & Search Toolbar */}
      <TermToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortOption={sortOption}
        onSortOptionChange={setSortOption}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        totalResultsCount={filteredTerms.length}
      />

      {/* 7. Main View: Table / Grid / Comparison */}
      {isLoadingTerms ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">Loading organizational terms...</p>
        </div>
      ) : termsError ? (
        <QueryErrorState
          title="Failed to load terms"
          error={termsError}
          onRetry={() => refetchTerms()}
        />
      ) : filteredTerms.length === 0 ? (
        <EmptyState
          icon={<CalendarRange className="h-7 w-7 text-emerald-600" />}
          title={
            hasActiveFilters
              ? 'No matching terms found'
              : 'No terms configured for this organization'
          }
          description={
            hasActiveFilters
              ? 'Try adjusting your search criteria or resetting the status filters.'
              : 'Create your first organizational term to manage member roster assignments, activities, and financial cycles.'
          }
          actionLabel={!hasActiveFilters && canManage ? 'Create First Term' : undefined}
          actionIcon={<Plus className="h-4 w-4" />}
          onAction={() => setIsCreateOpen(true)}
        />
      ) : viewMode === 'table' ? (
        <TermTable
          terms={filteredTerms}
          currentTermId={currentActiveTerm?.id}
          onOpenDetail={(term) => setSelectedTermForDrawer(term)}
          onActivate={(term) => setActivatingTerm(term)}
          onTransfer={(term) => setTransferringTerm(term)}
          onComplete={(term) => setCompletingTerm(term)}
          onArchive={handleArchiveTerm}
          onEdit={(term) => setEditingTerm(term)}
          onViewSnapshot={(term) => setViewingSnapshotTerm(term)}
          activitiesCountMap={activitiesCountMap}
          tasksCountMap={tasksCountMap}
          financeBalanceMap={financeBalanceMap}
          canManage={canManage}
        />
      ) : viewMode === 'cards' ? (
        <TermCardsGrid
          terms={filteredTerms}
          currentTermId={currentActiveTerm?.id}
          onOpenDetail={(term) => setSelectedTermForDrawer(term)}
          onActivate={(term) => setActivatingTerm(term)}
          onTransfer={(term) => setTransferringTerm(term)}
          onComplete={(term) => setCompletingTerm(term)}
          onArchive={handleArchiveTerm}
          onEdit={(term) => setEditingTerm(term)}
          onViewSnapshot={(term) => setViewingSnapshotTerm(term)}
          activitiesCountMap={activitiesCountMap}
          tasksCountMap={tasksCountMap}
          financeBalanceMap={financeBalanceMap}
          canManage={canManage}
        />
      ) : (
        <TermComparison
          terms={filteredTerms}
          currentTermId={currentActiveTerm?.id}
          activitiesCountMap={activitiesCountMap}
          tasksCountMap={tasksCountMap}
          financeBalanceMap={financeBalanceMap}
          onSelectTerm={(term) => setSelectedTermForDrawer(term)}
        />
      )}

      {/* 8. Slide-Over Detail Drawer */}
      <TermDetailDrawer
        open={Boolean(selectedTermForDrawer)}
        onClose={() => setSelectedTermForDrawer(null)}
        term={selectedTermForDrawer}
        currentTermId={currentActiveTerm?.id}
        onActivateTerm={(term) => {
          setSelectedTermForDrawer(null);
          setActivatingTerm(term);
        }}
        onTransferMembers={(term) => {
          setSelectedTermForDrawer(null);
          setTransferringTerm(term);
        }}
        onCompleteTerm={(term) => {
          setSelectedTermForDrawer(null);
          setCompletingTerm(term);
        }}
        onEditTerm={(term) => {
          setSelectedTermForDrawer(null);
          setEditingTerm(term);
        }}
        onAddMember={(term) => {
          setEditingTermMember(null);
          setAddingMemberToTerm(term);
        }}
        onEditMember={(member) => {
          if (selectedTermForDrawer) {
            setAddingMemberToTerm(selectedTermForDrawer);
            setEditingTermMember(member);
          }
        }}
        onRemoveMember={handleRemoveMember}
        activitiesCount={
          selectedTermForDrawer ? activitiesCountMap[selectedTermForDrawer.id] ?? 0 : 0
        }
        tasksCount={
          selectedTermForDrawer ? tasksCountMap[selectedTermForDrawer.id] ?? 0 : 0
        }
        financeBalance={
          selectedTermForDrawer ? financeBalanceMap[selectedTermForDrawer.id] : undefined
        }
        canManage={canManage}
      />

      {/* 9. Dialogs */}
      {/* Create Term Dialog */}
      <TermFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateTermSubmit}
        isLoading={createMutation.isPending}
      />

      {/* Edit Term Dialog */}
      <TermFormDialog
        open={Boolean(editingTerm)}
        onOpenChange={(open) => !open && setEditingTerm(null)}
        onSubmit={handleUpdateTermSubmit}
        initialData={editingTerm}
        isLoading={updateMutation.isPending}
      />

      {/* Activate Term Dialog */}
      <ActivateTermDialog
        open={Boolean(activatingTerm)}
        onOpenChange={(open) => !open && setActivatingTerm(null)}
        term={activatingTerm}
        currentActiveTerm={currentActiveTerm}
        onConfirm={handleConfirmActivate}
        isLoading={activateMutation.isPending}
      />

      {/* Complete Term Dialog (5-Point Checklist & Snapshot) */}
      <CompleteTermDialog
        open={Boolean(completingTerm)}
        onOpenChange={(open) => !open && setCompletingTerm(null)}
        term={completingTerm}
        organizationId={organizationId}
        currentUserId={user?.id}
        currentUserName={profile?.fullName || user?.email || undefined}
        onConfirmClose={handleConfirmClose}
        isLoading={closeTermMutation.isPending}
      />

      {/* Transfer Term Members Dialog */}
      <TransferTermMembersDialog
        open={Boolean(transferringTerm)}
        onOpenChange={(open) => !open && setTransferringTerm(null)}
        sourceTerm={transferringTerm}
        organizationId={organizationId}
        currentUserId={user?.id}
        onSuccess={(transferred, skipped) => {
          toast.success(
            `Transferred ${transferred} member(s) successfully${
              skipped > 0 ? ` (${skipped} already assigned)` : ''
            }.`
          );
        }}
      />

      {/* Closing Snapshot Modal */}
      <TermClosingSnapshotModal
        open={Boolean(viewingSnapshotTerm)}
        onOpenChange={(open) => !open && setViewingSnapshotTerm(null)}
        term={viewingSnapshotTerm}
      />

      {/* Add / Edit Member Assignment Dialog */}
      {addingMemberToTerm && (
        <AddTermMemberDialog
          open={Boolean(addingMemberToTerm)}
          onOpenChange={(open) => {
            if (!open) {
              setAddingMemberToTerm(null);
              setEditingTermMember(null);
            }
          }}
          onSubmit={handleAddMemberSubmit}
          termId={addingMemberToTerm.id}
          termName={addingMemberToTerm.name}
          organizationId={organizationId}
          initialData={editingTermMember}
          isLoading={addMemberMutation.isPending || updateMemberMutation.isPending}
        />
      )}
    </div>
  );
}
