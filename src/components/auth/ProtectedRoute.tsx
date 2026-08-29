import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children?: ReactNode;
  allowNoOrganization?: boolean;
}

export function ProtectedRoute({ children, allowNoOrganization = false }: ProtectedRouteProps) {
  const { user, memberships, activeOrganization, isLoading, isSyncingMemberships, isSupabaseConfigured } = useAuth();
  const location = useLocation();

  // Chốt chặn 1: Trong lúc isLoading hoặc đang đồng bộ memberships, luôn giữ màn hình Loading
  if (isLoading || (user && isSyncingMemberships && (!memberships || memberships.length === 0))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-700 p-4">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 text-white shadow-lg">
            <GraduationCap className="h-9 w-9 animate-pulse" />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900">ChapterOS</h3>
            <p className="text-xs text-slate-500">Đang kiểm tra quyền truy cập & đồng bộ tổ chức...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured) return children ? <>{children}</> : <Outlet />;

  // GATE 1: Chưa đăng nhập -> Văng ra Login
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  const hasMemberships = memberships && memberships.length > 0;

  // GATE 2: TÀI KHOẢN TRẮNG (0 Tổ chức) -> Chỉ cho phép ở /onboarding hoặc route có allowNoOrganization (ví dụ /invite/:token)
  if (!hasMemberships) {
    if (allowNoOrganization || location.pathname === '/onboarding') {
      return children ? <>{children}</> : <Outlet />;
    }
    return <Navigate to="/onboarding" replace />;
  }

  // GATE 3: TÀI KHOẢN ĐÃ CÓ TỔ CHỨC
  if (hasMemberships) {
    // 3.1: Có > 1 tổ chức nhưng CHƯA CHỌN -> Bắt buộc ra Workspaces (chặn /onboarding, trừ route allowNoOrganization như /invite/:token)
    if (!allowNoOrganization && memberships.length > 1 && !activeOrganization && location.pathname !== '/workspaces') {
      // Nếu cố tình gõ /onboarding, sau khi chọn xong workspace sẽ trả về trang chủ thay vì quay lại onboarding
      const returnTo = location.pathname === '/onboarding' ? '/' : location.pathname;
      return <Navigate to="/workspaces" state={{ returnTo }} replace />;
    }

    // 3.2: Đã có tổ chức, cố tình gõ URL /onboarding nhưng ko có activeOrganization 
    // (Trường hợp 1 tổ chức nhưng load chậm)
    if (location.pathname === '/onboarding' && !activeOrganization) {
        return <Navigate to="/" replace />;
    }
  }

  // GATE 4: Hợp lệ -> Vào App
  return children ? <>{children}</> : <Outlet />;
}
