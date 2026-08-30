import { useState, useMemo } from 'react';
import {
  ArrowRightLeft,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  ShieldAlert,
  ArrowRight,
  Info,
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  useTermsList,
  useTermMembers,
  useTransferTermMembersMutation,
} from '../queries/term.queries';
import type { Term } from '@/types';

interface TransferTermMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceTerm: Term | null;
  organizationId: string;
  currentUserId?: string;
  onSuccess?: (transferredCount: number, skippedCount: number) => void;
}

export function TransferTermMembersDialog({
  open,
  onOpenChange,
  sourceTerm,
  organizationId,
  currentUserId,
  onSuccess,
}: TransferTermMembersDialogProps) {
  const [targetTermId, setTargetTermId] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmStep, setIsConfirmStep] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries
  const { data: terms = [], isLoading: isLoadingTerms } = useTermsList(organizationId);
  const { data: sourceMembers = [], isLoading: isLoadingMembers } = useTermMembers(sourceTerm?.id);

  // Transfer Mutation
  const transferMutation = useTransferTermMembersMutation();

  // Target terms candidate list: same org, not source, not completed or archived
  const availableTargetTerms = useMemo(() => {
    return terms.filter(
      (t) =>
        t.id !== sourceTerm?.id &&
        t.organizationId === organizationId &&
        t.status !== 'completed' &&
        t.status !== 'archived'
    );
  }, [terms, sourceTerm, organizationId]);

  const targetTerm = useMemo(() => {
    return availableTargetTerms.find((t) => t.id === targetTermId) || null;
  }, [availableTargetTerms, targetTermId]);

  // Filter source members by search query
  const filteredSourceMembers = useMemo(() => {
    if (!searchQuery.trim()) return sourceMembers;
    const q = searchQuery.toLowerCase().trim();
    return sourceMembers.filter((tm) => {
      const name = tm.member?.fullName?.toLowerCase() || '';
      const studentId = tm.member?.studentId?.toLowerCase() || '';
      const position = tm.position?.toLowerCase() || '';
      const department = tm.department?.toLowerCase() || '';
      return (
        name.includes(q) ||
        studentId.includes(q) ||
        position.includes(q) ||
        department.includes(q)
      );
    });
  }, [sourceMembers, searchQuery]);

  // Handle Select All / Deselect All
  const isAllSelected =
    filteredSourceMembers.length > 0 &&
    filteredSourceMembers.every((tm) => selectedMemberIds.includes(tm.memberId));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredIds = new Set(filteredSourceMembers.map((tm) => tm.memberId));
      setSelectedMemberIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newIds = new Set([...selectedMemberIds, ...filteredSourceMembers.map((tm) => tm.memberId)]);
      setSelectedMemberIds(Array.from(newIds));
    }
  };

  const handleToggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setTargetTermId('');
      setSelectedMemberIds([]);
      setSearchQuery('');
      setIsConfirmStep(false);
      setErrorMessage(null);
    }
    onOpenChange(newOpen);
  };

  const handleProceedToConfirm = () => {
    setErrorMessage(null);
    if (!targetTermId) {
      setErrorMessage('Vui lòng chọn nhiệm kỳ tiếp nhận để bàn giao.');
      return;
    }
    if (selectedMemberIds.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một hội viên để bàn giao.');
      return;
    }
    setIsConfirmStep(true);
  };

  const handleExecuteTransfer = async () => {
    if (!sourceTerm || !targetTermId) return;
    setErrorMessage(null);

    try {
      const result = await transferMutation.mutateAsync({
        sourceTermId: sourceTerm.id,
        targetTermId,
        memberIds: selectedMemberIds,
        actorUserId: currentUserId,
        organizationId,
      });

      handleOpenChange(false);
      if (onSuccess) {
        onSuccess(result.transferredCount, result.skippedCount);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e?.message || 'Có lỗi xảy ra trong quá trình bàn giao.');
    }
  };

  if (!sourceTerm) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {isConfirmStep ? 'Xác nhận bàn giao nhiệm kỳ' : 'Bàn giao sang nhiệm kỳ mới'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  {isConfirmStep
                    ? 'Kiểm tra thông tin trước khi tạo phân công mới cho nhiệm kỳ tiếp nhận'
                    : 'Tạo bản ghi phân công cho nhiệm kỳ mới từ danh sách thành viên hiện tại'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
          {!isConfirmStep ? (
            <>
              {/* Term Selection Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Term Card */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Nhiệm kỳ hiện tại (Nguồn)
                  </span>
                  <div className="mt-1">
                    <p className="font-semibold text-sm text-slate-900">{sourceTerm.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {sourceTerm.startDate} → {sourceTerm.endDate}
                    </p>
                  </div>
                  <div className="mt-2.5">
                    <Badge variant="secondary" className="text-[11px]">
                      {sourceMembers.length} thành viên
                    </Badge>
                  </div>
                </div>

                {/* Target Term Selector */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                      Nhiệm kỳ tiếp nhận (Đích) *
                    </span>
                    <div className="mt-1.5">
                      <Select
                        disabled={isLoadingTerms || availableTargetTerms.length === 0}
                        value={targetTermId}
                        onValueChange={(val) => {
                          setTargetTermId(val);
                          setErrorMessage(null);
                        }}
                      >
                        <SelectTrigger id="target-term-select" className="w-full h-9 text-xs border-slate-300 bg-white">
                          <SelectValue placeholder="-- Chọn nhiệm kỳ tiếp nhận --" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTargetTerms.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name} ({t.startDate} → {t.endDate})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {availableTargetTerms.length === 0 && !isLoadingTerms && (
                    <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      Chưa có nhiệm kỳ mới (bản nháp). Vui lòng tạo nhiệm kỳ mới trước.
                    </p>
                  )}
                </div>
              </div>

              {/* Members Selection Section */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Chọn hội viên cần bàn giao ({selectedMemberIds.length}/{sourceMembers.length})
                    </h4>
                  </div>

                  {/* Search box */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Tìm theo tên, MSSV, chức vụ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs bg-slate-50"
                    />
                  </div>
                </div>

                {/* Quick actions: Select all / Deselect all */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
                  >
                    {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả trong danh sách'}
                  </button>
                  <span className="text-slate-400 text-[11px]">
                    Đã chọn: <strong className="text-slate-700">{selectedMemberIds.length}</strong> hội viên
                  </span>
                </div>

                {/* Member Roster Checklist */}
                <div className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {isLoadingMembers ? (
                    <div className="py-8 flex items-center justify-center text-xs text-slate-500 gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      Đang tải danh sách thành viên...
                    </div>
                  ) : filteredSourceMembers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      {searchQuery ? 'Không tìm thấy hội viên phù hợp.' : 'Chưa có hội viên trong nhiệm kỳ nguồn.'}
                    </div>
                  ) : (
                    filteredSourceMembers.map((tm) => {
                      const isChecked = selectedMemberIds.includes(tm.memberId);
                      return (
                        <label
                          key={tm.id}
                          className={`flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                            isChecked ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleMember(tm.memberId)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                {tm.member?.fullName || 'Chưa cập nhật tên'}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                {tm.member?.studentId && (
                                  <span>MSSV: {tm.member.studentId}</span>
                                )}
                                {tm.member?.className && (
                                  <span>• Lớp: {tm.member.className}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <Badge variant="outline" className="text-[11px] py-0">
                              {tm.position || 'Hội viên'}
                            </Badge>
                            {tm.department && (
                              <p className="text-[10px] text-slate-400 mt-0.5">{tm.department}</p>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Confirm Step */
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-900">
                <p className="font-semibold text-sm text-blue-950">Thông tin bàn giao:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-500">Nhiệm kỳ hiện tại:</span>
                    <p className="font-medium text-slate-900">{sourceTerm.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Nhiệm kỳ tiếp nhận:</span>
                    <p className="font-medium text-blue-700">{targetTerm?.name}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
                  <span className="text-slate-600">Số hội viên được bàn giao:</span>
                  <strong className="text-sm text-blue-700">{selectedMemberIds.length} hội viên</strong>
                </div>
              </div>

              <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Đảm bảo toàn vẹn dữ liệu:
                </p>
                <p>• Các bản ghi phân công mới sẽ được tạo riêng cho nhiệm kỳ <strong>"{targetTerm?.name}"</strong>.</p>
                <p>• Dữ liệu phân công và lịch sử hoạt động của nhiệm kỳ <strong>"{sourceTerm.name}"</strong> được giữ nguyên không thay đổi.</p>
                <p>• Hồ sơ hội viên gốc trong Đơn vị không bị ảnh hưởng hay trùng lặp.</p>
                <p>• Nếu có hội viên đã tồn tại trong nhiệm kỳ mới, hệ thống sẽ tự động bỏ qua để tránh trùng lặp.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <DialogFooter className="flex-row justify-end gap-2">
            {!isConfirmStep ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={transferMutation.isPending}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={handleProceedToConfirm}
                  disabled={
                    !targetTermId ||
                    selectedMemberIds.length === 0 ||
                    transferMutation.isPending
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Tiếp tục
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsConfirmStep(false)}
                  disabled={transferMutation.isPending}
                >
                  Quay lại
                </Button>
                <Button
                  type="button"
                  onClick={handleExecuteTransfer}
                  disabled={transferMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {transferMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang xử lý bàn giao...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Xác nhận bàn giao
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
