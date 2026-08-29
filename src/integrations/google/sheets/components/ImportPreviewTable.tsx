import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Copy,
  AlertCircle,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ImportPreviewRow, ImportRowStatus, GoogleSheetModule } from '../google-sheets.types';
import { getModuleFields } from '../sheet-mappings';

interface ImportPreviewTableProps {
  module: GoogleSheetModule;
  rows: ImportPreviewRow[];
  onResolutionChange?: (rowIndex: number, fieldKey: string, resolution: 'keep_supabase' | 'use_sheet') => void;
}

export function ImportPreviewTable({ module, rows, onResolutionChange }: ImportPreviewTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const fields = useMemo(() => getModuleFields(module), [module]);

  const toggleRow = (rowIndex: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  };

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const ident = (r.identityKeyValue || '').toLowerCase();
        const json = JSON.stringify(r.rawValues).toLowerCase();
        if (!ident.includes(term) && !json.includes(term)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, searchTerm]);

  const getStatusBadge = (status: ImportRowStatus, isDuplicate: boolean, conflictCount: number) => {
    switch (status) {
      case 'valid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Hợp lệ
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Cảnh báo
          </span>
        );
      case 'duplicate':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <Copy className="w-3.5 h-3.5 text-blue-600" />
            Đã tồn tại
          </span>
        );
      case 'conflict':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
            Xung đột ({conflictCount})
          </span>
        );
      case 'invalid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Không hợp lệ
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tìm kiếm dòng, MSSV, tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Lọc:
          </span>
          {[
            { key: 'all', label: `Tất cả (${rows.length})` },
            { key: 'valid', label: `Hợp lệ (${rows.filter((r) => r.status === 'valid').length})` },
            { key: 'warning', label: `Cảnh báo (${rows.filter((r) => r.status === 'warning').length})` },
            { key: 'duplicate', label: `Trùng (${rows.filter((r) => r.status === 'duplicate').length})` },
            { key: 'conflict', label: `Xung đột (${rows.filter((r) => r.status === 'conflict').length})` },
            { key: 'invalid', label: `Lỗi (${rows.filter((r) => r.status === 'invalid').length})` },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                statusFilter === item.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[380px] overflow-y-auto bg-white shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 z-10">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">Dòng</th>
              <th className="py-2.5 px-3 w-28">Trạng thái</th>
              <th className="py-2.5 px-3">{fields[0]?.label || 'Định danh'}</th>
              <th className="py-2.5 px-3">{fields[1]?.label || 'Thông tin'}</th>
              <th className="py-2.5 px-3">{fields[2]?.label || 'Phụ lục'}</th>
              <th className="py-2.5 px-3 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                  Không tìm thấy dòng dữ liệu nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const isExpanded = expandedRows.has(row.rowIndex);
                const firstVal = String(row.parsedData[fields[0]?.key] || row.rawValues[fields[0]?.label] || '—');
                const secondVal = String(row.parsedData[fields[1]?.key] || row.rawValues[fields[1]?.label] || '—');
                const thirdVal = String(row.parsedData[fields[2]?.key] || row.rawValues[fields[2]?.label] || '—');

                return (
                  <tr
                    key={row.rowIndex}
                    className={`transition-colors ${
                      row.status === 'invalid'
                        ? 'bg-rose-50/40 hover:bg-rose-50/70'
                        : row.status === 'conflict'
                        ? 'bg-purple-50/40 hover:bg-purple-50/70'
                        : row.status === 'warning'
                        ? 'bg-amber-50/40 hover:bg-amber-50/70'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2 px-3 text-center font-mono text-slate-500">{row.rowIndex}</td>
                    <td className="py-2 px-3">
                      {getStatusBadge(row.status, row.isDuplicate, row.conflicts.length)}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900">{firstVal}</td>
                    <td className="py-2 px-3 text-slate-700">{secondVal}</td>
                    <td className="py-2 px-3 text-slate-500 truncate max-w-[150px]">{thirdVal}</td>
                    <td className="py-2 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(row.rowIndex)}
                        className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        {row.errors.length > 0 || row.conflicts.length > 0 ? (
                          <span className="ml-1 text-rose-600 font-semibold">
                            ({row.errors.length + row.conflicts.length})
                          </span>
                        ) : null}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Expanded Row Detail Inspection (if any) */}
      {filteredRows.some((r) => expandedRows.has(r.rowIndex)) && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>Chi tiết dòng được chọn:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedRows(new Set())}
              className="h-6 px-2 text-xs text-slate-500"
            >
              Đóng tất cả
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredRows
              .filter((r) => expandedRows.has(r.rowIndex))
              .map((row) => (
                <div
                  key={row.rowIndex}
                  className="p-2.5 bg-white rounded border border-slate-200 text-xs space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="font-mono text-slate-500">Dòng {row.rowIndex}</span>
                    <span>{getStatusBadge(row.status, row.isDuplicate, row.conflicts.length)}</span>
                  </div>

                  {/* Errors */}
                  {row.errors.length > 0 && (
                    <div className="p-2 bg-rose-50 text-rose-800 rounded border border-rose-100 space-y-0.5">
                      <div className="font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Lỗi cần sửa:
                      </div>
                      <ul className="list-disc list-inside pl-1 text-[11px] space-y-0.5">
                        {row.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {row.warnings.length > 0 && (
                    <div className="p-2 bg-amber-50 text-amber-800 rounded border border-amber-100 space-y-0.5">
                      <div className="font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Cảnh báo:
                      </div>
                      <ul className="list-disc list-inside pl-1 text-[11px] space-y-0.5">
                        {row.warnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Conflicts & Resolution Selector */}
                  {row.conflicts.length > 0 && (
                    <div className="p-2 bg-purple-50 text-purple-900 rounded border border-purple-100 space-y-1.5">
                      <div className="font-semibold flex items-center gap-1">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-purple-700" /> Xung đột dữ liệu với Supabase:
                      </div>
                      {row.conflicts.map((conflict, cIdx) => (
                        <div
                          key={cIdx}
                          className="bg-white p-2 rounded border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{conflict.fieldLabel}:</span>
                            <div className="flex items-center gap-2 text-[11px] mt-0.5">
                              <span className="text-slate-500">Hiện tại (Supabase):</span>
                              <span className="font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                {String(conflict.existingValue || 'Trống')}
                              </span>
                              <span className="text-slate-400">→</span>
                              <span className="text-purple-700">Mới (Sheet):</span>
                              <span className="font-medium text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">
                                {String(conflict.incomingValue || 'Trống')}
                              </span>
                            </div>
                          </div>

                          {onResolutionChange && (
                            <div className="flex items-center gap-1 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => onResolutionChange(row.rowIndex, conflict.fieldKey, 'keep_supabase')}
                                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                                  conflict.selectedResolution === 'keep_supabase'
                                    ? 'bg-slate-800 text-white font-medium'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                Giữ Supabase
                              </button>
                              <button
                                type="button"
                                onClick={() => onResolutionChange(row.rowIndex, conflict.fieldKey, 'use_sheet')}
                                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                                  conflict.selectedResolution === 'use_sheet'
                                    ? 'bg-purple-700 text-white font-medium'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                Dùng Sheet
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
