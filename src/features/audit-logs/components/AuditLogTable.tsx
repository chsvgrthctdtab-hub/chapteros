import React from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  History,
  Shield,
  ArrowRight,
  User,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { AuditLogItemWithActor } from '../types/audit-log.types';
import {
  formatAuditTimestamp,
  formatRelativeTime,
  AUDIT_MODULE_CONFIG,
  inferActionImpact,
  ACTION_IMPACT_MAP,
  formatMetadataValue,
} from '../utils/audit-log-formatter';
import { EmptyState } from '@/components/common/EmptyState';

interface AuditLogTableProps {
  logs: AuditLogItemWithActor[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newSize: number) => void;
  onSelectLog: (log: AuditLogItemWithActor) => void;
}

export function AuditLogTable({
  logs,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onSelectLog,
}: AuditLogTableProps) {
  if (!isLoading && logs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-8 shadow-2xs">
        <EmptyState
          icon={<History className="w-9 h-9 text-slate-400" />}
          title="Không tìm thấy nhật ký kiểm toán"
          description="Chưa có thao tác nào được ghi nhận hoặc không khớp với tiêu chí tìm kiếm hiện tại."
        />
      </div>
    );
  }

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
      {/* Desktop Table View (hidden on small mobile, visible md+) */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/90 border-b border-slate-200/80">
            <TableRow>
              <TableHead className="w-[170px] text-xs font-bold text-slate-700 py-3">
                Thời gian
              </TableHead>
              <TableHead className="w-[210px] text-xs font-bold text-slate-700 py-3">
                Người thực hiện
              </TableHead>
              <TableHead className="w-[130px] text-xs font-bold text-slate-700 py-3">
                Phân hệ
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-700 py-3">
                Hành động & Đối tượng
              </TableHead>
              <TableHead className="w-[200px] text-xs font-bold text-slate-700 py-3">
                Biến động dữ liệu
              </TableHead>
              <TableHead className="w-[90px] text-right text-xs font-bold text-slate-700 py-3">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {logs.map((log) => {
              const moduleConfig = AUDIT_MODULE_CONFIG[log.module] || {
                label: log.module,
                bgClass: 'bg-slate-50',
                borderClass: 'border-slate-200',
                textClass: 'text-slate-700',
              };

              const impact = inferActionImpact(log.action);
              const impactConfig = ACTION_IMPACT_MAP[impact] || ACTION_IMPACT_MAP.info;
              const actorName = log.actor?.fullName || 'Hệ thống tự động';
              const initial = actorName.charAt(0).toUpperCase();

              // Quick change summary preview
              const prevStatus = log.metadata?.previous_status || log.metadata?.old_status;
              const newStatus = log.metadata?.new_status || log.metadata?.target_status;
              const amount = log.metadata?.amount;
              const note = log.metadata?.note || log.metadata?.reason;

              return (
                <TableRow
                  key={log.id}
                  className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  onClick={() => onSelectLog(log)}
                >
                  {/* Timestamp */}
                  <TableCell className="py-3 align-top">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px]">{formatAuditTimestamp(log.createdAt)}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {formatRelativeTime(log.createdAt)}
                      </div>
                    </div>
                  </TableCell>

                  {/* Actor */}
                  <TableCell className="py-3 align-top">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-7 h-7 ring-1 ring-slate-200 shrink-0">
                        {log.actor?.avatarUrl && (
                          <AvatarImage src={log.actor.avatarUrl} alt={actorName} />
                        )}
                        <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5 truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {actorName}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate font-mono">
                          {log.actor?.studentId
                            ? `MSSV: ${log.actor.studentId}`
                            : log.actor?.email || (log.userId ? 'System ID' : 'Automated Job')}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Module Badge */}
                  <TableCell className="py-3 align-top">
                    <Badge
                      variant="outline"
                      className={`text-[10px] py-0.5 px-2 font-semibold border ${moduleConfig.bgClass} ${moduleConfig.borderClass} ${moduleConfig.textClass}`}
                    >
                      {moduleConfig.label}
                    </Badge>
                  </TableCell>

                  {/* Action and Target Entity */}
                  <TableCell className="py-3 align-top">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          {log.actionLabel}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] py-0 px-1.5 font-semibold border ${impactConfig.bgClass} ${impactConfig.borderClass} ${impactConfig.textClass}`}
                        >
                          {impactConfig.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono flex-wrap">
                        <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-700 font-sans text-[10px] font-semibold">
                          {log.entityType}
                        </span>
                        {log.entityId && (
                          <span className="text-slate-400 truncate max-w-[140px]" title={log.entityId}>
                            #{log.entityId.slice(0, 8)}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Quick Change Preview */}
                  <TableCell className="py-3 align-top">
                    <div className="text-xs space-y-1">
                      {prevStatus && newStatus ? (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-mono text-[10px] border border-rose-200">
                            {formatMetadataValue(prevStatus)}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] border border-emerald-200 font-semibold">
                            {formatMetadataValue(newStatus)}
                          </span>
                        </div>
                      ) : amount !== undefined ? (
                        <div className="font-mono text-emerald-700 font-semibold text-xs">
                          {new Intl.NumberFormat('vi-VN').format(Number(amount))} ₫
                        </div>
                      ) : note ? (
                        <p className="text-[11px] text-slate-600 truncate max-w-[190px]" title={String(note)}>
                          {String(note)}
                        </p>
                      ) : Object.keys(log.metadata || {}).length > 0 ? (
                        <span className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                          {Object.keys(log.metadata).length} tham số
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">—</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Action Button */}
                  <TableCell className="py-3 text-right align-middle">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2 text-slate-600 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLog(log);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>Xem</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List View (visible < md) */}
      <div className="md:hidden divide-y divide-slate-100">
        {logs.map((log) => {
          const moduleConfig = AUDIT_MODULE_CONFIG[log.module] || {
            label: log.module,
            bgClass: 'bg-slate-50',
            borderClass: 'border-slate-200',
            textClass: 'text-slate-700',
          };
          const impact = inferActionImpact(log.action);
          const impactConfig = ACTION_IMPACT_MAP[impact] || ACTION_IMPACT_MAP.info;
          const actorName = log.actor?.fullName || 'Hệ thống tự động';

          return (
            <div
              key={log.id}
              onClick={() => onSelectLog(log)}
              className="p-4 space-y-2.5 hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] py-0 px-1.5 font-semibold border ${moduleConfig.bgClass} ${moduleConfig.borderClass} ${moduleConfig.textClass}`}
                  >
                    {moduleConfig.label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[9px] py-0 px-1.5 font-semibold border ${impactConfig.bgClass} ${impactConfig.borderClass} ${impactConfig.textClass}`}
                  >
                    {impactConfig.label}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{formatRelativeTime(log.createdAt)}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-900 leading-snug">
                  {log.actionLabel}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                  <span className="bg-slate-100 px-1 rounded text-slate-700">{log.entityType}</span>
                  {log.entityId && <span>#{log.entityId.slice(0, 8)}</span>}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">{actorName}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLog(log);
                  }}
                >
                  Chi tiết
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 px-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span>
            Hiển thị <strong className="text-slate-900">{startItem}</strong> -{' '}
            <strong className="text-slate-900">{endItem}</strong> trên tổng số{' '}
            <strong className="text-slate-900">{totalCount}</strong> sự kiện
          </span>

          {onPageSizeChange && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <span>Mỗi trang:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => onPageSizeChange(Number(val))}
              >
                <SelectTrigger className="h-7 text-xs bg-white border-slate-200 w-auto min-w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-8 px-2.5 text-xs bg-white hover:bg-slate-50"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            <span>Trang trước</span>
          </Button>

          <span className="font-semibold text-slate-700 px-2">
            Trang {currentPage} / {Math.max(1, totalPages)}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isLoading}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-8 px-2.5 text-xs bg-white hover:bg-slate-50"
          >
            <span>Trang sau</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
