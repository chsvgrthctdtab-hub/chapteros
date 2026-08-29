import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, AlertCircle, Sparkles, FileText } from 'lucide-react';
import {
  formatMetadataKey,
  formatMetadataValue,
  sanitizeMetadata,
} from '../utils/audit-log-formatter';

interface AuditLogDiffViewerProps {
  metadata: Record<string, unknown> | null | undefined;
  className?: string;
}

interface DiffRow {
  key: string;
  label: string;
  before: unknown;
  after: unknown;
}

export function AuditLogDiffViewer({ metadata, className = '' }: AuditLogDiffViewerProps) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
        Không có thông số thay đổi chi tiết được ghi nhận cho sự kiện này.
      </div>
    );
  }

  const clean = sanitizeMetadata(metadata);

  // 1. Status transition check (e.g. previous_status -> new_status)
  const prevStatus = clean.previous_status || clean.old_status || clean.from_status;
  const newStatus = clean.new_status || clean.to_status || clean.target_status;

  // 2. Structured before/after or old/new objects
  const beforeObj = (clean.before || clean.previous_state || clean.old) as Record<string, unknown> | undefined;
  const afterObj = (clean.after || clean.new_state || clean.new) as Record<string, unknown> | undefined;

  // Extract explicit diff rows
  const diffRows: DiffRow[] = [];
  if (beforeObj && typeof beforeObj === 'object' && afterObj && typeof afterObj === 'object') {
    const allKeys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]));
    allKeys.forEach((key) => {
      const bVal = beforeObj[key];
      const aVal = afterObj[key];
      if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
        diffRows.push({
          key,
          label: formatMetadataKey(key),
          before: bVal,
          after: aVal,
        });
      }
    });
  }

  // Check direct old_ vs new_ fields (e.g., old_role vs new_role, old_amount vs new_amount)
  const remainingKeys = Object.keys(clean).filter((k) => {
    if (k === 'before' || k === 'after' || k === 'previous_state' || k === 'new_state' || k === 'old' || k === 'new') return false;
    if (k === 'previous_status' || k === 'new_status' || k === 'old_status' || k === 'to_status' || k === 'from_status' || k === 'target_status') return false;
    return true;
  });

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Visual Status Transition Banner */}
      {Boolean(prevStatus && newStatus) && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs font-bold text-slate-700">Chuyển đổi trạng thái</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold font-mono">
              {formatMetadataValue(prevStatus)}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold font-mono">
              {formatMetadataValue(newStatus)}
            </span>
          </div>
        </div>
      )}

      {/* Field-by-Field Before vs After Diff Table */}
      {diffRows.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Chi tiết thay đổi trước & sau ({diffRows.length} trường)</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="grid grid-cols-12 bg-slate-100/80 p-2.5 px-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <div className="col-span-4">Trường thông tin</div>
              <div className="col-span-4 text-rose-700">Trước thay đổi</div>
              <div className="col-span-4 text-emerald-700">Sau thay đổi</div>
            </div>

            <div className="divide-y divide-slate-100 bg-white">
              {diffRows.map((row) => (
                <div key={row.key} className="grid grid-cols-12 p-2.5 px-3 text-xs items-center gap-2 hover:bg-slate-50/60">
                  <div className="col-span-4 font-semibold text-slate-700 truncate" title={row.label}>
                    {row.label}
                  </div>
                  <div className="col-span-4">
                    <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200/80 font-mono text-[11px] break-all">
                      {formatMetadataValue(row.before)}
                    </span>
                  </div>
                  <div className="col-span-4">
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-mono text-[11px] break-all font-semibold">
                      {formatMetadataValue(row.after)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* General Parameter Key-Values */}
      {remainingKeys.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Thông số ngữ cảnh & Dữ liệu bổ sung ({remainingKeys.length})</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
            {remainingKeys.map((key) => (
              <div
                key={key}
                className="p-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs hover:bg-slate-50/50"
              >
                <span className="font-semibold text-slate-700 shrink-0 sm:w-1/3">
                  {formatMetadataKey(key)}
                </span>
                <span className="text-slate-900 font-mono sm:text-right break-all">
                  {formatMetadataValue(clean[key])}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
