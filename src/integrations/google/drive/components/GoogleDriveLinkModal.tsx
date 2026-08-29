import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  HardDrive,
  Link2,
  Search,
  FileText,
  FileSpreadsheet,
  Presentation,
  CheckSquare,
  Folder,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  extractGoogleDriveFileId,
  buildGoogleDriveViewUrl,
  getDriveFileTypeGroup,
  GOOGLE_DRIVE_FILE_TYPE_INFO,
  GOOGLE_DRIVE_MIME_TYPES,
} from '../google-drive.constants';
import { useDriveSearch, useCheckDriveFileLinked } from '../google-drive.queries';
import { useLinkDriveFile } from '../google-drive.mutations';
import type { GoogleDriveFile, GoogleDriveFileTypeGroup } from '../google-drive.types';
import type { DocumentCategory, DocumentAccessLevel } from '@/features/documents/types/document.types';

interface GoogleDriveLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  termId?: string | null;
  activityId?: string | null;
  activityTitle?: string | null;
  taskId?: string | null;
  taskTitle?: string | null;
  currentUserId?: string | null;
}

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: 'plan', label: 'Kế hoạch công tác' },
  { value: 'resolution', label: 'Nghị quyết' },
  { value: 'decision', label: 'Quyết định' },
  { value: 'report', label: 'Báo cáo tổng kết' },
  { value: 'template', label: 'Biểu mẫu chuẩn' },
  { value: 'financial_receipt', label: 'Chứng từ thu chi' },
  { value: 'handover', label: 'Hồ sơ bàn giao' },
  { value: 'general', label: 'Tài liệu chung' },
];

const ACCESS_LEVEL_OPTIONS: { value: DocumentAccessLevel; label: string; desc: string }[] = [
  { value: 'internal', label: 'Nội bộ Đơn vị', desc: 'Tất cả hội viên trong Đơn vị xem được' },
  { value: 'board_only', label: 'Ban Chấp Hành', desc: 'Chỉ Admin, Leader, Deputy, Secretary xem được' },
  { value: 'admin_only', label: 'Chỉ Quản trị viên', desc: 'Chỉ Quản trị viên Đơn vị có quyền truy cập' },
  { value: 'public', label: 'Công khai', desc: 'Mọi người có liên kết đều xem được' },
];

export function GoogleDriveLinkModal({
  isOpen,
  onClose,
  organizationId,
  termId,
  activityId,
  activityTitle,
  taskId,
  taskTitle,
  currentUserId,
}: GoogleDriveLinkModalProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'browse'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [extractedId, setExtractedId] = useState<string | null>(null);

  // Search in Drive state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTypeGroup, setSelectedTypeGroup] = useState<GoogleDriveFileTypeGroup | 'all'>('all');
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('plan');
  const [accessLevel, setAccessLevel] = useState<DocumentAccessLevel>('internal');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const linkMutation = useLinkDriveFile();

  // Search Drive files query
  const { data: searchResults, isLoading: isSearching } = useDriveSearch(
    {
      query: searchKeyword,
      mimeTypeGroup: selectedTypeGroup,
    },
    isOpen && activeTab === 'browse'
  );

  // Duplicate link check
  const activeFileId = activeTab === 'url' ? extractedId : selectedFile?.id;
  const { data: duplicateCheck } = useCheckDriveFileLinked(
    organizationId,
    activeFileId,
    { activityId, taskId }
  );

  // Live URL parser
  useEffect(() => {
    if (!urlInput.trim()) {
      setExtractedId(null);
      return;
    }
    const id = extractGoogleDriveFileId(urlInput);
    setExtractedId(id);

    if (id && !title) {
      // Auto suggest title from URL type if empty
      const lower = urlInput.toLowerCase();
      if (lower.includes('/spreadsheets/')) {
        setTitle('Bảng tính Google Sheets');
        setCategory('financial_receipt');
      } else if (lower.includes('/presentation/')) {
        setTitle('Bản trình chiếu Google Slides');
        setCategory('report');
      } else if (lower.includes('/forms/')) {
        setTitle('Biểu mẫu khảo sát Google Forms');
        setCategory('template');
      } else if (lower.includes('/folders/')) {
        setTitle('Thư mục Google Drive');
        setCategory('general');
      } else {
        setTitle('Tài liệu Google Drive');
      }
    }
  }, [urlInput]);

  // When a file is selected from browse tab
  const handleSelectDriveFile = (file: GoogleDriveFile) => {
    setSelectedFile(file);
    setTitle(file.name);

    if (file.fileTypeGroup === 'sheet') {
      setCategory('financial_receipt');
    } else if (file.fileTypeGroup === 'slide') {
      setCategory('report');
    } else if (file.fileTypeGroup === 'form') {
      setCategory('template');
    } else if (file.fileTypeGroup === 'folder') {
      setCategory('general');
    } else if (file.fileTypeGroup === 'pdf') {
      setCategory('resolution');
    } else {
      setCategory('plan');
    }
  };

  const handleReset = () => {
    setUrlInput('');
    setExtractedId(null);
    setSelectedFile(null);
    setTitle('');
    setCategory('plan');
    setAccessLevel('internal');
    setErrorMessage(null);
  };

  const handleClose = () => {
    if (!linkMutation.isPending) {
      handleReset();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fileId = activeTab === 'url' ? extractedId : selectedFile?.id;
    if (!fileId) {
      setErrorMessage('Vui lòng nhập liên kết hoặc chọn một tệp Google Drive hợp lệ.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên tài liệu hiển thị.');
      return;
    }

    if (duplicateCheck?.isLinked) {
      setErrorMessage(duplicateCheck.contextMessage || 'Tệp này đã được liên kết trong hệ thống.');
      return;
    }

    let mimeType = 'application/vnd.google-apps.document';
    let isFolder = false;
    let driveUrl = '';
    let fileSize: number | null = null;

    if (activeTab === 'url') {
      const lower = urlInput.toLowerCase();
      if (lower.includes('/spreadsheets/')) mimeType = GOOGLE_DRIVE_MIME_TYPES.SPREADSHEET;
      else if (lower.includes('/presentation/')) mimeType = GOOGLE_DRIVE_MIME_TYPES.PRESENTATION;
      else if (lower.includes('/forms/')) mimeType = GOOGLE_DRIVE_MIME_TYPES.FORM;
      else if (lower.includes('/folders/')) {
        mimeType = GOOGLE_DRIVE_MIME_TYPES.FOLDER;
        isFolder = true;
      } else if (lower.endsWith('.pdf') || lower.includes('pdf')) mimeType = GOOGLE_DRIVE_MIME_TYPES.PDF;
      driveUrl = urlInput.trim().startsWith('http') ? urlInput.trim() : buildGoogleDriveViewUrl(fileId, mimeType);
    } else if (selectedFile) {
      mimeType = selectedFile.mimeType;
      isFolder = selectedFile.isFolder;
      driveUrl = selectedFile.webViewLink;
      fileSize = selectedFile.size || null;
    }

    try {
      await linkMutation.mutateAsync({
        organizationId,
        termId: termId || null,
        activityId: activityId || null,
        taskId: taskId || null,
        driveFileId: fileId,
        title: title.trim(),
        driveUrl,
        mimeType,
        fileSize,
        isFolder,
        category,
        accessLevel,
        linkedBy: currentUserId || null,
      });

      handleReset();
      onClose();
    } catch (err) {
      setErrorMessage((err as Error).message || 'Không thể liên kết tệp từ Google Drive.');
    }
  };

  const detectedGroup = activeTab === 'url' ? getDriveFileTypeGroup(undefined, urlInput) : selectedFile?.fileTypeGroup || 'doc';
  const typeInfo = GOOGLE_DRIVE_FILE_TYPE_INFO[detectedGroup] || GOOGLE_DRIVE_FILE_TYPE_INFO.other;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="pb-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
                Liên kết tài liệu từ Google Drive
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Gắn liên kết Docs, Sheets, Slides, Forms hoặc thư mục Drive vào hồ sơ Đơn vị
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scope Context Banner */}
        {(activityTitle || taskTitle) && (
          <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 flex items-center gap-2 text-xs text-blue-900">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Liên kết trực tiếp vào:{' '}
              <strong>{activityTitle ? `Hoạt động "${activityTitle}"` : `Công việc "${taskTitle}"`}</strong>
            </span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'url'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Nhập liên kết / Mã tệp Drive
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className={`flex-1 py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'browse'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Duyệt & Chọn từ Google Drive
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-1 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: URL / ID Input */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Đường dẫn (URL) hoặc Mã ID tệp Google Drive <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/document/d/... hoặc https://drive.google.com/file/d/..."
                    className="text-xs pr-8 font-mono"
                    required
                  />
                  {extractedId && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Hỗ trợ định dạng: Google Docs, Google Sheets, Google Slides, Google Forms, PDF, Thư mục và Tệp Drive.
                </p>
              </div>

              {extractedId && (
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-600 text-white">
                      ID Hợp lệ
                    </span>
                    <span className="font-mono text-[11px] text-slate-700 font-semibold">{extractedId}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${typeInfo.badgeColor}`}>
                    {typeInfo.label}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Browse & Pick */}
          {activeTab === 'browse' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Tìm theo tên tệp trên Google Drive..."
                    className="text-xs pl-8"
                  />
                </div>
              </div>

              {/* Type Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedTypeGroup('all')}
                  className={`px-2 py-1 rounded-md border whitespace-nowrap ${
                    selectedTypeGroup === 'all'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Tất cả ({searchResults?.files.length || 0})
                </button>
                {(['doc', 'sheet', 'slide', 'pdf', 'folder'] as GoogleDriveFileTypeGroup[]).map((group) => {
                  const info = GOOGLE_DRIVE_FILE_TYPE_INFO[group];
                  const isSelected = selectedTypeGroup === group;
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setSelectedTypeGroup(group)}
                      className={`px-2 py-1 rounded-md border whitespace-nowrap transition-all ${
                        isSelected
                          ? `${info.badgeColor} font-semibold shadow-xs`
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {info.label.split('/')[0]}
                    </button>
                  );
                })}
              </div>

              {/* Files Grid / List */}
              <div className="border border-slate-200 rounded-lg max-h-52 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                {isSearching ? (
                  <div className="p-6 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-600" />
                    Đang tải danh sách tệp Google Drive...
                  </div>
                ) : !searchResults?.files.length ? (
                  <div className="p-6 text-center text-slate-500">
                    Không tìm thấy tệp nào phù hợp từ khóa tìm kiếm.
                  </div>
                ) : (
                  searchResults.files.map((file) => {
                    const isSelected = selectedFile?.id === file.id;
                    const info = GOOGLE_DRIVE_FILE_TYPE_INFO[file.fileTypeGroup] || GOOGLE_DRIVE_FILE_TYPE_INFO.other;
                    return (
                      <div
                        key={file.id}
                        onClick={() => handleSelectDriveFile(file)}
                        className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50/90 border-l-4 border-l-emerald-600' : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg border ${info.bgColor} ${info.borderColor}`}>
                            {file.fileTypeGroup === 'doc' && <FileText className="w-4 h-4 text-blue-600" />}
                            {file.fileTypeGroup === 'sheet' && <FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                            {file.fileTypeGroup === 'slide' && <Presentation className="w-4 h-4 text-amber-600" />}
                            {file.fileTypeGroup === 'form' && <CheckSquare className="w-4 h-4 text-purple-600" />}
                            {file.fileTypeGroup === 'pdf' && <FileText className="w-4 h-4 text-rose-600" />}
                            {file.fileTypeGroup === 'folder' && <Folder className="w-4 h-4 text-amber-600" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate text-xs">{file.name}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{info.label}</span>
                              {file.owners?.[0] && <span>• {file.owners[0].displayName}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </span>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px] text-slate-600 hover:text-emerald-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectDriveFile(file);
                              }}
                            >
                              Chọn
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Duplicate Warning if already linked */}
          {duplicateCheck?.isLinked && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Cảnh báo trùng lặp:</strong> {duplicateCheck.contextMessage}
              </div>
            </div>
          )}

          {/* Common Metadata Fields */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Tên tài liệu hiển thị trong Đơn vị <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề hồ sơ tài liệu..."
                className="text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Danh mục tài liệu</label>
                <Select
                  value={category}
                  onValueChange={(val) => setCategory(val as DocumentCategory)}
                >
                  <SelectTrigger className="w-full h-9 rounded-md border-slate-200 bg-white text-xs text-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Access Level */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Quyền truy cập nội bộ</label>
                <Select
                  value={accessLevel}
                  onValueChange={(val) => setAccessLevel(val as DocumentAccessLevel)}
                >
                  <SelectTrigger className="w-full h-9 rounded-md border-slate-200 bg-white text-xs text-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESS_LEVEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span>
              Tài liệu được liên kết dưới dạng tham chiếu an toàn. Quyền xem và chỉnh sửa thực tế sẽ tuân theo phân quyền trên Google Drive của tổ chức.
            </span>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={linkMutation.isPending}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={linkMutation.isPending || (!extractedId && !selectedFile)}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {linkMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {linkMutation.isPending ? 'Đang liên kết...' : 'Liên kết tài liệu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
