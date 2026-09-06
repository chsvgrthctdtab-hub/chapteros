import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Download,
  Copy,
  Sparkles,
  Calendar,
  MapPin,
  Building2,
  Clock,
  User,
  Check,
  Loader2,
  Flag,
  Share2,
  Phone,
  Layers,
  Palette,
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { CollabActivity, CollabTask, Plan } from '@/types';

interface CollabTimelineExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: CollabActivity;
  plan?: Plan | null;
  tasks: CollabTask[];
}

export function CollabTimelineExportModal({
  isOpen,
  onClose,
  activity,
  plan,
  tasks,
}: CollabTimelineExportModalProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'navy' | 'clean'>('navy');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Group tasks by Phase
  const groupedTasks = tasks.reduce((acc, task) => {
    const phaseName = task.phase?.trim() || 'Hạng mục công việc chung';
    if (!acc[phaseName]) {
      acc[phaseName] = [];
    }
    acc[phaseName].push(task);
    return acc;
  }, {} as Record<string, CollabTask[]>);

  // Sort phases: put common/undefined last, and sort tasks within each phase by date/time
  const sortedPhases = Object.keys(groupedTasks).sort((a, b) => {
    if (a === 'Hạng mục công việc chung') return 1;
    if (b === 'Hạng mục công việc chung') return -1;
    return a.localeCompare(b);
  });

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { label: 'Khẩn cấp', color: 'bg-rose-500 text-white' };
      case 'high':
        return { label: 'Ưu tiên cao', color: 'bg-amber-500 text-white' };
      case 'medium':
        return { label: 'Trung bình', color: 'bg-blue-500 text-white' };
      default:
        return { label: 'Tiêu chuẩn', color: 'bg-slate-400 text-white' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done':
        return { label: 'Đã hoàn thành', icon: '✅', color: 'text-emerald-400' };
      case 'in_progress':
        return { label: 'Đang triển khai', icon: '⏳', color: 'text-amber-300' };
      case 'review':
        return { label: 'Đang duyệt', icon: '👀', color: 'text-purple-300' };
      default:
        return { label: 'Chờ thực hiện', icon: '📌', color: 'text-slate-300' };
    }
  };

  const handleCopyToClipboard = async () => {
    if (!posterRef.current) return;
    try {
      setIsExporting(true);
      const blob = await toBlob(posterRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
      });

      if (!blob) throw new Error('Không thể tạo hình ảnh');

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 3500);
      } else {
        await handleDownload();
      }
    } catch (err) {
      console.error('Lỗi khi sao chép ảnh:', err);
      alert('Không thể sao chép trực tiếp vào clipboard trên trình duyệt này. Hệ thống sẽ tự động tải file ảnh về máy cho bạn.');
      await handleDownload();
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
      });

      const safeName = activity.title.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_');
      const link = document.createElement('a');
      link.download = `Ke_Hoach_Tac_Chien_${safeName}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Lỗi khi tải ảnh:', err);
      alert('Có lỗi khi tạo ảnh. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[94vh] flex flex-col bg-slate-900/95 border border-slate-700/80 text-white shadow-2xl rounded-3xl p-0 overflow-hidden">
        {/* Header Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Xuất Bản Poster Kế Hoạch Tác Chiến</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
              Ảnh Infographic Phân Công Tiến Độ & Timeline
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700 text-xs font-medium">
              <button
                type="button"
                onClick={() => setTheme('navy')}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer',
                  theme === 'navy'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Đoàn - Hội Navy</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('clean')}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer',
                  theme === 'clean'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <span>Trắng Tinh Tế</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60 flex justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* THE POSTER ELEMENT CAPTURED BY HTML-TO-IMAGE */}
          <div
            ref={posterRef}
            className={cn(
              'w-full max-w-2xl rounded-2xl shadow-2xl transition-all overflow-hidden p-6 sm:p-8',
              theme === 'navy'
                ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 border border-indigo-500/30'
                : 'bg-white text-slate-900 border border-slate-200'
            )}
            style={{ minWidth: '320px' }}
          >
            {/* Top Brand Banner */}
            <div className="flex items-center justify-between border-b pb-4 mb-5 border-slate-500/20">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm',
                  theme === 'navy' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-900 text-white'
                )}>
                  OS
                </div>
                <div>
                  <span className={cn(
                    'text-[10px] font-black tracking-widest uppercase block',
                    theme === 'navy' ? 'text-purple-400' : 'text-purple-600'
                  )}>
                    ChapterOS • Chiến Dịch Phối Hợp
                  </span>
                  <span className={cn('text-xs font-bold', theme === 'navy' ? 'text-slate-300' : 'text-slate-700')}>
                    KẾ HOẠCH TÁC CHIẾN & PHÂN CÔNG NHIỆM VỤ
                  </span>
                </div>
              </div>

              <div className={cn(
                'text-[10px] px-2.5 py-1 rounded-full border font-mono font-semibold',
                theme === 'navy'
                  ? 'bg-indigo-950/60 border-indigo-500/30 text-indigo-300'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              )}>
                {activity.code}
              </div>
            </div>

            {/* Main Activity Header */}
            <div className="space-y-3 mb-6">
              <h1 className={cn(
                'text-xl sm:text-2xl font-black uppercase tracking-tight leading-snug',
                theme === 'navy' ? 'text-white' : 'text-slate-950'
              )}>
                {activity.title}
              </h1>

              {/* Meta information tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {activity.leadOrganization && (
                  <div className="flex items-center gap-2">
                    <Building2 className={cn('w-3.5 h-3.5 shrink-0', theme === 'navy' ? 'text-purple-400' : 'text-purple-600')} />
                    <span>
                      <strong>Đơn vị chủ trì:</strong> {activity.leadOrganization.name}
                    </span>
                  </div>
                )}

                {plan && (
                  <div className="flex items-center gap-2">
                    <Layers className={cn('w-3.5 h-3.5 shrink-0', theme === 'navy' ? 'text-indigo-400' : 'text-indigo-600')} />
                    <span className="truncate">
                      <strong>Kế hoạch:</strong> {plan.name}
                    </span>
                  </div>
                )}

                {(activity.startDate || activity.endDate) && (
                  <div className="flex items-center gap-2">
                    <Calendar className={cn('w-3.5 h-3.5 shrink-0', theme === 'navy' ? 'text-blue-400' : 'text-blue-600')} />
                    <span>
                      <strong>Thời gian:</strong> {formatDate(activity.startDate)} {activity.endDate && activity.endDate !== activity.startDate ? `➔ ${formatDate(activity.endDate)}` : ''}
                    </span>
                  </div>
                )}

                {activity.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className={cn('w-3.5 h-3.5 shrink-0', theme === 'navy' ? 'text-rose-400' : 'text-rose-600')} />
                    <span className="truncate">
                      <strong>Địa điểm:</strong> {activity.location}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Body: Phases and Tasks */}
            <div className="space-y-5">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 italic">
                  Chưa có công việc nào được thiết lập trong hoạt động này.
                </div>
              ) : (
                sortedPhases.map((phaseName) => {
                  const phaseTasks = groupedTasks[phaseName];
                  return (
                    <div
                      key={phaseName}
                      className={cn(
                        'rounded-xl p-3.5 sm:p-4 border',
                        theme === 'navy'
                          ? 'bg-slate-800/40 border-slate-700/60'
                          : 'bg-slate-50/80 border-slate-200'
                      )}
                    >
                      {/* Phase Title Header */}
                      <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-500/15">
                        <Flag className={cn('w-4 h-4 shrink-0', theme === 'navy' ? 'text-purple-400' : 'text-purple-600')} />
                        <h3 className={cn(
                          'text-xs sm:text-sm font-extrabold uppercase tracking-wider',
                          theme === 'navy' ? 'text-purple-300' : 'text-purple-900'
                        )}>
                          {phaseName}
                        </h3>
                        <span className="ml-auto text-[10px] font-mono opacity-60">
                          {phaseTasks.length} đầu việc
                        </span>
                      </div>

                      {/* Tasks List */}
                      <div className="space-y-2.5">
                        {phaseTasks.map((t) => {
                          const priority = getPriorityLabel(t.priority);
                          const status = getStatusLabel(t.status);

                          return (
                            <div
                              key={t.id}
                              className={cn(
                                'p-3 rounded-lg border text-xs space-y-1.5 transition-all',
                                theme === 'navy'
                                  ? 'bg-slate-900/80 border-slate-700/80 text-slate-200'
                                  : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                              )}
                            >
                              {/* Task Header: Time & Status */}
                              <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                                <div className="flex items-center gap-1.5 font-mono">
                                  {(t.dueTime || t.dueDate) ? (
                                    <span className={cn(
                                      'inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold',
                                      theme === 'navy' ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    )}>
                                      <Clock className="w-3 h-3" />
                                      <span>
                                        {t.dueTime ? `${t.dueTime} ` : ''}
                                        {t.dueDate ? `(${formatDate(t.dueDate)})` : ''}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">Linh hoạt</span>
                                  )}
                                  <span className={cn('text-[9px] px-1.5 py-0.2 rounded font-bold uppercase', priority.color)}>
                                    {priority.label}
                                  </span>
                                </div>

                                <div className={cn('font-semibold flex items-center gap-1 text-[11px]', status.color)}>
                                  <span>{status.icon}</span>
                                  <span>{status.label}</span>
                                </div>
                              </div>

                              {/* Task Title */}
                              <div className="font-bold text-sm leading-snug">
                                {t.title}
                              </div>

                              {/* Description if available */}
                              {t.description && (
                                <p className={cn(
                                  'text-[11px] leading-relaxed',
                                  theme === 'navy' ? 'text-slate-400' : 'text-slate-600'
                                )}>
                                  {t.description}
                                </p>
                              )}

                              {/* Assignee Footer */}
                              <div className="pt-1 flex items-center justify-between gap-2 flex-wrap text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  {t.externalAssignee ? (
                                    <div className={cn(
                                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold',
                                      theme === 'navy'
                                        ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                                        : 'bg-purple-50 text-purple-800 border border-purple-200'
                                    )}>
                                      <Share2 className="w-3 h-3" />
                                      <span>Đối tác: <strong>{t.externalAssignee}</strong></span>
                                      {t.externalContact && (
                                        <span className="font-mono text-[10px] opacity-80 flex items-center gap-0.5 ml-1">
                                          <Phone className="w-2.5 h-2.5" />
                                          {t.externalContact}
                                        </span>
                                      )}
                                    </div>
                                  ) : t.assignee ? (
                                    <div className={cn(
                                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold',
                                      theme === 'navy'
                                        ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                                    )}>
                                      <User className="w-3 h-3" />
                                      <span>Phụ trách: <strong>{t.assignee.fullName}</strong></span>
                                      {t.organization && (
                                        <span className="opacity-75 font-normal">({t.organization.name})</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">
                                      Chưa phân công nhân sự
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Poster Footer Note */}
            <div className={cn(
              'mt-6 pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px]',
              theme === 'navy' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
            )}>
              <div>
                <span>Lưu ý: Mọi vướng mắc liên hệ trực tiếp Ban Chỉ Huy qua nhóm điều phối liên đơn vị.</span>
              </div>
              <div className="font-mono text-right">
                Xuất bản từ ChapterOS • {new Date().toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            {copiedSuccess ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                Đã sao chép ảnh! Bạn hãy mở Zalo / Messenger và nhấn Ctrl + V để gửi ngay.
              </span>
            ) : downloadSuccess ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                Đã tải file ảnh sắc nét về máy!
              </span>
            ) : (
              <span>💡 Mẹo: Bấm &ldquo;Sao chép ảnh&rdquo; rồi paste trực tiếp vào Zalo để gửi cho Đoàn xã/Trường bạn.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Đóng
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleCopyToClipboard}
              disabled={isExporting}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : copiedSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedSuccess ? 'Đã sao chép!' : 'Sao chép ảnh (Gửi Zalo)'}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              disabled={isExporting}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Tải ảnh PNG (2x)</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
