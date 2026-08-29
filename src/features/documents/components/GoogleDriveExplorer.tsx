import React, { useState, useMemo, useRef } from 'react';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  Presentation,
  File,
  Plus,
  Grid,
  List,
  ExternalLink,
  Search,
  ChevronRight,
  Upload,
  FolderPlus,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/date';
import { formatFileSize } from '../utils/document.utils';
import { useUploadDirectToDrive, useCreateDriveFolder, useUnlinkDriveFile } from '@/integrations/google/drive/google-drive.mutations';
import { extractGoogleDriveFileId } from '@/integrations/google/drive/google-drive.constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { DocumentItem } from '../types/document.types';

export interface DriveFolderItem {
  id: string;
  name: string;
  driveFileId?: string | null;
  driveUrl?: string | null;
  filesCount: number;
}

interface UploadTask {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface GoogleDriveExplorerProps {
  organizationId: string;
  documents: DocumentItem[];
  canManage: boolean;
  onSelectDoc: (doc: DocumentItem) => void;
  onEditDoc?: (doc: DocumentItem) => void;
  onDeleteDoc?: (doc: DocumentItem) => void;
}

export function GoogleDriveExplorer({
  organizationId,
  documents,
  canManage,
  onSelectDoc,
  onEditDoc,
  onDeleteDoc,
}: GoogleDriveExplorerProps) {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadDriveMutation = useUploadDirectToDrive();
  const createFolderMutation = useCreateDriveFolder();
  const unlinkDriveMutation = useUnlinkDriveFile();

  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New folder dialog state
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDriveUrl, setNewFolderDriveUrl] = useState('');

  // Drag-and-drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = useRef(0);

  // Background upload tasks queue
  const [uploadQueue, setUploadQueue] = useState<UploadTask[]>([]);
  const [isQueueMinimized, setIsQueueMinimized] = useState(false);

  // Dynamically extract real folders from actual documents in DB & Google Drive
  const dynamicFolders: DriveFolderItem[] = useMemo(() => {
    const folderMap = new Map<string, { id: string; name: string; driveFileId?: string | null; driveUrl?: string | null; count: number }>();

    // 1. Register folders
    documents.forEach((doc) => {
      if (doc.isFolder) {
        folderMap.set(doc.title, {
          id: doc.id,
          name: doc.title,
          driveFileId: doc.driveFileId,
          driveUrl: doc.driveUrl,
          count: 0,
        });
      } else if (doc.filePath && doc.filePath.includes('/')) {
        const parts = doc.filePath.split('/');
        if (parts.length > 1 && parts[0] !== 'documents' && parts[0] !== 'organizations') {
          const folderName = parts[0];
          if (!folderMap.has(folderName)) {
            folderMap.set(folderName, {
              id: `folder-${folderName}`,
              name: folderName,
              driveUrl: doc.driveUrl || `https://drive.google.com/drive/u/0/my-drive`,
              count: 0,
            });
          }
        }
      }
    });

    // 2. Count files in each folder
    documents.forEach((doc) => {
      if (!doc.isFolder && doc.filePath) {
        for (const [fName, fObj] of folderMap.entries()) {
          const metaFolderName = (doc.metadata as any)?.folderName;
          if (doc.filePath.startsWith(fName + '/') || metaFolderName === fName) {
            fObj.count++;
          }
        }
      }
    });

    return Array.from(folderMap.values()).map((f) => ({
      id: f.id,
      name: f.name,
      driveFileId: f.driveFileId,
      driveUrl: f.driveUrl,
      filesCount: f.count,
    }));
  }, [documents]);

  const activeFolderObj = useMemo(() => {
    if (!activeFolder) return null;
    return dynamicFolders.find((f) => f.name === activeFolder || f.id === activeFolder) || null;
  }, [activeFolder, dynamicFolders]);

  // Filter documents based on active folder & search query
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (doc.isFolder) return false; // Folders are rendered in the folders section

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchPath = (doc.filePath || '').toLowerCase().includes(q);
        return matchTitle || matchPath;
      }

      if (activeFolderObj) {
        const metaFolderName = (doc.metadata as any)?.folderName;
        return (
          (doc.filePath && doc.filePath.startsWith(activeFolderObj.name + '/')) ||
          metaFolderName === activeFolderObj.name ||
          (doc.filePath && doc.filePath.includes(activeFolderObj.name))
        );
      }

      // If at root (no active folder), show files that don't belong to any subfolder
      return !doc.filePath || !doc.filePath.includes('/');
    });
  }, [documents, searchQuery, activeFolderObj]);

  // Handle uploading files directly into the active folder
  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!organizationId || !canManage) return;

    const targetFolderName = activeFolderObj ? activeFolderObj.name : null;
    const targetFolderId = activeFolderObj?.driveFileId || null;

    const newTasks: UploadTask[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: targetFolderName ? `${targetFolderName}/${file.name}` : file.name,
      size: file.size,
      status: 'uploading',
    }));

    setUploadQueue((prev) => [...prev, ...newTasks]);
    setIsQueueMinimized(false);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const taskId = newTasks[i].id;

      try {
        await uploadDriveMutation.mutateAsync({
          file,
          organizationId,
          title: file.name.replace(/\.[^/.]+$/, ''),
          folderId: targetFolderId,
          folderName: targetFolderName,
          category: 'general',
          accessLevel: 'internal',
          userId: user?.id,
          userEmail: user?.email,
        });

        setUploadQueue((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: 'success' } : t))
        );
      } catch (err: unknown) {
        console.error('Upload file failed:', err);
        const errMsg = (err as Error)?.message || 'Tải lên thất bại';
        setUploadQueue((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: 'error', error: errMsg } : t))
        );
      }
    }
  };

  // Drag & drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !organizationId) return;
    const trimmed = newFolderName.trim();

    try {
      await createFolderMutation.mutateAsync({
        organizationId,
        folderName: trimmed,
        driveUrl: newFolderDriveUrl.trim() || null,
        userId: user?.id,
        userEmail: user?.email,
      });

      toast.success(`Đã tạo thư mục "${trimmed}" thành công`);
      setActiveFolder(trimmed); // Navigate into the newly created folder!
      setNewFolderName('');
      setNewFolderDriveUrl('');
      setNewFolderModalOpen(false);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const getFileIcon = (mimeType?: string | null, filePath?: string) => {
    const mime = (mimeType || '').toLowerCase();
    const path = (filePath || '').toLowerCase();

    if (mime.includes('spreadsheet') || path.endsWith('.gsheet') || path.endsWith('.xlsx') || path.endsWith('.csv')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />;
    }
    if (mime.includes('form') || path.endsWith('.gform')) {
      return <CheckSquare className="w-5 h-5 text-purple-600 shrink-0" />;
    }
    if (mime.includes('presentation') || path.endsWith('.gslide') || path.endsWith('.pptx')) {
      return <Presentation className="w-5 h-5 text-amber-600 shrink-0" />;
    }
    if (mime.includes('pdf') || path.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-rose-600 shrink-0" />;
    }
    if (mime.includes('document') || path.endsWith('.gdoc') || path.endsWith('.docx') || path.endsWith('.doc')) {
      return <FileText className="w-5 h-5 text-blue-600 shrink-0" />;
    }
    return <File className="w-5 h-5 text-slate-500 shrink-0" />;
  };

  const getFileTypeLabel = (mimeType?: string | null, filePath?: string) => {
    const mime = (mimeType || '').toLowerCase();
    const path = (filePath || '').toLowerCase();

    if (mime.includes('spreadsheet') || path.endsWith('.gsheet')) return 'Google Sheets';
    if (mime.includes('form') || path.endsWith('.gform')) return 'Google Forms';
    if (mime.includes('presentation') || path.endsWith('.gslide')) return 'Google Slides';
    if (mime.includes('document') || path.endsWith('.gdoc')) return 'Google Docs';
    if (mime.includes('pdf') || path.endsWith('.pdf')) return 'Tài liệu PDF';
    return 'Tệp tin';
  };

  const getFileAccentColor = (mimeType?: string | null, filePath?: string) => {
    const mime = (mimeType || '').toLowerCase();
    const path = (filePath || '').toLowerCase();

    if (mime.includes('spreadsheet') || path.endsWith('.gsheet')) return 'border-t-emerald-500 bg-emerald-50/20';
    if (mime.includes('form') || path.endsWith('.gform')) return 'border-t-purple-500 bg-purple-50/20';
    if (mime.includes('presentation') || path.endsWith('.gslide')) return 'border-t-amber-500 bg-amber-50/20';
    if (mime.includes('pdf') || path.endsWith('.pdf')) return 'border-t-rose-500 bg-rose-50/20';
    if (mime.includes('document') || path.endsWith('.gdoc')) return 'border-t-blue-500 bg-blue-50/20';
    return 'border-t-slate-400 bg-slate-50/20';
  };

  const handleOpenDocExternal = (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    if (doc.driveUrl) {
      window.open(doc.driveUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCreateNewGoogleDoc = (type: 'doc' | 'sheet' | 'form' | 'slide') => {
    const urls = {
      doc: 'https://docs.google.com/document/create',
      sheet: 'https://docs.google.com/spreadsheets/create',
      form: 'https://docs.google.com/forms/create',
      slide: 'https://docs.google.com/presentation/create',
    };
    window.open(urls[type], '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="space-y-6 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden Native File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        className="hidden"
      />

      {/* Full-Page Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-blue-600/90 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center text-white border-4 border-dashed border-white pointer-events-none p-8 animate-in fade-in duration-150">
          <UploadCloud className="w-20 h-20 mb-4 animate-bounce" />
          <p className="text-xl font-bold">
            {activeFolderObj
              ? `Thả tệp vào thư mục "${activeFolderObj.name}"`
              : 'Thả tệp vào đây để tải lên Google Drive'}
          </p>
          <p className="text-sm text-blue-100 mt-1">
            {activeFolderObj
              ? `Tệp tin sẽ được lưu trực tiếp vào thư mục ${activeFolderObj.name}`
              : 'Hỗ trợ Docs, Sheets, Slides, Forms, PDF, Ảnh và mọi định dạng tệp'}
          </p>
        </div>
      )}

      {/* 1. Google Drive Workspace Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Google Drive Official Style + Mới Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-10 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-bold text-xs shadow-sm gap-2 cursor-pointer ring-1 ring-slate-900/5 hover:shadow transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-xs font-bold text-slate-800">Mới</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-1.5 rounded-2xl shadow-xl border-slate-200">
              {canManage && (
                <>
                  <DropdownMenuItem
                    onClick={() => setNewFolderModalOpen(true)}
                    className="gap-2.5 text-xs py-2 rounded-xl font-medium text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4 text-slate-600" />
                    <span>Thư mục mới</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2.5 text-xs py-2 rounded-xl font-medium cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>
                      {activeFolderObj
                        ? `Tải tệp vào "${activeFolderObj.name}"`
                        : 'Tải tệp lên Google Drive'}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => handleCreateNewGoogleDoc('doc')}
                className="gap-2.5 text-xs py-2 rounded-xl font-medium text-blue-700 hover:bg-blue-50 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Google Tài liệu (Docs)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleCreateNewGoogleDoc('sheet')}
                className="gap-2.5 text-xs py-2 rounded-xl font-medium text-emerald-700 hover:bg-emerald-50 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Google Trang tính (Sheets)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleCreateNewGoogleDoc('form')}
                className="gap-2.5 text-xs py-2 rounded-xl font-medium text-purple-700 hover:bg-purple-50 cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-purple-600" />
                <span>Google Biểu mẫu (Forms)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleCreateNewGoogleDoc('slide')}
                className="gap-2.5 text-xs py-2 rounded-xl font-medium text-amber-700 hover:bg-amber-50 cursor-pointer"
              >
                <Presentation className="w-4 h-4 text-amber-600" />
                <span>Google Trang trình bày (Slides)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Drive Breadcrumb Navigation */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-2xl">
            <button
              onClick={() => setActiveFolder(null)}
              className={`hover:text-blue-600 cursor-pointer transition-colors ${!activeFolderObj ? 'text-blue-700 font-bold' : 'text-slate-500'}`}
            >
              Drive của Đơn vị
            </button>
            {activeFolderObj && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 font-bold truncate max-w-[200px]">
                  {activeFolderObj.name}
                </span>

                {activeFolderObj.driveUrl && (
                  <button
                    onClick={() => window.open(activeFolderObj.driveUrl!, '_blank', 'noopener,noreferrer')}
                    className="ml-1 p-1 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Mở thư mục này trên Google Drive"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Search & View Mode Switcher */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm trong Drive..."
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/70 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
              title="Chế độ xem lưới"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${viewMode === 'table' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
              title="Chế độ xem danh sách"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Folders Section (Only renders if real folders exist) */}
      {dynamicFolders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              <span>Thư mục Google Drive Đơn vị ({dynamicFolders.length})</span>
            </h3>
            {activeFolderObj && (
              <button
                onClick={() => setActiveFolder(null)}
                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Xem tất cả thư mục
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {dynamicFolders.map((folder) => {
              const isSelected = activeFolderObj?.name === folder.name;
              return (
                <div
                  key={folder.id}
                  onClick={() => setActiveFolder(isSelected ? null : folder.name)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                      <Folder className="w-4 h-4 fill-amber-500/20 text-amber-600" />
                    </div>
                    <div className="flex items-center gap-1">
                      {folder.driveUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(folder.driveUrl!, '_blank', 'noopener,noreferrer');
                          }}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 cursor-pointer transition-colors"
                          title="Mở thư mục trên Google Drive"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                      {canManage && (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Bạn có chắc chắn muốn xóa thư mục "${folder.name}" khỏi ChapterOS và Google Drive không?`)) {
                              try {
                                const localToken = localStorage.getItem('chapteros_google_access_token');
                                const targetDriveId = folder.driveFileId || (folder.driveUrl ? extractGoogleDriveFileId(folder.driveUrl) : null);

                                // 1. Delete on Google Drive Cloud API
                                if (targetDriveId && !targetDriveId.startsWith('gfolder-')) {
                                  try {
                                    await fetch('/api/drive/delete', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        ...(localToken ? { 'x-google-access-token': localToken } : {}),
                                      },
                                      body: JSON.stringify({
                                        driveFileId: targetDriveId,
                                        organizationId,
                                        userId: user?.id,
                                        googleAccessToken: localToken,
                                      }),
                                    });
                                  } catch (cloudErr) {
                                    console.warn('Google Drive cloud folder delete notice:', cloudErr);
                                  }
                                }

                                // 2. Delete all related documents in ChapterOS database
                                const docsInFolder = documents.filter(
                                  (d) =>
                                    d.id === folder.id ||
                                    d.title === folder.name ||
                                    d.filePath?.startsWith(folder.name + '/') ||
                                    (d.metadata as any)?.folderName === folder.name
                                );

                                for (const d of docsInFolder) {
                                  if (d.id && !d.id.startsWith('folder-')) {
                                    await unlinkDriveMutation.mutateAsync({
                                      documentId: d.id,
                                      organizationId: organizationId!,
                                    });
                                  }
                                }

                                toast.success(`Đã xóa thư mục "${folder.name}" khỏi ChapterOS và Google Drive`);
                                if (activeFolder === folder.name) setActiveFolder(null);
                              } catch (err: any) {
                                toast.error(err);
                              }
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                          title="Xóa thư mục khỏi ChapterOS & Google Drive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        {folder.filesCount} tệp
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug">
                      {folder.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Thư mục Google Drive</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Files Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <File className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {activeFolderObj
                ? `Tệp tin trong "${activeFolderObj.name}" (${filteredDocs.length})`
                : `Tệp tin Google Workspace (${filteredDocs.length})`}
            </span>
          </h3>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {activeFolderObj
              ? `Kéo thả tệp vào đây để tải vào thư mục "${activeFolderObj.name}"`
              : 'Kéo thả tệp bất kỳ vào màn hình để tải lên nhanh'}
          </span>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200/90 text-center p-8 space-y-4 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <UploadCloud className="w-7 h-7 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">
                {searchQuery
                  ? 'Không tìm thấy tệp phù hợp bộ lọc'
                  : activeFolderObj
                  ? `Thư mục "${activeFolderObj.name}" chưa có tệp tin`
                  : 'Kéo & thả tệp vào đây để tải lên Google Drive'}
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {searchQuery
                  ? 'Thử kiểm tra lại từ khóa tìm kiếm hoặc chọn lại thư mục khác.'
                  : activeFolderObj
                  ? `Kéo thả tệp từ máy tính hoặc nhấn nút bên dưới để tải tệp vào "${activeFolderObj.name}".`
                  : 'Hoặc nhấn nút bên dưới để chọn tệp từ máy tính của bạn.'}
              </p>
            </div>
            {canManage && !searchQuery && (
              <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap">
                {!activeFolderObj && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNewFolderModalOpen(true)}
                    className="rounded-xl text-xs font-semibold h-9 gap-1.5 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-slate-500" />
                    <span>Tạo thư mục mới</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl text-xs font-semibold h-9 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {activeFolderObj
                      ? `Chọn tệp tải vào "${activeFolderObj.name}"`
                      : 'Chọn tệp từ máy tính'}
                  </span>
                </Button>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDocs.map((doc) => {
              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectDoc(doc)}
                  className={`group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between overflow-hidden border-t-4 ${getFileAccentColor(doc.mimeType, doc.filePath)}`}
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getFileIcon(doc.mimeType, doc.filePath)}
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                          {getFileTypeLabel(doc.mimeType, doc.filePath)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {doc.driveUrl && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenDocExternal(e, doc)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 cursor-pointer transition-colors"
                            title="Mở tài liệu trên Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                        {doc.title}
                      </h4>
                      <p className="font-mono text-[10px] text-slate-400 mt-1 truncate">
                        {doc.filePath}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>{formatDate(doc.updatedAt || doc.createdAt, 'dd/MM/yyyy')}</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE LIST VIEW */
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Tên tệp tin</th>
                    <th className="py-3 px-4">Định dạng</th>
                    <th className="py-3 px-4">Đường dẫn</th>
                    <th className="py-3 px-4">Lần sửa đổi cuối</th>
                    <th className="py-3 px-4">Kích thước</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => onSelectDoc(doc)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 max-w-md">
                          {getFileIcon(doc.mimeType, doc.filePath)}
                          <span className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {doc.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {getFileTypeLabel(doc.mimeType, doc.filePath)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] max-w-[200px] truncate">
                        {doc.filePath || 'Drive gốc'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDate(doc.updatedAt || doc.createdAt, 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {doc.driveUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleOpenDocExternal(e, doc)}
                              className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-semibold"
                            >
                              <span>Mở</span>
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. New Folder Modal */}
      <Dialog open={newFolderModalOpen} onOpenChange={setNewFolderModalOpen}>
        <DialogContent className="sm:max-w-xl p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Tạo thư mục mới trong Google Drive
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Tạo thư mục để tổ chức văn bản, sổ thu chi và hồ sơ hoạt động của Đơn vị
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateFolderSubmit} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Tên thư mục <span className="text-rose-500">*</span>
              </label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="VD: Kế hoạch Hoạt động 2026-2027"
                className="h-10 text-xs rounded-xl"
                autoFocus
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewFolderModalOpen(false)}
                disabled={createFolderMutation.isPending}
                className="rounded-xl text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={!newFolderName.trim() || createFolderMutation.isPending}
                className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
              >
                {createFolderMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo thư mục'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Google Drive Official Style Upload Queue Widget (Bottom Right) */}
      {uploadQueue.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              {uploadQueue.some((t) => t.status === 'uploading') ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-xs font-bold">
                {uploadQueue.some((t) => t.status === 'uploading')
                  ? `Đang tải lên ${uploadQueue.filter((t) => t.status === 'uploading').length} mục...`
                  : `Đã hoàn tất tải lên (${uploadQueue.length} mục)`}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsQueueMinimized(!isQueueMinimized)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title={isQueueMinimized ? 'Mở rộng' : 'Thu nhỏ'}
              >
                {isQueueMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setUploadQueue([])}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Queue List */}
          {!isQueueMinimized && (
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {uploadQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-50 gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{formatFileSize(item.size)}</p>
                  </div>

                  <div className="shrink-0">
                    {item.status === 'uploading' && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    )}
                    {item.status === 'success' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {item.status === 'error' && (
                      <span title={item.error}>
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
