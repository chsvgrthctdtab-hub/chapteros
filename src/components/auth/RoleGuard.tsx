import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { type OrganizationRole, ROLES, hasRole, isOrgAdmin, isOrgBoard } from '@/types/roles';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: OrganizationRole[];
  requireAdmin?: boolean;
  requireBoard?: boolean;
  fallback?: ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  requireAdmin = false,
  requireBoard = false,
  fallback,
}: RoleGuardProps) {
  const { activeRole } = useAuth();
  const navigate = useNavigate();

  let isAllowed = true;

  if (requireAdmin) {
    isAllowed = isOrgAdmin(activeRole);
  } else if (requireBoard) {
    isAllowed = isOrgBoard(activeRole);
  } else if (allowedRoles && allowedRoles.length > 0) {
    isAllowed = hasRole(activeRole, allowedRoles);
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const roleLabel = activeRole ? ROLES[activeRole]?.label : 'Chưa phân quyền';

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-slate-200 bg-white text-center space-y-4 max-w-lg mx-auto my-8 shadow-sm">
      <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-slate-900">Giới hạn quyền truy cập</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tài khoản của bạn hiện có vai trò <strong>{roleLabel}</strong>. Tính năng này yêu cầu quyền quản trị cao hơn (Ban Chấp Hành hoặc Quản trị viên).
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(-1)}
        className="text-xs"
      >
        <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
        Quay lại trang trước
      </Button>
    </div>
  );
}
