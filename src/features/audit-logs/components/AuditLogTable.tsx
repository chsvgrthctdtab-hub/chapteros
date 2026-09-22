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
  ArrowRight,
  User,
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
      <div className="bg-white rounded-xl border border-hairline p-8 shadow-xs">
        <EmptyState
          icon={<History strokeWidth={1.5} className="w-9 h-9 text-mist-gray" />}
          title="Không tìm thấy nhật ký kiểm toán"
          description="Chưa có thao tác nào được ghi nhận hoặc không khớp với tiêu chí tìm kiếm hiện tại."
        />
      </div>
    );
  }

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="bg-white rounded-xl border border-hairline shadow-xs overflow-hidden flex flex-col">
      {/* Desktop Table View (hidden on small mobile, visible md+) */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader className="bg-cloud border-b border-hairline">
            <TableRow>
              <TableHead className="w-[170px] text-xs font-bold text-slate-gray py-3">
                Thời gian
              </TableHead>
              <TableHead className="w-[210px] text-xs font-bold text-slate-gray py-3">
                Người thực hiện
              </TableHead>
              <TableHead className="w-[130px] text-xs font-bold text-slate-gray py-3">
                Phân hệ
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-gray py-3">
                Hành động &amp; Đối tượng
              </TableHead>
              <TableHead className="w-[200px] text-xs font-bold text-slate-gray py-3">
                Biến động dữ liệu
              </TableHead>
              <TableHead className="w-[90px] text-right text-xs font-bold text-slate-gray py-3">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-hairline">
            {logs.map((log) => {
              const moduleConfig = AUDIT_MODULE_CONFIG[log.module] || {
                label: log.module,
                bgClass: 'bg-cloud',
                borderClass: 'border-hairline',
                textClass: 'text-slate-gray',
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
                  className="hover:bg-cloud transition-colors group cursor-pointer"
                  onClick={() => onSelectLog(log)}
                >
                  {/* Timestamp */}
                  <TableCell className="py-3 align-top">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-ink-navy flex items-center gap-1">
                        <Clock className="w-3 h-3 text-mist-gray shrink-0" />
                        <span className="font-mono text-[11px]">{formatAuditTimestamp(log.createdAt)}</span>
                      </div>
                      <div className="text-[10px] text-mist-gray font-medium">
                        {formatRelativeTime(log.createdAt)}
                      </div>
                    </div>
                  </TableCell>

                  {/* Actor */}
                  <TableCell className="py-3 align-top">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-7 h-7 ring-1 ring-hairline shrink-0">
                        {log.actor?.avatarUrl && (
                          <AvatarImage src={log.actor.avatarUrl} alt={actorName} />
                        )}
                        <AvatarFallback className="bg-pebble text-ink-navy font-semibold text-[10px]">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5 truncate">
                        <p className="text-xs font-bold text-ink-navy truncate">
                          {actorName}
                        </p>
                        <p className="text-[10px] text-mist-gray truncate font-mono">
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
                        <span className="text-xs font-bold text-ink-navy">
                          {log.actionLabel}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] py-0 px-1.5 font-semibold border ${impactConfig.bgClass} ${impactConfig.borderClass} ${impactConfig.textClass}`}
                        >
                          {impactConfig.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-mist-gray font-mono flex-wrap">
                        <span className="bg-cloud border border-hairline px-1.5 py-0.2 rounded text-slate-gray font-sans text-[10px] font-semibold">
                          {log.entityType}
                        </span>
                        {log.entityId && (
                          <span className="text-mist-gray truncate max-w-[140px]" title={log.entityId}>
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
                          <ArrowRight className="w-3 h-3 text-mist-gray shrink-0" />
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] border border-emerald-200 font-semibold">
                            {formatMetadataValue(newStatus)}
                          </span>
                        </div>
                      ) : amount !== undefined ? (
                        <div className="font-mono text-emerald-700 font-semibold text-xs">
                          {new Intl.NumberFormat('vi-VN').format(Number(amount))} ₫
                        </div>
                      ) : note ? (
                        <p className="text-[11px] text-slate-gray truncate max-w-[190px]" title={String(note)}>
                          {String(note)}
                        </p>
                      ) : Object.keys(log.metadata || {}).length > 0 ? (
                        <span className="text-[10px] text-slate-gray bg-cloud px-1.5 py-0.5 rounded border border-hairline font-mono">
                          {Object.keys(log.metadata).length} tham số
                        </span>
                      ) : (
                        <span className="text-[11px] text-mist-gray italic">—</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Action Button */}
                  <TableCell className="py-3 text-right align-middle">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2 text-slate-gray group-hover:text-signal-blue group-hover:bg-[#e6f0ff] transition-colors"
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
      <div className="md:hidden divide-y divide-hairline">
        {logs.map((log) => {
          const moduleConfig = AUDIT_MODULE_CONFIG[log.module] || {
            label: log.module,
            bgClass: 'bg-cloud',
            borderClass: 'border-hairline',
            textClass: 'text-slate-gray',
          };
          const impact = inferActionImpact(log.action);
          const impactConfig = ACTION_IMPACT_MAP[impact] || ACTION_IMPACT_MAP.info;
          const actorName = log.actor?.fullName || 'Hệ thống tự động';

          return (
            <div
              key={log.id}
              onClick={() => onSelectLog(log)}
              className="p-4 space-y-2.5 hover:bg-cloud transition-colors cursor-pointer"
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
                <div className="text-[11px] text-mist-gray font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-mist-gray" />
                  <span>{formatRelativeTime(log.createdAt)}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-ink-navy leading-snug">
                  {log.actionLabel}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-mist-gray font-mono mt-0.5">
                  <span className="bg-cloud border border-hairline px-1 rounded text-slate-gray">{log.entityType}</span>
                  {log.entityId && <span>#{log.entityId.slice(0, 8)}</span>}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-hairline text-xs">
                <div className="flex items-center gap-2 truncate">
                  <User className="w-3.5 h-3.5 text-mist-gray shrink-0" />
                  <span className="font-semibold text-slate-gray truncate">{actorName}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-signal-blue"
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
      <div className="p-3.5 px-4 border-t border-hairline bg-cloud flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-gray">
        <div className="flex items-center gap-3">
          <span>
            Hiển thị <strong className="text-ink-navy">{startItem}</strong> -{' '}
            <strong className="text-ink-navy">{endItem}</strong> trên tổng số{' '}
            <strong className="text-ink-navy">{totalCount}</strong> sự kiện
          </span>

          {onPageSizeChange && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-mist-gray">
              <span>Mỗi trang:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => onPageSizeChange(Number(val))}
              >
                <SelectTrigger className="h-7 text-xs bg-white border-hairline w-auto min-w-[70px] text-ink-navy">
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
            className="h-8 px-2.5 text-xs bg-white hover:bg-cloud border-hairline text-slate-gray"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            <span>Trang trước</span>
          </Button>

          <span className="font-semibold text-ink-navy px-2">
            Trang {currentPage} / {Math.max(1, totalPages)}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isLoading}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-8 px-2.5 text-xs bg-white hover:bg-cloud border-hairline text-slate-gray"
          >
            <span>Trang sau</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
