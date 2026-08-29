import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Edit3,
  Loader2,
  AlertCircle,
  Tag,
  Shield,
  CalendarRange,
  CalendarCheck,
  CheckSquare,
  Users,
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
  documentEditMetadataFormSchema,
  type DocumentEditMetadataFormData,
} from '../schemas/document.schema';
import {
  DOCUMENT_CATEGORY_CONFIGS,
  DOCUMENT_ACCESS_CONFIGS,
  formatFileSize,
} from '../utils/document.utils';
import { DocumentFileIcon } from './DocumentFileIcon';
import { useUpdateDocumentMetadata } from '../mutations/document.mutations';
import {
  useDocumentTerms,
  useDocumentActivities,
  useDocumentTasks,
  useDocumentMembers,
} from '../queries/document.queries';
import { cn } from '@/lib/utils';
import type { DocumentItem } from '../types/document.types';

interface DocumentEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentItem | null;
  organizationId: string;
  onSuccess?: () => void;
}

export function DocumentEditModal({
  open,
  onOpenChange,
  document,
  organizationId,
  onSuccess,
}: DocumentEditModalProps) {
  const { data: terms = [] } = useDocumentTerms(organizationId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<DocumentEditMetadataFormData>({
    resolver: zodResolver(documentEditMetadataFormSchema),
    defaultValues: {
      title: '',
      category: 'general',
      accessLevel: 'internal',
      termId: '',
      activityId: '',
      taskId: '',
      memberId: '',
    },
  });

  const selectedTermId = watch('termId');
  const selectedActivityId = watch('activityId');

  const { data: activities = [] } = useDocumentActivities(organizationId, selectedTermId || undefined);
  const { data: tasks = [] } = useDocumentTasks(organizationId, selectedActivityId || undefined);
  const { data: members = [] } = useDocumentMembers(organizationId);

  const updateMutation = useUpdateDocumentMetadata();

  useEffect(() => {
    if (open && document) {
      reset({
        title: document.title,
        category: document.category,
        accessLevel: document.accessLevel,
        termId: document.termId || '',
        activityId: document.activityId || '',
        taskId: document.taskId || '',
        memberId: document.memberId || '',
      });
    }
  }, [open, document, reset]);

  const onSubmit = async (data: DocumentEditMetadataFormData) => {
    if (!document) return;

    try {
      await updateMutation.mutateAsync({
        documentId: document.id,
        organizationId,
        data,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      // Handled by mutation state
    }
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
                Chỉnh sửa thông tin tài liệu
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Đổi tên hiển thị, danh mục, phân quyền bảo mật hoặc liên kết ngữ cảnh
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* File preview badge */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <DocumentFileIcon
            filename={document.filePath}
            mimeType={document.mimeType}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {document.filePath.split('/').pop()}
            </p>
            <p className="text-[11px] text-slate-500">
              Dung lượng: {formatFileSize(document.fileSize)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Tên tài liệu / Văn bản <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register('title')}
              className={cn(
                'rounded-xl text-xs h-10',
                errors.title ? 'border-rose-400 focus-visible:ring-rose-200' : ''
              )}
            />
            {errors.title && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.title.message}</p>
            )}
          </div>

          {/* Category & Access Level in 2 columns */}
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
              {errors.category && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.category.message}</p>
              )}
            </div>

            {/* Access Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Mức độ truy cập (Bảo mật)</span>
                <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="accessLevel"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'internal'}
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
              {errors.accessLevel && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.accessLevel.message}</p>
              )}
            </div>
          </div>

          {/* Relationships (Term, Activity, Task, Member) */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-slate-800 block">Liên kết ngữ cảnh</span>

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
                        <SelectValue placeholder="-- Tài liệu chung (Toàn Chi hội) --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Tài liệu chung (Toàn Chi hội) --</SelectItem>
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

          {updateMutation.isError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Cập nhật thất bại</p>
                <p>{(updateMutation.error as Error)?.message || 'Vui lòng thử lại'}</p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              className="rounded-xl text-xs"
            >
              Hủy
            </Button>

            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-xl text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <span>Lưu thay đổi</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
