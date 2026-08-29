import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Download,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  User,
  Layers,
  Shield,
  HardDrive,
  Copy,
  Check,
  FileText,
  AlertCircle,
  Eye,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentFileIcon } from './DocumentFileIcon';
import { DocumentCategoryBadge, DocumentAccessLevelBadge } from './DocumentBadges';
import {
  formatFileSize,
  getFileExtension,
  getFileTypeGroup,
} from '../utils/document.utils';
import { createDocumentSignedUrl, triggerFileDownload } from '../storage/document-storage.service';
import { formatDate } from '@/lib/date';
import { SlideOverDrawer } from '@/components/common/SlideOverDrawer';
import type { DocumentItem } from '../types/document.types';

interface DocumentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  canManage: boolean;
  onEdit: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
}

export function DocumentDetailDrawer({
  isOpen,
  onClose,
  document,
  canManage,
  onEdit,
  onDelete,
}: DocumentDetailDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewSignedUrl, setPreviewSignedUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const isDriveDoc = document?.sourceType === 'google_drive';
  const fileExt = document ? getFileExtension(document.filePath) : '';
  const fileTypeGroup = document ? getFileTypeGroup(document.mimeType, document.filePath) : 'other';

  // Load preview signed URL for PDF or image if stored in Supabase
  useEffect(() => {
    let isMounted = true;
    if (isOpen && document && !isDriveDoc) {
      const isPdfOrImg = fileTypeGroup === 'pdf' || fileTypeGroup === 'image';
      if (isPdfOrImg) {
        setPreviewLoading(true);
        setPreviewError(null);
        createDocumentSignedUrl(document.filePath, 600)
          .then(({ signedUrl, error }) => {
            if (isMounted) {
              if (signedUrl && !error) {
                setPreviewSignedUrl(signedUrl);
              } else {
                setPreviewError(error || 'Could not load preview URL');
              }
              setPreviewLoading(false);
            }
          })
          .catch((err) => {
            if (isMounted) {
              setPreviewError(err?.message || 'Preview generation failed');
              setPreviewLoading(false);
            }
          });
      } else {
        setPreviewSignedUrl(null);
        setPreviewLoading(false);
      }
    } else {
      setPreviewSignedUrl(null);
      setPreviewLoading(false);
      setPreviewError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, document, isDriveDoc, fileTypeGroup]);

  if (!isOpen || !document) return null;

  const handleDownload = async () => {
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

  const handleOpenExternal = async () => {
    if (isDriveDoc && document.driveUrl) {
      window.open(document.driveUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      const { signedUrl, error } = await createDocumentSignedUrl(document.filePath, 300);
      if (signedUrl && !error) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert(error || 'Could not generate document preview link.');
      }
    } catch (err) {
      console.error('Open external error:', err);
    }
  };

  const handleCopyLink = () => {
    const link = isDriveDoc ? document.driveUrl : window.location.href;
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLinked = Boolean(
    document.termId || document.activityId || document.taskId || document.memberId
  );

  const displayFilename = isDriveDoc
    ? (document.driveUrl || 'Google Drive Document')
    : document.filePath.split('/').pop() || document.filePath;

  const headerBadge = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {isDriveDoc ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Google Drive
        </span>
      ) : (
        <DocumentCategoryBadge category={document.category} />
      )}
      {document.accessLevel !== 'internal' && (
        <DocumentAccessLevelBadge accessLevel={document.accessLevel} />
      )}
    </div>
  );

  const headerActions = (
    <div className="flex items-center gap-1.5">
      {canManage && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onClose();
              onEdit(document);
            }}
            className="h-8 text-xs font-semibold text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs gap-1.5 cursor-pointer rounded-xl"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Sửa</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onClose();
              onDelete(document);
            }}
            className="h-8 text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50 shadow-2xs gap-1.5 cursor-pointer rounded-xl"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Xóa tài liệu</span>
          </Button>
        </>
      )}
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between w-full text-xs text-slate-500">
      <span>
        Mã tài liệu: <strong className="font-mono text-slate-800">{document.id.slice(0, 8)}...</strong>
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={onClose}
        className="h-8 text-xs font-semibold text-slate-700 rounded-xl"
      >
        Đóng
      </Button>
    </div>
  );

  return (
    <SlideOverDrawer
      id="document-detail-drawer"
      isOpen={isOpen}
      onClose={onClose}
      title={document.title}
      subtitle={displayFilename}
      badge={headerBadge}
      headerActions={headerActions}
      size="2xl"
      footer={footer}
    >
      {/* Quick Action Bar */}
      <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenExternal}
            className="h-8 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border-slate-200 shadow-2xs gap-1.5 cursor-pointer rounded-xl"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>{isDriveDoc ? 'Mở trên Google Drive' : 'Mở / Xem'}</span>
          </Button>

          {!isDriveDoc && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-8 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border-slate-200 shadow-2xs gap-1.5 cursor-pointer rounded-xl"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isDownloading ? 'Đang tải xuống...' : 'Tải xuống'}</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyLink}
            className="h-8 text-xs font-semibold text-slate-600 hover:text-slate-900 gap-1.5 cursor-pointer rounded-xl"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép liên kết' : 'Sao chép liên kết'}</span>
          </Button>
        </div>
      </div>

      {/* Embedded Document Preview for Supported Formats */}
      {previewLoading && (
        <div className="flex items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Đang tải bản xem trước...</span>
          </div>
        </div>
      )}

      {previewSignedUrl && fileTypeGroup === 'image' && (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 max-h-72 flex items-center justify-center p-2">
          <img
            src={previewSignedUrl}
            alt={document.title}
            className="max-h-64 max-w-full object-contain rounded-xl shadow-xs"
          />
          <a
            href={previewSignedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900/70 text-white hover:bg-slate-900 transition-colors opacity-0 group-hover:opacity-100"
            title="Mở toàn màn hình"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {previewSignedUrl && fileTypeGroup === 'pdf' && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-96">
          <iframe
            src={`${previewSignedUrl}#toolbar=0`}
            title={document.title}
            className="w-full h-full border-0"
          />
        </div>
      )}

      {/* SECTION 1 — FILE SPECIFICATIONS */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[10px]">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Thông tin tài liệu</span>
        </div>

        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-start gap-4">
            <span className="text-slate-500 font-medium shrink-0">Tên văn bản:</span>
            <span className="font-semibold text-slate-900 text-right break-all">{document.title}</span>
          </div>

          <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
            <span className="text-slate-500 font-medium">Định dạng & Phân loại:</span>
            <span className="font-mono text-slate-800 uppercase font-semibold">
              {fileExt ? `${fileExt} (${fileTypeGroup})` : fileTypeGroup.toUpperCase()}
            </span>
          </div>

          {document.fileSize !== null && document.fileSize !== undefined && (
            <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
              <span className="text-slate-500 font-medium">Kích thước:</span>
              <span className="font-mono font-semibold text-slate-800">
                {formatFileSize(document.fileSize)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
            <span className="text-slate-500 font-medium">Ngày tạo:</span>
            <span className="text-slate-700">{formatDate(document.createdAt)}</span>
          </div>

          <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
            <span className="text-slate-500 font-medium">Cập nhật lần cuối:</span>
            <span className="text-slate-700">{formatDate(document.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* SECTION 2 — CONTEXT & LINKAGES (Only shown if linked) */}
      {isLinked && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[10px]">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Liên kết Đơn vị & Nhiệm kỳ</span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
            {document.term && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Nhiệm kỳ áp dụng:</span>
                <span className="font-semibold text-slate-900">{document.term.name}</span>
              </div>
            )}

            {document.activity && (
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
                <span className="text-slate-500 font-medium">Hoạt động liên quan:</span>
                <span className="font-semibold text-slate-900">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    {document.activity.title}
                    {document.activity.code && ` [${document.activity.code}]`}
                  </span>
                </span>
              </div>
            )}

            {document.task && (
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
                <span className="text-slate-500 font-medium">Nhiệm vụ liên quan:</span>
                <span className="font-medium text-slate-800">{document.task.title}</span>
              </div>
            )}

            {document.member && (
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
                <span className="text-slate-500 font-medium">Hội viên / Nhân sự:</span>
                <span className="font-medium text-slate-800">
                  {document.member.fullName} ({document.member.studentId})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3 — OWNERSHIP & GOVERNANCE */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[10px]">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Người tải lên</span>
        </div>

        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Người tải lên:</span>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                {document.uploader?.fullName?.charAt(0) || <User className="w-3 h-3" />}
              </div>
              <span className="font-medium text-slate-900">
                {document.uploader?.fullName || 'Hội viên Đơn vị'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </SlideOverDrawer>
  );
}
