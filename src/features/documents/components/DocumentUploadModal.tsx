import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Upload,
  FileUp,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  HardDrive,
  Tag,
  Shield,
  CalendarRange,
  CalendarCheck,
  CheckSquare,
  Users,
  ExternalLink,
} from 'lucide-react';
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  documentUploadFormSchema,
  type DocumentUploadFormData,
} from '../schemas/document.schema';
import {
  formatFileSize,
  validateDocumentFile,
  DOCUMENT_CATEGORY_CONFIGS,
  DOCUMENT_ACCESS_CONFIGS,
  MAX_FILE_SIZE_BYTES,
} from '../utils/document.utils';
import { DocumentFileIcon } from './DocumentFileIcon';
import { useUploadDirectToDrive } from '@/integrations/google/drive/google-drive.mutations';
import {
  useDocumentTerms,
  useDocumentActivities,
  useDocumentTasks,
  useDocumentMembers,
} from '../queries/document.queries';
import { useOrgGoogleConnection, useUserGoogleConnection } from '@/features/integrations/queries/google.queries';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  preselectedTermId?: string | null;
  preselectedActivityId?: string | null;
  preselectedTaskId?: string | null;
  preselectedMemberId?: string | null;
  onSuccess?: () => void;
}

export function DocumentUploadModal({
  open,
  onOpenChange,
  organizationId,
  preselectedTermId,
  preselectedActivityId,
  preselectedTaskId,
  preselectedMemberId,
  onSuccess,
}: DocumentUploadModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if organization or user has an active Google Drive connection
  const { data: orgConnection } = useOrgGoogleConnection(organizationId);
  const { data: userConnection } = useUserGoogleConnection(user?.id || null);

  const isDriveConnected = Boolean(
    (orgConnection && orgConnection.status === 'connected') ||
    (userConnection && userConnection.status === 'connected')
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgressStep, setUploadProgressStep] = useState<
    'idle' | 'preparing' | 'uploading' | 'uploading_drive' | 'saving' | 'completed' | 'success'
  >('idle');

  // Queries for selectors
  const { data: terms = [] } = useDocumentTerms(organizationId);
  const currentTerm = terms.find((t) => t.isCurrent) || terms[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<DocumentUploadFormData>({
    resolver: zodResolver(documentUploadFormSchema),
    defaultValues: {
      title: '',
      category: 'general',
      accessLevel: 'internal',
      termId: preselectedTermId || currentTerm?.id || '',
      activityId: preselectedActivityId || '',
      taskId: preselectedTaskId || '',
      memberId: preselectedMemberId || '',
    },
  });

  const selectedTermId = watch('termId');
  const selectedActivityId = watch('activityId');

  const { data: activities = [] } = useDocumentActivities(organizationId, selectedTermId || undefined);
  const { data: tasks = [] } = useDocumentTasks(organizationId, selectedActivityId || undefined);
  const { data: members = [] } = useDocumentMembers(organizationId);

  const uploadDriveMutation = useUploadDirectToDrive();
  const isPending = uploadDriveMutation.isPending;
  const isError = uploadDriveMutation.isError;
  const activeError = uploadDriveMutation.error as Error | null;

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedFile(null);
      setFileError(null);
      setIsDragging(false);
      setUploadProgressStep('idle');

      reset({
        title: '',
        category: 'general',
        accessLevel: 'internal',
        termId: preselectedTermId || currentTerm?.id || '',
        activityId: preselectedActivityId || '',
        taskId: preselectedTaskId || '',
        memberId: preselectedMemberId || '',
      });
    }
  }, [open, preselectedTermId, preselectedActivityId, preselectedTaskId, preselectedMemberId, currentTerm, reset]);

  // Handle File Selection
  const handleFileSelect = (file: File) => {
    setFileError(null);
    const validation = validateDocumentFile(file);

    if (!validation.valid) {
      setFileError(validation.error || 'Tệp tin không hợp lệ');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    // Auto fill title from cleaned filename if title is empty
    const dotIdx = file.name.lastIndexOf('.');
    const rawName = dotIdx > -1 ? file.name.slice(0, dotIdx) : file.name;
    const formattedTitle = rawName
      .replace(/[_-]+/g, ' ')
      .trim();

    if (formattedTitle) {
      setValue('title', formattedTitle);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Form Submit -> 100% Google Drive
  const onSubmit = async (data: DocumentUploadFormData) => {
    if (!selectedFile) {
      setFileError('Vui lòng chọn tệp tin cần tải lên');
      return;
    }

    if (!isDriveConnected) {
      setFileError('Đơn vị chưa kết nối tài khoản Google Drive. Vui lòng vào mục Tích hợp để kết nối tài khoản Google của Đơn vị.');
      return;
    }

    try {
      setUploadProgressStep('uploading_drive');
      await uploadDriveMutation.mutateAsync({
        file: selectedFile,
        organizationId,
        termId: data.termId || null,
        activityId: data.activityId || null,
        taskId: data.taskId || null,
        memberId: data.memberId || null,
        title: data.title,
        category: data.category,
        accessLevel: data.accessLevel,
        userId: user?.id,
      });

      setUploadProgressStep('success');

      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
      }, 600);
    } catch (err) {
      setUploadProgressStep('idle');
      setFileError((err as Error).message || 'Tải lên Google Drive thất bại.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
                Tải tệp lên Google Drive
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Lưu trữ trực tiếp và an toàn trên Google Drive của Đơn vị
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Google Drive Connection Notice */}
        {!isDriveConnected && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1">
              <p className="font-semibold text-xs">Đơn vị chưa liên kết Google Drive</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Để tải tệp trực tiếp lên Drive, Quản trị viên cần liên kết tài khoản Google của Đơn vị trong phần Tích hợp.
              </p>
              <Link
                to="/integrations"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline pt-0.5"
              >
                Mở trang Tích hợp Google Workspace
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 mt-1">
          {/* 1. File Dropzone */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Tệp đính kèm <span className="text-rose-500">*</span>
            </label>

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-150',
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/60 scale-[0.99]'
                    : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/80 bg-slate-50/40'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  Kéo thả tệp vào đây, hoặc <span className="text-emerald-600 underline">duyệt tệp từ máy tính</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hỗ trợ PDF, Word, Excel, PowerPoint, Ảnh, ZIP (Tối đa {formatFileSize(MAX_FILE_SIZE_BYTES)})
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <DocumentFileIcon
                    filename={selectedFile.name}
                    mimeType={selectedFile.type}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-sm">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Tệp nhị phân'}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  onClick={() => {
                    setSelectedFile(null);
                    setFileError(null);
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {fileError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}
          </div>

          {/* 2. Document Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Tên tài liệu hiển thị trong Đơn vị <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register('title')}
              placeholder="VD: Kế hoạch tổ chức Chiến dịch Mùa hè xanh 2026"
              className={cn(
                'rounded-xl text-xs h-10',
                errors.title ? 'border-rose-400 focus-visible:ring-rose-200' : ''
              )}
            />
            {errors.title && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.title.message}</p>
            )}
          </div>

          {/* 3. Category & Access Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Danh mục tài liệu</span>
                <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'general'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 bg-white text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOCUMENT_CATEGORY_CONFIGS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Access Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Mức độ truy cập</span>
                <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="accessLevel"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'organization_internal'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 bg-white text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOCUMENT_ACCESS_CONFIGS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label} ({config.description})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* 4. Relationships */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Liên kết ngữ cảnh (Tùy chọn)</span>
              <span className="text-[11px] text-slate-400">Giúp phân loại và tra cứu hồ sơ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Term */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                  <CalendarRange className="w-3 h-3 text-slate-400" />
                  <span>Nhiệm kỳ</span>
                </label>
                <Controller
                  name="termId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                    >
                      <SelectTrigger className="w-full h-9 rounded-lg border-slate-200 bg-white text-xs">
                        <SelectValue placeholder="-- Tài liệu chung của Đơn vị --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Tài liệu chung của Đơn vị --</SelectItem>
                        {terms.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} {t.isCurrent ? '(Đang hoạt động)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Activity */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                  <CalendarCheck className="w-3 h-3 text-slate-400" />
                  <span>Hoạt động liên kết</span>
                </label>
                <Controller
                  name="activityId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                    >
                      <SelectTrigger className="w-full h-9 rounded-lg border-slate-200 bg-white text-xs">
                        <SelectValue placeholder="-- Không gắn hoạt động --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Không gắn hoạt động --</SelectItem>
                        {activities.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Task */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                  <CheckSquare className="w-3 h-3 text-slate-400" />
                  <span>Công việc (Task)</span>
                </label>
                <Controller
                  name="taskId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                    >
                      <SelectTrigger className="w-full h-9 rounded-lg border-slate-200 bg-white text-xs">
                        <SelectValue placeholder="-- Không gắn công việc --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Không gắn công việc --</SelectItem>
                        {tasks.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Member */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>Hội viên liên quan</span>
                </label>
                <Controller
                  name="memberId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                    >
                      <SelectTrigger className="w-full h-9 rounded-lg border-slate-200 bg-white text-xs">
                        <SelectValue placeholder="-- Không gắn hội viên --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Không gắn hội viên --</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.fullName} {m.studentId ? `(${m.studentId})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Progress / Error Feedback */}
          {isError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Tải lên Google Drive thất bại</p>
                <p>{activeError?.message || 'Vui lòng kiểm tra lại quyền truy cập hoặc kết nối Google Workspace.'}</p>
              </div>
            </div>
          )}

          {uploadProgressStep === 'success' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã tải tệp lên Google Drive của Đơn vị thành công!</span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="rounded-xl text-xs"
            >
              Hủy
            </Button>

            <Button
              type="submit"
              disabled={!selectedFile || isPending || !isDriveConnected}
              className="rounded-xl text-xs text-white font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải lên Google Drive...</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Tải lên Google Drive</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
