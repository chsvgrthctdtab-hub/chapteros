import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Nhập hội viên từ file Excel / CSV
          </DialogTitle>
          <DialogDescription>
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
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">Kéo thả file vào đây hoặc bấm để chọn</p>
              <p className="text-xs text-slate-400 mt-1">Hỗ trợ: .xlsx, .xls, .csv — Tối đa 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Yêu cầu cột */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-1">
              <p className="font-semibold text-amber-800">📋 Yêu cầu file:</p>
              <p className="text-amber-700">
                <span className="font-medium">Bắt buộc:</span> Họ và tên, MSSV, Lớp, Khóa
              </p>
              <p className="text-amber-700">
                <span className="font-medium">Tùy chọn:</span> Email, Số điện thoại, Ngành, Ngày tham gia, Ghi chú
              </p>
              <p className="text-amber-700">
                <span className="font-medium">Trùng MSSV:</span> Dữ liệu cũ sẽ được ghi đè
              </p>
            </div>

            {/* Tải file mẫu */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={(e) => { e.stopPropagation(); downloadTemplateFile(); }}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Tải file Excel mẫu
            </Button>
          </div>
        )}

        {/* BƯỚC 2: PREVIEW */}
        {step === 'preview' && validation && (
          <div className="space-y-3">
            {/* Tổng kết */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{validation.valid.length}</p>
                <p className="text-xs text-emerald-600">Dòng hợp lệ</p>
              </div>
              <div className={`rounded-lg p-3 text-center border ${validation.errors.length > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-2xl font-bold ${validation.errors.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>{validation.errors.length}</p>
                <p className={`text-xs ${validation.errors.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>Dòng lỗi</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-slate-600">{validation.valid.length + validation.errors.length}</p>
                <p className="text-xs text-slate-500">Tổng dòng</p>
              </div>
            </div>

            {/* Preview dữ liệu hợp lệ */}
            {validation.valid.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 border-b">
                  Xem trước {Math.min(5, validation.valid.length)} dòng đầu
                </div>
                <div className="overflow-x-auto max-h-44 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium text-slate-600">Họ và tên</th>
                        <th className="px-2 py-1.5 text-left font-medium text-slate-600">MSSV</th>
                        <th className="px-2 py-1.5 text-left font-medium text-slate-600">Lớp</th>
                        <th className="px-2 py-1.5 text-left font-medium text-slate-600">Khóa</th>
                        <th className="px-2 py-1.5 text-left font-medium text-slate-600">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validation.valid.slice(0, 5).map((row) => (
                        <tr key={row.rowIndex} className="hover:bg-slate-50">
                          <td className="px-2 py-1.5 font-medium text-slate-800">{row.fullName}</td>
                          <td className="px-2 py-1.5 font-mono text-slate-600">{row.studentId}</td>
                          <td className="px-2 py-1.5 text-slate-600">{row.className}</td>
                          <td className="px-2 py-1.5 text-slate-600">{row.cohort}</td>
                          <td className="px-2 py-1.5 text-slate-500">{row.email || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {validation.valid.length > 5 && (
                  <div className="px-3 py-1.5 text-xs text-slate-500 bg-slate-50 border-t">
                    ... và {validation.valid.length - 5} dòng khác
                  </div>
                )}
              </div>
            )}

            {/* Lỗi */}
            {validation.errors.length > 0 && (
              <div className="border border-red-200 rounded-lg overflow-hidden">
                <div className="bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 border-b flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {validation.errors.length} dòng sẽ bị bỏ qua do lỗi
                </div>
                <div className="max-h-28 overflow-y-auto divide-y divide-red-100">
                  {validation.errors.map((e) => (
                    <div key={e.rowIndex} className="px-3 py-1.5 text-xs text-red-700 flex gap-2">
                      <span className="font-mono text-red-400 shrink-0">Dòng {e.rowIndex}:</span>
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
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-2xl font-bold text-emerald-700">{importResult.inserted}</p>
                <p className="text-xs text-emerald-600">Thêm mới</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-2xl font-bold text-blue-700">{importResult.updated}</p>
                <p className="text-xs text-blue-600">Cập nhật</p>
              </div>
              <div className={`rounded-lg p-3 border ${importResult.failed.length > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-2xl font-bold ${importResult.failed.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>{importResult.failed.length}</p>
                <p className={`text-xs ${importResult.failed.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>Thất bại</p>
              </div>
            </div>
            {importResult.failed.length > 0 && (
              <div className="border border-red-200 rounded-lg overflow-hidden">
                <div className="bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 border-b flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5" />
                  Các hội viên không thể import
                </div>
                <div className="max-h-32 overflow-y-auto divide-y divide-red-100">
                  {importResult.failed.map((f) => (
                    <div key={f.studentId} className="px-3 py-1.5 text-xs flex gap-2">
                      <span className="font-mono text-slate-500 shrink-0">MSSV {f.studentId}:</span>
                      <span className="text-red-700">{f.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>Hủy</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => { setStep('upload'); setFileName(''); setValidation(null); }}>
                Chọn file khác
              </Button>
              <Button
                onClick={handleImport}
                disabled={!validation?.valid.length || isImporting}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
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
              <Button variant="outline" onClick={reset}>Import thêm</Button>
              <Button onClick={handleClose} className="bg-emerald-700 hover:bg-emerald-800 text-white">
                Hoàn thành
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
