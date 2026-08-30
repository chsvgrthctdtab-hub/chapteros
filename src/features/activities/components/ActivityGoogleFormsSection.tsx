import { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Globe,
  Upload,
  User,
} from 'lucide-react';
import type { ActivityDetail } from '../types/activity.types';
import type { ActivityForm, Member } from '@/types';
import {
  useActivityForms,
  usePrimaryActivityForm,
  useFormResponses,
} from '@/integrations/google/forms/google-forms.queries';
import {
  useCreateOrLinkGoogleForm,
  useDeleteActivityForm,
  useSyncFormResponses,
  useImportFormResponsesCsv,
  useAttachGoogleSheet,
} from '@/integrations/google/forms/google-forms.mutations';
import {
  SYNC_STATUS_CONFIG,
} from '@/integrations/google/forms/google-forms.constants';
import { useToast } from '@/contexts/ToastContext';
import { formatDateTime } from '@/lib/date';
import { CreateGoogleFormDialog } from './CreateGoogleFormDialog';
import { FormResponsesViewerDialog } from './FormResponsesViewerDialog';
import type { CreateActivityFormPayload } from '@/integrations/google/forms/google-forms.types';

interface ActivityGoogleFormsSectionProps {
  activity: ActivityDetail;
  canManage?: boolean;
  members?: Member[];
}

export function ActivityGoogleFormsSection({
  activity,
  canManage = false,
  members = [],
}: ActivityGoogleFormsSectionProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isResponsesOpen, setIsResponsesOpen] = useState(false);
  const [isAttachSheetOpen, setIsAttachSheetOpen] = useState(false);
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSheetLink, setCopiedSheetLink] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Queries
  const { data: forms = [], isLoading: isLoadingForms } = useActivityForms(activity.id);
  const primaryForm = forms.find((f) => f.isPrimary) || forms[0] || null;

  const { data: responsesData, isLoading: isLoadingResponses } = useFormResponses(
    primaryForm?.id
  );
  const responses = responsesData?.data || [];

  // Mutations
  const createMutation = useCreateOrLinkGoogleForm(activity.id);
  const deleteMutation = useDeleteActivityForm(activity.id);
  const syncMutation = useSyncFormResponses(
    activity.id,
    primaryForm?.id || '',
    activity.organizationId
  );
  const attachSheetMutation = useAttachGoogleSheet(
    activity.id,
    primaryForm?.id || '',
    activity.organizationId
  );
  const importCsvMutation = useImportFormResponsesCsv(
    activity.id,
    primaryForm?.id || '',
    activity.organizationId
  );

  const handleCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !primaryForm) return;

    try {
      const text = await file.text();
      const result = await importCsvMutation.mutateAsync(text);
      toast.success(result.message);
      setSyncFeedback(result.message);
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: unknown) {
      toast.error(err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success('Đã sao chép liên kết Google Form vào bộ nhớ tạm.');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopySheetLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSheetLink(true);
      toast.success('Đã sao chép liên kết Google Sheet vào bộ nhớ tạm.');
      setTimeout(() => setCopiedSheetLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCreateSubmit = async (payload: CreateActivityFormPayload) => {
    try {
      await createMutation.mutateAsync(payload);
      toast.success('Đã thiết lập Google Form cho hoạt động thành công.');
      setIsCreateOpen(false);
    } catch (err: unknown) {
      toast.error(err);
      throw err;
    }
  };

  const handleSaveSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrlInput.trim()) {
      toast.error('Vui lòng nhập đường dẫn Google Sheet.');
      return;
    }

    try {
      const result = await attachSheetMutation.mutateAsync(sheetUrlInput.trim());
      setIsAttachSheetOpen(false);
      toast.success(result.message || 'Đã liên kết Google Sheet và đồng bộ thành công!');
      setSyncFeedback(result.message);
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi liên kết Google Sheet.');
    }
  };

  const handleSync = async () => {
    if (!primaryForm) return;
    const currentSheetUrl = (primaryForm.metadata as any)?.sheetUrl;
    if (!currentSheetUrl) {
      setSheetUrlInput('');
      setIsAttachSheetOpen(true);
      return;
    }

    try {
      const result = await syncMutation.mutateAsync();
      setSyncFeedback(result.message);
      toast.success(result.message);
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      const msg = err?.message || 'Lỗi đồng bộ phản hồi từ Google Sheet / Google Forms';
      setSyncFeedback(msg);
      toast.error(msg);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (confirm('Bạn có chắc chắn muốn hủy liên kết Google Form này khỏi hoạt động?')) {
      try {
        await deleteMutation.mutateAsync(formId);
        toast.success('Đã hủy liên kết Google Form thành công.');
      } catch (err: unknown) {
        toast.error(err);
      }
    }
  };

  // If no forms are linked yet
  if (!primaryForm && !isLoadingForms) {
    return (
      <div className="p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
          <FileSpreadsheet className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900">
            Chưa có Google Form đăng ký cho hoạt động này
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tạo biểu mẫu Google Form chuẩn hóa hoặc liên kết Google Form có sẵn để thu thập thông tin đăng ký và tự động đồng bộ vào danh sách người tham gia.
          </p>
        </div>

        {canManage && (
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              id="open-create-google-form-btn"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thiết lập Google Form ngay</span>
            </button>
          </div>
        )}

        <CreateGoogleFormDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          activity={activity}
          onSubmit={handleCreateSubmit}
          isSubmitting={createMutation.isPending}
        />
      </div>
    );
  }

  const syncStatus = primaryForm ? SYNC_STATUS_CONFIG[primaryForm.syncStatus] : null;
  const unmatchedCount = primaryForm ? primaryForm.unmatchedCount : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Sync Notification */}
      {syncFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{syncFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Google Form Card */}
      {primaryForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">{primaryForm.title}</h3>
                  {syncStatus && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${syncStatus.badgeClass}`}
                    >
                      {syncStatus.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {primaryForm.description || 'Biểu mẫu thu thập đăng ký tham gia sự kiện của Đơn vị.'}
                </p>
              </div>
            </div>

            {/* Sync & Response Actions */}
            {canManage && (
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleCsvFileUpload}
                />

                <button
                  type="button"
                  id="import-csv-responses-btn"
                  disabled={importCsvMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Tải câu trả lời dạng CSV từ Google Forms về máy rồi nhập vào đây"
                >
                  <Upload className={`w-3.5 h-3.5 ${importCsvMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>{importCsvMutation.isPending ? 'Đang đọc CSV...' : 'Nhập tệp CSV'}</span>
                </button>

                <button
                  type="button"
                  id="sync-google-forms-responses-btn"
                  disabled={syncMutation.isPending}
                  onClick={handleSync}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>{syncMutation.isPending ? 'Đang đồng bộ...' : 'Đồng bộ phản hồi'}</span>
                </button>

                <button
                  type="button"
                  id="view-all-responses-btn"
                  onClick={() => setIsResponsesOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Xem phản hồi ({primaryForm.responseCount})</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1">
              <p className="text-[11px] font-medium text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Người đăng ký tham gia</span>
              </p>
              <p className="text-xl font-black text-emerald-950">{primaryForm.responseCount} người</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <p className="text-[11px] font-medium text-slate-500">Lần đồng bộ gần nhất</p>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                {primaryForm.lastSyncedAt ? formatDateTime(primaryForm.lastSyncedAt) : 'Chưa từng đồng bộ'}
              </p>
            </div>
          </div>

          {/* Form Links and Google Sheets Sync Bar */}
          <div className="space-y-3 pt-1">
            {/* Google Form Link */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>Đường dẫn biểu mẫu (Gửi cho sinh viên điền đơn)</span>
              </h4>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 truncate">
                  {primaryForm.formUrl}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    id="copy-form-url-btn"
                    onClick={() => handleCopyLink(primaryForm.formUrl)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Đã chép link' : 'Sao chép link'}</span>
                  </button>

                  <a
                    href={primaryForm.formUrl}
                    target="_blank"
                    rel="noreferrer"
                    id="open-google-form-external-btn"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở Google Form</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Google Sheet Link (for Realtime Response Sync) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Sheet kết quả (Trang tính tự động đồng bộ)</span>
                </h4>

                {canManage && !(primaryForm.metadata as any)?.sheetUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setSheetUrlInput('');
                      setIsAttachSheetOpen(true);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    + Gắn link Trang tính
                  </button>
                )}
              </div>

              {(primaryForm.metadata as any)?.sheetUrl ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 bg-emerald-50/50 border border-emerald-200 rounded-lg px-3 py-2 text-xs font-mono text-emerald-900 truncate">
                    {(primaryForm.metadata as any).sheetUrl}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <button
                      type="button"
                      id="copy-sheet-url-btn"
                      onClick={() => handleCopySheetLink((primaryForm.metadata as any).sheetUrl)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedSheetLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSheetLink ? 'Đã chép' : 'Sao chép'}</span>
                    </button>

                    <a
                      href={(primaryForm.metadata as any).sheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      id="open-google-sheet-external-btn"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Mở Google Sheet</span>
                    </a>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => {
                          setSheetUrlInput((primaryForm.metadata as any).sheetUrl || '');
                          setIsAttachSheetOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <span>Đổi link Sheet</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
                  <div>
                    <p className="font-semibold text-slate-800">Chưa liên kết Google Sheet chứa câu trả lời</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Gắn link Trang tính để hệ thống tự động đọc danh sách người đăng ký mỗi khi bạn bấm &quot;Đồng bộ phản hồi&quot;.
                    </p>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      id="attach-google-sheet-btn"
                      onClick={() => {
                        setSheetUrlInput('');
                        setIsAttachSheetOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Liên kết Google Sheet</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions (Change Form, Unlink) */}
          {canManage && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                + Thay đổi Form khác
              </button>
              <button
                type="button"
                onClick={() => handleDeleteForm(primaryForm.id)}
                className="text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
              >
                Hủy liên kết
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateGoogleFormDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        activity={activity}
        onSubmit={handleCreateSubmit}
        isSubmitting={createMutation.isPending}
      />

      {/* Attach Google Sheet Dialog */}
      {isAttachSheetOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Liên kết Google Sheet câu trả lời</h3>
                  <p className="text-[11px] text-slate-500">Đồng bộ tự động dữ liệu người đăng ký</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAttachSheetOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSheet} className="p-6 space-y-4">
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2 text-xs text-indigo-950">
                <p className="font-bold flex items-center gap-1.5 text-indigo-900">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Cách lấy link Google Sheet từ Google Form (3 bước):</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-indigo-900/90 pl-1 leading-relaxed">
                  <li>Mở biểu mẫu Google Form của bạn trên trình duyệt.</li>
                  <li>Bấm vào tab <strong>Câu trả lời (Responses)</strong>.</li>
                  <li>
                    Bấm vào biểu tượng màu xanh <strong>&quot;Xem trong Trang tính&quot; (View in Sheets)</strong> hoặc &quot;Liên kết với Trang tính&quot; $\rightarrow$ Sao chép link trên thanh địa chỉ và dán vào bên dưới.
                  </li>
                </ol>
              </div>

              <div>
                <label htmlFor="sheet-url-dialog-input" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Đường dẫn (URL) Google Sheet <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="sheet-url-dialog-input"
                  value={sheetUrlInput}
                  autoFocus
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-2xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 Hãy đảm bảo Google Sheet đã được mở quyền xem (Bất kỳ ai có liên kết đều có thể xem).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAttachSheetOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={attachSheetMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <span>{attachSheetMutation.isPending ? 'Đang đồng bộ...' : 'Lưu & Đồng bộ ngay'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {primaryForm && (
        <FormResponsesViewerDialog
          isOpen={isResponsesOpen}
          onClose={() => setIsResponsesOpen(false)}
          form={primaryForm}
          responses={responses}
          isLoading={isLoadingResponses}
          isSyncing={syncMutation.isPending}
          onSync={handleSync}
        />
      )}
    </div>
  );
}
