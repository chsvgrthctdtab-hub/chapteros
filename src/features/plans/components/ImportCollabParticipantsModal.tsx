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

      // Skip header row if it contains keywords like "Họ và tên", "MSSV", "STT", "Khóa"
      const lineLower = line.toLowerCase();
      if (
        (lineLower.includes('họ và tên') || lineLower.includes('họ tên') || lineLower.includes('stt') || lineLower.includes('họ & tên')) &&
        (lineLower.includes('mssv') || lineLower.includes('lớp') || lineLower.includes('đơn vị') || lineLower.includes('khóa') || lineLower.includes('khoá'))
      ) {
        return;
      }

      // If the first item is a numeric index (STT like "1", "2"), remove it if there are at least 3 other items
      if (/^\d{1,4}$/.test(parts[0]) && parts.length >= 4) {
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
      const defaultOrgObj = participatingOrganizations.find((o) => o.id === defaultOrgId);
      let organizationCode = defaultOrgObj?.code || participatingOrganizations[0]?.code || 'Đơn vị';
      let externalOrganization = '';
      let notes = '';

      // Pattern matchers
      const studentIdRegex = /\b([A-Za-z]\d{7}|\d{8,10})\b/i;
      const phoneRegex = /\b(0|\+84)\d{9,10}\b/;
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
      const cohortRegex = /^(?:k|khóa|khoá)?\s*([345]\d|\d{2})$/i;

      // Special handling: Standard 4-column format: [Họ và tên, MSSV, Lớp, Khóa]
      const looksLikeStandard4Col =
        parts.length >= 4 &&
        !studentIdRegex.test(parts[0]) &&
        studentIdRegex.test(parts[1]);

      if (looksLikeStandard4Col) {
        fullName = parts[0];
        studentId = parts[1].toUpperCase();
        className = parts[2].toUpperCase();

        // Extract cohort from parts[3] (e.g. "47", "K47", "Khóa 48")
        const cohortMatch = parts[3].match(cohortRegex);
        if (cohortMatch) {
          cohort = cohortMatch[1];
        } else if (/^\d{1,3}$/.test(parts[3])) {
          cohort = parts[3];
        } else {
          cohort = parts[3];
        }

        // Check if there are extra columns (e.g. 5: Đơn vị, 6: SĐT, 7: Đội hình)
        const extraParts = parts.slice(4);
        extraParts.forEach((extraToken) => {
          if (!phone && phoneRegex.test(extraToken)) {
            phone = extraToken;
          } else if (!email && emailRegex.test(extraToken)) {
            email = extraToken;
          } else {
            const matchedOrg = orgLookup.get(extraToken.toLowerCase());
            if (matchedOrg) {
              organizationId = matchedOrg.id;
              organizationCode = matchedOrg.code;
            } else if (roleTitle === 'Tình nguyện viên') {
              roleTitle = extraToken;
            } else {
              notes = notes ? `${notes} - ${extraToken}` : extraToken;
            }
          }
        });
      } else {
        // Fallback: Smart token detection
        const remainingTokens: string[] = [];

        parts.forEach((token) => {
          if (!studentId && studentIdRegex.test(token)) {
            studentId = token.toUpperCase();
          } else if (!phone && phoneRegex.test(token)) {
            phone = token;
          } else if (!email && emailRegex.test(token)) {
            email = token;
          } else if (!cohort && cohortRegex.test(token)) {
            const match = token.match(cohortRegex);
            cohort = match ? match[1] : token.toUpperCase();
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

        // Assign remaining tokens to fullName, className, cohort, roleTitle
        if (remainingTokens.length > 0) {
          fullName = remainingTokens[0];
        }
        if (remainingTokens.length > 1) {
          // If second token looks like class code (e.g. DI21V7A1, QT22)
          if (/^[A-Za-z]{2,4}\d{2}/i.test(remainingTokens[1])) {
            className = remainingTokens[1].toUpperCase();
          } else if (!cohort && /^\d{2}$/.test(remainingTokens[1])) {
            cohort = remainingTokens[1];
          } else {
            roleTitle = remainingTokens[1];
          }
        }
        if (remainingTokens.length > 2) {
          if (!className && /^[A-Za-z]{2,4}\d{2}/i.test(remainingTokens[2])) {
            className = remainingTokens[2].toUpperCase();
          } else if (!cohort && /^\d{2}$/.test(remainingTokens[2])) {
            cohort = remainingTokens[2];
          } else if (roleTitle === 'Tình nguyện viên') {
            roleTitle = remainingTokens[2];
          } else {
            notes = remainingTokens[2];
          }
        }
        if (remainingTokens.length > 3) {
          if (!cohort && /^\d{2}$/.test(remainingTokens[3])) {
            cohort = remainingTokens[3];
          } else {
            notes = remainingTokens.slice(3).join(' - ');
          }
        }
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
      <DialogContent className="max-w-4xl w-full bg-white rounded-2xl p-6 pr-10 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-3 border-b border-slate-100 shrink-0">
          <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <FileSpreadsheet strokeWidth={1.5} className="h-5 w-5" />
            </div>
            <span>Nhập Danh Sách từ Google Sheet / Excel</span>
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200/80 text-[10px] px-2 py-0.5 font-semibold">
              Format: Họ tên • MSSV • Lớp • Khóa
            </Badge>
          </div>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Copy danh sách theo format chuẩn <strong className="text-slate-700 font-semibold">Họ và tên, MSSV, Lớp, Khóa</strong> từ Google Sheet hoặc Excel và dán trực tiếp. Hệ thống tự động nhận diện và bóc tách dữ liệu tức thì.
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
                  <ClipboardPaste className="h-3.5 w-3.5 text-blue-600" />
                  <span>Dán dữ liệu từ Sheet (Ctrl + V):</span>
                </label>
                <span className="text-[11px] text-slate-400">Hỗ trợ phân tách Tab, Dấu phẩy hoặc Dấu chấm phẩy</span>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={10}
                placeholder={`Ví dụ sao chép theo format chuẩn (Họ và tên\tMSSV\tLớp\tKhóa):\nNguyễn Văn A\tB2101234\tDI21V7A1\t47\nTrần Thị B\tB2205678\tQT22A2\t48\nLê Hoàng Nam\tB2009876\tCN20V7\t46\nPhạm Minh C\tB2301122\tTN23A1\t49`}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed resize-none placeholder:text-slate-400"
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

            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2 text-xs text-blue-900">
              <HelpCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Mẹo sao chép nhanh:</span> Chọn và bôi đen các cột theo thứ tự <code className="bg-blue-100 px-1 rounded text-blue-800 font-mono">Họ và tên | MSSV | Lớp | Khóa</code> trên Google Sheet rồi nhấn <code className="bg-blue-100 px-1 rounded text-blue-800 font-mono">Ctrl + C</code> và dán thẳng vào đây. Bạn cũng có thể dán kèm các cột Đơn vị, SĐT nếu có.
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
                className="h-7 text-xs text-blue-700 hover:bg-blue-50 active:scale-[0.98] font-medium"
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
                    <th className="w-16 px-2 py-2 text-center">Khóa</th>
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
                          className="w-full h-7 px-2 text-xs border border-transparent hover:border-slate-200 focus:border-blue-400 rounded bg-transparent focus:bg-white font-medium text-slate-900"
                        />
                      </td>
                      <td className="px-2 py-1.5 font-mono">
                        <input
                          type="text"
                          value={row.studentId}
                          onChange={(e) => handleUpdateRowField(row.id, 'studentId', e.target.value)}
                          placeholder="MSSV"
                          className="w-full h-7 px-1.5 text-xs font-mono border border-transparent hover:border-slate-200 focus:border-blue-400 rounded bg-transparent focus:bg-white text-slate-700"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={row.className}
                          onChange={(e) => handleUpdateRowField(row.id, 'className', e.target.value)}
                          placeholder="Lớp"
                          className="w-full h-7 px-1.5 text-xs border border-transparent hover:border-slate-200 focus:border-blue-400 rounded bg-transparent focus:bg-white text-slate-700"
                        />
                      </td>
                      <td className="px-2 py-1.5 font-mono text-center">
                        <input
                          type="text"
                          value={row.cohort}
                          onChange={(e) => handleUpdateRowField(row.id, 'cohort', e.target.value)}
                          placeholder="Khóa"
                          className="w-full h-7 px-1 text-xs font-mono text-center border border-transparent hover:border-slate-200 focus:border-blue-400 rounded bg-transparent focus:bg-white text-slate-700"
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
                          className="w-full h-7 px-1.5 text-xs border border-transparent hover:border-slate-200 focus:border-blue-400 rounded bg-transparent focus:bg-white text-slate-700"
                        />
                      </td>
                      <td className="px-2 py-1.5 font-mono">
                        <input
                          type="text"
                          value={row.phone}
                          onChange={(e) => handleUpdateRowField(row.id, 'phone', e.target.value)}
                          placeholder="SĐT"
                          className="w-full h-7 px-1.5 text-xs font-mono border border-transparent hover:border-slate-200 focus:border-blue-400 rounded bg-transparent focus:bg-white text-slate-700"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="h-6 w-6 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors active:scale-[0.95]"
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
            className="text-xs h-8 px-3 border-slate-200 hover:bg-slate-50 active:scale-[0.98]"
          >
            Hủy
          </Button>

          {step === 'paste' ? (
            <Button
              type="button"
              size="sm"
              onClick={handleParseText}
              disabled={!pastedText.trim()}
              className="text-xs h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 shadow-2xs active:scale-[0.98]"
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
              className="text-xs h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-2xs active:scale-[0.98]"
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
