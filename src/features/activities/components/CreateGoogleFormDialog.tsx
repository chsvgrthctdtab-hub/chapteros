import { useState, type FormEvent } from 'react';
import {
  FileSpreadsheet,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  KeyRound,
  User,
  GraduationCap,
  Layers,
} from 'lucide-react';
import type { ActivityDetail } from '../types/activity.types';
import type { CreateActivityFormPayload } from '@/integrations/google/forms/google-forms.types';

interface CreateGoogleFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityDetail;
  onSubmit: (payload: CreateActivityFormPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateGoogleFormDialog({
  isOpen,
  onClose,
  activity,
  onSubmit,
  isSubmitting = false,
}: CreateGoogleFormDialogProps) {
  const [existingUrl, setExistingUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUrlError(null);

    const clean = existingUrl.trim();
    if (!clean) {
      setUrlError('Vui lòng dán liên kết Google Form của bạn.');
      return;
    }
    if (
      !clean.includes('forms') &&
      !clean.includes('google.com') &&
      !clean.includes('forms.gle') &&
      clean.length < 10
    ) {
      setUrlError(
        'Liên kết không đúng định dạng Google Form (Ví dụ: https://docs.google.com/forms/d/e/.../viewform hoặc https://forms.gle/...)'
      );
      return;
    }

    try {
      await onSubmit({
        activityId: activity.id,
        organizationId: activity.organizationId,
        termId: activity.termId,
        title: `[Chi hội] Đăng ký tham gia: ${activity.title}`,
        description: `Biểu mẫu đăng ký tham gia hoạt động "${activity.title}".`,
        status: 'active',
        formType: 'custom_url',
        existingFormUrl: clean,
      });
      onClose();
    } catch (err: any) {
      setUrlError(err?.message || 'Có lỗi xảy ra khi thiết lập biểu mẫu Google Forms.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-navy/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="create-google-form-modal"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-hairline"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-cloud">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e6f0ff] border border-[#d4e4fa] text-signal-blue flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink-navy">Liên kết Google Form cho hoạt động</h3>
              <p className="text-[11px] text-slate-gray truncate max-w-xs">{activity.title}</p>
            </div>
          </div>
          <button
            type="button"
            id="close-create-form-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-gray hover:text-ink-navy hover:bg-pebble transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {urlError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{urlError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="existing-form-url-input" className="block text-xs font-semibold text-slate-gray uppercase tracking-wider">
                  Đường dẫn (URL) Google Form <span className="text-rose-500">*</span>
                </label>
                <a
                  href="https://forms.new"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-signal-blue hover:text-[#005be0] hover:underline"
                >
                  <span>Mở forms.new tạo mới</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                id="existing-form-url-input"
                value={existingUrl}
                autoFocus
                onChange={(e) => {
                  setExistingUrl(e.target.value);
                  setUrlError(null);
                }}
                placeholder="VD: https://forms.gle/... hoặc https://docs.google.com/forms/d/e/.../viewform"
                className="w-full text-xs px-3.5 py-2.5 bg-cloud border border-hairline rounded-lg text-ink-navy placeholder:text-mist-gray focus:outline-hidden focus:ring-2 focus:ring-signal-blue/20 focus:border-signal-blue font-mono shadow-xs"
              />
            </div>

            {/* Hướng dẫn các trường câu hỏi quy chuẩn */}
            <div className="p-3.5 bg-[#e6f0ff]/50 rounded-xl border border-[#d4e4fa] text-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-ink-navy font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-signal-blue shrink-0" />
                <span>Quy chuẩn câu hỏi trong Form để hệ thống khớp đúng 100%:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-hairline text-ink-navy shadow-xs">
                  <User className="w-4 h-4 text-signal-blue shrink-0" />
                  <div>
                    <span className="font-bold text-ink-navy">Họ và tên</span>
                    <p className="text-[10px] text-slate-gray">Họ và tên người tham gia</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-hairline text-ink-navy shadow-xs">
                  <KeyRound className="w-4 h-4 text-signal-blue shrink-0" />
                  <div>
                    <span className="font-bold text-ink-navy">MSSV</span>
                    <p className="text-[10px] text-slate-gray">Mã số sinh viên</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-hairline text-ink-navy shadow-xs">
                  <GraduationCap className="w-4 h-4 text-signal-blue shrink-0" />
                  <div>
                    <span className="font-bold text-ink-navy">Lớp</span>
                    <p className="text-[10px] text-slate-gray">Lớp (VD: DH22PM01)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-hairline text-ink-navy shadow-xs">
                  <Layers className="w-4 h-4 text-signal-blue shrink-0" />
                  <div>
                    <span className="font-bold text-ink-navy">Khóa</span>
                    <p className="text-[10px] text-slate-gray">Khóa học (VD: K48, K49...)</p>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-gray italic">
                💡 Khi sinh viên nộp đơn, hệ thống sẽ tự động đối soát theo <strong>Họ và tên, MSSV, Lớp, Khóa</strong> để đồng bộ trực tiếp vào danh sách hoạt động.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-hairline">
            <button
              type="button"
              id="cancel-create-form-btn"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-gray hover:text-ink-navy hover:bg-pebble border border-hairline rounded-lg transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              id="submit-create-form-btn"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-signal-blue hover:bg-[#005be0] rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Xác nhận liên kết biểu mẫu</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
