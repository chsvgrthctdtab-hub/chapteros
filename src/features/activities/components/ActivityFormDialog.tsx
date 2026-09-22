import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Calendar,
  MapPin,
  Tag,
  Users,
  AlertCircle,
  Loader2,
  Sparkles,
  UserCheck,
  Lock,
  Layers,
  GraduationCap,
  Award,
  DollarSign,
  CheckSquare,
  Info,
} from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  activityFormSchema,
  type ActivityFormData,
} from '../schemas/activity.schema';
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_STATUSES,
  type ActivityListItem,
} from '../types/activity.types';
import {
  ORGANIZER_SCOPES,
  ACTIVITY_SCALES,
  LEAN_COMPETENCY_TAGS,
  SV5T_CRITERIA,
  type SemesterId,
  type OrganizerScope,
  type ActivityScale,
  type CompetencyTagKey,
  type SV5TCriterionKey,
} from '../types/competency.types';
import {
  parseActivityMetadata,
  serializeActivityMetadata,
  stripActivityMetadata,
  determineSemesterFromDate,
  calculateActivityScale,
} from '../utils/activity-metadata';
import { getTermSemesters } from '@/features/terms/utils/semester-storage';
import { isActivityLocked } from '../utils/activity-workflow';
import {
  toDateTimeLocalString,
  fromDateTimeLocalString,
} from '@/lib/date';
import type { Term, Member } from '@/types';

interface ActivityFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityFormData) => Promise<void>;
  activityToEdit?: ActivityListItem | null;
  terms: Term[];
  leadCandidates?: Member[];
  isSubmitting?: boolean;
}

export function ActivityFormDialog({
  isOpen,
  onClose,
  onSubmit,
  activityToEdit,
  terms,
  leadCandidates = [],
  isSubmitting = false,
}: ActivityFormDialogProps) {
  const isEditMode = Boolean(activityToEdit);
  const isLocked = isEditMode && isActivityLocked(activityToEdit?.status || 'draft');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Find default current term
  const currentTerm = terms.find((t) => t.isCurrent) || terms[0];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ActivityFormData>({
    // Type casting resolver to avoid subtle TS Resolver mismatch
    resolver: zodResolver(activityFormSchema) as never,
    defaultValues: {
      title: '',
      termId: currentTerm?.id || '',
      code: '',
      leadMemberId: '',
      category: 'general',
      status: 'draft',
      location: '',
      startDate: '',
      endDate: '',
      targetMembers: 0,
      bannerUrl: '',
      description: '',
      semester: 'hk1',
      organizerScope: 'chapter',
      competencyTags: [],
      sv5tCriteria: [],
      activityScale: 'small',
      isMonthlyUnionMeeting: false,
      estimatedBudget: 0,
    },
  });

  const category = watch('category');
  const watchedTermId = watch('termId');
  const watchedStartDate = watch('startDate');
  const watchedTargetMembers = watch('targetMembers');
  const watchedEstimatedBudget = watch('estimatedBudget');
  const watchedCompetencyTags = watch('competencyTags') || [];
  const watchedSv5tCriteria = watch('sv5tCriteria') || [];
  const watchedActivityScale = watch('activityScale') || 'small';
  const watchedOrganizerScope = watch('organizerScope') || 'chapter';

  // Get configured semesters for current/selected term
  const termSemesters = useMemo(() => {
    return getTermSemesters(watchedTermId || currentTerm?.id);
  }, [watchedTermId, currentTerm?.id]);

  // Auto-calculate scale whenever target members or budget changes
  useEffect(() => {
    const computedScale = calculateActivityScale(
      Number(watchedTargetMembers) || 0,
      Number(watchedEstimatedBudget) || 0
    );
    setValue('activityScale', computedScale);
  }, [watchedTargetMembers, watchedEstimatedBudget, setValue]);

  // Sync form values when dialog opens or editing activity changes
  useEffect(() => {
    if (!isOpen) {
      setSubmitError(null);
      return;
    }

    if (activityToEdit) {
      const meta = parseActivityMetadata(activityToEdit.description);
      const cleanDesc = stripActivityMetadata(activityToEdit.description);
      const computedScale = meta.activityScale || calculateActivityScale(activityToEdit.targetMembers || 0, meta.estimatedBudget || 0);

      reset({
        title: activityToEdit.title,
        termId: activityToEdit.termId,
        code: activityToEdit.code || '',
        leadMemberId: activityToEdit.leadMemberId || '',
        category: activityToEdit.category,
        status: activityToEdit.status,
        location: activityToEdit.location || '',
        startDate: toDateTimeLocalString(activityToEdit.startDate),
        endDate: toDateTimeLocalString(activityToEdit.endDate),
        targetMembers: activityToEdit.targetMembers || 0,
        bannerUrl: activityToEdit.bannerUrl || '',
        description: cleanDesc,
        semester: meta.semester || determineSemesterFromDate(activityToEdit.startDate, termSemesters),
        organizerScope: meta.organizerScope || 'chapter',
        competencyTags: meta.competencyTags || [],
        sv5tCriteria: meta.sv5tCriteria || [],
        activityScale: computedScale,
        isMonthlyUnionMeeting: Boolean(meta.isMonthlyUnionMeeting),
        estimatedBudget: meta.estimatedBudget || 0,
      });
    } else {
      // Default dates for new activity: tomorrow at 08:00 to 11:30
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(11, 30, 0, 0);

      const defaultStartStr = toDateTimeLocalString(tomorrow);
      const autoSemester = determineSemesterFromDate(defaultStartStr, termSemesters);

      reset({
        title: '',
        termId: currentTerm?.id || '',
        code: '',
        leadMemberId: '',
        category: 'general',
        status: 'draft',
        location: '',
        startDate: defaultStartStr,
        endDate: toDateTimeLocalString(tomorrowEnd),
        targetMembers: 50,
        bannerUrl: '',
        description: '',
        semester: autoSemester,
        organizerScope: 'chapter',
        competencyTags: [],
        sv5tCriteria: [],
        activityScale: 'small',
        isMonthlyUnionMeeting: false,
        estimatedBudget: 0,
      });
    }
  }, [isOpen, activityToEdit, currentTerm, reset, termSemesters]);

  // Handle start date change to auto-match semester
  const handleStartDateChange = (val: string) => {
    setValue('startDate', val);
    if (val && termSemesters.length > 0) {
      const matchedSemester = determineSemesterFromDate(val, termSemesters);
      setValue('semester', matchedSemester);
    }
  };

  // Toggle Competency Tag
  const toggleCompetencyTag = (tagKey: CompetencyTagKey) => {
    if (isLocked) return;
    const current = watchedCompetencyTags || [];
    if (current.includes(tagKey)) {
      setValue('competencyTags', current.filter((k) => k !== tagKey));
    } else {
      setValue('competencyTags', [...current, tagKey]);
    }
  };

  // Toggle SV5T Criterion
  const toggleSv5tCriterion = (critKey: SV5TCriterionKey) => {
    if (isLocked) return;
    const current = watchedSv5tCriteria || [];
    if (current.includes(critKey)) {
      setValue('sv5tCriteria', current.filter((k) => k !== critKey));
    } else {
      setValue('sv5tCriteria', [...current, critKey]);
    }
  };

  // Auto generate activity code suggestion
  // Auto generate activity code suggestion
  const handleGenerateCode = () => {
    const currentYear = new Date().getFullYear();
    const prefix = category ? category.substring(0, 2).toUpperCase() : 'HD';
    const rand = Math.floor(100 + Math.random() * 900);
    setValue('code', `${prefix}-${currentYear}-${rand}`);
  };

  const handleFormSubmit = async (data: ActivityFormData) => {
    setSubmitError(null);
    try {
      // Serialize structured metadata into the description
      const serializedDescription = serializeActivityMetadata(data.description || '', {
        semester: data.semester,
        organizerScope: data.organizerScope,
        activityScale: data.activityScale,
        competencyTags: (data.competencyTags || []) as CompetencyTagKey[],
        sv5tCriteria: (data.sv5tCriteria || []) as SV5TCriterionKey[],
        isMonthlyUnionMeeting: data.isMonthlyUnionMeeting,
        estimatedBudget: Number(data.estimatedBudget) || 0,
      });

      // Convert datetime-local inputs to full ISO timestamp strings
      const payload: ActivityFormData = {
        ...data,
        description: serializedDescription,
        leadMemberId: data.leadMemberId?.trim() || undefined,
        startDate: fromDateTimeLocalString(data.startDate),
        endDate: fromDateTimeLocalString(data.endDate),
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setSubmitError((err as Error).message || 'Đã có lỗi xảy ra khi lưu hoạt động');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="activity-form-dialog"
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-hairline animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-cloud/50">
          <div>
            <h2 className="text-lg font-bold text-ink-navy">
              {isEditMode ? 'Chỉnh sửa hoạt động / sự kiện' : 'Tạo mới hoạt động / sự kiện'}
            </h2>
            <p className="text-xs text-slate-gray mt-0.5">
              {isEditMode
                ? 'Cập nhật thông tin chi tiết, phân loại chuẩn năng lực và thi đua Chi hội'
                : 'Lập kế hoạch tổ chức chương trình mới cho Đơn vị theo chuẩn Hội Sinh viên'}
            </p>
          </div>
          <button
            type="button"
            id="close-activity-dialog-btn"
            onClick={onClose}
            className="text-mist-gray hover:text-ink-navy p-1.5 rounded-lg hover:bg-pebble transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form
          onSubmit={handleSubmit(handleFormSubmit, (valErrors) => {
            console.error('Form validation failed:', valErrors);
            const firstErr = Object.values(valErrors)[0];
            if (firstErr?.message) {
              setSubmitError(String(firstErr.message));
            }
          })}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {/* Locked Notice Banner */}
          {isLocked && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs">
              <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span className="font-bold">Hoạt động đã ở trạng thái kết thúc ({activityToEdit?.status === 'completed' ? 'Đã hoàn thành' : 'Đã hủy'}).</span>
                <p className="mt-0.5 text-amber-700">Dữ liệu cốt lõi đã được lưu trữ an toàn trong lịch sử Đơn vị.</p>
              </div>
            </div>
          )}

          {/* Submission Error Banner */}
          {submitError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-gray border-b border-hairline pb-1.5">
              1. Thông tin chung & Đơn vị tổ chức
            </h3>

            {/* Activity Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1">
                Tên hoạt động / chương trình <span className="text-rose-500">*</span>
              </label>
              <input
                id="activity-title-input"
                type="text"
                disabled={isLocked}
                placeholder="VD: Chiến dịch Mùa Hè Xanh 2026, Sinh hoạt Chuyên đề Kỹ năng Y khoa..."
                {...register('title')}
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-signal-blue focus:border-signal-blue text-ink-navy disabled:bg-cloud disabled:text-slate-gray ${
                  errors.title ? 'border-rose-400 bg-rose-50/30' : 'border-hairline'
                }`}
              />
              {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title.message}</p>}
            </div>

            {/* Code & Term Selector Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Activity Code */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider">
                    Mã hoạt động (Tùy chọn)
                  </label>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="text-[11px] text-signal-blue hover:text-[#005be0] flex items-center gap-0.5 font-medium cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Tạo mã tự động</span>
                    </button>
                  )}
                </div>
                <input
                  id="activity-code-input"
                  type="text"
                  disabled={isLocked}
                  placeholder="VD: TN-2026-001"
                  {...register('code')}
                  className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg uppercase focus:ring-1 focus:ring-signal-blue focus:border-signal-blue text-ink-navy disabled:bg-cloud disabled:text-slate-gray ${
                    errors.code ? 'border-rose-400' : 'border-hairline'
                  }`}
                />
                {errors.code && <p className="text-xs text-rose-600 mt-1">{errors.code.message}</p>}
              </div>

              {/* Term Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1">
                  Nhiệm kỳ tổ chức <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="termId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      disabled={isLocked || terms.length === 0}
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="activity-term-select" className="w-full h-10 text-sm bg-white border-hairline rounded-lg text-ink-navy">
                        <SelectValue placeholder="Chọn nhiệm kỳ tổ chức" />
                      </SelectTrigger>
                      <SelectContent>
                        {terms.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} {t.isCurrent ? '(Nhiệm kỳ hiện tại)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.termId && <p className="text-xs text-rose-600 mt-1">{errors.termId.message}</p>}
              </div>
            </div>

            {/* Semester & Organizer Scope Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Semester Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1">
                  Học kỳ thực hiện <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="semester"
                  control={control}
                  render={({ field }) => (
                    <Select
                      disabled={isLocked}
                      value={field.value || 'hk1'}
                      onValueChange={(val) => field.onChange(val as SemesterId)}
                    >
                      <SelectTrigger id="activity-semester-select" className="w-full h-10 text-sm bg-white border-hairline rounded-lg text-ink-navy">
                        <SelectValue placeholder="Chọn học kỳ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hk1">
                          <span className="font-semibold text-ink-navy">Học kỳ I</span>
                          {termSemesters.find((s) => s.id === 'hk1') && (
                            <span className="text-slate-gray text-xs ml-1.5 font-normal">
                              ({termSemesters.find((s) => s.id === 'hk1')?.startDate} → {termSemesters.find((s) => s.id === 'hk1')?.endDate})
                            </span>
                          )}
                        </SelectItem>
                        <SelectItem value="hk2">
                          <span className="font-semibold text-ink-navy">Học kỳ II</span>
                          {termSemesters.find((s) => s.id === 'hk2') && (
                            <span className="text-slate-gray text-xs ml-1.5 font-normal">
                              ({termSemesters.find((s) => s.id === 'hk2')?.startDate} → {termSemesters.find((s) => s.id === 'hk2')?.endDate})
                            </span>
                          )}
                        </SelectItem>
                        <SelectItem value="hk3">
                          <span className="font-semibold text-ink-navy">Học kỳ III (Hè)</span>
                          {termSemesters.find((s) => s.id === 'hk3') && (
                            <span className="text-slate-gray text-xs ml-1.5 font-normal">
                              ({termSemesters.find((s) => s.id === 'hk3')?.startDate} → {termSemesters.find((s) => s.id === 'hk3')?.endDate})
                            </span>
                          )}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.semester && <p className="text-xs text-rose-600 mt-1">{errors.semester.message}</p>}
              </div>

              {/* Organizer Scope */}
              <div>
                <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1">
                  Cấp tổ chức <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="organizerScope"
                  control={control}
                  render={({ field }) => (
                    <Select
                      disabled={isLocked}
                      value={field.value || 'chapter'}
                      onValueChange={(val) => field.onChange(val as OrganizerScope)}
                    >
                      <SelectTrigger id="activity-scope-select" className="w-full h-10 text-sm bg-white border-hairline rounded-lg text-ink-navy">
                        <SelectValue placeholder="Chọn cấp tổ chức" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ORGANIZER_SCOPES).map((scope) => (
                          <SelectItem key={scope.id} value={scope.id}>
                            <span className="font-semibold text-ink-navy">{scope.badgeLabel}:</span>{' '}
                            <span className="text-slate-gray text-xs font-normal">{scope.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.organizerScope && <p className="text-xs text-rose-600 mt-1">{errors.organizerScope.message}</p>}
              </div>
            </div>

            {/* Lead Member & Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Responsible Person (Lead Member) */}
              <div>
                <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1">
                  Người phụ trách chính
                </label>
                <Controller
                  name="leadMemberId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      disabled={isLocked}
                      value={field.value || 'none'}
                      onValueChange={(val) => field.onChange(val === 'none' ? '' : val)}
                    >
                      <SelectTrigger id="activity-lead-member-select" className="w-full h-10 text-sm bg-white border-hairline rounded-lg text-ink-navy">
                        <SelectValue placeholder="-- Chưa chỉ định người phụ trách --" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectItem value="none">-- Chưa chỉ định người phụ trách --</SelectItem>
                        {leadCandidates.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <span className="font-semibold text-ink-navy">{m.fullName}</span>
                            {m.position ? (
                              <span className="text-slate-gray ml-1.5 text-xs font-normal">
                                - {m.position}
                              </span>
                            ) : m.email ? (
                              <span className="text-mist-gray ml-1.5 text-xs font-normal">
                                ({m.email})
                              </span>
                            ) : m.studentId ? (
                              <span className="text-mist-gray ml-1.5 text-xs font-normal">
                                ({m.studentId})
                              </span>
                            ) : null}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.leadMemberId && <p className="text-xs text-rose-600 mt-1">{errors.leadMemberId.message}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1">
                  Phân loại hoạt động <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      disabled={isLocked}
                      value={field.value || 'general'}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="activity-category-select" className="w-full h-10 text-sm bg-white border-hairline rounded-lg text-ink-navy">
                        <SelectValue placeholder="Chọn phân loại hoạt động" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ACTIVITY_CATEGORIES).map((c) => (
                          <SelectItem key={c.key} value={c.key}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-xs text-rose-600 mt-1">{errors.category.message}</p>}
              </div>
            </div>

            {/* Status Row (Only visible when editing existing activity) */}
            {isEditMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1">
                  Trạng thái hoạt động <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      disabled={isLocked}
                      value={field.value || 'draft'}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="activity-status-select" className="w-full h-10 text-sm bg-white border-hairline rounded-lg text-ink-navy">
                        <SelectValue placeholder="Chọn trạng thái hoạt động" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ACTIVITY_STATUSES).map((s) => (
                          <SelectItem key={s.key} value={s.key}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && <p className="text-xs text-rose-600 mt-1">{errors.status.message}</p>}
              </div>
            )}
          </div>

          {/* Section 2: Time, Location & Scale */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-gray border-b border-hairline pb-1.5">
              2. Kế hoạch thời gian, Địa điểm & Quy mô
            </h3>

            {/* Dates Row: Start Date & End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1">
                  Thời gian bắt đầu <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      showTime={true}
                      value={field.value}
                      onChange={handleStartDateChange}
                      placeholder="Chọn thời gian bắt đầu"
                      disabled={isLocked}
                    />
                  )}
                />
                {errors.startDate && <p className="text-xs text-rose-600 mt-1">{errors.startDate.message}</p>}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1">
                  Thời gian kết thúc <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      showTime={true}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Chọn thời gian kết thúc"
                      disabled={isLocked}
                    />
                  )}
                />
                {errors.endDate && <p className="text-xs text-rose-600 mt-1">{errors.endDate.message}</p>}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1">
                Địa điểm tổ chức
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-mist-gray absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="activity-location-input"
                  type="text"
                  disabled={isLocked}
                  placeholder="VD: Giảng đường 1, Sân bóng trường, Trạm y tế xã..."
                  {...register('location')}
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-hairline rounded-lg focus:ring-1 focus:ring-signal-blue focus:border-signal-blue text-ink-navy disabled:bg-cloud disabled:text-slate-gray"
                />
              </div>
              {errors.location && <p className="text-xs text-rose-600 mt-1">{errors.location.message}</p>}
            </div>

            {/* Target Members, Budget & Computed Scale Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Target Members */}
              <div>
                <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1">
                  Số người tham gia dự kiến
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-mist-gray absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="activity-target-members-input"
                    type="number"
                    min="0"
                    disabled={isLocked}
                    placeholder="50"
                    {...register('targetMembers')}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-hairline rounded-lg focus:ring-1 focus:ring-signal-blue focus:border-signal-blue text-ink-navy tabular-nums disabled:bg-cloud disabled:text-slate-gray"
                  />
                </div>
                {errors.targetMembers && <p className="text-xs text-rose-600 mt-1">{errors.targetMembers.message}</p>}
              </div>

              {/* Estimated Budget */}
              <div>
                <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1">
                  Dự toán kinh phí (VNĐ)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-mist-gray absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="activity-budget-input"
                    type="number"
                    min="0"
                    step="100000"
                    disabled={isLocked}
                    placeholder="0"
                    {...register('estimatedBudget')}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-hairline rounded-lg focus:ring-1 focus:ring-signal-blue focus:border-signal-blue text-ink-navy tabular-nums disabled:bg-cloud disabled:text-slate-gray"
                  />
                </div>
                {errors.estimatedBudget && <p className="text-xs text-rose-600 mt-1">{errors.estimatedBudget.message}</p>}
              </div>

              {/* Activity Scale Badge (Live Auto Calculation) */}
              <div>
                <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1">
                  Quy mô thi đua HSV
                </label>
                <div className="h-10 px-3 py-2 bg-cloud rounded-lg border border-hairline flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-navy">
                    {ACTIVITY_SCALES[watchedActivityScale]?.label}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ACTIVITY_SCALES[watchedActivityScale]?.badgeClass}`}
                  >
                    +{ACTIVITY_SCALES[watchedActivityScale]?.pointsHsV}đ HSV
                  </span>
                </div>
                <p className="text-[11px] text-slate-gray mt-1 leading-tight">
                  {ACTIVITY_SCALES[watchedActivityScale]?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Evaluation Criteria & Competencies */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-gray border-b border-hairline pb-1.5 flex items-center justify-between">
              <span>3. Chuẩn Năng Lực & Tiêu Chí Thi Đua Chi Hội</span>
              <span className="text-[11px] font-normal lowercase text-slate-gray">
                (Khung chuẩn CTUMP & HSV)
              </span>
            </h3>

            {/* Monthly Union Meeting Toggle */}
            <div className="p-3.5 bg-sky-50/60 border border-sky-200/80 rounded-xl flex items-start gap-3">
              <input
                id="is-monthly-meeting-checkbox"
                type="checkbox"
                disabled={isLocked}
                {...register('isMonthlyUnionMeeting')}
                className="mt-0.5 h-4.5 w-4.5 rounded border-hairline text-signal-blue focus:ring-signal-blue cursor-pointer"
              />
              <div className="flex-1 text-xs">
                <label
                  htmlFor="is-monthly-meeting-checkbox"
                  className="font-bold text-ink-navy cursor-pointer flex items-center gap-1.5"
                >
                  Sinh hoạt Chi đoàn / Chi hội định kỳ hàng tháng
                  <span className="inline-flex items-center px-1.5 py-0.2 bg-signal-blue/10 text-signal-blue font-semibold rounded text-[10px]">
                    +50đ / lần
                  </span>
                </label>
                <p className="text-slate-gray mt-0.5">
                  Đánh dấu nếu đây là buổi sinh hoạt định kỳ chi đoàn/chi hội (Tiêu chí Mục 1.1 trong bảng điểm thi đua Chi hội).
                </p>
              </div>
            </div>

            {/* Lean Competency Tags Matrix */}
            <div>
              <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Chuẩn Năng Lực Hội Sinh Viên phụ trách</span>
                <span className="text-[11px] font-normal text-slate-gray">
                  Đã chọn {watchedCompetencyTags.length} chuẩn
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.values(LEAN_COMPETENCY_TAGS).map((tag) => {
                  const isSelected = watchedCompetencyTags.includes(tag.key);
                  return (
                    <button
                      key={tag.key}
                      type="button"
                      disabled={isLocked}
                      onClick={() => toggleCompetencyTag(tag.key)}
                      className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#e6f0ff] border-signal-blue ring-1 ring-signal-blue'
                          : 'bg-white border-hairline hover:bg-cloud/60'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border text-xs ${
                          isSelected
                            ? 'bg-signal-blue border-signal-blue text-white'
                            : 'border-mist-gray bg-white'
                        }`}
                      >
                        {isSelected && '✓'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold px-1.5 py-0.2 bg-white rounded border border-hairline text-ink-navy">
                            Mã {tag.code}
                          </span>
                          <span className="text-xs font-bold text-ink-navy truncate">
                            {tag.name}
                          </span>
                          {tag.yearlyRequirement && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium border border-amber-200">
                              {tag.yearlyRequirement}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-gray mt-1 line-clamp-1">
                          {tag.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SV5T Criteria Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Tiêu chí Sinh Viên 5 Tốt hỗ trợ</span>
                <span className="text-[11px] font-normal text-slate-gray">
                  Hội viên tham gia được ghi nhận tiêu chí
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(SV5T_CRITERIA).map((crit) => {
                  const isSelected = watchedSv5tCriteria.includes(crit.key);
                  return (
                    <button
                      key={crit.key}
                      type="button"
                      disabled={isLocked}
                      onClick={() => toggleSv5tCriterion(crit.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-signal-blue text-white border-signal-blue shadow-xs'
                          : 'bg-white text-ink-navy border-hairline hover:bg-cloud'
                      }`}
                    >
                      <span>{crit.label}</span>
                      {isSelected && <span className="text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Description */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-gray uppercase tracking-wider">
              Mô tả chi tiết & Kế hoạch nội dung
            </label>
            <textarea
              id="activity-description-input"
              rows={3}
              disabled={isLocked}
              placeholder="Mục đích, ý nghĩa hoạt động, đối tượng hướng đến, lưu ý cho người tham gia..."
              {...register('description')}
              className="w-full px-3.5 py-2 text-sm bg-white border border-hairline rounded-lg focus:ring-1 focus:ring-signal-blue focus:border-signal-blue text-ink-navy disabled:bg-cloud disabled:text-slate-gray"
            />
            {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description.message}</p>}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-hairline flex items-center justify-end gap-2.5">
            <button
              type="button"
              id="cancel-activity-form-btn"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-gray bg-white border border-hairline rounded-lg hover:bg-pebble hover:text-ink-navy transition-colors cursor-pointer"
            >
              {isLocked ? 'Đóng' : 'Hủy bỏ'}
            </button>
            {!isLocked && (
              <button
                type="submit"
                id="submit-activity-form-btn"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-signal-blue rounded-lg hover:bg-[#005be0] shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>{isEditMode ? 'Lưu thay đổi' : 'Tạo hoạt động'}</span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
