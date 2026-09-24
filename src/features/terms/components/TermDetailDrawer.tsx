import React, { useState } from 'react';
import {
  X,
  Calendar,
  Users,
  Activity,
  CheckSquare,
  Wallet,
  FileSpreadsheet,
  FileText,
  ArrowRightLeft,
  CheckCircle,
  Edit2,
  Trash2,
  Plus,
  Search,
  ExternalLink,
  Lock,
  Clock,
  ShieldCheck,
  Award,
  AlertTriangle,
} from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TermStatusBadge } from './TermStatusBadge';
import { useTermMembers } from '../queries/term.queries';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Term, TermMember } from '@/types';
import type { TermClosingSnapshot } from '../types/term.types';
import type { TermSemesterConfig } from '@/features/activities/types/competency.types';
import { getTermSemesters, saveTermSemesters } from '../utils/semester-storage';

interface TermDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  term: Term | null;
  currentTermId?: string | null;
  onActivateTerm?: (term: Term) => void;
  onTransferMembers?: (term: Term) => void;
  onCompleteTerm?: (term: Term) => void;
  onEditTerm?: (term: Term) => void;
  onAddMember?: (term: Term) => void;
  onEditMember?: (member: TermMember) => void;
  onRemoveMember?: (termMemberId: string, memberName: string) => void;
  activitiesCount?: number;
  tasksCount?: number;
  financeBalance?: number;
  canManage?: boolean;
}

export function TermDetailDrawer({
  open,
  onClose,
  term,
  currentTermId,
  onActivateTerm,
  onTransferMembers,
  onCompleteTerm,
  onEditTerm,
  onAddMember,
  onEditMember,
  onRemoveMember,
  activitiesCount = 0,
  tasksCount = 0,
  financeBalance,
  canManage = true,
}: TermDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [semesters, setSemesters] = useState<TermSemesterConfig[]>(() =>
    getTermSemesters(term)
  );
  const [semesterSaved, setSemesterSaved] = useState<boolean>(false);

  // Sync semesters when term changes
  React.useEffect(() => {
    if (term) {
      setSemesters(getTermSemesters(term));
      setSemesterSaved(false);
    }
  }, [term]);

  const { data: members = [], isLoading: isLoadingMembers } = useTermMembers(
    open && term ? term.id : undefined
  );

  if (!open || !term) return null;

  const isCurrent = term.isCurrent || term.id === currentTermId;
  const isLocked = term.status === 'completed' || term.status === 'archived';
  const snapshot = term.closingSnapshot as unknown as TermClosingSnapshot | undefined;

  const start = dayjs(term.startDate);
  const end = dayjs(term.endDate);
  const formattedDates = `${start.isValid() ? start.format('DD MMM YYYY') : term.startDate} → ${
    end.isValid() ? end.format('DD MMM YYYY') : term.endDate
  }`;

  const formattedBalance = financeBalance !== undefined
    ? new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(financeBalance)
    : '₫0';

  // Filter members
  const filteredMembers = members.filter((tm) => {
    const q = memberSearch.toLowerCase().trim();
    const nameMatch = tm.member?.fullName?.toLowerCase().includes(q) || false;
    const codeMatch = tm.member?.studentId?.toLowerCase().includes(q) || false;
    const posMatch = tm.position?.toLowerCase().includes(q) || false;
    const deptMatch = tm.department?.toLowerCase().includes(q) || false;

    const matchesSearch = !q || nameMatch || codeMatch || posMatch || deptMatch;

    if (positionFilter === 'all') return matchesSearch;
    if (positionFilter === 'bch') {
      const p = (tm.position || '').toLowerCase();
      const d = (tm.department || '').toLowerCase();
      return (
        matchesSearch &&
        (p.includes('trưởng') ||
          p.includes('phó') ||
          p.includes('ủy viên') ||
          d.includes('ban chấp hành'))
      );
    }
    if (positionFilter === 'active') {
      return matchesSearch && tm.status === 'active';
    }
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-ink-navy/50 backdrop-blur-xs flex justify-end transition-opacity">
      {/* Click backdrop to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Slide-over Drawer Panel */}
      <div
        id="term-detail-drawer"
        className="relative z-10 w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-hairline bg-cloud shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-nowrap shrink-0">
                <TermStatusBadge status={term.status} isCurrent={isCurrent} />
                {snapshot && (
                  <span className="text-[10px] font-medium text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                    Đã lưu bản tổng kết
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-ink-navy truncate">
                {term.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-gray font-mono">
                <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{formattedDates}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg border border-hairline text-mist-gray hover:text-slate-gray hover:bg-cloud flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Actions Header Bar */}
          <div className="mt-4 pt-3 border-t border-hairline flex flex-wrap items-center gap-2">
            {canManage && (
              <>
                {!isCurrent && term.status !== 'archived' && onActivateTerm && (
                  <Button
                    size="sm"
                    onClick={() => onActivateTerm(term)}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer shadow-xs"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Đặt làm hiện hành
                  </Button>
                )}

                {onTransferMembers && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onTransferMembers(term)}
                    className="h-8 text-xs text-slate-gray border-hairline hover:bg-cloud cursor-pointer"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1 text-mist-gray" />
                    Chuyển giao nhân sự
                  </Button>
                )}

                {!isLocked && onEditTerm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditTerm(term)}
                    className="h-8 text-xs text-slate-gray border-hairline hover:bg-cloud cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1 text-mist-gray" />
                    Chỉnh sửa
                  </Button>
                )}

                {term.status !== 'completed' && term.status !== 'archived' && onCompleteTerm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCompleteTerm(term)}
                    className="h-8 text-xs text-amber-800 border-amber-200 hover:bg-amber-50 cursor-pointer"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1 text-amber-600" />
                    Tổng kết nhiệm kỳ
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Drawer Tabs Navigation */}
        <div className="px-5 sm:px-6 pt-3 border-b border-hairline bg-white shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-pebble p-0.5 h-8 gap-0.5 overflow-x-auto max-w-full">
              <TabsTrigger value="overview" className="text-xs px-2.5 py-1">
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="members" className="text-xs px-2.5 py-1">
                Hội viên ({members.length})
              </TabsTrigger>
              <TabsTrigger value="activities" className="text-xs px-2.5 py-1">
                Hoạt động ({activitiesCount})
              </TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs px-2.5 py-1">
                Nhiệm vụ ({tasksCount})
              </TabsTrigger>
              <TabsTrigger value="finance" className="text-xs px-2.5 py-1">
                Tài chính
              </TabsTrigger>
              {snapshot && (
                <TabsTrigger value="snapshot" className="text-xs px-2.5 py-1 text-teal-800">
                  Ảnh chụp tổng kết
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Drawer Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Operational Metrics Cards with Deep Links */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to={`/members?term=${term.id}`}
                  className="group p-4 rounded-xl border border-hairline bg-cloud hover:bg-white hover:border-[#d4e4fa] transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-mist-gray font-medium">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-signal-blue" />
                      Hội viên
                    </span>
                    <ExternalLink className="h-3 w-3 text-mist-gray group-hover:text-signal-blue transition-colors" />
                  </div>
                  <p className="text-2xl font-bold text-ink-navy mt-2">
                    {members.length || term.memberCount || 0}
                  </p>
                  <span className="text-[11px] text-signal-blue font-medium mt-1 inline-block">
                    Xem danh sách hội viên →
                  </span>
                </Link>

                <Link
                  to={`/activities?term=${term.id}`}
                  className="group p-4 rounded-xl border border-hairline bg-cloud hover:bg-white hover:border-[#d4e4fa] transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-mist-gray font-medium">
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-signal-blue" />
                      Hoạt động
                    </span>
                    <ExternalLink className="h-3 w-3 text-mist-gray group-hover:text-signal-blue transition-colors" />
                  </div>
                  <p className="text-2xl font-bold text-ink-navy mt-2">{activitiesCount}</p>
                  <span className="text-[11px] text-signal-blue font-medium mt-1 inline-block">
                    Xem hoạt động →
                  </span>
                </Link>

                <Link
                  to={`/tasks?term=${term.id}`}
                  className="group p-4 rounded-xl border border-hairline bg-cloud hover:bg-white hover:border-amber-300 transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-mist-gray font-medium">
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5 text-amber-600" />
                      Nhiệm vụ
                    </span>
                    <ExternalLink className="h-3 w-3 text-mist-gray group-hover:text-amber-600 transition-colors" />
                  </div>
                  <p className="text-2xl font-bold text-ink-navy mt-2">{tasksCount}</p>
                  <span className="text-[11px] text-amber-700 font-medium mt-1 inline-block">
                    Xem nhiệm vụ →
                  </span>
                </Link>

                <Link
                  to={`/finance?term=${term.id}`}
                  className="group p-4 rounded-xl border border-hairline bg-cloud hover:bg-white hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-mist-gray font-medium">
                    <span className="flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                      Số dư quỹ
                    </span>
                    <ExternalLink className="h-3 w-3 text-mist-gray group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <p className="text-xl font-bold text-ink-navy mt-2 tabular-nums truncate">
                    {formattedBalance}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-medium mt-1 inline-block">
                    Xem quỹ tài chính →
                  </span>
                </Link>
              </div>

              {/* Term Metadata & Lifecycle Timeline */}
              <div className="rounded-xl border border-hairline bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-mist-gray">
                  Thông tin vòng đời nhiệm kỳ
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-mist-gray block">Ngày bắt đầu:</span>
                    <span className="font-medium text-ink-navy">{term.startDate}</span>
                  </div>
                  <div>
                    <span className="text-mist-gray block">Ngày kết thúc:</span>
                    <span className="font-medium text-ink-navy">{term.endDate}</span>
                  </div>
                  <div>
                    <span className="text-mist-gray block">Khởi tạo:</span>
                    <span className="font-medium text-ink-navy">
                      {dayjs(term.createdAt).format('DD/MM/YYYY HH:mm')}
                    </span>
                  </div>
                  <div>
                    <span className="text-mist-gray block">Cập nhật:</span>
                    <span className="font-medium text-ink-navy">
                      {dayjs(term.updatedAt).format('DD/MM/YYYY HH:mm')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Academic Semesters Configuration (HK I, HK II, HK III) */}
              <div className="rounded-xl border border-hairline bg-white p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#e6f0ff] text-signal-blue flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ink-navy">
                        Cấu hình 3 Học kỳ trong Năm học
                      </h4>
                      <p className="text-[11px] text-mist-gray">
                        Tự động phân loại hoạt động & phục vụ tổng kết học kỳ, thi đua
                      </p>
                    </div>
                  </div>
                  {semesterSaved && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Đã lưu cấu hình ✓
                    </span>
                  )}
                </div>

                <div className="space-y-3 pt-1">
                  {semesters.map((sem, idx) => {
                    const semStart = dayjs(sem.startDate);
                    const semEnd = dayjs(sem.endDate);
                    const weekCount = semEnd.isValid() && semStart.isValid()
                      ? Math.max(1, Math.round(semEnd.diff(semStart, 'week', true)))
                      : sem.weeks || 16;

                    return (
                      <div
                        key={sem.id}
                        className="p-3 rounded-xl border border-hairline bg-cloud space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-signal-blue text-white text-[11px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-ink-navy">
                              {sem.name}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-gray bg-white px-2 py-0.5 rounded-md border border-hairline">
                            ~{weekCount} tuần
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-semibold text-mist-gray uppercase block mb-1">
                              Bắt đầu
                            </label>
                            <Input
                              type="date"
                              value={sem.startDate}
                              disabled={!canManage || isLocked}
                              onChange={(e) => {
                                const updated = [...semesters];
                                updated[idx] = { ...updated[idx], startDate: e.target.value };
                                setSemesters(updated);
                                setSemesterSaved(false);
                              }}
                              className="h-8 text-xs bg-white border-hairline rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-mist-gray uppercase block mb-1">
                              Kết thúc
                            </label>
                            <Input
                              type="date"
                              value={sem.endDate}
                              disabled={!canManage || isLocked}
                              onChange={(e) => {
                                const updated = [...semesters];
                                updated[idx] = { ...updated[idx], endDate: e.target.value };
                                setSemesters(updated);
                                setSemesterSaved(false);
                              }}
                              className="h-8 text-xs bg-white border-hairline rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {canManage && !isLocked && (
                  <div className="flex items-center justify-between pt-1 border-t border-hairline">
                    <p className="text-[11px] text-mist-gray">
                      Hoạt động sẽ tự động gán vào học kỳ tương ứng theo ngày diễn ra.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        saveTermSemesters(term.id, semesters);
                        setSemesterSaved(true);
                      }}
                      className="h-8 px-3.5 bg-signal-blue hover:bg-[#005be0] text-white text-xs font-bold rounded-lg cursor-pointer shrink-0"
                    >
                      Lưu cấu hình Học kỳ
                    </Button>
                  </div>
                )}
              </div>

              {/* Handover & Resolution Documents */}
              <div className="rounded-xl border border-hairline bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-mist-gray flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-teal-600" />
                    Hồ sơ & Văn bản Đơn vị
                  </h4>
                  <Link
                    to={`/documents?term=${term.id}`}
                    className="text-xs font-medium text-teal-700 hover:underline"
                  >
                    Mở kho Văn bản →
                  </Link>
                </div>
                <p className="text-xs text-slate-gray leading-relaxed">
                  Truy cập các nghị quyết, biên bản bàn giao, quyết định kiện toàn và chứng từ phát sinh trong nhiệm kỳ này.
                </p>
              </div>

              {/* Closing Audit Info (if applicable) */}
              {snapshot && (
                <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    Nhiệm kỳ đã hoàn tất và lưu trữ ảnh chụp tổng kết
                  </div>
                  <p className="text-xs text-slate-gray">
                    Người đóng: <strong>{snapshot.closedByName || 'Ban Quản trị'}</strong> vào lúc{' '}
                    {dayjs(snapshot.closedAt).format('DD/MM/YYYY HH:mm')}.
                  </p>
                  {snapshot.handoverNotes && (
                    <div className="p-3 bg-white rounded-lg border border-teal-200 text-xs text-slate-gray mt-2">
                      <span className="font-semibold block text-ink-navy mb-1">Ghi chú bàn giao:</span>
                      {snapshot.handoverNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEMBERS ROSTER */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mist-gray" />
                  <Input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Tìm kiếm hội viên trong nhiệm kỳ..."
                    className="pl-8 h-8 text-xs bg-cloud border-hairline"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={positionFilter}
                    onValueChange={setPositionFilter}
                  >
                    <SelectTrigger className="h-8 text-xs bg-cloud border-hairline font-medium text-slate-gray w-auto min-w-[150px]">
                      <SelectValue placeholder="Tất cả phân công" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả phân công</SelectItem>
                      <SelectItem value="bch">Ban Chấp Hành / Cán bộ</SelectItem>
                      <SelectItem value="active">Đang sinh hoạt</SelectItem>
                    </SelectContent>
                  </Select>

                  {canManage && !isLocked && onAddMember && (
                    <Button
                      size="sm"
                      onClick={() => onAddMember(term)}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Thêm hội viên
                    </Button>
                  )}
                </div>
              </div>

              {isLoadingMembers ? (
                <div className="p-8 text-center text-xs text-mist-gray">Đang tải danh sách hội viên...</div>
              ) : filteredMembers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-hairline p-8 text-center">
                  <Users strokeWidth={1.5} className="h-8 w-8 text-mist-gray mx-auto mb-2" />
                  <p className="text-xs text-mist-gray font-medium">Không tìm thấy hội viên nào phù hợp</p>
                </div>
              ) : (
                <div className="divide-y divide-hairline border border-hairline rounded-xl overflow-hidden bg-white">
                  {filteredMembers.map((tm) => (
                    <div
                      key={tm.id}
                      className="p-3 hover:bg-cloud flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 text-xs shrink-0 border border-hairline">
                          <AvatarFallback className="bg-cloud text-slate-gray font-semibold">
                            {(tm.member?.fullName || 'H').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-ink-navy truncate">
                              {tm.member?.fullName || 'Chưa đặt tên'}
                            </span>
                            {tm.member?.studentId && (
                              <span className="text-[11px] text-mist-gray font-mono">
                                ({tm.member.studentId})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-mist-gray mt-0.5 flex-wrap">
                            <span className="font-medium text-slate-gray">{tm.position || 'Hội viên'}</span>
                            {tm.department && (
                              <>
                                <span>•</span>
                                <span>{tm.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Badge
                          variant={tm.status === 'active' ? 'default' : 'secondary'}
                          className="text-[10px] h-5"
                        >
                          {tm.status === 'active' ? 'Đang đảm nhiệm' : tm.status}
                        </Badge>

                        {canManage && !isLocked && (
                          <>
                            {onEditMember && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditMember(tm)}
                                className="h-7 w-7 p-0 text-mist-gray hover:text-slate-gray"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            )}
                            {onRemoveMember && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onRemoveMember(tm.id, tm.member?.fullName || 'Hội viên')
                                }
                                className="h-7 w-7 p-0 text-mist-gray hover:text-rose-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 text-right">
                <Link
                  to={`/members?term=${term.id}`}
                  className="text-xs font-semibold text-signal-blue hover:underline"
                >
                  Xem toàn bộ hồ sơ trong Danh sách Hội viên →
                </Link>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITIES */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-mist-gray">
                  Hoạt động trong nhiệm kỳ ({activitiesCount})
                </h4>
                <Link
                  to={`/activities?term=${term.id}`}
                  className="text-xs font-semibold text-signal-blue hover:underline"
                >
                  Mở Quản lý Hoạt động →
                </Link>
              </div>

              <div className="rounded-xl border border-hairline bg-white p-4 text-xs text-slate-gray space-y-2">
                <p>
                  Toàn bộ chương trình, tọa đàm, chiến dịch tình nguyện và cuộc họp thuộc nhiệm kỳ{' '}
                  <strong>{term.name}</strong>.
                </p>
                <p className="text-mist-gray">
                  Tổng số hoạt động đã ghi nhận: <strong>{activitiesCount}</strong>. Bạn có thể lọc và theo dõi điểm danh, đăng ký tại trang Hoạt động.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-mist-gray">
                  Nhiệm vụ trong nhiệm kỳ ({tasksCount})
                </h4>
                <Link
                  to={`/tasks?term=${term.id}`}
                  className="text-xs font-semibold text-amber-600 hover:underline"
                >
                  Mở Quản lý Nhiệm vụ →
                </Link>
              </div>

              <div className="rounded-xl border border-hairline bg-white p-4 text-xs text-slate-gray space-y-2">
                <p>
                  Các đầu việc, phân công ban chuyên môn và thời hạn thực hiện gắn với nhiệm kỳ <strong>{term.name}</strong>.
                </p>
                <p className="text-mist-gray">
                  Tổng số nhiệm vụ đang theo dõi: <strong>{tasksCount}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: FINANCE */}
          {activeTab === 'finance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-mist-gray">
                  Tổng quan Quỹ tài chính
                </h4>
                <Link
                  to={`/finance?term=${term.id}`}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Mở Quản lý Tài chính →
                </Link>
              </div>

              <div className="rounded-xl border border-hairline bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-mist-gray font-medium">Số dư tồn quỹ</span>
                  <span className="text-lg font-bold text-emerald-700 tabular-nums">
                    {formattedBalance}
                  </span>
                </div>
                <p className="text-xs text-mist-gray leading-relaxed">
                  Sổ quỹ thu chi, duyệt quyết toán và khóa sổ tài chính theo chu kỳ{' '}
                  <strong>{term.name}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: SNAPSHOT */}
          {activeTab === 'snapshot' && snapshot && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                  <Award className="h-4 w-4 text-teal-600" />
                  Ảnh chụp tổng kết khóa sổ nhiệm kỳ
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <div className="bg-white p-2.5 rounded-lg border border-teal-100">
                    <span className="text-mist-gray block text-[11px]">Tổng hội viên</span>
                    <strong className="text-ink-navy text-sm">
                      {snapshot.stats?.members?.total ?? 0}
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-teal-100">
                    <span className="text-mist-gray block text-[11px]">Tổng hoạt động</span>
                    <strong className="text-ink-navy text-sm">
                      {snapshot.stats?.activities?.total ?? 0}
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-teal-100">
                    <span className="text-mist-gray block text-[11px]">Tổng nhiệm vụ</span>
                    <strong className="text-ink-navy text-sm">
                      {snapshot.stats?.tasks?.total ?? 0}
                    </strong>
                  </div>
                </div>

                {snapshot.handoverNotes && (
                  <div className="mt-3 pt-3 border-t border-teal-200 text-xs">
                    <strong className="text-ink-navy block mb-1">Ý kiến chỉ đạo bàn giao:</strong>
                    <p className="text-slate-gray bg-white p-3 rounded-lg border border-teal-100">
                      {snapshot.handoverNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
