import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  MoreVertical,
  Edit3,
  Trash2,
  CalendarRange,
  CalendarCheck,
  CheckSquare,
  Loader2,
  User,
  HardDrive,
  Copy,
  Check,
  Link2Off,
  Cloud,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocumentFileIcon } from './DocumentFileIcon';
import { DocumentCategoryBadge, DocumentAccessLevelBadge } from './DocumentBadges';
import { formatFileSize, getFileExtension } from '../utils/document.utils';
import { createDocumentSignedUrl, triggerFileDownload } from '../storage/document-storage.service';
import { formatDate } from '@/lib/date';
import type { DocumentItem } from '../types/document.types';

export interface DocumentCardProps {
  key?: string | number;
  document: DocumentItem;
  canManage: boolean;
  onSelect: (doc: DocumentItem) => void;
  onEdit: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
}

export function DocumentCard({
  document,
  canManage,
  onSelect,
  onEdit,
  onDelete,
}: DocumentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [copied, setCopied] = useState(false);

  const isDriveDoc = document.sourceType === 'google_drive';
  const ext = getFileExtension(document.filePath);
  const isLinked = Boolean(
    document.termId || document.activityId || document.taskId || document.memberId
  );

  const displayFilename = isDriveDoc
    ? (document.driveUrl || 'Google Drive Document')
    : document.filePath.split('/').pop() || document.filePath;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDriveDoc) {
      if (document.driveUrl) {
        window.open(document.driveUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    setIsDownloading(true);
    try {
      const filename = document.filePath.split('/').pop() || `${document.title}.pdf`;
      await triggerFileDownload(document.filePath, filename);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDriveDoc) {
      if (document.driveUrl) {
        window.open(document.driveUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    setIsPreviewing(true);
    try {
      const { signedUrl, error } = await createDocumentSignedUrl(document.filePath, 300);
      if (signedUrl && !error) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert(error || 'Could not generate document preview link.');
      }
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = isDriveDoc ? document.driveUrl : window.location.href;
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={() => onSelect(document)}
      className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all duration-150 flex flex-col justify-between cursor-pointer"
    >
      {/* Top Header: File Icon + Badges + Menu */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <DocumentFileIcon
              filename={isDriveDoc ? (document.driveUrl || document.title) : document.filePath}
              mimeType={document.mimeType}
              size="md"
            />
            <div className="min-w-0">
              {isDriveDoc && document.driveUrl ? (
                <a
                  href={document.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-blue-600 hover:underline transition-colors block"
                  title={document.title}
                >
                  {document.title}
                </a>
              ) : (
                <h4
                  className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors"
                  title={document.title}
                >
                  {document.title}
                </h4>
              )}
              <div className="flex items-center gap-1.5 mt-0.5">
                {isDriveDoc ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                    <Cloud className="w-2.5 h-2.5" />
                    <span>Drive</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                    <HardDrive className="w-2.5 h-2.5" />
                    <span>Storage</span>
                  </span>
                )}
                <span className="text-[11px] text-slate-400 truncate max-w-[140px] font-mono">
                  {formatFileSize(document.fileSize)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0 cursor-pointer"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl text-xs">
              <DropdownMenuItem onClick={() => onSelect(document)} className="gap-2 cursor-pointer">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Xem chi tiết</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handlePreview} className="gap-2 cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>{isDriveDoc ? 'Mở trên Google Drive' : 'Xem / Mở tệp'}</span>
              </DropdownMenuItem>

              {!isDriveDoc && (
                <DropdownMenuItem onClick={handleDownload} className="gap-2 cursor-pointer">
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Đã sao chép link' : 'Sao chép liên kết'}</span>
              </DropdownMenuItem>

              {canManage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(document);
                    }}
                    className="gap-2 cursor-pointer text-slate-700"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Chỉnh sửa thông tin</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(document);
                    }}
                    className="gap-2 cursor-pointer text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>{isDriveDoc ? 'Gỡ liên kết Drive' : 'Xóa tài liệu'}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Badges row: Category + Access Level */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <DocumentCategoryBadge category={document.category} />
          <DocumentAccessLevelBadge accessLevel={document.accessLevel} />
          {ext && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 border border-slate-200">
              {ext}
            </span>
          )}
        </div>

        {/* Relationship chip */}
        <div className="pt-1">
          {isLinked ? (
            <div className="space-y-1">
              {document.activity && (
                <div
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50/90 px-2 py-0.5 rounded border border-emerald-200 max-w-full truncate"
                  title={document.activity.title}
                >
                  <CalendarCheck className="w-3 h-3 shrink-0" />
                  <span className="truncate">{document.activity.title}</span>
                </div>
              )}
              {document.term && !document.activity && (
                <div
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50/90 px-2 py-0.5 rounded border border-blue-200 max-w-full truncate"
                  title={document.term.name}
                >
                  <CalendarRange className="w-3 h-3 shrink-0" />
                  <span className="truncate">{document.term.name}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-400 border border-slate-200">
              <Link2Off className="w-3 h-3" />
              <span>Unlinked</span>
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer: Uploader + Date */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[9px] shrink-0 border border-slate-200">
            {document.uploader?.fullName?.charAt(0) || <User className="w-2.5 h-2.5" />}
          </div>
          <span className="truncate max-w-[100px] font-medium text-slate-700">
            {document.uploader?.fullName || 'Member'}
          </span>
        </div>

        <span className="font-medium text-slate-500 shrink-0">
          {formatDate(document.updatedAt || document.createdAt)}
        </span>
      </div>
    </div>
  );
}
