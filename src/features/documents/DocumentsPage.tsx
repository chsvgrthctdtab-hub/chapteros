import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderArchive,
  Upload,
  RefreshCw,
  Plus,
  FileText,
  Building2,
  HardDrive,
  ShieldCheck,
  Link2,
  Cloud,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentOrg } from '@/features/auth/hooks/useCurrentOrg';
import { useAuth } from '@/contexts/AuthContext';
import {
  useDocuments,
  useDocumentStats,
  useDocumentTerms,
} from './queries/document.queries';
import { useOrgGoogleConnection } from '@/features/integrations/queries/google.queries';
import { DocumentStatsSummary } from './components/DocumentStatsSummary';
import { DocumentFilterBar } from './components/DocumentFilterBar';
import { GoogleDriveExplorer } from './components/GoogleDriveExplorer';
import { DocumentCard } from './components/DocumentCard';
import { DocumentTable } from './components/DocumentTable';
import { DocumentDetailDrawer } from './components/DocumentDetailDrawer';
import { DocumentEditModal } from './components/DocumentEditModal';
import { DocumentDeleteDialog } from './components/DocumentDeleteDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { QueryErrorState } from '@/components/common/QueryErrorState';
import type {
  DocumentFilterParams,
  DocumentItem,
} from './types/document.types';

export function DocumentsPage() {
  const { currentOrg, isBoard, isAdmin } = useCurrentOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const organizationId = currentOrg?.id || '';
  const canManage = isBoard || isAdmin;

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);

  // Filter state
  const [filters, setFilters] = useState<DocumentFilterParams>({
    search: '',
    sourceType: 'all',
    category: 'all',
    accessLevel: 'all',
    termId: 'all',
    linkedStatus: 'all',
    fileTypeGroup: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Queries
  const {
    data: documents = [],
    isLoading: isLoadingDocs,
    isRefetching,
    error: docsError,
    refetch,
  } = useDocuments(organizationId, filters);

  const { data: stats, isLoading: isLoadingStats } = useDocumentStats(organizationId);
  const { data: terms = [] } = useDocumentTerms(organizationId);

  const { data: orgConn } = useOrgGoogleConnection(organizationId);

  // Quick stats filter handler
  const handleQuickFilter = (filterUpdate: Partial<DocumentFilterParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...filterUpdate,
    }));
  };

  // If no organization selected
  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3 border border-slate-200">
          <Building2 className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Chưa chọn Đơn vị</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Vui lòng chọn một Đơn vị từ menu trên thanh công cụ để truy cập hồ sơ tài liệu và Google Drive.
        </p>
      </div>
    );
  }

  const isFiltering =
    Boolean(filters.search) ||
    filters.sourceType !== 'all' ||
    filters.category !== 'all' ||
    filters.accessLevel !== 'all' ||
    filters.termId !== 'all' ||
    filters.linkedStatus !== 'all' ||
    filters.fileTypeGroup !== 'all';

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80 shrink-0">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Văn bản & Tài liệu
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {currentOrg.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Quản lý hồ sơ, biểu mẫu và tự động đồng bộ trực tiếp với Google Drive chung của Đơn vị.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-10 w-10 rounded-2xl border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer shadow-2xs"
            title="Làm mới thư viện tài liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 2. Document Summary Strip */}
      <DocumentStatsSummary
        stats={stats}
        documents={documents}
        isLoading={isLoadingStats}
        activeFilter={filters}
        onFilterChange={handleQuickFilter}
      />

      {/* Google Workspace Connection Status Banner */}
      {!orgConn && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs">Đơn vị chưa kết nối tài khoản Google Workspace chung</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Vui lòng cấu hình tài khoản Google chung của Đơn vị trong phần Tích hợp để tự động đồng bộ Google Drive, Sheets, Forms và Calendar.
              </p>
            </div>
          </div>
          {canManage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/integrations')}
              className="shrink-0 bg-white border-amber-300 text-amber-900 hover:bg-amber-100/60 text-xs font-semibold rounded-xl h-8 px-3 gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>Đi đến Tích hợp Google</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {/* 3. Google Drive Workspace Explorer (Bê y chang Google Drive qua) */}
      {isLoadingDocs ? (
        <div className="space-y-3">
          <div className="h-14 bg-white border border-slate-200 rounded-3xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : docsError ? (
        <QueryErrorState
          title="Không thể tải danh sách tài liệu Google Drive"
          error={docsError}
          onRetry={() => refetch()}
        />
      ) : (
        <GoogleDriveExplorer
          organizationId={organizationId}
          documents={documents}
          canManage={canManage}
          onSelectDoc={(d) => setSelectedDoc(d)}
          onEditDoc={(d) => setEditingDoc(d)}
          onDeleteDoc={(d) => setDeletingDoc(d)}
        />
      )}

      {/* 5. Document Detail Slide-Over Drawer */}
      <DocumentDetailDrawer
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
        canManage={canManage}
        onEdit={(doc) => setEditingDoc(doc)}
        onDelete={(doc) => setDeletingDoc(doc)}
      />

      {/* 6. Modals & Dialogs */}
      <DocumentEditModal
        open={Boolean(editingDoc)}
        onOpenChange={(open) => !open && setEditingDoc(null)}
        document={editingDoc}
        organizationId={organizationId}
      />

      <DocumentDeleteDialog
        open={Boolean(deletingDoc)}
        onOpenChange={(open) => !open && setDeletingDoc(null)}
        document={deletingDoc}
        organizationId={organizationId}
      />
    </div>
  );
}

export default DocumentsPage;
