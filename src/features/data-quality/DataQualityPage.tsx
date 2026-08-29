import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentOrg } from '@/features/auth/hooks/useCurrentOrg';
import {
  useDataQualityOverview,
  dataQualityKeys,
} from './queries';
import { DataQualityHero } from './components/DataQualityHero';
import { DataQualityKpiGrid } from './components/DataQualityKpiGrid';
import { DataQualityIssueList } from './components/DataQualityIssueList';
import { DataQualityCategoryChart } from './components/DataQualityCategoryChart';
import { DataQualityRecentScans } from './components/DataQualityRecentScans';
import { DataQualityQuickActions } from './components/DataQualityQuickActions';
import { DataQualityIssueDetailDialog } from './components/DataQualityIssueDetailDialog';
import { DataQualitySkeleton } from './components/DataQualitySkeleton';
import { QueryErrorState } from '@/components/common/QueryErrorState';
import { useToast } from '@/contexts/ToastContext';
import type {
  DataQualityCategory,
  DataQualitySeverity,
  DataQualityIssue,
} from './types';

export function DataQualityPage() {
  const queryClient = useQueryClient();
  const { currentOrg, role, isLoading: isOrgLoading } = useCurrentOrg();
  const { success, error: toastError } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<DataQualityCategory | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<DataQualitySeverity | 'all'>('all');
  const [activeDetailIssue, setActiveDetailIssue] = useState<DataQualityIssue | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Fetch complete Data Quality Overview
  const {
    data: overview,
    isLoading: isOverviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useDataQualityOverview(currentOrg?.id);

  // Trigger manual rescan of data quality
  const handleRescan = useCallback(async () => {
    if (!currentOrg?.id || isScanning) return;

    setIsScanning(true);
    try {
      // Invalidate queries so fresh data is fetched from checkers
      await queryClient.invalidateQueries({
        queryKey: dataQualityKeys.all(currentOrg.id),
      });
      await refetchOverview();
      success('Đã cập nhật tình trạng chất lượng dữ liệu mới nhất.', 'Quét dữ liệu hoàn tất');
    } catch (err) {
      console.error('[DataQualityPage] Rescan failed:', err);
      toastError(err, 'Quét dữ liệu thất bại');
    } finally {
      setIsScanning(false);
    }
  }, [currentOrg?.id, isScanning, queryClient, refetchOverview, success, toastError]);

  const handleViewIssueDetails = useCallback((issue: DataQualityIssue) => {
    setActiveDetailIssue(issue);
    setIsDetailOpen(true);
  }, []);

  if (isOrgLoading || isOverviewLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <DataQualitySkeleton />
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <QueryErrorState
          title="Không thể tải dữ liệu kiểm soát chất lượng"
          error={overviewError}
          onRetry={() => refetchOverview()}
        />
      </div>
    );
  }

  const summary = overview?.summary;
  const issues = overview?.recentIssues ?? [];
  const totalIssues = summary?.totalIssues ?? issues.length;
  const criticalCount = summary?.criticalCount ?? 0;
  const warningCount = summary?.warningCount ?? 0;
  const infoCount = summary?.infoCount ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Hero Section */}
      <DataQualityHero
        organizationName={currentOrg?.name || 'Chi hội'}
        userRole={role || undefined}
        qualityScore={summary?.qualityScore ?? null}
        totalIssues={totalIssues}
        criticalCount={criticalCount}
        warningCount={warningCount}
        evaluatedAt={overview?.evaluatedAt}
        isScanning={isScanning}
        onRescan={handleRescan}
      />

      {/* 2. 4 Metric / KPI Cards */}
      <DataQualityKpiGrid
        totalIssues={totalIssues}
        criticalCount={criticalCount}
        warningCount={warningCount}
        infoCount={infoCount}
        selectedSeverity={selectedSeverity}
        onSelectSeverity={setSelectedSeverity}
      />

      {/* 3. Main Split View: Left (Issue Center) | Right (Category Distribution & Checkers) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Left 2 Columns: Issue Center */}
        <div className="lg:col-span-2 space-y-6">
          <DataQualityIssueList
            issues={issues}
            summary={summary}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedSeverity={selectedSeverity}
            onSelectSeverity={setSelectedSeverity}
            onViewIssueDetails={handleViewIssueDetails}
          />
        </div>

        {/* Right 1 Column: Charts, Checkers & Shortcuts */}
        <div className="space-y-6">
          {/* Category Distribution Chart */}
          <DataQualityCategoryChart
            summary={summary}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Automated Check Engines Status */}
          <DataQualityRecentScans
            summary={summary}
            evaluatedAt={overview?.evaluatedAt}
          />

          {/* Quick Shortcuts */}
          <DataQualityQuickActions />
        </div>
      </div>

      {/* 4. Issue Inspection Dialog / Modal */}
      <DataQualityIssueDetailDialog
        issue={activeDetailIssue}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
