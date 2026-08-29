import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { authService } from '@/services/auth.service';
import { GraduationCap, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const STORAGE_ACTIVE_ORG_KEY = 'chapteros_active_org_id';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('Đang xác thực phiên đăng nhập Google...');

  useEffect(() => {
    let isMounted = true;

    async function processAuthCallback() {
      if (!isSupabaseConfigured) {
        if (isMounted) {
          setErrorMessage('Supabase chưa được cấu hình biến môi trường VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
        }
        return;
      }

      // 1. Check if an error was returned in query params from Google / Supabase
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      if (errorParam || errorDescription) {
        if (isMounted) {
          setErrorMessage(errorDescription || errorParam || 'Đã có lỗi xảy ra trong quá trình xác thực Google.');
        }
        return;
      }

      try {
        // 2. Exchange code for session if present (PKCE flow)
        const code = searchParams.get('code');
        let activeUser = null;

        if (code) {
          setStatusText('Đang trao đổi mã xác thực với Supabase Auth...');
          const exchangeResult = await authService.exchangeCodeForSession(code);
          if (exchangeResult.error) {
            throw new Error(exchangeResult.error);
          }
          activeUser = exchangeResult.user;
        }

        // 3. Verify active session
        if (!activeUser) {
          const { session, user } = await authService.getInitialSession();
          if (session && user) {
            activeUser = user;
          }
        }

        if (!activeUser) {
          // Listen briefly for implicit hash token authentication
          activeUser = await new Promise((resolve) => {
            const subscription = authService.subscribeToAuthChanges((_event, newSession) => {
              if (newSession?.user) {
                subscription.unsubscribe();
                resolve(newSession.user);
              }
            });
            setTimeout(() => {
              subscription.unsubscribe();
              resolve(null);
            }, 3000);
          });
        }

        if (!activeUser) {
          throw new Error('Không thể tìm thấy phiên đăng nhập sau khi xác thực.');
        }

        if (!isMounted) return;

        // 4. Trigger claim_pending_roles FIRST to push pre-approved roles from organization_invites to organization_memberships
        setStatusText('Đang tiếp nhận phân quyền Ban Chấp Hành...');
        try {
          const { error: claimError } = await supabase.rpc('claim_pending_roles');
          if (claimError) {
            console.warn('claim_pending_roles notice:', claimError.message);
          }
        } catch (claimErr) {
          console.warn('claim_pending_roles exception (safe fallback):', claimErr);
        }

        // 5. Fetch updated list of organization_memberships for this user
        setStatusText('Đang kiểm tra dữ liệu đơn vị...');
        const memberships = await authService.getUserMemberships(activeUser.id);

        if (!isMounted) return;

        // 6. Navigation Decision based on memberships:
        // - memberships > 0: Chuyển thẳng về Dashboard `/` (Bỏ qua Onboarding)
        // - memberships == 0: Chuyển về màn hình tạo Đơn vị `/onboarding`
        if (memberships && memberships.length > 0) {
          // If only 1 organization, pre-select it
          if (memberships.length === 1) {
            localStorage.setItem(STORAGE_ACTIVE_ORG_KEY, memberships[0].organizationId);
          }
          setStatusText('Đăng nhập thành công! Đang chuyển về Trang Tổng Quan...');
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 300);
        } else {
          setStatusText('Chào mừng bạn! Đang chuyển đến màn hình khởi tạo Đơn vị...');
          setTimeout(() => {
            navigate('/onboarding', { replace: true });
          }, 300);
        }
      } catch (err) {
        console.error('OAuth callback processing error:', err);
        if (isMounted) {
          setErrorMessage((err as Error).message || 'Không thể hoàn tất đăng nhập. Vui lòng thử lại.');
        }
      }
    }

    processAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 text-slate-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs ring-4 ring-indigo-50">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">ChapterOS</h1>
          <p className="text-xs text-slate-500">Nền tảng số Quản trị & Điều hành Đơn vị Sinh viên</p>
        </div>

        <Card className="border border-slate-200/80 shadow-xs rounded-3xl overflow-hidden bg-white">
          <CardContent className="pt-6 pb-6 text-center space-y-4">
            {errorMessage ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 text-left">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Xác thực không thành công</p>
                    <p className="mt-1 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/auth/login', { replace: true })}
                  className="w-full text-xs rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Quay lại trang Đăng nhập
                </Button>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-xs font-medium text-slate-600">{statusText}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
