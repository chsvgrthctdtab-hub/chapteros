import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  ArrowRight,
  Home,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, refreshAuth, setActiveOrganizationId } = useAuth();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const executionRef = useRef(false);

  useEffect(() => {
    // Avoid double execution in React StrictMode
    if (executionRef.current) return;
    executionRef.current = true;

    async function handleAcceptInvitation() {
      if (!token || !token.trim()) {
        setStatus('error');
        setErrorMessage('Mã lời mời không hợp lệ hoặc thiếu thông tin token.');
        return;
      }

      try {
        setStatus('processing');
        setErrorMessage(null);

        // Call Supabase RPC function accept_invitation
        const { data, error } = await (supabase.rpc as any)('accept_invitation', {
          invite_token: token.trim()
        });

        if (error) {
          console.error('Error accepting invitation:', error);
          setStatus('error');

          const errMsg = error.message?.toLowerCase() || '';
          if (errMsg.includes('expired') || errMsg.includes('hết hạn')) {
            setErrorMessage('Liên kết lời mời này đã hết hạn sử dụng. Vui lòng liên hệ Ban Chấp hành để nhận mã mới.');
          } else if (errMsg.includes('already a member') || errMsg.includes('đã là thành viên')) {
            setErrorMessage('Bạn đã là thành viên của Đơn vị này rồi.');
          } else if (errMsg.includes('not found') || errMsg.includes('invalid') || errMsg.includes('không tồn tại')) {
            setErrorMessage('Liên kết lời mời không tồn tại, không hợp lệ hoặc đã bị vô hiệu hóa.');
          } else if (errMsg.includes('revoked') || errMsg.includes('thu hồi')) {
            setErrorMessage('Lời mời này đã bị hủy bỏ bởi Quản trị viên.');
          } else {
            setErrorMessage(error.message || 'Không thể xử lý lời mời tham gia Đơn vị.');
          }
          return;
        }

        // Successfully accepted invitation
        setStatus('success');

        // Refresh authentication and memberships
        await refreshAuth();

        // Extract organization ID from returned data
        const orgId = typeof data === 'string' ? data : (data as { organization_id?: string; id?: string })?.organization_id || (data as { organization_id?: string; id?: string })?.id;
        if (orgId && typeof orgId === 'string') {
          setActiveOrganizationId(orgId);
        }

        // Small timeout for smooth transition feedback
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1200);
      } catch (err) {
        console.error('Unexpected error accepting invite:', err);
        setStatus('error');
        setErrorMessage((err as Error).message || 'Đã có lỗi bất ngờ xảy ra khi xử lý lời mời.');
      }
    }

    handleAcceptInvitation();
  }, [token, refreshAuth, setActiveOrganizationId, navigate]);

  return (
    <div id="accept-invite-page" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-11 w-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xs ring-4 ring-indigo-50">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">ChapterOS</h1>
          <p className="text-xs text-slate-500">Nền tảng số Quản trị & Điều hành Đơn vị Sinh viên</p>
        </div>
      </div>

      <Card className="w-full max-w-md bg-white border border-slate-200/80 shadow-xs rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Processing State */}
        {status === 'processing' && (
          <>
            <CardHeader className="text-center pb-2 pt-8">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Đang xử lý lời mời</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Hệ thống đang xác thực mã và kết nạp bạn vào không gian làm việc...
              </p>
            </CardHeader>
            <CardContent className="text-center py-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/80 text-slate-600 text-xs font-medium">
                <Building2 className="h-3.5 w-3.5" />
                <span>Đang đồng bộ quyền hạn</span>
              </div>
            </CardContent>
          </>
        )}

        {/* Success State */}
        {status === 'success' && (
          <>
            <CardHeader className="text-center pb-2 pt-8">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <CheckCircle2 className="h-8 w-8 animate-bounce" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Gia nhập thành công!</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Chào mừng bạn đã gia nhập Đơn vị. Đang chuyển hướng vào bảng điều khiển...
              </p>
            </CardHeader>
            <CardContent className="text-center py-6 space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 py-2 px-4 rounded-2xl">
                <CheckCircle2 className="h-4 w-4" />
                <span>Quyền thành viên đã được kích hoạt</span>
              </div>
            </CardContent>
          </>
        )}

        {/* Error State */}
        {status === 'error' && (
          <>
            <CardHeader className="text-center pb-2 pt-8">
              <div className="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-600">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Không thể tham gia</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Đã xảy ra sự cố trong quá trình xử lý liên kết lời mời của bạn.
              </p>
            </CardHeader>

            <CardContent className="py-4">
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 space-y-1">
                  <p className="font-semibold">Chi tiết thông báo:</p>
                  <p className="text-rose-800 leading-relaxed">
                    {errorMessage || 'Liên kết lời mời không hợp lệ hoặc đã hết hạn.'}
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2 pb-6 px-6">
              <Button
                id="btn-return-home"
                variant="outline"
                className="w-full text-xs font-medium gap-1.5 rounded-xl cursor-pointer"
                onClick={() => navigate('/')}
              >
                <Home className="h-3.5 w-3.5" />
                Về trang chủ
              </Button>

              <Button
                id="btn-goto-workspaces"
                className="w-full text-xs font-medium gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer"
                onClick={() => navigate('/workspaces')}
              >
                <Building2 className="h-3.5 w-3.5" />
                Danh sách Đơn vị
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </>
        )}
      </Card>

      {/* Footer Info */}
      <footer className="mt-8 text-center text-xs text-slate-400 font-medium">
        Đăng nhập với tài khoản: <span className="font-semibold text-slate-600">{user?.email || 'N/A'}</span>
      </footer>
    </div>
  );
}
