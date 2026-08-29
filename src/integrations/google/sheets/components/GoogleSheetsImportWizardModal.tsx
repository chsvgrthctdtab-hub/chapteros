import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Copy,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Info,
  SlidersHorizontal,
  HelpCircle,
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectedSpreadsheets } from '../google-sheets.queries';
import { useExecuteImportMutation } from '../google-sheets.mutations';
import { googleSheetsService } from '../google-sheets.service';
import type {
  GoogleSheetModule,
  ImportPreviewResult,
  ImportPreviewRow,
  ColumnMappingConfig,
  DuplicatePolicy,
  ConflictPolicy,
  ImportExecutionResult,
} from '../google-sheets.types';
import { getModuleFields, autoMapSheetHeaders, parseCsvOrTsv } from '../sheet-mappings';
import { GOOGLE_SHEETS_MODULE_TABS } from '../google-sheets.constants';
import { ImportPreviewTable } from './ImportPreviewTable';
import { ImportResultDialog } from './ImportResultDialog';

interface GoogleSheetsImportWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: GoogleSheetModule;
  termId?: string | null;
  onImportSuccess?: () => void;
}

export function GoogleSheetsImportWizardModal({
  open,
  onOpenChange,
  module,
  termId,
  onImportSuccess,
}: GoogleSheetsImportWizardModalProps) {
  const { activeOrganization } = useAuth();
  const orgId = activeOrganization?.id;

  const { data: connectedSheets = [] } = useConnectedSpreadsheets(orgId);
  const executeImportMutation = useExecuteImportMutation();

  // Wizard Step State (1 -> 5)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Input Data
  const [sourceType, setSourceType] = useState<'paste' | 'spreadsheet'>('paste');
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>('');
  const [pastedData, setPastedData] = useState<string>('');

  // Step 2: Parsed Headers & Mapping
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [rawRowsData, setRawRowsData] = useState<Array<Record<string, unknown>>>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingConfig>({});

  // Step 3: Preview Result
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Step 4: Policies & Conflict resolutions
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>('skip');
  const [conflictPolicy, setConflictPolicy] = useState<ConflictPolicy>('use_sheet');
  const [customResolutions, setCustomResolutions] = useState<
    Record<number, Record<string, 'keep_supabase' | 'use_sheet'>>
  >({});

  // Step 5 / Result Dialog
  const [executionResult, setExecutionResult] = useState<ImportExecutionResult | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);

  const moduleInfo = GOOGLE_SHEETS_MODULE_TABS[module];
  const fields = useMemo(() => getModuleFields(module), [module]);

  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (file: File) => {
    if (!file) return;
    setWizardError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      let content = e.target?.result as string;
      if (content) {
        // Strip BOM if present
        if (content.charCodeAt(0) === 0xfeff) {
          content = content.slice(1);
        }
        setPastedData(content);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle Loading Sample Template Data
  const handleLoadSampleData = () => {
    setWizardError(null);
    if (module === 'members') {
      const sample = `MSSV\tHọ và tên\tEmail\tSố điện thoại\tLớp\tKhóa\tChuyên ngành\tChức vụ\tTrạng thái
B2101111\tNguyễn Hoàng Nam\tnam.nh@student.edu.vn\t0912345678\tDI21V7A1\tK47\tCông nghệ thông tin\tHội viên\tĐang hoạt động
B2102222\tTrần Thị Mai Anh\tmai.tt@student.edu.vn\t0987654321\tDI21V7A2\tK47\tKhoa học máy tính\tỦy viên BCH\tĐang hoạt động
B2203333\tLê Quốc Bảo\tbao.lq@student.edu.vn\t0901234567\tDI22V7A1\tK48\tHệ thống thông tin\tHội viên\tĐang hoạt động`;
      setPastedData(sample);
    } else if (module === 'activities') {
      const sample = `Mã hoạt động\tTên hoạt động\tDanh mục\tTrạng thái\tĐịa điểm\tThời gian bắt đầu\tThời gian kết thúc\tChỉ tiêu số lượng
HD-2026-02\tNgày hội Chào Tân Sinh viên K52\tVăn nghệ / Giao lưu\tĐã lên kế hoạch\tHội trường Lớn\t2026-09-10\t2026-09-10\t150
HD-2026-03\tTập huấn Kỹ năng Cán bộ Hội\tTập huấn\tBản nháp\tPhòng 102 Nhà Điều hành\t2026-09-15\t2026-09-16\t40`;
      setPastedData(sample);
    } else if (module === 'tasks') {
      const sample = `Tên nhiệm vụ\tMô tả chi tiết\tMức độ ưu tiên\tTrạng thái\tTiến độ (%)\tHạn hoàn thành
In thẻ đeo đại biểu\tIn 150 thẻ đeo 2 mặt có logo Chi hội\tCao\tCần làm\t0\t2026-09-08
Chuẩn bị kịch bản MC\tSoạn thảo kịch bản MC chương trình văn nghệ\tTrung bình\tĐang thực hiện\t50\t2026-09-05`;
      setPastedData(sample);
    } else if (module === 'finance') {
      const sample = `Ngày giao dịch\tLoại giao dịch (Thu/Chi)\tSố tiền (VNĐ)\tDanh mục thu chi\tNội dung / Diễn giải\tNgười ghi nhận
2026-08-12\tThu\t3500000\tHội phí nhiệm kỳ\tThu hội phí đợt 1 năm học 2026\tLê Thị Cẩm Tú
2026-08-13\tChi\t1250000\tIn ấn & Văn phòng phẩm\tIn tài liệu sinh hoạt và băng rôn\tLê Thị Cẩm Tú`;
      setPastedData(sample);
    } else if (module === 'participants') {
      const sample = `MSSV\tHọ và tên\tTrạng thái đăng ký\tTrạng thái điểm danh\tNguồn đăng ký\tGhi chú
B2101111\tNguyễn Hoàng Nam\tĐã xác nhận\tCó mặt\tgoogle_form\tĐến đúng giờ
B2102222\tTrần Thị Mai Anh\tĐã xác nhận\tCó mặt\tgoogle_form\tTrưởng ban đón tiếp`;
      setPastedData(sample);
    }
  };

  // Step 1 -> Step 2: Parse raw text to tabular structures
  const handleParseInputData = () => {
    setWizardError(null);
    if (!pastedData.trim()) {
      setWizardError('Vui lòng dán dữ liệu bảng tính hoặc tải lên tệp CSV/TSV.');
      return;
    }

    const { headers, rows } = parseCsvOrTsv(pastedData);

    if (headers.length === 0 || rows.length === 0) {
      setWizardError('Dữ liệu bảng tính phải có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu hợp lệ.');
      return;
    }

    setParsedHeaders(headers);
    setRawRowsData(rows);

    // Auto-map headers
    const autoMap = autoMapSheetHeaders(headers, module);
    setColumnMapping(autoMap);

    setCurrentStep(2);
  };

  // Step 2 -> Step 3: Run Validation & Duplicate/Conflict check against Supabase
  const handleValidateAndPreview = async () => {
    if (!orgId) return;

    setIsValidating(true);
    setWizardError(null);
    try {
      const preview = await googleSheetsService.parseAndPreviewSheet(
        orgId,
        termId,
        module,
        parsedHeaders,
        rawRowsData,
        columnMapping
      );

      setPreviewResult(preview);
      setCurrentStep(3);
    } catch (err: unknown) {
      const error = err as Error;
      setWizardError(`Lỗi khi đối soát dữ liệu: ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  // Update mapping field manually
  const handleMappingChange = (header: string, targetKey: string) => {
    setColumnMapping((prev) => {
      const next = { ...prev };
      if (!targetKey || targetKey === '_none') {
        delete next[header];
      } else {
        next[header] = targetKey;
      }
      return next;
    });
  };

  // Update row conflict resolution
  const handleResolutionChange = (
    rowIndex: number,
    fieldKey: string,
    resolution: 'keep_supabase' | 'use_sheet'
  ) => {
    setCustomResolutions((prev) => ({
      ...prev,
      [rowIndex]: {
        ...(prev[rowIndex] || {}),
        [fieldKey]: resolution,
      },
    }));

    // Update in preview state as well
    if (previewResult) {
      const updatedRows = previewResult.rows.map((r) => {
        if (r.rowIndex === rowIndex) {
          const updatedConflicts = r.conflicts.map((c) =>
            c.fieldKey === fieldKey ? { ...c, selectedResolution: resolution } : c
          );
          return { ...r, conflicts: updatedConflicts };
        }
        return r;
      });
      setPreviewResult({ ...previewResult, rows: updatedRows });
    }
  };

  // Step 4: Execute Import
  const handleExecuteImport = async () => {
    if (!orgId || !previewResult) return;
    setWizardError(null);

    try {
      const result = await executeImportMutation.mutateAsync({
        organizationId: orgId,
        termId: termId || null,
        module,
        previewRows: previewResult.rows,
        duplicatePolicy,
        conflictPolicy,
        customResolutions,
      });

      setExecutionResult(result);
      setResultDialogOpen(true);
      if (onImportSuccess) onImportSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setWizardError(`Nhập dữ liệu thất bại: ${error.message}`);
    }
  };

  const handleFinish = () => {
    setResultDialogOpen(false);
    onOpenChange(false);
    // Reset wizard
    setCurrentStep(1);
    setPastedData('');
    setPreviewResult(null);
    setExecutionResult(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-slate-900">
                    Nhập dữ liệu: {moduleInfo?.title || module}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Quy trình 4 bước: Chọn nguồn → Khớp cột → Đối soát & Xung đột → Xác nhận nhập
                  </DialogDescription>
                </div>
              </div>

              {/* Step indicator */}
              <div className="hidden sm:flex items-center gap-1 text-xs">
                {[
                  { step: 1, label: '1. Nguồn dữ liệu' },
                  { step: 2, label: '2. Khớp cột' },
                  { step: 3, label: '3. Đối soát' },
                  { step: 4, label: '4. Xác nhận' },
                ].map((s) => (
                  <span
                    key={s.step}
                    className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                      currentStep === s.step
                        ? 'bg-blue-600 text-white shadow-xs'
                        : currentStep > s.step
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2 space-y-4">
            {wizardError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{wizardError}</div>
                <button
                  type="button"
                  onClick={() => setWizardError(null)}
                  className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                >
                  Đóng
                </button>
              </div>
            )}

            {/* STEP 1: SELECT SOURCE & PASTE DATA */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-slate-700">
                    Kéo và thả tệp CSV, TSV hoặc TXT vào đây, hoặc{' '}
                    <label className="text-blue-600 font-semibold cursor-pointer hover:underline">
                      chọn tệp từ máy tính
                      <input
                        type="file"
                        accept=".csv,.tsv,.txt"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Hỗ trợ mã hóa UTF-8 với tiêu đề tiếng Việt chuẩn</p>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Hoặc dán trực tiếp dữ liệu bảng tính:</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadSampleData}
                    className="h-7 text-xs px-2.5 text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"
                  >
                    Nạp dữ liệu mẫu ({moduleInfo?.tabName})
                  </Button>
                </div>

                <textarea
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  placeholder={`Sao chép (Ctrl+C) các ô từ Google Sheets hoặc Excel bao gồm dòng tiêu đề và dán vào đây...\nVí dụ:\nMSSV\tHọ và tên\tEmail\tSố điện thoại\nB2101234\tNguyễn Văn A\tan.nv@student.edu.vn\t0912345678`}
                  className="w-full h-44 p-3 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Mẹo:</strong> Mở bảng tính Google Sheets của bạn, bôi đen vùng dữ liệu có dòng tiêu đề tiếng Việt, nhấn <strong>Ctrl+C</strong> và dán trực tiếp vào ô trên. Hệ thống sẽ tự động phân tách cột và nhận diện tiêu đề tiếng Việt chuẩn.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: COLUMN MAPPING */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
                  <Layers className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    Hệ thống đã tự động nhận diện tiêu đề cột từ bảng tính của bạn. Vui lòng kiểm tra lại sự tương ứng giữa <strong>Cột trong Sheet</strong> và <strong>Trường trong Hệ thống</strong>.
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Cột trong Google Sheet</th>
                        <th className="py-2.5 px-3">Mẫu giá trị dòng 1</th>
                        <th className="py-2.5 px-3">Trường tương ứng trong ChapterOS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedHeaders.map((header) => {
                        const mappedKey = columnMapping[header] || '';
                        const sampleVal = String(rawRowsData[0]?.[header] || '—');

                        return (
                          <tr key={header} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{header}</td>
                            <td className="py-2 px-3 text-slate-500 font-mono max-w-[160px] truncate">
                              {sampleVal}
                            </td>
                            <td className="py-2 px-3">
                              <Select
                                value={mappedKey || '_none'}
                                onValueChange={(val) => handleMappingChange(header, val)}
                              >
                                <SelectTrigger className={`w-full h-8 text-xs font-medium ${
                                  mappedKey && mappedKey !== '_none'
                                    ? 'bg-blue-50/60 border-blue-300 text-blue-900 font-semibold'
                                    : 'bg-white border-slate-300 text-slate-500'
                                }`}>
                                  <SelectValue placeholder="-- Bỏ qua cột này --" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none">-- Bỏ qua cột này --</SelectItem>
                                  {fields.map((f) => (
                                    <SelectItem key={f.key} value={f.key}>
                                      {f.label} {f.isRequired ? '(*)' : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Missing Required Fields Alert */}
                {(() => {
                  const mappedKeys = new Set(Object.values(columnMapping));
                  const missing = fields.filter((f) => f.isRequired && !mappedKeys.has(f.key));
                  if (missing.length === 0) return null;
                  return (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <div>
                        Chưa khớp trường bắt buộc: <strong>{missing.map((m) => m.label).join(', ')}</strong>. Vui lòng chọn cột tương ứng trước khi tiếp tục.
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* STEP 3: PREVIEW & CONFLICT INSPECTION */}
            {currentStep === 3 && previewResult && (
              <div className="space-y-4">
                {/* Summary Stat Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200">
                    <div className="text-base font-bold text-slate-800">{previewResult.summary.totalRows}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">Tổng số dòng</div>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="text-base font-bold text-emerald-700">{previewResult.summary.validRows}</div>
                    <div className="text-emerald-800 text-[11px] mt-0.5">Hợp lệ hoàn toàn</div>
                  </div>
                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-base font-bold text-blue-700">{previewResult.summary.duplicateRows}</div>
                    <div className="text-blue-800 text-[11px] mt-0.5">Trùng MSSV/ID</div>
                  </div>
                  <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-base font-bold text-purple-700">{previewResult.summary.conflictRows}</div>
                    <div className="text-purple-800 text-[11px] mt-0.5">Xung đột dữ liệu</div>
                  </div>
                  <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 col-span-2 sm:col-span-1">
                    <div className="text-base font-bold text-rose-700">{previewResult.summary.invalidRows}</div>
                    <div className="text-rose-800 text-[11px] mt-0.5">Lỗi không thể nhập</div>
                  </div>
                </div>

                {/* Interactive Table */}
                <ImportPreviewTable
                  module={module}
                  rows={previewResult.rows}
                  onResolutionChange={handleResolutionChange}
                />
              </div>
            )}

            {/* STEP 4: POLICIES & COMMIT */}
            {currentStep === 4 && previewResult && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-3">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                    Chính sách xử lý bản ghi trùng lặp & xung đột:
                  </div>

                  {/* Duplicate Policy */}
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-800">1. Khi gặp bản ghi đã tồn tại (Trùng MSSV / ID):</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        {
                          key: 'skip',
                          title: 'Bỏ qua (Khuyên dùng)',
                          desc: 'Giữ nguyên dữ liệu hiện có trong Supabase, không thay đổi.',
                        },
                        {
                          key: 'update',
                          title: 'Cập nhật đè (Upsert)',
                          desc: 'Cập nhật các trường thông tin mới từ Google Sheets vào hồ sơ.',
                        },
                        {
                          key: 'create',
                          title: 'Tạo mới song song',
                          desc: 'Tạo bản ghi mới nếu schema cho phép không trùng khóa chính.',
                        },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setDuplicatePolicy(item.key as DuplicatePolicy)}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                            duplicatePolicy === item.key
                              ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-semibold text-slate-900">{item.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conflict Policy */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <label className="font-medium text-slate-800">2. Khi phát hiện xung đột giá trị cụ thể:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConflictPolicy('use_sheet')}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                          conflictPolicy === 'use_sheet'
                            ? 'border-purple-600 bg-purple-50/60 ring-1 ring-purple-500'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-semibold text-purple-900">Ưu tiên giá trị từ Google Sheets</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Dùng giá trị trên Sheet để ghi nhận.</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConflictPolicy('keep_supabase')}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                          conflictPolicy === 'keep_supabase'
                            ? 'border-slate-800 bg-slate-100 ring-1 ring-slate-700'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-semibold text-slate-900">Giữ nguyên giá trị gốc trong Supabase</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Không thay đổi các trường có xung đột.</div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Final Confirmation Banner */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    Sẵn sàng xử lý <strong>{previewResult.rows.length - previewResult.summary.invalidRows}</strong> dòng dữ liệu hợp lệ vào cơ sở dữ liệu Supabase của Chi hội.
                    {previewResult.summary.invalidRows > 0 && (
                      <span className="block text-rose-700 font-medium mt-0.5">
                        Lưu ý: {previewResult.summary.invalidRows} dòng bị lỗi sẽ tự động được bỏ qua và ghi vào nhật ký thất bại.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between w-full">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                  className="text-xs gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-xs"
                >
                  Hủy
                </Button>
              )}

              {currentStep === 1 && (
                <Button
                  size="sm"
                  onClick={handleParseInputData}
                  disabled={!pastedData.trim()}
                  className="bg-blue-600 text-white hover:bg-blue-700 text-xs gap-1.5"
                >
                  Tiếp tục: Khớp cột <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}

              {currentStep === 2 && (
                <Button
                  size="sm"
                  onClick={handleValidateAndPreview}
                  disabled={isValidating}
                  className="bg-blue-600 text-white hover:bg-blue-700 text-xs gap-1.5"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang đối soát...
                    </>
                  ) : (
                    <>
                      Đối soát & Xem trước <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              )}

              {currentStep === 3 && (
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(4)}
                  className="bg-blue-600 text-white hover:bg-blue-700 text-xs gap-1.5"
                >
                  Thiết lập chính sách & Xác nhận <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}

              {currentStep === 4 && (
                <Button
                  size="sm"
                  onClick={handleExecuteImport}
                  disabled={executeImportMutation.isPending}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs gap-1.5"
                >
                  {executeImportMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang nhập dữ liệu...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Bắt đầu Nhập vào Supabase
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <ImportResultDialog
        open={resultDialogOpen}
        onOpenChange={setResultDialogOpen}
        result={executionResult}
        onDone={handleFinish}
      />
    </>
  );
}
