import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentOrg } from '@/features/auth/hooks/useCurrentOrg';
import {
  dashboardKeys,
  useDashboardTerms,
  useDashboardStats,
  useUpcomingActivities,
  useUpcomingTasks,
  useOverdueTasks,
  useDashboardCharts,
} from './queries/dashboard.queries';
import { useGoogleIntegrationOverview } from '@/features/integrations/queries/google.queries';
import { DashboardHeader } from './components/DashboardHeader';
import { KpiCardsSection } from './components/KpiCardsSection';
import { AlertCenter } from './components/AlertCenter';
import { UpcomingActivitiesSection } from './components/UpcomingActivitiesSection';
import { UpcomingTasksSection } from './components/UpcomingTasksSection';
import { DashboardCalendarPreview } from './components/DashboardCalendarPreview';
import { FinanceSummaryCard } from './components/FinanceSummaryCard';
import { WorkProgressCard } from './components/WorkProgressCard';
import { DashboardChartsSection } from './components/DashboardChartsSection';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { DashboardErrorState } from './components/DashboardErrorState';
import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { currentOrg, role, isBoard, isAdmin, isTreasurer, profile, user, isLoading: isOrgLoading } = useCurrentOrg();

  const [selectedTermId, setSelectedTermId] = useState<string>('all');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // 1. Fetch Terms for Active Organization
  const {
    data: terms = [],
    isLoading: isTermsLoading,
    error: termsError,
    refetch: refetchTerms,
  } = useDashboardTerms(currentOrg?.id);

  // Automatically default to the Active Term in database if available
  useEffect(() => {
    if (terms && terms.length > 0 && selectedTermId === 'all') {
      const activeTerm = terms.find((t) => t.isCurrent);
      if (activeTerm) {
        setSelectedTermId(activeTerm.id);
      }
    }
  }, [terms, selectedTermId]);

  // 2. Fetch Dashboard Metrics & Aggregations
  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDashboardStats(currentOrg?.id, selectedTermId);

  // 3. Fetch Upcoming Activities
  const {
    data: upcomingActivities = [],
    isLoading: isActivitiesLoading,
    error: activitiesError,
    refetch: refetchActivities,
  } = useUpcomingActivities(currentOrg?.id, selectedTermId, 6);

  // 4. Fetch Upcoming Tasks
  const {
    data: upcomingTasks = [],
    isLoading: isTasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useUpcomingTasks(currentOrg?.id, selectedTermId, 6);

  // 5. Fetch Overdue Tasks
  const {
    data: overdueTasks = [],
    isLoading: isOverdueLoading,
    error: overdueError,
    refetch: refetchOverdue,
  } = useOverdueTasks(currentOrg?.id, selectedTermId, 5);

  // 6. Fetch Chart Distributions
  const {
    data: chartData,
    isLoading: isChartsLoading,
    error: chartsError,
    refetch: refetchCharts,
  } = useDashboardCharts(currentOrg?.id, selectedTermId);

  // 7. Fetch Google Integration overview for sync alerts
  const { data: googleOverview } = useGoogleIntegrationOverview(
    currentOrg?.id || null,
    user?.id || null
  );

  const hasGoogleSyncError =
    googleOverview?.userConnection?.status === 'error' ||
    googleOverview?.orgConnection?.status === 'error';

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        refetchTerms(),
        refetchStats(),
        refetchActivities(),
        refetchTasks(),
        refetchOverdue(),
        refetchCharts(),
      ]);
    } finally {
      setIsManualRefreshing(false);
    }
  };

  // Permissions
  const canManageMembers = isAdmin || isBoard;
  const canManageActivities = isAdmin || isBoard;
  const canManageTasks = isAdmin || isBoard;
  const canManageFinance = isBoard;
  const canManageDocuments = isAdmin || isBoard;

  const displayName =
    (profile as any)?.fullName ||
    (profile as any)?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Ban Chấp Hành';

  // Initial Organization Loading state
  if (isOrgLoading || isTermsLoading) {
    return <DashboardSkeleton />;
  }

  // No active organization selected or membership found
  if (!currentOrg) {
    return (
      <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Chưa chọn Đơn vị hoạt động
          </h3>
          <p className="text-xs text-slate-500">
            Tài khoản của bạn chưa được liên kết hoặc chưa chọn Chi hội quản lý. Vui lòng chuyển đổi hoặc liên kết Chi hội trong mục Cài đặt.
          </p>
        </div>
        <Link to="/chapters">
          <Button size="sm" className="text-xs cursor-pointer">
            Chọn Chi hội
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div id="dashboard-page" className="space-y-5 sm:space-y-6 pb-8">
      {/* 1. Header with Greeting, Org info, Term selector & Role Quick Actions */}
      <DashboardHeader
        userName={displayName}
        organizationName={currentOrg.name}
        userRole={role}
        terms={terms}
        selectedTermId={selectedTermId}
        onSelectTerm={setSelectedTermId}
        onRefresh={handleRefresh}
        isRefreshing={isManualRefreshing}
        canManageMembers={canManageMembers}
        canManageActivities={canManageActivities}
        canManageTasks={canManageTasks}
        canManageFinance={canManageFinance}
        canManageDocuments={canManageDocuments}
      />

      {/* TẦNG 1: Executive / KPI Summary & Attention Alerts */}
      {isStatsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : statsError || !stats ? (
        <DashboardErrorState
          title="Không thể tổng hợp số liệu KPI"
          onRetry={refetchStats}
        />
      ) : (
        <KpiCardsSection stats={stats} selectedTermId={selectedTermId} />
      )}

      {/* Alert Center (Cần chú ý) */}
      {stats && (
        <AlertCenter
          stats={stats}
          upcomingActivities={upcomingActivities}
          terms={terms}
          hasGoogleSyncError={hasGoogleSyncError}
        />
      )}

      {/* TẦNG 2: Operational Priority (Upcoming Activities & Task Center) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
        {/* Upcoming Activities */}
        {isActivitiesLoading ? (
          <div className="h-60 rounded-xl bg-slate-100 animate-pulse" />
        ) : activitiesError ? (
          <DashboardErrorState
            title="Lỗi tải hoạt động sắp tới"
            onRetry={refetchActivities}
          />
        ) : (
          <UpcomingActivitiesSection
            activities={upcomingActivities}
            canCreateActivity={canManageActivities}
          />
        )}

        {/* Task Center */}
        {isTasksLoading ? (
          <div className="h-60 rounded-xl bg-slate-100 animate-pulse" />
        ) : tasksError ? (
          <DashboardErrorState
            title="Lỗi tải công việc cần xử lý"
            onRetry={refetchTasks}
          />
        ) : (
          <UpcomingTasksSection
            tasks={upcomingTasks}
            canCreateTask={canManageTasks}
          />
        )}
      </div>

      {/* TẦNG 3: Daily Operations, Treasury Balance & Work Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Calendar / Daily Operations */}
        <div className="lg:col-span-5 xl:col-span-5">
          <DashboardCalendarPreview activities={upcomingActivities} />
        </div>

        {/* Finance Overview & Work Progress */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-5 sm:space-y-6">
          {/* Finance Snapshot */}
          {isStatsLoading ? (
            <div className="h-48 rounded-xl bg-slate-100 animate-pulse" />
          ) : stats ? (
            <FinanceSummaryCard finance={stats.finance} />
          ) : null}

          {/* Work Progress Bar */}
          {isStatsLoading ? (
            <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />
          ) : stats ? (
            <WorkProgressCard tasks={stats.tasks} />
          ) : null}
        </div>
      </div>

      {/* TẦNG 4: Financial Trend & Task Status / Analytics */}
      {isChartsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <div className="h-68 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-68 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      ) : chartsError || !chartData ? (
        <DashboardErrorState
          title="Không thể tải biểu đồ phân tích"
          onRetry={refetchCharts}
        />
      ) : (
        <DashboardChartsSection chartData={chartData} />
      )}
    </div>
  );
}
