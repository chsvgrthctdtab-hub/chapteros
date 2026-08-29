import { useState, useMemo } from 'react';
import {
  CalendarRange,
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle,
  Search,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  ArrowRightLeft,
  Lock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  useTermDetail,
  useTermMembers,
  useAddTermMemberMutation,
  useUpdateTermMemberMutation,
  useRemoveTermMemberMutation,
} from '../queries/term.queries';
import { AddTermMemberDialog } from './AddTermMemberDialog';
import { TransferTermMembersDialog } from './TransferTermMembersDialog';
import { TermClosingSnapshotModal } from './TermClosingSnapshotModal';
import { TERM_STATUS_OPTIONS, TERM_MEMBER_STATUS_OPTIONS } from '../types/term.types';
import type { Term, TermMember } from '@/types';
import type { TermMemberAssignmentFormData } from '../schemas/term.schema';

interface TermDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  termId: string | null;
  organizationId: string;
  currentUserId?: string;
  onEditTerm: (term: Term) => void;
  onActivateTerm: (term: Term) => void;
  onCompleteTerm: (term: Term) => void;
}

export function TermDetailModal({
  open,
  onOpenChange,
  termId,
  organizationId,
  currentUserId,
  onEditTerm,
  onActivateTerm,
  onCompleteTerm,
}: TermDetailModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TermMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TermMember | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [transferSuccessInfo, setTransferSuccessInfo] = useState<string | null>(null);

  // Queries
  const { data: term, isLoading: isLoadingTerm } = useTermDetail(termId || undefined);
  const { data: members = [], isLoading: isLoadingMembers } = useTermMembers(termId || undefined);

  // Mutations
  const addMemberMutation = useAddTermMemberMutation();
  const updateMemberMutation = useUpdateTermMemberMutation();
  const removeMemberMutation = useRemoveTermMemberMutation();

  const isTermClosed = term?.status === 'completed' || term?.status === 'archived';
  const isTermDraft = term?.status === 'draft';
  const isTermActive = term?.status === 'active' || term?.isCurrent;

  const statusConfig = useMemo(() => {
    if (!term) return null;
    return TERM_STATUS_OPTIONS.find((s) => s.value === term.status) || TERM_STATUS_OPTIONS[0];
  }, [term]);

  const existingMemberIds = useMemo(() => {
    return members.map((m) => m.memberId);
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((tm) => {
      // Status filter
      if (statusFilter !== 'all' && tm.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = tm.member?.fullName?.toLowerCase() || '';
        const studentId = tm.member?.studentId?.toLowerCase() || '';
        const position = tm.position?.toLowerCase() || '';
        const department = tm.department?.toLowerCase() || '';
        const className = tm.member?.className?.toLowerCase() || '';
        return (
          name.includes(q) ||
          studentId.includes(q) ||
          position.includes(q) ||
          department.includes(q) ||
          className.includes(q)
        );
      }
      return true;
    });
  }, [members, statusFilter, searchQuery]);

  const handleAddMemberSubmit = async (formData: TermMemberAssignmentFormData) => {
    if (!termId || isTermClosed) return;
    if (editingMember) {
      // Update existing
      await updateMemberMutation.mutateAsync({
        id: editingMember.id,
        payload: {
          position: formData.position,
          department: formData.department || null,
          status: formData.status,
          joined_date: formData.joinedDate || null,
          notes: formData.notes || null,
        },
        actorUserId: currentUserId,
        organizationId,
      });
      setEditingMember(null);
    } else {
      // Create new assignment
      await addMemberMutation.mutateAsync({
        payload: {
          term_id: termId,
          member_id: formData.memberId,
          position: formData.position,
          department: formData.department || null,
          status: formData.status,
          joined_date: formData.joinedDate || new Date().toISOString().split('T')[0],
          notes: formData.notes || null,
        },
        actorUserId: currentUserId,
        organizationId,
      });
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!deletingMember || !termId || isTermClosed) return;
    setActionError(null);
    try {
      await removeMemberMutation.mutateAsync({
        id: deletingMember.id,
        termId,
        actorUserId: currentUserId,
        organizationId,
      });
      setDeletingMember(null);
    } catch (err: unknown) {
      const e = err as Error;
      setActionError(e?.message || 'Có lỗi xảy ra khi gỡ hội viên khỏi nhiệm kỳ.');
    }
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-200 bg-white">
            <DialogHeader className="gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CalendarRange className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <DialogTitle className="text-xl font-bold text-slate-900">
                        {term?.name || 'Chi tiết Nhiệm kỳ'}
                      </DialogTitle>
                      {term?.isCurrent && (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1 font-medium">
                          <Sparkles className="h-3 w-3" />
                          Nhiệm kỳ hiện tại
                        </Badge>
                      )}
                      {statusConfig && (
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                      )}
                    </div>
                    <DialogDescription className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Thời gian: {term?.startDate} → {term?.endDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        Tổng hội viên nhiệm kỳ: <strong className="text-slate-700">{members.length}</strong>
                      </span>
                    </DialogDescription>
                  </div>
                </div>

                {/* Header Action Buttons based on Term Lifecycle */}
                {term && (
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                    {/* Draft term actions */}
                    {isTermDraft && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onActivateTerm(term)}
                        className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs h-8"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Kích hoạt
                      </Button>
                    )}

                    {/* Active term actions */}
                    {isTermActive && !isTermClosed && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsTransferOpen(true)}
                          className="text-blue-700 border-blue-200 hover:bg-blue-50 text-xs h-8 font-medium"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                          Bàn giao nhiệm kỳ
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCompleteTerm(term)}
                          className="text-slate-700 border-slate-200 hover:bg-slate-50 text-xs h-8"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          Đóng nhiệm kỳ
                        </Button>
                      </>
                    )}

                    {/* Completed term state */}
                    {isTermClosed && (
                      <div className="flex items-center gap-2">
                        {term.closingSnapshot && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsSnapshotOpen(true)}
                            className="text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs h-8 font-medium"
                          >
                            <Lock className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                            Xem Snapshot Bàn giao
                          </Button>
                        )}
                        <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          <Lock className="h-3.5 w-3.5 text-slate-400" />
                          Đã kết thúc (Chỉ đọc)
                        </div>
                      </div>
                    )}

                    {!isTermClosed && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditTerm(term)}
                        className="text-slate-700 border-slate-200 hover:bg-slate-50 text-xs h-8"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                        Chỉnh sửa
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </DialogHeader>
          </div>

          {/* Action error */}
          {actionError && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">{actionError}</div>
            </div>
          )}

          {/* Transfer success alert */}
          {transferSuccessInfo && (
            <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start justify-between gap-2 text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{transferSuccessInfo}</span>
              </div>
              <button
                type="button"
                onClick={() => setTransferSuccessInfo(null)}
                className="text-[11px] underline font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Đóng
              </button>
            </div>
          )}

          {/* Read-only notification banner for completed terms */}
          {isTermClosed && (
            <div className="mx-6 mt-4 p-3 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-2 text-xs text-slate-600">
              <Lock className="h-4 w-4 text-slate-500 shrink-0" />
              <span>
                Nhiệm kỳ này đã kết thúc. Toàn bộ danh sách phân công và hội viên được bảo lưu nguyên vẹn để tra cứu lịch sử (chế độ chỉ đọc).
              </span>
            </div>
          )}

          {/* Modal Body / Member Roster Section */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {/* Section Header & Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="text-sm font-bold text-slate-800 shrink-0 mr-2">
                  Thành viên nhiệm kỳ
                </div>
                <div className="relative flex-1">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Tìm theo tên, MSSV, chức vụ, bộ phận..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="h-8 rounded-md border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 w-auto min-w-[140px]">
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    {TERM_MEMBER_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isTermClosed && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingMember(null);
                    setIsAddMemberOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs shadow-xs"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  + Thêm hội viên
                </Button>
              )}
            </div>

            {/* Members Roster Table */}
            {isLoadingMembers || isLoadingTerm ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-2 bg-white rounded-xl border border-slate-200">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <p className="text-xs">Đang tải danh sách hội viên nhiệm kỳ...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-14 text-center bg-white rounded-xl border border-slate-200 p-6">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Không tìm thấy hội viên phù hợp với bộ lọc'
                    : 'Chưa có hội viên nào trong nhiệm kỳ này.'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Thử thay đổi từ khóa tìm kiếm hoặc đặt lại trạng thái sinh hoạt.'
                    : isTermClosed
                    ? 'Nhiệm kỳ này không có hội viên nào được ghi nhận.'
                    : 'Bấm nút "Thêm hội viên" để phân công nhân sự Ban Chấp hành, các Ban chuyên môn và hội viên sinh hoạt trong nhiệm kỳ.'}
                </p>
                {!isTermClosed && !searchQuery && statusFilter === 'all' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingMember(null);
                      setIsAddMemberOpen(true);
                    }}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Thêm hội viên
                  </Button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Hội viên</th>
                        <th className="py-3 px-4">MSSV</th>
                        <th className="py-3 px-4">Chức vụ</th>
                        <th className="py-3 px-4">Bộ phận</th>
                        <th className="py-3 px-4">Trạng thái</th>
                        <th className="py-3 px-4">Ngày tham gia</th>
                        {!isTermClosed && <th className="py-3 px-4 text-right">Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMembers.map((tm) => {
                        const mStatus =
                          TERM_MEMBER_STATUS_OPTIONS.find((s) => s.value === tm.status) ||
                          TERM_MEMBER_STATUS_OPTIONS[0];

                        return (
                          <tr key={tm.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">
                                {tm.member?.fullName || '—'}
                              </div>
                              {tm.member?.email && (
                                <div className="text-[11px] text-slate-500 font-normal">
                                  {tm.member.email}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <div>{tm.member?.studentId || '—'}</div>
                              {tm.member?.className && (
                                <div className="text-[11px] text-slate-400">
                                  {tm.member.className}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-800 flex items-center gap-1.5">
                                {tm.position}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {tm.department ? (
                                <div className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                                  <Layers className="h-3 w-3" />
                                  {tm.department}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={mStatus.variant}>
                                {mStatus.label}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {tm.joinedDate || '—'}
                            </td>
                            {!isTermClosed && (
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingMember(tm);
                                      setIsAddMemberOpen(true);
                                    }}
                                    className="h-7 px-2 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                                    title="Chỉnh sửa phân công"
                                  >
                                    <Edit2 className="h-3 w-3 mr-1" />
                                    Sửa
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeletingMember(tm)}
                                    className="h-7 px-2 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50"
                                    title="Xóa khỏi nhiệm kỳ"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Xóa khỏi nhiệm kỳ
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Member Dialog */}
      {!isTermClosed && (
        <AddTermMemberDialog
          open={isAddMemberOpen}
          onOpenChange={setIsAddMemberOpen}
          onSubmit={handleAddMemberSubmit}
          termId={termId || ''}
          termName={term?.name || ''}
          organizationId={organizationId}
          existingMemberIds={existingMemberIds}
          initialData={editingMember}
          isLoading={addMemberMutation.isPending || updateMemberMutation.isPending}
        />
      )}

      {/* Transfer Members to Target Term Dialog */}
      <TransferTermMembersDialog
        open={isTransferOpen}
        onOpenChange={setIsTransferOpen}
        sourceTerm={term || null}
        organizationId={organizationId}
        currentUserId={currentUserId}
        onSuccess={(transferred, skipped) => {
          setTransferSuccessInfo(
            `Đã bàn giao thành công ${transferred} hội viên sang nhiệm kỳ mới${
              skipped > 0 ? ` (Bỏ qua ${skipped} hội viên đã tồn tại)` : ''
            }.`
          );
        }}
      />

      {/* Delete Member Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingMember)}
        onOpenChange={(open) => !open && setDeletingMember(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Xóa hội viên khỏi nhiệm kỳ?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Xác nhận xóa phân công của hội viên
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-2 text-sm text-slate-600 space-y-2">
            <p>
              Bạn có chắc chắn muốn xóa hội viên{' '}
              <strong className="text-slate-900">{deletingMember?.member?.fullName}</strong> khỏi nhiệm kỳ{' '}
              <strong className="text-slate-900">{term?.name}</strong>?
            </p>
            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
              Thao tác này chỉ xóa phân công của hội viên trong nhiệm kỳ hiện tại. Hồ sơ hội viên trong Chi hội vẫn được giữ nguyên.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingMember(null)}
              disabled={removeMemberMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirmRemoveMember}
              disabled={removeMemberMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {removeMemberMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Snapshot Modal */}
      {term && (
        <TermClosingSnapshotModal
          open={isSnapshotOpen}
          onOpenChange={setIsSnapshotOpen}
          term={term}
        />
      )}
    </>
  );
}

