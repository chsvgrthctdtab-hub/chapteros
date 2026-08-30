import { useState, useEffect, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { UserCog, AlertCircle, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { ROLES } from '@/types/roles';
import type { OrganizationMembership, OrganizationRole, MembershipStatus } from '@/types';

interface EditMembershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membership: OrganizationMembership | null;
  organizationId: string;
  currentUserId?: string;
  onConfirm: (
    membershipId: string,
    role: OrganizationRole,
    status: MembershipStatus
  ) => Promise<void>;
  isLoading?: boolean;
}

const STATUS_OPTIONS: { value: MembershipStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Đang hoạt động', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'inactive', label: 'Tạm ngưng', color: 'text-slate-700 bg-slate-50 border-slate-200' },
  { value: 'pending', label: 'Chờ duyệt', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'suspended', label: 'Bị khóa', color: 'text-rose-700 bg-rose-50 border-rose-200' },
];

export function EditMembershipDialog({
  open,
  onOpenChange,
  membership,
  organizationId: _organizationId,
  currentUserId,
  onConfirm,
  isLoading = false,
}: EditMembershipDialogProps) {
  const [selectedRole, setSelectedRole] = useState<OrganizationRole>('secretary');
  const [selectedStatus, setSelectedStatus] = useState<MembershipStatus>('active');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (membership) {
      setSelectedRole(membership.role);
      setSelectedStatus(membership.status);
      setError(null);
    }
  }, [membership]);

  if (!membership) return null;

  const isSelf = currentUserId === membership.userId;
  const isDemotingSelf = isSelf && membership.role === 'admin' && selectedRole !== 'admin';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onConfirm(membership.id, selectedRole, selectedStatus);
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message || 'Không thể cập nhật vai trò thành viên.');
    }
  };

  const selectedRoleInfo = ROLES[selectedRole];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Phân quyền thành viên Đơn vị
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Cập nhật vai trò hệ thống và trạng thái hoạt động
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Member brief info */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-slate-900">{membership.profile?.fullName || 'Thành viên'}</p>
              <p className="text-slate-500 text-[11px]">{membership.profile?.email}</p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {isSelf ? 'Tài khoản của bạn' : `MSSV: ${membership.profile?.studentId || 'Chưa có'}`}
            </Badge>
          </div>

          {/* Role select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              Vai trò hệ thống (System Role)
            </label>
            <Select
              value={selectedRole}
              onValueChange={(val) => setSelectedRole(val as OrganizationRole)}
            >
              <SelectTrigger className="w-full h-9 rounded-md border-slate-200 bg-white text-xs text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ROLES).map((role) => (
                  <SelectItem key={role.key} value={role.key}>
                    {role.label} ({role.shortLabel})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedRoleInfo && (
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200/60 leading-relaxed">
                {selectedRoleInfo.description}
              </p>
            )}
          </div>

          {/* Status select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Trạng thái hoạt động</label>
            <Select
              value={selectedStatus}
              onValueChange={(val) => setSelectedStatus(val as MembershipStatus)}
            >
              <SelectTrigger className="w-full h-9 rounded-md border-slate-200 bg-white text-xs text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Self-demotion warning */}
          {isDemotingSelf && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <p>
                <strong>Cảnh báo:</strong> Bạn đang tự hạ quyền Quản trị viên của chính mình. Sau khi lưu, bạn sẽ không thể chỉnh sửa cài đặt Đơn vị nữa.
              </p>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
