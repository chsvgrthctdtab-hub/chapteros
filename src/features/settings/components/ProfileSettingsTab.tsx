import React, { useState, useEffect, type FormEvent } from 'react';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Building2,
  Key,
  Shield,
  Languages,
  Check,
  Globe,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { authService } from '@/services/auth.service';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { memberKeys } from '@/features/members/queries/member.queries';
import { ROLES } from '@/types/roles';
import { useNavigate } from 'react-router-dom';

export function ProfileSettingsTab() {
  const { user, profile, activeOrganization, activeRole, signOut, refreshAuth } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [studentId, setStudentId] = useState(profile?.studentId || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setStudentId(profile.studentId || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const roleInfo = activeRole ? ROLES[activeRole] : null;

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      if (isSupabaseConfigured) {
        await authService.updateProfile(user.id, {
          fullName: fullName.trim(),
          studentId: studentId.trim() ? studentId.trim().toUpperCase() : null,
          phone: phone.trim() || null,
        });

        await refreshAuth();
        queryClient.invalidateQueries({ queryKey: memberKeys.all });
      }
      setSaveSuccess(true);
      toast.success('Cập nhật thông tin cá nhân thành công.');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      toast.error(err);
      setSaveError((err as Error).message || 'Không thể cập nhật thông tin.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div id="settings-profile-tab" className="space-y-6">
      {/* Account Overview Header Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-emerald-100/70 border border-emerald-200/80 text-emerald-800 flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs">
              {profile?.fullName
                ? profile.fullName
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(-2)
                    .join('')
                    .toUpperCase()
                : 'CH'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="success" className="text-[10px] px-2 py-0.5">
                  Xác thực thành công
                </Badge>
                {roleInfo && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${roleInfo.colorClasses.bg} ${roleInfo.colorClasses.text} ${roleInfo.colorClasses.border}`}
                  >
                    {roleInfo.label}
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {profile?.fullName || user?.email || 'Người dùng ChapterOS'}
              </h3>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {user?.email || 'Chưa có email'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 cursor-pointer self-start sm:self-center font-medium"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Đăng xuất
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600" />
            Thông tin Cá nhân & Hồ sơ Sinh viên
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Thông tin định danh liên kết với tài khoản xác thực Supabase Auth và hồ sơ Ban Chấp Hành
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleUpdateProfile}>
          <CardContent className="pt-5 space-y-4">
            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Cập nhật thông tin hồ sơ cá nhân thành công!</span>
              </div>
            )}
            {saveError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                  Mã số sinh viên (MSSV)
                </label>
                <Input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                  placeholder="B2100000"
                  className="text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Email tài khoản
                </label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-50 text-slate-500 font-mono text-xs cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400">Email quản lý bởi hệ thống Auth</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  Số điện thoại
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Active Org context notice */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2 mt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Chi hội đang hoạt động:
                </span>
                <span className="font-bold text-slate-800">
                  {activeOrganization
                    ? `${activeOrganization.name} (${activeOrganization.code})`
                    : 'Chưa chọn'}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  Vai trò quản lý:
                </span>
                <span className="font-semibold text-slate-700">
                  {roleInfo?.label || 'Chưa phân quyền'}
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-slate-50/70 border-t border-slate-100 flex items-center justify-between py-3 px-5">
            <span className="text-[11px] text-slate-500 font-mono">
              ID: <code className="text-slate-700">{user?.id || 'demo-user'}</code>
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs font-medium"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isSaving ? 'Đang lưu...' : 'Lưu hồ sơ cá nhân'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Language Preferences Card */}
      <Card className="border-slate-200/90 shadow-2xs bg-white">
        <CardHeader className="p-5 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Languages className="h-4 w-4 text-emerald-600" />
                {t('language.title', 'Ngôn ngữ hiển thị (Display Language)')}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {t('language.description', 'Chọn ngôn ngữ giao diện cho ChapterOS (Tiếng Việt / English).')}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-2xs font-mono">
              {language.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Vietnamese Option */}
            <button
              type="button"
              onClick={() => {
                setLanguage('vi');
                toast.success('Đã chuyển ngôn ngữ sang Tiếng Việt');
              }}
              className={`p-4 rounded-xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                language === 'vi'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-600/30'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🇻🇳</span>
                  <span className="text-sm font-bold text-slate-900">Tiếng Việt</span>
                </div>
                <p className="text-2xs text-slate-500 leading-relaxed">
                  Giao diện chuẩn tiếng Việt cho Ban Chấp Hành và hoạt động Hội Sinh viên.
                </p>
              </div>
              {language === 'vi' && (
                <div className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>

            {/* English Option */}
            <button
              type="button"
              onClick={() => {
                setLanguage('en');
                toast.success('Language changed to English');
              }}
              className={`p-4 rounded-xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                language === 'en'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-600/30'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🇬🇧</span>
                  <span className="text-sm font-bold text-slate-900">English</span>
                </div>
                <p className="text-2xs text-slate-500 leading-relaxed">
                  International executive interface with English labels and navigation.
                </p>
              </div>
              {language === 'en' && (
                <div className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
