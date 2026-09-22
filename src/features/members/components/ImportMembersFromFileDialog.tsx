import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import { parseFileToRows, validateImportRows, downloadTemplateFile } from '../utils/member-import.utils';
import type { ImportedMemberRow, ImportValidationResult } from '../utils/member-import.utils';
import { useBulkImportMembers } from '../mutations/member.mutations';
import type { BulkImportResult } from '../mutations/member.mutations';

interface ImportMembersFromFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  onSuccess?: () => void;
}

type Step = 'upload' | 'preview' | 'result';

export function ImportMembersFromFileDialog({
  open, onOpenChange, organizationId, onSuccess,
}: ImportMembersFromFileDialogProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [validation, setValidation] = useState<ImportValidationResult | null>(null);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const bulkImportMutation = useBulkImportMembers(organizationId);

  const reset = () => {
    setStep('upload');
    setFileName('');
    setValidation(null);
    setImportResult(null);
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Chỉ hỗ trợ file .xlsx, .xls hoặc .csv');
      return;
    }
    try {
      setFileName(file.name);
      const rows = await parseFileToRows(file);
      if (rows.length === 0) { toast.error('File không có dữ liệu.'); return; }
      const result = validateImportRows(rows);
      setValidation(result);
      setStep('preview');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Lỗi khi đọc file');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const handleImport = async () => {
    if (!validation?.valid.length) return;
    setIsImporting(true);
    try {
      const payload = validation.valid.map((row: ImportedMemberRow) => ({
        student_id: row.studentId,
        full_name: row.fullName,
        class_name: row.className,
        cohort: row.cohort,
        email: row.email || null,
        phone: row.phone || null,
        major: row.major || null,
        joined_date: row.joinedDate || null,
        notes: row.notes || null,
        position: 'Hội viên',
        status: 'active' as const,
      }));
      const result = await bulkImportMutation.mutateAsync(payload);
      setImportResult(result);
      setStep('result');
      onSuccess?.();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Import thất bại');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl rounded-2xl border-hairline bg-white shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-ink-navy">
            <div className="h-8 w-8 rounded-lg bg-[#e6f0ff] text-signal-blue border border-[#d4e4fa] flex items-center justify-center shrink-0">
              <FileSpreadsheet strokeWidth={1.5} className="h-4 w-4" />
            </div>
            <span>Nhập hội viên từ file Excel / CSV</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-gray">
            {step === 'upload' && 'Tải lên file Excel hoặc CSV chứa danh sách hội viên.'}
            {step === 'preview' && `Xem trước dữ liệu từ file "${fileName}"`}
            {step === 'result' && 'Kết quả import hội viên.'}
          </DialogDescription>
        </DialogHeader>

        {/* BƯỚC 1: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-signal-blue bg-[#e6f0ff]/30' : 'border-hairline hover:border-signal-blue/50 hover:bg-cloud'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload strokeWidth={1.5} className="h-10 w-10 mx-auto mb-3 text-mist-gray" />
              <p className="text-sm font-semibold text-ink-navy">Kéo thả file vào đây hoặc bấm để chọn</p>
              <p className="text-xs text-slate-gray mt-1">Hỗ trợ: .xlsx, .xls, .csv — Tối đa 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Yêu cầu cột */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
              <p className="font-semibold text-amber-900">📋 Yêu cầu file:</p>
              <p className="text-amber-800">
                <span className="font-medium">Bắt buộc:</span> Họ và tên, MSSV, Lớp, Khóa
              </p>
              <p className="text-amber-800">
                <span className="font-medium">Tùy chọn:</span> Email, Số điện thoại, Ngành, Ngày tham gia, Ghi chú
              </p>
              <p className="text-amber-800">
                <span className="font-medium">Trùng MSSV:</span> Dữ liệu cũ sẽ được ghi đè
              </p>
            </div>

            {/* Tải file mẫu */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs rounded-lg border-hairline text-ink-navy hover:bg-cloud"
              onClick={(e) => { e.stopPropagation(); downloadTemplateFile(); }}
            >
              <Download className="h-3.5 w-3.5 mr-1.5 text-signal-blue" />
              Tải file Excel mẫu
            </Button>
          </div>
        )}

        {/* BƯỚC 2: PREVIEW */}
        {step === 'preview' && validation && (
          <div className="space-y-3">
            {/* Tổng kết */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700 tabular-nums">{validation.valid.length}</p>
                <p className="text-xs text-emerald-600">Dòng hợp lệ</p>
              </div>
              <div className={`rounded-xl p-3 text-center border ${validation.errors.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-cloud border-hairline'}`}>
                <p className={`text-2xl font-bold tabular-nums ${validation.errors.length > 0 ? 'text-rose-600' : 'text-mist-gray'}`}>{validation.errors.length}</p>
                <p className={`text-xs ${validation.errors.length > 0 ? 'text-rose-600' : 'text-slate-gray'}`}>Dòng lỗi</p>
              </div>
              <div className="bg-cloud border border-hairline rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-ink-navy tabular-nums">{validation.valid.length + validation.errors.length}</p>
                <p className="text-xs text-slate-gray">Tổng dòng</p>
              </div>
            </div>

            {/* Preview dữ liệu hợp lệ */}
            {validation.valid.length > 0 && (
              <div className="border border-hairline rounded-xl overflow-hidden">
                <div className="bg-cloud px-3 py-2 text-xs font-semibold text-slate-gray border-b border-hairline">
                  Xem trước {Math.min(5, validation.valid.length)} dòng đầu
                </div>
                <div className="overflow-x-auto max-h-44 overflow-y-auto">
                  <table className="w-full text-xs text-slate-gray">
                    <thead className="bg-cloud sticky top-0 border-b border-hairline">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-semibold text-ink-navy">Họ và tên</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-ink-navy">MSSV</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-ink-navy">Lớp</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-ink-navy">Khóa</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-ink-navy">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {validation.valid.slice(0, 5).map((row) => (
                        <tr key={row.rowIndex} className="hover:bg-cloud/60">
                          <td className="px-2 py-1.5 font-medium text-ink-navy">{row.fullName}</td>
                          <td className="px-2 py-1.5 tabular-nums text-slate-gray">{row.studentId}</td>
                          <td className="px-2 py-1.5 text-slate-gray">{row.className}</td>
                          <td className="px-2 py-1.5 tabular-nums text-slate-gray">{row.cohort}</td>
                          <td className="px-2 py-1.5 text-slate-gray">{row.email || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {validation.valid.length > 5 && (
                  <div className="px-3 py-1.5 text-xs text-slate-gray bg-cloud border-t border-hairline">
                    ... và {validation.valid.length - 5} dòng khác
                  </div>
                )}
              </div>
            )}

            {/* Lỗi */}
            {validation.errors.length > 0 && (
              <div className="border border-rose-200 rounded-xl overflow-hidden">
                <div className="bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 border-b border-rose-200 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {validation.errors.length} dòng sẽ bị bỏ qua do lỗi
                </div>
                <div className="max-h-28 overflow-y-auto divide-y divide-rose-100">
                  {validation.errors.map((e) => (
                    <div key={e.rowIndex} className="px-3 py-1.5 text-xs text-rose-700 flex gap-2">
                      <span className="tabular-nums text-rose-500 font-semibold shrink-0">Dòng {e.rowIndex}:</span>
                      <span>{e.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BƯỚC 3: KẾT QUẢ */}
        {step === 'result' && importResult && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center">
              <CheckCircle2 strokeWidth={1.5} className="h-12 w-12 text-emerald-600" />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-2xl font-bold text-emerald-700 tabular-nums">{importResult.inserted}</p>
                <p className="text-xs text-emerald-600">Thêm mới</p>
              </div>
              <div className="bg-[#e6f0ff] border border-[#d4e4fa] rounded-xl p-3">
                <p className="text-2xl font-bold text-signal-blue tabular-nums">{importResult.updated}</p>
                <p className="text-xs text-signal-blue">Cập nhật</p>
              </div>
              <div className={`rounded-xl p-3 border ${importResult.failed.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-cloud border-hairline'}`}>
                <p className={`text-2xl font-bold tabular-nums ${importResult.failed.length > 0 ? 'text-rose-600' : 'text-mist-gray'}`}>{importResult.failed.length}</p>
                <p className={`text-xs ${importResult.failed.length > 0 ? 'text-rose-600' : 'text-slate-gray'}`}>Thất bại</p>
              </div>
            </div>
            {importResult.failed.length > 0 && (
              <div className="border border-rose-200 rounded-xl overflow-hidden">
                <div className="bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 border-b border-rose-200 flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5" />
                  Các hội viên không thể import
                </div>
                <div className="max-h-32 overflow-y-auto divide-y divide-rose-100">
                  {importResult.failed.map((f) => (
                    <div key={f.studentId} className="px-3 py-1.5 text-xs flex gap-2">
                      <span className="tabular-nums text-slate-gray font-semibold shrink-0">MSSV {f.studentId}:</span>
                      <span className="text-rose-700">{f.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose} className="rounded-lg border-hairline text-ink-navy hover:bg-cloud text-xs">Hủy</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => { setStep('upload'); setFileName(''); setValidation(null); }} className="rounded-lg border-hairline text-ink-navy hover:bg-cloud text-xs">
                Chọn file khác
              </Button>
              <Button
                onClick={handleImport}
                disabled={!validation?.valid.length || isImporting}
                className="bg-signal-blue hover:bg-[#005be0] text-white rounded-lg text-xs shadow-sm font-semibold"
              >
                {isImporting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang import...</>
                ) : (
                  <>Import {validation?.valid.length} hội viên</>
                )}
              </Button>
            </>
          )}
          {step === 'result' && (
            <>
              <Button variant="outline" onClick={reset} className="rounded-lg border-hairline text-ink-navy hover:bg-cloud text-xs">Import thêm</Button>
              <Button onClick={handleClose} className="bg-signal-blue hover:bg-[#005be0] text-white rounded-lg text-xs shadow-sm font-semibold">
                Hoàn thành
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
