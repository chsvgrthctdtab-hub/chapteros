import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Trash2,
  ArrowRight,
  ClipboardPaste,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useBulkAddCollabParticipants } from '../queries/collab.queries';
import { cn } from '@/lib/utils';

interface ParsedParticipantRow {
  id: string;
  fullName: string;
  studentId: string;
  className: string;
  cohort: string;
  phone: string;
  email: string;
  roleTitle: string;
  organizationId: string;
  organizationCode: string;
  externalOrganization: string;
  notes: string;
}

interface ImportCollabParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  activityId?: string;
  participatingOrganizations?: { id: string; name: string; code: string }[];
  activities?: { id: string; title: string }[];
  onSuccess?: () => void;
}

export function ImportCollabParticipantsModal({
  isOpen,
  onClose,
  planId,
  activityId: initialActivityId,
  participatingOrganizations = [],
  activities = [],
  onSuccess,
}: ImportCollabParticipantsModalProps) {
  const [pastedText, setPastedText] = useState('');
  const [step, setStep] = useState<'paste' | 'preview'>('paste');
  const [parsedRows, setParsedRows] = useState<ParsedParticipantRow[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(initialActivityId || 'all');
  const [defaultOrgId, setDefaultOrgId] = useState<string>(participatingOrganizations[0]?.id || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bulkAddMutation = useBulkAddCollabParticipants(initialActivityId, planId);

  // Quick Org Lookup Map by code & name (case-insensitive)
  const orgLookup = useMemo(() => {
    const map = new Map<string, { id: string; code: string; name: string }>();
    participatingOrganizations.forEach((org) => {
      if (org.code) map.set(org.code.toLowerCase().trim(), org);
      if (org.name) map.set(org.name.toLowerCase().trim(), org);
    });
    return map;
  }, [participatingOrganizations]);

  // Parse raw text into structured rows
  const handleParseText = () => {
    setErrorMessage(null);
    const raw = pastedText.trim();
    if (!raw) {
      setErrorMessage('Vui lòng dán danh sách từ Google Sheet hoặc Excel trước khi tiếp tục.');
      return;
    }

    const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      setErrorMessage('Không tìm thấy dòng dữ liệu nào hợp lệ.');
      return;
    }

    const rows: ParsedParticipantRow[] = [];

    lines.forEach((line, idx) => {
      // Split by tab (\t) or semicolon (;) or comma (,)
      let parts = line.includes('\t')
        ? line.split('\t').map((p) => p.trim())
        : line.includes(';')
        ? line.split(';').map((p) => p.trim())
        : line.split(',').map((p) => p.trim());

      // Filter out empty parts
      parts = parts.filter(Boolean);
      if (parts.length === 0) return;

      // Skip header row if it contains keywords like "Họ và tên", "MSSV", "STT"
      const lineLower = line.toLowerCase();
      if (
        (lineLower.includes('họ và tên') || lineLower.includes('họ tên') || lineLower.includes('stt')) &&
        (lineLower.includes('mssv') || lineLower.includes('lớp') || lineLower.includes('đơn vị'))
      ) {
        return;
      }

      // If the first item is a numeric index (STT like "1", "2"), remove it
      if (/^\d{1,4}$/.test(parts[0]) && parts.length > 1) {
        parts.shift();
      }

      let fullName = '';
      let studentId = '';
      let className = '';
      let cohort = '';
      let phone = '';
      let email = '';
      let roleTitle = 'Tình nguyện viên';
      let organizationId = defaultOrgId;
      let organizationCode = participatingOrganizations[0]?.code || 'Đơn vị';
      let externalOrganization = '';
      let notes = '';

      // Pattern matchers
      const studentIdRegex = /\b[A-Za-z]\d{7}\b/i;
      const phoneRegex = /\b(0|\+84)\d{9,10}\b/;
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
      const cohortRegex = /\b[Kk](\d{2})\b/;

      // Extract known tokens
      const remainingTokens: string[] = [];

      parts.forEach((token) => {
        if (!studentId && studentIdRegex.test(token)) {
          studentId = token.toUpperCase();
        } else if (!phone && phoneRegex.test(token)) {
          phone = token;
        } else if (!email && emailRegex.test(token)) {
          email = token;
        } else if (!cohort && cohortRegex.test(token)) {
          cohort = token.toUpperCase();
        } else {
          // Check if token matches an organization
          const matchedOrg = orgLookup.get(token.toLowerCase());
          if (matchedOrg) {
            organizationId = matchedOrg.id;
            organizationCode = matchedOrg.code;
          } else {
            remainingTokens.push(token);
          }
        }
      });

      // Assign remaining tokens to fullName, className, roleTitle
      if (remainingTokens.length > 0) {
        fullName = remainingTokens[0];
      }
      if (remainingTokens.length > 1) {
        // If second token looks like class code (e.g. DI21V7A1, QT22)
        if (/^[A-Za-z]{2,4}\d{2}/i.test(remainingTokens[1])) {
          className = remainingTokens[1].toUpperCase();
        } else {
          roleTitle = remainingTokens[1];
        }
      }
      if (remainingTokens.length > 2) {
        if (!className && /^[A-Za-z]{2,4}\d{2}/i.test(remainingTokens[2])) {
          className = remainingTokens[2].toUpperCase();
        } else {
          roleTitle = remainingTokens[2];
        }
      }
      if (remainingTokens.length > 3) {
        notes = remainingTokens.slice(3).join(' - ');
      }

      if (fullName) {
        rows.push({
          id: `temp_${idx}_${Date.now()}`,
          fullName,
          studentId,
          className,
          cohort,
          phone,
          email,
          roleTitle,
          organizationId,
          organizationCode,
          externalOrganization,
          notes,
        });
      }
    });

    if (rows.length === 0) {
      setErrorMessage('Không thể trích xuất dữ liệu hợp lệ. Vui lòng kiểm tra lại định dạng danh sách.');
      return;
    }

    setParsedRows(rows);
    setStep('preview');
  };

  const handleRemoveRow = (rowId: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleUpdateRowField = (rowId: string, field: keyof ParsedParticipantRow, value: string) => {
    setParsedRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        if (field === 'organizationId') {
          const matchedOrg = participatingOrganizations.find((o) => o.id === value);
          return {
            ...r,
            organizationId: value,
            organizationCode: matchedOrg?.code || 'Đơn vị',
          };
        }
        return { ...r, [field]: value };
      })
    );
  };

  const handleBulkSubmit = async () => {
    if (parsedRows.length === 0) return;

    try {
      setErrorMessage(null);
      const targetActId =
        selectedActivityId && selectedActivityId !== 'all' ? selectedActivityId : undefined;

      const payload = parsedRows.map((r) => ({
        fullName: r.fullName,
        studentId: r.studentId || null,
        className: r.className || null,
        cohort: r.cohort || null,
        phone: r.phone || null,
        email: r.email || null,
        roleTitle: r.roleTitle || 'Tình nguyện viên',
        organizationId: r.organizationId || null,
        externalOrganization: r.externalOrganization || null,
        notes: r.notes || null,
      }));

      await bulkAddMutation.mutateAsync({
        planId,
        activityId: targetActId,
        participants: payload,
      });

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      console.error('Import participants error:', err);
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi lưu danh sách người tham gia.');
    }
  };

  const handleClose = () => {
    setPastedText('');
    setStep('paste');
    setParsedRows([]);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <span>Nhập Danh Sách từ Google Sheet / Excel</span>
            </DialogTitle>
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs px-2.5 py-0.5 font-medium">
              Copy - Paste Tức thì
            </Badge>
          </div>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Copy các cột từ Google Sheet hoặc Excel và dán trực tiếp. Hệ thống tự động bóc tách Họ tên,
            MSSV, Lớp, Đơn vị, SĐT và Đội hình.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 mt-2 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: PASTE TEXTAREA */}
        {step === 'paste' && (
          <div className="space-y-4 py-3 flex-1 overflow-y-auto">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ClipboardPaste className="h-3.5 w-3.5 text-purple-600" />
                  <span>Dán dữ liệu từ Sheet (Ctrl + V):</span>
                </label>
                <span className="text-[11px] text-slate-400">Hỗ trợ phân tách Tab, Dấu phẩy hoặc Dấu chấm phẩy</span>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={10}
                placeholder={`Ví dụ sao chép từ Google Sheet:\nNguyễn Văn A\tB2101234\tDI21V7A1\tĐHYD\t0912345678\tĐội Y tế\nTrần Thị B\tB2205678\tQT22A2\tĐHKG\t0987654321\tĐội Hậu cần\nLê Hoàng Nam\tB2009876\tCN20\tXã Đoàn\t0903123456\tTiếp sức`}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 leading-relaxed resize-none placeholder:text-slate-400"
              />
            </div>

            {/* Quick config options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Đơn vị mặc định (nếu dòng thiếu đơn vị):</label>
                <select
                  value={defaultOrgId}
                  onChange={(e) => setDefaultOrgId(e.target.value)}
                  className="w-full h-8 text-xs bg-white border border-slate-200 rounded-lg px-2 focus:outline-none"
                >
                  {participatingOrganizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.code} - {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {activities.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Phân bổ vào hoạt động:</label>
                  <select
                    value={selectedActivityId}
                    onChange={(e) => setSelectedActivityId(e.target.value)}
                    className="w-full h-8 text-xs bg-white border border-slate-200 rounded-lg px-2 focus:outline-none"
                  >
                    <option value="all">Toàn chiến dịch (Lực lượng chung)</option>
                    {activities.map((act) => (
                      <option key={act.id} value={act.id}>
                        {act.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex items-start gap-2 text-xs text-purple-900">
              <HelpCircle className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Mẹo sao chép nhanh:</span> Bạn có thể bôi đen nhiều ô trên Google Sheet (bao gồm cột Họ tên, MSSV, Lớp, Đơn vị, SĐT) rồi nhấn <code className="bg-purple-100 px-1 rounded text-purple-800 font-mono">Ctrl + C</code> và dán thẳng vào đây. Hệ thống tự nhận diện thứ tự cột thông minh.
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & EDIT TABLE */}
        {step === 'preview' && (
          <div className="space-y-3 py-2 flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Xem trước danh sách nhận diện ({parsedRows.length} người)
                </span>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                  Sẵn sàng nhập
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('paste')}
                className="h-7 text-xs text-purple-700 hover:bg-purple-50"
              >
                ← Dán lại nội dung
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200/80 rounded-xl bg-white shadow-inner">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="w-10 px-2 py-2 text-center">STT</th>
                    <th className="px-3 py-2 min-w-[150px]">Họ và tên *</th>
                    <th className="w-24 px-2 py-2">MSSV</th>
                    <th className="w-20 px-2 py-2">Lớp</th>
                    <th className="w-32 px-2 py-2">Đơn vị</th>
                    <th className="w-28 px-2 py-2">Đội hình / Vai trò</th>
                    <th className="w-28 px-2 py-2">Số điện thoại</th>
                    <th className="w-10 px-2 py-2 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="px-2 py-1.5 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={row.fullName}
                          onChange={(e) => handleUpdateRowField(row.id, 'fullName', e.target.value)}
                          className="w-full h-7 px-2 text-xs border border-transparent hover:border-slate-200 focus:border-purple-400 rounded bg-transparent focus:bg-white font-medium text-slate-900"
                        />
                      </td>
                      <td className="px-2 py-1.5 font-mono">
                        <input
                          type="text"
                          value={row.studentId}
                          onChange={(e) => handleUpdateRowField(row.id, 'studentId', e.target.value)}
                          placeholder="MSSV"
                          className="w-full h-7 px-1.5 text-xs font-mono border border-transparent hover:border-slate-200 focus:border-purple-400 rounded bg-transparent focus:bg-white text-slate-700"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={row.className}
                          onChange={(e) => handleUpdateRowField(row.id, 'className', e.target.value)}
                          placeholder="Lớp"
                          className="w-full h-7 px-1.5 text-xs border border-transparent hover:border-slate-200 focus:border-purple-400 rounded bg-transparent focus:bg-white text-slate-700"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={row.organizationId}
                          onChange={(e) => handleUpdateRowField(row.id, 'organizationId', e.target.value)}
                          className="w-full h-7 text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5"
                        >
                          {participatingOrganizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.code}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={row.roleTitle}
                          onChange={(e) => handleUpdateRowField(row.id, 'roleTitle', e.target.value)}
                          placeholder="Đội hình"
                          className="w-full h-7 px-1.5 text-xs border border-transparent hover:border-slate-200 focus:border-purple-400 rounded bg-transparent focus:bg-white text-slate-700"
                        />
                      </td>
                      <td className="px-2 py-1.5 font-mono">
                        <input
                          type="text"
                          value={row.phone}
                          onChange={(e) => handleUpdateRowField(row.id, 'phone', e.target.value)}
                          placeholder="SĐT"
                          className="w-full h-7 px-1.5 text-xs font-mono border border-transparent hover:border-slate-200 focus:border-purple-400 rounded bg-transparent focus:bg-white text-slate-700"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="h-6 w-6 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DIALOG FOOTER */}
        <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="text-xs"
          >
            Hủy
          </Button>

          {step === 'paste' ? (
            <Button
              type="button"
              size="sm"
              onClick={handleParseText}
              disabled={!pastedText.trim()}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5"
            >
              <span>Phân tích dữ liệu</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={bulkAddMutation.isPending || parsedRows.length === 0}
              onClick={handleBulkSubmit}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm"
            >
              {bulkAddMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>Xác nhận nhập ({parsedRows.length} người)</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
