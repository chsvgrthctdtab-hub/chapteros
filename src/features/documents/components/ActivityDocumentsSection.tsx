import { useState } from 'react';
import {
  FileText,
  Upload,
  Download,
  ExternalLink,
  Trash2,
  Edit3,
  Loader2,
  Plus,
  Link2,
  Link2Off,
  Copy,
  Check,
  Cloud,
  HardDrive,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentFileIcon } from './DocumentFileIcon';
import { DocumentCategoryBadge, DocumentAccessLevelBadge } from './DocumentBadges';
import { GoogleDriveDocBadge } from '@/integrations/google/drive/components/GoogleDriveDocBadge';
import { GoogleDriveLinkModal } from '@/integrations/google/drive/components/GoogleDriveLinkModal';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentEditModal } from './DocumentEditModal';
import { DocumentDeleteDialog } from './DocumentDeleteDialog';
import { DocumentDetailDrawer } from './DocumentDetailDrawer';
import { useActivityDocuments } from '../queries/document.queries';
import { formatFileSize } from '../utils/document.utils';
import { createDocumentSignedUrl, triggerFileDownload } from '../storage/document-storage.service';
import { formatDate } from '@/lib/date';
import { useAuth } from '@/contexts/AuthContext';
import type { DocumentItem } from '../types/document.types';

interface ActivityDocumentsSectionProps {
  organizationId: string;
  activityId: string;
  termId?: string | null;
  activityTitle: string;
  canManage: boolean;
}

export function ActivityDocumentsSection({
  organizationId,
  activityId,
  termId,
  activityTitle,
  canManage,
}: ActivityDocumentsSectionProps) {
  const { user } = useAuth();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [driveLinkModalOpen, setDriveLinkModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const { data: documents = [], isLoading } = useActivityDocuments(
    organizationId,
    activityId
  );

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

  return (
    <div className="space-y-4">
      {/* Header bar with Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Activity Documents & Files</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational plans, reports, forms, spreadsheets, and Google Drive links for this activity.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDriveLinkModalOpen(true)}
              size="sm"
              className="rounded-lg text-xs text-slate-700 border-slate-200 bg-white hover:bg-slate-50 font-semibold gap-1.5 shadow-2xs cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-600" />
              <span>Link Drive</span>
            </Button>

            <Button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              size="sm"
              className="rounded-lg text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold gap-1.5 shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </Button>
          </div>
        )}
      </div>

      {/* List / Grid of documents */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800">No Attached Documents</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
            Upload operational plans or link files from Google Drive to organize records for this activity.
          </p>
          {canManage && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDriveLinkModalOpen(true)}
                className="rounded-lg text-xs text-slate-700 border-slate-200 hover:bg-slate-50 gap-1.5 cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
                <span>Link Google Drive</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => setUploadModalOpen(true)}
                className="rounded-lg text-xs bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map((doc) => {
            const isDriveDoc = doc.sourceType === 'google_drive';
            const isDownloading = downloadingId === doc.id;
            const isPreviewing = previewingId === doc.id;

            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <DocumentFileIcon
                      filename={isDriveDoc ? (doc.driveUrl || doc.title) : doc.filePath}
                      mimeType={doc.mimeType}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <h5
                        className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-blue-600 transition-colors"
                        title={doc.title}
                      >
                        {doc.title}
                      </h5>
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
                        <span className="text-[11px] text-slate-400 truncate font-mono">
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <DocumentCategoryBadge category={doc.category} />
                    <DocumentAccessLevelBadge accessLevel={doc.accessLevel} />
                  </div>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{formatDate(doc.createdAt)}</span>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handlePreview(e, doc)}
                      disabled={isPreviewing}
                      className="h-6 w-6 rounded text-slate-500 hover:text-slate-900 cursor-pointer"
                      title={isDriveDoc ? 'Open on Drive' : 'Preview'}
                    >
                      {isPreviewing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ExternalLink className="w-3 h-3" />
                      )}
                    </Button>

                    {!isDriveDoc && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDownload(e, doc)}
                        disabled={isDownloading}
                        className="h-6 w-6 rounded text-slate-500 hover:text-slate-900 cursor-pointer"
                        title="Download"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                      </Button>
                    )}

                    {canManage && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDoc(doc);
                          }}
                          className="h-6 w-6 rounded text-slate-400 hover:text-slate-800 cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingDoc(doc);
                          }}
                          className="h-6 w-6 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                          title={isDriveDoc ? 'Unlink' : 'Delete'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Detail Drawer */}
      <DocumentDetailDrawer
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
        canManage={canManage}
        onEdit={(doc) => setEditingDoc(doc)}
        onDelete={(doc) => setDeletingDoc(doc)}
      />

      {/* Upload Modal pre-bound to this activity */}
      <DocumentUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        organizationId={organizationId}
        preselectedActivityId={activityId}
        preselectedTermId={termId}
      />

      {/* Google Drive Link Modal */}
      <GoogleDriveLinkModal
        isOpen={driveLinkModalOpen}
        onClose={() => setDriveLinkModalOpen(false)}
        organizationId={organizationId}
        termId={termId}
        activityId={activityId}
        activityTitle={activityTitle}
        currentUserId={user?.id}
      />

      {/* Edit Modal */}
      <DocumentEditModal
        open={Boolean(editingDoc)}
        onOpenChange={(open) => !open && setEditingDoc(null)}
        document={editingDoc}
        organizationId={organizationId}
      />

      {/* Delete / Unlink Dialog */}
      <DocumentDeleteDialog
        open={Boolean(deletingDoc)}
        onOpenChange={(open) => !open && setDeletingDoc(null)}
        document={deletingDoc}
        organizationId={organizationId}
      />
    </div>
  );
}
