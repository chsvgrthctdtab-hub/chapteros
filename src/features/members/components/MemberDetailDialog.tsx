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
  CalendarDays,
  Building2,
  Award,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MemberStatusBadge, TermMemberStatusBadge } from './MemberStatusBadge';
import { MemberRoleBadge } from './MemberRoleBadge';
import { useMemberTermHistory } from '../queries/member.queries';
import { useRemoveTermMember } from '../mutations/member.mutations';
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
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden bg-white border-slate-200 shadow-lg">
        {/* Header with Avatar, Full Name, MSSV, and Badges */}
        <div className="bg-slate-50/80 border-b border-slate-200/80 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="h-12 w-12 rounded-xl bg-slate-200 text-slate-800 font-bold text-base flex items-center justify-center shadow-2xs border border-slate-300/80 shrink-0">
                {initials || <User className="h-6 w-6" />}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight truncate">
                    {member.fullName}
                  </DialogTitle>
                  <MemberStatusBadge status={member.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono bg-white px-2 py-0.5 rounded text-slate-800 font-semibold border border-slate-200 shadow-2xs">
                    MSSV: {member.studentId || 'Chưa cập nhật'}
                  </span>
                  <MemberRoleBadge position={member.position} />
                  {member.className && <span>• Lớp {member.className}</span>}
                </div>
              </div>
            </div>

            {canManage && (
              <div className="flex items-center space-x-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onEditMember(member);
                  }}
                  className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-8"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1 text-slate-500" />
                  Sửa hồ sơ
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onAssignTerm(member);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Gán nhiệm kỳ
                </Button>
              </div>
            )}
          </div>

          {/* Navigation Workspace Tabs */}
          <div className="flex space-x-4 mt-4 border-b border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`pb-2.5 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'profile'
                  ? 'border-b-2 border-emerald-700 text-emerald-800 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Hồ sơ & Lý lịch</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'history'
                  ? 'border-b-2 border-emerald-700 text-emerald-800 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Lịch sử nhiệm kỳ ({termHistory.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('role')}
              className={`pb-2.5 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'role'
                  ? 'border-b-2 border-emerald-700 text-emerald-800 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
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
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <GraduationCap className="h-4 w-4 text-emerald-700" />
                    <span>Thông tin học vụ</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Mã số sinh viên:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {member.studentId || 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Chi đoàn / Lớp:</span>
                      <span className="font-medium text-slate-800">
                        {member.className || 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Khóa sinh viên:</span>
                      <span className="font-medium text-slate-800">
                        {member.cohort || 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Chuyên ngành:</span>
                      <span className="font-medium text-slate-800">
                        {member.major || 'Chưa cập nhật'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Mail className="h-4 w-4 text-emerald-700" />
                    <span>Thông tin liên hệ & Gia nhập</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[170px]">
                        {member.email || 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Số điện thoại:</span>
                      <span className="font-medium text-slate-800 font-mono">
                        {member.phone || 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Ngày gia nhập:</span>
                      <span className="font-medium text-slate-800">
                        {member.joinedDate
                          ? new Date(member.joinedDate).toLocaleDateString('vi-VN')
                          : 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Tài khoản hệ thống:</span>
                      <span className="font-medium text-slate-800">
                        {member.userId ? (
                          <span className="inline-flex items-center text-emerald-700 font-semibold text-[11px]">
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                            Đã liên kết
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Chưa liên kết</span>
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
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Dòng thời gian hoạt động nhiệm kỳ
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Lưu trữ toàn bộ vai trò, ban chuyên trách và trạng thái qua từng nhiệm kỳ.
                  </p>
                </div>

                {canManage && (
                  <Button
                    size="sm"
                    onClick={() => onAssignTerm(member)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-7 px-2.5"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Gán nhiệm kỳ mới
                  </Button>
                )}
              </div>

              {isLoadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Đang tải lịch sử nhiệm kỳ...
                </div>
              ) : termHistory.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <Clock className="h-7 w-7 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-600 font-medium">
                    Chưa có lịch sử nhiệm kỳ nào được ghi nhận.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Hội viên này chưa được phân công vào nhiệm kỳ cụ thể nào của Đơn vị.
                  </p>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAssignTerm(member)}
                      className="text-xs mt-2"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Gán vào nhiệm kỳ hiện tại
                    </Button>
                  )}
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-3.5 pl-4 py-1">
                  {termHistory.map((item) => (
                    <div
                      key={item.id}
                      className="relative bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-all space-y-2"
                    >
                      {/* Timeline node */}
                      <div
                        className={`absolute -left-[23px] top-4 h-3.5 w-3.5 rounded-full border-2 border-white ${
                          item.term.isCurrent ? 'bg-emerald-600 ring-2 ring-emerald-100' : 'bg-slate-400'
                        }`}
                      />

                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900">
                              {item.term.name}
                            </span>
                            {item.term.isCurrent && (
                              <span className="bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-1.5 py-0.2 rounded border border-emerald-200">
                                Hiện tại
                              </span>
                            )}
                            <TermMemberStatusBadge status={item.status} />
                          </div>

                          <div className="text-xs text-slate-700 font-medium mt-1 flex items-center space-x-2">
                            <span className="text-emerald-800 font-semibold">{item.position}</span>
                            {item.department && (
                              <span className="text-slate-500">• {item.department}</span>
                            )}
                          </div>
                        </div>

                        {canManage && (
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAssignTerm(member, item)}
                              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                              title="Chỉnh sửa phân công này"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAssignment(item)}
                              disabled={removeTermMemberMutation.isPending}
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              title="Xóa phân công khỏi nhiệm kỳ"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <div>
                          Thời gian nhiệm kỳ:{' '}
                          <span className="text-slate-700 font-medium">
                            {new Date(item.term.startDate).toLocaleDateString('vi-VN')} →{' '}
                            {new Date(item.term.endDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        {item.joinedDate && (
                          <div>
                            Ngày nhận nhiệm vụ:{' '}
                            <span className="text-slate-700 font-medium">
                              {new Date(item.joinedDate).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                          <strong>Ghi chú:</strong> {item.notes}
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
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Shield className="h-4 w-4 text-emerald-700" />
                  <span>Vai trò Chi hội & Quyền truy cập</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500">Chức vụ hồ sơ:</span>
                    <MemberRoleBadge position={member.position} />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500">Trạng thái hồ sơ:</span>
                    <MemberStatusBadge status={member.status} />
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-500">Quyền hạn trong Đơn vị:</span>
                    <span className="text-slate-700 font-medium">
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
