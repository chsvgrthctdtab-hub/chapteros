import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Calendar,
  Users,
  CheckSquare,
  DollarSign,
  FileSpreadsheet,
  AlertTriangle,
  Award,
  Clock,
} from 'lucide-react';
import type { Term } from '@/types';
import type { TermClosingSnapshot } from '../types/term.types';

interface TermClosingSnapshotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term: Term | null;
}

export function TermClosingSnapshotModal({
  open,
  onOpenChange,
  term,
}: TermClosingSnapshotModalProps) {
  if (!term || !term.closingSnapshot) return null;

  const snapshot = term.closingSnapshot as unknown as TermClosingSnapshot;
  const stats = snapshot.stats;

  // Key officers / executive members from roster
  const keyOfficers = (snapshot.membersRoster || []).filter(
    (m) =>
      m.position?.toLowerCase().includes('trưởng') ||
      m.position?.toLowerCase().includes('phó') ||
      m.position?.toLowerCase().includes('ủy viên') ||
      m.department?.toLowerCase().includes('ban chấp hành')
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-xl font-bold text-slate-900">
                      Snapshot Bàn giao — {snapshot.termName || term.name}
                    </DialogTitle>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1 font-medium">
                      <Lock className="h-3 w-3" />
                      Lưu trữ Bất biến
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Thời điểm đóng: {new Date(snapshot.closedAt).toLocaleString('vi-VN')}
                    </span>
                    {(snapshot.closedByName || snapshot.closedBy) && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        Người thực hiện đóng: <strong className="text-slate-700">{snapshot.closedByName || snapshot.closedBy}</strong>
                      </span>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {/* Override warning if overridden */}
          {snapshot.isOverridden && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Được đóng dưới hình thức Bỏ qua cảnh báo tồn đọng (Override)
              </div>
              <p className="mt-1">
                <strong>Lý do ghi đè:</strong> {snapshot.overrideReason || 'Không có lý do chi tiết'}
              </p>
            </div>
          )}

          {/* Handover notes (if any) */}
          {snapshot.handoverNotes && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-xs">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                Biên bản / Ghi chú bàn giao nhiệm kỳ
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {snapshot.handoverNotes}
              </p>
            </div>
          )}

          {/* Core Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-blue-500" />
                Tổng Hội viên
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {stats.members.total}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {stats.members.active} đang sinh hoạt
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                Hoạt động
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {stats.activities.completed}/{stats.activities.total}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Tỷ lệ tham gia: {stats.attendance?.participationRate || 0}%
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                Công việc
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {stats.tasks.completed}/{stats.tasks.total}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Đã hoàn thành {stats.tasks.completed}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                Số dư Bàn giao
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {new Intl.NumberFormat('vi-VN').format(stats.finance.balance)} ₫
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Thu: {new Intl.NumberFormat('vi-VN').format(stats.finance.totalIncome)} ₫
              </div>
            </div>
          </div>

          {/* Key Executive Members at closing time */}
          {keyOfficers.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-500" />
                Ban Chấp Hành / Trưởng phó ban tại thời điểm bàn giao
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {keyOfficers.map((member, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs"
                  >
                    <div className="font-semibold text-slate-900">{member.fullName}</div>
                    <div className="text-blue-600 font-medium text-[11px]">{member.position}</div>
                    {member.studentId && (
                      <div className="text-slate-400 text-[10px]">MSSV: {member.studentId}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activities roster summary at closing */}
          {snapshot.activitiesList && snapshot.activitiesList.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-500" />
                Danh mục Hoạt động trong nhiệm kỳ ({snapshot.activitiesList.length})
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                {snapshot.activitiesList.map((act) => (
                  <div key={act.id} className="py-2 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-800">{act.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {act.startDate} • {act.status}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-medium text-slate-700">
                        {act.participantCount || 0} người tham gia
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
