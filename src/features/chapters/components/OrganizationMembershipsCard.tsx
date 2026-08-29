import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Users,
  Search,
  UserCog,
  UserX,
  Info,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { isOrgAdmin, ROLES } from '@/types/roles';
import { EditMembershipDialog } from './EditMembershipDialog';
import type {
  OrganizationMembership,
  OrganizationRole,
  MembershipStatus,
} from '@/types';

interface OrganizationMembershipsCardProps {
  memberships: OrganizationMembership[];
  organizationId: string;
  currentUserId?: string;
  activeRole: OrganizationRole | null;
  onUpdateMembership: (
    membershipId: string,
    role: OrganizationRole,
    status: MembershipStatus
  ) => Promise<void>;
  onRemoveMembership: (membershipId: string) => Promise<void>;
  isLoading?: boolean;
}

export function OrganizationMembershipsCard({
  memberships,
  organizationId,
  currentUserId,
  activeRole,
  onUpdateMembership,
  onRemoveMembership,
  isLoading = false,
}: OrganizationMembershipsCardProps) {
  const isAdmin = isOrgAdmin(activeRole);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingMembership, setEditingMembership] = useState<OrganizationMembership | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const filteredMemberships = memberships.filter((m) => {
    const nameMatch = m.profile?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const emailMatch = m.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const studentIdMatch = m.profile?.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesSearch = !searchTerm || nameMatch || emailMatch || studentIdMatch;

    const matchesRole = roleFilter === 'all' || m.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleEditClick = (membership: OrganizationMembership) => {
    setActionError(null);
    setEditingMembership(membership);
    setIsEditDialogOpen(true);
  };

  const handleSaveMembership = async (
    membershipId: string,
    role: OrganizationRole,
    status: MembershipStatus
  ) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await onUpdateMembership(membershipId, role, status);
      setActionSuccess('Cập nhật vai trò thành viên thành công!');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError((err as Error).message || 'Không thể cập nhật vai trò thành viên.');
      throw err;
    }
  };

  const handleRemoveClick = async (membership: OrganizationMembership) => {
    const isSelf = currentUserId === membership.userId;
    const confirmMessage = isSelf
      ? 'Bạn có chắc chắn muốn tự rời khỏi Chi hội này? Bạn sẽ mất quyền truy cập vào các dữ liệu nội bộ.'
      : `Bạn có chắc chắn muốn xóa thành viên "${membership.profile?.fullName || membership.profile?.email}" khỏi Chi hội?`;

    if (!window.confirm(confirmMessage)) return;

    setActionError(null);
    setActionSuccess(null);
    setRemovingId(membership.id);

    try {
      await onRemoveMembership(membership.id);
      setActionSuccess('Đã xóa thành viên khỏi Chi hội thành công.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError((err as Error).message || 'Không thể xóa thành viên khỏi Chi hội.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader className="border-b border-slate-100 bg-slate-50/40 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900">
                  Thành viên & Phân quyền Hệ thống
                </CardTitle>
                <Badge variant="outline" className="text-[11px] bg-white text-slate-700">
                  {memberships.length} tài khoản
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Danh sách tài khoản được cấp quyền truy cập vào không gian làm việc của Chi hội
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {/* Important Concept Explanatory Banner */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-blue-950 flex items-center gap-1.5">
              Phân biệt: Vai trò hệ thống (System Role) vs Chức vụ nhiệm kỳ (Term Position)
            </p>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              <strong>Vai trò hệ thống</strong> (Admin, Chi hội trưởng, Thủ quỹ, Thư ký, Hội viên) quyết định quyền thao tác trên phần mềm và cơ sở dữ liệu (RLS). Trong khi đó, <strong>Chức vụ nhiệm kỳ</strong> (Bí thư, BCH...) là chức danh thực tế theo từng nhiệm kỳ hoạt động được quản lý tại phân hệ <em>Quản lý Nhiệm kỳ</em>.
            </p>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, email, MSSV..."
              className="pl-8 text-xs h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={roleFilter}
              onValueChange={setRoleFilter}
            >
              <SelectTrigger className="h-8 rounded-md border-slate-200 bg-white text-xs text-slate-800 w-auto min-w-[130px]">
                <SelectValue placeholder="Tất cả vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                {Object.values(ROLES).map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Members Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
                  <th className="py-2.5 px-3">Họ và tên / Email</th>
                  <th className="py-2.5 px-3">MSSV / Liên hệ</th>
                  <th className="py-2.5 px-3">Vai trò hệ thống</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3">Ngày tham gia</th>
                  {isAdmin && <th className="py-2.5 px-3 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-slate-400">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                      Đang tải danh sách thành viên...
                    </td>
                  </tr>
                ) : filteredMemberships.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-slate-400">
                      <HelpCircle className="h-6 w-6 mx-auto mb-1 text-slate-300" />
                      Không tìm thấy thành viên nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredMemberships.map((membership) => {
                    const roleInfo = ROLES[membership.role];
                    const isSelf = currentUserId === membership.userId;
                    const isRemoving = removingId === membership.id;

                    const joinedDate = membership.createdAt
                      ? new Intl.DateTimeFormat('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        }).format(new Date(membership.createdAt))
                      : '—';

                    return (
                      <tr
                        key={membership.id}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          isSelf ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        {/* Name & Email */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-[11px] text-slate-700 shrink-0">
                              {membership.profile?.fullName
                                ? membership.profile.fullName.charAt(0).toUpperCase()
                                : 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                {membership.profile?.fullName || 'Chưa cập nhật tên'}
                                {isSelf && (
                                  <Badge variant="outline" className="text-[9px] py-0 px-1 text-blue-600 bg-blue-50 border-blue-200">
                                    Bạn
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 block">
                                {membership.profile?.email || '—'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Student ID / Contact */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[11px] text-slate-800 block">
                              {membership.profile?.studentId || 'Chưa có MSSV'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {membership.profile?.phone || 'Chưa có SĐT'}
                            </span>
                          </div>
                        </td>

                        {/* System Role */}
                        <td className="py-3 px-3">
                          {roleInfo ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${roleInfo.colorClasses.bg} ${roleInfo.colorClasses.text} ${roleInfo.colorClasses.border}`}
                            >
                              <Shield className="h-3 w-3 shrink-0" />
                              {roleInfo.label}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          {membership.status === 'active' && (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                              Đang hoạt động
                            </Badge>
                          )}
                          {membership.status === 'inactive' && (
                            <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                              Tạm ngưng
                            </Badge>
                          )}
                          {membership.status === 'pending' && (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                              Chờ duyệt
                            </Badge>
                          )}
                          {membership.status === 'suspended' && (
                            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                              Bị khóa
                            </Badge>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3 px-3 text-[11px] text-slate-500 font-mono">
                          {joinedDate}
                        </td>

                        {/* Actions (Admins only) */}
                        {isAdmin && (
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(membership)}
                                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Phân quyền vai trò"
                              >
                                <UserCog className="h-3.5 w-3.5 mr-1" />
                                Phân quyền
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveClick(membership)}
                                disabled={isRemoving}
                                className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                title="Xóa khỏi Chi hội"
                              >
                                {isRemoving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <UserX className="h-3.5 w-3.5 mr-1" />
                                )}
                                Xóa
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>

      {/* Edit Membership Dialog */}
      <EditMembershipDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        membership={editingMembership}
        organizationId={organizationId}
        currentUserId={currentUserId}
        onConfirm={handleSaveMembership}
      />
    </Card>
  );
}
