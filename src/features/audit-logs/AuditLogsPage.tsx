import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCurrentOrg } from '@/features/auth/hooks/useCurrentOrg';
import { useAuditLogs } from './queries/audit-log.queries';
import { AuditLogSummaryCards } from './components/AuditLogSummaryCards';
import { AuditLogFilterBar } from './components/AuditLogFilterBar';
import { AuditLogTable } from './components/AuditLogTable';
import { AuditLogDetailModal } from './components/AuditLogDetailModal';
import { QueryErrorState } from '@/components/common/QueryErrorState';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import {
  RotateCcw,
  ShieldAlert,
  Building2,
  Lock,
  ShieldCheck,
  Download,
} from 'lucide-react';
import type {
  AuditLogFilterParams,
  AuditLogItemWithActor,
} from './types/audit-log.types';
import { exportAuditLogsToCSV } from './utils/audit-log-formatter';

export function AuditLogsPage() {
  const { currentOrg, role, isAdmin } = useCurrentOrg();

  // RBAC Permission: Only admin, leader, and deputy are permitted to access audit logs
  const isAuthorized = isAdmin || role === 'leader' || role === 'deputy';

  const [filters, setFilters] = useState<AuditLogFilterParams>({
    module: 'all',
    action: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    pageSize: 20,
  });

  const [selectedLog, setSelectedLog] = useState<AuditLogItemWithActor | null>(null);

  const {
    data: result,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAuditLogs(currentOrg?.id, filters, role, { enabled: isAuthorized });

  const handleFilterChange = (newFilters: Partial<AuditLogFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      module: 'all',
      action: 'all',
      search: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      pageSize: filters.pageSize || 20,
    });
  };

  const handleExportCSV = () => {
    if (!result?.data || result.data.length === 0) return;
    exportAuditLogsToCSV(result.data);
  };

  // 1. Unauthorized State for non-privileged roles
  if (!isAuthorized) {
    return (
      <div id="audit-logs-page" className="space-y-6">
        <PageHeader
          title="Nhật ký kiểm toán (Audit Logs)"
          description="Lịch sử truy vết thao tác và các sự kiện quan trọng trong Đơn vị."
          breadcrumbs={[
            { label: 'Cài đặt hệ thống', href: '/settings' },
            { label: 'Nhật ký kiểm toán' },
          ]}
        />

        <Card className="border-rose-200 bg-rose-50/30 max-w-2xl mx-auto my-12 shadow-2xs">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto border border-rose-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-slate-900">
                Quyền truy cập bị giới hạn
              </CardTitle>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Nhật ký kiểm toán hệ thống chứa thông tin nhạy cảm và chỉ dành riêng cho Quản trị viên (Admin), Trưởng đơn vị (Leader) và Phó đơn vị (Deputy).
              </p>
            </div>
            <div className="pt-2">
              <span className="text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-flex items-center gap-1.5 shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Vai trò hiện tại của bạn: <strong className="text-slate-800">{role || 'Thành viên'}</strong></span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. No active organization
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
            Vui lòng chọn hoặc liên kết Đơn vị để xem nhật ký hoạt động tương ứng.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="audit-logs-page" className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Nhật ký Hoạt động"
        description="Lịch sử truy vết thao tác và các sự kiện quan trọng trong Đơn vị."
        breadcrumbs={[
          { label: 'Cài đặt', href: '/settings' },
          { label: 'Nhật ký' },
        ]}
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={isLoading || !result?.data?.length}
              title="Xuất file CSV nhật ký"
              className="text-xs h-8 px-2 sm:px-2.5 bg-white hover:bg-slate-50 border-slate-200 shadow-2xs font-semibold"
            >
              <Download className="w-3.5 h-3.5 sm:mr-1.5 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">Xuất CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Làm mới nhật ký"
              className="text-xs h-8 px-2 sm:px-2.5 bg-white hover:bg-slate-50 border-slate-200 shadow-2xs font-semibold"
            >
              <RotateCcw className={`w-3.5 h-3.5 sm:mr-1.5 shrink-0 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">{isFetching ? 'Đang tải...' : 'Làm mới'}</span>
            </Button>
          </div>
        }
      />

      {/* Summary Stat Cards */}
      <AuditLogSummaryCards
        logs={result?.data || []}
        totalCount={result?.totalCount || 0}
        isLoading={isLoading}
      />

      {/* Filter Bar */}
      <AuditLogFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onExport={handleExportCSV}
        isExporting={false}
        totalCount={result?.totalCount || 0}
      />

      {/* Main Table or Loading/Error States */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
          <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <QueryErrorState
          error={error}
          title="Không thể tải nhật ký hoạt động"
          onRetry={() => refetch()}
        />
      ) : (
        <AuditLogTable
          logs={result?.data || []}
          totalCount={result?.totalCount || 0}
          currentPage={result?.page || 1}
          pageSize={result?.pageSize || 20}
          totalPages={result?.totalPages || 0}
          isLoading={isFetching}
          onPageChange={(newPage) => handleFilterChange({ page: newPage })}
          onPageSizeChange={(newSize) => handleFilterChange({ pageSize: newSize, page: 1 })}
          onSelectLog={(log) => setSelectedLog(log)}
        />
      )}

      {/* Detail Inspector Modal */}
      <AuditLogDetailModal
        log={selectedLog}
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
