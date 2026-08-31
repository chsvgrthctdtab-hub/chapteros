import { useState } from 'react';
import { useCurrentOrg } from '@/features/auth/hooks/useCurrentOrg';
import { useTermsList } from '@/features/terms/queries/term.queries';
import { useQueryClient } from '@tanstack/react-query';
import {
  reportKeys,
  useReportOverview,
  useReportActivityStats,
  useReportMemberStats,
  useReportTaskStats,
  useReportFundStats,
  useReportTermStats,
} from './reports.queries';
import type { ReportFilterParams } from '@/types/report';
import { ReportControlBar, type ReportScope } from './components/ReportControlBar';
import { ReportExportDropdown } from './components/ReportExportDropdown';
import { ExecutiveSummaryStrip } from './components/ExecutiveSummaryStrip';
import { OverviewReport } from './components/OverviewReport';
import { MemberReport } from './components/MemberReport';
import { TermReport } from './components/TermReport';
import { ActivityReport } from './components/ActivityReport';
import { TaskReport } from './components/TaskReport';
import { FundReport } from './components/FundReport';
import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCw, AlertCircle, Sparkles, Building2 } from 'lucide-react';

export function ReportsPage() {
  const queryClient = useQueryClient();
  const { currentOrg, isLoading: isOrgLoading } = useCurrentOrg();

  const [activeScope, setActiveScope] = useState<ReportScope>('overview');
  const [filterParams, setFilterParams] = useState<ReportFilterParams>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch terms list for the active organization
  const {
    data: terms = [],
    isLoading: isTermsLoading,
  } = useTermsList(currentOrg?.id);

  // Fetch live overview metrics for the executive header & export
  const {
    data: overview,
    isLoading: isOverviewLoading,
  } = useReportOverview(currentOrg?.id, filterParams.termId);

  // Fetch respective stats for exports
  const { data: activityStats } = useReportActivityStats(currentOrg?.id, filterParams);
  const { data: memberStats } = useReportMemberStats(currentOrg?.id, filterParams.termId);
  const { data: taskStats } = useReportTaskStats(currentOrg?.id, filterParams);
  const { data: fundStats } = useReportFundStats(currentOrg?.id, filterParams);
  const { data: termStats } = useReportTermStats(currentOrg?.id);

  // Find active term name
  const currentTermObj = terms.find((t) => t.id === filterParams.termId);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!currentOrg?.id) return;
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: reportKeys.all,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // If no organization is selected yet
  if (!isOrgLoading && !currentOrg) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center space-y-3" id="reports-page-empty">
        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
        <h2 className="text-base font-bold text-amber-900">Vui lòng chọn Đơn vị</h2>
        <p className="text-sm text-amber-700 max-w-md mx-auto">
          Bạn cần chọn một Đơn vị đang quản lý để xem báo cáo và số liệu thống kê.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 print:p-0" id="reports-page">
      {/* 1. Executive Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Báo cáo & Thống kê
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Tổng hợp dữ liệu hiệu suất hoạt động, quản trị nhân sự và tài chính của Đơn vị.
          </p>
        </div>

        {/* Executive Action Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-start md:self-auto print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-2 sm:px-2.5 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-2xs"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:mr-1.5 shrink-0 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
          </Button>

          <ReportExportDropdown
            orgName={currentOrg?.name}
            termName={currentTermObj?.name}
            overview={overview}
            activityStats={activityStats}
            memberStats={memberStats}
            taskStats={taskStats}
            fundStats={fundStats}
            termStats={termStats}
            activeScope={activeScope}
          />
        </div>
      </div>

      {/* 2. Global Report Filter and Scope Switcher */}
      <ReportControlBar
        terms={terms}
        isTermsLoading={isTermsLoading}
        filterParams={filterParams}
        onFilterChange={setFilterParams}
        activeScope={activeScope}
        onScopeChange={setActiveScope}
      />

      {/* 3. Top-Level Executive KPI Summary Strip */}
      <ExecutiveSummaryStrip
        overview={overview}
        isLoading={isOverviewLoading}
      />

      {/* 4. Active Scope Content View */}
      <div className="pt-1">
        {activeScope === 'overview' && (
          <OverviewReport
            organizationId={currentOrg?.id}
            filterParams={filterParams}
          />
        )}

        {activeScope === 'activities' && (
          <ActivityReport
            organizationId={currentOrg?.id}
            filterParams={filterParams}
          />
        )}

        {activeScope === 'members' && (
          <MemberReport
            organizationId={currentOrg?.id}
            termId={filterParams.termId}
          />
        )}

        {activeScope === 'tasks' && (
          <TaskReport
            organizationId={currentOrg?.id}
            filterParams={filterParams}
          />
        )}

        {activeScope === 'finance' && (
          <FundReport
            organizationId={currentOrg?.id}
            filterParams={filterParams}
          />
        )}

        {activeScope === 'terms' && (
          <TermReport organizationId={currentOrg?.id} />
        )}
      </div>
    </div>
  );
}
