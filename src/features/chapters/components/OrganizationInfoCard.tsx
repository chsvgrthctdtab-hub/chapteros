import { useState, useEffect, useRef, type FormEvent, type ChangeEvent, type DragEvent } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Building2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  Calendar,
  Hash,
  Upload,
  RefreshCw,
  Trash2,
  ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getOrgTypeLabel, getOrgTypeBadgeClass, ORGANIZATION_TYPE_OPTIONS } from '@/lib/organization.utils';
import { getRoleLabel } from '@/types/roles';
import type { Organization, OrganizationRole, MembershipStatus, OrganizationType } from '@/types';

interface OrganizationInfoCardProps {
  organization: Organization | null;
  activeRole: OrganizationRole | null;
  membership?: { role?: OrganizationRole; status?: MembershipStatus } | null;
  canManageLogo?: boolean;
  onSave: (payload: {
    name: string;
    code: string;
    description: string | null;
    logo_url: string | null;
    type?: OrganizationType;
  }) => Promise<void>;
  onUploadLogo: (file: File) => Promise<void>;
  onDeleteLogo: () => Promise<void>;
  isLoading?: boolean;
  isUploadingLogo?: boolean;
  isDeletingLogo?: boolean;
}

export function OrganizationInfoCard({
  organization,
  activeRole,
  membership,
  canManageLogo = false,
  onSave,
  onUploadLogo,
  onDeleteLogo,
  isLoading = false,
  isUploadingLogo = false,
  isDeletingLogo = false,
}: OrganizationInfoCardProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(organization?.name || '');
  const [code, setCode] = useState(organization?.code || '');
  const [type, setType] = useState<OrganizationType>(organization?.type || 'chi_hoi');
  const [description, setDescription] = useState(organization?.description || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSuccess, setLogoSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (organization) {
      setName(organization.name || '');
      setCode(organization.code || '');
      setType(organization.type || 'chi_hoi');
      setDescription(organization.description || '');
      setLocalPreviewUrl(null);
    }
  }, [organization]);

  const orgTypeLabel = getOrgTypeLabel(organization?.type);
  const orgTypeBadgeClass = getOrgTypeBadgeClass(organization?.type);

  // Clean up any local preview blob on unmount
  useEffect(() => {
    return () => {
      if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const handleTriggerFileInput = () => {
    if (isUploadingLogo || isDeletingLogo) return;
    setLogoError(null);
    fileInputRef.current?.click();
  };

  const handleValidateAndUpload = async (file: File) => {
    setLogoError(null);
    setLogoSuccess(null);

    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (file.size > MAX_FILE_SIZE) {
      setLogoError('Kích thước logo vượt quá giới hạn 2 MB.');
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setLogoError('Định dạng logo không được hỗ trợ. Vui lòng chọn PNG, JPG hoặc WebP.');
      return;
    }

    // Show temporary local preview while uploading
    const previewBlobUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(previewBlobUrl);

    try {
      await onUploadLogo(file);
      setLogoSuccess(`Cập nhật biểu trưng ${orgTypeLabel} thành công!`);
      setTimeout(() => setLogoSuccess(null), 4000);
    } catch (err) {
      setLocalPreviewUrl(null);
      setLogoError((err as Error).message || 'Không thể tải ảnh biểu trưng lên. Vui lòng thử lại.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleValidateAndUpload(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isUploadingLogo || isDeletingLogo) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploadingLogo || isDeletingLogo) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleValidateAndUpload(file);
    }
  };

  const handleDeleteLogoClick = async () => {
    if (isUploadingLogo || isDeletingLogo) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa biểu trưng hiện tại của ${orgTypeLabel}?`)) return;

    setLogoError(null);
    setLogoSuccess(null);

    try {
      await onDeleteLogo();
      setLocalPreviewUrl(null);
      setLogoSuccess(`Đã xóa biểu trưng ${orgTypeLabel}.`);
      setTimeout(() => setLogoSuccess(null), 3000);
    } catch (err) {
      setLogoError((err as Error).message || 'Không thể xóa biểu trưng. Vui lòng thử lại.');
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canManageLogo) return;

    setErrorMessage(null);
    setSaveSuccess(false);

    if (!name.trim()) {
      setErrorMessage(`Tên ${orgTypeLabel} không được để trống.`);
      return;
    }
    if (!code.trim()) {
      setErrorMessage(`Mã ${orgTypeLabel} không được để trống.`);
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type,
        description: description.trim() || null,
        logo_url: organization?.logoUrl || null,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setErrorMessage((err as Error).message || `Không thể lưu thông tin ${orgTypeLabel}.`);
    }
  };

  const currentDisplayLogo = localPreviewUrl || organization?.logoUrl;

  const formattedCreatedDate = organization?.createdAt
    ? new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(organization.createdAt))
    : 'Chưa có';

  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader className="border-b border-slate-100 bg-slate-50/40 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs overflow-hidden shrink-0 border border-blue-500">
              {currentDisplayLogo ? (
                <img
                  src={currentDisplayLogo}
                  alt="Logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${orgTypeBadgeClass}`}>
                  {orgTypeLabel}
                </span>
                <CardTitle className="text-base font-bold text-slate-900">
                  {organization?.name || `Thông tin ${orgTypeLabel}`}
                </CardTitle>
                <Badge variant="outline" className="font-mono text-[11px] bg-white text-slate-700">
                  {organization?.code || 'N/A'}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Hồ sơ định danh, loại hình, biểu trưng chính thức và thông tin cấu hình đơn vị
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoading && !canManageLogo ? (
              <Badge variant="outline" className="text-xs text-slate-500 gap-1 py-1 px-2.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang kiểm tra quyền...
              </Badge>
            ) : canManageLogo ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1 py-1 px-2.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Quyền Quản trị viên
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs text-slate-600 gap-1 py-1 px-2.5">
                <Lock className="h-3.5 w-3.5" />
                Chỉ xem ({activeRole ? getRoleLabel(activeRole) : 'Chưa phân quyền'})
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Alerts & Notifications */}
        {saveSuccess && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Cập nhật thông tin {orgTypeLabel} thành công!</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {logoSuccess && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{logoSuccess}</span>
          </div>
        )}

        {logoError && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{logoError}</span>
          </div>
        )}

        {!canManageLogo && !isLoading && (
          <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <Lock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              Bạn đang đăng nhập với vai trò hội viên. Chỉ Quản trị viên (Admin / Ban chấp hành) mới có quyền chỉnh sửa thông tin hồ sơ và biểu trưng đơn vị.
            </span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* LOGO STORAGE UPLOAD SECTION */}
        {/* ------------------------------------------------------------- */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-blue-600" />
                Biểu trưng {orgTypeLabel} (Logo)
              </label>
              <p className="text-[11px] text-slate-500">
                Hình ảnh đại diện lưu trữ bảo mật trên Supabase Storage
              </p>
            </div>
            {currentDisplayLogo && (
              <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
                Đã có biểu trưng
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
            {/* Square Responsive Logo Container */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={!currentDisplayLogo ? handleTriggerFileInput : undefined}
              className={`relative h-28 w-28 sm:h-32 sm:w-32 rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center text-center transition-all shrink-0 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                  : 'border-dashed border-slate-300 bg-white hover:border-slate-400'
              } ${!currentDisplayLogo ? 'cursor-pointer' : ''}`}
            >
              {isUploadingLogo || isDeletingLogo ? (
                <div className="flex flex-col items-center justify-center p-2 text-slate-500 space-y-1">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="text-[10px] font-medium text-slate-600">
                    {isUploadingLogo ? 'Đang tải lên...' : 'Đang xóa...'}
                  </span>
                </div>
              ) : currentDisplayLogo ? (
                <img
                  src={currentDisplayLogo}
                  alt={`Biểu trưng ${orgTypeLabel}`}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-3 text-slate-400 space-y-1">
                  <Building2 className="h-7 w-7 text-slate-300" />
                  <span className="text-[11px] font-medium text-slate-500 leading-tight">
                    Chưa có biểu trưng
                  </span>
                </div>
              )}
            </div>

            {/* Logo Actions and Guidance */}
            <div className="space-y-2.5 flex-1 min-w-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isUploadingLogo || isDeletingLogo}
              />

              {(canManageLogo || isLoading || activeRole === 'admin' || activeRole === 'leader') && (
                <div className="flex flex-wrap items-center gap-2">
                  {currentDisplayLogo ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleTriggerFileInput}
                        disabled={isUploadingLogo || isDeletingLogo}
                        className="text-xs h-8 text-slate-700 hover:bg-slate-100"
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-blue-600" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                        )}
                        Đổi ảnh
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleDeleteLogoClick}
                        disabled={isUploadingLogo || isDeletingLogo}
                        className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                      >
                        {isDeletingLogo ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Xóa
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleTriggerFileInput}
                      disabled={isUploadingLogo || isDeletingLogo}
                      className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Tải ảnh lên
                    </Button>
                  )}
                </div>
              )}

              <div className="text-[11px] text-slate-500 space-y-0.5 leading-relaxed">
                <p>
                  <strong>Định dạng hỗ trợ:</strong> PNG, JPG, WebP.
                </p>
                <p>
                  <strong>Dung lượng tối đa:</strong> 2 MB (khuyến nghị dùng hình vuông tỉ lệ 1:1, tối thiểu 256×256px).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* BASIC INFO FORM */}
        {/* ------------------------------------------------------------- */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                Loại hình đơn vị <span className="text-rose-500">*</span>
              </label>
              <Select
                value={type}
                onValueChange={(val) => setType(val as OrganizationType)}
                disabled={!canManageLogo || isLoading}
              >
                <SelectTrigger className="w-full h-9 rounded-md border-slate-200 bg-white text-xs text-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[10px] text-slate-400">1 trong 4 loại hình chuẩn</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                Tên {orgTypeLabel} <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Ví dụ: ${orgTypeLabel} Sinh viên Kiên Giang`}
                disabled={!canManageLogo || isLoading}
                className="text-xs h-9"
                required
              />
              <span className="text-[10px] text-slate-400">Tên chính thức dùng trong văn bản, báo cáo</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                Mã định danh (Code) <span className="text-rose-500">*</span>
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ví dụ: CH-KG-2024"
                disabled={!canManageLogo || isLoading}
                className="text-xs font-mono h-9"
                required
              />
              <span className="text-[10px] text-slate-400">Mã viết hoa duy nhất dùng để phân loại</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Mô tả / Đơn vị trực thuộc</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Trực thuộc Liên chi hội sinh viên ĐH Cần Thơ..."
              disabled={!canManageLogo || isLoading}
              rows={3}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* Readonly Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center gap-2.5 text-xs text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-400 block">Ngày khởi tạo trên hệ thống</span>
                <span className="font-medium text-slate-800">{formattedCreatedDate}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center gap-2.5 text-xs text-slate-600">
              <Hash className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-400 block">Organization ID</span>
                <span className="font-mono text-[11px] text-slate-700 truncate max-w-[180px] block">
                  {organization?.id || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {canManageLogo && (
            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isLoading ? 'Đang lưu...' : `Lưu thông tin ${orgTypeLabel}`}
              </Button>
            </div>
          )}
        </form>
      </CardContent>

      <CardFooter className="bg-slate-50/50 border-t border-slate-100 py-3 text-xs text-slate-500 justify-between">
        <span>Bảo mật dữ liệu và tài nguyên hình ảnh cách ly theo từng đơn vị sinh viên</span>
        <span className="text-[11px] text-slate-400">Supabase Storage & RLS Active</span>
      </CardFooter>
    </Card>
  );
}
