import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { ROLES, type OrganizationRole } from '@/types/roles';

interface CreateInviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId?: string;
  organizationName?: string;
  onSuccess?: () => void;
}

export function CreateInviteDialog({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  onSuccess,
}: CreateInviteDialogProps) {
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<OrganizationRole>('secretary');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleReset = () => {
    setEmail('');
    setRole('secretary');
    setIsLoading(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleReset();
      onClose();
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      setErrorMessage('Không tìm thấy thông tin Đơn vị hiện tại.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // Call RPC assign_role_by_email to pre-assign role in organization_invites
      const { error } = await (supabase.rpc as any)('assign_role_by_email', {
        p_org_id: organizationId,
        p_email: cleanEmail,
        p_role: role,
      });

      if (error) {
        console.error('Error assigning role by email:', error);
        setErrorMessage(error.message || 'Không thể cấp quyền cho email này. Vui lòng thử lại.');
        return;
      }

      // Success notification
      setSuccessMessage('Đã cấp quyền. Vui lòng thông báo cán bộ đăng nhập');
      if (onSuccess) {
        onSuccess();
      }

      // Automatically close the dialog after displaying the toast/feedback
      setTimeout(() => {
        handleOpenChange(false);
      }, 1800);
    } catch (err) {
      console.error('Unexpected error in assign_role_by_email:', err);
      setErrorMessage((err as Error).message || 'Đã có lỗi bất ngờ xảy ra.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent id="assign-role-dialog" className="sm:max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-6">
        <form onSubmit={handleAssignRole} className="space-y-5">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs mb-0.5">
              <UserCheck className="h-4 w-4" />
              <span>Cấp quyền đón đầu</span>
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Cấp Quyền Cán Bộ Ban Chấp Hành
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Cấp quyền trước cho cán bộ gia nhập{' '}
              <span className="font-semibold text-slate-700">{organizationName || 'Chi hội'}</span>. Cán bộ chỉ cần đăng nhập bằng Google Gmail để nhận quyền tự động.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in-50">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 font-medium animate-in fade-in-50 shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          <div className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label htmlFor="assign-email" className="block text-xs font-semibold text-slate-700">
                Email cán bộ (Google Account) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="assign-email"
                  type="email"
                  placeholder="canbo@ctu.edu.vn hoặc gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-9 bg-slate-50/50 border-slate-200 text-xs text-slate-900 focus:bg-white"
                  required
                  disabled={isLoading || Boolean(successMessage)}
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Nhập đúng địa chỉ email mà cán bộ sẽ dùng để Đăng nhập Google.
              </p>
            </div>

            {/* Role Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="assign-role" className="block text-xs font-semibold text-slate-700">
                Chức vụ phân công trong Ban Chấp Hành <span className="text-rose-500">*</span>
              </label>
              <Select
                value={role}
                onValueChange={(val) => setRole(val as OrganizationRole)}
                disabled={isLoading || Boolean(successMessage)}
              >
                <SelectTrigger id="assign-role" className="h-9 bg-slate-50/50 border-slate-200 text-xs">
                  <SelectValue placeholder="Chọn chức vụ" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="leader" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-blue-700" />
                      <span>{ROLES.leader.label} (Chi hội trưởng)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="deputy" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-blue-600" />
                      <span>{ROLES.deputy.label} (Phó Ban / Thường trực)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="secretary" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-purple-600" />
                      <span>{ROLES.secretary.label} (Ủy viên Thư ký)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="treasurer" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-amber-600" />
                      <span>{ROLES.treasurer.label} (Ủy viên Thủ quỹ)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-rose-600" />
                      <span>{ROLES.admin.label} (Quản trị viên)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-400">
                Quyền hạn và trách nhiệm sẽ được tự động kích hoạt ngay khi cán bộ đăng nhập lần đầu.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="text-xs"
              disabled={isLoading || Boolean(successMessage)}
            >
              Hủy
            </Button>
            <Button
              id="btn-submit-assign-role"
              type="submit"
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs"
              disabled={isLoading || Boolean(successMessage)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang cấp quyền...
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  Cấp Quyền Cán Bộ
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
