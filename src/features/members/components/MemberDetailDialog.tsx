import React, { useState } from 'react';
import {
  User,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Clock,
  ShieldCheck,
  Shield,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MemberStatusBadge, TermMemberStatusBadge } from './MemberStatusBadge';
import { MemberRoleBadge } from './MemberRoleBadge';
import { useMemberTermHistory } from '../queries/member.queries';
import { useRemoveTermMember } from '../mutations/member.mutations';
import { getMajorFromClassOrValue } from '../utils/major.utils';
import type { Member, Term } from '@/types';
import type { MemberTermHistoryItem } from '../types/member.types';

interface MemberDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  terms: Term[];
  canManage: boolean;
  onEditMember: (member: Member) => void;
  onAssignTerm: (member: Member, initialData?: MemberTermHistoryItem) => void;
}

export function MemberDetailDialog({
  open,
  onOpenChange,
  member,
  canManage,
  onEditMember,
  onAssignTerm,
}: MemberDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'role'>('profile');

  const { data: termHistory = [], isLoading: isLoadingHistory } = useMemberTermHistory(
    member?.id
  );

  const removeTermMemberMutation = useRemoveTermMember(
    member?.id || '',
    member?.organizationId
  );

  if (!member) return null;

  const handleRemoveAssignment = async (item: MemberTermHistoryItem) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn hủy phân công của ${member.fullName} trong nhiệm kỳ "${item.term.name}"?`
    );
    if (!confirmed) return;

    try {
      await removeTermMemberMutation.mutateAsync(item.id);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Lỗi khi xóa phân công');
    }
  };

  const initials = member.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[90vh] p-0 overflow-hidden bg-white border border-hairline rounded-2xl shadow-xl">
        {/* Header with Avatar, Full Name, MSSV, and Badges */}
        <div className="bg-cloud border-b border-hairline px-5 pt-5 pb-4">
          {/* Single row: Avatar + Name/Pills block on left, Buttons on right */}
          <div className="flex items-start justify-between gap-3 pr-8 sm:pr-10">
            {/* Left: Avatar + Name + Status + Pills */}
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-[#e6f0ff] text-signal-blue font-bold text-base flex items-center justify-center shadow-xs border border-[#d4e4fa] shrink-0 mt-0.5">
                {initials || <User strokeWidth={1.5} className="h-6 w-6" />}
              </div>
              <div className="min-w-0 space-y-1.5">
                {/* Name + Status */}
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-base font-bold text-ink-navy tracking-tight leading-tight">
                    {member.fullName}
                  </DialogTitle>
                  <MemberStatusBadge status={member.status} />
                </div>
                {/* Pills — always single row, hidden scroll if needed */}
                <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <span className="tabular-nums bg-white px-2.5 py-0.5 rounded-full text-ink-navy font-semibold text-xs border border-hairline shadow-xs whitespace-nowrap shrink-0">
                    MSSV: {member.studentId || 'Chưa cập nhật'}
                  </span>
                  <MemberRoleBadge position={member.position} />
                  {member.className && (
                    <span className="tabular-nums bg-white px-2.5 py-0.5 rounded-full text-slate-gray font-medium text-xs border border-hairline shadow-xs whitespace-nowrap shrink-0">
                      Lớp: {member.className}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Action buttons — top-aligned, never pushed down */}
            {canManage && (
              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onEditMember(member);
                  }}
                  className="bg-white border-hairline text-ink-navy hover:bg-cloud text-xs h-8 rounded-lg shadow-xs"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1 text-slate-gray" />
                  Sửa hồ sơ
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onAssignTerm(member);
                  }}
                  className="bg-signal-blue hover:bg-[#005be0] text-white text-xs h-8 rounded-lg shadow-sm font-medium"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Gán nhiệm kỳ
                </Button>
              </div>
            )}
          </div>

          {/* Navigation Workspace Tabs */}
          <div className="flex space-x-4 mt-4 border-b border-hairline text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`pb-2.5 transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-b-2 border-signal-blue text-signal-blue font-semibold'
                  : 'text-slate-gray hover:text-ink-navy'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Hồ sơ & Lý lịch</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'border-b-2 border-signal-blue text-signal-blue font-semibold'
                  : 'text-slate-gray hover:text-ink-navy'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Lịch sử nhiệm kỳ ({termHistory.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('role')}
              className={`pb-2.5 transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'role'
                  ? 'border-b-2 border-signal-blue text-signal-blue font-semibold'
                  : 'text-slate-gray hover:text-ink-navy'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Vai trò & Quyền hạn</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-4 max-h-[calc(90vh-170px)] overflow-y-auto bg-white">
          {/* Tab 1: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Academic Information */}
                <div className="bg-cloud p-3.5 rounded-xl border border-hairline space-y-2.5">
                  <h4 className="text-[11px] font-bold text-ink-navy uppercase tracking-wider flex items-center space-x-1.5">
                    <GraduationCap className="h-4 w-4 text-signal-blue" />
                    <span>Thông tin học vụ</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-hairline">
                      <span className="text-slate-gray">Mã số sinh viên:</span>
                      <span className="tabular-nums font-semibold text-ink-navy">
                        {member.studentId || 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-hairline">
                      <span className="text-slate-gray">Chi đoàn / Lớp:</span>
                      <span className="font-medium text-ink-navy">
                        {member.className || 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-hairline">
                      <span className="text-slate-gray">Khóa sinh viên:</span>
                      <span className="font-medium text-ink-navy">
                        {member.cohort || 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-gray">Ngành:</span>
                      <span className="font-medium text-ink-navy">
                        {getMajorFromClassOrValue(member.className, member.major)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-cloud p-3.5 rounded-xl border border-hairline space-y-2.5">
                  <h4 className="text-[11px] font-bold text-ink-navy uppercase tracking-wider flex items-center space-x-1.5">
                    <Mail className="h-4 w-4 text-signal-blue" />
                    <span>Thông tin liên hệ & Gia nhập</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-hairline">
                      <span className="text-slate-gray">Email:</span>
                      <span className="font-medium text-ink-navy truncate max-w-[170px] sm:max-w-[220px]">
                        {member.email || 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-hairline">
                      <span className="text-slate-gray">Số điện thoại:</span>
                      <span className="font-medium text-ink-navy tabular-nums">
                        {member.phone || 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-hairline">
                      <span className="text-slate-gray">Ngày gia nhập:</span>
                      <span className="font-medium text-ink-navy tabular-nums">
                        {member.joinedDate
                          ? new Date(member.joinedDate).toLocaleDateString('vi-VN')
                          : 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-gray">Tài khoản hệ thống:</span>
                      <span className="font-medium text-ink-navy">
                        {member.userId ? (
                          <span className="inline-flex items-center text-emerald-700 font-semibold text-[11px]">
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                            Đã liên kết
                          </span>
                        ) : (
                          <span className="text-mist-gray text-[11px]">Chưa liên kết</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              {member.notes && (
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                  <div className="font-semibold text-amber-900 flex items-center space-x-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Ghi chú hồ sơ</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">{member.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Term History */}
          {activeTab === 'history' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-ink-navy uppercase tracking-wider">
                    Dòng thời gian hoạt động nhiệm kỳ
                  </h4>
                  <p className="text-[11px] text-slate-gray">
                    Lưu trữ toàn bộ vai trò, ban chuyên trách và trạng thái qua từng nhiệm kỳ.
                  </p>
                </div>

                {canManage && (
                  <Button
                    size="sm"
                    onClick={() => onAssignTerm(member)}
                    className="bg-signal-blue hover:bg-[#005be0] text-white text-xs h-7 px-2.5 rounded-lg shadow-sm"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Gán nhiệm kỳ mới
                  </Button>
                )}
              </div>

              {isLoadingHistory ? (
                <div className="py-8 text-center text-xs text-mist-gray">
                  Đang tải lịch sử nhiệm kỳ...
                </div>
              ) : termHistory.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-hairline rounded-xl bg-cloud space-y-2">
                  <Clock strokeWidth={1.5} className="h-7 w-7 text-mist-gray mx-auto" />
                  <p className="text-xs text-ink-navy font-medium">
                    Chưa có lịch sử nhiệm kỳ nào được ghi nhận.
                  </p>
                  <p className="text-[11px] text-slate-gray">
                    Hội viên này chưa được phân công vào nhiệm kỳ cụ thể nào của Đơn vị.
                  </p>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAssignTerm(member)}
                      className="text-xs mt-2 bg-white border-hairline text-ink-navy hover:bg-cloud rounded-lg"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Gán vào nhiệm kỳ hiện tại
                    </Button>
                  )}
                </div>
              ) : (
                <div className="relative border-l-2 border-hairline ml-3 space-y-3.5 pl-4 py-1">
                  {termHistory.map((item) => (
                    <div
                      key={item.id}
                      className="relative bg-white border border-hairline rounded-xl p-3.5 shadow-xs hover:border-[#d4e4fa] transition-all space-y-2"
                    >
                      {/* Timeline node */}
                      <div
                        className={`absolute -left-[23px] top-4 h-3.5 w-3.5 rounded-full border-2 border-white ${
                          item.term.isCurrent ? 'bg-signal-blue ring-2 ring-[#e6f0ff]' : 'bg-mist-gray'
                        }`}
                      />

                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-ink-navy">
                              {item.term.name}
                            </span>
                            {item.term.isCurrent && (
                              <span className="bg-[#e6f0ff] text-signal-blue text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#d4e4fa]">
                                Hiện tại
                              </span>
                            )}
                            <TermMemberStatusBadge status={item.status} />
                          </div>

                          <div className="text-xs text-ink-navy font-medium mt-1 flex items-center space-x-2">
                            <span className="text-signal-blue font-semibold">{item.position}</span>
                            {item.department && (
                              <span className="text-slate-gray">• {item.department}</span>
                            )}
                          </div>
                        </div>

                        {canManage && (
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAssignTerm(member, item)}
                              className="h-7 w-7 p-0 text-mist-gray hover:text-ink-navy rounded-lg"
                              title="Chỉnh sửa phân công này"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAssignment(item)}
                              disabled={removeTermMemberMutation.isPending}
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                              title="Xóa phân công khỏi nhiệm kỳ"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-gray pt-1 border-t border-hairline">
                        <div>
                          Thời gian nhiệm kỳ:{' '}
                          <span className="text-ink-navy font-medium tabular-nums">
                            {new Date(item.term.startDate).toLocaleDateString('vi-VN')} →{' '}
                            {new Date(item.term.endDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        {item.joinedDate && (
                          <div>
                            Ngày nhận nhiệm vụ:{' '}
                            <span className="text-ink-navy font-medium tabular-nums">
                              {new Date(item.joinedDate).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-slate-gray bg-cloud p-2 rounded-lg border border-hairline">
                          <strong className="text-ink-navy">Ghi chú:</strong> {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Role & Permissions */}
          {activeTab === 'role' && (
            <div className="space-y-3.5">
              <div className="bg-cloud p-3.5 rounded-xl border border-hairline space-y-2.5">
                <h4 className="text-[11px] font-bold text-ink-navy uppercase tracking-wider flex items-center space-x-1.5">
                  <Shield className="h-4 w-4 text-signal-blue" />
                  <span>Vai trò Chi hội & Quyền truy cập</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-hairline">
                    <span className="text-slate-gray">Chức vụ hồ sơ:</span>
                    <MemberRoleBadge position={member.position} />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-hairline">
                    <span className="text-slate-gray">Trạng thái hồ sơ:</span>
                    <MemberStatusBadge status={member.status} />
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-gray">Quyền hạn trong Đơn vị:</span>
                    <span className="text-ink-navy font-medium">
                      {member.position?.toLowerCase().includes('trưởng')
                        ? 'Toàn quyền quản trị & điều hành'
                        : member.position?.toLowerCase().includes('phó')
                        ? 'Điều hành hoạt động & phân công'
                        : member.position?.toLowerCase().includes('thủ quỹ')
                        ? 'Quản lý tài chính & thu chi'
                        : member.position?.toLowerCase().includes('thư ký')
                        ? 'Quản lý tài liệu & hoạt động'
                        : 'Tham gia hoạt động & theo dõi sự kiện'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
