import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  User,
  Layers,
  Database,
  Code2,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  FileText,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import type { AuditLogItemWithActor } from '../types/audit-log.types';
import {
  formatAuditTimestamp,
  formatRelativeTime,
  AUDIT_MODULE_CONFIG,
  inferActionImpact,
  ACTION_IMPACT_MAP,
  sanitizeMetadata,
} from '../utils/audit-log-formatter';
import { AuditLogDiffViewer } from './AuditLogDiffViewer';

interface AuditLogDetailModalProps {
  log: AuditLogItemWithActor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogDetailModal({
  log,
  isOpen,
  onClose,
}: AuditLogDetailModalProps) {
  const [copiedTraceId, setCopiedTraceId] = useState(false);
  const [copiedEntityId, setCopiedEntityId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeTab, setActiveTab] = useState<'diff' | 'raw'>('diff');

  if (!log) return null;

  const sanitizedMetadata = sanitizeMetadata(log.metadata);
  const impact = inferActionImpact(log.action);
  const impactConfig = ACTION_IMPACT_MAP[impact] || ACTION_IMPACT_MAP.info;

  const moduleConfig = AUDIT_MODULE_CONFIG[log.module] || {
    label: log.module,
    color: '#475569',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-700',
    iconName: 'Shield',
  };

  const handleCopyTraceId = () => {
    navigator.clipboard.writeText(log.id);
    setCopiedTraceId(true);
    setTimeout(() => setCopiedTraceId(false), 2000);
  };

  const handleCopyEntityId = () => {
    if (!log.entityId) return;
    navigator.clipboard.writeText(log.entityId);
    setCopiedEntityId(true);
    setTimeout(() => setCopiedEntityId(false), 2000);
  };

  const handleCopyJson = () => {
    const exportable = {
      ...log,
      metadata: sanitizedMetadata,
    };
    navigator.clipboard.writeText(JSON.stringify(exportable, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-slate-200 shadow-xl rounded-2xl">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 bg-slate-50/60 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-xs py-0.5 px-2 font-semibold border ${moduleConfig.bgClass} ${moduleConfig.borderClass} ${moduleConfig.textClass}`}
              >
                {moduleConfig.label}
              </Badge>

              <Badge
                variant="outline"
                className={`text-xs py-0.5 px-2 font-semibold border ${impactConfig.bgClass} ${impactConfig.borderClass} ${impactConfig.textClass}`}
              >
                {impactConfig.label}
              </Badge>

              <button
                type="button"
                onClick={handleCopyTraceId}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 transition-colors"
                title="Sao chép ID sự kiện"
              >
                <span>ID: #{log.id.slice(0, 8)}</span>
                {copiedTraceId ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400" />
                )}
              </button>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatAuditTimestamp(log.createdAt)}</span>
              <span className="text-[11px] text-slate-400">({formatRelativeTime(log.createdAt)})</span>
            </div>
          </div>

          <DialogTitle className="text-lg font-bold text-slate-900 leading-snug">
            {log.actionLabel}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 pt-0.5">
            Mã hành vi hệ thống: <span className="font-mono text-slate-700 font-semibold">{log.action}</span>
          </DialogDescription>
        </div>

        <div className="p-5 space-y-5">
          {/* Identity Cards (Actor & Target) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Actor Card */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Người thực hiện</span>
                </span>
                {log.actor ? (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                    Thành viên
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                    Hệ thống
                  </span>
                )}
              </div>

              <div className="pt-1 space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  {log.actor ? log.actor.fullName : 'Hệ thống tự động (Automated Job)'}
                </p>
                {log.actor && (
                  <div className="text-xs text-slate-600 space-y-0.5">
                    {log.actor.studentId && (
                      <p className="font-mono text-slate-700 font-medium">MSSV: {log.actor.studentId}</p>
                    )}
                    {log.actor.email && <p className="text-slate-500">{log.actor.email}</p>}
                  </div>
                )}
                {log.userId && (
                  <p className="text-[10px] text-slate-400 font-mono pt-1">
                    User UUID: {log.userId}
                  </p>
                )}
              </div>
            </div>

            {/* Target Entity Card */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Đối tượng tác động</span>
                </span>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-mono">
                  {log.entityType}
                </span>
              </div>

              <div className="pt-1 space-y-1">
                <p className="text-sm font-bold text-slate-900 capitalize">
                  {log.entityType}
                </p>
                {log.entityId ? (
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-xs font-mono text-slate-700 truncate max-w-[200px]" title={log.entityId}>
                      {log.entityId}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-xs text-slate-400 hover:text-slate-700"
                      onClick={handleCopyEntityId}
                      title="Sao chép ID đối tượng"
                    >
                      {copiedEntityId ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Không có ID đối tượng cụ thể (Global/Batch)</p>
                )}
                <p className="text-[10px] text-slate-400 font-mono pt-1">
                  Org ID: {log.organizationId}
                </p>
              </div>
            </div>
          </div>

          {/* Tab Selector: Formatted Changes vs Raw JSON */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('diff')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'diff'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Chi tiết thay đổi & Tham số</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('raw')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'raw'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Payload JSON Kỹ thuật</span>
                </button>
              </div>

              {activeTab === 'raw' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs text-slate-700 bg-white hover:bg-slate-50"
                  onClick={handleCopyJson}
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-emerald-600" />
                      <span>Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      <span>Sao chép JSON</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'diff' ? (
              <AuditLogDiffViewer metadata={log.metadata} />
            ) : (
              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-80 leading-relaxed border border-slate-800">
                  {JSON.stringify(
                    {
                      id: log.id,
                      organization_id: log.organizationId,
                      created_at: log.createdAt,
                      action: log.action,
                      entity_type: log.entityType,
                      entity_id: log.entityId,
                      actor: log.actor,
                      metadata: sanitizedMetadata,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>

          {/* Immutable Security Notice Footer */}
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Bản ghi kiểm toán bảo mật bất biến</span>
              <p className="text-[11px] text-emerald-700/90 leading-relaxed">
                Nhật ký này được tạo tự động bởi hệ thống và không thể bị sửa đổi, làm giả hoặc xóa bỏ bởi bất kỳ người dùng nào theo chính sách bảo mật ChapterOS.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
