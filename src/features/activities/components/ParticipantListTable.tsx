import { useState } from 'react';
import {
  Search,
  UserX,
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet,
  Trash2,
  Check,
  Percent,
  AlertCircle,
} from 'lucide-react';
import { AttendanceStatusBadge } from './ParticipantStatusBadge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { formatDateTime } from '@/lib/date';
import {
  ATTENDANCE_STATUSES,
  type ActivityParticipantItem,
} from '../types/activity.types';
import type { ActivityParticipantsStats } from '@/repositories/activity.repository';
import type { AttendanceStatus, RegistrationStatus } from '@/types';
import { cn } from '@/lib/utils';

interface ParticipantListTableProps {
  participants: ActivityParticipantItem[];
  activityTitle: string;
  stats?: ActivityParticipantsStats;
  canManage?: boolean;
  onUpdateStatus: (
    participantId: string,
    data: {
      registrationStatus?: RegistrationStatus;
      attendanceStatus?: AttendanceStatus;
      notes?: string;
    }
  ) => Promise<void>;
  onRemoveParticipant: (participantId: string) => Promise<void>;
  onBulkUpdateAttendance?: (participantIds: string[], status: AttendanceStatus) => Promise<void>;
  isLoading?: boolean;
}

function getCohortDisplay(item: ActivityParticipantItem): string {
  if (item.member?.cohort) return item.member.cohort;
  if (item.notes) {
    const match = item.notes.match(/Khóa:\s*([^,\n]+)/i);
    if (match && match[1]) return match[1].trim();
  }
  return '—';
}

function getCleanNoteDisplay(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const trimmed = notes.trim();
  if (/^Khóa:\s*[^,\n]+$/i.test(trimmed)) {
    return null;
  }
  const cleaned = trimmed.replace(/Khóa:\s*[^,\n]+[,;\s]*/i, '').trim();
  return cleaned || null;
}

export function ParticipantListTable({
  participants,
  activityTitle,
  stats,
  canManage = false,
  onUpdateStatus,
  onRemoveParticipant,
  onBulkUpdateAttendance,
  isLoading = false,
}: ParticipantListTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [attFilter, setAttFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fallback calculated stats if stats prop not passed
  const totalCount = stats ? stats.total : participants.length;
  const presentCount = stats ? stats.present : participants.filter((p) => p.attendanceStatus === 'present').length;
  const absentCount = stats ? stats.absent : participants.filter((p) => p.attendanceStatus === 'absent').length;
  const unmarkedCount = stats ? stats.unmarked : participants.filter((p) => p.attendanceStatus === 'unmarked').length;
  const participationRate = stats ? stats.participationRate : (totalCount > 0 ? Math.round((presentCount / totalCount) * 1000) / 10 : 0);

  // Filter list
  const filteredList = participants.filter((item) => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const cohort = getCohortDisplay(item).toLowerCase();
      const match =
        item.member.fullName.toLowerCase().includes(q) ||
        (item.member.studentId && item.member.studentId.toLowerCase().includes(q)) ||
        (item.member.className && item.member.className.toLowerCase().includes(q)) ||
        cohort.includes(q) ||
        (item.member.email && item.member.email.toLowerCase().includes(q)) ||
        (item.member.phone && item.member.phone.includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Attendance Status
    if (attFilter !== 'all' && item.attendanceStatus !== attFilter) {
      return false;
    }

    return true;
  });

  // Export to CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (filteredList.length === 0) return;

    const headers = [
      'STT',
      'Họ và tên',
      'Mã số sinh viên',
      'Lớp',
      'Khóa',
      'Email',
      'Số điện thoại',
      'Nguồn đăng ký',
      'Trạng thái điểm danh',
      'Ghi chú',
    ];

    const rows = filteredList.map((item, index) => [
      index + 1,
      `"${item.member.fullName.replace(/"/g, '""')}"`,
      `"${item.member.studentId || ''}"`,
      `"${item.member.className || ''}"`,
      `"${getCohortDisplay(item)}"`,
      `"${item.member.email || ''}"`,
      `"${item.member.phone || ''}"`,
      `"${item.source === 'google_form' ? 'Google Forms' : 'Thủ công'}"`,
      `"${item.attendanceStatus === 'present' ? 'Có mặt' : item.attendanceStatus === 'absent' ? 'Vắng' : 'Chưa điểm danh'}"`,
      `"${(getCleanNoteDisplay(item.notes) || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = activityTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
    link.setAttribute('href', url);
    link.setAttribute('download', `danh_sach_diem_danh_${safeTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAttendance = async (status: AttendanceStatus) => {
    if (!onBulkUpdateAttendance || selectedIds.length === 0) return;
    await onBulkUpdateAttendance(selectedIds, status);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-4">
      {/* KPI Stats & Attendance Overview Bar (4 clean cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
          <p className="text-[11px] font-semibold text-slate-500">Tổng người tham gia</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>

        {/* Present */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/70 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-emerald-700">Có mặt</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-900 mt-1">{presentCount}</p>
        </div>

        {/* Absent */}
        <div className="p-3.5 bg-rose-50/70 border border-rose-200/70 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-rose-700">Vắng</p>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-bold text-rose-900 mt-1">{absentCount}</p>
        </div>

        {/* Participation Rate */}
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/70 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-indigo-700">Tỉ lệ có mặt</p>
            <Percent className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-indigo-950 mt-1">{participationRate}%</p>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="participant-table-search"
            type="text"
            placeholder="Tìm theo họ và tên, MSSV, lớp, khóa, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Filters and CSV Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Attendance Status Filter: 2 options */}
          <Select
            value={attFilter}
            onValueChange={setAttFilter}
          >
            <SelectTrigger id="participant-att-filter-select" className="h-8 text-xs bg-slate-50 border-slate-200 w-auto min-w-[140px]">
              <SelectValue placeholder="Điểm danh: Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Điểm danh: Tất cả</SelectItem>
              <SelectItem value="present">Có mặt ({presentCount})</SelectItem>
              <SelectItem value="absent">Vắng ({absentCount})</SelectItem>
              <SelectItem value="unmarked">Chưa điểm danh ({unmarkedCount})</SelectItem>
            </SelectContent>
          </Select>

          {/* Export CSV Button */}
          <button
            type="button"
            id="export-participants-csv-btn"
            onClick={handleExportCSV}
            disabled={filteredList.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            title="Xuất danh sách Excel (CSV)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (when selected) */}
      {canManage && selectedIds.length > 0 && (
        <div className="p-3 px-4 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-950 shadow-xs animate-in fade-in duration-150">
          <span className="font-bold">Đã chọn {selectedIds.length} người:</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="bulk-mark-present-btn"
              onClick={() => handleBulkAttendance('present')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold shadow-2xs cursor-pointer active:scale-95 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Đánh dấu có mặt</span>
            </button>
            <button
              type="button"
              id="bulk-mark-absent-btn"
              onClick={() => handleBulkAttendance('absent')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold shadow-2xs cursor-pointer active:scale-95 transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Đánh dấu vắng</span>
            </button>
            <button
              type="button"
              id="bulk-mark-unmarked-btn"
              onClick={() => handleBulkAttendance('unmarked')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer active:scale-95 transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hủy điểm danh</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/90">
              <tr>
                {canManage && (
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredList.length > 0 && selectedIds.length === filteredList.length}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                )}
                <th className="py-3.5 px-4 text-left">Họ và tên</th>
                <th className="py-3.5 px-2 w-28 text-center">MSSV</th>
                <th className="py-3.5 px-2 w-20 text-center">Lớp</th>
                <th className="py-3.5 px-2 w-16 text-center">Khóa</th>
                <th className="py-3.5 px-4 w-60 text-center">Điểm danh</th>
                {canManage && <th className="py-3.5 px-2 w-14 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="py-8 text-center text-slate-400">
                    Đang tải danh sách người tham gia...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <UserX className="w-6 h-6 text-slate-300" />
                      <p className="font-medium text-slate-600">Không tìm thấy người tham gia nào</p>
                      <p className="text-[11px] text-slate-400">
                        {searchTerm || attFilter !== 'all'
                          ? 'Thử điều chỉnh lại bộ lọc tìm kiếm'
                          : 'Sử dụng nút "Thêm người tham gia" ở trên để ghi danh'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isPresent = item.attendanceStatus === 'present';
                  const isAbsent = item.attendanceStatus === 'absent';
                  const cohortText = getCohortDisplay(item);

                  return (
                    <tr
                      key={item.id}
                      id={`participant-row-${item.id}`}
                      className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-emerald-50/40' : ''}`}
                    >
                      {canManage && (
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                      )}

                      {/* Full Name & Contacts */}
                      <td className="py-2.5 px-4 text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900">{item.member.fullName}</span>
                          {item.source === 'google_form' && (
                            <span
                              title="Đăng ký qua Google Forms"
                              className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded"
                            >
                              <FileSpreadsheet className="w-2.5 h-2.5" />
                              <span>Forms</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          {item.member.email && (
                            <span className="truncate max-w-[150px]">{item.member.email}</span>
                          )}
                          {item.member.phone && (
                            <span>• {item.member.phone}</span>
                          )}
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="py-2.5 px-2 text-center">
                        <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {item.member.studentId || '—'}
                        </span>
                      </td>

                      {/* Class */}
                      <td className="py-2.5 px-2 text-center text-slate-700 font-medium text-xs">
                        {item.member.className || '—'}
                      </td>

                      {/* Cohort / Khóa */}
                      <td className="py-2.5 px-2 text-center text-slate-700 font-bold font-mono text-xs">
                        {cohortText}
                      </td>

                      {/* Attendance 2-Option Control: Có mặt / Vắng */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          {/* Option 1: Có mặt */}
                          <button
                            type="button"
                            title={isPresent ? 'Đã có mặt (Bấm để chuyển sang Chưa điểm danh)' : 'Đánh dấu Có mặt'}
                            onClick={() =>
                              onUpdateStatus(item.id, {
                                attendanceStatus: isPresent ? 'unmarked' : 'present',
                              })
                            }
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none',
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            )}
                          >
                            <CheckCircle2 className={cn('w-3.5 h-3.5', isPresent ? 'text-white' : 'text-slate-400')} />
                            <span>Có mặt</span>
                          </button>

                          {/* Option 2: Vắng */}
                          <button
                            type="button"
                            title={isAbsent ? 'Đã đánh dấu Vắng (Bấm để chuyển sang Chưa điểm danh)' : 'Đánh dấu Vắng'}
                            onClick={() =>
                              onUpdateStatus(item.id, {
                                attendanceStatus: isAbsent ? 'unmarked' : 'absent',
                              })
                            }
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none',
                              isAbsent
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                            )}
                          >
                            <XCircle className={cn('w-3.5 h-3.5', isAbsent ? 'text-white' : 'text-slate-400')} />
                            <span>Vắng</span>
                          </button>
                        </div>
                      </td>

                      {/* Row Action */}
                      {canManage && (
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            id={`remove-participant-btn-${item.id}`}
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa "${item.member.fullName}" khỏi hoạt động này?`)) {
                                onRemoveParticipant(item.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Xóa khỏi hoạt động"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-2.5 px-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2">
          <span>
            Hiển thị <strong className="text-slate-800">{filteredList.length}</strong> / {participants.length} người tham gia
          </span>
          <span className="text-[11px]">
            Có mặt: <strong className="text-emerald-700">{presentCount}</strong> • Vắng: <strong className="text-rose-700">{absentCount}</strong> • Chưa điểm danh: <strong className="text-slate-700">{unmarkedCount}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
