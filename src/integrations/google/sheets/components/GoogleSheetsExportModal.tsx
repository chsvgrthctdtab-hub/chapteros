import { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Filter,
  Check,
  Copy,
  Loader2,
  Layers,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectedSpreadsheets } from '../google-sheets.queries';
import { useExportModuleMutation } from '../google-sheets.mutations';
import type { GoogleSheetModule, ExportExecutionResult } from '../google-sheets.types';
import { getModuleFields, getStandardExportHeaders } from '../sheet-mappings';
import { GOOGLE_SHEETS_MODULE_TABS } from '../google-sheets.constants';

interface GoogleSheetsExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: GoogleSheetModule;
  termId?: string | null;
  activityId?: string | null;
  customFilters?: Record<string, unknown>;
}

export function GoogleSheetsExportModal({
  open,
  onOpenChange,
  module,
  termId,
  activityId,
  customFilters,
}: GoogleSheetsExportModalProps) {
  const { activeOrganization } = useAuth();
  const orgId = activeOrganization?.id;

  const { data: connectedSheets = [] } = useConnectedSpreadsheets(orgId);
  const exportMutation = useExportModuleMutation();

  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>('');
  const [exportMode, setExportMode] = useState<'existing_sheet' | 'direct_download'>('direct_download');
  const [exportResult, setExportResult] = useState<ExportExecutionResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const moduleInfo = GOOGLE_SHEETS_MODULE_TABS[module];
  const fields = useMemo(() => getModuleFields(module), [module]);

  const handleExport = async () => {
    if (!orgId) return;

    try {
      const result = await exportMutation.mutateAsync({
        organizationId: orgId,
        termId: termId || null,
        module,
        spreadsheetId: exportMode === 'existing_sheet' ? selectedSpreadsheetId : undefined,
        createNewSpreadsheet: exportMode === 'direct_download',
        filters: {
          activityId: activityId || undefined,
          ...customFilters,
        },
      });

      setExportResult(result);

      // Trigger instant download if CSV download data is returned
      if (result.downloadData) {
        const blob = new Blob([result.downloadData.csvContent], {
          type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', result.downloadData.fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleCopyLink = () => {
    if (exportResult?.spreadsheetUrl) {
      navigator.clipboard.writeText(exportResult.spreadsheetUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setExportResult(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) setExportResult(null);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">
                Xuất dữ liệu: {moduleInfo?.title || module}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Định dạng chuẩn hóa cho Google Sheets & Excel với tiêu đề tiếng Việt chuẩn xác
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!exportResult ? (
          <div className="space-y-4 py-2">
            {/* Target Export Option */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Tùy chọn xuất dữ liệu:</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setExportMode('direct_download')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    exportMode === 'direct_download'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium text-xs text-slate-900">
                    <Download className="w-4 h-4 text-emerald-600" /> Tải tệp CSV (Google Sheets)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Chuẩn UTF-8 BOM, mở trực tiếp bằng Google Sheets hoặc Excel không lỗi font.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setExportMode('existing_sheet')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    exportMode === 'existing_sheet'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium text-xs text-slate-900">
                    <ExternalLink className="w-4 h-4 text-emerald-600" /> Ghi vào Bảng tính đã liên kết
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Cập nhật vào tab "{moduleInfo?.tabName}" trong Google Spreadsheet của Đơn vị.
                  </p>
                </button>
              </div>
            </div>

            {/* Select Connected Sheet if mode is existing_sheet */}
            {exportMode === 'existing_sheet' && (
              <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="text-xs font-medium text-slate-700">Chọn Bảng tính đích:</label>
                {connectedSheets.length === 0 ? (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    Chưa có Bảng tính Google Sheets nào được liên kết với Chi hội. Bạn có thể chọn "Tải tệp CSV" hoặc vào Cài đặt → Tích hợp để liên kết.
                  </div>
                ) : (
                  <Select
                    value={selectedSpreadsheetId}
                    onValueChange={setSelectedSpreadsheetId}
                  >
                    <SelectTrigger className="w-full h-9 text-xs bg-white border-slate-300 text-slate-800">
                      <SelectValue placeholder="-- Chọn Bảng tính --" />
                    </SelectTrigger>
                    <SelectContent>
                      {connectedSheets.map((s) => (
                        <SelectItem key={s.id} value={s.spreadsheetId}>
                          {s.spreadsheetName} ({s.spreadsheetId.slice(0, 8)}...)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Column Schema Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" /> Các cột sẽ được xuất ({fields.length} cột):
                </label>
                {module === 'finance' && (
                  <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Số tiền xuất dạng số nguyên (Numeric)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg max-h-36 overflow-y-auto">
                {fields.map((f) => (
                  <span
                    key={f.key}
                    className="inline-flex items-center text-[11px] px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 font-medium shadow-2xs"
                  >
                    {f.label}
                    {f.isRequired && <span className="text-rose-500 ml-0.5">*</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-2 p-2.5 bg-blue-50/60 border border-blue-200/60 rounded-lg text-blue-900 text-xs leading-relaxed">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Nguyên tắc Source of Truth:</strong> Thao tác này xuất snapshot dữ liệu hiện tại từ Supabase ra Google Sheets. Mọi chỉnh sửa trên Sheet sau đó sẽ không tự động ghi đè lại hệ thống trừ khi thực hiện tính năng Nhập có kiểm soát.
              </div>
            </div>
          </div>
        ) : (
          /* Result View */
          <div className="py-4 space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">Xuất dữ liệu thành công!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Đã xử lý <strong>{exportResult.rowCount}</strong> bản ghi từ mô-đun {moduleInfo?.title}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span>Tên tab:</span>
                <span className="font-semibold text-slate-900">{exportResult.sheetName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Thời gian:</span>
                <span className="font-mono text-slate-700">{new Date(exportResult.exportedAt).toLocaleTimeString('vi-VN')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="w-full sm:w-auto text-xs gap-1.5"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Đã sao chép liên kết' : 'Sao chép link Sheet'}
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  window.open(exportResult.spreadsheetUrl, '_blank');
                }}
                className="w-full sm:w-auto bg-emerald-600 text-white hover:bg-emerald-700 text-xs gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Mở Google Sheets
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {!exportResult ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleExport}
                disabled={exportMutation.isPending || (exportMode === 'existing_sheet' && !selectedSpreadsheetId)}
                className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs gap-1.5"
              >
                {exportMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang xử lý xuất...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Bắt đầu Xuất dữ liệu
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExportResult(null);
                onOpenChange(false);
              }}
              className="w-full sm:w-auto text-xs"
            >
              Hoàn tất
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
