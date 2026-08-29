import { useState } from 'react';
import {
  CalendarDays,
  ExternalLink,
  Plus,
  RefreshCw,
  Unlink,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  Layers,
  Globe,
  Loader2,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUserCalendars, useActivityCalendarEvent } from '../google-calendar.queries';
import {
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useUnlinkCalendarEvent,
  useDeleteGoogleCalendarEvent,
} from '../google-calendar.mutations';
import { validateActivityForCalendar, buildGoogleCalendarTemplateUrl } from '../calendar-mappings';
import { APP_DEFAULT_TIMEZONE_LABEL } from '../google-calendar.constants';
import { formatDateTime, formatDateRange } from '@/lib/date';
import type { Activity } from '@/types';

interface ActivityCalendarIntegrationCardProps {
  activity: Activity;
  canManage?: boolean;
}

export function ActivityCalendarIntegrationCard({
  activity,
  canManage = false,
}: ActivityCalendarIntegrationCardProps) {
  const { user, activeOrganization } = useAuth();
  const orgId = activity.organizationId || activeOrganization?.id || '';

  // Dialog states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Queries
  const { data: calendars = [], isLoading: isLoadingCalendars } = useUserCalendars(orgId);
  const {
    data: calendarEvent,
    isLoading: isLoadingEvent,
  } = useActivityCalendarEvent(activity.id, orgId);

  // Mutations
  const createMutation = useCreateCalendarEvent();
  const updateMutation = useUpdateCalendarEvent();
  const unlinkMutation = useUnlinkCalendarEvent();
  const deleteMutation = useDeleteGoogleCalendarEvent();

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    unlinkMutation.isPending ||
    deleteMutation.isPending;

  // Validation
  const validation = validateActivityForCalendar(activity);
  const isLinked = Boolean(calendarEvent && calendarEvent.googleEventId && calendarEvent.status !== 'unavailable');
  const isUnavailable = calendarEvent?.status === 'unavailable';

  // Quick Direct Template URL
  const directTemplateUrl = buildGoogleCalendarTemplateUrl(activity, window.location.href);

  // Handlers
  const handleOpenCreateModal = () => {
    setSyncErrorMessage(null);
    if (calendars.length > 0 && !selectedCalendarId) {
      setSelectedCalendarId(calendars[0].id);
    }
    setIsCreateModalOpen(true);
  };

  const handleCreateConfirm = async () => {
    if (!orgId || !activity.id) return;
    setSyncErrorMessage(null);

    const selectedCal = calendars.find((c) => c.id === selectedCalendarId);

    try {
      await createMutation.mutateAsync({
        params: {
          organizationId: orgId,
          activityId: activity.id,
          calendarId: selectedCalendarId || 'primary',
          calendarSummary: selectedCal?.summary || 'Lịch chính',
          userId: user?.id,
        },
        activity,
        appUrl: window.location.href,
      });
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      setSyncErrorMessage((err as Error).message || 'Không thể tạo liên kết trên Google Calendar.');
    }
  };

  const handleUpdateEvent = async () => {
    if (!calendarEvent || !orgId || !activity.id) return;
    setSyncErrorMessage(null);

    try {
      await updateMutation.mutateAsync({
        params: {
          organizationId: orgId,
          activityId: activity.id,
          calendarEventId: calendarEvent.id,
          calendarId: calendarEvent.googleCalendarId,
          userId: user?.id,
        },
        activity,
        appUrl: window.location.href,
      });
    } catch (err: unknown) {
      setSyncErrorMessage((err as Error).message || 'Không thể cập nhật liên kết Google Calendar.');
    }
  };

  const handleUnlinkConfirm = async () => {
    if (!calendarEvent || !orgId || !activity.id) return;
    setSyncErrorMessage(null);

    try {
      await unlinkMutation.mutateAsync({
        calendarEventId: calendarEvent.id,
        organizationId: orgId,
        activityId: activity.id,
        userId: user?.id,
      });
      setIsUnlinkModalOpen(false);
    } catch (err: unknown) {
      setSyncErrorMessage((err as Error).message || 'Không thể gỡ liên kết sự kiện.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!calendarEvent || !orgId || !activity.id) return;
    setSyncErrorMessage(null);

    try {
      await deleteMutation.mutateAsync({
        calendarEventId: calendarEvent.id,
        organizationId: orgId,
        activityId: activity.id,
        calendarId: calendarEvent.googleCalendarId,
        googleEventId: calendarEvent.googleEventId,
        userId: user?.id,
      });
      setIsDeleteModalOpen(false);
    } catch (err: unknown) {
      setSyncErrorMessage((err as Error).message || 'Không thể xóa liên kết Google Calendar.');
    }
  };

  const handleOpenGoogleCalendar = () => {
    const targetUrl = calendarEvent?.eventUrl || directTemplateUrl;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      const targetUrl = calendarEvent?.eventUrl || directTemplateUrl;
      await navigator.clipboard.writeText(targetUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div id="google-calendar-integration-section" className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Tích hợp Google Calendar</h3>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-700 bg-blue-50/60 border-blue-200">
                Phase 13
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Chiếu lịch hoạt động sang Google Calendar để theo dõi lịch trình và nhận thông báo nhắc nhở.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct Google Calendar Template Open */}
          <Button
            type="button"
            id="open-google-calendar-external-btn"
            variant="outline"
            size="sm"
            onClick={handleOpenGoogleCalendar}
            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 border-blue-200"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Mở Google Calendar
          </Button>

          {canManage && (
            <>
              {!isLinked ? (
                <Button
                  type="button"
                  id="open-create-calendar-event-modal-btn"
                  size="sm"
                  onClick={handleOpenCreateModal}
                  disabled={!validation.isValid || isPending}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Lưu liên kết Lịch
                </Button>
              ) : (
                <Button
                  type="button"
                  id="sync-update-calendar-event-btn"
                  variant="outline"
                  size="sm"
                  onClick={handleUpdateEvent}
                  disabled={isPending}
                  className="text-xs text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-slate-500 ${updateMutation.isPending ? 'animate-spin' : ''}`} />
                  Cập nhật liên kết
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sync Error Banner if any */}
      {syncErrorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Đã xảy ra lỗi đồng bộ</p>
            <p className="text-rose-700 leading-relaxed">{syncErrorMessage}</p>
          </div>
        </div>
      )}

      {/* Main State Box */}
      {isLoadingEvent ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500 font-medium">Đang kiểm tra liên kết Google Calendar...</p>
        </div>
      ) : isLinked && calendarEvent ? (
        /* LINKED STATE */
        <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Đã liên kết Lịch Google
                </span>
                <span className="text-[11px] text-slate-400">
                  ID: <code className="font-mono text-slate-600">{calendarEvent.googleEventId}</code>
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900 pt-1">
                {activity.title}
              </h4>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id="copy-calendar-link-btn"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{isCopied ? 'Đã sao chép' : 'Sao chép link'}</span>
              </button>

              {canManage && (
                <>
                  <button
                    type="button"
                    id="open-unlink-calendar-dialog-btn"
                    onClick={() => setIsUnlinkModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ngắt liên kết</span>
                  </button>

                  <button
                    type="button"
                    id="open-delete-calendar-dialog-btn"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Xóa liên kết</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200/70 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200/60 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Thời gian sự kiện</span>
              </div>
              <p className="font-semibold text-slate-800 truncate">
                {formatDateRange(activity.startDate, activity.endDate)}
              </p>
              <p className="text-[10px] text-slate-500">{APP_DEFAULT_TIMEZONE_LABEL}</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200/60 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Lịch đích (Calendar)</span>
              </div>
              <p className="font-semibold text-slate-800 truncate">
                {calendarEvent.googleCalendarSummary || 'Lịch chính (Primary Calendar)'}
              </p>
              <p className="text-[10px] text-slate-500">Tài khoản Google liên kết</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200/60 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Lần đồng bộ cuối</span>
              </div>
              <p className="font-semibold text-slate-800">
                {calendarEvent.lastSyncedAt ? formatDateTime(calendarEvent.lastSyncedAt) : 'Vừa xong'}
              </p>
              <p className="text-[10px] text-emerald-600 font-medium">Trạng thái: Đã khớp liên kết</p>
            </div>
          </div>

          {/* Sync Direction Notice */}
          <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs text-blue-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Mô hình liên kết:</strong> ChapterOS (Nguồn dữ liệu gốc) → Google Calendar (Chiếu lịch trình).
              </span>
            </div>
            <span className="text-[11px] text-blue-700 shrink-0 hidden sm:inline">
              Múi giờ chuẩn GMT+7
            </span>
          </div>
        </div>
      ) : isUnavailable ? (
        /* UNAVAILABLE / EXTERNALLY DELETED STATE */
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm font-bold text-amber-900">Liên kết Google Calendar không khả dụng</h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              Liên kết trước đây đã bị thay đổi hoặc gỡ bỏ. Hoạt động trên ChapterOS vẫn được bảo toàn nguyên vẹn.
            </p>
          </div>
          {canManage && (
            <Button
              type="button"
              id="recreate-calendar-event-btn"
              size="sm"
              onClick={handleOpenCreateModal}
              disabled={isPending}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Tạo lại liên kết Google Calendar
            </Button>
          )}
        </div>
      ) : (
        /* NOT LINKED STATE */
        <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
            <CalendarDays className="w-6 h-6" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="text-sm font-bold text-slate-900">
              Thêm hoạt động vào Google Calendar
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có thể mở ngay trên Google Calendar để lưu vào lịch cá nhân, hoặc lưu bản ghi liên kết vào hệ thống quản lý chi hội.
            </p>
          </div>

          {/* Validation Warnings */}
          {!validation.isValid && (
            <div className="max-w-md mx-auto p-3 rounded-lg bg-amber-50 border border-amber-200 text-left text-xs text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Vui lòng cập nhật đầy đủ thông tin hoạt động:
              </p>
              <ul className="list-disc list-inside text-amber-700 pl-1 space-y-0.5 text-[11px]">
                {validation.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-1 flex items-center justify-center gap-3 flex-wrap">
            <Button
              type="button"
              id="direct-open-calendar-cta-btn"
              variant="outline"
              size="sm"
              onClick={handleOpenGoogleCalendar}
              disabled={!validation.isValid}
              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 border-blue-200"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Thêm vào Google Calendar ngay
            </Button>

            {canManage && (
              <Button
                type="button"
                id="create-calendar-event-cta-btn"
                size="sm"
                onClick={handleOpenCreateModal}
                disabled={!validation.isValid || isPending}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Lưu liên kết Lịch Chi hội
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Projection Principles Guide */}
      <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3 text-xs">
        <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>Nguyên tắc quản lý & Nguồn sự thật (Source of Truth):</span>
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600 leading-relaxed">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200/60 space-y-1">
            <span className="font-semibold text-slate-800 block text-[11px]">1. Supabase là nguồn sự thật</span>
            <p className="text-[11px] text-slate-500">
              ChapterOS nắm giữ dữ liệu gốc. Google Calendar đóng vai trò là lớp hiển thị chiếu (projection layer).
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200/60 space-y-1">
            <span className="font-semibold text-slate-800 block text-[11px]">2. Phân định ngắt liên kết</span>
            <p className="text-[11px] text-slate-500">
              Ngắt liên kết chỉ xóa bản ghi mapping trong hệ thống, không xóa hoạt động Chi hội và không ảnh hưởng tài khoản cá nhân.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200/60 space-y-1">
            <span className="font-semibold text-slate-800 block text-[11px]">3. Chuẩn hóa Múi giờ GMT+7</span>
            <p className="text-[11px] text-slate-500">
              Đảm bảo thời gian bắt đầu và kết thúc sự kiện được cố định theo giờ chuẩn Việt Nam ({APP_DEFAULT_TIMEZONE_LABEL}).
            </p>
          </div>
        </div>
      </div>

      {/* DIALOG 1: Create Calendar Event Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => !isPending && setIsCreateModalOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-blue-600">
              <CalendarDays className="w-5 h-5" />
              <DialogTitle className="text-base font-bold text-slate-900">
                Lưu liên kết Google Calendar
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Chọn Lịch đích để liên kết thông tin hoạt động từ ChapterOS với Google Calendar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Activity Summary Preview */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900 text-sm">{activity.title}</p>
              <div className="space-y-1 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDateRange(activity.startDate, activity.endDate)}</span>
                </div>
                {activity.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activity.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 block">
                Chọn Lịch Google nhận sự kiện:
              </label>
              {isLoadingCalendars ? (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Đang tải danh sách lịch...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {calendars.map((cal) => {
                    const isSelected = selectedCalendarId === cal.id;
                    return (
                      <div
                        key={cal.id}
                        onClick={() => setSelectedCalendarId(cal.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <p className="font-bold text-slate-900 truncate">{cal.summary}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {cal.description || (cal.primary ? 'Lịch cá nhân chính' : 'Lịch Google Chi hội')}
                          </p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Note on notification */}
            <p className="text-[11px] text-slate-500 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
              ℹ️ Sự kiện sẽ được tạo với cấu hình múi giờ chuẩn Việt Nam (GMT+7). Ban Chấp Hành có thể nhấp để thêm vào Google Calendar bất cứ lúc nào.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isPending}
              className="text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              id="confirm-create-calendar-event-btn"
              size="sm"
              onClick={handleCreateConfirm}
              disabled={isPending || !selectedCalendarId}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Xác nhận lưu liên kết
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Unlink Confirmation Modal */}
      <Dialog open={isUnlinkModalOpen} onOpenChange={(open) => !isPending && setIsUnlinkModalOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-slate-700">
              <Unlink className="w-5 h-5 text-amber-600" />
              <DialogTitle className="text-base font-bold text-slate-900">
                Ngắt liên kết Google Calendar
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Bạn có chắc chắn muốn ngắt liên kết giữa hoạt động này và Google Calendar?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <p className="font-semibold">Lưu ý quan trọng:</p>
            <ul className="list-disc list-inside text-amber-800 space-y-1 text-[11px]">
              <li>Hoạt động trên ChapterOS vẫn được bảo toàn nguyên vẹn.</li>
              <li>Sự kiện trên Google Calendar của bạn sẽ <strong>không bị xóa</strong>.</li>
              <li>Bạn có thể tạo lại liên kết bất kỳ lúc nào.</li>
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUnlinkModalOpen(false)}
              disabled={isPending}
              className="text-xs"
            >
              Giữ liên kết
            </Button>
            <Button
              type="button"
              id="confirm-unlink-calendar-event-btn"
              size="sm"
              onClick={handleUnlinkConfirm}
              disabled={isPending}
              className="text-xs bg-slate-900 hover:bg-black text-white"
            >
              {unlinkMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Xác nhận ngắt liên kết
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Delete Event Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !isPending && setIsDeleteModalOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <DialogTitle className="text-base font-bold text-slate-900">
                Xóa bản ghi liên kết Google Calendar
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Thao tác này sẽ xóa bản ghi liên kết lịch trong hệ thống ChapterOS.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
            <p className="font-semibold">Cảnh báo:</p>
            <ul className="list-disc list-inside text-rose-800 space-y-1 text-[11px]">
              <li>Bản ghi liên kết trong ChapterOS sẽ bị xóa.</li>
              <li>Dữ liệu Hoạt động gốc trong ChapterOS <strong>vẫn được giữ nguyên 100%</strong>.</li>
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isPending}
              className="text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              id="confirm-delete-google-calendar-event-btn"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Xác nhận xóa liên kết
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
