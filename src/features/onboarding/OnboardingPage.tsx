import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  RefreshCw, 
  LogOut, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  Mail,
  Shield,
  ArrowRight,
  Building2,
  Sparkles,
  Layers,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  getOrgTypeShort, 
  getOrgTypeFullName, 
  generateOrganizationCode,
  ORGANIZATION_TYPE_OPTIONS 
} from '@/lib/organization.utils';

export function OnboardingPage() {
  const { user, profile, createOrganization, signOut, memberships } = useAuth();
  const navigate = useNavigate();

  const [orgType, setOrgType] = useState<string>('chi_hoi');
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState(() => generateOrganizationCode('chi_hoi'));
  const [orgDescription, setOrgDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-redirect to dashboard if user has active organization
  useEffect(() => {
    if (memberships && memberships.length > 0) {
      navigate('/', { replace: true });
    }
  }, [memberships, navigate]);

  // Auto-generate code when orgType changes
  const handleTypeChange = (newType: string) => {
    setOrgType(newType);
    setOrgCode(generateOrganizationCode(newType));
  };

  const handleRegenerateCode = () => {
    setOrgCode(generateOrganizationCode(orgType));
  };

  const hasExistingOrg = memberships && memberships.length > 0;
  const currentTypeShort = getOrgTypeShort(orgType);
  const currentTypeFullName = getOrgTypeFullName(orgType);

  const handleCreateOrg = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!user) {
      setErrorMessage('Bạn phải đăng nhập để tạo đơn vị.');
      return;
    }

    if (!orgName.trim()) {
      setErrorMessage(`Vui lòng nhập tên ${currentTypeFullName}.`);
      return;
    }
    if (!orgCode.trim()) {
      setErrorMessage(`Vui lòng nhập mã định danh ${currentTypeFullName} (ví dụ: ${currentTypeShort}-XYZ12).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const finalCode = orgCode.trim().toUpperCase();
      const result = await createOrganization(
        orgName.trim(), 
        finalCode, 
        orgDescription.trim() || undefined,
        orgType
      );

      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setSuccessMessage(`Đã khởi tạo thành công ${currentTypeFullName} "${orgName.trim()}"!`);
        setTimeout(() => {
          navigate('/');
        }, 800);
      }
    } catch (err) {
      console.error('Organization creation error:', err);
      setErrorMessage((err as Error).message || 'Đã có lỗi xảy ra khi khởi tạo đơn vị.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div id="onboarding-page" className="min-h-screen bg-slate-50/80 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
      {/* Top Header Bar */}
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between py-2 border-b border-slate-200/80 mb-6 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0 ring-4 ring-indigo-50">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 leading-tight truncate">ChapterOS</h1>
            <span className="text-[11px] text-slate-500 block truncate">Khởi tạo Không gian Quản trị</span>
          </div>
        </div>

        <Button
          id="onboarding-signout-btn"
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl gap-1.5 shrink-0 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Đăng xuất
        </Button>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full my-auto space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* User Identity Chip */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900 break-words truncate">
                  {profile?.fullName || user?.email?.split('@')[0] || 'Người dùng'}
                </h2>
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 shrink-0 rounded-md">
                  Đã xác thực Google
                </Badge>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 break-all">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </p>
            </div>
          </div>

          {hasExistingOrg && (
            <Button
              id="onboarding-goto-workspace-btn"
              size="sm"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-xl shrink-0 font-medium cursor-pointer"
            >
              Vào không gian hiện có
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          )}
        </div>

        {/* Organization Creation Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 sm:p-8 pb-4 sm:pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Thiết lập Đơn vị mới</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tạo không gian làm việc để quản lý hội viên, hoạt động và sổ quỹ thu chi.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Feedback Notifications */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="flex-1 leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                <span className="flex-1 leading-relaxed">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrg} className="space-y-5">
              {/* Material 3 Choice Chips for Organization Types */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-indigo-600" />
                  Loại hình đơn vị <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ORGANIZATION_TYPE_OPTIONS.map((opt) => {
                    const isSelected = orgType === opt.value;
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => handleTypeChange(opt.value)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-950'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50/80 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold">{opt.label}</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                              isSelected ? 'bg-indigo-200/70 text-indigo-900' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {opt.shortLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug line-clamp-1">{opt.description}</p>
                        </div>
                        {isSelected && (
                          <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Organization Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Tên {currentTypeFullName} <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="onboarding-org-name-input"
                  placeholder={`Ví dụ: ${currentTypeFullName} Sinh viên K47`}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="text-xs py-2 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white"
                  required
                />
              </div>

              {/* Organization Code with Auto-generation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Mã định danh (Code) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="text-[11px] text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Sparkles className="h-3 w-3" />
                    Tạo mã ngẫu nhiên
                  </button>
                </div>
                <Input
                  id="onboarding-org-code-input"
                  placeholder={`Ví dụ: ${currentTypeShort}-XYZ12`}
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                  className="text-xs font-mono uppercase font-bold py-2 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white tracking-wider"
                  required
                />
              </div>

              {/* Description / Parent unit */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Mô tả / Đơn vị trực thuộc cấp trên (Không bắt buộc)
                </label>
                <Input
                  id="onboarding-org-description-input"
                  placeholder="Ví dụ: Trực thuộc Liên chi hội Khoa Công nghệ Thông tin"
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  className="text-xs py-2 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>

              {/* Privilege Info Box */}
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
                <Shield className="h-4 w-4 shrink-0 mt-0.5 text-indigo-600" />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="font-semibold text-indigo-950">Quyền Quản trị viên (Admin) tự động</p>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    Bạn sẽ tự động nhận vai trò <strong>Admin</strong> của {currentTypeFullName} để toàn quyền phân công vai trò, quản lý thành viên và theo dõi ngân quỹ.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                id="onboarding-submit-create-btn"
                type="submit"
                className="w-full text-xs h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs hover:shadow-sm transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Đang khởi tạo {currentTypeFullName}...
                  </span>
                ) : (
                  `Hoàn tất & Tạo ${currentTypeFullName}`
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto w-full text-center py-4 text-[11px] text-slate-400 font-medium">
        &copy; {new Date().getFullYear()} ChapterOS — Nền tảng số Quản trị & Điều hành Đơn vị Sinh viên
      </footer>
    </div>
  );
}

