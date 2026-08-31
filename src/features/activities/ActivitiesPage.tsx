import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCurrentOrg } from '@/features/auth/hooks/useCurrentOrg';
import { useToast } from '@/contexts/ToastContext';
import {
  useActivitiesList,
  useActivityTerms,
  useActivityLeadCandidates,
} from '@/features/activities/queries/activity.queries';
import {
  useCreateActivity,
  useUpdateActivity,
} from '@/features/activities/mutations/activity.mutations';
import { ActivityCard } from '@/features/activities/components/ActivityCard';
import { ActivityTable } from '@/features/activities/components/ActivityTable';
import { ActivityCalendarView } from '@/features/activities/components/ActivityCalendarView';
import {
  ActivityFilterBar,
  type ActivityViewMode,
} from '@/features/activities/components/ActivityFilterBar';
import {
  ActivityStatusNav,
  type ActivityStatusCount,
} from '@/features/activities/components/ActivityStatusNav';
import { ActivityStatsSummary } from '@/features/activities/components/ActivityStatsSummary';
import {
  ActivityTableSkeleton,
  ActivityCardSkeleton,
  ActivityCalendarSkeleton,
} from '@/features/activities/components/ActivitySkeleton';
import { ActivityFormDialog } from '@/features/activities/components/ActivityFormDialog';
import { QueryErrorState } from '@/components/common/QueryErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { GoogleSheetsExportModal } from '@/integrations/google/sheets/components/GoogleSheetsExportModal';
import { GoogleSheetsImportWizardModal } from '@/integrations/google/sheets/components/GoogleSheetsImportWizardModal';
import type {
  ActivityFilterParams,
  ActivityListItem,
} from '@/features/activities/types/activity.types';
import type { ActivityStatus } from '@/types';
import type { ActivityFormData } from '@/features/activities/schemas/activity.schema';

export function ActivitiesPage() {
  const { currentOrg, isBoard, isAdmin } = useCurrentOrg();
  const toast = useToast();
  const canManage = isBoard || isAdmin;

  // Filters State
  const [filters, setFilters] = useState<ActivityFilterParams>({
    search: '',
    status: 'all',
    category: 'all',
    termId: 'all',
    page: 1,
    pageSize: 12,
    sortBy: 'start_date',
    sortOrder: 'desc',
  });

  // View Mode: 'table' | 'cards' | 'calendar'
  const [viewMode, setViewMode] = useState<ActivityViewMode>('table');

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityListItem | null>(null);
  const [sheetsExportOpen, setSheetsExportOpen] = useState(false);
  const [sheetsImportOpen, setSheetsImportOpen] = useState(false);

  // Fetch Activities List
  const {
    data: activitiesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useActivitiesList(currentOrg?.id, filters);

  const { data: terms = [] } = useActivityTerms(currentOrg?.id);
  const { data: leadCandidates = [] } = useActivityLeadCandidates(currentOrg?.id);

  // Mutations
  const createMutation = useCreateActivity(currentOrg?.id);
  const updateMutation = useUpdateActivity(editingActivity?.id || '', currentOrg?.id);

  const activities = activitiesData?.data || [];
  const totalCount = activitiesData?.totalCount || 0;
  const totalPages = activitiesData?.totalPages || 1;
  const currentPage = filters.page || 1;

  // Compute status counts for status navigation
  const statusCounts: ActivityStatusCount = {
    all: totalCount,
    planning: activities.filter((a) => a.status === 'planning').length,
    published: activities.filter((a) => a.status === 'published').length,
    in_progress: activities.filter((a) => a.status === 'in_progress').length,
    completed: activities.filter((a) => a.status === 'completed').length,
    cancelled: activities.filter((a) => a.status === 'cancelled').length,
  };

  const handleFilterChange = (newFilters: Partial<ActivityFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSelectStatus = (status: ActivityStatus | 'all') => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      category: 'all',
      termId: 'all',
      startDateFrom: undefined,
      startDateTo: undefined,
      page: 1,
      pageSize: 12,
      sortBy: 'start_date',
      sortOrder: 'desc',
    });
  };

  const handleOpenCreate = () => {
    setEditingActivity(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (activity: ActivityListItem) => {
    setEditingActivity(activity);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: ActivityFormData) => {
    try {
      if (editingActivity) {
        await updateMutation.mutateAsync(formData);
        toast.success(`Updated activity "${formData.title}".`);
      } else {
        await createMutation.mutateAsync(formData);
        toast.success(`Created new activity "${formData.title}".`);
      }
      setIsFormOpen(false);
      setEditingActivity(null);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Activities
            </h1>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full font-mono border border-slate-200">
              {totalCount}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage chapter activities, participants and execution.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
          {/* Export Sheets */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            id="activity-export-sheets-header-btn"
            onClick={() => setSheetsExportOpen(true)}
            title="Xuất Google Sheets"
            className="h-8 px-2 sm:px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 sm:mr-1 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Xuất Sheets</span>
          </Button>

          {/* Import Sheets (Board only) */}
          {canManage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              id="activity-import-sheets-header-btn"
              onClick={() => setSheetsImportOpen(true)}
              title="Nhập Google Sheets"
              className="h-8 px-2 sm:px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 sm:mr-1 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Nhập Sheets</span>
            </Button>
          )}

          {/* Primary Create Button (Board only) */}
          {canManage && (
            <Button
              type="button"
              size="sm"
              id="create-new-activity-btn"
              onClick={handleOpenCreate}
              title="Tạo hoạt động mới"
              className="h-8 px-2.5 sm:px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Tạo hoạt động</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Compact Operational Metrics Row */}
      <ActivityStatsSummary
        activities={activities}
        totalCount={totalCount}
        currentStatusFilter={filters.status}
        onSelectStatus={handleSelectStatus}
      />

      {/* 3. Status Navigation */}
      <ActivityStatusNav
        currentStatus={filters.status || 'all'}
        onSelectStatus={handleSelectStatus}
        counts={statusCounts}
      />

      {/* 4. Toolbar & FilterBar */}
      <ActivityFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        terms={terms}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        canManage={canManage}
        isLoading={isLoading}
      />

      {/* 5. Main Content Area */}
      {isLoading ? (
        viewMode === 'table' ? (
          <ActivityTableSkeleton />
        ) : viewMode === 'cards' ? (
          <ActivityCardSkeleton />
        ) : (
          <ActivityCalendarSkeleton />
        )
      ) : isError ? (
        <QueryErrorState
          title="Could not load activities data"
          error={error}
          onRetry={() => refetch()}
        />
      ) : activities.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-7 h-7 text-emerald-600" />}
          title="No activities found"
          description={
            filters.search || filters.status !== 'all' || filters.category !== 'all'
              ? 'No activities match the selected filter criteria. Try resetting filters.'
              : 'There are no activities recorded for this term. Start by creating the first activity!'
          }
          actionLabel={canManage ? 'Create Activity' : undefined}
          actionIcon={<Plus className="w-4 h-4" />}
          onAction={handleOpenCreate}
        />
      ) : viewMode === 'table' ? (
        /* Table View */
        <ActivityTable
          activities={activities}
          canManage={canManage}
          onEdit={handleOpenEdit}
        />
      ) : viewMode === 'cards' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              canEdit={canManage}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      ) : (
        /* Calendar View */
        <ActivityCalendarView activities={activities} />
      )}

      {/* 6. Pagination Bar */}
      {totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-between bg-white px-4 py-2.5 border border-slate-200/90 rounded-xl text-xs text-slate-600 shadow-2xs">
          <div>
            Showing page <strong className="text-slate-900">{currentPage}</strong> of{' '}
            <strong className="text-slate-900">{totalPages}</strong> ({totalCount} total activities)
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="activity-prev-page-btn"
              disabled={currentPage <= 1}
              onClick={() => handleFilterChange({ page: currentPage - 1 })}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="activity-next-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => handleFilterChange({ page: currentPage + 1 })}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 7. Dialogs & Modals */}
      <ActivityFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingActivity(null);
        }}
        onSubmit={handleFormSubmit}
        activityToEdit={editingActivity}
        terms={terms}
        leadCandidates={leadCandidates}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <GoogleSheetsExportModal
        open={sheetsExportOpen}
        onOpenChange={setSheetsExportOpen}
        module="activities"
        termId={filters.termId !== 'all' ? filters.termId : undefined}
        customFilters={filters as unknown as Record<string, unknown>}
      />

      <GoogleSheetsImportWizardModal
        open={sheetsImportOpen}
        onOpenChange={setSheetsImportOpen}
        module="activities"
        termId={filters.termId !== 'all' ? filters.termId : undefined}
      />
    </div>
  );
}

export default ActivitiesPage;
