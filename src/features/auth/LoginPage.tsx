import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  GraduationCap, 
  ShieldCheck, 
  AlertCircle, 
  Loader2,
  Database,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoginPage() {
  const { 
    user, 
    signInWithGoogle, 
    isSupabaseConfigured,
    isLoading: isAuthLoading 
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to intended target
  useEffect(() => {
    if (user && !isAuthLoading) {
      navigate(from, { replace: true });
    }
  }, [user, isAuthLoading, navigate, from]);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(error);
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center p-4 sm:p-6 bg-slate-50/80 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div />

      {/* Main Material 3 Minimal Container */}
      <main className="w-full max-w-md my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xs space-y-8">
          {/* Brand header */}
          <div className="text-center space-y-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-50">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">ChapterOS</h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Nền tảng vận hành và quản trị số dành cho Ban Chấp Hành các Đơn vị sinh viên
              </p>
            </div>
          </div>

          {/* Database Missing Warning Banner */}
          {!isSupabaseConfigured && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                <Database className="h-4 w-4 shrink-0" />
                <span>Chưa cấu hình Supabase Auth</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Vui lòng cấu hình <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_ANON_KEY</code> trong môi trường để kích hoạt đăng nhập Google.
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Google Sign-in Area */}
          <div className="space-y-4 pt-1">
            <Button
              id="btn-google-login"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full h-12 text-sm font-semibold rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? 'Đang xác thực Google...' : 'Đăng nhập với Google'}</span>
            </Button>

            <p className="text-[11px] text-center text-slate-400 leading-relaxed px-4">
              Sử dụng tài khoản Google trường hoặc email cá nhân để truy cập không gian làm việc.
            </p>
          </div>

          {/* Security Footnote */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Bảo mật qua Google OAuth & Supabase RLS</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-sm text-center py-4 text-[11px] text-slate-400 font-medium space-y-1">
        <p>&copy; {new Date().getFullYear()} ChapterOS. All rights reserved.</p>
        <p className="text-slate-400">Phát triển bởi <span className="text-slate-600 font-semibold">tienthuan_0909</span></p>
      </footer>
    </div>
  );
}
