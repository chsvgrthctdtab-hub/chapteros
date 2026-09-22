import { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  Search,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import type { ActivityForm, ActivityFormResponse } from '@/types';
import { formatDateTime } from '@/lib/date';

interface FormResponsesViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  form: ActivityForm;
  responses: ActivityFormResponse[];
  isLoading?: boolean;
  isSyncing?: boolean;
  onSync: () => Promise<void>;
}

export function FormResponsesViewerDialog({
  isOpen,
  onClose,
  form,
  responses,
  isSyncing = false,
  onSync,
}: FormResponsesViewerDialogProps) {
  const [search, setSearch] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(form.formUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const filteredResponses = responses.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        r.fullName?.toLowerCase().includes(q) ||
        r.studentId?.toLowerCase().includes(q) ||
        r.respondentEmail?.toLowerCase().includes(q) ||
        r.phoneNumber?.includes(q) ||
        r.className?.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-navy/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        id="form-responses-viewer-modal"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-hairline"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-cloud shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e6f0ff] border border-[#d4e4fa] text-signal-blue flex items-center justify-center shadow-xs">
              <FileSpreadsheet strokeWidth={1.5} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-ink-navy">{form.title}</h3>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 tabular-nums">
                  {responses.length} người đăng ký
                </span>
              </div>
              <p className="text-[11px] text-slate-gray">
                Danh sách người đăng ký tham gia từ Google Form / Google Sheet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="sync-now-dialog-btn"
              disabled={isSyncing}
              onClick={onSync}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-signal-blue hover:bg-[#005be0] rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
            </button>

            <button
              type="button"
              id="close-responses-viewer-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-gray hover:text-ink-navy hover:bg-pebble transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 sm:px-6 bg-cloud/50 border-b border-hairline flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-gray font-medium tabular-nums">
            Hiển thị <strong className="text-ink-navy">{filteredResponses.length}</strong> / {responses.length} người đăng ký
          </div>

          {/* Search Bar & Quick Links */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-mist-gray absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo Họ tên, MSSV, Lớp..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-hairline rounded-lg text-ink-navy placeholder:text-mist-gray focus:outline-hidden focus:ring-2 focus:ring-signal-blue/20 focus:border-signal-blue"
              />
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              title="Sao chép link Google Form"
              className="p-1.5 bg-white border border-hairline rounded-lg text-slate-gray hover:text-ink-navy hover:bg-pebble transition-colors shrink-0 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <a
              href={form.formUrl}
              target="_blank"
              rel="noreferrer"
              title="Mở Google Form"
              className="p-1.5 bg-white border border-hairline rounded-lg text-slate-gray hover:text-ink-navy hover:bg-pebble transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Responses Table / List Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {responses.length === 0 ? (
            <div className="py-16 text-center max-w-sm mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#e6f0ff] text-signal-blue flex items-center justify-center mx-auto border border-[#d4e4fa]">
                <Sparkles strokeWidth={1.5} className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-ink-navy">Chưa có người đăng ký</h4>
              <p className="text-xs text-slate-gray">
                Hãy chia sẻ đường dẫn Google Form cho sinh viên hoặc bấm &quot;Đồng bộ ngay&quot; để tải danh sách câu trả lời mới nhất.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={onSync}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-signal-blue hover:bg-[#005be0] rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Đồng bộ từ Google Forms / Sheet</span>
                </button>
              </div>
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-gray">
              Không tìm thấy người đăng ký nào phù hợp với từ khóa tìm kiếm.
            </div>
          ) : (
            <div className="divide-y divide-hairline border border-hairline rounded-xl overflow-hidden bg-white shadow-xs">
              {filteredResponses.map((resp, idx) => {
                return (
                  <div
                    key={resp.id}
                    className="p-4 hover:bg-cloud/60 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                  >
                    {/* Left info */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-mist-gray tabular-nums">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <p className="font-bold text-ink-navy text-sm">{resp.fullName || 'Người tham gia'}</p>
                        
                        {resp.studentId && (
                          <span className="font-mono tabular-nums text-[10px] font-bold bg-cloud text-ink-navy px-2 py-0.5 rounded-full border border-hairline">
                            MSSV: {resp.studentId}
                          </span>
                        )}

                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Đã ghi nhận</span>
                        </span>
                      </div>

                      {/* Details row */}
                      <div className="flex items-center gap-4 text-slate-gray flex-wrap text-[11px]">
                        {resp.className && (
                          <span className="flex items-center gap-1 text-signal-blue font-medium">
                            <GraduationCap className="w-3 h-3 text-signal-blue" />
                            <span>{resp.className}</span>
                          </span>
                        )}

                        {resp.respondentEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-mist-gray" />
                            <span>{resp.respondentEmail}</span>
                          </span>
                        )}

                        {resp.phoneNumber && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-mist-gray" />
                            <span className="font-mono tabular-nums">{resp.phoneNumber}</span>
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-mist-gray">
                          <Calendar className="w-3 h-3" />
                          <span className="tabular-nums">Gửi lúc: {formatDateTime(resp.submittedAt)}</span>
                        </span>
                      </div>

                      {/* Notes snippet if any */}
                      {resp.notes && !resp.notes.startsWith('Đồng bộ') && (
                        <p className="text-[11px] text-slate-gray bg-cloud px-2.5 py-1 rounded-lg border border-hairline italic">
                          &quot;{resp.notes}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-hairline bg-cloud flex items-center justify-between text-xs text-slate-gray shrink-0">
          <span className="tabular-nums">
            {form.lastSyncedAt
              ? `Lần đồng bộ cuối: ${formatDateTime(form.lastSyncedAt)}`
              : 'Chưa từng đồng bộ'}
          </span>

          <button
            type="button"
            id="close-responses-footer-btn"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-gray hover:text-ink-navy bg-white border border-hairline rounded-lg hover:bg-pebble transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
