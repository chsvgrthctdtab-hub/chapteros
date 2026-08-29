import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  Edit3,
  Trash2,
  CalendarCheck,
  CalendarRange,
  CheckSquare,
  Loader2,
  User,
  Link2Off,
  Link2,
  Copy,
  Check,
  Layers,
  Eye,
  MoreHorizontal,
  HardDrive,
  Cloud,
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
import { formatFileSize, getFileExtension, getFileTypeGroup } from '../utils/document.utils';
import { createDocumentSignedUrl, triggerFileDownload } from '../storage/document-storage.service';
import { formatDate } from '@/lib/date';
import type { DocumentItem } from '../types/document.types';

export interface DocumentTableProps {
  documents: DocumentItem[];
  canManage: boolean;
  onSelect: (doc: DocumentItem) => void;
  onEdit: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
}

export function DocumentTable({
  documents,
  canManage,
  onSelect,
  onEdit,
  onDelete,
}: DocumentTableProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDownload = async (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    if (doc.sourceType === 'google_drive') {
      if (doc.driveUrl) {
        window.open(doc.driveUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    setDownloadingId(doc.id);
    try {
      const filename = doc.filePath.split('/').pop() || `${doc.title}.pdf`;
      await triggerFileDownload(doc.filePath, filename);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    if (doc.sourceType === 'google_drive') {
      if (doc.driveUrl) {
        window.open(doc.driveUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    setPreviewingId(doc.id);
    try {
      const { signedUrl, error } = await createDocumentSignedUrl(doc.filePath, 300);
      if (signedUrl && !error) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert(error || 'Could not generate document preview link.');
      }
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setPreviewingId(null);
    }
  };

  const handleCopyLink = (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    const link = doc.sourceType === 'google_drive' ? doc.driveUrl : window.location.href;
    if (link) {
      navigator.clipboard.writeText(link);
      setCopiedId(doc.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <table className="w-full text-left text-xs text-slate-600 border-collapse">
        <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
          <tr>
            <th scope="col" className="py-3 px-4 min-w-[260px]">
              Tài liệu & Nguồn lưu trữ
            </th>
            <th scope="col" className="py-3 px-3 min-w-[90px]">
              Định dạng
            </th>
            <th scope="col" className="py-3 px-3 min-w-[110px]">
              Danh mục
            </th>
            <th scope="col" className="py-3 px-3 min-w-[160px]">
              Liên kết liên quan
            </th>
            <th scope="col" className="py-3 px-3 min-w-[130px]">
              Người tải lên
            </th>
            <th scope="col" className="py-3 px-3 min-w-[120px]">
              Quyền & Dung lượng
            </th>
            <th scope="col" className="py-3 px-3 min-w-[110px]">
              Cập nhật
            </th>
            <th scope="col" className="py-3 px-4 text-right min-w-[110px]">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents.map((doc) => {
            const isDriveDoc = doc.sourceType === 'google_drive';
            const ext = getFileExtension(doc.filePath);
            const isDownloading = downloadingId === doc.id;
            const isPreviewing = previewingId === doc.id;
            const isCopied = copiedId === doc.id;

            const isLinked = Boolean(doc.termId || doc.activityId || doc.taskId || doc.memberId);
            const displayFilename = isDriveDoc
              ? (doc.driveUrl || 'Google Drive Link')
              : doc.filePath.split('/').pop() || doc.filePath;

            return (
              <tr
                key={doc.id}
                onClick={() => onSelect(doc)}
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
              >
                {/* 1. File icon & Title */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <DocumentFileIcon
                      filename={isDriveDoc ? (doc.driveUrl || doc.title) : doc.filePath}
                      mimeType={doc.mimeType}
                      size="md"
                    />
                    <div className="min-w-0">
                      {isDriveDoc && doc.driveUrl ? (
                        <a
                          href={doc.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-slate-900 line-clamp-1 hover:text-blue-600 hover:underline transition-colors block"
                          title={doc.title}
                        >
                          {doc.title}
                        </a>
                      ) : (
                        <p
                          className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors"
                          title={doc.title}
                        >
                          {doc.title}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isDriveDoc ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            <Cloud className="w-2.5 h-2.5" />
                            <span>Drive</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            <HardDrive className="w-2.5 h-2.5" />
                            <span>Storage</span>
                          </span>
                        )}
                        {isDriveDoc && doc.driveUrl ? (
                          <a
                            href={doc.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-blue-600 hover:underline truncate max-w-[220px] font-mono inline-flex items-center gap-0.5"
                            title={doc.driveUrl}
                          >
                            <span className="truncate">{doc.driveUrl}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0 ml-0.5 text-blue-500" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 truncate max-w-[180px] font-mono">
                            {displayFilename}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* 2. File Format / Type Badge */}
                <td className="py-3 px-3">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {ext ? ext.toUpperCase() : isDriveDoc ? 'G-DOC' : 'FILE'}
                  </span>
                </td>

                {/* 3. Category */}
                <td className="py-3 px-3">
                  <DocumentCategoryBadge category={doc.category} />
                </td>

                {/* 4. Related Context (Term, Activity, Task, Member) */}
                <td className="py-3 px-3">
                  {isLinked ? (
                    <div className="space-y-1">
                      {doc.activity && (
                        <div
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200 max-w-[200px] truncate"
                          title={doc.activity.title}
                        >
                          <CalendarCheck className="w-3 h-3 shrink-0" />
                          <span className="truncate">{doc.activity.title}</span>
                        </div>
                      )}
                      {doc.term && !doc.activity && (
                        <div
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200 max-w-[200px] truncate"
                          title={doc.term.name}
                        >
                          <CalendarRange className="w-3 h-3 shrink-0" />
                          <span className="truncate">{doc.term.name}</span>
                        </div>
                      )}
                      {doc.task && (
                        <div
                          className="flex items-center gap-1 text-[11px] text-slate-600 truncate max-w-[180px]"
                          title={doc.task.title}
                        >
                          <CheckSquare className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{doc.task.title}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-400 border border-slate-200">
                      <Link2Off className="w-3 h-3" />
                      <span>Unlinked</span>
                    </span>
                  )}
                </td>

                {/* 5. Uploader */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200">
                      {doc.uploader?.fullName?.charAt(0) || <User className="w-3 h-3" />}
                    </div>
                    <span className="font-medium text-slate-800 truncate max-w-[120px]" title={doc.uploader?.fullName || 'Chapter Member'}>
                      {doc.uploader?.fullName || 'Chapter Member'}
                    </span>
                  </div>
                </td>

                {/* 6. Access Level & Size */}
                <td className="py-3 px-3">
                  <div className="space-y-0.5">
                    <DocumentAccessLevelBadge accessLevel={doc.accessLevel} />
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {formatFileSize(doc.fileSize)}
                    </p>
                  </div>
                </td>

                {/* 7. Last Updated */}
                <td className="py-3 px-3">
                  <span className="text-[11px] text-slate-600 font-medium" title={formatDate(doc.updatedAt || doc.createdAt)}>
                    {formatDate(doc.updatedAt || doc.createdAt)}
                  </span>
                </td>

                {/* 8. Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Quick Preview button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => handlePreview(e, doc)}
                      disabled={isPreviewing}
                      className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
                      title={isDriveDoc ? 'Open on Drive' : 'View file'}
                    >
                      {isPreviewing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5" />
                      )}
                    </Button>

                    {/* Quick Download button for Supabase files */}
                    {!isDriveDoc && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => handleDownload(e, doc)}
                        disabled={isDownloading}
                        className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
                        title="Download file"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    )}

                    {/* More actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl text-xs">
                        <DropdownMenuItem onClick={() => onSelect(doc)} className="gap-2 cursor-pointer">
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Details</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={(e) => handleCopyLink(e, doc)} className="gap-2 cursor-pointer">
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                          <span>{isCopied ? 'Link Copied' : 'Copy Link'}</span>
                        </DropdownMenuItem>

                        {canManage && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(doc);
                              }}
                              className="gap-2 cursor-pointer text-slate-700"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit Metadata</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(doc);
                              }}
                              className="gap-2 cursor-pointer text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>{isDriveDoc ? 'Unlink from Drive' : 'Delete File'}</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
